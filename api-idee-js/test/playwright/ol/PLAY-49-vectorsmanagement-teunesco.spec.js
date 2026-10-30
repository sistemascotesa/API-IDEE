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
  return { features, writes };
}

async function openEditor(page) {
  await page.goto(demoUrl);
  await expect(page.locator('#teunesco-status')).toContainText('3 entidades cargadas');
  await expect(page.locator('#m-vectorsmanagement-layer-selector-options')).toBeHidden();
  await page.locator('#m-vectorsmanagement-layer-selector').click();
  await page.locator('#m-vectorsmanagement-layer-selector-options span')
    .filter({ hasText: 'Todos los tipos' }).click();
  await page.locator('#m-vectorsmanagement-editing-start').click();
  await expect(page.locator('#m-vectorsmanagement-editing-save')).toBeVisible();
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

test('TEUNESCO editor stages geometry and typed attributes together and retains secondary geometries', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const { features, writes } = await mockService(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openEditor(page);
  await Promise.all(['selection', 'creation', 'edition', 'style', 'analysis', 'turf', 'download', 'help']
    .map((tool) => expect(page.locator(`#m-vectorsmanagement-${tool}`)).toBeVisible()));
  await expect(page.locator('#layerdrawing')).toBeVisible();
  await page.locator('#m-vectorsmanagement-selection').click();
  const pixel = await featurePixel(page);
  await page.mouse.click(...pixel);
  await expect.poll(() => page.evaluate(() => (
    window.teunescoDemo.plugin.controls[0].getSelectedFeatures().length
  ))).toBe(1);
  await page.locator('#m-vectorsmanagement-edition').click();
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
  await form.locator('[data-value-path="/booleano"]').selectOption('false');
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
  await page.locator('#m-vectorsmanagement-selection').click();
  await page.mouse.click(...await featurePixel(page));
  await expect.poll(() => page.evaluate(() => (
    window.teunescoDemo.plugin.controls[0].getSelectedFeatures().length
  ))).toBe(1);
  await page.locator('#m-vectorsmanagement-edition').click();
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

test('TEUNESCO date pickers and unset fields preserve zero, false and untouched timestamps', async ({ page }) => {
  const { features, writes } = await mockService(page);
  const offsetTimestamp = '2026-10-25T02:30:45.123+02:00';
  features[0].properties.fecha_hora = offsetTimestamp;
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openEditor(page);
  await page.locator('#m-vectorsmanagement-selection').click();
  await page.mouse.click(...await featurePixel(page));
  await expect.poll(() => page.evaluate(() => (
    window.teunescoDemo.plugin.controls[0].getSelectedFeatures().length
  ))).toBe(1);
  await page.locator('#m-vectorsmanagement-edition').click();
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
  await form.locator('[data-value-path="/booleano"]').selectOption('');
  await page.locator('#m-vectorsmanagement-dataidee-apply').click();
  await expect(form.locator('[data-field-path="/fecha_hora_zona"] .m-vectorsmanagement-dataidee-error'))
    .toBeVisible();
  await expect(form.locator('[data-field-path="/booleano"] .m-vectorsmanagement-dataidee-error'))
    .toBeVisible();
  expect(writes).toHaveLength(0);
  await form.locator('[data-value-path="/fecha_hora_zona"]').fill('2026-11-04T15:20');
  await form.locator('[data-value-path="/fecha"]').fill('2026-11-04');
  await form.locator('[data-value-path="/booleano"]').selectOption('false');
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
    await openEditor(page);
    await page.locator('#m-vectorsmanagement-creation').click();
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
      await Promise.all(['pointdrawing', 'linedrawing', 'polygondrawing', 'figuredrawing', 'textdrawing']
        .map((id) => expect(page.locator(`#${id}`)).toBeVisible()));
      await page.locator('#m-vectorsmanagement-edition').click();
      await Promise.all(['holedrawing', 'rotatedrawing', 'scaledrawing']
        .map((id) => expect(page.locator(`#${id}`)).toBeVisible()));
    }
    expect(writes).toHaveLength(0);
  });
});
