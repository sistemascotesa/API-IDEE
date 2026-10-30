import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/test/playwright/cesium/basic-cesium.html');
  await page.addScriptTag({ url: '/src/plugins/backimglayer/dist/backimglayer.cesium.min.js' });
  await page.addScriptTag({ url: '/src/plugins/sharemap/dist/sharemap.cesium.min.js' });
  await page.evaluate(() => {
    IDEE.config.terrain.default = [];
    window.base = (name) => new IDEE.layer.XYZ({
      name, url: `/tiles/${name}/{z}/{x}/{y}.png`, isBase: true,
    });
    window.createMap = (baseLayer) => {
      const div = document.createElement('div');
      div.id = `map-${document.querySelectorAll('.test-map').length}`;
      div.className = 'test-map';
      div.style.cssText = 'width:600px;height:300px';
      document.body.appendChild(div);
      return IDEE.map({ container: div.id, layers: [], controls: [], baseLayer });
    };
  });
});

test('Cesium restaura un fondo sin alterar otro mapa y devuelve undefined si no hay fondo', async ({ page }) => {
  const result = await page.evaluate(() => {
    const first = createMap(base('image').getRestLayer());
    const empty = createMap();
    return { first: first.getActiveBaseLayers().map((layer) => layer.name),
      empty: empty.getRestBaseLayer(), rest: first.getRestBaseLayer() };
  });
  expect(result.first).toEqual(['image']);
  expect(result.empty).toBeUndefined();
  expect(result.rest).toContain('name=image;');
});

test('Cesium conserva las piezas del fondo de BackImgLayer y permite cambiarlas', async ({ page }) => {
  await page.evaluate(() => {
    window.mapjs = createMap();
    window.catalog = () => [
      { id: 'hybrid', title: 'Híbrido', layers: [base('image'), base('labels')] },
      { id: 'street', title: 'Callejero', layers: [base('street')] },
    ];
    mapjs.addPlugin(new IDEE.plugin.BackImgLayer({ collapsed: false, layerOpts: catalog() }));
  });
  await expect(page.locator('#backimglayer-layer-hybrid')).toHaveClass(/m-backimglayer-active/);
  const result = await page.evaluate(() => {
    const rest = mapjs.getRestBaseLayer();
    window.copy = createMap(rest);
    copy.addPlugin(new IDEE.plugin.BackImgLayer({ collapsed: false, layerOpts: catalog() }));
    const share = new IDEE.plugin.ShareMap({ shareLayer: true });
    copy.addPlugin(share);
    return { rest, names: copy.getActiveBaseLayers().map((layer) => layer.name),
      overlays: share.getControls()[0].getLayers() };
  });
  expect(result.rest).toMatch(/^LayerGroup\*/);
  expect(result.names).toEqual(['image', 'labels']);
  expect(result.overlays).toEqual([]);
  await expect(page.locator('#map-1 #backimglayer-layer-hybrid')).toHaveClass(/m-backimglayer-active/);
  await page.locator('#map-1 #backimglayer-layer-street').click();
  expect(await page.evaluate(() => copy.getActiveBaseLayers().map((layer) => layer.name))).toEqual(['street']);
  expect(await page.evaluate(() => copy.getLayers().some((layer) => ['image', 'labels'].includes(layer.name)))).toBe(false);
});
