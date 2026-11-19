import { test, expect } from '@playwright/test';
import { openLocalDataIDEE } from './dataidee-pages';

// Mensajes de error del núcleo en el idioma configurado de la página
const exceptionText = (page, key) => page.evaluate(
  (name) => IDEE.language.getValue('exception')[name],
  key,
);
// Patrón de un mensaje con marcadores {x}: cada marcador admite cualquier valor
const exceptionPattern = async (page, key) => new RegExp((await exceptionText(page, key))
  .split(/\{\w+\}/)
  .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('.+'));

// Cada test abre el ejemplo de edición local con su propio servicio DataIDEE en memoria

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
  const demo = await openLocalDataIDEE(page, 'form');
  await page.waitForFunction(() => window.dataideeDemo?.layer.getFeatures().length === 1);
  await page.locator('#vectorsmanagement-button').click();
  await page.locator('#m-vectorsmanagement-layer-selector').click();
  await page.locator('#m-vectorsmanagement-layer-selector-options span').first().click();
  // Opening Edition starts the session and selects features
  await page.locator('#m-vectorsmanagement-edition').click();
  await expect(page.locator('#m-vectorsmanagement-editing-save')).toBeEnabled();
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
  await form.locator('[data-value-path="/active"]').uncheck();
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
  await demo.remount();
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

test('DataIDEE nested objects and arrays validate live and keep the keyboard focus', async ({ page }) => {
  await openLocalDataIDEE(page, 'form');
  await page.waitForFunction(() => window.dataideeDemo?.layer.getFeatures().length === 1);
  await page.locator('#vectorsmanagement-button').click();
  await page.locator('#m-vectorsmanagement-layer-selector').click();
  await page.locator('#m-vectorsmanagement-layer-selector-options span').first().click();
  // Opening Edition starts the session and selects features
  await page.locator('#m-vectorsmanagement-edition').click();
  await expect(page.locator('#m-vectorsmanagement-editing-save')).toBeEnabled();
  const pixel = await page.evaluate(() => {
    const map = window.dataideeDemo.map.getMapImpl();
    const bounds = map.getTargetElement().getBoundingClientRect();
    const feature = window.dataideeDemo.layer.getFeatures()[0].getImpl().getFeature();
    const point = map.getPixelFromCoordinate(feature.getGeometry().getCoordinates());
    return [bounds.left + point[0], bounds.top + point[1]];
  });
  await page.mouse.click(pixel[0], pixel[1]);
  await expect(page.locator('#editattribute')).toBeEnabled();
  await page.locator('#editattribute').click();
  const form = page.locator('.m-vectorsmanagement-dataidee-fields');
  const error = (path) => form.locator(`[data-field-path="${path}"] > .m-vectorsmanagement-dataidee-feedback > .m-vectorsmanagement-dataidee-error`);
  await form.locator('[data-value-path="/address/postalCode"]').fill('abc');
  await expect(error('/address/postalCode')).toBeVisible();
  await form.locator('[data-value-path="/address/postalCode"]').fill('47002');
  await expect(error('/address/postalCode')).toHaveCount(0);
  const addTag = form.locator('[data-array-path="/tags"][data-array-action="add"]');
  await addTag.click();
  await expect(form.locator('[data-value-path="/tags/2"]')).toBeFocused();
  await page.locator('#m-vectorsmanagement-dataidee-apply').click();
  await expect(error('/tags/2')).toBeVisible();
  await form.locator('[data-value-path="/tags/2"]').fill('cultural');
  await expect(error('/tags')).toBeVisible();
  await form.locator('[data-field-path="/tags/2"] [data-array-action="remove"]').click();
  await expect(addTag).toBeFocused();
  await expect(error('/tags')).toHaveCount(0);
  await form.locator('[data-array-path="/inspections"][data-array-action="add"]').click();
  await form.locator('[data-value-path="/inspections/1/score"]').fill('9');
  await expect(error('/inspections/1/score')).toBeVisible();
  await form.locator('[data-value-path="/inspections/1/score"]').fill('5');
  await expect(error('/inspections/1/score')).toHaveCount(0);
  await page.locator('#m-vectorsmanagement-dataidee-apply').click();
  await expect(error('/inspections/1/date')).toBeVisible();
  await form.locator('[data-value-path="/inspections/1/date"]').fill('2026-10-28');
  await page.locator('#m-vectorsmanagement-dataidee-apply').click();
  await expect(form).toBeHidden();
  const staged = await page.evaluate(() => window.dataideeDemo.layer.getFeatures()[0].getAttributes());
  expect(staged.address.postalCode).toBe('47002');
  expect(staged.tags).toEqual(['municipal', 'cultural']);
  expect(staged.inspections[1]).toEqual({ date: '2026-10-28', score: 5 });
  expect(staged.internalNote).toBe('Preservar este dato aunque no aparezca en el formulario.');
});

test('DataIDEE save reports conflicts and service errors in the editing panel', async ({ page }) => {
  for (const mode of ['conflict', 'partial']) {
    await openLocalDataIDEE(page, mode);
    // El conflicto usa el mensaje traducido; el fallo parcial muestra el estado HTTP del servicio
    const message = mode === 'conflict'
      ? await exceptionPattern(page, 'dataidee_feature_changed') : 'HTTP 422';
    await page.waitForFunction(() => window.dataideeDemo?.layer.getImpl().isLoaded());
    await page.locator('#vectorsmanagement-button').click();
    await page.locator('#m-vectorsmanagement-layer-selector').click();
    await page.locator('#m-vectorsmanagement-layer-selector-options span').first().click();
    await page.locator('#m-vectorsmanagement-edition').click();
    await expect(page.locator('#m-vectorsmanagement-editing-save')).toBeEnabled();
    await page.evaluate(() => window.dataideeDemo.layer.getFeatures().forEach((feature) => {
      feature.getImpl().getFeature().getGeometry().translate(5, 0);
    }));
    await page.locator('#m-vectorsmanagement-editing-save').click();
    await expect(page.locator('#m-vectorsmanagement-editing-status')).toContainText(message);
    await expect(page.locator('#m-vectorsmanagement-editing-save')).toBeEnabled();
  }
});

test('DataIDEE forms discover schema independently from queryables and keep geometry fallback', async ({ page }) => {
  await openLocalDataIDEE(page, 'missing-queryables');
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
    await openLocalDataIDEE(page, mode);
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

  await openLocalDataIDEE(page, 'patch-only');
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
  expect(patchOnly.error).toBe(await exceptionText(page, 'dataidee_explicit_null'));
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
  const demo = await openLocalDataIDEE(page);
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
  // The session section only lives in the Creation and Edition panels
  await expect(page.locator('#m-vectorsmanagement-editing')).toHaveCount(0);
  await page.locator('#m-vectorsmanagement-creation').click();
  await expect(page.locator('#m-vectorsmanagement-editing')).toBeVisible();
  await expect(page.locator('#m-vectorsmanagement-editing-save')).toBeEnabled();
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
  await demo.remount();
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
  await page.locator('#m-vectorsmanagement-edition').click();
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
  await demo.remount();
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
    mapWidth: document.querySelector('#mapjs').getBoundingClientRect().width,
  }));
  expect(viewport.documentWidth).toBeLessThanOrEqual(viewport.width);
  expect(viewport.mapWidth).toBeGreaterThan(0);
});

test('cancelling DataIDEE creation clears its preview without staging a feature', async ({ page }) => {
  await openLocalDataIDEE(page);
  await page.waitForFunction(() => window.dataideeDemo?.layer.getFeatures().length === 5);
  await page.locator('#vectorsmanagement-button').click();
  await page.locator('#m-vectorsmanagement-layer-selector').click();
  await page.locator('#m-vectorsmanagement-layer-selector-options span').first().click();
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
  await expect(page.locator('#m-vectorsmanagement-dataidee-delete')).toHaveCount(0);
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
  await openLocalDataIDEE(page, 'readonly');
  await page.waitForFunction(() => window.dataideeDemo?.layer.getImpl().isLoaded());
  await page.locator('#vectorsmanagement-button').click();
  await page.locator('#m-vectorsmanagement-layer-selector').click();
  await page.locator('#m-vectorsmanagement-layer-selector-options span').first().click();
  await expect(page.locator('#m-vectorsmanagement-creation')).toBeDisabled();
  await expect(page.locator('#m-vectorsmanagement-edition')).toBeDisabled();
  await expect(page.locator('#m-vectorsmanagement-edition'))
    .toHaveAttribute('title', 'La colección no permite esta operación.');

  await openLocalDataIDEE(page, 'dense', { pageSize: 1000 });
  await page.waitForFunction(() => window.dataideeDemo?.layer.getImpl().isLoaded());
  const preparationError = await page.evaluate(async () => {
    // Without a layer limit the whole zone is loaded: its 1001 features exceed the budget
    window.dataideeDemo.layer.getImpl().limit = undefined;
    try {
      await window.dataideeDemo.layer.beginEditing({ bbox: [-2, -2, 2, 2] });
      return '';
    } catch (error) {
      return error.message;
    }
  });
  expect(preparationError).toBe(await exceptionText(page, 'dataidee_edit_feature_limit'));
  expect(await page.evaluate(() => window.dataideeDemo.layer.getEditingSession())).toBeNull();

  await openLocalDataIDEE(page, 'conflict');
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
  expect(conflict).toMatch(await exceptionPattern(page, 'dataidee_feature_changed'));

  await openLocalDataIDEE(page, 'partial');
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

  await openLocalDataIDEE(page, 'empty');
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
  expect(duplicateSave.duplicateError).toBe(await exceptionText(page, 'dataidee_save_in_progress'));
  expect(duplicateSave.savedId).toBe(0);

  await openLocalDataIDEE(page, 'uncertain');
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

test('DataIDEE editing respects the layer limit and restores the layer query when it ends', async ({ page }) => {
  const itemRequests = [];
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (url.pathname === '/local/collections/dense/items') itemRequests.push(url);
  });
  await openLocalDataIDEE(page, 'dense');
  await page.waitForFunction(() => window.dataideeDemo?.layer.getImpl().isLoaded());
  itemRequests.length = 0;
  const prepared = await page.evaluate(async () => {
    const { layer } = window.dataideeDemo;
    layer.getImpl().limit = 5;
    const result = await layer.beginEditing({ bbox: [-2, -2, 2, 2] });
    return {
      count: result.features.length,
      complete: result.complete,
      sessionBudget: result.limits.maxFeatures,
    };
  });
  // The demo pages hold 2 features: 2 + 2 + 1, without following the last next link.
  // The session budget keeps its own limit so that new features can still be created.
  expect(prepared).toEqual({ count: 5, complete: false, sessionBudget: 1000 });
  expect(itemRequests.map((url) => url.searchParams.get('limit'))).toEqual(['2', '2', '2']);

  itemRequests.length = 0;
  await page.evaluate(() => window.dataideeDemo.layer.endEditing());
  await expect.poll(() => page.evaluate(() => window.dataideeDemo.layer.getFeatures().length))
    .toBe(5);
  expect(itemRequests).toHaveLength(1);
  expect(itemRequests[0].searchParams.get('limit')).toBe('5');
  expect(itemRequests[0].searchParams.has('bbox')).toBe(false);
});

test('DataIDEE capabilities are requested once per layer and token', async ({ page }) => {
  const tracked = [
    '/local/', '/local/api', '/local/collections/form',
    '/local/collections/form/queryables', '/local/collections/form/schema',
  ];
  const requested = new Map();
  let conformanceRequests = 0;
  page.on('request', (request) => {
    const { pathname } = new URL(request.url());
    if (tracked.includes(pathname)) requested.set(pathname, (requested.get(pathname) || 0) + 1);
    // The service description publishes the collection: conformance is not needed
    if (pathname === '/local/conformance') conformanceRequests += 1;
  });
  const expectEach = (times) => expect.poll(() => Object.fromEntries(requested))
    .toEqual(Object.fromEntries(tracked.map((path) => [path, times])));
  await openLocalDataIDEE(page, 'form');
  await page.waitForFunction(() => window.dataideeDemo?.layer.getFeatures().length === 1);
  await page.locator('#vectorsmanagement-button').click();
  await page.locator('#m-vectorsmanagement-layer-selector').click();
  await page.locator('#m-vectorsmanagement-layer-selector-options span').first().click();
  await expectEach(1);
  // Selecting a feature and starting the editing check the capabilities again
  await page.locator('#m-vectorsmanagement-selection').click();
  const pixel = await page.evaluate(() => {
    const map = window.dataideeDemo.map.getMapImpl();
    const bounds = map.getTargetElement().getBoundingClientRect();
    const feature = window.dataideeDemo.layer.getFeatures()[0].getImpl().getFeature();
    const point = map.getPixelFromCoordinate(feature.getGeometry().getCoordinates());
    return [bounds.left + point[0], bounds.top + point[1]];
  });
  await page.mouse.click(pixel[0], pixel[1]);
  await page.locator('#m-vectorsmanagement-edition').click();
  await expect(page.locator('#m-vectorsmanagement-editing-save')).toBeEnabled();
  await expectEach(1);

  // Another token can change the permissions: they are requested again
  await page.evaluate(async () => {
    window.dataideeDemo.layer.setToken('otro-token');
    await window.dataideeDemo.layer.getEditingCapabilities();
  });
  await expectEach(2);
  expect(conformanceRequests).toBe(0);
});

test('ending DataIDEE editing with pending changes asks in an API dialog', async ({ page }) => {
  const prompts = [];
  page.on('dialog', async (dialog) => { prompts.push(dialog.message()); await dialog.dismiss(); });
  await openLocalDataIDEE(page);
  await page.waitForFunction(() => window.dataideeDemo?.layer.getImpl().isLoaded());
  await page.locator('#vectorsmanagement-button').click();
  await page.locator('#m-vectorsmanagement-layer-selector').click();
  await page.locator('#m-vectorsmanagement-layer-selector-options span').first().click();
  await page.locator('#m-vectorsmanagement-edition').click();
  await expect(page.locator('#m-vectorsmanagement-editing-save')).toBeEnabled();
  await page.evaluate(() => {
    window.dataideeDemo.layer.getFeatures()[0].getImpl().getFeature().getGeometry().translate(1, 0);
  });
  await expect.poll(() => page.evaluate(() => window.dataideeDemo.layer.getEditingSession().count))
    .toBe(1);
  const choice = page.getByRole('alertdialog', { name: 'Finalizar edición' });

  // Cancel is the default and keeps the session with its changes
  await page.locator('#m-vectorsmanagement-editing-end').click();
  await expect(choice).toBeVisible();
  await expect(choice.getByRole('button', { name: 'Cancelar' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(choice).toBeHidden();
  expect(await page.evaluate(() => window.dataideeDemo.layer.getEditingSession()?.count)).toBe(1);

  await page.locator('#m-vectorsmanagement-editing-end').click();
  await choice.getByRole('button', { name: 'Descartar' }).click();
  // Ending the session closes its panel: opening it again starts a new one
  await expect(page.locator('#m-vectorsmanagement-editing')).toHaveCount(0);
  await expect(page.locator('#m-vectorsmanagement-edition')).not.toHaveClass(/activated/);
  expect(await page.evaluate(() => window.dataideeDemo.layer.getEditingSession())).toBeNull();
  expect(prompts).toEqual([]);
});

test('DataIDEE editing starts with Creation or Edition and survives switching tools', async ({ page }) => {
  await openLocalDataIDEE(page);
  await page.waitForFunction(() => window.dataideeDemo?.layer.getImpl().isLoaded());
  await page.locator('#vectorsmanagement-button').click();
  await page.locator('#m-vectorsmanagement-layer-selector').click();
  await page.locator('#m-vectorsmanagement-layer-selector-options span').first().click();
  const section = page.locator('#m-vectorsmanagement-editing');
  const status = page.locator('#m-vectorsmanagement-editing-status');
  const sameSession = () => page.evaluate(() => (
    window.dataideeDemo.layer.getEditingSession() === window.firstEditingSession
  ));
  await expect(section).toHaveCount(0);

  await page.locator('#m-vectorsmanagement-creation').click();
  await expect(section).toBeVisible();
  await expect(page.locator('#m-vectorsmanagement-editing-save')).toBeEnabled();
  await expect(status).toContainText('Zona fija');
  await page.evaluate(() => {
    window.firstEditingSession = window.dataideeDemo.layer.getEditingSession();
  });

  // Another tool closes the panel; the session and its message stay
  await page.locator('#m-vectorsmanagement-selection').click();
  await expect(section).toHaveCount(0);
  await page.locator('#m-vectorsmanagement-edition').click();
  await expect(section).toBeVisible();
  await expect(status).toContainText('Zona fija');
  expect(await sameSession()).toBe(true);

  // Without changes, ending closes the panel; opening it again prepares a new session
  await page.locator('#m-vectorsmanagement-editing-end').click();
  await expect(section).toHaveCount(0);
  expect(await page.evaluate(() => window.dataideeDemo.layer.getEditingSession())).toBeNull();
  await page.locator('#m-vectorsmanagement-creation').click();
  await expect(page.locator('#m-vectorsmanagement-editing-save')).toBeEnabled();
  expect(await sameSession()).toBe(false);
});

test('DataIDEE form deletes the feature when the session is saved and the clean tool is available', async ({ page }) => {
  const itemCalls = [];
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/local/collections/form/items/7') {
      itemCalls.push(request.method());
    }
  });
  const demo = await openLocalDataIDEE(page, 'form');
  await page.waitForFunction(() => window.dataideeDemo?.layer.getFeatures().length === 1);
  await page.locator('#vectorsmanagement-button').click();
  await page.locator('#m-vectorsmanagement-layer-selector').click();
  await page.locator('#m-vectorsmanagement-layer-selector-options span').first().click();
  await page.locator('#m-vectorsmanagement-edition').click();
  await expect(page.locator('#m-vectorsmanagement-editing-save')).toBeEnabled();
  await expect(page.locator('#cleanAll')).toBeVisible();

  const form = page.locator('.m-vectorsmanagement-dataidee-fields');
  const deleteButton = page.locator('#m-vectorsmanagement-dataidee-delete');
  const featureCount = () => page.evaluate(() => window.dataideeDemo.layer.getFeatures().length);
  const pending = () => page.evaluate(() => window.dataideeDemo.layer.getEditingSession().count);
  const openForm = async () => {
    const pixel = await page.evaluate(() => {
      const map = window.dataideeDemo.map.getMapImpl();
      const bounds = map.getTargetElement().getBoundingClientRect();
      const feature = window.dataideeDemo.layer.getFeatures()[0].getImpl().getFeature();
      const point = map.getPixelFromCoordinate(feature.getGeometry().getCoordinates());
      return [bounds.left + point[0], bounds.top + point[1]];
    });
    await page.mouse.click(pixel[0], pixel[1]);
    await expect(page.locator('#editattribute')).toBeEnabled();
    await page.locator('#editattribute').click();
    await expect(form).toBeVisible();
  };

  await openForm();
  await expect(deleteButton).toBeVisible();
  await deleteButton.click();
  await expect(form).toBeHidden();
  await expect.poll(featureCount).toBe(0);
  await expect.poll(pending).toBe(1);
  expect(itemCalls).toEqual([]);

  await page.locator('#m-vectorsmanagement-editing-discard').click();
  await expect.poll(featureCount).toBe(1);
  await expect.poll(pending).toBe(0);

  await openForm();
  await deleteButton.click();
  await expect.poll(pending).toBe(1);
  await page.locator('#m-vectorsmanagement-editing-save').click();
  await expect(page.locator('#m-vectorsmanagement-editing-status')).toContainText('Guardadas 1');
  expect(itemCalls).toEqual(['GET', 'DELETE']);

  await demo.remount();
  await page.waitForFunction(() => window.dataideeDemo?.layer.getImpl().isLoaded());
  expect(await featureCount()).toBe(0);
});
