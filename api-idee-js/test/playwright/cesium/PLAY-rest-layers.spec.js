import { test, expect } from '@playwright/test';

test('Cesium conserva el formato WFS y sus parámetros al reconstruir REST', async ({ page }) => {
  await page.goto('/test/playwright/cesium/basic-cesium.html');
  const result = await page.evaluate(() => {
    const layer = new IDEE.layer.WFS({ name: 'cities', namespace: 'ms', url: '/wfs' }, {
      getFeatureOutputFormat: 'geojson', describeFeatureTypeOutputFormat: 'geojson',
      vendor: { getFeature: { count: 10 } },
    });
    const copy = IDEE.Map.prototype.getLayerByString.call({}, layer.getRestLayer());
    return { format: copy.options.getFeatureOutputFormat,
      describe: copy.options.describeFeatureTypeOutputFormat, vendor: copy.options.vendor };
  });
  expect(result).toEqual({ format: 'geojson', describe: 'geojson',
    vendor: { getFeature: { count: 10 } } });
});

test('Cesium reconstruye los valores REST comprimidos sin perder filtros Unicode', async ({ page }) => {
  await page.goto('/test/playwright/cesium/basic-cesium.html');
  const result = await page.evaluate(() => {
    const filter = { op: '=', args: [{ property: 'descripcion' }, 'España; árboles 🌳'.repeat(1000)] };
    const layer = new IDEE.layer.DataIDEE({ name: 'places', url: '/collections/' }, {}, {
      filter, filterLang: 'cql2-json',
    });
    const rest = layer.getRestLayer();
    const copy = IDEE.Map.prototype.getLayerByString.call({}, rest);
    return { compressed: rest.includes('deflate~'), filter, restored: copy.constructorParameters.vendorOpts.filter };
  });
  expect(result.compressed).toBe(true);
  expect(result.restored).toEqual(result.filter);
});

test('Cesium serializa y reconstruye capas 3D y raster', async ({ page }) => {
  await page.goto('/test/playwright/cesium/basic-cesium.html');
  const result = await page.evaluate(() => ['Tiles3D', 'Terrain', 'XYZ', 'WMS', 'DataIDEE'].map((type) => {
    const layer = new IDEE.layer[type]({ name: 'prueba', url: 'http://localhost:8081/resource', visibility: false },
      type === 'Tiles3D' ? { style: { color: "color('red')" } } : {});
    const rest = layer.getRestLayer();
    const copy = IDEE.Map.prototype.getLayerByString.call({}, rest);
    return { type, rest, copy: copy.type,
      style: type === 'Tiles3D' ? copy.getStyle() : undefined };
  }));
  result.forEach(({ type, rest, copy }) => {
    expect(rest.startsWith(`${type}*`)).toBe(true);
    expect(copy).toBe(type);
  });
  expect(result[0].style).toEqual({ color: "color('red')" });
});

test('Cesium convierte GenericRaster WMTS a la fachada WMTS', async ({ page }) => {
  await page.goto('/test/playwright/cesium/basic-cesium.html');
  const result = await page.evaluate(() => {
    const native = new Cesium.ImageryLayer(new Cesium.WebMapTileServiceImageryProvider({
      url: 'http://localhost:8081/wmts', layer: 'imagery', style: 'default',
      tileMatrixSetID: 'EPSG:3857', format: 'image/png',
    }));
    const layer = new IDEE.layer.GenericRaster({ name: 'wmts' }, {}, native);
    const copy = IDEE.Map.prototype.getLayerByString.call({}, layer.getRestLayer());
    return { type: copy.type, name: copy.name, matrixSet: copy.matrixSet };
  });
  expect(result).toEqual({ type: 'WMTS', name: 'imagery', matrixSet: 'EPSG:3857' });
});


test('Matriz de formatos remotos disponibles en Cesium', async ({ page }) => {
  await page.goto('/test/playwright/cesium/basic-cesium.html');
  const errors = await page.evaluate(() => {
    const cases = {
      WMS: { useCapabilities: false }, WMTS: { matrixSet: 'EPSG:3857' },
      WFS: { namespace: 'test', geometry: 'POINT' }, OGCAPIFeatures: {}, DataIDEE: {},
      OSM: {}, XYZ: {}, TMS: {}, GeoJSON: {}, KML: {}, KMZ: {}, GPX: {}, MBTiles: {},
      Tiles3D: {}, Terrain: {},
    };
    return Object.entries(cases).flatMap(([type, params]) => {
      try {
        const layer = new IDEE.layer[type]({
          name: 'prueba', url: 'http://localhost:8081/resource', ...params,
        });
        const copy = IDEE.Map.prototype.getLayerByString.call({}, layer.getRestLayer());
        return copy.type === type ? [] : [`${type}: ${copy.type}`];
      } catch (error) { return [`${type}: ${error.message}`]; }
    });
  });
  expect(errors).toEqual([]);
});
