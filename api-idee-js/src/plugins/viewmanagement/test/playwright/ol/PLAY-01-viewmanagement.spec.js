import { test, expect } from '@playwright/test';

test('Test plugin Viewmanagement', async ({ page }) => {
  await page.goto('/src/plugins/viewmanagement/test/playwright/ol/viewmanagement-ol.html');
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.ViewManagement();
    window.mapjs.addPlugin(window.mp);
  });
  
  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins(window.mp.name).length);
  expect(nPlugins).toBe(1);
});
