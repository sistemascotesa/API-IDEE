import { test, expect } from '@playwright/test';
import { prepareGeoPackagePage } from './fixtures/geopackage';

test.beforeEach(async ({ page }) => prepareGeoPackagePage(page));

test('GeoPackage: se crea desde la configuración JSON del mapa con su estilo', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const layerConfig = JSON.parse(JSON.stringify({
      type: 'GeoPackage',
      url: '/fixtures/geopackage/mixed.gpkg',
      name: 'reference',
      legend: 'Reference data',
      opacity: 0.8,
      visibility: false,
      style: {
        point: { radius: 7, fill: { color: '#ff0000' } },
      },
      tables: {
        places: {
          legend: 'Places',
          opacity: 0.4,
          style: {
            point: { radius: 4, fill: { color: '#0000ff' } },
          },
        },
        imagery: { visibility: true },
      },
    }));
    const originalConfig = JSON.stringify(layerConfig);
    const map = IDEE.map({
      container: 'map', layers: [layerConfig], controls: [], center: [0, 0], zoom: 2,
    });
    const geoPackage = map.geopackages[0];
    await geoPackage.whenReady();
    const vector = geoPackage.getLayer('places');
    const raster = geoPackage.getLayer('imagery');
    const { style } = vector.options;
    return {
      package: {
        count: map.geopackages.length,
        name: geoPackage.name,
        legend: geoPackage.legend,
      },
      vector: {
        name: vector.name,
        legend: vector.legend,
        opacity: vector.getOpacity(),
        visible: vector.isVisible(),
        radius: style.point.radius,
        color: style.point.fill.color,
      },
      raster: {
        name: raster.name,
        opacity: raster.getOpacity(),
        visible: raster.isVisible(),
      },
      unchanged: JSON.stringify(layerConfig) === originalConfig,
    };
  });

  expect(result).toEqual({
    package: { count: 1, name: 'reference', legend: 'Reference data' },
    vector: {
      name: 'reference:places',
      legend: 'Places',
      opacity: 0.4,
      visible: false,
      radius: 4,
      color: '#0000ff',
    },
    raster: {
      name: 'reference:imagery',
      opacity: 0.8,
      visible: true,
    },
    unchanged: true,
  });
});

test('GeoPackage: admite opciones anidadas al crearse con addLayers', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const map = IDEE.map({ container: 'map', layers: [], controls: [] });
    map.addLayers({
      type: 'GeoPackage',
      url: '/fixtures/geopackage/vector.gpkg',
      name: 'nested',
      options: {
        opacity: 0,
        visibility: false,
        style: { point: { radius: 3, fill: { color: '#00ff00' } } },
      },
    });
    const geoPackage = map.geopackages[0];
    await geoPackage.whenReady();
    const layer = geoPackage.getLayer('places');
    return {
      opacity: layer.getOpacity(),
      visible: layer.isVisible(),
      radius: layer.options.style.point.radius,
    };
  });

  expect(result).toEqual({ opacity: 0, visible: false, radius: 3 });
});
