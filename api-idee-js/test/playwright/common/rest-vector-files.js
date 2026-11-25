/* eslint-disable max-len */
import { test, expect } from '@playwright/test';
import { decodeRestLayer } from './rest-layer';

/*
 * Capas KML, KMZ y GPX recibidas por REST con parámetros nombrados
 * (TIPO*name=...;url=...;extract=true;visibility=true), comunes a OL y Cesium.
 *
 * api-idee-rest no interpreta las capas: entrega cada entrada de "layers" sin cambios
 * a IDEE.map({ layers: [...] }) (ver ParametersParserVectorFileLayersTest). Estas
 * pruebas parten de esas mismas cadenas y comprueban la normalización, la descarga,
 * la lectura y la incorporación de las entidades al mapa con servicios reales que
 * permiten CORS, por lo que necesitan acceso a internet.
 */
const PAGES = {
  ol: '/test/playwright/ol/basic-ol.html',
  cesium: '/test/playwright/cesium/basic-cesium.html',
};
const WAIT = { timeout: 40000 };
const SETTLE_MS = 750;

const URLS = {
  KML: 'https://componentes.idee.es/estaticos/Datos/KML/las_huertas_n1.kml',
  KMZ: 'https://openlayers.org/en/latest/examples/data/kmz/iceland.kmz',
  GPX: 'https://openlayers.org/en/latest/examples/data/gpx/fells_loop.gpx',
};
const MIN_FEATURES = { KML: 1, KMZ: 83, GPX: 87 };
const GEOMETRIES = { KML: ['Point'], KMZ: ['Point'], GPX: ['LineString', 'Point'] };

/**
 * KML del IGN cuya URL ya contiene caracteres codificados (%20 y %C3%A1).
 * En la petición HTTP se escribe con %25 (%2520...) porque el servidor la decodifica una vez.
 */
const VIA_DE_LA_PLATA = 'https://www.ign.es/resources/CaminoDeSantiago_PRE/rutas/04/04-Via%20de%20la%20Plata%20-%20Camino%20Moz%C3%A1rabe%20a%20Santiago.kml';

const MISSING = {
  KML: 'https://componentes.idee.es/estaticos/Datos/KML/no-existe.kml',
  KMZ: 'https://openlayers.org/en/latest/examples/data/kmz/no-existe.kmz',
  GPX: 'https://openlayers.org/en/latest/examples/data/gpx/no-existe.gpx',
};

/**
 * Cadena REST con parámetros nombrados.
 * @param {String} type Tipo de capa.
 * @param {String} name Nombre de la capa.
 * @param {String} url URL del fichero o valor codificado.
 * @returns {String} Entrada del parámetro "layers".
 */
const named = (type, name, url) => `${type}*name=${name};url=${url};extract=true;visibility=true`;

/**
 * Valor de texto codificado con base64~, como lo genera IDEE.utils.serializeUrlParams.
 * @param {String} text Texto.
 * @returns {String} Valor codificado.
 */
const quotedBase64 = (text) => `base64~${Buffer.from(`'${text}'`, 'utf8').toString('base64')}`;

/**
 * Prepara la página: sin capas base ni terreno y con el registro de eventos por capa.
 * @param {Object} page Página de Playwright.
 * @returns {Promise} Preparación.
 */
const preparePage = (page) => page.evaluate(() => {
  IDEE.config.baseLayer = [];
  if (IDEE.config.terrain) IDEE.config.terrain.default = [];
  window.restEvents = {};
  window.trackRestLayers = (layers) => layers.forEach((layer) => {
    const events = { load: 0, error: 0, errors: [] };
    window.restEvents[layer.name] = events;
    layer.on(IDEE.evt.LOAD, () => {
      events.load += 1;
    });
    layer.on(IDEE.evt.LOAD_ERROR, (error) => {
      events.error += 1;
      events.errors.push(String(error?.message ?? error));
    });
  });
});

/**
 * Crea el mapa con las capas tal como las entrega api-idee-rest.
 * @param {Object} page Página de Playwright.
 * @param {Array<String>} layers Entradas del parámetro "layers".
 * @returns {Promise} Creación del mapa.
 */
const createMap = (page, layers) => page.evaluate((restLayers) => {
  window.map = IDEE.map({
    container: 'map', controls: [], layers: restLayers, center: [-3.7, 40.4], zoom: 3,
  });
  window.trackRestLayers(window.map.getLayers());
}, layers);

/**
 * Estado observable de una capa.
 * @param {Object} page Página de Playwright.
 * @param {String} name Nombre de la capa.
 * @returns {Promise<Object>} Estado de la capa.
 */
const readLayer = (page, name) => page.evaluate((layerName) => {
  const layer = window.map.getLayers().find((l) => l.name === layerName);
  const features = layer.getFeatures();
  return {
    type: layer.type,
    isInstance: layer instanceof IDEE.layer[layer.type],
    name: layer.name,
    url: layer.url,
    extract: layer.extract,
    visible: layer.isVisible(),
    features: features.length,
    geometries: [...new Set(features.map((f) => f.getGeometry()?.type))].sort(),
    events: { ...window.restEvents[layerName] },
  };
}, name);

/**
 * Espera a que la capa emita LOAD y tenga entidades.
 * @param {Object} page Página de Playwright.
 * @param {String} name Nombre de la capa.
 * @param {Number} minFeatures Número mínimo de entidades.
 * @returns {Promise} Espera.
 */
const expectLoaded = async (page, name, minFeatures) => {
  await expect.poll(async () => (await readLayer(page, name)).events.load, WAIT).toBeGreaterThanOrEqual(1);
  await expect.poll(async () => (await readLayer(page, name)).features, WAIT).toBeGreaterThanOrEqual(minFeatures);
  expect((await readLayer(page, name)).events.error).toBe(0);
};

/**
 * Espera a que la capa emita un único LOAD_ERROR y ningún LOAD.
 * @param {Object} page Página de Playwright.
 * @param {String} name Nombre de la capa.
 * @returns {Promise} Espera.
 */
const expectLoadError = async (page, name) => {
  await expect.poll(async () => (await readLayer(page, name)).events.error, WAIT).toBeGreaterThanOrEqual(1);
  await page.waitForTimeout(SETTLE_MS);
  const { events, features } = await readLayer(page, name);
  expect(events.load).toBe(0);
  expect(events.error).toBe(1);
  expect(features).toBe(0);
};

const errorDialogs = (page) => page.locator('div.m-dialog.error').count();

/**
 * Registra las pruebas de las capas REST KML, KMZ y GPX para un motor.
 * @param {String} engine 'ol' o 'cesium'.
 */
export default function registerRestVectorFilesTests(engine) {
  test.describe(`Capas REST KML, KMZ y GPX con clave=valor (${engine})`, () => {
    test.describe.configure({ timeout: 90000 });

    let pageErrors;

    test.beforeEach(async ({ page }) => {
      pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(String(error)));
      await page.goto(PAGES[engine]);
      await preparePage(page);
    });

    test.afterEach(() => {
      expect(pageErrors).toEqual([]);
    });

    ['KML', 'KMZ', 'GPX'].forEach((type) => {
      test(`${type}*name=...;url=...;extract=true;visibility=true se carga y se muestra`, async ({ page }) => {
        const name = `${type.toLowerCase()}_rest`;
        await createMap(page, [named(type, name, URLS[type])]);
        await expectLoaded(page, name, MIN_FEATURES[type]);
        const layer = await readLayer(page, name);
        expect(layer).toMatchObject({
          type, isInstance: true, name, url: URLS[type], extract: true, visible: true, geometries: GEOMETRIES[type],
        });
        expect(await errorDialogs(page)).toBe(0);
      });
    });

    test('varias capas en una misma petición se separan sin interferencias', async ({ page }) => {
      const types = ['KML', 'KMZ', 'GPX'];
      await createMap(page, types.map((type) => named(type, `${type.toLowerCase()}_multi`, URLS[type])));
      await Promise.all(types.map((type) => expectLoaded(page, `${type.toLowerCase()}_multi`, MIN_FEATURES[type])));
      const layers = await Promise.all(types.map((type) => readLayer(page, `${type.toLowerCase()}_multi`)));
      expect(layers.map(({ type, url, geometries }) => [type, url, geometries]))
        .toEqual(types.map((type) => [type, URLS[type], GEOMETRIES[type]]));
      expect(await errorDialogs(page)).toBe(0);
    });

    test('una URL con caracteres ya codificados (%20, %C3%A1) llega a la capa sin cambios', async ({ page }) => {
      await createMap(page, [named('KML', 'via_de_la_plata', VIA_DE_LA_PLATA)]);
      await expectLoaded(page, 'via_de_la_plata', 26);
      expect(await readLayer(page, 'via_de_la_plata')).toMatchObject({ url: VIA_DE_LA_PLATA, geometries: ['LineString'] });
    });

    test('una URL con separadores se transmite codificada con base64~', async ({ page }) => {
      const url = `${URLS.KML}?version=1,2;3`;
      await createMap(page, [named('KML', 'kml_base64', quotedBase64(url))]);
      await expectLoaded(page, 'kml_base64', MIN_FEATURES.KML);
      expect((await readLayer(page, 'kml_base64')).url).toBe(url);
    });

    ['KML', 'GPX'].forEach((type) => {
      test(`${type} admite el contenido en línea con source`, async ({ page }) => {
        const name = `${type.toLowerCase()}_source`;
        const layer = await page.evaluate(async ({ layerType, layerName, url }) => {
          const text = await (await fetch(url)).text();
          return `${layerType}*name=${layerName};${IDEE.utils.serializeUrlParams({ source: text })};extract=true`;
        }, { layerType: type, layerName: name, url: URLS[type] });
        expect(layer).toMatch(new RegExp(`^${type}\\*name=${name};source=(base64|deflate)~`));
        await createMap(page, [layer]);
        await expectLoaded(page, name, MIN_FEATURES[type]);
      });
    });

    test('getRestLayer devuelve una cadena nombrada que reconstruye cada capa', async ({ page }) => {
      const types = ['KML', 'KMZ', 'GPX'];
      await createMap(page, types.map((type) => named(type, `${type.toLowerCase()}_ida`, URLS[type])));
      await Promise.all(types.map((type) => expectLoaded(page, `${type.toLowerCase()}_ida`, MIN_FEATURES[type])));
      const rest = await page.evaluate((names) => names
        .map((name) => window.map.getLayers().find((l) => l.name === name).getRestLayer()), types.map((type) => `${type.toLowerCase()}_ida`));
      rest.forEach((restLayer, index) => {
        expect(decodeRestLayer(restLayer)).toMatchObject({
          type: types[index], name: `${types[index].toLowerCase()}_ida`, url: URLS[types[index]], extract: true,
        });
      });
      await page.evaluate((restLayers) => {
        const previous = window.map.getLayers().filter((layer) => /_ida$/.test(layer.name));
        window.map.removeLayers(previous);
        window.map.addLayers(restLayers);
        window.trackRestLayers(window.map.getLayers().filter((layer) => /_ida$/.test(layer.name)));
      }, rest);
      await Promise.all(types.map((type) => expectLoaded(page, `${type.toLowerCase()}_ida`, MIN_FEATURES[type])));
    });

    test('el formato posicional anterior sigue cargando KML, KMZ y GPX', async ({ page }) => {
      await createMap(page, [
        `KML*kml_pos*${URLS.KML}*true`,
        `KMZ*kmz_pos*${URLS.KMZ}*true`,
        `GPX*gpx_pos*${URLS.GPX}*true*true`,
      ]);
      await Promise.all(['KML', 'KMZ', 'GPX'].map((type) => expectLoaded(page, `${type.toLowerCase()}_pos`, MIN_FEATURES[type])));
      const layers = await Promise.all(['KML', 'KMZ', 'GPX'].map((type) => readLayer(page, `${type.toLowerCase()}_pos`)));
      expect(layers.map(({ type, isInstance, url }) => [type, isInstance, url])).toEqual([
        ['KML', true, URLS.KML],
        ['KMZ', true, URLS.KMZ],
        ['GPX', true, URLS.GPX],
      ]);
    });

    [
      ['un KMZ que no es un ZIP (se pide un KML)', 'KMZ', 'kmz_invalido', URLS.KML],
      ['un KMZ inexistente', 'KMZ', 'kmz_404', MISSING.KMZ],
      ['un KML inexistente (el 404 trae un XML de error)', 'KML', 'kml_404', MISSING.KML],
      ['un KML que no es XML (se pide un KMZ)', 'KML', 'kml_invalido', URLS.KMZ],
    ].forEach(([title, type, name, url]) => {
      test(`${title} emite un único LOAD_ERROR, ningún LOAD y ningún diálogo`, async ({ page }) => {
        await createMap(page, [named(type, name, url)]);
        await expectLoadError(page, name);
        expect(await errorDialogs(page)).toBe(0);
      });
    });

    test('un GPX inexistente emite un único LOAD_ERROR y muestra el diálogo de error', async ({ page }) => {
      await createMap(page, [named('GPX', 'gpx_404', MISSING.GPX)]);
      await expectLoadError(page, 'gpx_404');
      await expect.poll(() => errorDialogs(page), WAIT).toBe(1);
    });
  });
}
