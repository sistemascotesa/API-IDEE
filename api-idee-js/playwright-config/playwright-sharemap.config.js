import { defineConfig, devices } from '@playwright/test';
import base from './playwright-ol.config';

export default defineConfig({
  ...base,
  testMatch: ['test/playwright/ol/PLAY-rest-layers.spec.js',
    'test/playwright/cesium/PLAY-rest-layers.spec.js',
    'src/plugins/sharemap/test/playwright/ol/*.spec.js'],
  webServer: { ...base.webServer, command: 'npm run start:test -- --entry ./test/configuration_filtered.js' },
  workers: 1,
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
