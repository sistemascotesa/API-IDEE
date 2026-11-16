/**
 * Páginas de los tests de edición DataIDEE de VectorsManagement. Usan la página de prueba
 * del plugin (servidor de pruebas de Playwright y compilaciones locales, como el resto de
 * tests) y montan lo mismo que las demos manuales de test/demo, sin su servidor.
 */
import { createDataIDEEFake } from '../../demo/dataidee-fake';

export const PAGE = '/src/plugins/vectorsmanagement/test/playwright/ol/vectorsmanagement-ol.html';

/**
 * Ejemplo de edición local (como test/demo/dataidee-demo.js) sobre un servicio DataIDEE en
 * memoria propio del test. El servicio responde en /local/** del origen de la página, así
 * que no hay CORS, y su estado se conserva al recargar.
 * @param {Page} page Página de Playwright.
 * @param {String} [mode='local'] Colección del ejemplo ('local' es la colección demo).
 * @returns {Promise<{fake: Object, reload: Function}>} Servicio y recarga de la página.
 */
export async function openLocalDataIDEE(page, mode = 'local') {
  const fake = createDataIDEEFake();
  // Un test que recorre varios modos abre otro servicio: sustituye al anterior
  await page.unroute('**/local/**');
  await page.route('**/local/**', (route) => {
    const request = route.request();
    const result = fake.handle({
      method: request.method(),
      url: request.url(),
      headers: request.headers(),
      body: request.postData() || '',
    });
    if (result.abort) return route.abort();
    return route.fulfill({ status: result.status, headers: result.headers, body: result.body });
  });
  const open = async () => {
    await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
    await page.evaluate((collectionMode) => {
      IDEE.config('terrain', { ...IDEE.config.terrain, default: '' });
      IDEE.config('baseLayer', []);
      const map = IDEE.map({
        container: 'mapjs',
        projection: 'EPSG:3857',
        bbox: [-500000, -500000, 500000, 500000],
      });
      const collection = collectionMode === 'local' ? 'demo' : collectionMode;
      const layer = new IDEE.layer.DataIDEE({
        url: `${window.location.origin}/local`,
        name: collection,
        legend: `Colección local ${collection}`,
        limit: 250,
      }, {
        bboxStrategy: false,
        editingLimits: {
          pageSize: 2, maxFeatures: 1000, maxCoordinates: 100000, maxBytes: 10 * 1024 * 1024,
        },
        dataideeDefaultProperties: { category: 'demo' },
      });
      map.addLayers(layer);
      map.addPlugin(new IDEE.plugin.VectorsManagement({
        selection: true,
        creation: true,
        edition: true,
        download: false,
        analysis: false,
        style: false,
        help: false,
        addlayer: false,
      }));
      window.dataideeDemo = { map, layer };
    }, mode);
  };
  await open();
  return { fake, reload: open };
}

/**
 * Editor de la colección local:todos_los_tipos de TEUNESCO (como test/demo/teunesco-demo.js,
 * sin la capa base OSM ni el formulario de token). El servicio lo simula el test con
 * page.route antes de abrirla. Espera a que la capa cargue sus 3 entidades.
 * @param {Page} page Página de Playwright.
 */
export async function openTeunesco(page) {
  await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    IDEE.config('terrain', { ...IDEE.config.terrain, default: '' });
    IDEE.config('baseLayer', []);
    IDEE.config('MIN_ZOOM', '');
    IDEE.config('MAX_ZOOM', '');
    const map = IDEE.map({
      container: 'mapjs',
      projection: 'EPSG:3857',
      bbox: ol.proj.transformExtent([-7.35, 38.65, -5.95, 39.75], 'EPSG:4326', 'EPSG:3857'),
    });
    const layer = new IDEE.layer.DataIDEE({
      url: 'https://teunescodes.grupotecopy.es/data-idee-api',
      name: 'local:todos_los_tipos',
      legend: 'Todos los tipos · TEUNESCO',
      limit: 250,
      extract: false,
    }, {
      bboxStrategy: false,
      tokenLocation: 'header',
      editingLimits: {
        pageSize: 1000, maxFeatures: 1000, maxCoordinates: 100000, maxBytes: 10 * 1024 * 1024,
      },
      style: new IDEE.style.Generic({
        point: { radius: 9, fill: { color: '#007f95' }, stroke: { color: '#fff', width: 3 } },
      }),
    });
    map.addLayers(layer);
    const plugin = new IDEE.plugin.VectorsManagement({
      position: 'right',
      collapsed: false,
      selection: true,
      creation: true,
      edition: true,
      addlayer: true,
      style: true,
      analysis: true,
      turf: true,
      download: true,
      help: true,
      snapping: { allLayers: true, intersection: true },
    });
    plugin.minPanelWidth = 360;
    plugin.maxPanelWidth = 440;
    map.addPlugin(plugin);
    window.teunescoDemo = { map, layer, plugin };
  });
  await page.waitForFunction(() => window.teunescoDemo?.layer.getFeatures().length === 3);
}
