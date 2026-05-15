import { test, expect } from '@playwright/test';

test('Test plugin Infocoordinates', async ({ page }) => {
  await page.goto('/src/plugins/infocoordinates/test/playwright/ol/infocoordinates-ol.html');
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.Infocoordinates();
    window.mapjs.addPlugin(window.mp);
  });
  
  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins(window.mp.name).length);
  expect(nPlugins).toBe(1);
});
