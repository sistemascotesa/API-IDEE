import { test, expect } from '@playwright/test';
import { prepareGeoPackagePage } from '../ol/fixtures/geopackage';

/**
 * Pruebas de GeoPackage en la configuración JSON con estilos IDEE.style, comunes a OL y
 * Cesium.
 * @param {String} engine 'ol' o 'cesium'.
 */
export default function registerGeoPackageStyleTests(engine) {
  test.describe(`GeoPackage con IDEE.style (${engine})`, () => {
    test.beforeEach(async ({ page }) => {
      await prepareGeoPackagePage(page, { engine });
      await page.evaluate(() => {
        window.createStyles = () => ({
          common: new IDEE.style.Generic({
            point: { radius: 5, fill: { color: '#00ff00' } },
            line: { stroke: { color: '#ff00ff', width: 3 } },
          }),
          category: new IDEE.style.Category('title', {
            Origen: new IDEE.style.Point({ radius: 8, fill: { color: '#0000ff' } }),
          }),
        });
        window.mapWith = async (layer) => {
          window.map = IDEE.map({
            container: 'map', controls: [], center: [0, 0], zoom: 2, layers: [layer],
          });
          const gpkg = window.map.geopackages[0];
          await gpkg.whenReady();
          await new Promise((resolve) => { setTimeout(resolve, 0); });
          return gpkg;
        };
        window.styleOf = (layer) => {
          const style = layer.getStyle();
          return style ? { type: style.constructor.name, serialized: style.serialize() } : null;
        };
        window.tableStyles = () => {
          const gpkg = window.map.geopackages[0];
          const places = gpkg.getLayer('places').getStyle();
          const routes = gpkg.getLayer('routes').getStyle();
          return {
            places: places instanceof IDEE.style.Category ? places.serialize() : null,
            routes: routes instanceof IDEE.style.Generic ? routes.serialize() : null,
          };
        };
      });
    });

    test('configuración JSON con instancias de estilo comunes y por tabla', async ({ page }) => {
      const expected = await page.evaluate(async () => {
        const { common, category } = window.createStyles();
        await window.mapWith({
          type: 'GeoPackage',
          url: '/fixtures/geopackage/multivector.gpkg',
          name: 'm',
          style: common,
          tables: { places: { style: category } },
        });
        return { common: common.serialize(), category: category.serialize() };
      });
      await expect.poll(() => page.evaluate(() => window.tableStyles()))
        .toEqual({ places: expected.category, routes: expected.common });
    });

    test('configuración JSON con estilos serializados', async ({ page }) => {
      const expected = await page.evaluate(async () => {
        const { common, category } = window.createStyles();
        await window.mapWith({
          type: 'GeoPackage',
          url: '/fixtures/geopackage/multivector.gpkg',
          name: 'm',
          options: {
            style: common.serialize(),
            tables: { places: { style: category.serialize() } },
          },
        });
        return { common: common.serialize(), category: category.serialize() };
      });
      await expect.poll(() => page.evaluate(() => window.tableStyles()))
        .toEqual({ places: expected.category, routes: expected.common });
    });

    test('toJSON y el constructor conservan los estilos, también Proportional y Cluster', async ({ page }) => {
      const prepared = await page.evaluate(async () => {
        const proportional = new IDEE.style.Proportional(
          'id',
          4,
          12,
          new IDEE.style.Point({ fill: { color: '#ff8800' } }),
        );
        const cluster = new IDEE.style.Cluster({ animated: false, distance: 40 });
        window.original = await window.mapWith({
          type: 'GeoPackage',
          url: '/fixtures/geopackage/bbox.gpkg',
          name: 'b',
          style: proportional,
          tables: { places: { predefinedStyles: [cluster] } },
        });
        const json = window.original.toJSON();
        window.json = json;
        window.restored = new IDEE.layer.GeoPackage(json);
        const loaded = new Promise((resolve) => { window.restored.once(IDEE.evt.LOAD_LAYERS, resolve); });
        window.map.addLayers(window.restored);
        await loaded;
        return {
          jsonStyle: typeof json.options.style,
          jsonPredefined: json.options.tables.places.predefinedStyles.map((style) => typeof style),
          expected: { style: proportional.serialize(), cluster: cluster.serialize() },
          sameJSON: JSON.stringify(window.restored.toJSON().options) === JSON.stringify(json.options),
        };
      });
      const describe = (name) => page.evaluate((key) => {
        const layer = window[key].getLayer('places');
        return {
          style: layer.getStyle()?.serialize(),
          predefined: (layer.predefinedStyles || []).map((style) => (
            typeof style === 'string' ? style : style.serialize()
          )),
        };
      }, name);

      expect(prepared.jsonStyle).toBe('string');
      expect(prepared.jsonPredefined).toEqual(['string']);
      expect(prepared.sameJSON).toBe(true);
      await expect.poll(async () => (await describe('original')).style).toBe(prepared.expected.style);
      await expect.poll(async () => (await describe('restored')).style).toBe(prepared.expected.style);
      const restored = await describe('restored');
      expect(restored.predefined).toContain(prepared.expected.cluster);
      expect(restored.predefined).toEqual((await describe('original')).predefined);
    });

    test('estilos predefinidos del visualizador en la configuración JSON', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { common, category } = window.createStyles();
        const gpkg = await window.mapWith({
          type: 'GeoPackage',
          url: '/fixtures/geopackage/vector.gpkg',
          name: 'v',
          style: common,
          predefinedStyles: [common, category],
        });
        const layer = gpkg.getLayer('places');
        return {
          predefined: layer.predefinedStyles.map((style) => style.serialize()),
          expected: [common.serialize(), category.serialize()],
          optionsUntouched: gpkg.options.predefinedStyles.length,
        };
      });
      expect(result.predefined).toEqual(expect.arrayContaining(result.expected));
      expect(result.optionsUntouched).toBe(2);
    });

    test('la cadena REST conserva los estilos por tabla', async ({ page }) => {
      const result = await page.evaluate(async () => {
        const { common, category } = window.createStyles();
        const original = await window.mapWith({
          type: 'GeoPackage',
          url: '/fixtures/geopackage/multivector.gpkg',
          name: 'm',
          style: common,
          tables: { places: { style: category } },
        });
        const rest = original.getRestLayer();
        window.map.removeGeoPackage(original);
        window.map.addLayers(rest);
        const restored = window.map.geopackages[window.map.geopackages.length - 1];
        await restored.whenReady();
        window.restored = restored;
        return { common: common.serialize(), category: category.serialize() };
      });
      await expect.poll(() => page.evaluate(() => ({
        places: window.restored.getLayer('places').getStyle()?.serialize(),
        routes: window.restored.getLayer('routes').getStyle()?.serialize(),
      }))).toEqual({ places: result.category, routes: result.common });
    });
  });
}
