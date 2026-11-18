/**
 * Catálogo de capas de la comparativa Canvas ⇄ WebGL (CP-0008-webgl/CP-001).
 *
 * Cada entrada describe cómo crear la capa con un renderer dado:
 * - id, group, label, source: identificación y texto del panel.
 * - create(renderer, ctx): devuelve una capa nueva. Si renderer es undefined la capa
 *   se crea sin la opción 'renderer' y se aplica IDEE.config.WEBGL.
 * - expected: renderer efectivo esperado según el modo pedido.
 * - fixed: renderer que la capa usa siempre, sin alternativa.
 * - reason: clave i18n (exception) del aviso que debe aparecer al pedir WebGL.
 * - kind: 'geopackage' para los contenedores GeoPackage.
 * - usesPoints: la capa depende del número de puntos sintéticos.
 * - countsFeatures: comprobar que se cargan objetos geográficos (implícito en el grupo 'vector').
 * - afterAdd(layer): acciones tras añadir la capa al mapa.
 * - fit: extensión [minLon, minLat, maxLon, maxLat] o 'layer' para encuadrar la capa.
 */
import { fromLonLat } from 'ol/proj';
import OSM from 'IDEE/layer/OSM';
import XYZ from 'IDEE/layer/XYZ';
import TMS from 'IDEE/layer/TMS';
import WMTS from 'IDEE/layer/WMTS';
import WMS from 'IDEE/layer/WMS';
import MBTiles from 'IDEE/layer/MBTiles';
import GeoPackage from 'IDEE/layer/GeoPackage';
import GeoJSON from 'IDEE/layer/GeoJSON';
import Vector from 'IDEE/layer/Vector';
import WFS from 'IDEE/layer/WFS';
import OGCAPIFeatures from 'IDEE/layer/OGCAPIFeatures';
import DataIDEE from 'IDEE/layer/DataIDEE';
import KML from 'IDEE/layer/KML';
import KMZ from 'IDEE/layer/KMZ';
import GPX from 'IDEE/layer/GPX';
import MVT from 'IDEE/layer/MVT';
import MBTilesVector from 'IDEE/layer/MBTilesVector';
import GeoTIFF from 'IDEE/layer/GeoTIFF';
import Feature from 'IDEE/feature/Feature';
import Generic from 'IDEE/style/Generic';
import Category from 'IDEE/style/Category';
import Cluster from 'IDEE/style/Cluster';
import Point from 'IDEE/style/Point';

const URLS = {
  pnoa: 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg',
  ignBase: 'https://tms-ign-base.idee.es/1.0.0/IGNBaseTodo/{z}/{x}/{-y}.jpeg',
  wmtsPnoa: 'https://www.ign.es/wmts/pnoa-ma?',
  wmsUA: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  mbtilesRaster: '/test/playwright/fixtures/refresh/raster.mbtiles',
  mbtilesVector: '/test/playwright/fixtures/refresh/vector.mbtiles',
  gpkgRaster: '/test/development/CP-0002-layers/data/geopackage-raster.gpkg',
  sptr: 'https://www.ign.es/resources/geodesia/GNSS/SPTR_geo.json',
  wfs: 'https://www.ign.es/wfs/redes-geodesicas',
  ogcapi: 'https://api-features.idee.es/collections/',
  dataidee: 'https://api-features.ign.es',
  kml: 'https://www.ign.es/resources/CaminoDeSantiago_PRE/rutas/04/04-Via%20de%20la%20Plata%20-%20Camino%20Moz%C3%A1rabe%20a%20Santiago.kml',
  kmz: '/test/playwright/fixtures/kmz/basic.kmz',
  gpx: '/test/development/CP-0002-layers/fixtures/CP-035.gpx',
  mvt: 'https://vt-fedme.idee.es/vt.senderogr/{z}/{x}/{y}.pbf',
  cog: 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/36/Q/WD/2020/7/S2A_36QWD_20200701_0_L2A/TCI.tif',
};

export const GROUPS = [
  { id: 'raster', title: 'Ráster teselado', hint: 'WebGL → ol/layer/WebGLTile' },
  { id: 'vector', title: 'Vectorial', hint: 'WebGL → ol/layer/WebGLVector' },
  { id: 'vectortile', title: 'Vectorial teselado', hint: 'WebGL → ol/layer/WebGLVectorTile' },
  { id: 'webglonly', title: 'Solo WebGL', hint: 'Siempre WebGL, sin alternativa Canvas' },
  { id: 'fallback', title: 'Casos de caída a Canvas', hint: 'Se pide WebGL y la API usa Canvas' },
];

export const POINT_COUNTS = [1000, 10000, 50000, 100000, 200000];

const CATEGORY_COLORS = {
  a: '#e11d48',
  b: '#2563eb',
  c: '#16a34a',
  d: '#f59e0b',
};

const SUPPORTED = { canvas: 'canvas', webgl: 'webgl' };
const FALLBACK = { canvas: 'canvas', webgl: 'canvas' };

/**
 * Opciones de la capa con el renderer pedido.
 * @param {string|undefined} renderer Renderer ('canvas' | 'webgl'), o undefined para usar
 * IDEE.config.WEBGL.
 * @param {Object} extra Resto de opciones.
 * @returns {Object} Opciones nuevas en cada llamada (las fachadas las modifican).
 */
const withRenderer = (renderer, extra = {}) => (renderer ? { ...extra, renderer } : { ...extra });

/**
 * Generador pseudoaleatorio determinista (Park-Miller): mismos datos en los dos modos.
 * @param {number} seed Semilla.
 * @returns {Function} Función que devuelve números en [0, 1).
 */
const random = (seed) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

/**
 * Genera puntos sobre la península con atributos tipo, valor y color.
 * @param {number} n Número de puntos.
 * @returns {Object} FeatureCollection en EPSG:4326.
 */
export const randomPoints = (n) => {
  const rnd = random(7);
  const tipos = Object.keys(CATEGORY_COLORS);
  return {
    type: 'FeatureCollection',
    features: Array.from({ length: n }, (_, i) => {
      const tipo = tipos[Math.floor(rnd() * tipos.length)];
      return {
        type: 'Feature',
        id: `p${i}`,
        properties: {
          nombre: `Punto ${i}`, tipo, valor: Math.round(rnd() * 100), color: CATEGORY_COLORS[tipo],
        },
        geometry: { type: 'Point', coordinates: [-9.3 + rnd() * 12.5, 36.2 + rnd() * 7.5] },
      };
    }),
  };
};

/**
 * Polígonos y líneas sobre la península con el atributo tipo.
 * @returns {Object} FeatureCollection en EPSG:4326.
 */
const thematicCollection = () => {
  const tipos = Object.keys(CATEGORY_COLORS);
  const polygons = Array.from({ length: 12 }, (_, i) => {
    const x = -9 + (i % 4) * 3;
    const y = 37 + Math.floor(i / 4) * 2.2;
    return {
      type: 'Feature',
      id: `pol${i}`,
      properties: { nombre: `Polígono ${i}`, tipo: tipos[i % 4] },
      geometry: {
        type: 'Polygon',
        coordinates: [[[x, y], [x + 2.6, y], [x + 2.6, y + 1.8], [x, y + 1.8], [x, y]]],
      },
    };
  });
  const lines = [
    [[-8.5, 42.8], [-3.7, 40.4], [2.1, 41.4]],
    [[-6, 37.4], [-3.7, 40.4], [-0.9, 41.6]],
    [[-8.6, 41.1], [-5.6, 40.9], [-1.1, 37.9]],
  ].map((coordinates, i) => ({
    type: 'Feature',
    id: `lin${i}`,
    properties: { nombre: `Línea ${i}`, tipo: tipos[(i + 1) % 4] },
    geometry: { type: 'LineString', coordinates },
  }));
  return { type: 'FeatureCollection', features: [...polygons, ...lines] };
};

/**
 * Rejilla de polígonos en EPSG:3857 como IDEE.Feature (para IDEE.layer.Vector).
 * @returns {Array<IDEE.Feature>} Objetos geográficos.
 */
const gridFeatures = () => {
  const cols = 40;
  const rows = 25;
  const [minX, minY] = fromLonLat([-9.5, 36]);
  const [maxX, maxY] = fromLonLat([3.5, 43.8]);
  const w = (maxX - minX) / cols;
  const h = (maxY - minY) / rows;
  const features = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const x = minX + c * w;
      const y = minY + r * h;
      const x2 = x + w * 0.9;
      const y2 = y + h * 0.9;
      features.push(new Feature(`celda_${r}_${c}`, {
        type: 'Feature',
        properties: { fila: r, columna: c },
        geometry: { type: 'Polygon', coordinates: [[[x, y], [x2, y], [x2, y2], [x, y2], [x, y]]] },
      }));
    }
  }
  return features;
};

/**
 * Estilo de los puntos sintéticos: color tomado del atributo (traducible a estilo plano).
 * @returns {IDEE.style.Generic} Estilo.
 */
const pointsStyle = () => new Generic({
  point: {
    radius: 4,
    fill: { color: '{{color}}' },
    stroke: { color: '#ffffff', width: 1 },
  },
});

/**
 * Estilo temático por categoría sobre el atributo tipo.
 * @returns {IDEE.style.Category} Estilo.
 */
const categoryStyle = () => new Category('tipo', Object.fromEntries(
  Object.entries(CATEGORY_COLORS).map(([tipo, color]) => [tipo, new Generic({
    polygon: { fill: { color, opacity: 0.45 }, stroke: { color, width: 2 } },
    line: { stroke: { color, width: 4 } },
  })]),
));

/**
 * Capa GeoJSON con los puntos sintéticos.
 * @param {string} name Nombre de la capa.
 * @param {string} legend Leyenda.
 * @param {number} n Número de puntos.
 * @param {Object} options Opciones de la capa.
 * @returns {IDEE.layer.GeoJSON} Capa.
 */
const pointsLayer = (name, legend, n, options) => new GeoJSON({
  name, legend, source: randomPoints(n), extract: true,
}, options);

export const CATALOG = [
  {
    id: 'osm',
    group: 'raster',
    label: 'OSM',
    source: 'tile.openstreetmap.org',
    expected: SUPPORTED,
    create: (renderer) => new OSM({ name: 'webgl_osm', legend: 'OSM', isBase: false }, withRenderer(renderer)),
  },
  {
    id: 'xyz',
    group: 'raster',
    label: 'XYZ · PNOA-MA',
    source: 'tms-pnoa-ma.idee.es',
    expected: SUPPORTED,
    create: (renderer) => new XYZ({
      url: URLS.pnoa, name: 'webgl_xyz', legend: 'PNOA-MA (XYZ)', isBase: false,
    }, withRenderer(renderer)),
  },
  {
    id: 'tms',
    group: 'raster',
    label: 'TMS · IGN Base',
    source: 'tms-ign-base.idee.es',
    expected: SUPPORTED,
    create: (renderer) => new TMS({
      url: URLS.ignBase, name: 'webgl_tms', legend: 'IGN Base (TMS)', isBase: false,
    }, withRenderer(renderer)),
  },
  {
    id: 'wmts',
    group: 'raster',
    label: 'WMTS · PNOA',
    source: 'www.ign.es/wmts/pnoa-ma · OI.OrthoimageCoverage',
    expected: SUPPORTED,
    create: (renderer) => new WMTS({
      url: URLS.wmtsPnoa,
      name: 'OI.OrthoimageCoverage',
      legend: 'PNOA (WMTS)',
      matrixSet: 'GoogleMapsCompatible',
      format: 'image/jpeg',
      isBase: false,
    }, withRenderer(renderer)),
  },
  {
    id: 'wms',
    group: 'raster',
    label: 'WMS teselado · Unidades administrativas',
    source: 'www.ign.es/wms-inspire/unidades-administrativas',
    expected: SUPPORTED,
    create: (renderer) => new WMS({
      url: URLS.wmsUA,
      name: 'AU.AdministrativeUnit',
      legend: 'Unidades administrativas (WMS teselado)',
      tiled: true,
      isBase: false,
    }, withRenderer(renderer)),
  },
  {
    id: 'mbtiles',
    group: 'raster',
    label: 'MBTiles',
    source: 'fixture raster.mbtiles (mundo, z0-3)',
    expected: SUPPORTED,
    create: (renderer) => new MBTiles({
      url: URLS.mbtilesRaster, name: 'webgl_mbtiles', legend: 'MBTiles (fixture)', isBase: false,
    }, withRenderer(renderer, { opacity: 0.6 })),
  },
  {
    id: 'gpkg',
    group: 'raster',
    label: 'GeoPackage ráster',
    source: 'fixture geopackage-raster.gpkg (mundo, z0)',
    kind: 'geopackage',
    expected: SUPPORTED,
    create: (renderer) => new GeoPackage({
      url: URLS.gpkgRaster, name: 'webgl_gpkg', legend: 'GeoPackage ráster',
    }, withRenderer(renderer, { tables: { imagery: { legend: 'imagery', opacity: 0.5 } } })),
  },
  {
    id: 'points',
    group: 'vector',
    label: 'GeoJSON · puntos sintéticos',
    source: 'N puntos generados · Generic {{color}}',
    usesPoints: true,
    expected: SUPPORTED,
    create: (renderer, { points }) => pointsLayer(
      'webgl_points',
      `Puntos sintéticos (${points})`,
      points,
      withRenderer(renderer, { style: pointsStyle() }),
    ),
  },
  {
    id: 'thematic',
    group: 'vector',
    label: 'GeoJSON · polígonos y líneas',
    source: 'datos en línea · Category sobre "tipo"',
    expected: SUPPORTED,
    create: (renderer) => new GeoJSON({
      name: 'webgl_thematic', legend: 'Polígonos y líneas (Category)', source: thematicCollection(), extract: true,
    }, withRenderer(renderer, { style: categoryStyle() })),
  },
  {
    id: 'vector',
    group: 'vector',
    label: 'IDEE.layer.Vector · rejilla',
    source: '1000 polígonos añadidos con addFeatures',
    expected: SUPPORTED,
    create: (renderer) => new Vector({ name: 'webgl_vector', legend: 'Rejilla (Vector)' }, withRenderer(renderer, {
      style: new Generic({
        polygon: { fill: { color: '#7c3aed', opacity: 0.25 }, stroke: { color: '#5b21b6', width: 1 } },
      }),
    })),
    afterAdd: (layer) => layer.addFeatures(gridFeatures()),
  },
  {
    id: 'geojson',
    group: 'vector',
    label: 'GeoJSON remoto · estaciones GNSS',
    source: 'www.ign.es/resources/geodesia/GNSS/SPTR_geo.json',
    expected: SUPPORTED,
    create: (renderer) => new GeoJSON({
      url: URLS.sptr, name: 'webgl_geojson', legend: 'Estaciones GNSS (GeoJSON)', extract: true,
    }, withRenderer(renderer)),
  },
  {
    id: 'wfs',
    group: 'vector',
    label: 'WFS · RED_REGENTE',
    source: 'www.ign.es/wfs/redes-geodesicas',
    expected: SUPPORTED,
    create: (renderer) => new WFS({
      url: URLS.wfs, name: 'RED_REGENTE', legend: 'RED REGENTE (WFS)', geometry: 'MPOINT',
    }, withRenderer(renderer)),
  },
  {
    id: 'ogcapi',
    group: 'vector',
    label: 'OGC API Features · falls',
    source: 'api-features.idee.es/collections/falls',
    expected: SUPPORTED,
    create: (renderer) => new OGCAPIFeatures({
      url: URLS.ogcapi, name: 'falls', legend: 'Cascadas (OGC API Features)',
    }, withRenderer(renderer)),
  },
  {
    id: 'dataidee',
    group: 'vector',
    label: 'DataIDEE · núcleos',
    source: 'api-features.ign.es · nuc',
    expected: SUPPORTED,
    create: (renderer) => new DataIDEE({
      url: URLS.dataidee, name: 'nuc', legend: 'Núcleos (DataIDEE)', limit: 100,
    }, withRenderer(renderer)),
  },
  {
    id: 'kml',
    group: 'vector',
    label: 'KML · Vía de la Plata',
    source: 'Camino de Santiago (26 líneas) · extractStyles: false',
    expected: SUPPORTED,
    create: (renderer) => new KML({
      url: URLS.kml, name: 'webgl_kml', legend: 'Vía de la Plata (KML)', extract: true,
    }, withRenderer(renderer, { extractStyles: false })),
  },
  {
    id: 'kmz',
    group: 'vector',
    label: 'KMZ',
    source: 'fixture basic.kmz · extractStyles: false',
    fit: 'layer',
    expected: SUPPORTED,
    create: (renderer) => new KMZ({
      url: URLS.kmz, name: 'webgl_kmz', legend: 'KMZ (fixture)',
    }, withRenderer(renderer, { extractStyles: false })),
  },
  {
    id: 'gpx',
    group: 'vector',
    label: 'GPX',
    source: 'fixture CP-035.gpx (Madrid)',
    fit: 'layer',
    expected: SUPPORTED,
    create: (renderer) => new GPX({
      url: URLS.gpx, name: 'webgl_gpx', legend: 'GPX (fixture)',
    }, withRenderer(renderer)),
  },
  {
    id: 'mvt',
    group: 'vectortile',
    label: 'MVT · senderos GR',
    source: 'vt-fedme.idee.es/vt.senderogr',
    expected: SUPPORTED,
    create: (renderer) => new MVT({
      url: URLS.mvt, name: 'sendero_gr', legend: 'Senderos GR (MVT)',
    }, withRenderer(renderer)),
  },
  {
    id: 'mbtilesvector',
    group: 'vectortile',
    label: 'MBTilesVector',
    source: 'fixture vector.mbtiles (mundo, z0-3)',
    expected: SUPPORTED,
    create: (renderer) => new MBTilesVector({
      url: URLS.mbtilesVector, name: 'webgl_mbtilesvector', legend: 'MBTilesVector (fixture)',
    }, withRenderer(renderer)),
  },
  {
    id: 'cog',
    group: 'webglonly',
    label: 'GeoTIFF · COG Sentinel-2',
    source: 'sentinel-cogs (TCI.tif, fuera de España)',
    fixed: 'webgl',
    fit: 'layer',
    create: () => new GeoTIFF({
      url: URLS.cog, name: 'webgl_cog', legend: 'Sentinel-2 (COG)', isBase: false,
    }, { convertToRGB: 'auto' }),
  },
  {
    id: 'wms_single',
    group: 'fallback',
    label: 'WMS imagen única (tiled: false)',
    source: 'ImageWMS no tiene equivalente WebGL',
    expected: FALLBACK,
    create: (renderer) => new WMS({
      url: URLS.wmsUA,
      name: 'AU.AdministrativeUnit',
      legend: 'Unidades administrativas (WMS imagen única)',
      tiled: false,
      isBase: false,
    }, withRenderer(renderer)),
  },
  {
    id: 'xyz_nocors',
    group: 'fallback',
    label: 'XYZ con crossOrigin: false',
    source: 'Sin CORS no se pueden subir texturas',
    reason: 'webgl_fallback_cors',
    expected: FALLBACK,
    create: (renderer) => new XYZ({
      url: URLS.pnoa, name: 'webgl_xyz_nocors', legend: 'PNOA-MA sin CORS', isBase: false,
    }, withRenderer(renderer, { crossOrigin: false })),
  },
  {
    id: 'kml_styles',
    group: 'fallback',
    label: 'KML con estilos propios',
    source: 'Vía de la Plata con extractStyles por defecto: <Style> por objeto',
    reason: 'webgl_fallback_feature_style',
    countsFeatures: true,
    expected: FALLBACK,
    create: (renderer) => new KML({
      url: URLS.kml, name: 'webgl_kml_styles', legend: 'Vía de la Plata (estilos KML)', extract: true,
    }, withRenderer(renderer)),
  },
  {
    id: 'points_cluster',
    group: 'fallback',
    label: 'Puntos + Cluster',
    source: 'AnimatedCluster solo existe en Canvas',
    usesPoints: true,
    countsFeatures: true,
    expected: FALLBACK,
    create: (renderer, { points }) => pointsLayer(
      'webgl_points_cluster',
      'Puntos (Cluster)',
      points,
      withRenderer(renderer, {
        style: new Cluster({ animated: false, displayAmount: true, distance: 60 }),
      }),
    ),
  },
  {
    id: 'points_simple',
    group: 'fallback',
    label: 'Puntos + IDEE.style.Point',
    source: 'Estilo simple heredado sin traducción a estilo plano',
    reason: 'webgl_fallback_style',
    usesPoints: true,
    countsFeatures: true,
    expected: FALLBACK,
    create: (renderer, { points }) => pointsLayer(
      'webgl_points_simple',
      'Puntos (estilo simple)',
      points,
      withRenderer(renderer, {
        style: new Point({ radius: 4, fill: { color: '#0891b2' }, stroke: { color: '#ffffff', width: 1 } }),
      }),
    ),
  },
];

/**
 * Renderer efectivo esperado para una entrada.
 * @param {Object} entry Entrada del catálogo.
 * @param {string} requested Renderer pedido.
 * @returns {string} 'canvas' | 'webgl'.
 */
export const expectedRenderer = (entry, requested) => entry.fixed || entry.expected[requested];

export const DEFAULT_ACTIVE = ['tms', 'points'];
