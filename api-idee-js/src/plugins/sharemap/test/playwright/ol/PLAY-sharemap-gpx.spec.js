import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';

const gpx = readFileSync(path.resolve(__dirname,
  '../../../../../../test/development/CP-0002-layers/fixtures/CP-035.gpx'), 'utf8');

test.beforeEach(async ({ page }) => {
  await page.goto('/src/plugins/sharemap/test/playwright/ol/sharemap-ol.html');
  await page.addScriptTag({ url: '/src/plugins/layerswitcher/dist/layerswitcher.ol.min.js' });
  await page.evaluate(() => {
    window.mapjs = IDEE.map({ container: 'mapjs', layers: [], controls: [] });
    window.switcher = new IDEE.plugin.Layerswitcher();
    mapjs.addPlugin(switcher);
  });
});

test('El buscador GPX mantiene la importación Vector existente y sus entidades se comparten', async ({ page }) => {
  await page.route((url) => url.pathname === '/ruta.gpx', (route) => route.fulfill({
    contentType: 'application/gpx+xml', body: gpx,
  }));
  await page.evaluate(() => switcher.getControls()[0].openAddServices());
  await page.locator('#m-layerswitcher-addservices-search-input').fill('http://localhost:8081/ruta.gpx');
  await page.locator('#m-layerswitcher-addservices-search-btn').click();
  await expect.poll(() => page.evaluate(() => mapjs.getLayers()
    .find((layer) => layer.name === 'ruta')?.getFeatures().length || 0)).toBeGreaterThan(0);
  const result = await page.evaluate(() => {
    const layer = mapjs.getLayers().find((item) => item.name === 'ruta');
    const plugin = new IDEE.plugin.ShareMap({ shareLayer: true });
    mapjs.addPlugin(plugin);
    const rest = plugin.getControls()[0].layerToParam(layer);
    const count = layer.getFeatures().length;
    const copy = mapjs.getLayerByString(rest);
    mapjs.removeLayers(layer);
    mapjs.addLayers(copy);
    window.restoredGPX = copy;
    return { imported: layer.type, type: copy.type, count,
      embedded: rest.includes('source=') };
  });
  expect(result.imported).toBe('Vector');
  expect(result.type).toBe('GeoJSON');
  await expect.poll(() => page.evaluate(() => restoredGPX.getFeatures().length)).toBe(result.count);
  expect(result.embedded).toBe(true);
});

test('GPX creado por constructor conserva la URL sin depender del cargador de LayerSwitcher', async ({ page }) => {
  await page.route('**/nativa.gpx', (route) => route.fulfill({
    contentType: 'application/gpx+xml', body: gpx,
  }));
  const result = await page.evaluate(async () => {
    const layer = new IDEE.layer.GPX({ name: 'nativa', url: '/nativa.gpx' });
    mapjs.addLayers(layer);
    await layer.calculateMaxExtent();
    const plugin = new IDEE.plugin.ShareMap({ shareLayer: true });
    mapjs.addPlugin(plugin);
    const rest = plugin.getControls()[0].layerToParam(layer);
    const count = layer.getFeatures().length;
    const copy = mapjs.getLayerByString(rest);
    mapjs.removeLayers(layer);
    mapjs.addLayers(copy);
    await copy.calculateMaxExtent();
    return { type: copy.type, url: copy.url, count, restored: copy.getFeatures().length };
  });
  expect(result.type).toBe('GPX');
  expect(result.url).toBe('http://localhost:8081/nativa.gpx');
  expect(result.count).toBeGreaterThan(0);
  expect(result.restored).toBe(result.count);
});

['<kml>', '<kml xmlns="http://www.opengis.net/kml/2.2">'].forEach((root) => {
  test(`El buscador reconoce ${root} y comparte el KML por URL`, async ({ page }) => {
    const kml = `${root}<Document><Placemark><name>Madrid</name><Point><coordinates>-3,40</coordinates></Point></Placemark></Document></kml>`;
    await page.route((url) => url.pathname === '/prueba.kml', (route) => route.fulfill({
      contentType: 'application/vnd.google-earth.kml+xml', body: kml,
    }));
    await page.evaluate(() => switcher.getControls()[0].openAddServices());
    await page.locator('#m-layerswitcher-addservices-search-input').fill('http://localhost:8081/prueba.kml');
    await page.locator('#m-layerswitcher-addservices-search-btn').click();
    await expect(page.locator('#m-layerswitcher-layer-button')).toBeVisible();
    expect(await page.evaluate(() => switcher.getControls()[0].loadingActive)).toBe(false);
    await page.locator('#m-layerswitcher-layer-button').click();
    await expect.poll(() => page.evaluate(() => mapjs.getLayers()
      .find((layer) => layer.type === 'KML')?.getFeatures().length || 0)).toBe(1);
    const restored = await page.evaluate(() => {
      const layer = mapjs.getLayers().find((item) => item.type === 'KML');
      const plugin = new IDEE.plugin.ShareMap({ shareLayer: true });
      mapjs.addPlugin(plugin);
      const copy = mapjs.getLayerByString(plugin.getControls()[0].layerToParam(layer));
      mapjs.removeLayers(layer);
      mapjs.addLayers(copy);
      return { type: copy.type, url: copy.url };
    });
    expect(restored).toEqual({ type: 'KML', url: 'http://localhost:8081/prueba.kml' });
    await expect.poll(() => page.evaluate(() => mapjs.getLayers()
      .find((layer) => layer.type === 'KML')?.getFeatures().length || 0)).toBe(1);
  });
});

test('Un vector local se comprime sin perder valores y sigue reconstruyéndose', async ({ page }) => {
  const result = await page.evaluate(() => {
    const layer = new IDEE.layer.Vector({ name: 'local grande' });
    mapjs.addLayers(layer);
    for (let i = 0; i < 200; i += 1) {
      layer.addFeatures(new IDEE.Feature(`f${i}`, { type: 'Feature',
        geometry: { type: 'Point', coordinates: [-333958 + i, 4865942] },
        properties: { texto: 'España; = árboles 🌳', orden: i, descripcion: 'dato de prueba '.repeat(20) } }));
    }
    const rest = layer.getRestLayer();
    const source = layer.toGeoJSON();
    source.crs = { type: 'name', properties: { name: 'EPSG:4326' } };
    const copy = mapjs.getLayerByString(rest);
    const decoded = copy.source;
    mapjs.removeLayers(layer);
    mapjs.addLayers(copy);
    return { compressed: rest.includes('source=deflate~'), source, decoded,
      length: rest.length, reconstructed: copy.name };
  });
  expect(result.compressed).toBe(true);
  expect(result.decoded).toEqual(result.source);
  expect(result.length).toBeLessThan(7000);
  expect(result.reconstructed).toBe('local grande');
});

test('ShareMap bloquea URL e iframe demasiado grandes, avisa una vez y permite reintentar', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const plugin = new IDEE.plugin.ShareMap({ shareLayer: true, urlAPI: true });
    mapjs.addPlugin(plugin);
    const control = plugin.getControls()[0];
    control.getControls = () => Promise.resolve([]);
    control.getPlugins = () => '';
    control.getLayers = () => [`GeoJSON*name=${'x'.repeat(8000)}`];
    const warnings = [];
    const requests = [];
    IDEE.toast.error = (message) => warnings.push(message);
    IDEE.remote.get = (url) => { requests.push(url); return Promise.resolve({ text: '/short' }); };
    const dialog = document.createElement('div');
    dialog.innerHTML = '<input><button id="m-plugin-sharemap-copybutton"></button><button id="twitter"></button><button id="facebook"></button><button id="pinterest"></button><div id="m-plugin-sharemap-html"><input><button id="m-plugin-sharemap-copybuttonhtml"></button></div>';
    await control.buildURL(dialog);
    await control.buildHtml(dialog);
    const blocked = { url: dialog.querySelector('input').value,
      html: dialog.querySelector('#m-plugin-sharemap-html input').value,
      disabled: dialog.querySelector('#m-plugin-sharemap-copybutton').disabled,
      htmlDisabled: dialog.querySelector('#m-plugin-sharemap-copybuttonhtml').disabled,
      warnings: warnings.length, requests: requests.length };
    control.getLayers = () => [];
    await control.buildURL(dialog);
    return { blocked, retried: !dialog.querySelector('#m-plugin-sharemap-copybutton').disabled };
  });
  expect(result.blocked).toEqual({ url: '', html: '', disabled: true, htmlDisabled: true, warnings: 1, requests: 0 });
  expect(result.retried).toBe(true);
});

test('URL e iframe conservan el JSON del catálogo sin caracteres HTTP inválidos', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const plugin = new IDEE.plugin.ShareMap({ baseUrl: 'http://localhost:8080/api-idee/', urlAPI: true, shareLayer: true });
    mapjs.addPlugin(plugin);
    const control = plugin.getControls()[0];
    const catalog = { services: [{ name: 'Árbol "{}[]"', url: 'https://example.test/?a=1&b=2' }], groups: [] };
    switcher.getControls()[0].precharged = catalog;
    switcher.precharged = catalog;
    control.getControls = () => Promise.resolve([]);
    IDEE.remote.get = () => Promise.resolve({ text: '/short' });
    const dialog = document.createElement('div');
    dialog.innerHTML = '<input><button id="twitter"></button><button id="facebook"></button><button id="pinterest"></button><div id="m-plugin-sharemap-html"><input></div>';
    await control.buildURL(dialog);
    await control.buildHtml(dialog);
    const url = dialog.querySelector('input').value;
    const embedded = document.createElement('div');
    embedded.innerHTML = dialog.querySelector('#m-plugin-sharemap-html input').value;
    return { url, parameter: new URL(url).searchParams.get('layerswitcher'),
      expected: switcher.getAPIRest().split('=').slice(1).join('='),
      same: embedded.querySelector('iframe').getAttribute('src') === url };
  });
  expect(result.url).not.toMatch(/[{}\[\]"\s]/);
  expect(result.parameter).toBe(result.expected);
  expect(result.same).toBe(true);
});
