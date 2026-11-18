import { test, expect } from '@playwright/test';
import registerLoadFilesTests from '../common/load-files';

/*
 * Capas vectoriales y 3D en Cesium: alta, objetos geográficos, visibilidad,
 * opacidad, extensión y baja; y carga de ficheros con IDEE.loadFiles.
 * Los servicios se simulan y los ficheros son fixtures locales.
 */
const PAGE = '/test/playwright/cesium/basic-cesium.html';
const HOST = 'https://vector.cesium.test';
const CORS = { 'access-control-allow-origin': '*' };
const WAIT = { timeout: 25000 };

const FEATURES = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature', id: 'p1', geometry: { type: 'Point', coordinates: [-3.7, 40.4] }, properties: { nombre: 'Uno' },
    },
    {
      type: 'Feature', id: 'p2', geometry: { type: 'Point', coordinates: [-3.6, 40.5] }, properties: { nombre: 'Dos' },
    },
  ],
};
const DESCRIBE_FEATURE_TYPE = `<?xml version="1.0" encoding="UTF-8"?>
<xsd:schema xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:gml="http://www.opengis.net/gml" xmlns:prueba="http://prueba" targetNamespace="http://prueba" elementFormDefault="qualified">
  <xsd:complexType name="puntosType"><xsd:complexContent><xsd:extension base="gml:AbstractFeatureType"><xsd:sequence>
    <xsd:element name="nombre" type="xsd:string"/><xsd:element name="the_geom" type="gml:PointPropertyType"/>
  </xsd:sequence></xsd:extension></xsd:complexContent></xsd:complexType>
  <xsd:element name="puntos" type="prueba:puntosType" substitutionGroup="gml:_Feature"/>
</xsd:schema>`;
// Teselas 3D sin contenido: válidas para Cesium y sin descargas adicionales
const TILESET = {
  asset: { version: '1.0' },
  geometricError: 100,
  root: {
    boundingVolume: { region: [-0.0657, 0.7049, -0.0644, 0.7058, 0, 100] },
    geometricError: 0,
    refine: 'ADD',
  },
};
const TERRAIN = {
  tilejson: '2.1.0',
  format: 'quantized-mesh-1.0',
  version: '1.0.0',
  scheme: 'tms',
  tiles: ['{z}/{x}/{y}.terrain'],
  available: [[{
    startX: 0, startY: 0, endX: 1, endY: 0,
  }]],
};

const mockServer = (page) => page.route(`${HOST}/**`, (route) => {
  const url = route.request().url();
  const json = (body) => route.fulfill({
    status: 200, headers: CORS, contentType: 'application/json', body: JSON.stringify(body),
  });
  if (/describefeaturetype/i.test(url)) {
    return route.fulfill({
      status: 200, headers: CORS, contentType: 'text/xml', body: DESCRIBE_FEATURE_TYPE,
    });
  }
  if (url.includes('/tileset.json')) return json(TILESET);
  if (url.includes('/layer.json')) return json(TERRAIN);
  if (url.endsWith('.terrain')) return route.fulfill({ status: 404, headers: CORS, body: '' });
  return json(FEATURES);
});

/** Crea en la página una capa del tipo indicado. */
const createLayer = (page, type) => page.evaluate(({ layerType, host }) => {
  const factories = {
    Vector: () => {
      const layer = new IDEE.layer.Vector({ name: 'vector', legend: 'Vector' });
      layer.addFeatures([new IDEE.Feature('v1', {
        type: 'Feature', geometry: { type: 'Point', coordinates: [-3.7, 40.4] }, properties: {},
      })]);
      return layer;
    },
    GeoJSON: () => new IDEE.layer.GeoJSON({ name: 'geojson', url: `${host}/datos.geojson` }),
    KML: () => new IDEE.layer.KML({
      name: 'kml', url: '/test/playwright/fixtures/kmz/basic.kml', extract: false,
    }),
    KMZ: () => new IDEE.layer.KMZ({
      name: 'kmz', url: '/test/playwright/fixtures/kmz/basic.kmz', extract: false,
    }),
    GPX: () => new IDEE.layer.GPX({
      name: 'gpx', url: '/test/development/CP-0002-layers/fixtures/CP-035.gpx',
    }),
    WFS: () => new IDEE.layer.WFS({
      url: `${host}/wfs?`, namespace: 'prueba', name: 'puntos', geometry: 'POINT', extract: false,
    }),
    OGCAPIFeatures: () => new IDEE.layer.OGCAPIFeatures({
      url: `${host}/ogc/collections/`, name: 'puntos', legend: 'OGC API',
    }),
    GenericVector: () => {
      const source = new window.Cesium.CustomDataSource('generica');
      source.entities.add({
        id: 'g1',
        position: window.Cesium.Cartesian3.fromDegrees(-3.7, 40.4),
        point: { pixelSize: 8 },
      });
      return new IDEE.layer.GenericVector({ name: 'generica', legend: 'Genérica' }, {}, source);
    },
  };
  window.events = [];
  const layer = factories[layerType]();
  window.layer = layer;
  layer.on(IDEE.evt.ADDED_TO_MAP, () => window.events.push('added'));
  window.map.addLayers(layer);
}, { layerType: type, host: HOST });

/** Datos de la capa en el visor. */
const dataSourceState = (page) => page.evaluate(() => {
  const native = window.layer.getImpl().getLayer();
  return {
    inViewer: !!native && window.map.getMapImpl().dataSources.contains(native),
    show: native ? native.show : undefined,
    visible: window.layer.isVisible(),
  };
});

test.describe.configure({ timeout: 90000 });

test.describe('Capas vectoriales y 3D en Cesium', () => {
  test.beforeEach(async ({ page }) => {
    await mockServer(page);
    await page.goto(PAGE);
    await page.evaluate(() => {
      IDEE.config.baseLayer = [];
      IDEE.config.terrain.default = [];
      window.map = IDEE.map({
        container: 'map', controls: [], layers: [], center: [-3.7, 40.4], zoom: 9,
      });
    });
  });

  ['Vector', 'GeoJSON', 'KML', 'KMZ', 'GPX', 'WFS', 'OGCAPIFeatures', 'GenericVector'].forEach((type) => {
    test(`${type}: alta, objetos, visibilidad, opacidad, extensión y baja`, async ({ page }) => {
      await createLayer(page, type);
      await expect.poll(() => page.evaluate(() => window.events.includes('added')), WAIT).toBe(true);
      await expect.poll(async () => (await dataSourceState(page)).inViewer, WAIT).toBe(true);
      await expect.poll(() => page.evaluate(() => window.layer.getFeatures().length), WAIT)
        .toBeGreaterThan(0);

      await page.evaluate(() => window.layer.setVisible(false));
      expect(await dataSourceState(page)).toMatchObject({ show: false, visible: false });
      await page.evaluate(() => window.layer.setVisible(true));
      expect(await dataSourceState(page)).toMatchObject({ show: true, visible: true });

      await page.evaluate(() => window.layer.setOpacity(0.4));
      expect(await page.evaluate(() => window.layer.getOpacity())).toBeCloseTo(0.4, 5);

      // Todos los datos de prueba están en la península, en grados. GenericVector
      // calcula la extensión del usuario: la de sus datos es getMaxExtent()
      const [minx, miny, maxx, maxy] = await page.evaluate(() => (window.layer.type === 'GenericVector'
        ? window.layer.getMaxExtent() : window.layer.calculateMaxExtent()));
      expect(minx).toBeGreaterThan(-10);
      expect(maxx).toBeLessThan(5);
      expect(miny).toBeGreaterThan(35);
      expect(maxy).toBeLessThan(44);

      const entitiesShown = () => page.evaluate(() => window.layer.getImpl().getLayer()
        .entities.values.map((entity) => entity.show));
      await page.evaluate(() => window.layer.setMaxExtent([10, 10, 20, 20]));
      expect(await entitiesShown()).not.toContain(true);
      await page.evaluate(() => window.layer.setMaxExtent([-10, 35, 5, 44]));
      expect(await entitiesShown()).not.toContain(false);
      if (type !== 'GenericVector') {
        expect(await page.evaluate(() => window.layer.getMaxExtent())).toEqual([-10, 35, 5, 44]);
      }
      await page.evaluate(() => window.layer.setMaxExtent(null));
      expect(await entitiesShown()).not.toContain(false);

      await page.evaluate(() => window.layer.setMaxZoom(3));
      await expect.poll(async () => (await dataSourceState(page)).show, WAIT).toBe(false);
      expect(await page.evaluate(() => window.layer.inRange())).toBe(false);
      await page.evaluate(() => window.layer.setMaxZoom(Number.POSITIVE_INFINITY));
      await expect.poll(async () => (await dataSourceState(page)).show, WAIT).toBe(true);
      await page.evaluate(() => window.layer.setMinZoom(20));
      await expect.poll(async () => (await dataSourceState(page)).show, WAIT).toBe(false);
      await page.evaluate(() => window.layer.setVisible(true));
      await expect.poll(async () => (await dataSourceState(page)).show, WAIT).toBe(false);
      await page.evaluate(() => window.layer.setMinZoom(Number.NEGATIVE_INFINITY));
      await expect.poll(async () => (await dataSourceState(page)).show, WAIT).toBe(true);
      expect(await page.evaluate(() => window.layer.inRange())).toBe(true);

      await page.evaluate(() => window.map.removeLayers(window.layer));
      expect((await dataSourceState(page)).inViewer).toBe(false);
      expect(await page.evaluate(() => window.map.getLayers().includes(window.layer))).toBe(false);
    });
  });

  test('Tiles3D: alta, estilo, opacidad, rango de zoom, visibilidad, extensión y baja', async ({ page }) => {
    const styleBeforeLoad = await page.evaluate((host) => {
      window.events = [];
      window.style = new IDEE.style.Tiles3D({
        color: "${Height} > 10 ? color('red') : color('blue', 0.8)",
        defines: { Height: '${height} * 2' },
        meta: { description: "'Altura: ' + ${Height}" },
        labelText: "'Edificio'",
        labelColor: 'yellow',
        desconocida: 'se ignora',
      });
      window.layer = new IDEE.layer.Tiles3D({ url: `${host}/3d/tileset.json`, name: 'teselas3d' }, {
        style: window.style, maxZoom: 20,
      });
      const before = window.layer.getStyle() === window.style;
      window.layer.on(IDEE.evt.ADDED_TO_MAP, () => window.events.push('added'));
      window.map.addLayers(window.layer);
      return before;
    }, HOST);
    expect(styleBeforeLoad).toBe(true);
    await expect.poll(() => page.evaluate(() => window.events.includes('added')), WAIT).toBe(true);
    const inScene = () => page.evaluate(() => window.map.getMapImpl().scene.primitives
      .contains(window.layer.getImpl().getLayer()));
    expect(await inScene()).toBe(true);

    const styleState = () => page.evaluate(() => {
      const { style } = window.layer.getImpl().getLayer();
      const feature = (height) => ({
        getPropertyInherited: (name) => (name === 'height' ? height : undefined),
      });
      const round = (value) => Math.round(value * 100) / 100;
      const label = style.labelColor?.evaluateColor(feature(1));
      return {
        opacity: window.layer.getOpacity(),
        sameStyle: window.layer.getStyle() === window.style,
        color: style.style.color,
        alphas: [round(style.color.evaluateColor(feature(10)).alpha),
          round(style.color.evaluateColor(feature(1)).alpha)],
        description: style.meta.description?.evaluate(feature(3)),
        labelText: style.labelText?.evaluate(feature(3)),
        labelColor: label ? [label.red, label.green, label.blue] : undefined,
        unknown: 'desconocida' in style.style,
      };
    });
    const original = "${Height} > 10 ? color('red') : color('blue', 0.8)";
    expect(await styleState()).toEqual({
      opacity: 1,
      sameStyle: true,
      color: original,
      alphas: [1, 0.8],
      description: 'Altura: 6',
      labelText: 'Edificio',
      labelColor: [1, 1, 0],
      unknown: false,
    });
    await page.evaluate(() => window.layer.setOpacity(0.5));
    expect(await styleState()).toMatchObject({
      opacity: 0.5, color: `(${original}) * color('white', 0.5)`, alphas: [0.5, 0.4], description: 'Altura: 6',
    });
    await page.evaluate(() => window.layer.setStyle(new IDEE.style.Tiles3D({ color: 'green' })));
    expect(await styleState()).toMatchObject({
      opacity: 0.5, sameStyle: false, color: "(color('green')) * color('white', 0.5)", alphas: [0.5, 0.5],
    });
    await page.evaluate(() => {
      window.layer.setStyle(window.style);
      window.layer.setOpacity('1');
    });
    expect(await styleState()).toMatchObject({
      opacity: 1, sameStyle: true, color: original, alphas: [1, 0.8],
    });

    const tilesetShown = () => page.evaluate(() => window.layer.getImpl().getLayer().show);
    expect(await page.evaluate(() => [
      window.layer.getMinZoom() === Number.NEGATIVE_INFINITY, window.layer.getMaxZoom()]))
      .toEqual([true, 20]);
    expect(await tilesetShown()).toBe(true);
    await page.evaluate(() => window.layer.setMinZoom(12));
    await expect.poll(tilesetShown, WAIT).toBe(false);
    expect(await page.evaluate(() => window.layer.inRange())).toBe(false);
    await page.evaluate(() => window.layer.setMinZoom(Number.NEGATIVE_INFINITY));
    await expect.poll(tilesetShown, WAIT).toBe(true);
    await page.evaluate(() => window.layer.setMaxZoom(5));
    await expect.poll(tilesetShown, WAIT).toBe(false);
    await page.evaluate(() => window.layer.setMaxZoom(Number.POSITIVE_INFINITY));
    await expect.poll(tilesetShown, WAIT).toBe(true);

    await page.evaluate(() => window.layer.setVisible(false));
    expect(await page.evaluate(() => window.layer.getImpl().getLayer().show)).toBe(false);
    const extent = await page.evaluate(() => window.layer.getMaxExtent());
    expect(extent).toBeTruthy();
    await page.evaluate(() => window.map.removeLayers(window.layer));
    expect(await page.evaluate(() => window.map.getLayers().includes(window.layer))).toBe(false);
  });

  test('Terrain: alta, ocultar vuelve al elipsoide y baja', async ({ page }) => {
    await page.evaluate((host) => {
      window.events = [];
      window.layer = new IDEE.layer.Terrain({ url: `${host}/terreno/`, name: 'terreno' });
      window.layer.on(IDEE.evt.ADDED_TO_MAP, () => window.events.push('added'));
      window.map.addLayers(window.layer);
    }, HOST);
    await expect.poll(() => page.evaluate(() => window.events.includes('added')), WAIT).toBe(true);
    // Los nombres de clase están minificados: se compara con las clases de Cesium
    const provider = () => page.evaluate(() => {
      const { terrainProvider } = window.map.getMapImpl();
      if (terrainProvider instanceof window.Cesium.CesiumTerrainProvider) return 'CesiumTerrainProvider';
      if (terrainProvider instanceof window.Cesium.EllipsoidTerrainProvider) return 'EllipsoidTerrainProvider';
      return 'otro';
    });
    expect(await provider()).toBe('CesiumTerrainProvider');
    await page.evaluate(() => window.layer.setVisible(false));
    expect(await provider()).toBe('EllipsoidTerrainProvider');
    await page.evaluate(() => window.map.removeLayers(window.layer));
    expect(await page.evaluate(() => window.map.getLayers().includes(window.layer))).toBe(false);
  });

  const POLYGON_SOURCE = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      id: 'z1',
      properties: { nombre: 'Uno' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[-3.8, 40.3], [-3.6, 40.3], [-3.6, 40.5], [-3.8, 40.5], [-3.8, 40.3]]],
      },
    }],
  };

  test('Polígonos: el contorno se dibuja como línea pegada al terreno y se quita con un estilo sin contorno; etiquetas 3D', async ({ page }) => {
    await page.evaluate((source) => {
      window.layer = new IDEE.layer.GeoJSON({ name: 'poligonos', source });
      window.map.addLayers(window.layer);
      window.layer.setStyle(new IDEE.style.Generic({
        polygon: {
          fill: { color: '#00ff00', opacity: 0.5 },
          stroke: { color: '#ff0000', width: 3 },
          label: { text: '{{nombre}}', baseline: 'alphabetic', align: 'end' },
        },
      }));
    }, POLYGON_SOURCE);
    const label = () => page.evaluate(() => {
      const entity = window.layer.getFeatures()[0]?.getImpl().getFeature();
      if (!entity?.label) return null;
      const time = window.Cesium.JulianDate.now();
      const value = (property) => property?.getValue(time);
      const { VerticalOrigin, HorizontalOrigin } = window.Cesium;
      return {
        text: value(entity.label.text),
        depth: value(entity.label.disableDepthTestDistance),
        vertical: value(entity.label.verticalOrigin) === VerticalOrigin.BASELINE,
        horizontal: value(entity.label.horizontalOrigin) === HorizontalOrigin.RIGHT,
        far: value(entity.label.distanceDisplayCondition)?.far,
        nearScale: value(entity.label.scaleByDistance)?.nearValue,
      };
    });
    await expect.poll(label, WAIT).toEqual({
      text: 'Uno',
      depth: Number.POSITIVE_INFINITY,
      vertical: true,
      horizontal: true,
      far: undefined,
      nearScale: undefined,
    });
    const outline = () => page.evaluate(() => {
      const entity = window.layer.getFeatures()[0]?.getImpl().getFeature();
      if (!entity) return null;
      const time = window.Cesium.JulianDate.now();
      const line = entity.polyline;
      return {
        line: !!line,
        ground: line ? line.clampToGround.getValue(time) : null,
        width: line ? line.width.getValue(time) : null,
        color: line ? line.material.color.getValue(time).toCssHexString() : null,
        polygonOutline: entity.polygon.outline ? entity.polygon.outline.getValue(time) : null,
        type: window.layer.getFeatures()[0].getGeometry().type,
      };
    });
    await expect.poll(outline, WAIT).toEqual({
      line: true, ground: true, width: 3, color: '#ff0000', polygonOutline: false, type: 'Polygon',
    });
    await page.evaluate(() => window.layer.setStyle(new IDEE.style.Generic({
      polygon: {
        fill: { color: '#00ff00', opacity: 0.5 },
        label: {
          text: 'cerca',
          marker3D: {
            alwaysOnTop: false, distance: [0, 5000], scaleByDistance: [100, 1.5, 10000, 0.5],
          },
        },
      },
    })));
    await expect.poll(async () => (await outline())?.line, WAIT).toBe(false);
    await expect.poll(label, WAIT).toEqual({
      text: 'cerca', depth: 0, vertical: false, horizontal: false, far: 5000, nearScale: 1.5,
    });
  });

  test('Líneas en EPSG:3857: LineString y MultiLineString se reproyectan a grados; elevación por capa y estilo', async ({ page }) => {
    const toMercator = ([lon, lat]) => [
      (lon * 20037508.342789244) / 180,
      (Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) * 20037508.342789244) / Math.PI,
    ];
    const line = [[-3.7, 40.4], [-3.6, 40.5]];
    const source = {
      type: 'FeatureCollection',
      crs: { type: 'name', properties: { name: 'EPSG:3857' } },
      features: [
        {
          type: 'Feature', id: 'l1', properties: {}, geometry: { type: 'LineString', coordinates: line.map(toMercator) },
        },
        {
          type: 'Feature',
          id: 'm1',
          properties: {},
          geometry: { type: 'MultiLineString', coordinates: [line.map(toMercator), line.map(toMercator)] },
        },
      ],
    };
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.evaluate((data) => {
      window.layer = new IDEE.layer.GeoJSON({ name: 'lineas3857', source: data });
      window.map.addLayers(window.layer);
    }, source);
    await expect.poll(() => page.evaluate(() => window.layer.getFeatures().length), WAIT).toBe(3);

    const features = await page.evaluate(() => window.layer.getFeatures()
      .map((feature) => [feature.getId(), feature.getGeometry()]));
    expect(features.map(([id]) => id)).toEqual(['l1', 'm1', 'm1_2']);
    features.forEach(([, geometry]) => {
      expect(geometry.type).toBe('LineString');
      expect(geometry.coordinates).toHaveLength(2);
      geometry.coordinates.forEach(([lon, lat], index) => {
        expect(lon).toBeCloseTo(line[index][0], 5);
        expect(lat).toBeCloseTo(line[index][1], 5);
      });
    });

    const elevated = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature', id: 'z', properties: {}, geometry: { type: 'Point', coordinates: [-3.7, 40.4, 100] },
        },
        {
          type: 'Feature', id: 'l', properties: {}, geometry: { type: 'LineString', coordinates: line },
        },
        {
          type: 'Feature',
          id: 'a',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [[[-3.8, 40.3], [-3.6, 40.3], [-3.6, 40.5], [-3.8, 40.3]]],
          },
        },
      ],
    };
    expect(await page.evaluate(() => {
      try {
        const empty = { type: 'FeatureCollection', features: [] };
        return new IDEE.layer.GeoJSON({ name: 'mal', source: empty }, { elevation: 'flotar' })
          && null;
      } catch (error) {
        return String(error?.message ?? error);
      }
    })).toBeTruthy();
    await page.evaluate((data) => {
      window.elevated = new IDEE.layer.GeoJSON({ name: 'elevacion', source: data }, {
        elevation: { mode: 'absolute', offset: 10 },
      });
      window.map.addLayers(window.elevated);
    }, elevated);
    const placed = () => page.evaluate(() => {
      const { Cartographic, HeightReference, JulianDate } = window.Cesium;
      const time = JulianDate.now();
      const entities = Object.fromEntries(window.elevated.getFeatures()
        .map((feature) => [feature.getId(), feature.getImpl().getFeature()]));
      if (!entities.z || !entities.l || !entities.a) return null;
      const height = (position) => Math.round(Cartographic.fromCartesian(position).height);
      const reference = (value) => Object.keys(HeightReference)
        .find((key) => HeightReference[key] === value);
      return {
        point: [height(entities.z.position.getValue(time)),
          reference(entities.z.point.heightReference?.getValue(time))],
        line: [entities.l.polyline.positions.getValue(time).map(height),
          entities.l.polyline.clampToGround.getValue(time)],
        polygon: [entities.a.polygon.height?.getValue(time),
          reference(entities.a.polygon.heightReference?.getValue(time))],
        geometryZ: Math.round(window.elevated.getFeatures().find((f) => f.getId() === 'z')
          .getGeometry().coordinates[2]),
      };
    });
    await expect.poll(placed, WAIT).toEqual({
      point: [110, 'NONE'],
      line: [[10, 10], false],
      polygon: [10, 'NONE'],
      geometryZ: 100,
    });
    await page.evaluate(() => window.elevated.setStyle(new IDEE.style.Generic({
      point: { radius: 5, fill: { color: '#ff0000' }, elevation: 'clamp' },
      line: { stroke: { color: '#ff0000' }, elevation: { mode: 'relative', offset: 3 } },
      polygon: { fill: { color: '#ff0000' }, elevation: { mode: 'relative' } },
    })));
    await expect.poll(placed, WAIT).toEqual({
      point: [0, 'CLAMP_TO_GROUND'],
      line: [[3, 3], false],
      polygon: [10, 'RELATIVE_TO_GROUND'],
      geometryZ: 100,
    });
    await page.evaluate(() => window.elevated.setStyle(new IDEE.style.Generic({
      point: { radius: 5, fill: { color: '#ff0000' }, elevation: { mode: 'auto', offset: 0 } },
      line: { stroke: { color: '#ff0000' }, elevation: 'auto' },
      polygon: { fill: { color: '#ff0000' }, elevation: 'auto' },
    })));
    await expect.poll(placed, WAIT).toEqual({
      point: [100, 'NONE'],
      line: [[0, 0], true],
      polygon: [undefined, undefined],
      geometryZ: 100,
    });
    expect(errors).toEqual([]);
  });

  test('Estilos con funciones: se vuelven a calcular al terminar de mover la cámara', async ({ page }) => {
    await page.evaluate((source) => {
      window.layer = new IDEE.layer.GeoJSON({ name: 'escala', source });
      window.map.addLayers(window.layer);
      window.layer.setStyle(new IDEE.style.Generic({
        polygon: { fill: { color: (feature, map) => (map.getScale() < 500000 ? '#ff0000' : '#0000ff'), opacity: 1 } },
      }));
    }, POLYGON_SOURCE);
    const fill = () => page.evaluate(() => {
      const entity = window.layer.getFeatures()[0]?.getImpl().getFeature();
      return entity
        ? entity.polygon.material.color.getValue(window.Cesium.JulianDate.now()).toCssHexString()
        : null;
    });
    await expect.poll(fill, WAIT).not.toBeNull();
    await page.evaluate(() => window.map.setZoom(6));
    await expect.poll(fill, WAIT).toBe('#0000ff');
    await page.evaluate(() => window.map.setZoom(13));
    await expect.poll(fill, WAIT).toBe('#ff0000');

    await page.evaluate((points) => {
      window.points = new IDEE.layer.GeoJSON({ name: 'puntos', source: points });
      window.map.addLayers(window.points);
      window.points.setStyle(new IDEE.style.Generic({
        point: {
          radius: 6,
          fill: { color: '#ff0000' },
          label: { text: (feature) => feature.getAttribute('nombre').toUpperCase() },
        },
      }));
    }, FEATURES);
    const point = () => page.evaluate(() => {
      const entity = window.points.getFeatures()[0]?.getImpl().getFeature();
      if (!entity?.point) return null;
      const time = window.Cesium.JulianDate.now();
      const { Cartesian3, VerticalOrigin } = window.Cesium;
      return {
        pixelSize: entity.point.pixelSize?.getValue(time),
        text: entity.label?.text?.getValue(time),
        labelDepth: entity.label?.disableDepthTestDistance?.getValue(time),
        labelCentered: entity.label?.verticalOrigin?.getValue(time) === VerticalOrigin.CENTER,
        iconNorth: entity.billboard ? Cartesian3
          .equals(entity.billboard.alignedAxis.getValue(time), Cartesian3.UNIT_Z) : null,
        iconRotation: entity.billboard?.rotation?.getValue(time) ?? null,
        iconDepth: entity.billboard?.disableDepthTestDistance?.getValue(time) ?? null,
      };
    });
    await expect.poll(point, WAIT).toEqual({
      pixelSize: 12,
      text: 'UNO',
      labelDepth: Number.POSITIVE_INFINITY,
      labelCentered: true,
      iconNorth: null,
      iconRotation: null,
      iconDepth: null,
    });
    await page.evaluate(() => window.points.setStyle(new IDEE.style.Point({
      radius: 4,
      icon: {
        src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
        rotate: true,
        rotation: 0.5,
        marker3D: { alwaysOnTop: false },
      },
      label: { text: 'icono' },
    })));
    await expect.poll(point, WAIT).toEqual({
      pixelSize: 8,
      text: 'icono',
      labelDepth: Number.POSITIVE_INFINITY,
      labelCentered: false,
      iconNorth: true,
      iconRotation: -0.5,
      iconDepth: 0,
    });
  });

  test('Heatmap, Chart y FlowLine: se simplifican con un aviso y sin errores', async ({ page }) => {
    const errors = [];
    const warnings = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'warning') warnings.push(message.text());
    });
    const source = {
      type: 'FeatureCollection',
      features: [
        ...FEATURES.features.map((feature, index) => ({
          ...feature,
          properties: { ...feature.properties, peso: (index + 1) * 5, total: index + 3 },
        })),
        {
          type: 'Feature',
          id: 'f1',
          properties: { flujo: 4 },
          geometry: { type: 'LineString', coordinates: [[-3.7, 40.4], [-3.6, 40.5]] },
        },
      ],
    };
    await page.evaluate((data) => {
      const point = (id) => new IDEE.layer.GeoJSON({
        name: id,
        source: { ...data, features: data.features.filter((f) => f.geometry.type === 'Point') },
      });
      window.heat = point('calor');
      window.chart = point('grafico');
      window.flow = new IDEE.layer.GeoJSON({
        name: 'flujo',
        source: { ...data, features: data.features.filter((f) => f.geometry.type !== 'Point') },
      });
      window.map.addLayers([window.heat, window.chart, window.flow]);
      window.heat.setStyle(new IDEE.style.Heatmap('peso', { gradient: ['#0000ff', '#ff0000'], radius: 8 }));
      window.chart.setStyle(new IDEE.style.Chart({ type: 'pie', variables: ['peso', 'total'] }));
      window.flow.setStyle(new IDEE.style.FlowLine({
        color: '#00ff00', color2: '#0000ff', width: '{{flujo}}', width2: 10,
      }));
    }, source);
    const state = () => page.evaluate(() => {
      const time = window.Cesium.JulianDate.now();
      const entity = (layer, index = 0) => layer.getFeatures()[index]?.getImpl().getFeature();
      const heat = [0, 1].map((index) => entity(window.heat, index)?.point?.color?.getValue(time));
      const chart = entity(window.chart);
      const flow = entity(window.flow);
      return {
        heat: heat.map((color) => (color
          ? [color.withAlpha(1).toCssHexString(), color.alpha] : null)),
        heatWeights: [window.heat.getStyle().getImpl().getMinWeight(),
          window.heat.getStyle().getImpl().getMaxWeight()],
        chartLabel: chart?.label?.text?.getValue(time) ?? null,
        chartSize: chart?.point?.pixelSize?.getValue(time) ?? null,
        flowWidth: flow?.polyline?.width?.getValue(time) ?? null,
      };
    });
    await expect.poll(state, WAIT).toEqual({
      heat: [['#ff0000', 0.5], ['#ff0000', 1]],
      heatWeights: [5, 10],
      chartLabel: '5 / 3',
      chartSize: 40,
      flowWidth: 7,
    });
    ['Heatmap', 'Chart', 'FlowLine'].forEach((name) => {
      expect(warnings.some((text) => text.includes(name))).toBe(true);
    });
    expect(errors).toEqual([]);
  });
});

registerLoadFilesTests('cesium');
