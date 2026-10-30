import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

// Necesita el servidor de demostración, que no arranca la configuración de Playwright
const DEMO_URL = 'http://127.0.0.1:8787/';
let demoAvailable = false;

test.beforeAll(async ({ request }) => {
  demoAvailable = await request.get(DEMO_URL, { timeout: 2000 })
    .then((response) => response.ok(), () => false);
});

test.beforeEach(() => {
  test.skip(!demoAvailable, 'Requiere el servidor de demostración: node src/plugins/vectorsmanagement/test/demo/dataidee-server.js');
});

test.afterEach(async ({ request }) => {
  if (demoAvailable) await request.post(`${DEMO_URL}local/reset`);
});

test('DataIDEE form validates and saves typed nested attributes through OGC feature updates', async ({ page }) => {
  const writes = [];
  page.on('request', (request) => {
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method())) {
      writes.push({
        method: request.method(),
        url: request.url(),
        body: request.postData(),
        contentType: request.headers()['content-type'],
      });
    }
  });
  await page.request.post(`${DEMO_URL}local/reset`);
  await page.goto(`${DEMO_URL}?mode=form`);
  await page.waitForFunction(() => window.dataideeDemo?.layer.getFeatures().length === 1);
  await page.locator('#vectorsmanagement-button').click();
  await page.locator('#m-vectorsmanagement-layer-selector').click();
  await page.locator('#m-vectorsmanagement-layer-selector-options span').first().click();
  await page.locator('#m-vectorsmanagement-editing-start').click();
  await expect(page.locator('#m-vectorsmanagement-editing-save')).toBeVisible();
  await page.locator('#m-vectorsmanagement-selection').click();
  const pixel = await page.evaluate(() => {
    const map = window.dataideeDemo.map.getMapImpl();
    const bounds = map.getTargetElement().getBoundingClientRect();
    const feature = window.dataideeDemo.layer.getFeatures()[0].getImpl().getFeature();
    const point = map.getPixelFromCoordinate(feature.getGeometry().getCoordinates());
    return [bounds.left + point[0], bounds.top + point[1]];
  });
  await page.mouse.click(pixel[0], pixel[1]);
  await expect.poll(() => page.evaluate(() => (
    window.dataideeDemo.layer.getEditingSession().count
  ))).toBe(0);
  await page.locator('#m-vectorsmanagement-edition').click();
  await expect(page.locator('#editattribute')).toBeEnabled();
  await page.locator('#editattribute').click();
  const form = page.locator('.m-vectorsmanagement-dataidee-fields');
  await expect(form.locator('[data-value-path="/name"]')).toHaveValue('Casa de la cultura');
  await form.locator('[data-value-path="/name"]').fill('x');
  const validationIssues = await page.evaluate(() => {
    const layer = window.dataideeDemo.layer;
    const feature = layer.getFeatures()[0];
    const geometry = feature.getImpl().getFeature().getGeometry();
    const values = JSON.parse(JSON.stringify(feature.getAttributes()));
    values.name = 'x';
    let issues = [];
    let errorMessage = '';
    try {
      issues = layer.getEditingSession().validateAttributes(feature, values);
    } catch (error) {
      errorMessage = error.message;
    }
    return {
      geometryClone: typeof geometry.clone,
      geometryType: geometry.constructor.name,
      errorMessage,
      issues,
    };
  });
  expect(validationIssues.geometryClone).toBe('function');
  expect(validationIssues.errorMessage).toBe('');
  expect(validationIssues.issues.map((issue) => issue.path)).toContain('/name');
  await page.locator('#m-vectorsmanagement-dataidee-apply').click();
  await expect(page.locator('.m-vectorsmanagement-dataidee-error')).toContainText('2');
  await form.locator('[data-value-path="/name"]').fill('Casa restaurada');
  await form.locator('[data-value-path="/depth"]').fill('22.75');
  await form.locator('[data-value-path="/active"]').selectOption('false');
  await form.locator('[data-value-path="/address/municipality"]').fill('Burgos');
  await form.locator('[data-value-path="/tags/0"]').fill('municipal renovado');
  await form.locator('[data-value-path="/optionalCode"]').fill('A-17');
  await form.locator('[data-array-path="/inspections"][data-array-action="add"]').click();
  await form.locator('[data-value-path="/inspections/1/date"]').fill('2026-10-28');
  await form.locator('[data-value-path="/inspections/1/score"]').fill('5');
  await form.locator('[data-value-path="/inspections/1/note"]').fill('Revisada');
  await page.locator('#m-vectorsmanagement-dataidee-apply').click();
  await expect(form).toBeHidden();
  await expect.poll(() => page.evaluate(() => (
    window.dataideeDemo.layer.getEditingSession().count
  ))).toBe(1);
  const conflictCheck = await page.evaluate(async () => {
    const layer = window.dataideeDemo.layer;
    const session = layer.getEditingSession();
    const remote = await layer.getEditingFeature(7);
    return {
      equal: session.equivalent_(remote.feature, session.original_.get('7')),
    };
  });
  expect(conflictCheck.equal).toBe(true);
  await page.locator('#m-vectorsmanagement-editing-save').click();
  await expect(page.locator('#m-vectorsmanagement-editing-status')).toContainText('Guardadas 1');
  expect(writes.map((write) => write.method)).toEqual(['PUT']);
  expect(writes[0].contentType).toBe('application/geo+json');
  expect(JSON.parse(writes[0].body)).toMatchObject({
    type: 'Feature', id: 7, geometry: { type: 'Point' },
    properties: {
      name: 'Casa restaurada',
      depth: 22.75,
      active: false,
      address: { street: 'Calle Mayor', number: 8, municipality: 'Burgos', postalCode: '47001' },
      tags: ['municipal renovado', 'cultural'],
      inspections: [
        { date: '2026-09-12', score: 4, note: 'Buen estado', inspector: 'Equipo A' },
        { date: '2026-10-28', score: 5, note: 'Revisada' },
      ],
    },
  });
  expect(JSON.parse(writes[0].body).properties).not.toHaveProperty('internalNote');
  expect(JSON.parse(writes[0].body).properties).not.toHaveProperty('updatedAt');
  await page.reload();
  await page.waitForFunction(() => window.dataideeDemo?.layer.getFeatures().length === 1);
  const saved = await page.evaluate(() => window.dataideeDemo.layer.getFeatures()[0].getAttributes());
  expect(saved.name).toBe('Casa restaurada');
  expect(saved.depth).toBe(22.75);
  expect(saved.active).toBe(false);
  expect(saved.address).toMatchObject({ municipality: 'Burgos', postalCode: '47001' });
  expect(saved.assetCode).toBe('VLL-007');
  expect(saved.internalNote).toBe('Preservar este dato aunque no aparezca en el formulario.');
  expect(saved.inspections).toHaveLength(2);
  const explicitNull = await page.evaluate(async () => {
    const layer = window.dataideeDemo.layer;
    const prepared = await layer.beginEditing({ bbox: [-2, -2, 2, 2] });
    const feature = layer.getFeatures()[0];
    const definition = prepared.session.getAttributeForm(feature);
    const values = definition.values;
    values.optionalCode = null;
    prepared.session.applyAttributes(feature, values);
    const result = await prepared.session.save();
    const savedNull = feature.getAttributes().optionalCode;
    await layer.endEditing(false);
    return { result, savedNull };
  });
  expect(explicitNull.result.completed).toHaveLength(1);
  expect(explicitNull.savedNull).toBeNull();
  expect(writes.map((write) => write.method)).toEqual(['PUT', 'PUT']);
  expect(writes[1].contentType).toBe('application/geo+json');
  expect(JSON.parse(writes[1].body)).toMatchObject({
    properties: { optionalCode: null },
  });
  expect(JSON.parse(writes[1].body).properties).not.toHaveProperty('internalNote');
  expect(JSON.parse(writes[1].body).properties).not.toHaveProperty('updatedAt');
});

test('DataIDEE forms discover schema independently from queryables and keep geometry fallback', async ({ page }) => {
  await page.goto(`${DEMO_URL}?mode=missing-queryables`);
  await page.waitForFunction(() => window.dataideeDemo?.layer.getImpl().isLoaded());
  const metadata = await page.evaluate(async () => {
    const capabilities = await window.dataideeDemo.layer.getEditingCapabilities();
    return {
      formAvailable: capabilities.form.available,
      queryables: capabilities.queryables,
      formFields: capabilities.form.properties.map((field) => field.name),
    };
  });
  expect(metadata.formAvailable).toBe(true);
  expect(metadata.queryables).toBeNull();
  expect(metadata.formFields).toContain('assetCode');
  expect(metadata.formFields).not.toContain('calculatedArea');

  for (const mode of ['missing-schema', 'malformed-schema']) {
    await page.goto(`${DEMO_URL}?mode=${mode}`);
    await page.waitForFunction(() => window.dataideeDemo?.layer.getImpl().isLoaded());
    const result = await page.evaluate(async () => {
      const layer = window.dataideeDemo.layer;
      const capabilities = await layer.getEditingCapabilities();
      const prepared = await layer.beginEditing({ bbox: [-2, -2, 2, 2] });
      const feature = layer.getFeatures()[0];
      feature.getImpl().getFeature().getGeometry().translate(2, 0);
      const pending = prepared.session.count;
      const formAvailable = prepared.session.isSupportedForm();
      prepared.session.discard();
      await layer.endEditing(false);
      return { formAvailable, geometryUpdate: capabilities.update, pending };
    });
    expect(result.formAvailable).toBe(false);
    expect(result.geometryUpdate).toBe(true);
    expect(result.pending).toBe(1);
  }

  await page.goto(`${DEMO_URL}?mode=patch-only`);
  await page.waitForFunction(() => window.dataideeDemo?.layer.getImpl().isLoaded());
  const patchOnly = await page.evaluate(async () => {
    const layer = window.dataideeDemo.layer;
    const prepared = await layer.beginEditing({ bbox: [-2, -2, 2, 2] });
    const feature = layer.getFeatures()[0];
    const values = prepared.session.getAttributeForm(feature).values;
    values.optionalCode = 'P-9';
    prepared.session.applyAttributes(feature, values);
    await prepared.session.save();
    const nullValues = prepared.session.getAttributeForm(feature).values;
    nullValues.optionalCode = null;
    prepared.session.applyAttributes(feature, nullValues);
    try {
      await prepared.session.save();
      return { error: '', pending: prepared.session.count };
    } catch (error) {
      const result = { error: error.message, pending: prepared.session.count };
      prepared.session.discard();
      await layer.endEditing(false);
      return result;
    }
  });
  expect(patchOnly.error).toContain('explicit null');
  expect(patchOnly.pending).toBe(1);
});

test('local DataIDEE editing uses the shared VectorsManagement controls and persists a new feature', async ({ page }) => {
  const writes = [];
  const pendingCount = () => page.evaluate(() => (
    window.dataideeDemo.layer.getEditingSession().count
  ));
  page.on('request', (request) => {
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method())) writes.push(request.method());
  });
  await page.request.post('http://127.0.0.1:8787/local/reset');
  await page.goto('http://127.0.0.1:8787/');
  await page.waitForFunction(() => window.dataideeDemo?.layer.getFeatures().length >= 5);
  const localGeometryTypes = await page.evaluate(() => window.dataideeDemo.layer.getFeatures()
    .map((feature) => feature.getGeometry().type));
  expect(localGeometryTypes).toEqual(expect.arrayContaining([
    'Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiPolygon',
  ]));
  const holeCount = await page.evaluate(() => window.dataideeDemo.layer.getFeatures()
    .find((feature) => feature.getAttributes()?.name === 'Polígono con hueco')
    .getGeometry().coordinates.length - 1);
  expect(holeCount).toBe(1);
  await page.locator('#vectorsmanagement-button').click();
  await expect(page.locator('#m-vectorsmanagement-layer-selector')).toBeVisible();
  await page.locator('#m-vectorsmanagement-layer-selector').click();
  await page.locator('#m-vectorsmanagement-layer-selector-options span').first().click();
  await expect(page.locator('#m-vectorsmanagement-editing')).toBeVisible();
  await page.locator('#m-vectorsmanagement-editing-start').click();
  await expect(page.locator('#m-vectorsmanagement-editing-save')).toBeVisible();
  await page.locator('#m-vectorsmanagement-creation').click();
  await page.locator('#pointdrawing').click();
  const pixel = await page.evaluate(() => {
    const map = window.dataideeDemo.map.getMapImpl();
    const bounds = map.getTargetElement().getBoundingClientRect();
    const position = map.getPixelFromCoordinate(map.getView().getCenter());
    return [bounds.left + position[0], bounds.top + position[1]];
  });
  await page.mouse.click(pixel[0], pixel[1]);
  await page.locator('.m-vectorsmanagement-dataidee-fields [data-value-path="/name"]')
    .fill('Created in UI');
  const category = page.locator('.m-vectorsmanagement-dataidee-fields [data-value-path="/category"]');
  await expect(category).toHaveValue('demo');
  await category.fill('');
  await page.locator('#m-vectorsmanagement-dataidee-apply').click();
  await expect.poll(pendingCount).toBe(1);
  await page.locator('#m-vectorsmanagement-editing-save').click();
  await expect(page.locator('#m-vectorsmanagement-editing-status')).toContainText('Guardadas 1');
  expect(writes).toEqual(['POST']);
  await expect.poll(async () => page.evaluate(() => (
    window.dataideeDemo.layer.getFeatures().length
  ))).toBe(6);
  await page.reload();
  await page.waitForFunction(() => window.dataideeDemo?.layer.getFeatures().length === 6);
  const savedName = await page.evaluate(() => window.dataideeDemo.layer.getFeatures()
    .map((feature) => feature.getAttributes()?.name).find((name) => name === 'Created in UI'));
  expect(savedName).toBe('Created in UI');
  expect(await page.evaluate(() => window.dataideeDemo.layer.getFeatures()
    .find((feature) => feature.getAttributes()?.name === 'Created in UI')
    .getAttributes().category)).toBeUndefined();
  await page.locator('#vectorsmanagement-button').click();
  await page.locator('#m-vectorsmanagement-layer-selector').click();
  await page.locator('#m-vectorsmanagement-layer-selector-options span').first().click();
  await page.locator('#m-vectorsmanagement-editing-start').click();
  await expect.poll(() => page.evaluate(() => Boolean(
    window.dataideeDemo.layer.getEditingSession(),
  ))).toBe(true);
  const originalCoordinates = await page.evaluate(() => {
    const feature = window.dataideeDemo.layer.getFeatures().find((item) => item.getId() === 0);
    return feature.getImpl().getFeature().getGeometry().getCoordinates();
  });
  await page.evaluate(() => {
    const feature = window.dataideeDemo.layer.getFeatures().find((item) => item.getId() === 0);
    feature.getImpl().getFeature().getGeometry().translate(10, 0);
  });
  await expect.poll(pendingCount).toBe(1);
  await page.locator('#m-vectorsmanagement-editing-discard').click();
  const restoredCoordinates = await page.evaluate(() => {
    const feature = window.dataideeDemo.layer.getFeatures().find((item) => item.getId() === 0);
    return feature.getImpl().getFeature().getGeometry().getCoordinates();
  });
  expect(restoredCoordinates).toEqual(originalCoordinates);
  await page.evaluate(() => {
    const created = window.dataideeDemo.layer.getFeatures()
      .find((feature) => feature.getAttributes()?.name === 'Created in UI');
    window.dataideeDemo.layer.removeFeatures(created);
  });
  await expect.poll(pendingCount).toBe(1);
  await page.locator('#m-vectorsmanagement-editing-save').click();
  await expect(page.locator('#m-vectorsmanagement-editing-status')).toContainText('Guardadas 1');
  await page.reload();
  await page.waitForFunction(() => window.dataideeDemo?.layer.getFeatures().length === 5);
  const deletedName = await page.evaluate(() => window.dataideeDemo.layer.getFeatures()
    .map((feature) => feature.getAttributes()?.name).find((name) => name === 'Created in UI'));
  expect(deletedName).toBeUndefined();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('#vectorsmanagement-button').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#m-vectorsmanagement-layer-selector')).toBeVisible();
  const viewport = await page.evaluate(() => ({
    width: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    mapWidth: document.querySelector('#map').getBoundingClientRect().width,
  }));
  expect(viewport.documentWidth).toBeLessThanOrEqual(viewport.width);
  expect(viewport.mapWidth).toBeGreaterThan(0);
});

test('cancelling DataIDEE creation clears its preview without staging a feature', async ({ page }) => {
  await page.request.post('http://127.0.0.1:8787/local/reset');
  await page.goto('http://127.0.0.1:8787/');
  await page.waitForFunction(() => window.dataideeDemo?.layer.getFeatures().length === 5);
  await page.locator('#vectorsmanagement-button').click();
  await page.locator('#m-vectorsmanagement-layer-selector').click();
  await page.locator('#m-vectorsmanagement-layer-selector-options span').first().click();
  await page.locator('#m-vectorsmanagement-editing-start').click();
  await page.locator('#m-vectorsmanagement-creation').click();
  await page.locator('#pointdrawing').click();
  const pixel = await page.evaluate(() => {
    const map = window.dataideeDemo.map.getMapImpl();
    const bounds = map.getTargetElement().getBoundingClientRect();
    const position = map.getPixelFromCoordinate(map.getView().getCenter());
    return [bounds.left + position[0], bounds.top + position[1]];
  });
  await page.mouse.click(pixel[0], pixel[1]);
  await expect(page.locator('#m-vectorsmanagement-dataidee-cancel')).toBeVisible();
  await page.locator('#m-vectorsmanagement-dataidee-cancel').click();
  await expect.poll(() => page.evaluate(() => ({
    pending: window.dataideeDemo.layer.getEditingSession().count,
    features: window.dataideeDemo.layer.getFeatures().length,
    preview: window.dataideeDemo.map.getLayers()
      .find((layer) => layer.name === 'dataidee-creation-preview')
      .getImpl().getLayer().getSource().getFeatures().length,
  }))).toEqual({ pending: 0, features: 5, preview: 0 });
});

test('local DataIDEE handles read-only, limits, conflicts, partial and uncertain writes', async ({ page }) => {
  await page.goto('http://127.0.0.1:8787/?mode=readonly');
  await page.waitForFunction(() => window.dataideeDemo?.layer.getImpl().isLoaded());
  await page.locator('#vectorsmanagement-button').click();
  await page.locator('#m-vectorsmanagement-layer-selector').click();
  await page.locator('#m-vectorsmanagement-layer-selector-options span').first().click();
  await expect(page.locator('#m-vectorsmanagement-editing-start')).toBeDisabled();

  await page.goto('http://127.0.0.1:8787/?mode=dense');
  await page.waitForFunction(() => window.dataideeDemo?.layer.getImpl().isLoaded());
  const preparationError = await page.evaluate(async () => {
    try {
      await window.dataideeDemo.layer.beginEditing({ bbox: [-2, -2, 2, 2] });
      return '';
    } catch (error) {
      return error.message;
    }
  });
  expect(preparationError).toContain('feature limit');
  expect(await page.evaluate(() => window.dataideeDemo.layer.getEditingSession())).toBeNull();

  await page.goto('http://127.0.0.1:8787/?mode=conflict');
  await page.waitForFunction(() => window.dataideeDemo?.layer.getImpl().isLoaded());
  const conflict = await page.evaluate(async () => {
    const layer = window.dataideeDemo.layer;
    const prepared = await layer.beginEditing({ bbox: [-2, -2, 2, 2] });
    prepared.features[0].getGeometry().translate(5, 0);
    try {
      await prepared.session.save();
      return '';
    } catch (error) {
      const message = error.message;
      prepared.session.discard();
      await layer.endEditing(false);
      return message;
    }
  });
  expect(conflict).toContain('changed on the server');

  await page.goto('http://127.0.0.1:8787/?mode=partial');
  await page.waitForFunction(() => window.dataideeDemo?.layer.getImpl().isLoaded());
  const partial = await page.evaluate(async () => {
    const layer = window.dataideeDemo.layer;
    const prepared = await layer.beginEditing({ bbox: [-2, -2, 2, 2] });
    prepared.features.forEach((feature) => feature.getGeometry().translate(5, 0));
    try {
      await prepared.session.save();
      return { error: '', pending: prepared.session.count };
    } catch (error) {
      const result = { error: error.message, pending: prepared.session.count };
      prepared.session.discard();
      await layer.endEditing(false);
      return result;
    }
  });
  expect(partial.error).toContain('HTTP 422');
  expect(partial.pending).toBe(1);

  await page.goto('http://127.0.0.1:8787/?mode=empty');
  await page.waitForFunction(() => window.dataideeDemo?.layer.getImpl().isLoaded());
  const duplicateSave = await page.evaluate(async () => {
    const layer = window.dataideeDemo.layer;
    const prepared = await layer.beginEditing({ bbox: [-2, -2, 2, 2] });
    const feature = new IDEE.Feature(null, {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [0, 0] },
    });
    prepared.session.prepareFeature(feature, { name: 'single save' });
    layer.addFeatures(feature);
    const results = await Promise.allSettled([
      prepared.session.save(), prepared.session.save(),
    ]);
    const rejection = results.find((result) => result.status === 'rejected');
    const state = {
      successCount: results.filter((result) => result.status === 'fulfilled').length,
      duplicateError: rejection?.reason?.message,
      savedId: feature.getId(),
    };
    await layer.endEditing(false);
    return state;
  });
  expect(duplicateSave.successCount).toBe(1);
  expect(duplicateSave.duplicateError).toContain('already in progress');
  expect(duplicateSave.savedId).toBe(0);

  await page.goto('http://127.0.0.1:8787/?mode=uncertain');
  await page.waitForFunction(() => window.dataideeDemo?.layer.getImpl().isLoaded());
  const uncertain = await page.evaluate(async () => {
    const layer = window.dataideeDemo.layer;
    const prepared = await layer.beginEditing({ bbox: [-2, -2, 2, 2] });
    const feature = new IDEE.Feature(null, {
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [0, 0] },
    });
    prepared.session.prepareFeature(feature, { name: 'uncertain write' });
    layer.addFeatures(feature);
    try {
      await prepared.session.save();
    } catch (error) {
      const result = {
        error: error.message,
        requiresReview: prepared.session.requiresReview,
      };
      prepared.session.discard();
      await layer.endEditing(false);
      return result;
    }
    return { error: '', requiresReview: prepared.session.requiresReview };
  });
  expect(uncertain.error).toBeTruthy();
  expect(uncertain.requiresReview).toBe(true);
});
