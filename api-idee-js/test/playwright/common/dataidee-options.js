import { test, expect } from '@playwright/test';

/**
 * Validación de opciones de DataIDEE al construir la capa, igual en todos los motores.
 * No hace peticiones: las capas no se añaden al mapa.
 */
export default function registerDataIDEEOptionsTests(pagePath) {
  const params = { url: 'https://options.test/', name: 'places' };

  test('DataIDEE rejects invalid options and unsupported combinations with TypeError', async ({ page }) => {
    await page.goto(pagePath);
    const results = await page.evaluate((layerParams) => {
      const attempt = (userParams, opt, vendorOpts) => {
        try {
          // eslint-disable-next-line no-new
          new IDEE.layer.DataIDEE(userParams, opt, vendorOpts);
          return 'created';
        } catch (error) {
          return error instanceof TypeError ? 'TypeError' : error.name;
        }
      };
      const cases = {
        strategyNotBoolean: [layerParams, { bboxStrategy: 'true' }],
        strategyWithId: [{ ...layerParams, id: 'item-1' }, { bboxStrategy: true }],
        strategyWithSource: [layerParams, { bboxStrategy: true }, { source: { external: true } }],
        tokenLocationUnknown: [layerParams, {}, { tokenLocation: 'Header' }],
        tokenLocationCookie: [layerParams, {}, { tokenLocation: 'cookie' }],
        contextTokenNumber: [layerParams, {}, { contextToken: 1 }],
        contextTokenObject: [layerParams, {}, { contextToken: {} }],
        contextTokenNull: [layerParams, {}, { contextToken: null }],
        cacheString: [layerParams, { cache: 'yes' }],
        cacheZeroTtl: [layerParams, { cache: { ttlMs: 0 } }],
        throttleNegative: [layerParams, { throttleMs: -1 }],
        throttleDecimal: [layerParams, { throttleMs: 1.5 }],
        editingLimitsString: [layerParams, { editingLimits: 'abc' }],
        editingLimitsNull: [layerParams, { editingLimits: null }],
        editingLimitsArray: [layerParams, { editingLimits: [1] }],
        editingLimitZero: [layerParams, { editingLimits: { pageSize: 0 } }],
        editingLimitNegative: [layerParams, { editingLimits: { maxFeatures: -1 } }],
        editingLimitDecimal: [layerParams, { editingLimits: { maxCoordinates: 1.5 } }],
        editingLimitText: [layerParams, { editingLimits: { maxBytes: '10' } }],
      };
      const outcomes = Object.fromEntries(Object.entries(cases)
        .map(([name, args]) => [name, attempt(...args)]));
      try {
        new IDEE.layer.DataIDEE(layerParams).setContextToken(5);
        outcomes.contextTokenSetter = 'created';
      } catch (error) {
        outcomes.contextTokenSetter = error instanceof TypeError ? 'TypeError' : error.name;
      }
      return outcomes;
    }, params);
    Object.entries(results).forEach(([name, result]) => {
      expect(result, name).toBe('TypeError');
    });
  });

  test('DataIDEE accepts valid option groups and keeps previous combinations', async ({ page }) => {
    await page.goto(pagePath);
    const results = await page.evaluate((layerParams) => {
      const attempt = (userParams, opt, vendorOpts) => {
        try {
          // eslint-disable-next-line no-new
          new IDEE.layer.DataIDEE(userParams, opt, vendorOpts);
          return 'created';
        } catch (error) {
          return `${error.name}: ${error.message}`;
        }
      };
      const cases = {
        defaults: [layerParams],
        strategy: [layerParams, { bboxStrategy: true, cache: true, throttleMs: 300 }],
        strategyOff: [layerParams, { bboxStrategy: false }],
        itemWithoutStrategy: [{ ...layerParams, id: 'item-1' }, { bboxStrategy: false }],
        sourceWithoutStrategy: [layerParams, {}, { source: { external: true } }],
        headerToken: [layerParams, {}, { getFeature: { token: 'a' }, tokenLocation: 'header' }],
        queryToken: [layerParams, {}, { getFeature: { token: 'a' }, tokenLocation: 'query' }],
        contextTokenString: [layerParams, {}, { contextToken: 'ctx' }],
        contextTokenFunction: [layerParams, {}, { contextToken: () => 'ctx' }],
        contextTokenWithAuth: [layerParams, {}, {
          getFeature: { token: 'a' }, tokenLocation: 'query', contextToken: async () => 'ctx',
        }],
        cacheObject: [layerParams, { cache: { ttlMs: 1000, maxEntries: 2, maxBytes: 1024 } }],
        partialEditingLimits: [layerParams, { editingLimits: { pageSize: 5 } }],
      };
      return Object.fromEntries(Object.entries(cases)
        .map(([name, args]) => [name, attempt(...args)]));
    }, params);
    Object.entries(results).forEach(([name, result]) => {
      expect(result, name).toBe('created');
    });
  });

  test('DataIDEE id setter keeps collection-only viewport layers consistent', async ({ page }) => {
    await page.goto(pagePath);
    const result = await page.evaluate((layerParams) => {
      const viewport = new IDEE.layer.DataIDEE(layerParams, { bboxStrategy: true });
      const fixed = new IDEE.layer.DataIDEE(layerParams);
      let viewportError = '';
      try {
        viewport.id = 'item-1';
      } catch (error) {
        viewportError = error instanceof TypeError ? 'TypeError' : error.name;
      }
      viewport.id = '';
      fixed.id = 'item-1';
      return { viewportError, viewportId: viewport.id || null, fixedId: fixed.id };
    }, params);
    expect(result).toEqual({ viewportError: 'TypeError', viewportId: null, fixedId: 'item-1' });
  });
}
