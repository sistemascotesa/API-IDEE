import { test, expect } from '@playwright/test';

for (const engine of ['ol', 'cesium']) {
  test.describe(`Validación ShareMap ${engine}`, () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/test/playwright/${engine}/basic-${engine}.html`);
      await page.addScriptTag({ url: `/src/plugins/sharemap/dist/sharemap.${engine}.min.js` });
      await page.evaluate(() => {
        IDEE.language.setLang('es');
        IDEE.config.terrain.default = [];
        window.mapjs = IDEE.map({ container: 'map', layers: [], controls: [] });
        const plugin = new IDEE.plugin.ShareMap();
        mapjs.addPlugin(plugin);
        window.control = plugin.getControls()[0];
        window.warnings = [];
        IDEE.toast.error = (message) => warnings.push(message);
      });
    });

    test('Rechaza valores inválidos y objetos que imitan una capa sin ejecutar su método', async ({ page }) => {
      const result = await page.evaluate(() => {
        let calls = 0;
        const impostor = { name: '<b>falsa</b>', type: 'WMS', getRestLayer: () => { calls += 1; return 'WMS*name=falsa'; } };
        const values = [null, undefined, 0, true, 'WMS', Symbol('capa'), {}, Object.create(null), () => {}, impostor];
        const omitted = values.map((value) => control.layerToParam(value) === undefined);
        control.layerToParam(impostor);
        return { omitted, calls, warnings };
      });
      expect(result.omitted.every(Boolean)).toBe(true);
      expect(result.calls).toBe(0);
      expect(result.warnings).toHaveLength(result.omitted.length);
      expect(result.warnings.every((message) => message.startsWith('No se ha podido compartir'))).toBe(true);
      expect(result.warnings.at(-1)).toContain('&lt;b&gt;falsa&lt;&#x2F;b&gt;');
    });

    test('Acepta capas, subclases y el contenedor GeoPackage y delega en getRestLayer', async ({ page }) => {
      const result = await page.evaluate((implementation) => {
        class CustomVector extends IDEE.layer.Vector {}
        const layers = [
          new IDEE.layer.WMS({ name: 'wms', url: '/wms', useCapabilities: false }),
          new CustomVector({ name: 'custom' }),
          new IDEE.layer.GeoPackage({ name: 'paquete', url: '/paquete.gpkg' }),
        ];
        if (implementation === 'ol') layers.push(new IDEE.layer.LayerGroup({ name: 'grupo', layers: [] }));
        let calls = 0;
        const values = layers.map((layer, index) => {
          const rest = `${layer.type}*name=capa_${index}`;
          layer.getRestLayer = () => { calls += 1; return rest; };
          return { expected: rest, actual: control.layerToParam(layer) };
        });
        return { values, calls, warnings, packageIsLayer: layers[2] instanceof IDEE.Layer };
      }, engine);
      expect(result.packageIsLayer).toBe(false);
      expect(result.calls).toBe(result.values.length);
      expect(result.values.every(({ expected, actual }) => actual === expected)).toBe(true);
      expect(result.warnings).toEqual([]);
    });

    test('Mantiene los errores de capas reales y avisa una vez por instancia', async ({ page }) => {
      const result = await page.evaluate(() => {
        const missing = new IDEE.layer.WMS({ name: 'sin-metodo', url: '/wms', useCapabilities: false });
        missing.getRestLayer = undefined;
        const binary = new IDEE.layer.Vector({ name: 'binario-local' });
        binary.getRestLayer = () => { throw new Error('REST_LAYER_LOCAL_BINARY'); };
        const failure = new IDEE.layer.Vector({ name: 'fallo' });
        failure.getRestLayer = () => { throw null; };
        const omitted = [missing, binary, failure].every((layer) => {
          const first = control.layerToParam(layer);
          return control.layerToParam(layer) === undefined && first === undefined;
        });
        return { omitted, warnings };
      });
      expect(result.omitted).toBe(true);
      expect(result.warnings).toHaveLength(3);
      expect(result.warnings[0]).toContain('sin-metodo');
      expect(result.warnings[1]).toContain('el archivo solo existe en este navegador');
      expect(result.warnings[2]).toContain('fallo');
    });

    test('Omite una entrada inválida y conserva las otras capas en el flujo de compartir', async ({ page }) => {
      const result = await page.evaluate(() => {
        const layer = new IDEE.layer.WMS({ name: 'valida', url: '/wms', useCapabilities: false,
          isBase: false, displayInLayerSwitcher: true });
        const invalid = { name: 'invalida', type: 'WMS', isBase: false, displayInLayerSwitcher: true,
          getRestLayer: () => { throw new Error('No debe ejecutarse'); } };
        control.getOverlayCandidates_ = () => [invalid, layer];
        const expected = layer.getRestLayer();
        const rest = control.getLayersInLayerswitcher();
        control.getLayersInLayerswitcher();
        return { rest, expected, warnings };
      });
      expect(result.rest).toEqual([result.expected]);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('invalida');
    });
  });
}
