import { test, expect } from '@playwright/test';

const PAGES = {
  ol: '/test/playwright/ol/basic-ol.html',
  cesium: '/test/playwright/cesium/basic-cesium.html',
};
const WAIT = { timeout: 25000 };

const GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature', id: 'p1', geometry: { type: 'Point', coordinates: [-3.7, 40.4] }, properties: { nombre: 'Uno' },
    },
    {
      type: 'Feature', id: 'p2', geometry: { type: 'Point', coordinates: [-3.6, 40.5] }, properties: { nombre: 'Dos' },
    },
  ],
};

const FILES = {
  kml: '/test/playwright/fixtures/kmz/basic.kml',
  kmz: '/test/playwright/fixtures/kmz/basic.kmz',
  gpx: '/test/development/CP-0002-layers/fixtures/CP-035.gpx',
};

const toDegrees = ([x, y], projection) => (projection === 'EPSG:3857'
  ? [(x / 20037508.342789244) * 180,
    (Math.atan(Math.exp(y / 6378137)) * 360) / Math.PI - 90]
  : [x, y]);

/**
 * Carga de ficheros locales con IDEE.loadFiles, común a OL y Cesium: KML, KMZ y GPX
 * crean su capa nativa (el KML conserva sus estilos) y GeoPackage, el paquete completo.
 * @param {String} engine 'ol' o 'cesium'.
 */
export default function registerLoadFilesTests(engine) {
  test.describe(`IDEE.loadFiles (${engine})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(PAGES[engine]);
      await page.evaluate(() => {
        IDEE.config.baseLayer = [];
        if (IDEE.config.terrain) IDEE.config.terrain.default = [];
        window.map = IDEE.map({
          container: 'map', controls: [], layers: [], center: [-3.7, 40.4], zoom: 6,
        });
      });
    });

    [
      ['geojson', 'Vector', 2],
      ['kml', 'KML', 1],
      ['kmz', 'KMZ', 1],
      ['gpx', 'GPX', 3],
    ].forEach(([ext, type, minFeatures]) => {
      test(`un fichero ${ext} se carga como capa ${type}`, async ({ page }) => {
        await page.evaluate(async ({ fileExt, path, inline }) => {
          let source = inline;
          if (!source) {
            const response = await fetch(path);
            source = fileExt === 'kmz' ? await response.arrayBuffer() : await response.text();
          }
          await IDEE.loadFiles.loadFeaturesFromSource(window.map, source, `fichero_${fileExt}`, fileExt);
        }, { fileExt: ext, path: FILES[ext], inline: ext === 'geojson' ? JSON.stringify(GEOJSON) : null });
        const layerName = `fichero_${ext}`;
        await expect.poll(() => page.evaluate((name) => {
          const layer = window.map.getLayers().find((l) => l.name === name);
          return layer ? layer.getFeatures().length : 0;
        }, layerName), WAIT).toBeGreaterThanOrEqual(minFeatures);
        expect(await page.evaluate((name) => window.map.getLayers()
          .find((l) => l.name === name).type, layerName)).toBe(type);
        const { coordinate, projection } = await page.evaluate((name) => {
          const first = (coords) => (typeof coords[0] === 'number' ? coords : first(coords[0]));
          return {
            coordinate: first(window.map.getLayers().find((l) => l.name === name)
              .getFeatures()[0].getGeometry().coordinates),
            projection: window.map.getProjection().code,
          };
        }, layerName);
        const [lon, lat] = toDegrees(coordinate, projection);
        expect(lon).toBeGreaterThan(-10);
        expect(lon).toBeLessThan(5);
        expect(lat).toBeGreaterThan(35);
        expect(lat).toBeLessThan(44);
        if (engine === 'cesium' && ext === 'kml') {
          const image = await page.evaluate((name) => {
            const layer = window.map.getLayers().find((l) => l.name === name);
            const entity = layer.getImpl().getLayer().entities.values.find((e) => e.billboard);
            return entity?.billboard.image?.getValue(window.Cesium.JulianDate.now())?.toString();
          }, layerName);
          expect(image).toMatch(/^data:image\/png/);
        }
        expect(await page.locator('div.m-dialog.error').count()).toBe(0);
      });
    });

    test('un GeoPackage local se carga completo, con sus tablas vectoriales y de teselas', async ({ page }) => {
      await page.evaluate(async () => {
        const bytes = await (await fetch('/test/development/CP-0002-layers/data/geopackage-mixed.gpkg')).arrayBuffer();
        IDEE.loadFiles.addFileToMap(window.map, new File([bytes], 'mixto.gpkg'));
      });
      await expect.poll(() => page.evaluate(() => {
        const [geopackage] = window.map.geopackages || [];
        return geopackage ? geopackage.getLayers().map((layer) => layer.type).sort() : [];
      }), WAIT).toEqual(expect.arrayContaining(['GeoPackageTile']));
      const types = await page.evaluate(() => window.map.geopackages[0].getLayers()
        .map((layer) => layer.type));
      expect(types.some((type) => type !== 'GeoPackageTile')).toBe(true);
      expect(await page.evaluate(() => window.map.geopackages[0].name)).toBe('mixto');
      expect(await page.locator('div.m-dialog.error').count()).toBe(0);
    });
  });
}
