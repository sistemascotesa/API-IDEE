import { test, expect } from '@playwright/test';

import registerRequestManagerTests from '../common/request-manager.spec';
import registerDataIDEECacheLayerTests from '../common/dataidee-layer-cache';
import registerDataIDEEViewportTests from '../common/dataidee-viewport';
import registerDataIDEEAuthTests from '../common/dataidee-auth';
import registerDataIDEEOptionsTests from '../common/dataidee-options';

registerDataIDEECacheLayerTests('/test/playwright/ol/basic-ol.html');
registerDataIDEEViewportTests('/test/playwright/ol/basic-ol.html');
registerDataIDEEAuthTests('/test/playwright/ol/basic-ol.html');
registerDataIDEEOptionsTests('/test/playwright/ol/basic-ol.html');

const geoJSON = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    id: 'road-1',
    geometry: { type: 'Point', coordinates: [0, 0] },
    properties: { name: 'Main road' },
  }],
};

test('OGCAPIFeatures keeps the previous GetFeatureUrl request by default', async ({ page }) => {
  await page.route('https://ogc.test/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/geo+json',
    body: JSON.stringify(geoJSON),
  }));
  await page.goto('/test/playwright/ol/basic-ol.html');
  await page.evaluate(() => {
    window.map = IDEE.map({ container: 'map' });
  });
  await page.waitForFunction(() => window.map.isFinished());

  const requestPromise = page.waitForRequest((request) => request.url().startsWith('https://ogc.test/'));
  await page.evaluate(() => {
    window.map.addLayers(new IDEE.layer.OGCAPIFeatures({
      url: 'https://ogc.test/',
      name: 'roads',
      limit: 4,
    }, {}, { cql: "name = 'Main road'" }));
  });

  const request = await requestPromise;
  expect(request.method()).toBe('GET');
  expect(new URL(request.url()).pathname).toBe('/roads/items');
  expect(new URL(request.url()).searchParams.get('limit')).toBe('4');
  expect(new URL(request.url()).searchParams.get('filter')).toBe("name = 'Main road'");
  expect(new URL(request.url()).searchParams.has('filter-lang')).toBe(false);
});

test('DataIDEE preserves the shared public configuration and performs filtered GET requests', async ({ page }) => {
  await page.route('https://ogc.test/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/geo+json',
    body: JSON.stringify(geoJSON),
  }));
  await page.goto('/test/playwright/ol/basic-ol.html');
  await page.evaluate(() => {
    window.map = IDEE.map({ container: 'map' });
  });
  await page.waitForFunction(() => window.map.isFinished());

  const requestPromise = page.waitForRequest((request) => request.url().startsWith('https://ogc.test/'));
  const api = await page.evaluate(() => {
    const layer = new IDEE.layer.DataIDEE({
      url: 'https://ogc.test/collections/',
      name: 'roads',
      legend: 'Roads',
      limit: 4,
      offset: 2,
      bbox: [1, 2, 3, 4],
      format: 'json',
      extract: false,
      template: '<div>{name}</div>',
    }, { opacity: 0.8 }, {
      filter: "name = 'Main road'",
      filterLang: 'cql2-text',
    });
    window.ogcLayer = layer;
    window.map.addLayers(layer);
    return {
      name: layer.name,
      url: layer.url,
      legend: layer.legend,
      limit: layer.limit,
      offset: layer.offset,
      bbox: layer.bbox,
      format: layer.format,
      extract: layer.extract,
      template: layer.template,
      equalsMethod: typeof layer.equals,
      setStyleMethod: typeof layer.setStyle,
    };
  });

  const request = await requestPromise;
  const url = new URL(request.url());
  expect(request.method()).toBe('GET');
  expect(url.pathname).toBe('/collections/roads/items');
  expect(url.searchParams.get('limit')).toBe('4');
  expect(url.searchParams.get('offset')).toBe('2');
  expect(url.searchParams.get('bbox')).toBe('1,2,3,4');
  expect(url.searchParams.get('f')).toBe('json');
  expect(url.searchParams.get('filter')).toBe("name = 'Main road'");
  expect(url.searchParams.get('filter-lang')).toBe('cql2-text');
  expect(api).toEqual({
    name: 'roads',
    url: 'https://ogc.test/collections/',
    legend: 'Roads',
    limit: 4,
    offset: 2,
    bbox: [1, 2, 3, 4],
    format: 'json',
    extract: false,
    template: '<div>{name}</div>',
    equalsMethod: 'function',
    setStyleMethod: 'function',
  });
});

test('DataIDEE caches an exact request, invalidates it, and refreshes from the network', async ({ page }) => {
  let requestCount = 0;
  await page.route('https://ogc.test/**', async (route) => {
    requestCount += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/geo+json',
      body: JSON.stringify(geoJSON),
    });
  });
  await page.goto('/test/playwright/ol/basic-ol.html');
  await page.evaluate(() => {
    window.map = IDEE.map({ container: 'map' });
  });
  await page.waitForFunction(() => window.map.isFinished());
  await page.evaluate(() => {
    window.dataIdee = new IDEE.layer.DataIDEE({
      url: 'https://ogc.test/collections/', name: 'roads',
    }, { cache: { ttlMs: 60000 } });
    window.map.addLayers(window.dataIdee);
  });
  await page.waitForFunction(() => window.dataIdee.getFeatures().length === 1);
  await page.evaluate(async () => {
    // This implementation entry point observes the exact same request path as layer loading.
    // eslint-disable-next-line no-underscore-dangle
    await window.dataIdee.getImpl().requestFeatures_();
  });
  expect(requestCount).toBe(1);

  await page.evaluate(() => window.dataIdee.clearCache());
  await page.evaluate(async () => {
    // eslint-disable-next-line no-underscore-dangle
    await window.dataIdee.getImpl().requestFeatures_();
  });
  expect(requestCount).toBe(2);
  // A refresh goes to the network with the same URL: DataIDEE rejects unknown parameters
  const refreshRequest = page.waitForRequest((request) => request.url().startsWith('https://ogc.test/'));
  await page.evaluate(() => window.dataIdee.refresh());
  const refreshed = await refreshRequest;
  await refreshed.response();
  expect(refreshed.url()).not.toContain('_ideeRefresh');
  expect(requestCount).toBe(3);
});

test('DataIDEE requests an individual feature by ID', async ({ page }) => {
  await page.route('https://ogc.test/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/geo+json',
    body: JSON.stringify(geoJSON),
  }));
  await page.goto('/test/playwright/ol/basic-ol.html');
  await page.evaluate(() => {
    window.map = IDEE.map({ container: 'map' });
  });
  await page.waitForFunction(() => window.map.isFinished());

  const requestPromise = page.waitForRequest((request) => request.url().startsWith('https://ogc.test/'));
  await page.evaluate(() => {
    window.map.addLayers(new IDEE.layer.DataIDEE({
      url: 'https://ogc.test/collections/',
      name: 'roads',
      id: 'road-1',
    }));
  });
  const request = await requestPromise;
  expect(request.method()).toBe('GET');
  expect(new URL(request.url()).pathname).toBe('/collections/roads/items/road-1');
});

test('DataIDEE omits the format parameter when the service uses its GeoJSON default', async ({ page }) => {
  await page.route('https://ogc.test/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/geo+json',
    body: JSON.stringify(geoJSON),
  }));
  await page.goto('/test/playwright/ol/basic-ol.html');
  await page.evaluate(() => {
    window.map = IDEE.map({ container: 'map' });
  });
  await page.waitForFunction(() => window.map.isFinished());

  const requestPromise = page.waitForRequest((request) => request.url().startsWith('https://ogc.test/'));
  await page.evaluate(() => {
    window.map.addLayers(new IDEE.layer.DataIDEE({
      url: 'https://ogc.test/data-idee-api',
      name: 'local:eurovelo_rutas',
      limit: 10,
    }, {}, {
      filter: "etapa = 'Etapa 4'",
      filterLang: 'cql2-text',
    }));
  });
  const url = new URL((await requestPromise).url());
  expect(url.pathname).toBe('/data-idee-api/collections/local%3Aeurovelo_rutas/items');
  expect(url.searchParams.has('f')).toBe(false);
  expect(url.searchParams.get('filter')).toBe("etapa = 'Etapa 4'");
  expect(url.searchParams.get('filter-lang')).toBe('cql2-text');
});

test('DataIDEE keeps the existing CQL vendor option usable', async ({ page }) => {
  await page.route('https://ogc.test/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/geo+json',
    body: JSON.stringify(geoJSON),
  }));
  await page.goto('/test/playwright/ol/basic-ol.html');
  await page.evaluate(() => {
    window.map = IDEE.map({ container: 'map' });
  });
  await page.waitForFunction(() => window.map.isFinished());

  const requestPromise = page.waitForRequest((request) => request.url().startsWith('https://ogc.test/'));
  await page.evaluate(() => {
    window.map.addLayers(new IDEE.layer.DataIDEE({
      url: 'https://ogc.test/collections/',
      name: 'roads',
    }, {}, { cql: "name = 'Main road'" }));
  });
  const request = await requestPromise;
  const url = new URL(request.url());
  expect(request.method()).toBe('GET');
  expect(url.searchParams.get('filter')).toBe("name = 'Main road'");
  expect(url.searchParams.has('filter-lang')).toBe(false);
});

test('DataIDEE loads features and supports map add, get and remove methods', async ({ page }) => {
  await page.route('https://ogc.test/**', (route) => route.fulfill({
    status: 200,
    contentType: 'application/geo+json',
    body: JSON.stringify(geoJSON),
  }));
  await page.goto('/test/playwright/ol/basic-ol.html');
  await page.evaluate(() => {
    window.map = IDEE.map({ container: 'map' });
  });
  await page.waitForFunction(() => window.map.isFinished());
  await page.evaluate(() => window.map.setCenter([0, 0]));

  const layersAfterAdd = await page.evaluate(() => {
    window.ogcLayer = new IDEE.layer.DataIDEE({
      url: 'https://ogc.test/collections/',
      name: 'roads',
    });
    window.map.addDataIDEE(window.ogcLayer);
    return window.map.getDataIDEE().length;
  });
  expect(layersAfterAdd).toBe(1);
  await page.waitForFunction(() => window.ogcLayer.getFeatures().length === 1);

  const state = await page.evaluate(() => {
    const featuresLoaded = window.ogcLayer.getFeatures().length;
    const layerWasFound = window.map.getDataIDEE('roads')[0] === window.ogcLayer;
    window.map.removeDataIDEE('roads');
    return {
      featuresLoaded,
      layerWasFound,
      layersAfterRemoval: window.map.getDataIDEE().length,
    };
  });
  expect(state).toEqual({ featuresLoaded: 1, layerWasFound: true, layersAfterRemoval: 0 });
});

test('DataIDEE viewport converts a local projected CRS view to a finite CRS84 bbox', async ({ page }) => {
  const urls = [];
  await page.route('https://utm.test/**', (route) => {
    urls.push(route.request().url());
    return route.fulfill({ json: geoJSON });
  });
  await page.goto('/test/playwright/ol/basic-ol.html');
  await page.evaluate(() => {
    window.map = IDEE.map({
      container: 'map', projection: 'EPSG:25830*m', center: [440000, 4474000], zoom: 8,
    });
  });
  await page.waitForFunction(() => window.map.isFinished());
  await page.evaluate(() => {
    window.utmLayer = new IDEE.layer.DataIDEE({
      url: 'https://utm.test/', name: 'places',
    }, { bboxStrategy: true });
    window.map.addLayers(window.utmLayer);
  });
  const madrid = [-3.7, 40.4];
  const expectValidBbox = (url) => {
    const [west, south, east, north] = new URL(url).searchParams.get('bbox').split(',').map(Number);
    [west, south, east, north].forEach((value) => expect(Number.isFinite(value)).toBe(true));
    expect(west).toBeGreaterThanOrEqual(-180);
    expect(east).toBeLessThanOrEqual(180);
    expect(south).toBeGreaterThanOrEqual(-90);
    expect(north).toBeLessThanOrEqual(90);
    expect(west).toBeLessThan(madrid[0]);
    expect(east).toBeGreaterThan(madrid[0]);
    expect(south).toBeLessThan(madrid[1]);
    expect(north).toBeGreaterThan(madrid[1]);
    return [west, south, east, north];
  };
  await expect.poll(() => urls.length).toBe(1);
  const near = expectValidBbox(urls[0]);
  await page.evaluate(() => {
    const native = window.map.getMapImpl();
    native.getView().setResolution(native.getView().getMaxResolution());
    native.dispatchEvent('moveend');
  });
  await expect.poll(() => urls.length).toBe(2);
  const far = expectValidBbox(urls[1]);
  expect(far[2] - far[0]).toBeGreaterThan(near[2] - near[0]);
});

registerRequestManagerTests('/test/playwright/ol/basic-ol.html');
