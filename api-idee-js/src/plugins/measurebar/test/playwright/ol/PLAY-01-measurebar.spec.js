// import { test, expect } from '@playwright/test';

// Plugin obsoleto en esta versión del API 2.0, se eliminará en futuras versiones.
// Se comenta para evitar confusiones a los desarrolladores.

// test('Test measurebar', async ({ page }) => {
//   await page.goto('/src/plugins/measurebar/test/playwright/ol/measurebar-ol.html');
//   await page.evaluate(() => {
//     window.mapjs = IDEE.map({
//       container: 'mapjs',
//     });
//     window.mp = new IDEE.plugin.MeasureBar({
//       position: 'left',
//     });
//     window.mapjs.addPlugin(window.mp);
//   });

//   const nPlugins = await page.evaluate(() => window.mapjs.getPlugins().length);
//   expect(nPlugins).toBe(1);
// });
