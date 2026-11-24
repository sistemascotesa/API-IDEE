import { test, expect } from '@playwright/test';
import { CORS, routePng } from '../common/mocks';
import { createGeoPackage } from './fixtures/geopackage';

/*
 * Control ImplementationSwitcher: cambia el mapa entre OpenLayers y Cesium en la misma
 * página conservando su estado (capas, grupos, secciones, controles, configuración e
 * idioma). Cada núcleo se carga una sola vez y lo que el destino no admite se conserva
 * para cuando se vuelva.
 */
const PAGE = '/test/playwright/ol/basic-ol.html';
const TILES = 'https://tiles.switcher.test';
const WMS = 'https://wms.switcher.test/wms';
const TILESET = 'https://tiles3d.switcher.test/tileset.json';
const ION = 'https://ion.switcher.test';
const ION_ASSETS = 'https://assets.switcher.test';
const DATAIDEE = 'https://dataidee.switcher.test';
const GEOPACKAGE = 'https://gpkg.switcher.test/datos.gpkg';
const CHANGE_TIMEOUT = 60000;

test.describe.configure({ timeout: 180000 });

const TILESET_JSON = JSON.stringify({
  asset: { version: '1.0' },
  geometricError: 0,
  root: {
    boundingVolume: { region: [-0.07, 0.7, -0.06, 0.71, 0, 10] },
    geometricError: 0,
    refine: 'ADD',
  },
});

/** Responde a un preflight CORS con las cabeceras que pide el navegador. */
const preflight = (route) => route.fulfill({
  status: 204,
  headers: {
    ...CORS,
    'access-control-allow-headers': route.request().headers()['access-control-request-headers'] || '*',
  },
});

const mockServices = async (page) => {
  const requests = { tileset: [], ion: [] };
  await routePng(page, `${TILES}/**`);
  await routePng(page, `${WMS}**`);
  await page.route(TILESET, (route) => {
    if (route.request().method() === 'OPTIONS') return preflight(route);
    requests.tileset.push(route.request().headers()['x-api-key']);
    return route.fulfill({
      status: 200, headers: CORS, contentType: 'application/json', body: TILESET_JSON,
    });
  });
  await page.route(`${ION}/**`, (route) => {
    if (route.request().method() === 'OPTIONS') return preflight(route);
    requests.ion.push(new URL(route.request().url()).searchParams.get('access_token'));
    return route.fulfill({
      status: 200,
      headers: CORS,
      contentType: 'application/json',
      body: JSON.stringify({
        type: '3DTILES', url: `${ION_ASSETS}/7/tileset.json`, accessToken: 'asset', attributions: [],
      }),
    });
  });
  await page.route(`${ION_ASSETS}/**`, (route) => (route.request().method() === 'OPTIONS'
    ? preflight(route)
    : route.fulfill({
      status: 200, headers: CORS, contentType: 'application/json', body: TILESET_JSON,
    })));
  return requests;
};

/** Abre un mapa OL sin capa base ni terreno (sin red) con el control de cambio. */
const openMap = async (page) => {
  await page.goto(PAGE);
  await page.evaluate(({ tiles, wms }) => {
    IDEE.config.baseLayer = [];
    if (IDEE.config.terrain) IDEE.config.terrain.default = [];
    window.changes = [];
    window.addEventListener('idee:implementationchange', ({ detail }) => {
      window.map = detail.map;
      window.changes.push(detail);
    });
    window.map = IDEE.map({
      container: 'map', layers: [], controls: ['scale'], center: [-411884, 4927603], zoom: 6,
    });
    const xyz = (name) => new IDEE.layer.XYZ({
      url: `${tiles}/${name}/{z}/{x}/{y}.png`, name, legend: name, transparent: true,
    });
    const points = (name) => new IDEE.layer.GeoJSON({
      name,
      legend: name,
      source: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature', id: 'a', geometry: { type: 'Point', coordinates: [-3.7, 40.4] }, properties: {},
          },
        ],
      },
    });
    const wmsLayer = new IDEE.layer.WMS({
      url: wms, name: 'unidades', legend: 'Unidades', useCapabilities: false,
    });
    const hidden = xyz('oculta');
    window.map.addLayers([wmsLayer, hidden, points('puntos')]);
    wmsLayer.setOpacity(0.5);
    hidden.setVisible(false);
    window.map.addLayers(new IDEE.layer.LayerGroup({
      name: 'grupo', legend: 'Grupo', layers: [xyz('hija_xyz'), points('hija_puntos')],
    }));
    window.map.addSections(new IDEE.layer.Section({ title: 'Sección', children: [xyz('en_seccion')] }));
    window.map.addControls(new IDEE.control.ImplementationSwitcher({ collapsed: false }));
  }, { tiles: TILES, wms: WMS });
};

/** Cambia de implementación con el desplegable y espera al mapa nuevo. */
const switchTo = async (page, index, changes) => {
  await page.locator('select#m-implementationswitcher-select').selectOption({ index });
  await expect.poll(() => page.evaluate(() => window.changes.length), { timeout: CHANGE_TIMEOUT })
    .toBe(changes);
};

/** Resumen del mapa actual comparable entre implementaciones. */
const summary = (page) => page.evaluate(() => {
  const { map } = window;
  const layer = (l) => ({
    name: l.name, visible: l.isVisible(), opacity: Math.round(l.getOpacity() * 100) / 100,
  });
  const userLayers = map.getLayers().filter((l) => !l.name.startsWith('__') && !l.getSection());
  return {
    implementation: map.getImplementation(),
    layers: userLayers.filter((l) => l.type !== 'LayerGroup').map(layer)
      .sort((a, b) => a.name.localeCompare(b.name)),
    group: map.getLayerGroup().map((g) => [g.name, g.getLayers().map((l) => l.name).sort()]),
    sections: map.getSections().map((s) => [s.title, s.getChildren().map((l) => l.name)]),
    controls: map.getControls().map((c) => c.name).sort(),
    config: IDEE.config.TEST_SWITCHER,
    lang: IDEE.language.getLang(),
  };
});

test.describe('IDEE.control.ImplementationSwitcher', () => {
  test('isKnownControl solo reconoce los controles del núcleo', async ({ page }) => {
    await page.goto(PAGE);
    const known = await page.evaluate(() => [
      'scale', 'scale*exactScale=true', 'implementationswitcher', 'location', 'Locator', 'layerswitcher', '',
    ].map((name) => IDEE.facade.builder.isKnownControl(name)));
    expect(known).toEqual([true, true, true, true, false, false, false]);
  });

  test('OL → Cesium → OL conserva capas, grupos, secciones, controles, configuración e idioma', async ({ page }) => {
    const cores = [];
    page.on('request', (request) => {
      const match = /apiidee\.(ol|cesium)\.min\.js/.exec(request.url());
      if (match) cores.push(match[1]);
    });
    await mockServices(page);
    const contextTokens = [];
    await page.route(`${DATAIDEE}/**`, (route) => {
      contextTokens.push(new URL(route.request().url()).searchParams.getAll('contextToken'));
      return route.fulfill({
        headers: CORS,
        contentType: 'application/geo+json',
        body: JSON.stringify({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature', id: 'd', geometry: { type: 'Point', coordinates: [-3.7, 40.4] }, properties: {},
          }],
        }),
      });
    });
    await page.route('**/sql-wasm.wasm', (route) => route.fulfill({
      path: require.resolve('sql.js/dist/sql-wasm.wasm'),
      contentType: 'application/wasm',
    }));
    await page.route(GEOPACKAGE, async (route) => route.fulfill({
      headers: CORS,
      contentType: 'application/geopackage+sqlite3',
      body: await createGeoPackage('vector'),
    }));
    await openMap(page);
    await page.evaluate(async ({ tiles, dataidee, geopackage }) => {
      IDEE.config('TEST_SWITCHER', 'conservado');
      IDEE.language.setLang('en');
      const kmz = await (await fetch('/test/playwright/fixtures/kmz/basic.kmz')).arrayBuffer();
      const gpx = await (await fetch('/test/development/CP-0002-layers/fixtures/CP-035.gpx')).text();
      window.map.addLayers([
        new IDEE.layer.KMZ({ name: 'kmz_local', legend: 'kmz_local', source: kmz }),
        new IDEE.layer.GPX({ name: 'gpx_local', legend: 'gpx_local', source: gpx }, {
          style: new IDEE.style.Generic({ line: { stroke: { color: '#ff0000', width: 4 } } }),
        }),
        new IDEE.layer.XYZ({
          url: `${tiles}/recortada/{z}/{x}/{y}.png`,
          name: 'recortada',
          legend: 'recortada',
          transparent: true,
          maxExtent: [-1113194.9, 4163881.1, 556597.5, 5465442.2],
        }),
        new IDEE.layer.DataIDEE({ url: `${dataidee}/`, name: 'dataidee', legend: 'dataidee' }, {}, {
          contextToken: () => 'ctx-switch',
        }),
      ]);
      window.map.getLayers().find((l) => l.name === 'gpx_local').predefinedStyles
        .push(new IDEE.style.Generic({ line: { stroke: { color: '#00ff00', width: 2 } } }));
      const gpkg = new IDEE.layer.GeoPackage({ url: geopackage, name: 'paquete' });
      const loaded = new Promise((resolve) => { gpkg.once(IDEE.evt.LOAD_LAYERS, resolve); });
      window.map.addLayers(gpkg);
      await loaded;
      const places = gpkg.getLayer('places');
      places.setStyle(new IDEE.style.Generic({
        point: {
          radius: 6, fill: { color: '#ffffff', opacity: 0.4 }, stroke: { color: '#000000', width: 2 },
        },
      }));
      places.setOpacity(0.6);
    }, { tiles: TILES, dataidee: DATAIDEE, geopackage: GEOPACKAGE });
    const localLayers = () => page.evaluate(() => {
      const find = (name) => window.map.getLayers().find((l) => l.name === name);
      const extent = find('recortada').getMaxExtent();
      const places = find('paquete:places');
      return {
        kmz: find('kmz_local').getFeatures().length > 0,
        gpx: find('gpx_local').getFeatures().length > 0,
        gpxStroke: find('gpx_local').getStyle()?.getOptions()?.line?.stroke?.color,
        gpxStyles: find('gpx_local').predefinedStyles.length,
        gpkgStroke: places?.getStyle()?.getOptions()?.point?.stroke?.color,
        gpkgOpacity: places ? Math.round(places.getOpacity() * 100) / 100 : undefined,
        extent: Array.isArray(extent) ? extent.map((value) => Math.round(value)) : extent,
      };
    });
    const metres = {
      kmz: true,
      gpx: true,
      gpxStroke: '#ff0000',
      gpxStyles: 2,
      gpkgStroke: '#000000',
      gpkgOpacity: 0.6,
      extent: [-1113195, 4163881, 556598, 5465442],
    };
    await expect.poll(localLayers, { timeout: CHANGE_TIMEOUT }).toEqual(metres);
    const before = await summary(page);
    expect(before.layers.map((l) => l.name))
      .toEqual([
        'dataidee', 'gpx_local', 'kmz_local', 'oculta', 'paquete:places', 'puntos', 'recortada', 'unidades',
      ]);
    await expect.poll(() => contextTokens.length, { timeout: CHANGE_TIMEOUT }).toBeGreaterThan(0);
    let previousRequests = contextTokens.length;

    await switchTo(page, 1, 1);
    await expect.poll(() => contextTokens.length, { timeout: CHANGE_TIMEOUT })
      .toBeGreaterThan(previousRequests);
    previousRequests = contextTokens.length;
    await expect.poll(localLayers, { timeout: CHANGE_TIMEOUT })
      .toEqual({ ...metres, extent: [-10, 35, 5, 44] });
    const in3D = await summary(page);
    expect(in3D.implementation).toBe('cesium');
    expect(await page.evaluate(() => window.changes[0].previous)).toBe('ol');
    // La escala no existe en Cesium: queda aparcada y vuelve en 2D
    expect(in3D.controls).toEqual(['implementationswitcher']);
    expect({ ...in3D, implementation: 'ol', controls: before.controls }).toEqual(before);
    await expect(page.locator('div.m-dialog')).toHaveCount(0);

    await switchTo(page, 0, 2);
    await expect.poll(localLayers, { timeout: CHANGE_TIMEOUT }).toEqual(metres);
    await expect.poll(() => contextTokens.length, { timeout: CHANGE_TIMEOUT })
      .toBeGreaterThan(previousRequests);
    contextTokens.forEach((values) => expect(values).toEqual(['ctx-switch']));
    const back = await summary(page);
    expect(back).toEqual(before);
    // La vista vuelve a la zona de partida
    const center = await page.evaluate(() => window.map.getCenter());
    expect(Math.abs(center.x - -411884)).toBeLessThan(50000);
    expect(Math.abs(center.y - 4927603)).toBeLessThan(50000);
    // Cada núcleo se ha descargado una sola vez
    expect(cores.sort()).toEqual(['cesium', 'ol']);
  });

  test('IDEE.loadImplementation arranca en Cesium y el switcher lo reconoce', async ({ page }) => {
    const cores = [];
    page.on('request', (request) => {
      const match = /apiidee\.(ol|cesium)\.min\.js/.exec(request.url());
      if (match) cores.push(match[1]);
    });
    await mockServices(page);
    await page.goto(PAGE);
    // Con la implementación activa no descarga nada
    expect(await page.evaluate(async () => (await IDEE.loadImplementation('ol')) === window.IDEE))
      .toBe(true);
    await page.evaluate(async (tiles) => {
      IDEE.config.baseLayer = [];
      if (IDEE.config.terrain) IDEE.config.terrain.default = [];
      IDEE.config('TEST_SWITCHER', 'conservado');
      await IDEE.loadImplementation('cesium');
      window.changes = [];
      window.addEventListener('idee:implementationchange', ({ detail }) => {
        window.map = detail.map;
        window.changes.push(detail);
      });
      window.map = IDEE.map({
        container: 'map', layers: [], controls: ['implementationswitcher'], center: [-3.7, 40.4], zoom: 6,
      });
      window.map.addLayers(new IDEE.layer.XYZ({
        url: `${tiles}/capa/{z}/{x}/{y}.png`, name: 'capa', legend: 'capa', transparent: true,
      }));
    }, TILES);
    expect(await page.evaluate(() => [window.map.getImplementation(), IDEE.config.TEST_SWITCHER]))
      .toEqual(['cesium', 'conservado']);
    // El desplegable marca la implementación con la que arrancó el mapa
    const select = page.locator('select#m-implementationswitcher-select');
    expect(await select.evaluate((element) => element.options[element.selectedIndex].text))
      .toBe('Cesium');

    await select.selectOption({ index: 0 }, { force: true });
    await expect.poll(() => page.evaluate(() => window.changes.length), { timeout: CHANGE_TIMEOUT })
      .toBe(1);
    expect(await page.evaluate(() => [window.map.getImplementation(),
      window.map.getLayers().some((l) => l.name === 'capa')])).toEqual(['ol', true]);
    // El núcleo OL de la página se reutiliza: cada núcleo se descarga una sola vez
    expect(cores.sort()).toEqual(['cesium', 'ol']);
  });

  test('lo que la implementación de destino no admite se conserva y vuelve', async ({ page }) => {
    const requests = await mockServices(page);
    await openMap(page);
    await page.evaluate(() => {
      window.olMapPrototype = Object.getPrototypeOf(window.map);
    });
    await switchTo(page, 1, 1);
    await page.evaluate(({ url, ion }) => {
      const buildings = new IDEE.layer.Tiles3D({ url, name: 'edificios', legend: 'Edificios' }, {
        headers: { 'X-Api-Key': 'clave' },
      });
      window.map.addLayers([buildings, new IDEE.layer.Tiles3D({ ionAssetId: 7, name: 'ion', legend: 'Ion' }, {
        ionAccessToken: 'token-ion', ionServer: `${ion}/`,
      })]);
      buildings.setOpacity(0.5);
      buildings.setStyle(new IDEE.style.Tiles3D({ color: 'red', labelText: "'Edificio'" }));
    }, { url: TILESET, ion: ION });
    const tiles3D = () => page.evaluate(() => window.map.getTiles3D()
      .map((layer) => {
        const style = layer.getStyle();
        const tileset = layer.getImpl().getLayer();
        return {
          name: layer.name,
          loaded: !!tileset && window.map.getMapImpl().scene.primitives.contains(tileset),
          opacity: layer.getOpacity(),
          style: style instanceof IDEE.style.Tiles3D ? style.getOptions() : style,
        };
      }).sort((a, b) => a.name.localeCompare(b.name)));
    const expected = [
      { name: 'edificios', loaded: true, opacity: 0.5, style: { color: 'red', labelText: "'Edificio'" } },
      {
        name: 'ion', loaded: true, opacity: 1, style: undefined,
      },
    ];
    await expect.poll(tiles3D, { timeout: CHANGE_TIMEOUT }).toEqual(expected);

    await switchTo(page, 0, 2);
    expect(await page.evaluate(() => window.map.getLayers()
      .some((l) => ['edificios', 'ion'].includes(l.name)))).toBe(false);
    expect(await page.evaluate(() => window.IDEE_IMPLEMENTATIONS.parked.layers.map((e) => e.key)))
      .toEqual(['Tiles3D', 'Tiles3D']);

    await switchTo(page, 1, 3);
    await expect.poll(tiles3D, { timeout: CHANGE_TIMEOUT }).toEqual(expected);
    expect(await page.evaluate(() => window.IDEE_IMPLEMENTATIONS.parked.layers)).toEqual([]);
    expect(requests.tileset).toEqual(['clave', 'clave']);
    expect(requests.ion).toEqual(['token-ion', 'token-ion']);

    // Una sección que no se puede recrear queda aparcada y vuelve en el cambio siguiente
    await page.evaluate(() => {
      window.olAddSections = window.olMapPrototype.addSections;
      window.olMapPrototype.addSections = () => {
        throw new Error('sección no admitida');
      };
    });
    await switchTo(page, 0, 4);
    expect(await page.evaluate(() => [window.map.getSections().length,
      window.IDEE_IMPLEMENTATIONS.parked.sections.map((entry) => entry.section.title)]))
      .toEqual([0, ['Sección']]);
    await page.evaluate(() => {
      window.olMapPrototype.addSections = window.olAddSections;
    });
    await switchTo(page, 1, 5);
    expect(await page.evaluate(() => [window.map.getSections().map((section) => section.title),
      window.IDEE_IMPLEMENTATIONS.parked.sections])).toEqual([['Sección'], []]);
  });
});
