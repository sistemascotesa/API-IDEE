import { test, expect } from '@playwright/test';
import fixture from './fixtures/teunesco-todos-los-tipos';

const demoUrl = 'http://127.0.0.1:8787/teunesco.html';
const serviceUrl = 'https://teunescodes.grupotecopy.es/data-idee-api';
const collectionPath = '/collections/local:todos_los_tipos';

// The public collection contract is recorded in the fixture. Every API request is
// intercepted, including writes: these tests never modify the TEUNESCO service.
async function mockService(page, geometryType) {
  const features = structuredClone(fixture.items.features);
  const schema = structuredClone(fixture.schema);
  if (geometryType) {
    schema.properties.punto.format = `geometry-${geometryType.toLowerCase()}`;
    features.forEach((feature, index) => {
      const point = feature.geometry.coordinates;
      const next = [point[0] + 0.01, point[1] + 0.01];
      const line = [point, next];
      const ring = [point, next, [point[0], next[1]], point];
      const coordinates = {
        Point: point,
        MultiPoint: [point, next],
        LineString: line,
        MultiLineString: [line],
        Polygon: [ring],
        MultiPolygon: [[ring]],
      }[geometryType];
      features[index] = { ...feature, geometry: { type: geometryType, coordinates } };
    });
  }
  const writes = [];
  let version = 1;
  await page.route('https://tile.openstreetmap.org/**', (route) => route.fulfill({
    contentType: 'image/png',
    body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN1cAAAAASUVORK5CYII=', 'base64'),
  }));
  await page.route('https://teunescodes.grupotecopy.es/**', async (route) => {
    const request = route.request();
    const path = decodeURIComponent(new URL(request.url()).pathname)
      .replace('/data-idee-api', '').replace(/\/$/, '');
    const headers = {
      'access-control-allow-origin': '*',
      'access-control-expose-headers': 'ETag',
      'content-type': 'application/json',
      etag: `"${version}"`,
    };
    let body;
    if (request.method() === 'GET') {
      if (path === '') body = { links: [{ rel: 'service-desc', href: `${serviceUrl}/api` }] };
      else if (path === '/api') body = fixture.api;
      else if (path === '/conformance') body = { conformsTo: [] };
      else if (path === collectionPath) body = fixture.collection;
      else if (path === `${collectionPath}/schema`) body = schema;
      else if (path === `${collectionPath}/queryables`) body = fixture.queryables;
      else if (path === `${collectionPath}/items`) body = { type: 'FeatureCollection', features, links: [] };
      else if (path.startsWith(`${collectionPath}/items/`)) {
        body = features.find((feature) => String(feature.id) === path.split('/').at(-1));
      }
    } else if (request.method() === 'PUT' && path === `${collectionPath}/items/1`) {
      const feature = request.postDataJSON();
      writes.push({ feature, headers: request.headers(), method: request.method() });
      if (feature.type !== 'Feature' || !feature.geometry || !feature.properties
        || fixture.schema.required.some((name) => !Object.hasOwn(feature.properties, name))) {
        await route.fulfill({ status: 422, headers, body: '{}' });
        return;
      }
      if (request.headers()['if-match'] !== `"${version}"`) {
        await route.fulfill({ status: 412, headers, body: '{}' });
        return;
      }
      features[features.findIndex((item) => item.id === 1)] = feature;
      version += 1;
      await route.fulfill({ status: 204, headers: { ...headers, etag: `"${version}"` } });
      return;
    }
    await route.fulfill({ status: body ? 200 : 404, headers, body: JSON.stringify(body || {}) });
  });
  return { features, schema, writes };
}

async function openEditor(page, tool = 'edition') {
  await page.goto(demoUrl);
  await expect(page.locator('#teunesco-status')).toContainText('3 entidades cargadas');
  await expect(page.locator('#m-vectorsmanagement-layer-selector-options')).toBeHidden();
  await page.locator('#m-vectorsmanagement-layer-selector').click();
  await page.locator('#m-vectorsmanagement-layer-selector-options span')
    .filter({ hasText: 'Todos los tipos' }).click();
  // Opening Creation or Edition starts the session; Edition also selects features
  await page.locator(`#m-vectorsmanagement-${tool}`).click();
  await expect(page.locator('#m-vectorsmanagement-editing-save')).toBeEnabled();
}

async function featurePixel(page) {
  return page.evaluate(() => {
    const { map, layer } = window.teunescoDemo;
    const native = map.getMapImpl();
    const bounds = native.getTargetElement().getBoundingClientRect();
    const feature = layer.getFeatures().find((item) => item.getId() === 1);
    const pixel = native.getPixelFromCoordinate(feature.getImpl().getFeature()
      .getGeometry().getCoordinates());
    return [bounds.left + pixel[0], bounds.top + pixel[1]];
  });
}

async function openAttributeForm(page) {
  await openEditor(page);
  await page.mouse.click(...await featurePixel(page));
  await expect.poll(() => page.evaluate(() => (
    window.teunescoDemo.plugin.controls[0].getSelectedFeatures().length
  ))).toBe(1);
  await page.locator('#editattribute').click();
  return page.locator('.m-vectorsmanagement-dataidee-fields');
}

const fieldError = (form, path) => form.locator(`[data-field-path="${path}"] .m-vectorsmanagement-dataidee-error`);
const fieldWarning = (form, path) => form.locator(`[data-field-path="${path}"] .m-vectorsmanagement-dataidee-warning`);
const pendingChanges = (page) => page.evaluate(() => (
  window.teunescoDemo.layer.getEditingSession().count
));

test('TEUNESCO editor stages geometry and typed attributes together and retains secondary geometries', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const { features, writes } = await mockService(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openEditor(page);
  await Promise.all(['selection', 'creation', 'edition', 'style', 'analysis', 'turf', 'download', 'help']
    .map((tool) => expect(page.locator(`#m-vectorsmanagement-${tool}`)).toBeVisible()));
  await expect(page.locator('#layerdrawing')).toBeVisible();
  const pixel = await featurePixel(page);
  await page.mouse.click(...pixel);
  await expect.poll(() => page.evaluate(() => (
    window.teunescoDemo.plugin.controls[0].getSelectedFeatures().length
  ))).toBe(1);
  await page.locator('#movedrawing').click();
  await page.evaluate(() => window.teunescoDemo.map.getMapImpl().renderSync());
  const dragPixel = await featurePixel(page);
  await page.mouse.move(...dragPixel);
  await page.mouse.down();
  await page.mouse.move(dragPixel[0] + 40, dragPixel[1] - 25, { steps: 10 });
  await page.mouse.up();
  await expect.poll(() => page.evaluate(() => (
    window.teunescoDemo.layer.getEditingSession().count
  ))).toBe(1);
  await page.locator('#editattribute').click();
  const form = page.locator('.m-vectorsmanagement-dataidee-fields');
  await expect(form.locator('[data-value-path="/nombre"]')).toHaveValue('Mérida');
  const geometryFields = Object.entries(fixture.schema.properties)
    .filter(([, schema]) => schema.format?.startsWith('geometry-'))
    .map(([name]) => name);
  await Promise.all(geometryFields.map((name) => (
    expect(form.locator(`[data-field-path="/${name}"]`)).toHaveCount(0)
  )));
  await expect(form.locator('[data-value-path="/entero_corto"] option')).toHaveText(['Sin definir', '1', '2', '3']);
  await form.locator('[data-value-path="/nombre"]').fill('Mérida editada');
  await form.locator('[data-value-path="/entero"]').fill('60001');
  await form.locator('[data-value-path="/booleano"]').uncheck();
  await form.locator('[data-value-path="/entero_corto"]').selectOption('2');
  await page.locator('#m-vectorsmanagement-dataidee-apply').click();
  await expect(form).toBeHidden();
  await expect.poll(() => page.evaluate(() => (
    window.teunescoDemo.layer.getEditingSession().count
  ))).toBe(1);
  await page.locator('#m-vectorsmanagement-editing-save').click();
  await expect(page.locator('#m-vectorsmanagement-editing-status')).toContainText('Guardadas 1');
  expect(writes).toHaveLength(1);
  expect(writes[0].method).toBe('PUT');
  expect(writes[0].feature).toMatchObject({ type: 'Feature', id: 1 });
  expect(writes[0].feature.properties).toEqual({
    ...fixture.items.features[0].properties,
    nombre: 'Mérida editada',
    entero: 60001,
    booleano: false,
    entero_corto: 2,
  });
  expect(writes[0].feature.geometry.type).toBe('Point');
  expect(writes[0].feature.geometry.coordinates)
    .not.toEqual(fixture.items.features[0].geometry.coordinates);
  expect(writes[0].headers['content-type']).toBe('application/geo+json');
  expect(writes[0].headers['if-match']).toBe('"1"');
  geometryFields.filter((name) => name !== 'punto').forEach((name) => {
    expect(features[0].properties[name]).toEqual(fixture.items.features[0].properties[name]);
  });
  expect(features[0].properties.fecha_hora_zona)
    .toBe(fixture.items.features[0].properties.fecha_hora_zona);
  await page.reload();
  await expect(page.locator('#teunesco-status')).toContainText('3 entidades cargadas');
  const saved = await page.evaluate(() => window.teunescoDemo.layer.getFeatures()
    .find((feature) => feature.getId() === 1).getAttributes());
  expect(saved).toMatchObject({
    nombre: 'Mérida editada', entero: 60001, booleano: false, entero_corto: 2,
  });
  expect(errors).toEqual([]);
});

test('TEUNESCO form opens and cancels without a false dirty prompt, and fits a narrow viewport', async ({ page }) => {
  await mockService(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openEditor(page);
  await page.mouse.click(...await featurePixel(page));
  await expect.poll(() => page.evaluate(() => (
    window.teunescoDemo.plugin.controls[0].getSelectedFeatures().length
  ))).toBe(1);
  await page.locator('#editattribute').click();
  const prompts = [];
  page.on('dialog', async (dialog) => { prompts.push(dialog.message()); await dialog.dismiss(); });
  await page.locator('#m-vectorsmanagement-dataidee-cancel').click();
  await expect(page.locator('.m-vectorsmanagement-dataidee-fields')).toBeHidden();
  expect(prompts).toEqual([]);
  await page.locator('#editattribute').click();
  await page.setViewportSize({ width: 390, height: 844 });
  const modal = page.getByRole('dialog', { name: /Atributos de entidad/ });
  await expect(modal).toBeVisible();
  await expect(page.locator('#m-vectorsmanagement-dataidee-apply')).toBeInViewport();
  await expect(page.locator('#m-vectorsmanagement-dataidee-cancel')).toBeInViewport();
  await page.screenshot({ path: test.info().outputPath('teunesco-mobile-form.png') });
  const bounds = await page.evaluate(() => ({
    width: window.innerWidth, document: document.documentElement.scrollWidth,
  }));
  expect(bounds.document).toBeLessThanOrEqual(bounds.width);
  await page.locator('[data-value-path="/nombre"]').focus();
  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
  expect(prompts).toEqual([]);
});

test('TEUNESCO form asks in an API dialog before discarding unapplied changes', async ({ page }) => {
  await mockService(page);
  await openEditor(page);
  await page.mouse.click(...await featurePixel(page));
  await expect.poll(() => page.evaluate(() => (
    window.teunescoDemo.plugin.controls[0].getSelectedFeatures().length
  ))).toBe(1);
  await page.locator('#editattribute').click();
  const prompts = [];
  page.on('dialog', async (dialog) => { prompts.push(dialog.message()); await dialog.dismiss(); });
  const form = page.getByRole('dialog', { name: /Atributos de entidad/ });
  const confirm = page.getByRole('alertdialog', { name: 'Cambios sin aplicar' });
  const name = page.locator('[data-value-path="/nombre"]');
  await name.fill('Mérida sin aplicar');

  // Cancel with changes asks first; Escape keeps editing and preserves the values
  await page.locator('#m-vectorsmanagement-dataidee-cancel').click();
  await expect(confirm).toBeVisible();
  await expect(confirm.getByRole('button', { name: 'Seguir editando' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(confirm).toBeHidden();
  await expect(form).toBeVisible();
  await expect(name).toHaveValue('Mérida sin aplicar');

  // Escape on the form also asks; discarding closes it
  await name.focus();
  await page.keyboard.press('Escape');
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: 'Descartar cambios' }).click();
  await expect(confirm).toBeHidden();
  await expect(form).toBeHidden();
  expect(prompts).toEqual([]);
});

test('TEUNESCO exposes the complete styled VectorsManagement toolbar', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const { writes } = await mockService(page);
  await openEditor(page);
  await page.locator('#m-vectorsmanagement-style').click();
  await expect(page.locator('.m-vectorsmanagement-style-container')).toBeVisible();
  await page.locator('#m-vectorsmanagement-analysis').click();
  await expect(page.locator('.m-vectorsmanagement-analysis')).toBeVisible();
  await page.locator('#m-vectorsmanagement-turf').click();
  await expect(page.locator('.m-vectorsmanagement-turf')).toBeVisible();
  await page.locator('#m-vectorsmanagement-download').click();
  await expect(page.locator('#m-vectorsmanagement-download-format')).toBeVisible();
  await page.locator('#m-vectorsmanagement-help').click();
  await expect(page.locator('.m-dialog #selection-content')).toBeVisible();
  await page.locator('.m-dialog .m-button > button').click();
  const appearance = await page.locator('#m-vectorsmanagement-creation').evaluate((button) => {
    const icon = window.getComputedStyle(button, '::before');
    return { width: parseFloat(icon.width), mask: icon.maskImage, color: icon.backgroundColor };
  });
  expect(appearance.width).toBeGreaterThan(10);
  expect(appearance.mask).toContain('icn_geometria.svg');
  expect(appearance.color).not.toBe('rgba(0, 0, 0, 0)');
  expect(writes).toHaveLength(0);
  expect(errors).toEqual([]);
});

/** Selectors whose button does not look like a plain button of the API in the same state. */
const buttonsDifferingFromApi = (page, selectors) => page.evaluate((list) => {
  const properties = ['backgroundColor', 'color', 'borderTopColor', 'borderTopWidth', 'height', 'fontSize', 'cursor'];
  const styleOf = (element) => JSON.stringify(properties
    .map((name) => window.getComputedStyle(element)[name]));
  const container = document.querySelector('.m-api-idee-container');
  return list.filter((selector) => {
    const button = document.querySelector(selector);
    const reference = document.createElement('button');
    reference.disabled = button.disabled;
    container.appendChild(reference);
    const differs = styleOf(button) !== styleOf(reference);
    reference.remove();
    return differs;
  });
}, selectors);

test('TEUNESCO editing buttons share the API button style', async ({ page }) => {
  await mockService(page);
  await openEditor(page);
  // The pointer may rest on a session button: hover would change its style.
  await page.mouse.move(0, 0);
  await expect.poll(() => buttonsDifferingFromApi(page, [
    '#m-vectorsmanagement-editing-save',
    '#m-vectorsmanagement-editing-discard',
    '#m-vectorsmanagement-editing-end',
  ])).toEqual([]);
});

test('TEUNESCO form buttons follow the API dialog and button styles', async ({ page }) => {
  const { features, schema } = await mockService(page);
  schema.properties.opcional = { title: 'Opcional', type: 'boolean' };
  schema.properties.lista = { title: 'Lista', type: 'array', items: { type: 'string' } };
  Object.assign(features[0].properties, { opcional: false, lista: ['a'] });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openAttributeForm(page);
  await page.mouse.move(0, 0);
  const primary = await page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--idee-color-primary)';
    document.body.appendChild(probe);
    const { color } = window.getComputedStyle(probe);
    probe.remove();
    return color;
  });
  const expected = { color: primary, borderTopColor: primary, borderTopWidth: '2px' };
  await expect.poll(() => page.evaluate(() => ['cancel', 'apply'].map((name) => {
    const { color, borderTopColor, borderTopWidth } = window.getComputedStyle(
      document.querySelector(`#m-vectorsmanagement-dataidee-${name}`),
    );
    return { color, borderTopColor, borderTopWidth };
  }))).toEqual([expected, expected]);
  await expect.poll(() => buttonsDifferingFromApi(page, [
    '[data-array-path="/lista"][data-array-action="add"]',
    '[data-array-path="/lista"][data-array-action="remove"]',
    '[data-field-path="/opcional"] .m-vectorsmanagement-dataidee-boolean-clear',
  ])).toEqual([]);
});

test('TEUNESCO creates a feature when the edition tool is not available', async ({ page }) => {
  await mockService(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openEditor(page, 'creation');
  // Same state as the plugin option edition: false, without another demo page.
  await page.evaluate(() => { delete window.teunescoDemo.plugin.controls[0].editionControl; });
  await page.locator('#pointdrawing').click();
  await page.mouse.click(...await featurePixel(page));
  const form = page.locator('.m-vectorsmanagement-dataidee-fields');
  await expect(form).toBeVisible();
  await form.locator('[data-value-path="/nombre"]').fill('Nueva entidad');
  await form.locator('[data-value-path="/clave"]').fill('nueva');
  await form.locator('[data-value-path="/booleano"]').check();
  await form.locator('[data-value-path="/fecha_hora_zona"]').fill('2026-11-04T15:20');
  await page.locator('#m-vectorsmanagement-dataidee-apply').click();
  await expect(form).toBeHidden();
  await expect.poll(() => pendingChanges(page)).toBe(1);
  expect(await page.evaluate(() => window.teunescoDemo.layer.getFeatures().length)).toBe(4);
});

test('TEUNESCO date pickers and unset fields preserve zero, false and untouched timestamps', async ({ page }) => {
  const { features, writes } = await mockService(page);
  const offsetTimestamp = '2026-10-25T02:30:45.123+02:00';
  features[0].properties.fecha_hora = offsetTimestamp;
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openEditor(page);
  await page.mouse.click(...await featurePixel(page));
  await expect.poll(() => page.evaluate(() => (
    window.teunescoDemo.plugin.controls[0].getSelectedFeatures().length
  ))).toBe(1);
  await page.locator('#editattribute').click();
  const form = page.locator('.m-vectorsmanagement-dataidee-fields');
  await expect(form.locator('[data-state-path]')).toHaveCount(0);
  await expect(form.locator('[data-value-path="/fecha"]')).toHaveAttribute('type', 'date');
  await expect(form.locator('[data-value-path="/fecha_hora"]'))
    .toHaveAttribute('type', 'datetime-local');
  await expect(form.locator('[data-value-path="/fecha_hora"]'))
    .toHaveValue('2026-10-25T00:30:45.123');
  await expect(form.locator('[data-value-path="/fecha_hora_zona"]'))
    .toHaveAttribute('type', 'datetime-local');
  await form.locator('[data-value-path="/fecha_hora_zona"]').fill('');
  await page.locator('#m-vectorsmanagement-dataidee-apply').click();
  await expect(form.locator('[data-field-path="/fecha_hora_zona"] .m-vectorsmanagement-dataidee-error'))
    .toBeVisible();
  expect(writes).toHaveLength(0);
  await form.locator('[data-value-path="/fecha_hora_zona"]').fill('2026-11-04T15:20');
  await form.locator('[data-value-path="/fecha"]').fill('2026-11-04');
  await form.locator('[data-value-path="/booleano"]').uncheck();
  await form.locator('[data-value-path="/entero"]').fill('0');
  await form.locator('[data-value-path="/texto"]').fill('');
  await form.locator('[data-value-path="/decimal_simple"]').fill('');
  await form.locator('[data-value-path="/entero_corto"]').selectOption('');
  await form.locator('[data-value-path="/fecha_hora_zona"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath('teunesco-date-pickers.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await form.locator('[data-value-path="/fecha_hora_zona"]').scrollIntoViewIfNeeded();
  await expect(form.locator('[data-value-path="/fecha_hora_zona"]')).toBeInViewport();
  await expect(page.locator('#m-vectorsmanagement-dataidee-apply')).toBeInViewport();
  await page.screenshot({ path: test.info().outputPath('teunesco-date-pickers-mobile.png') });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator('#m-vectorsmanagement-dataidee-apply').click();
  await expect(form).toBeHidden();
  await page.locator('#m-vectorsmanagement-editing-save').click();
  await expect(page.locator('#m-vectorsmanagement-editing-status')).toContainText('Guardadas 1');
  expect(writes).toHaveLength(1);
  const expectedProperties = {
    ...fixture.items.features[0].properties,
    entero: 0,
    booleano: false,
    fecha: '2026-11-04',
    fecha_hora: offsetTimestamp,
    fecha_hora_zona: '2026-11-04T15:20:00Z',
  };
  ['texto', 'decimal_simple', 'entero_corto'].forEach((name) => {
    delete expectedProperties[name];
  });
  expect(writes[0].feature.properties).toEqual(expectedProperties);
  expect(writes[0].feature).toMatchObject({ type: 'Feature', id: 1, geometry: { type: 'Point' } });
  expect(writes[0].feature.geometry.coordinates[0])
    .toBeCloseTo(fixture.items.features[0].geometry.coordinates[0], 9);
  expect(writes[0].feature.geometry.coordinates[1])
    .toBeCloseTo(fixture.items.features[0].geometry.coordinates[1], 9);
  expect(features[0].properties.fecha_hora).toBe(offsetTimestamp);
  await page.locator('#editattribute').click();
  await expect(form.locator('[data-value-path="/texto"]')).toHaveValue('');
  await expect(form.locator('[data-value-path="/entero_corto"]')).toHaveValue('');
  await expect(form.locator('[data-value-path="/decimal_simple"]')).toHaveValue('');
  await form.locator('[data-value-path="/fecha"]').fill('');
  await form.locator('[data-value-path="/fecha_hora"]').fill('');
  await page.locator('#m-vectorsmanagement-dataidee-apply').click();
  await expect(form).toBeHidden();
  await page.locator('#m-vectorsmanagement-editing-save').click();
  await expect.poll(() => writes.length).toBe(2);
  await expect(page.locator('#m-vectorsmanagement-editing-status')).toContainText('Guardadas 1');
  delete expectedProperties.fecha;
  delete expectedProperties.fecha_hora;
  expect(writes[1].feature.properties).toEqual(expectedProperties);
  expect(writes[1].headers['if-match']).toBe('"2"');
  await page.reload();
  await expect(page.locator('#teunesco-status')).toContainText('3 entidades cargadas');
  const saved = await page.evaluate(() => window.teunescoDemo.layer.getFeatures()
    .find((feature) => feature.getId() === 1).getAttributes());
  expect(saved).toMatchObject({ entero: 0, booleano: false, fecha_hora_zona: '2026-11-04T15:20:00Z' });
  ['texto', 'decimal_simple', 'entero_corto', 'fecha', 'fecha_hora'].forEach((name) => {
    expect(Object.hasOwn(saved, name)).toBe(false);
  });
});

test('TEUNESCO form reports errors while typing and clears them without reopening', async ({ page }) => {
  await mockService(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  const form = await openAttributeForm(page);
  const name = form.locator('[data-value-path="/nombre"]');
  await expect(name).toHaveJSProperty('tagName', 'TEXTAREA');
  await name.fill('x');
  await expect(fieldError(form, '/nombre')).toContainText('2');
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  const errorId = await fieldError(form, '/nombre').getAttribute('id');
  expect(await name.getAttribute('aria-describedby')).toContain(errorId);
  await expect(page.locator('.m-vectorsmanagement-dataidee-status')).toContainText('1');
  await name.fill('Mérida');
  await expect(fieldError(form, '/nombre')).toHaveCount(0);
  expect(await name.getAttribute('aria-invalid')).toBeNull();
  expect(await name.getAttribute('aria-describedby') || '').not.toContain(errorId);
  await expect(page.locator('.m-vectorsmanagement-dataidee-status')).toHaveText('');
  await expect(form.locator('[data-field-path="/nombre"]')).toHaveClass(/is-valid/);
});

test('TEUNESCO form cannot apply invalid values and locates the first error', async ({ page }) => {
  const { writes } = await mockService(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  const form = await openAttributeForm(page);
  const population = form.locator('[data-value-path="/entero"]');
  await population.fill('-1');
  await page.locator('#m-vectorsmanagement-dataidee-apply').click();
  await expect(form).toBeVisible();
  await expect(population).toBeFocused();
  const summary = page.locator('.m-vectorsmanagement-dataidee-errors');
  await expect(summary).toContainText('Población');
  await expect(summary.locator('button[data-issue-path="/entero"]')).toBeVisible();
  expect(await pendingChanges(page)).toBe(0);
  await population.fill('0');
  await expect(summary).toBeEmpty();
  await page.locator('#m-vectorsmanagement-dataidee-apply').click();
  await expect(form).toBeHidden();
  await page.locator('#m-vectorsmanagement-editing-save').click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0].feature.properties.entero).toBe(0);
});

test('TEUNESCO form rejects unreadable numbers instead of dropping the attribute', async ({ page }) => {
  await mockService(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  const form = await openAttributeForm(page);
  const population = form.locator('[data-value-path="/entero"]');
  await population.fill('');
  await population.pressSequentially('1e');
  await expect(fieldError(form, '/entero')).toBeVisible();
  await page.locator('#m-vectorsmanagement-dataidee-apply').click();
  await expect(form).toBeVisible();
  expect(await pendingChanges(page)).toBe(0);
});

test('TEUNESCO booleans are checkboxes that tell false from not set', async ({ page }) => {
  const { features, schema, writes } = await mockService(page);
  delete features[0].properties.booleano;
  schema.properties.opcional = { title: 'Opcional', type: 'boolean' };
  features[0].properties.opcional = false;
  await page.setViewportSize({ width: 1440, height: 1000 });
  const form = await openAttributeForm(page);
  const required = form.locator('[data-value-path="/booleano"]');
  await expect(required).toHaveAttribute('type', 'checkbox');
  await expect(required).toHaveJSProperty('indeterminate', true);
  await expect(form.locator('[data-field-path="/booleano"] .m-vectorsmanagement-dataidee-boolean-clear')).toHaveCount(0);
  await page.locator('#m-vectorsmanagement-dataidee-apply').click();
  await expect(fieldError(form, '/booleano')).toBeVisible();
  await required.check();
  await expect(required).toHaveJSProperty('indeterminate', false);
  await expect(fieldError(form, '/booleano')).toHaveCount(0);
  const optional = form.locator('[data-value-path="/opcional"]');
  await expect(optional).not.toBeChecked();
  await expect(optional).toHaveJSProperty('indeterminate', false);
  await expect(form.locator('[data-field-path="/opcional"]')).toContainText('No');
  await page.locator('#m-vectorsmanagement-dataidee-apply').click();
  await expect(form).toBeHidden();
  await page.locator('#m-vectorsmanagement-editing-save').click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0].feature.properties.opcional).toBe(false);
  expect(writes[0].feature.properties.booleano).toBe(true);
  await page.locator('#editattribute').click();
  await form.locator('[data-field-path="/opcional"] .m-vectorsmanagement-dataidee-boolean-clear').click();
  await expect(form.locator('[data-value-path="/opcional"]')).toHaveJSProperty('indeterminate', true);
  await page.locator('#m-vectorsmanagement-dataidee-apply').click();
  await expect(form).toBeHidden();
  await page.locator('#m-vectorsmanagement-editing-save').click();
  await expect.poll(() => writes.length).toBe(2);
  expect(Object.hasOwn(writes[1].feature.properties, 'opcional')).toBe(false);
});

test('TEUNESCO keeps stored values that break the schema while they stay untouched', async ({ page }) => {
  const { features, writes } = await mockService(page);
  Object.assign(features[0].properties, {
    entero_corto: 9,
    fecha: '2024-02-31',
    fecha_hora: '2026-10-01T07:00:00',
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  const form = await openAttributeForm(page);
  await expect(form.locator('[data-value-path="/entero_corto"]')).toHaveValue('9');
  await expect(form.locator('[data-value-path="/entero_corto"] option:checked')).toContainText('9');
  await expect(fieldWarning(form, '/entero_corto')).toBeVisible();
  await expect(form.locator('[data-value-path="/fecha"]')).toHaveAttribute('type', 'text');
  await expect(form.locator('[data-value-path="/fecha"]')).toHaveValue('2024-02-31');
  await expect(fieldWarning(form, '/fecha')).toBeVisible();
  await expect(form.locator('[data-value-path="/fecha_hora"]')).toHaveValue('2026-10-01T07:00:00');
  await form.locator('[data-value-path="/nombre"]').fill('Mérida editada');
  await page.locator('#m-vectorsmanagement-dataidee-apply').click();
  await expect(form).toBeHidden();
  await page.locator('#m-vectorsmanagement-editing-save').click();
  await expect.poll(() => writes.length).toBe(1);
  expect(writes[0].feature.properties).toMatchObject({
    nombre: 'Mérida editada',
    entero_corto: 9,
    fecha: '2024-02-31',
    fecha_hora: '2026-10-01T07:00:00',
  });
});

test('TEUNESCO blocks a stored invalid value once the user changes it to another invalid one', async ({ page }) => {
  const { features } = await mockService(page);
  features[0].properties.fecha = '2024-02-31';
  await page.setViewportSize({ width: 1440, height: 1000 });
  const form = await openAttributeForm(page);
  await form.locator('[data-value-path="/fecha"]').fill('2023-02-29');
  await expect(fieldError(form, '/fecha')).toBeVisible();
  await page.locator('#m-vectorsmanagement-dataidee-apply').click();
  await expect(form).toBeVisible();
  expect(await pendingChanges(page)).toBe(0);
});

test('TEUNESCO text limits count characters without truncating what was typed', async ({ page }) => {
  const { schema } = await mockService(page);
  schema.properties.nombre.maxLength = 10;
  await page.setViewportSize({ width: 1440, height: 1000 });
  const form = await openAttributeForm(page);
  const name = form.locator('[data-value-path="/nombre"]');
  const typed = 'Doce letras!';
  await name.fill(typed);
  await expect(name).toHaveValue(typed);
  await expect(form.locator('[data-field-path="/nombre"] .m-vectorsmanagement-dataidee-counter')).toContainText('12/10');
  await expect(fieldError(form, '/nombre')).toContainText('10');
  await page.locator('#m-vectorsmanagement-dataidee-apply').click();
  await expect(form).toBeVisible();
  expect(await pendingChanges(page)).toBe(0);
});

test('TEUNESCO applies date limits from the schema', async ({ page }) => {
  const { schema } = await mockService(page);
  schema.properties.fecha.formatMinimum = '2020-01-01';
  await page.setViewportSize({ width: 1440, height: 1000 });
  const form = await openAttributeForm(page);
  const date = form.locator('[data-value-path="/fecha"]');
  await expect(date).toHaveAttribute('min', '2020-01-01');
  await date.fill('2019-12-31');
  await expect(fieldError(form, '/fecha')).toContainText('2020-01-01');
  await date.fill('2020-01-01');
  await expect(fieldError(form, '/fecha')).toHaveCount(0);
});

test('TEUNESCO save refuses a value changed outside the form and sends nothing', async ({ page }) => {
  const { writes } = await mockService(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openEditor(page);
  await page.evaluate(() => {
    const feature = window.teunescoDemo.layer.getFeatures().find((item) => item.getId() === 1);
    feature.getImpl().getFeature().set('entero', -5);
  });
  await expect.poll(() => pendingChanges(page)).toBe(1);
  await page.locator('#m-vectorsmanagement-editing-save').click();
  await expect(page.locator('#m-vectorsmanagement-editing-status')).toContainText('Población');
  expect(writes).toHaveLength(0);
  expect(await pendingChanges(page)).toBe(1);
});

test('TEUNESCO form is labelled, keyboard reachable and adapts to narrow windows', async ({ page }) => {
  await mockService(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  const form = await openAttributeForm(page);
  await expect(page.getByLabel('Descripción')).toHaveAttribute('data-value-path', '/texto');
  await expect(form.locator('[data-value-path="/nombre"]')).toHaveAttribute('aria-required', 'true');
  expect(await form.locator('[data-value-path="/texto"]').getAttribute('aria-required')).toBeNull();
  await expect(page.locator('.m-vectorsmanagement-dataidee-legend')).toContainText('*');
  await form.locator('[data-value-path="/nombre"]').focus();
  await page.keyboard.press('Tab');
  await expect(form.locator('[data-value-path="/clave"]')).toBeFocused();
  const position = (path) => form.locator(`[data-field-path="${path}"]`).evaluate((node) => node.getBoundingClientRect().left);
  const fits = () => page.locator('.m-vectorsmanagement-dataidee-form').evaluate((node) => node.scrollWidth <= node.clientWidth);
  expect(await position('/entero')).not.toBe(await position('/entero_largo'));
  expect(await fits()).toBe(true);
  await page.screenshot({ path: test.info().outputPath('teunesco-form-desktop.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await position('/entero')).toBe(await position('/entero_largo'));
  expect(await fits()).toBe(true);
  await expect(page.locator('#m-vectorsmanagement-dataidee-apply')).toBeInViewport();
  await page.screenshot({ path: test.info().outputPath('teunesco-form-mobile.png') });
});

[
  ['Point', ['pointdrawing', 'pointlocateddrawing']],
  ['LineString', ['linedrawing']],
  ['Polygon', ['polygondrawing', 'figuredrawing']],
  ['MultiPoint', ['multipointdrawing']],
  ['MultiLineString', ['multilinedrawing']],
  ['MultiPolygon', ['multipolygondrawing']],
].forEach(([geometryType, compatibleButtons]) => {
  test(`geometry tools match the collection primary ${geometryType}`, async ({ page }) => {
    const { writes } = await mockService(page, geometryType);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await openEditor(page, 'creation');
    const creationButtons = [
      'pointdrawing', 'pointlocateddrawing', 'linedrawing', 'polygondrawing',
      'figuredrawing', 'multipointdrawing', 'multilinedrawing', 'multipolygondrawing',
      'textdrawing', 'finishmultipledrawing',
    ];
    await Promise.all(creationButtons.map(async (id) => {
      if (compatibleButtons.includes(id)) {
        await expect(page.locator(`#${id}`)).toBeVisible();
        await expect(page.locator(`#${id}`)).toBeEnabled();
      } else await expect(page.locator(`#${id}`)).toBeHidden();
    }));
    if (geometryType.startsWith('Multi')) {
      await page.locator(`#${compatibleButtons[0]}`).click();
      await expect(page.locator('#finishmultipledrawing')).toBeVisible();
      await expect(page.locator('#finishmultipledrawing')).toBeEnabled();
    } else if (geometryType === 'Point') {
      // A stale/programmatic click must not activate an incompatible interaction either.
      await page.locator('#multilinedrawing').evaluate((button) => button.click());
      expect(await page.evaluate(() => window.teunescoDemo.plugin.controls[0]
        .creationControl.getMultipleGeometryType())).toBeFalsy();
      await page.locator('#pointdrawing').click();
      await page.mouse.click(...await featurePixel(page));
      await expect(page.locator('.m-vectorsmanagement-dataidee-fields')).toBeVisible();
      await page.locator('#m-vectorsmanagement-dataidee-cancel').click();
      await expect.poll(() => page.evaluate(() => (
        window.teunescoDemo.layer.getEditingSession().count
      ))).toBe(0);
    }
    await page.locator('#m-vectorsmanagement-edition').click();
    const polygonal = ['Polygon', 'MultiPolygon'].includes(geometryType);
    if (polygonal) await expect(page.locator('#holedrawing')).toBeVisible();
    else await expect(page.locator('#holedrawing')).toBeHidden();
    await Promise.all(['rotatedrawing', 'scaledrawing'].map(async (id) => {
      if (geometryType === 'Point') await expect(page.locator(`#${id}`)).toBeHidden();
      else await expect(page.locator(`#${id}`)).toBeVisible();
    }));
    await expect(page.locator('#movedrawing')).toBeVisible();
    await expect(page.locator('#edit')).toBeVisible();
    if (geometryType === 'Point') {
      await page.screenshot({ path: test.info().outputPath('point-edition-tools.png') });
    }
    await page.locator('#m-vectorsmanagement-creation').click();
    await expect(page.locator('#finishmultipledrawing')).toBeHidden();
    await Promise.all(creationButtons.filter((id) => !compatibleButtons.includes(id))
      .map((id) => expect(page.locator(`#${id}`)).toBeHidden()));
    if (geometryType === 'Point') {
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(page.locator('#pointdrawing')).toBeInViewport();
      await expect(page.locator('#pointlocateddrawing')).toBeInViewport();
      await page.screenshot({ path: test.info().outputPath('point-creation-tools-mobile.png') });
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.locator('#m-vectorsmanagement-editing-end').click();
      await page.evaluate(() => window.teunescoDemo.map.addLayers(new IDEE.layer.Vector({
        name: 'Local geometry test', legend: 'Local geometry test',
      })));
      await page.locator('#m-vectorsmanagement-layer-selector').click();
      await page.locator('#m-vectorsmanagement-layer-selector-options span')
        .filter({ hasText: 'Local geometry test' }).click();
      if (!await page.locator('#creationBtns').isVisible()) {
        await page.locator('#m-vectorsmanagement-creation').click();
      }
      // A local layer has no editing session
      await expect(page.locator('#m-vectorsmanagement-editing')).toHaveCount(0);
      await Promise.all(['pointdrawing', 'linedrawing', 'polygondrawing', 'figuredrawing', 'textdrawing']
        .map((id) => expect(page.locator(`#${id}`)).toBeVisible()));
      await page.locator('#m-vectorsmanagement-edition').click();
      await Promise.all(['holedrawing', 'rotatedrawing', 'scaledrawing']
        .map((id) => expect(page.locator(`#${id}`)).toBeVisible()));
    }
    expect(writes).toHaveLength(0);
  });
});
