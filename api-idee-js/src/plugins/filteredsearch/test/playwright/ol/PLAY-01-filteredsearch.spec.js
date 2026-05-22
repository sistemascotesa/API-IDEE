// // eslint-disable-next-line import/no-extraneous-dependencies
// import { test, expect } from '@playwright/test';

// test('Test Plugin FilteredSearch', async ({ page }) => {
//   await page.goto('/src/plugins/filteredsearch/test/playwright/ol/filteredsearch-ol.html');
//   await page.evaluate(() => {
//     window.mapjs = IDEE.map({
//       container: 'mapjs',
//     });
//     window.mp = new IDEE.plugin.FilteredSearch();
//     window.mapjs.addPlugin(window.mp);
//   });

//   const nPlugins = await page.evaluate(() => window.mapjs.getPlugins(window.mp.name).length);
//   expect(nPlugins).toBe(1);
// });
