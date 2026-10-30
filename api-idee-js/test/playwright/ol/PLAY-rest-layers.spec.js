import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';
import { prepareGeoPackagePage } from './fixtures/geopackage';

test.beforeEach(async ({ page }) => {
  await prepareGeoPackagePage(page);
  await page.evaluate(() => {
    IDEE.config.MAP_VIEWER_LAYERS = [];
    window.mapjs = IDEE.map({ container: 'map', layers: [], controls: [] });
  });
});

test('REST nombrado conserva separadores, Unicode, filtros y estado WMS', async ({ page }) => {
  const result = await page.evaluate(() => {
    const original = new IDEE.layer.WMS({
      url: 'http://localhost:8081/wms?key=a=b&other=1', name: 'prueba',
      legend: "Árbol; río,*='true'", isBase: false, useCapabilities: false,
    }, { visibility: false, opacity: 0.4 }, { cql: "name='a;b,c'" });
    const rest = original.getRestLayer();
    const copy = mapjs.getLayerByString(rest);
    return { rest, name: copy.name, legend: copy.legend, url: copy.url,
      visible: copy.isVisible(), opacity: copy.getOpacity(), cql: copy.cql };
  });
  expect(result.rest).toMatch(/^WMS\*name=/);
  expect(result.name).toBe('prueba');
  expect(result.legend).toBe("Árbol; río,*='true'");
  expect(result.url).toBe('http://localhost:8081/wms?key=a=b&other=1');
  expect(result.visible).toBe(false);
  expect(result.opacity).toBe(0.4);
  expect(result.cql).toBe("name='a;b,c'");
});

test('DataIDEE preserva filtros CQL2 JSON y opciones', async ({ page }) => {
  const result = await page.evaluate(() => {
    const filter = { op: '=', args: [{ property: 'status' }, 'active'] };
    const original = new IDEE.layer.DataIDEE({
      url: 'http://localhost:8081/collections/', name: 'places', limit: 20, offset: 0,
    }, { visibility: false, opacity: 0.25 }, { filter, filterLang: 'cql2-json' });
    const copy = mapjs.getLayerByString(original.getRestLayer());
    return { vendor: copy.constructorParameters.vendorOpts, limit: copy.limit,
      visible: copy.isVisible(), opacity: copy.getOpacity() };
  });
  expect(result.vendor.filter).toEqual({ op: '=', args: [{ property: 'status' }, 'active'] });
  expect(result.vendor.filterLang).toBe('cql2-json');
  expect(result.limit).toBe(20);
  expect(result.visible).toBe(false);
  expect(result.opacity).toBe(0.25);
});

test('MapLibre remoto comparte su URL sin incrustar el JSON descargado; el estilo local se conserva', async ({ page }) => {
  const result = await page.evaluate(() => {
    const style = { version: 8, sources: {}, layers: [{ id: 'background', type: 'background',
      paint: { 'background-color': '#ff0000' } }], metadata: { descripcion: 'detalle '.repeat(1000) } };
    const remote = new IDEE.layer.MapLibre({ name: 'remoto', url: '/style.json' });
    remote.maplibrestyle = style;
    const remoteRest = remote.getRestLayer();
    const remoteCopy = mapjs.getLayerByString(remoteRest);
    const local = new IDEE.layer.MapLibre({ name: 'local', maplibrestyle: style });
    const localCopy = mapjs.getLayerByString(local.getRestLayer());
    return { remoteRest, url: remoteCopy.url, remoteStyle: remoteCopy.maplibrestyle,
      style, localStyle: localCopy.maplibrestyle };
  });
  expect(result.remoteRest.length).toBeLessThan(1000);
  expect(result.remoteRest).not.toContain('maplibrestyle=');
  expect(result.url).toBe('http://localhost:8081/style.json');
  expect(result.remoteStyle).toBeUndefined();
  expect(result.localStyle).toEqual(result.style);
});

test('Vector local comparte entidades y estilo como GeoJSON', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const layer = new IDEE.layer.Vector({ name: 'datos locales' });
    mapjs.addLayers(layer);
    layer.addFeatures(new IDEE.Feature('uno', {
      type: 'Feature', geometry: { type: 'Point', coordinates: [-3, 40] },
      properties: { text: 'España; a=b,c & d' },
    }));
    layer.setStyle(new IDEE.style.Point({ radius: 9, fill: { color: '#ff0000' } }));
    const rest = layer.getRestLayer();
    const copy = mapjs.getLayerByString(rest);
    mapjs.removeLayers(layer);
    mapjs.addLayers(copy);
    await new Promise((resolve) => setTimeout(resolve, 100));
    return { rest, data: copy.toGeoJSON(), style: copy.getStyle().serialize() };
  });
  expect(result.rest).toMatch(/^GeoJSON\*/);
  expect(result.data.features).toHaveLength(1);
  expect(result.data.features[0].properties.text).toBe('España; a=b,c & d');
  expect(JSON.parse(Buffer.from(result.style, 'base64').toString()).parameters[0])
    .toEqual({ radius: 9, fill: { color: '#ff0000' } });
});

test('Grupos anidados reconstruyen sus hijos mediante parámetros nombrados', async ({ page }) => {
  const result = await page.evaluate(() => {
    const child = new IDEE.layer.XYZ({ name: 'teselas', url: '/tiles/{z}/{x}/{y}.png', isBase: false });
    const inner = new IDEE.layer.LayerGroup({ name: 'interior', layers: [child] });
    const group = new IDEE.layer.LayerGroup({ name: 'exterior', layers: [inner] });
    mapjs.addLayers(group);
    const rest = group.getRestLayer();
    const copy = mapjs.getLayerByString(rest);
    mapjs.removeLayers(group);
    mapjs.addLayers(copy);
    return { name: copy.name, inner: copy.getLayers()[0].name,
      url: copy.getLayers()[0].getLayers()[0].url };
  });
  expect(result).toEqual({ name: 'exterior', inner: 'interior',
    url: 'http://localhost:8081/tiles/{z}/{x}/{y}.png' });
});

test('GeoPackage remoto comparte solo la tabla seleccionada y su estado', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const original = new IDEE.layer.GeoPackage({ url: '/fixtures/geopackage/mixed.gpkg', name: 'paquete' });
    mapjs.addLayers(original);
    await original.whenReady();
    const tile = original.getLayers().find((layer) => layer.type === 'GeoPackageTile');
    tile.setVisible(false);
    tile.setOpacity(0.35);
    const rest = tile.getRestLayer();
    const copy = mapjs.getLayerByString(rest);
    mapjs.addLayers(copy);
    await copy.whenReady();
    return { count: copy.getLayers().length, type: copy.getLayers()[0].type,
      opacity: copy.getLayers()[0].getOpacity(), visible: copy.getLayers()[0].isVisible() };
  });
  expect(result).toEqual({ count: 1, type: 'GeoPackageTile', opacity: 0.35, visible: false });
});

test('ShareMap delega en getRestLayer y avisa una vez de los binarios locales', async ({ page }) => {
  await page.addScriptTag({ url: '/src/plugins/sharemap/dist/sharemap.ol.min.js' });
  const result = await page.evaluate(() => {
    const plugin = new IDEE.plugin.ShareMap();
    mapjs.addPlugin(plugin);
    const control = plugin.getControls()[0];
    const warnings = [];
    IDEE.toast.error = (message) => warnings.push(message);
    const local = new IDEE.layer.MBTiles({ name: 'local', url: 'blob:http://localhost/file' });
    const excluded = control.layerToParam(local);
    control.layerToParam(local);
    const remote = new IDEE.layer.MBTiles({ name: 'remoto', url: '/tiles.mbtiles' });
    const included = control.layerToParam(remote);
    return { excluded, included, warnings };
  });
  expect(result.excluded).toBeUndefined();
  expect(result.included).toMatch(/^MBTiles\*/);
  expect(result.warnings).toHaveLength(1);
  expect(result.warnings[0]).toContain('local');
});

test('ShareMap avisa de una capa sin getRestLayer y no activa un serializador por tipo', async ({ page }) => {
  await page.addScriptTag({ url: '/src/plugins/sharemap/dist/sharemap.ol.min.js' });
  const result = await page.evaluate(() => {
    const plugin = new IDEE.plugin.ShareMap();
    mapjs.addPlugin(plugin);
    const control = plugin.getControls()[0];
    const warnings = [];
    IDEE.toast.error = (message) => warnings.push(message);
    const layer = new IDEE.layer.WMS({ name: 'externa', url: '/wms', useCapabilities: false });
    layer.getRestLayer = undefined;
    const excluded = control.layerToParam(layer);
    control.layerToParam(layer);
    return { excluded, warnings };
  });
  expect(result.excluded).toBeUndefined();
  expect(result.warnings).toHaveLength(1);
  expect(result.warnings[0]).toContain('externa');
});

test('La sintaxis posicional anterior sigue reconstruyéndose', async ({ page }) => {
  const result = await page.evaluate(() => {
    const layer = mapjs.getLayerByString('WMS*leyenda*http://localhost:8081/wms*nombre*true');
    return { type: layer.type, name: layer.name, legend: layer.legend };
  });
  expect(result).toEqual({ type: 'WMS', name: 'nombre', legend: 'leyenda' });
});


test('Matriz de tipos remotos: serializar y reconstruir por el mismo flujo público', async ({ page }) => {
  const result = await page.evaluate(() => {
    const cases = {
      WMS: { useCapabilities: false }, WMTS: { matrixSet: 'EPSG:3857', useCapabilities: false },
      WFS: { namespace: 'test', geometry: 'POINT' }, OGCAPIFeatures: {}, DataIDEE: {},
      OSM: {}, XYZ: {}, TMS: {}, GeoJSON: {}, KML: {}, KMZ: {}, GPX: {},
      GeoTIFF: { projection: 'EPSG:4326' }, MVT: {}, MBTiles: {}, MBTilesVector: {},
      WMC: {}, MapLibre: {},
    };
    return Object.entries(cases).flatMap(([type, params]) => {
      try {
        const layer = new IDEE.layer[type]({
          name: 'prueba', url: 'http://localhost:8081/resource', isBase: false, ...params,
        });
        const copy = mapjs.getLayerByString(layer.getRestLayer());
        if (copy.type !== type) return [`${type}: reconstruido como ${copy.type}`];
        return [];
      } catch (error) {
        return [`${type}: ${error.message}`];
      }
    });
  });
  expect(result).toEqual([]);
});


test('GenericRaster XYZ se reconstruye como fachada XYZ', async ({ page }) => {
  const result = await page.evaluate(() => {
    const native = new ol.layer.Tile({ source: new ol.source.XYZ({
      url: 'http://localhost:8081/tiles/{z}/{x}/{y}.png',
    }) });
    const layer = new IDEE.layer.GenericRaster({ name: 'genérica' }, {}, native);
    const copy = mapjs.getLayerByString(layer.getRestLayer());
    return { type: copy.type, name: copy.name, url: copy.url };
  });
  expect(result).toEqual({ type: 'XYZ', name: 'genérica',
    url: 'http://localhost:8081/tiles/{z}/{x}/{y}.png' });
});

test('Enlace e iframe contienen las mismas capas y se pueden reconstruir', async ({ page }) => {
  await page.addScriptTag({ url: '/src/plugins/sharemap/dist/sharemap.ol.min.js' });
  const result = await page.evaluate(async () => {
    const layer = new IDEE.layer.XYZ({ name: 'compartida', url: '/tiles/{z}/{x}/{y}.png', isBase: false });
    mapjs.addLayers(layer);
    const plugin = new IDEE.plugin.ShareMap({ baseUrl: 'http://localhost:8080/api-idee/', urlAPI: true, shareLayer: true });
    mapjs.addPlugin(plugin);
    const control = plugin.getControls()[0];
    control.getControls = () => Promise.resolve([]);
    IDEE.remote.get = () => Promise.resolve({ text: 'http://example.test/shared' });
    const dialog = document.createElement('div');
    dialog.innerHTML = '<input><button id="twitter"></button><button id="facebook"></button><button id="pinterest"></button><div id="m-plugin-sharemap-html"><input></div>';
    await control.buildURL(dialog);
    await control.buildHtml(dialog);
    const url = dialog.querySelector('input').value;
    const embedded = document.createElement('div');
    embedded.innerHTML = dialog.querySelector('#m-plugin-sharemap-html input').value;
    const layers = new URL(url).searchParams.get('layers');
    const copy = mapjs.getLayerByString(layers);
    return { same: embedded.querySelector('iframe').getAttribute('src') === url,
      name: copy.name, type: copy.type };
  });
  expect(result).toEqual({ same: true, name: 'compartida', type: 'XYZ' });
});

test('Un visualizador consume layers una vez y ShareMap no recupera entradas antiguas', async ({ page }) => {
  await page.addScriptTag({ url: '/src/plugins/sharemap/dist/sharemap.ol.min.js' });
  const result = await page.evaluate(async () => {
    const rest = new IDEE.layer.XYZ({ name: 'center', url: '/tiles/{z}/{x}/{y}.png', isBase: false }).getRestLayer();
    IDEE.config.MAP_VIEWER_LAYERS = [rest];
    const container = document.createElement('div');
    container.id = 'second';
    document.body.appendChild(container);
    const viewer = IDEE.map({ container: 'second', layers: [rest], controls: [] });
    const plugin = new IDEE.plugin.ShareMap({ urlAPI: false, shareLayer: true });
    viewer.addPlugin(plugin);
    const control = plugin.getControls()[0];
    control.urlAPI_ = false;
    control.getControls = () => Promise.resolve([]);
    IDEE.remote.get = () => Promise.resolve({ text: 'http://example.test/shared' });
    viewer.getLayers().find((layer) => layer.name === 'center').setOpacity(0.25);
    const dialog = document.createElement('div');
    dialog.innerHTML = '<input><button id="twitter"></button><button id="facebook"></button><button id="pinterest"></button>';
    await control.buildURL(dialog);
    return { count: viewer.getLayers().filter((layer) => layer.name !== '__draw__').length,
      entries: new URL(dialog.querySelector('input').value).searchParams.get('layers').split(',').length };
  });
  expect(result).toEqual({ count: 1, entries: 1 });
});


test('GPX local se comparte como GeoJSON conservando coordenadas y atributos', async ({ page }) => {
  await page.evaluate(() => {
    window.localGPX = new IDEE.layer.GPX({ name: 'ruta', source: '<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1"><wpt lat="40" lon="-3"><name>Parada</name></wpt></gpx>' });
    mapjs.addLayers(localGPX);
  });
  await expect.poll(() => page.evaluate(() => localGPX.getFeatures().length)).toBe(1);
  const result = await page.evaluate(async () => {
    const rest = localGPX.getRestLayer();
    const copy = mapjs.getLayerByString(rest);
    mapjs.addLayers(copy);
    await new Promise((resolve) => setTimeout(resolve, 100));
    return { type: copy.type, feature: copy.toGeoJSON().features[0] };
  });
  expect(result.type).toBe('GeoJSON');
  expect(result.feature.properties.name).toBe('Parada');
  expect(result.feature.geometry.coordinates[0]).toBeCloseTo(-3, 6);
  expect(result.feature.geometry.coordinates[1]).toBeCloseTo(40, 6);
});

test('GeoPackage local conserva vectores y rechaza teselas sin URL', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const load = async (kind) => {
      const response = await fetch(`/fixtures/geopackage/${kind}.gpkg`);
      const file = new File([await response.arrayBuffer()], `${kind}.gpkg`);
      const gpkg = new IDEE.layer.GeoPackage({ source: file, name: kind });
      mapjs.addLayers(gpkg);
      await gpkg.whenReady();
      return gpkg;
    };
    const vector = await load('vector');
    const raster = await load('raster');
    let error;
    try { raster.getRestLayer(); } catch (caught) { error = caught.message; }
    return { vector: vector.getLayers()[0].getRestLayer(), group: vector.getRestLayer(), error };
  });
  expect(result.vector).toMatch(/^GeoJSON\*/);
  expect(result.group).toMatch(/^LayerGroup\*/);
  expect(result.error).toBe('REST_LAYER_LOCAL_BINARY');
});


test('configuration.js lee layers como primer parámetro y preserva los separadores', async ({ page }) => {
  const source = readFileSync(path.resolve(__dirname, '../../../src/configuration.js'), 'utf8');
  const start = source.indexOf('  const params =');
  const end = source.indexOf('  /**', start);
  const script = source.slice(start, end);
  const result = await page.evaluate((code) => {
    const rest = new IDEE.layer.XYZ({ name: 'center', url: '/tiles/{z}/{x}/{y}.png' }).getRestLayer();
    const read = new Function('window', `${code}; return { layers, zoom, center };`);
    return { rest, parsed: read({ location: { search: `?layers=${encodeURIComponent(rest)}&zoom=5&center=1,2` } }) };
  }, script);
  expect(result.parsed).toEqual({ layers: [result.rest], zoom: 5, center: [1, 2] });
});

test('Los mapas auxiliares no heredan las capas de la URL del visualizador', async ({ page }) => {
  const result = await page.evaluate(() => {
    const rest = new IDEE.layer.XYZ({ name: 'solo-principal', url: '/tiles/{z}/{x}/{y}.png' }).getRestLayer();
    IDEE.config.MAP_VIEWER_LAYERS = [rest];
    mapjs.addLayers(IDEE.config.MAP_VIEWER_LAYERS);
    const names = [[], undefined].map((layers, index) => {
      const container = document.createElement('div');
      container.id = `auxiliar-${index}`;
      document.body.appendChild(container);
      const auxiliary = IDEE.map({ container: container.id, layers, controls: [] });
      return auxiliary.getLayers().map((layer) => layer.name);
    });
    return { principal: mapjs.getLayers().map((layer) => layer.name), auxiliary: names };
  });
  expect(result.principal).toContain('solo-principal');
  result.auxiliary.forEach((names) => expect(names).not.toContain('solo-principal'));
});

test('Los constructores conservan los booleanos normalizados sin pasar por ShareMap', async ({ page }) => {
  const result = await page.evaluate(() => ['false', false, 'true', true].map((value) => {
    const parameters = { name: 'normalizada', url: '/wms', useCapabilities: false,
      visibility: value, displayInLayerSwitcher: value };
    const layer = new IDEE.layer.WMS(parameters);
    const wmts = IDEE.parameter.layer({ ...parameters, type: 'WMTS', matrixSet: 'EPSG:3857' });
    return { visible: layer.isVisible(), listed: layer.displayInLayerSwitcher,
      wmtsVisible: wmts.visibility, wmtsListed: wmts.displayInLayerSwitcher };
  }));
  expect(result).toEqual([false, false, true, true].map((value) => ({
    visible: value, listed: value, wmtsVisible: value, wmtsListed: value,
  })));
});

test('Reconstruir una capa no añade propiedades a las opciones del llamante', async ({ page }) => {
  const result = await page.evaluate(() => {
    const options = { opacity: 0.2, minZoom: 2 };
    const input = { type: 'XYZ', name: 'opciones', url: '/tiles/{z}/{x}/{y}.png',
      visibility: false, options };
    const layer = mapjs.getLayerByString(input);
    return { options, sameReference: layer.getImpl().options === options,
      visible: layer.isVisible(), opacity: layer.getOpacity() };
  });
  expect(result).toEqual({ options: { opacity: 0.2, minZoom: 2 },
    sameReference: false, visible: false, opacity: 0.2 });
});

test('configuration.js conserva Base64 y URLs posicionales antiguas sin decodificarlas dos veces', async ({ page }) => {
  const source = readFileSync(path.resolve(__dirname, '../../../src/configuration.js'), 'utf8');
  const start = source.indexOf('  const params =');
  const script = source.slice(start, source.indexOf('  /**', start));
  const result = await page.evaluate((code) => {
    const read = new Function('window', `${code}; return { layers, zoom, center };`);
    const base64 = btoa(JSON.stringify({ type: 'FeatureCollection', features: [], name: '~~~' }));
    const old = [`GeoJSON*local*${base64}`, 'GeoJSON*remote*https%3A%2F%2Fexample.test%2Fdata%3Fa%3D1%2C2'];
    const named = 'XYZ*name=center;url=tiles,XYZ*name=zoom;url=tiles';
    return {
      hasPlus: base64.includes('+'), old,
      legacy: read({ location: { search: `?layers=${old.join(',')}&zoom=5` } }),
      named: read({ location: { search: `?layers=${encodeURIComponent(named)}&zoom=5&center=1,2` } }),
      expectedNamed: named.split(','),
      malformed: read({ location: { search: '?layers=XYZ%2Aname%3Dtest%ZZ&zoom=5' } }),
    };
  }, script);
  expect(result.hasPlus).toBe(true);
  expect(result.legacy).toEqual({ layers: result.old, zoom: 5, center: '' });
  expect(result.named).toEqual({ layers: result.expectedNamed, zoom: 5, center: [1, 2] });
  expect(result.malformed.zoom).toBe(5);
});
