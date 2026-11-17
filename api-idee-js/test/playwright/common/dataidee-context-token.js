import { test, expect } from '@playwright/test';

const ROOT = 'https://dataidee-context.test';
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'Authorization',
  'access-control-allow-methods': 'GET, OPTIONS',
};

const routeService = async (page) => {
  const state = { invalid: false };
  const requests = [];
  await page.route(`${ROOT}/**`, (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const url = new URL(request.url());
    const contextTokens = url.searchParams.getAll('contextToken');
    requests.push({ url, contextTokens, authorization: request.headers().authorization });
    if (state.invalid) {
      return route.fulfill({ headers: CORS, contentType: 'application/geo+json', body: '{"type":"Unknown"}' });
    }
    return route.fulfill({
      headers: CORS,
      contentType: 'application/geo+json',
      body: JSON.stringify({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          id: contextTokens[0] || 'none',
          geometry: { type: 'Point', coordinates: [-6, 37.4] },
          properties: {},
        }],
      }),
    });
  });
  return { state, requests };
};

const openMap = (page, pagePath) => page.goto(pagePath).then(() => page.evaluate((isCesium) => {
  if (isCesium) {
    IDEE.config.baseLayer = [];
    IDEE.config.terrain.default = [];
  }
  window.map = IDEE.map({ container: 'map' });
  window.contextErrors = [];
  window.contextLoads = 0;
}, pagePath.includes('/cesium/')));

const featureIds = (page) => page.evaluate(() => window.contextLayer.getFeatures()
  .map((feature) => feature.getId()));

const LOAD_TIMEOUT = { timeout: 20000 };

const waitForIds = (page, ids) => expect.poll(() => featureIds(page), LOAD_TIMEOUT).toEqual(ids);

const withoutContext = ({ url }) => {
  const target = new URL(url);
  target.searchParams.delete('contextToken');
  return target.href;
};

const contextTest = (title, body) => test(title, async ({ page }) => {
  test.setTimeout(90000);
  await body({ page });
});

export default function registerDataIDEEContextTokenTests(pagePath) {
  contextTest('DataIDEE sends contextToken once next to getFeature.token, never exposes it and setContextToken reloads without the cache', async ({ page }) => {
    const consoleTexts = [];
    page.on('console', (message) => consoleTexts.push(message.text()));
    const { state, requests } = await routeService(page);
    await openMap(page, pagePath);
    await page.evaluate((root) => {
      window.contextLayer = new IDEE.layer.DataIDEE({ url: `${root}/`, name: 'places' }, { cache: true }, {
        getFeature: { token: 'auth' }, tokenLocation: 'query', contextToken: 'ctx-a',
      });
      window.contextLayer.on(IDEE.evt.LOAD_ERROR, (error) => {
        window.contextErrors.push(`${error?.message} ${JSON.stringify(error)}`);
      });
      window.map.addLayers(window.contextLayer);
    }, ROOT);
    await waitForIds(page, ['ctx-a']);
    expect(requests[0].contextTokens).toEqual(['ctx-a']);
    expect(requests[0].url.searchParams.get('token')).toBe('auth');
    expect(requests[0].authorization).toBeUndefined();
    expect(await page.evaluate(() => window.contextLayer.getContextToken())).toBe('ctx-a');
    const rest = await page.evaluate(() => String(window.contextLayer.getRestLayer()));
    expect(rest).not.toContain('ctx-a');
    expect(rest).not.toContain('contextToken');

    await page.evaluate((root) => {
      window.map.addLayers({
        type: 'DataIDEE',
        url: `${root}/`,
        name: 'literal',
        id: 'item-1',
        vendorOptions: { getFeature: { token: 'auth' }, contextToken: 'ctx-literal' },
      });
    }, ROOT);
    const literalRequest = () => requests.find((request) => request.url.pathname.includes('/literal/items/item-1'));
    await expect.poll(literalRequest, LOAD_TIMEOUT).toBeTruthy();
    expect(literalRequest().contextTokens).toEqual(['ctx-literal']);
    expect(literalRequest().authorization).toBe('Bearer auth');
    expect(literalRequest().url.searchParams.has('token')).toBe(false);

    await page.evaluate(() => window.contextLayer.setContextToken('ctx-b'));
    await waitForIds(page, ['ctx-b']);
    expect(requests.at(-1).contextTokens).toEqual(['ctx-b']);
    expect(withoutContext(requests.at(-1))).toBe(withoutContext(requests[0]));

    state.invalid = true;
    await page.evaluate(() => window.contextLayer.setContextToken(() => 'ctx-secret'));
    await expect.poll(() => page.evaluate(() => window.contextErrors.length), LOAD_TIMEOUT).toBe(1);
    expect(requests.at(-1).contextTokens).toEqual(['ctx-secret']);
    await expect(page.locator('div.m-toast.error')).toHaveCount(1);
    expect(await page.locator('div.m-toast.error').innerText()).not.toContain('ctx-secret');

    const networkRequests = requests.length;
    await page.evaluate(() => window.contextLayer.setContextToken(() => Promise.reject(new Error('provider-detail'))));
    await expect.poll(() => page.evaluate(() => window.contextErrors.length), LOAD_TIMEOUT).toBe(2);
    expect(requests).toHaveLength(networkRequests);
    const failed = await page.evaluate(() => IDEE.language.getValue('exception').dataidee_context_token_failed);
    const errors = await page.evaluate(() => window.contextErrors);
    expect(errors[1]).toContain(failed);
    expect(await page.evaluate(() => window.contextLayer.getContextToken()
      .then(() => '', (error) => error.message))).toBe(failed);

    state.invalid = false;
    await page.evaluate(() => window.contextLayer.setContextToken(''));
    await waitForIds(page, ['none']);
    expect(requests.at(-1).contextTokens).toEqual([]);
    expect(await page.evaluate(() => window.contextLayer.getContextToken())).toBeUndefined();

    const secrets = ['ctx-a', 'ctx-b', 'ctx-literal', 'ctx-secret', 'provider-detail'];
    [...errors, ...consoleTexts].forEach((text) => {
      secrets.forEach((secret) => expect(text).not.toContain(secret));
    });
  });

  contextTest('DataIDEE resolves a rotating contextToken only for network requests, sharing cache hits and in-flight duplicates', async ({ page }) => {
    const { requests } = await routeService(page);
    await openMap(page, pagePath);
    await page.evaluate((root) => {
      window.contextCalls = 0;
      window.contextLayer = new IDEE.layer.DataIDEE({ url: `${root}/`, name: 'places' }, { cache: true }, {
        contextToken: () => {
          window.contextCalls += 1;
          return Promise.resolve(`ctx-${window.contextCalls}`);
        },
      });
      window.contextLayer.on(IDEE.evt.LOAD, () => { window.contextLoads += 1; });
      window.map.addLayers(window.contextLayer);
    }, ROOT);
    await waitForIds(page, ['ctx-1']);
    const loads = await page.evaluate(() => window.contextLoads);

    await page.evaluate(() => window.contextLayer.getImpl().refresh());
    await expect.poll(() => page.evaluate(() => window.contextLoads), LOAD_TIMEOUT).toBe(loads + 1);
    expect(requests).toHaveLength(1);
    expect(await page.evaluate(() => window.contextCalls)).toBe(1);

    await page.evaluate(() => {
      window.contextLayer.clearCache();
      window.contextLayer.getImpl().refresh();
      window.contextLayer.getImpl().refresh();
    });
    await waitForIds(page, ['ctx-2']);
    await expect.poll(() => page.evaluate(() => window.contextLoads), LOAD_TIMEOUT).toBe(loads + 2);
    expect(requests.map((request) => request.contextTokens)).toEqual([['ctx-1'], ['ctx-2']]);
    expect(withoutContext(requests[1])).toBe(withoutContext(requests[0]));
    expect(await page.evaluate(() => window.contextCalls)).toBe(2);
  });
}
