import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';

const jsp = readFileSync(path.resolve(__dirname,
  '../../../../../../../api-idee-rest/src/main/webapp/sharemap.jsp'), 'utf8');
const form = jsp.match(/<body>([\s\S]*?)<script type="text\/javascript"/)[1];
const script = jsp.match(/<script type="text\/javascript">\s*(const urlParams[\s\S]*?)<\/script>/)[1];

// Ejecuta el formulario y el código reales del JSP con los bundles locales.
// La fixture proporciona el resultado de configuration.js sin necesitar Tomcat.
const openViewer = async (page, sharedLayers, viewParams = {}) => {
  const params = new URLSearchParams(viewParams);
  if (sharedLayers !== undefined) params.set('layers', sharedLayers.join(','));
  const query = params.size ? `?${params}` : '';
  await page.goto(`/src/plugins/sharemap/test/playwright/ol/sharemap-ol.html${query}`);
  await page.addScriptTag({ url: '/src/plugins/layerswitcher/dist/layerswitcher.ol.min.js' });
  await page.evaluate(({ html, layers, view }) => {
    document.body.innerHTML = html;
    IDEE.config.MAP_VIEWER_LAYERS = layers || [];
    IDEE.config.MAP_VIEWER_BASE_LAYER = view.baselayer;
    IDEE.config.backgroundlayers = [{ id: 'default', title: 'Fondo del destino',
      layers: [new IDEE.layer.XYZ({ name: 'default', url: '/tiles/{z}/{x}/{y}.png', isBase: true })] }];
  }, { html: form, layers: sharedLayers, view: viewParams });
  await page.addScriptTag({ content: script });
};

const suggestions = (page) => page.locator('#filterLayersSug option').evaluateAll(
  (options) => options.map((option) => option.value),
);

test.beforeEach(async ({ page }) => {
  await page.route('**/shared.geojson', (route) => route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({ type: 'FeatureCollection', features: [{
      type: 'Feature', geometry: { type: 'Point', coordinates: [-3, 40] }, properties: {},
    }] }),
  }));
});

test('El filtro ofrece las capas actuales y conserva lo escrito al añadir y quitar', async ({ page }) => {
  await openViewer(page);
  expect(await suggestions(page)).toContain('AU.AdministrativeBoundary');
  expect(await suggestions(page)).toContain('AU.AdministrativeUnit');
  await page.locator('#inputFilterLayers').fill('AU.AdministrativeBoundary');
  await page.evaluate(() => {
    window.localLayer = new IDEE.layer.Vector({ name: 'local añadida' });
    map.addLayers(localLayer);
  });
  expect(await suggestions(page)).toContain('local añadida');
  await expect(page.locator('#inputFilterLayers')).toHaveValue('AU.AdministrativeBoundary');
  await page.evaluate(() => map.removeLayers(localLayer));
  await expect.poll(() => suggestions(page)).not.toContain('local añadida');
  await expect(page.locator('#inputFilterLayers')).toHaveValue('AU.AdministrativeBoundary');
});

test('El enlace con las WMS iniciales y un GeoJSON las reconstruye una sola vez', async ({ page }) => {
  await page.goto('/src/plugins/sharemap/test/playwright/ol/sharemap-ol.html');
  const sharedLayers = await page.evaluate(() => [
    new IDEE.layer.WMS({ name: 'AU.AdministrativeBoundary',
      url: '/wms', useCapabilities: false }, { visibility: false, opacity: 0.35 }).getRestLayer(),
    new IDEE.layer.WMS({ name: 'AU.AdministrativeUnit',
      url: '/wms', useCapabilities: false }, { visibility: false }).getRestLayer(),
    new IDEE.layer.GeoJSON({ name: 'compartida', url: '/shared.geojson' }).getRestLayer(),
  ]);
  await openViewer(page, sharedLayers);
  const result = await page.evaluate(() => ({
    names: map.getLayers().filter((layer) => layer.isBase === false && layer.name !== '__draw__')
      .map((layer) => layer.name).sort(),
    opacity: map.getLayers().find((layer) => layer.name === 'AU.AdministrativeBoundary').getOpacity(),
    visible: map.getLayers().find((layer) => layer.name === 'AU.AdministrativeBoundary').isVisible(),
  }));
  expect(result.names).toEqual(['AU.AdministrativeBoundary', 'AU.AdministrativeUnit', 'compartida']);
  expect(result.opacity).toBe(0.35);
  expect(result.visible).toBe(false);
  expect(await suggestions(page)).toContain('compartida');
  await expect.poll(() => page.evaluate(() => map.getLayers()
    .find((layer) => layer.name === 'compartida').getFeatures().length)).toBe(1);
});

test('Un enlace filtrado no añade las WMS de ejemplo que no se compartieron', async ({ page }) => {
  await page.goto('/src/plugins/sharemap/test/playwright/ol/sharemap-ol.html');
  const sharedLayers = await page.evaluate(() => [
    new IDEE.layer.GeoJSON({ name: 'solo esta', url: '/shared.geojson' }).getRestLayer(),
  ]);
  await openViewer(page, sharedLayers);
  const names = await page.evaluate(() => map.getLayers()
    .filter((layer) => layer.isBase === false && layer.name !== '__draw__').map((layer) => layer.name));
  expect(names).toEqual(['solo esta']);
  expect(await suggestions(page)).toEqual(['solo esta']);
});

test('Una WFS añadida desde LayerSwitcher se reconstruye con su formato y parámetros', async ({ page }) => {
  const requests = [];
  await page.route('**/prueba/wfs?**', (route) => {
    const query = new URL(route.request().url()).searchParams;
    if (query.get('request')?.toLowerCase() === 'getcapabilities') {
      return route.fulfill({ contentType: 'text/xml', body: `<WFS_Capabilities>
        <ows:OperationsMetadata><ows:Operation name="GetFeature">
        <ows:Parameter name="outputFormat"><ows:AllowedValues><ows:Value>geojson</ows:Value>
        </ows:AllowedValues></ows:Parameter></ows:Operation></ows:OperationsMetadata>
        <FeatureTypeList><FeatureType><Name>ms:places</Name><Title>Places</Title>
        </FeatureType></FeatureTypeList></WFS_Capabilities>` });
    }
    requests.push(Object.fromEntries(query));
    return route.fulfill({ contentType: 'application/json', body: JSON.stringify({
      type: 'FeatureCollection', crs: { type: 'name', properties: { name: 'EPSG:3857' } },
      features: [{ type: 'Feature', id: 'p1', geometry: { type: 'Point',
        coordinates: [-333958, 4865942] }, properties: { nombre: 'Lugar de prueba' } }],
    }) });
  });
  await openViewer(page, []);
  await page.evaluate(() => layerswitcher.getControls()[0].openAddServices());
  await page.locator('#m-layerswitcher-addservices-search-input')
    .fill('http://localhost:8081/prueba/wfs?service=WFS&count=10');
  await page.locator('#m-layerswitcher-addservices-search-btn').click();
  await page.locator('input[id="ms:places"]').check();
  await page.locator('.m-layerswitcher-add-services-add-button').click();
  await expect.poll(() => page.evaluate(() => map.getLayers()
    .find((layer) => layer.name === 'places')?.getFeatures().length || 0)).toBe(1);
  const sharedLayers = await page.evaluate(() => [map.getLayers()
    .find((layer) => layer.name === 'places').getRestLayer()]);
  await openViewer(page, sharedLayers);
  await expect.poll(() => page.evaluate(() => map.getLayers()
    .find((layer) => layer.name === 'places')?.getFeatures().length || 0)).toBe(1);
  const result = await page.evaluate(() => {
    const layer = map.getLayers().find((item) => item.name === 'places');
    return { format: layer.options.getFeatureOutputFormat,
      describe: layer.options.describeFeatureTypeOutputFormat,
      vendor: layer.options.vendor, name: layer.getFeatures()[0].getAttribute('nombre') };
  });
  expect(result).toEqual({ format: 'geojson', describe: 'geojson',
    vendor: { getFeature: { count: '10' }, describeFeatureType: { count: '10' } },
    name: 'Lugar de prueba' });
  expect(requests.length).toBeGreaterThanOrEqual(2);
  requests.forEach((query) => {
    expect(query.outputFormat).toBe('geojson');
    expect(query.count).toBe('10');
  });
});


test('El enlace y el iframe recuperan el centro y el zoom decimal con un fondo compartido', async ({ page }) => {
  await page.goto('/src/plugins/sharemap/test/playwright/ol/sharemap-ol.html');
  const baselayer = await page.evaluate(() => new IDEE.layer.XYZ({
    name: 'fondo externo', url: '/external/{z}/{x}/{y}.png', isBase: true,
  }).getRestLayer());
  await openViewer(page, [], { baselayer, center: '-432198.125,5123456.875', zoom: '8.375', srs: 'EPSG:3857' });
  await expect.poll(() => page.evaluate(() => map.getZoom())).toBeCloseTo(8.375, 6);
  const initial = await page.evaluate(() => map.getCenter());
  expect(initial.x).toBeCloseTo(-432198.125, 6);
  expect(initial.y).toBeCloseTo(5123456.875, 6);
  await page.locator('#selectShareBaseLayer').selectOption('true');
  const shared = await page.evaluate(async () => {
    map.setCenter([-567890.375, 4789012.625]);
    map.setZoom(9.625);
    IDEE.remote.get = () => Promise.resolve({ text: '[]' });
    const control = map.getPlugins().find((p) => p.name === 'sharemap').getControls()[0];
    const html = document.createElement('div');
    html.innerHTML = '<input><button id="twitter"></button><button id="facebook"></button><button id="pinterest"></button>'
      + '<div id="m-plugin-sharemap-html"><input></div>';
    await control.buildURL(html);
    await control.buildHtml(html);
    const url = new URL(html.querySelector('input').value);
    const iframe = document.createElement('div');
    iframe.innerHTML = html.querySelector('#m-plugin-sharemap-html input').value;
    return { params: Object.fromEntries(url.searchParams), iframeURL: iframe.firstChild.getAttribute('src'), url: url.href };
  });
  expect(shared.iframeURL).toBe(shared.url);
  expect(shared.params.zoom).toBe('9.625');
  expect(shared.params.center).toBe('-567890.375,4789012.625');
  await openViewer(page, [], shared.params);
  await expect.poll(() => page.evaluate(() => map.getZoom())).toBeCloseTo(9.625, 6);
  const copy = await page.evaluate(() => ({ center: map.getCenter(), background: map.getActiveBaseLayers()[0].name }));
  expect(copy.center.x).toBeCloseTo(-567890.375, 6);
  expect(copy.center.y).toBeCloseTo(4789012.625, 6);
  expect(copy.background).toBe('fondo externo');
});

test('El formulario usa el fondo del destino al omitir shareBaseLayer o elegir false', async ({ page }) => {
  await openViewer(page, []);
  await expect(page.locator('#selectShareBaseLayer')).toHaveValue('false');
  for (const value of ['', 'false', 'true']) {
    await page.locator('#selectShareBaseLayer').selectOption(value);
    expect(await page.evaluate(() => map.getPlugins().find((p) => p.name === 'sharemap').shareBaseLayer)).toBe(value === 'true');
  }
});
