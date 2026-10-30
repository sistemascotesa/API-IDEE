import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/test/playwright/ol/basic-ol.html');
  await page.addScriptTag({ url: '/src/plugins/sharemap/dist/sharemap.ol.min.js' });
  await page.addScriptTag({ url: '/src/plugins/backimglayer/dist/backimglayer.ol.min.js' });
  await page.evaluate(() => {
    IDEE.config.terrain.default = [];
    window.base = (name) => new IDEE.layer.XYZ({ name, url: `/tiles/${name}/{z}/{x}/{y}.png`, isBase: true });
    window.catalog = () => ['street', 'image'].map((id) => ({ id, title: id, layers: [base(id)] }));
    IDEE.config.backgroundlayers = catalog();
    window.mapjs = IDEE.map({ container: 'map', layers: [], controls: ['backgroundlayers'],
      baseLayer: base('image').getRestLayer(), center: [-432198.125, 5123456.875], zoom: 8.375 });
    const overlay = new IDEE.layer.Vector({ name: 'info', displayInLayerSwitcher: true });
    mapjs.addLayers(overlay);
    overlay.addFeatures(new IDEE.Feature('p', {
      type: 'Feature', geometry: { type: 'Point', coordinates: [-432198, 5123456] }, properties: {},
    }));
    IDEE.remote.get = (url) => Promise.resolve({ text: url.includes('/api/actions/controls')
      ? '["backgroundlayers"]' : 'http://example.test/short' });
    window.share = async (options) => {
      const plugin = new IDEE.plugin.ShareMap(options);
      mapjs.addPlugin(plugin);
      const control = plugin.getControls()[0];
      const html = document.createElement('div');
      html.innerHTML = '<input><button id="twitter"></button><button id="facebook"></button><button id="pinterest"></button>'
        + '<div id="m-plugin-sharemap-html"><input></div>';
      await control.buildURL(html);
      await control.buildHtml(html);
      const url = new URL(html.querySelector('input').value);
      const iframe = document.createElement('div');
      iframe.innerHTML = html.querySelector('#m-plugin-sharemap-html input').value;
      const result = { url: url.href, params: Object.fromEntries(url.searchParams),
        iframe: iframe.firstChild.getAttribute('src'), rest: plugin.getAPIRest() };
      mapjs.removePlugins(plugin);
      return result;
    };
  });
  await expect(page.locator('#m-baselayerselector-image')).toHaveClass(/activeBaseLayerButton/);
});

for (const urlAPI of [false, true]) {
  for (const flag of [undefined, false, true]) {
    test(`shareBaseLayer=${flag} con urlAPI=${urlAPI} conserva el encuadre y respeta shareLayer`, async ({ page }) => {
      const results = await page.evaluate(async ({ api, value }) => {
        const output = [];
        for (const shareLayer of [false, true]) {
          output.push(await share({ urlAPI: api, shareLayer,
            ...(value === undefined ? {} : { shareBaseLayer: value }) }));
        }
        return output;
      }, { api: urlAPI, value: flag });
      for (const [index, result] of results.entries()) {
        expect(result.iframe).toBe(result.url);
        expect(result.params.zoom).toBe('8.375');
        expect(result.params.center).toBe('-432198.125,5123456.875');
        if (flag === true) expect(result.params.baselayer).toContain('name=image;');
        else expect(result.params.baselayer).toBeUndefined();
        if (index === 1) expect(result.params.layers).toContain('name=info;');
        else expect(result.params.layers).toBeUndefined();
        expect(result.rest.split('*')[14]).toBe(String(flag === true));
        if (urlAPI) expect(result.params.controls).toBe(flag === true ? 'backgroundlayers*1*true' : 'backgroundlayers');
      }
    });
  }

  test(`Omitir shareBaseLayer y false generan el mismo enlace con urlAPI=${urlAPI}`, async ({ page }) => {
    const result = await page.evaluate(async (api) => [
      await share({ urlAPI: api, shareLayer: true }),
      await share({ urlAPI: api, shareLayer: true, shareBaseLayer: false }),
    ], urlAPI);
    expect(result[0].url).toBe(result[1].url);
  });
}

test('Con false no se serializa un fondo no compartible ni se exporta BackImgLayer del origen', async ({ page }) => {
  await page.evaluate(() => mapjs.addPlugin(new IDEE.plugin.BackImgLayer({ layerOpts: catalog() })));
  const result = await page.evaluate(async () => {
    mapjs.getRestBaseLayer = () => { throw new Error('El fondo no debe serializarse'); };
    return share({ urlAPI: true, shareLayer: true, shareBaseLayer: false });
  });
  expect(result.params.baselayer).toBeUndefined();
  expect(result.params.backimglayer).toBeUndefined();
  expect(result.params.layers).toContain('name=info;');
});

for (const urlAPI of [false, true]) {
  test(`Sin fondo activo se omite baselayer y se recupera el fondo del destino con urlAPI=${urlAPI}`, async ({ page }) => {
    const results = await page.evaluate(async (api) => {
      mapjs.removeLayers(mapjs.getActiveBaseLayers());
      const output = [];
      for (const flag of [undefined, false, true]) {
        output.push(await share({ urlAPI: api, shareLayer: true, shareBaseLayer: flag }));
      }
      const div = document.createElement('div');
      div.id = 'destination';
      document.body.appendChild(div);
      window.destination = IDEE.map({ container: div.id, layers: [], controls: ['backgroundlayers'],
        baseLayer: output[2].params.baselayer });
      return output;
    }, urlAPI);
    for (const result of results) {
      expect(result.params.baselayer).toBeUndefined();
      expect(result.params.layers).toContain('name=info;');
      expect(result.iframe).toBe(result.url);
      if (urlAPI) expect(result.params.controls).toBe('backgroundlayers');
    }
    await expect.poll(() => page.evaluate(() => destination.getActiveBaseLayers().map((layer) => layer.name)))
      .toEqual(['street']);
  });
}

test('Sin fondo activo no se exporta el catálogo de BackImgLayer aunque shareBaseLayer sea true', async ({ page }) => {
  await page.evaluate(() => mapjs.addPlugin(new IDEE.plugin.BackImgLayer({ collapsed: false, layerOpts: catalog() })));
  await expect(page.locator('#backimglayer-layer-image')).toHaveClass(/m-backimglayer-active/);
  await page.locator('#backimglayer-layer-image').click();
  const result = await page.evaluate(() => share({ urlAPI: true, shareLayer: true, shareBaseLayer: true }));
  expect(result.params.baselayer).toBeUndefined();
  expect(result.params.backimglayer).toBeUndefined();
  expect(result.params.controls).toBe('backgroundlayers');
  expect(result.params.layers).toContain('name=info;');
  expect(result.iframe).toBe(result.url);
});
