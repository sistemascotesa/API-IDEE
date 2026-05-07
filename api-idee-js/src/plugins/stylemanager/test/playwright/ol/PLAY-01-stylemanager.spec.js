import { test, expect } from '@playwright/test';

test('Test StyleManager', async ({ page }) => {
  await page.goto('/src/plugins/stylemanager/test/playwright/ol/stylemanager-ol.html');
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.StyleManager({
      position: 'left',
      collapsed: true,
    });
    window.mapjs.addPlugin(window.mp);
  });
  
  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(1);
});
