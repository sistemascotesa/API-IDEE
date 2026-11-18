import { test, expect } from '@playwright/test';

/*
 * Capa Tiles3D en Cesium: fuentes por URL (cabeceras, parámetros de consulta y ticket solo
 * hacia el origen del tileset) y Cesium ion, errores de carga sin datos de acceso y
 * retirada de la capa mientras se carga. Los servicios se simulan con hosts *.test.
 */
const PAGE = '/test/playwright/cesium/basic-cesium.html';
const HOST = 'https://tiles3d.cesium.test';
const OTHER = 'https://otro.tiles3d.test';
const ION = 'https://ion.tiles3d.test';
const ASSETS = 'https://assets.tiles3d.test';
const WAIT = { timeout: 25000 };
const HEADER_SECRET = 'cabecera-secreta';
const QUERY_SECRET = 'query-secreta';
const TICKET_SECRET = 'ticket-secreto';
const ION_SECRET = 'ion-secreto';
const SECRETS = [HEADER_SECRET, QUERY_SECRET, TICKET_SECRET, ION_SECRET];

const REGION = [-0.0657, 0.7049, -0.0644, 0.7058, 0, 100];
const leafTileset = () => ({
  asset: { version: '1.0' },
  geometricError: 0,
  root: { boundingVolume: { region: REGION }, geometricError: 0, refine: 'ADD' },
});
const parentTileset = (uris) => ({
  asset: { version: '1.0' },
  geometricError: 1000000,
  root: {
    boundingVolume: { region: REGION },
    geometricError: 1000000,
    refine: 'ADD',
    children: uris.map((uri) => ({
      boundingVolume: { region: REGION }, geometricError: 0, content: { uri },
    })),
  },
});

const cors = (request) => ({
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': request.headers()['access-control-request-headers'] || '*',
});

/** Simula un host: registra las peticiones GET y responde con el JSON de cada ruta. */
const routeHost = async (page, origin, respond) => {
  const requests = [];
  await page.route(`${origin}/**`, async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors(request) });
    const url = new URL(request.url());
    requests.push({ url, headers: request.headers() });
    const body = await respond(url);
    if (body === undefined) return route.fulfill({ status: 404, headers: cors(request), body: '' });
    return route.fulfill({
      status: 200, headers: cors(request), contentType: 'application/json', body: JSON.stringify(body),
    });
  });
  return requests;
};

/** Registra en la página los eventos de las capas y los errores. */
const openMap = async (page) => {
  const pageErrors = [];
  const consoleMessages = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => consoleMessages.push(message.text()));
  await page.goto(PAGE);
  await page.evaluate(() => {
    IDEE.config.baseLayer = [];
    IDEE.config.terrain.default = [];
    window.map = IDEE.map({
      container: 'map', controls: [], layers: [], center: [-3.7, 40.4], zoom: 9,
    });
    window.events = [];
    window.track = (layer) => {
      layer.on(IDEE.evt.ADDED_TO_MAP, () => window.events.push(['added', layer.name]));
      layer.on(IDEE.evt.LOAD_ERROR, (error) => window.events.push(['error', layer.name, {
        isError: error instanceof Error, message: error.message, statusCode: error.statusCode,
      }]));
      return layer;
    };
  });
  return { pageErrors, consoleMessages };
};

const events = (page, type, name) => page.evaluate(([eventType, layerName]) => window.events
  .filter(([kind, layer]) => kind === eventType && layer === layerName), [type, name]);

const hasSecret = (text) => SECRETS.some((secret) => String(text).includes(secret));

test.describe.configure({ timeout: 90000 });

test.describe('IDEE.layer.Tiles3D en Cesium', () => {
  test('url: cabeceras, query y ticket solo en las peticiones del origen del tileset', async ({ page }) => {
    const own = await routeHost(page, HOST, (url) => {
      if (url.pathname === '/raiz/tileset.json') {
        return parentTileset(['sub/externo.json', `${OTHER}/externo.json`]);
      }
      return url.pathname === '/raiz/sub/externo.json' ? leafTileset() : undefined;
    });
    const other = await routeHost(page, OTHER, () => leafTileset());
    const { pageErrors } = await openMap(page);
    const created = await page.evaluate(({ host, header, query, ticket }) => {
      IDEE.config('TICKET', ticket);
      const typeErrors = [{ name: 'sin_fuente' }, { url: `${host}/a.json`, ionAssetId: 3 }]
        .map((parameters) => {
          try {
            return new IDEE.layer.Tiles3D(parameters) && 'creada';
          } catch (error) {
            return error instanceof TypeError ? error.message : String(error);
          }
        });
      window.layer = window.track(new IDEE.layer.Tiles3D({
        url: `${host}/raiz/tileset.json`, name: 'credenciales',
      }, {
        headers: { 'X-Api-Key': header }, queryParameters: { key: query },
      }));
      window.map.addLayers(window.layer);
      return { typeErrors, source: IDEE.language.getValue('exception').tiles3d_source };
    }, {
      host: HOST, header: HEADER_SECRET, query: QUERY_SECRET, ticket: TICKET_SECRET,
    });
    expect(created.typeErrors).toEqual([created.source, created.source]);

    await expect.poll(() => events(page, 'added', 'credenciales'), WAIT).toHaveLength(1);
    await expect.poll(() => own.map((r) => r.url.pathname).sort(), WAIT)
      .toEqual(['/raiz/sub/externo.json', '/raiz/tileset.json']);
    await expect.poll(() => other.length, WAIT).toBe(1);

    own.forEach(({ url, headers }) => {
      expect(headers['x-api-key']).toBe(HEADER_SECRET);
      expect(url.searchParams.get('key')).toBe(QUERY_SECRET);
      expect(url.searchParams.get('ticket')).toBe(TICKET_SECRET);
    });
    other.forEach(({ url, headers }) => {
      expect(headers['x-api-key']).toBeUndefined();
      expect([...url.searchParams.keys()]).toEqual([]);
    });

    const rest = await page.evaluate(() => window.layer.getRestLayer());
    expect(rest).toContain('Tiles3D*');
    expect(hasSecret(rest)).toBe(false);
    expect(await events(page, 'error', 'credenciales')).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test('Cesium ion: token y servidor propios, equals y retirada de la capa indicada', async ({ page }) => {
    const endpoints = await routeHost(page, ION, (url) => {
      const match = /^\/v1\/assets\/(\d+)\/endpoint$/.exec(url.pathname);
      if (!match || url.searchParams.get('access_token') !== ION_SECRET) return undefined;
      return {
        type: '3DTILES',
        url: `${ASSETS}/${match[1]}/tileset.json`,
        accessToken: `asset-${match[1]}`,
        attributions: [],
      };
    });
    const assets = await routeHost(page, ASSETS, () => leafTileset());
    const { pageErrors } = await openMap(page);
    await page.evaluate(({ ion, token }) => {
      const create = (ionAssetId) => window.track(new IDEE.layer.Tiles3D({ ionAssetId, name: 'ion' }, {
        ionAccessToken: token, ionServer: `${ion}/`,
      }));
      window.first = create(1);
      window.second = create(2);
      window.map.addLayers([window.first, window.second]);
    }, { ion: ION, token: ION_SECRET });

    await expect.poll(() => events(page, 'added', 'ion'), WAIT).toHaveLength(2);
    expect(endpoints.map(({ url }) => [url.pathname, url.searchParams.get('access_token')]).sort())
      .toEqual([['/v1/assets/1/endpoint', ION_SECRET], ['/v1/assets/2/endpoint', ION_SECRET]]);
    expect(assets.map(({ url, headers }) => [url.pathname, headers.authorization]).sort())
      .toEqual([['/1/tileset.json', 'Bearer asset-1'], ['/2/tileset.json', 'Bearer asset-2']]);

    const state = await page.evaluate(() => {
      const { primitives } = window.map.getMapImpl().scene;
      const rest = window.second.getRestLayer();
      const fromRest = window.map.getLayerByString(rest);
      const fromObject = window.map.getLayerByString({
        type: 'Tiles3D', name: 'objeto', ionAssetId: 3, options: { ionAccessToken: 'otro' },
      });
      const result = {
        equals: [window.first.equals(window.second), window.first.equals(window.first),
          window.first.getImpl().equals(window.second.getImpl())],
        rest,
        rebuilt: [[fromRest.type, fromRest.name, fromRest.ionAssetId],
          [fromObject.name, fromObject.ionAssetId, fromObject.options.ionAccessToken]],
      };
      const firstTileset = window.first.getImpl().getLayer();
      window.map.removeTiles3D(window.first);
      return {
        ...result,
        remaining: window.map.getTiles3D().map((layer) => layer.ionAssetId),
        firstRemoved: firstTileset.isDestroyed() && window.first.getImpl().getLayer() === null,
        secondInScene: primitives.contains(window.second.getImpl().getLayer()),
      };
    });
    expect(state).toMatchObject({
      equals: [false, true, false],
      rebuilt: [['Tiles3D', 'ion', 2], ['objeto', 3, 'otro']],
      remaining: [2],
      firstRemoved: true,
      secondInScene: true,
    });
    expect(state.rest).toContain('ionAssetId=2');
    expect(hasSecret(state.rest)).toBe(false);
    expect(pageErrors).toEqual([]);
  });

  test('errores: un único LOAD_ERROR saneado y un aviso; las teselas fallidas no exponen secretos', async ({ page }) => {
    await routeHost(page, HOST, (url) => {
      if (url.pathname === '/fallo-tesela/tileset.json') return parentTileset(['falta.json']);
      return undefined;
    });
    const { pageErrors, consoleMessages } = await openMap(page);
    await page.evaluate(({ host, header, query, ticket }) => {
      IDEE.config('TICKET', ticket);
      const options = { headers: { 'X-Api-Key': header }, queryParameters: { key: query } };
      window.missing = window.track(new IDEE.layer.Tiles3D({
        url: `${host}/no-existe/tileset.json`, name: 'inexistente',
      }, options));
      window.map.addLayers(window.missing);
    }, {
      host: HOST, header: HEADER_SECRET, query: QUERY_SECRET, ticket: TICKET_SECRET,
    });

    await expect.poll(() => events(page, 'error', 'inexistente'), WAIT).toHaveLength(1);
    const [[, , error]] = await events(page, 'error', 'inexistente');
    expect(error).toEqual({ isError: true, message: 'HTTP 404', statusCode: 404 });
    await expect(page.locator('div.m-toast.error')).toHaveCount(1);
    expect(hasSecret(await page.locator('div.m-toast.error').innerText())).toBe(false);
    await page.evaluate(() => window.missing.fire(IDEE.evt.LOAD_ERROR, [new Error('otra vez')]));
    await expect(page.locator('div.m-toast.error')).toHaveCount(1);
    expect(await events(page, 'added', 'inexistente')).toEqual([]);

    await page.evaluate(({ host, query }) => {
      window.partial = window.track(new IDEE.layer.Tiles3D({
        url: `${host}/fallo-tesela/tileset.json`, name: 'parcial',
      }, { queryParameters: { key: query } }));
      window.map.addLayers(window.partial);
    }, { host: HOST, query: QUERY_SECRET });
    await expect.poll(() => events(page, 'added', 'parcial'), WAIT).toHaveLength(1);
    const failure = await page.evaluate(() => IDEE.language.getValue('exception').tiles3d_tile_failed);
    await expect.poll(() => consoleMessages.some((text) => text.startsWith(failure)), WAIT).toBe(true);
    expect(consoleMessages.filter(hasSecret)).toEqual([]);
    expect(await events(page, 'error', 'parcial')).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test('retirada durante la carga: el tileset tardío se destruye y no entra en la escena', async ({ page }) => {
    let release;
    const gate = new Promise((resolve) => { release = resolve; });
    const requests = await routeHost(page, HOST, async () => {
      await gate;
      return leafTileset();
    });
    const { pageErrors } = await openMap(page);
    await page.evaluate((host) => {
      const { Cesium } = window;
      const { primitives } = window.map.getMapImpl().scene;
      window.destroyed = 0;
      window.addedTilesets = 0;
      const destroy = Cesium.Cesium3DTileset.prototype.destroy;
      Cesium.Cesium3DTileset.prototype.destroy = function countDestroy(...args) {
        window.destroyed += 1;
        return destroy.apply(this, args);
      };
      const add = primitives.add.bind(primitives);
      primitives.add = (primitive, index) => {
        if (primitive instanceof Cesium.Cesium3DTileset) window.addedTilesets += 1;
        return add(primitive, index);
      };
      window.removed = window.track(new IDEE.layer.Tiles3D({ url: `${host}/a/tileset.json`, name: 'retirada' }));
      window.destroyedLayer = window.track(new IDEE.layer.Tiles3D({ url: `${host}/b/tileset.json`, name: 'destruida' }));
      window.map.addLayers([window.removed, window.destroyedLayer]);
    }, HOST);
    await expect.poll(() => requests.length, WAIT).toBe(2);
    await page.evaluate(() => {
      window.map.removeLayers(window.removed);
      window.destroyedLayer.getImpl().destroy();
    });
    release();

    await expect.poll(() => page.evaluate(() => window.destroyed), WAIT).toBe(2);
    expect(await page.evaluate(() => [window.addedTilesets, window.events.length,
      window.removed.getImpl().getLayer(), window.destroyedLayer.getImpl().getLayer()]))
      .toEqual([0, 0, null, null]);
    expect(pageErrors).toEqual([]);
  });
});
