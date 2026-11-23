import { test, expect } from '@playwright/test';
import { PAGE } from './dataidee-pages';

/**
 * Colecciones del servicio simulado: identificador OGC → leyenda y registro de la API de
 * mantenimiento (sin writable, la colección no tiene registro). Solo writable decide los
 * permisos: idGenerated no los cambia.
 */
const LAYERS = {
  'local:escritura': { legend: 'Escritura', writable: true, idGenerated: true },
  'externa:estaciones': { legend: 'Estaciones', writable: true, idGenerated: false },
  'nuts:lectura': { legend: 'Solo lectura', writable: false, idGenerated: true },
  'local:sin_registro': { legend: 'Sin registro' },
};

const CONFORMANCE = [
  'http://www.opengis.net/spec/ogcapi-features-1/1.0/conf/core',
  'http://www.opengis.net/spec/ogcapi-features-4/1.0/conf/create-replace-delete',
  'http://www.opengis.net/spec/ogcapi-features-4/1.0/conf/update',
];

const SCHEMA = {
  type: 'object',
  properties: {
    id: { type: 'integer', readOnly: true, 'x-ogc-role': 'id' },
    geometry: { format: 'geometry-point', 'x-ogc-role': 'primary-geometry' },
    name: { type: 'string' },
  },
};

const FEATURES = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature', id: 1, properties: { name: 'Punto' }, geometry: { type: 'Point', coordinates: [0, 0] },
  }],
};

/**
 * Servicio DataIDEE simulado en el mismo origen que la página, como el real: la API OGC
 * en /svc/ogc (sin descripción OpenAPI, así que las capacidades salen de la conformidad) y
 * la API de mantenimiento en /svc/collections, que filtra por nombre con q y resuelve el
 * origen con d=1. Devuelve las consultas a la API de mantenimiento.
 * @param {Page} page Página de Playwright.
 * @param {Object} [options]
 * @param {Number} [options.maintenanceStatus=200] Código de la API de mantenimiento.
 * @returns {Promise<Array<Object>>} Consultas: { q, d, authorization }.
 */
const mockService = async (page, { maintenanceStatus = 200 } = {}) => {
  const maintenance = [];
  await page.route('**/svc/**', (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = decodeURIComponent(url.pathname);
    const json = (status, body, type = 'application/json') => route.fulfill({
      status, headers: { 'content-type': type }, body: JSON.stringify(body),
    });
    if (path === '/svc/collections') {
      maintenance.push({
        q: url.searchParams.get('q'),
        d: url.searchParams.get('d'),
        authorization: request.headers().authorization,
      });
      if (maintenanceStatus !== 200) return json(maintenanceStatus, {});
      const { name } = JSON.parse(url.searchParams.get('q') || '{}');
      const data = Object.entries(LAYERS)
        .filter(([id, layer]) => layer.writable !== undefined && id.split(':')[1] === name)
        .map(([id, layer]) => ({
          id: `uuid-${id}`,
          name,
          source: { name: id.split(':')[0] },
          writable: layer.writable,
          idGenerated: layer.idGenerated,
        }));
      return json(200, { data, count: data.length });
    }
    if (path === '/svc/ogc/') return json(200, { links: [] });
    if (path === '/svc/ogc/conformance') return json(200, { conformsTo: CONFORMANCE });
    const match = path.match(/^\/svc\/ogc\/collections\/([^/]+)(\/[a-z]+)?$/);
    if (match && LAYERS[match[1]]) {
      const [, id, resource = ''] = match;
      if (resource === '') return json(200, { id, title: LAYERS[id].legend, links: [] });
      if (resource === '/schema') return json(200, SCHEMA, 'application/schema+json');
      if (resource === '/queryables') {
        return json(200, { type: 'object', properties: {} }, 'application/schema+json');
      }
      if (resource === '/items') return json(200, FEATURES, 'application/geo+json');
    }
    return json(404, {});
  });
  return maintenance;
};

/**
 * Abre un mapa con una capa DataIDEE por colección (en /svc/ogc) y VectorsManagement,
 * elige la capa de la colección indicada y espera a que el plugin conozca sus permisos.
 * @param {Page} page Página de Playwright.
 * @param {String} collection Identificador OGC de la colección.
 * @param {String} [token] Token de la capa elegida.
 */
const openCollection = async (page, collection, token) => {
  await page.goto(PAGE, { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ layers, selected, layerToken }) => {
    IDEE.config('terrain', { ...IDEE.config.terrain, default: '' });
    IDEE.config('baseLayer', []);
    const map = IDEE.map({
      container: 'mapjs',
      projection: 'EPSG:3857',
      bbox: [-500000, -500000, 500000, 500000],
    });
    const dataideeLayers = Object.entries(layers).map(([name, { legend }]) => {
      const layer = new IDEE.layer.DataIDEE({
        url: `${window.location.origin}/svc/ogc`, name, legend, limit: 250,
      }, { bboxStrategy: false });
      if (name === selected && layerToken) layer.setToken(layerToken);
      map.addLayers(layer);
      return layer;
    });
    map.addPlugin(new IDEE.plugin.VectorsManagement({
      collapsed: false, selection: true, creation: true, edition: true,
    }));
    window.writableDemo = {
      map, layer: dataideeLayers.find((layer) => layer.name === selected),
    };
  }, { layers: LAYERS, selected: collection, layerToken: token });
  await page.locator('#m-vectorsmanagement-layer-selector').click();
  await page.locator('#m-vectorsmanagement-layer-selector-options span', {
    hasText: LAYERS[collection].legend,
  }).click();
  await page.waitForFunction(() => Boolean(window.writableDemo.map
    .getPlugins('vectorsmanagement')[0].controls[0].getEditingCapabilities()));
};

/** Comprueba si «Crear» y «Editar» se ven (y entonces están habilitados) o no. */
const expectButtons = (page, { creation, edition }) => Promise.all(
  [['creation', creation], ['edition', edition]].map(async ([id, visible]) => {
    const button = page.locator(`#m-vectorsmanagement-${id}`);
    if (!visible) return expect(button).toBeHidden();
    await expect(button).toBeVisible();
    return expect(button).toBeEnabled();
  }),
);

[
  ['local:escritura', { creation: true, edition: true }],
  ['externa:estaciones', { creation: true, edition: true }],
  ['nuts:lectura', { creation: false, edition: true }],
  ['local:sin_registro', { creation: true, edition: true }],
].forEach(([collection, buttons]) => {
  test(`«Crear» y «Editar» siguen el registro de mantenimiento de ${collection}`, async ({ page }) => {
    const maintenance = await mockService(page);
    await openCollection(page, collection);

    await expectButtons(page, buttons);
    const name = collection.split(':')[1];
    expect(maintenance.filter((query) => query.q === JSON.stringify({ name })))
      .toEqual([{ q: JSON.stringify({ name }), d: '1', authorization: undefined }]);
  });
});

test('La consulta a la API de mantenimiento lleva el token de la capa', async ({ page }) => {
  const maintenance = await mockService(page);
  await openCollection(page, 'nuts:lectura', 'token-de-prueba');

  await expectButtons(page, { creation: false, edition: true });
  expect(maintenance.find((query) => query.q === JSON.stringify({ name: 'lectura' }))?.authorization)
    .toBe('Bearer token-de-prueba');
});

test('En una colección de solo lectura, «Editar» abre sin sesión y el formulario solo muestra los atributos', async ({ page }) => {
  await mockService(page);
  await openCollection(page, 'nuts:lectura');
  await page.waitForFunction(() => window.writableDemo.layer.getFeatures().length === 1);
  await page.locator('#m-vectorsmanagement-edition').click();

  await expect(page.locator('#editattribute')).toBeVisible();
  await expect(page.locator('#m-vectorsmanagement-editing')).toHaveCount(0);
  await Promise.all(['#edit', '#holedrawing', '#rotatedrawing', '#scaledrawing', '#movedrawing', '#cleanAll']
    .map((selector) => expect(page.locator(selector)).toBeHidden()));

  const pixel = await page.evaluate(() => {
    const map = window.writableDemo.map.getMapImpl();
    const bounds = map.getTargetElement().getBoundingClientRect();
    const feature = window.writableDemo.layer.getFeatures()[0].getImpl().getFeature();
    const point = map.getPixelFromCoordinate(feature.getGeometry().getCoordinates());
    return [bounds.left + point[0], bounds.top + point[1]];
  });
  await page.mouse.click(pixel[0], pixel[1]);
  await expect(page.locator('#editattribute')).toBeEnabled();
  await page.locator('#editattribute').click();

  const form = page.locator('.m-vectorsmanagement-dataidee-fields');
  const name = form.locator('[data-value-path="/name"]');
  await expect(form).toBeVisible();
  await expect(name).toHaveValue('Punto');
  await expect(name).toHaveAttribute('readonly', '');
  await expect(page.locator('.m-vectorsmanagement-dataidee-legend'))
    .toHaveText('Colección de solo lectura: los atributos solo se pueden consultar.');
  await expect(page.locator('#m-vectorsmanagement-dataidee-apply')).toHaveCount(0);
  await expect(page.locator('#m-vectorsmanagement-dataidee-cancel')).toHaveText('Cerrar');
  await page.locator('#m-vectorsmanagement-dataidee-cancel').click();
  await expect(form).toBeHidden();
  expect(await page.evaluate(() => window.writableDemo.layer.getEditingSession())).toBeNull();
});

test('Si la API de mantenimiento falla, los permisos son los de siempre', async ({ page }) => {
  const maintenance = await mockService(page, { maintenanceStatus: 500 });
  await openCollection(page, 'nuts:lectura');

  await expectButtons(page, { creation: true, edition: true });
  expect(maintenance.length).toBeGreaterThan(0);
});
