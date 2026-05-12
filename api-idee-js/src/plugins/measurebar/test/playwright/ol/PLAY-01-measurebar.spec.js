import { test, expect } from '@playwright/test';

test('Test measurebar', async ({ page }) => {
  await page.goto('/src/plugins/measurebar/test/playwright/ol/measurebar-ol.html');
  await page.evaluate(() => {
    window.mapjs = IDEE.map({
      container: 'mapjs',
    });
    window.mp = new IDEE.plugin.MeasureBar({
      position: 'left',
    });
    window.mapjs.addPlugin(window.mp);
  });

  const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
  expect(nPlugins).toBe(0);
});
