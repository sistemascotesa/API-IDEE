import { test, expect } from '@playwright/test';

// Estilo vectorial real: sus teselas se decodifican en el worker de MapLibre
const STYLE_URL = 'https://demotiles.maplibre.org/style.json';

test.describe('IDEE.layer.MapLibre', () => {
  test('carga el worker publicado junto al núcleo y pinta las teselas vectoriales', async ({ page }) => {
    const errors = [];
    const workers = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('worker', (worker) => workers.push(worker.url()));

    await page.goto('/test/playwright/ol/basic-ol.html');
    await page.evaluate(async (url) => {
      window.map = IDEE.map({
        container: 'map',
        projection: 'EPSG:3857*m',
        center: [-411884, 4927603],
        zoom: 3,
      });
      window.maplibre = new IDEE.layer.MapLibre({ name: 'demo', legend: 'Demo', url });
      const style = await fetch(url).then((response) => response.json());
      style.layers = style.layers.filter(({ type }) => type !== 'background');
      window.withoutBackground = new IDEE.layer.MapLibre({
        name: 'sinFondo', legend: 'Sin fondo', maplibrestyle: style,
      }, { disableBackgroundColor: false });
      window.map.addLayers([window.maplibre, window.withoutBackground]);
    }, STYLE_URL);

    const mapLibreMap = (layer) => page.evaluate((name) => {
      const mlMap = window[name].getImpl().getLayer().mapLibreMap;
      return mlMap ? {
        loaded: mlMap.loaded(),
        features: mlMap
          .queryRenderedFeatures().length,
      } : {};
    }, layer);
    await expect.poll(async () => (await mapLibreMap('maplibre')).loaded, { timeout: 30000 }).toBe(true);
    expect((await mapLibreMap('maplibre')).features).toBeGreaterThan(0);
    await expect.poll(async () => (await mapLibreMap('withoutBackground')).loaded, { timeout: 30000 }).toBe(true);
    expect(workers.some((url) => /\/dist\/js\/maplibre-gl-worker\.[0-9a-f]{8}\.js$/.test(url))).toBe(true);
    expect(errors).toEqual([]);
  });
});
