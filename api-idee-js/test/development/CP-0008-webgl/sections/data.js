/**
 * Datos y servicios compartidos por las secciones de la revisión WebGL.
 */
export const DATA_URL = '/test/development/CP-0008-webgl/data';
export const KMZ_URL = '/test/playwright/fixtures/kmz/basic.kmz';
export const MBTILES_RASTER_URL = '/test/playwright/fixtures/refresh/raster.mbtiles';
export const MBTILES_VECTOR_URL = '/test/playwright/fixtures/refresh/vector.mbtiles';
export const GPKG_RASTER_URL = '/test/development/CP-0002-layers/data/geopackage-raster.gpkg';

export const URLS = {
  tmsBase: 'https://tms-ign-base.idee.es/1.0.0/IGNBaseTodo/{z}/{x}/{-y}.jpeg',
  xyzPnoa: 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg',
  osm: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  wms: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  wmts: 'https://www.ign.es/wmts/pnoa-ma?',
  wfs: 'https://www.ign.es/wfs/redes-geodesicas',
  ogcapi: 'https://api-features.idee.es/collections/',
  dataidee: 'https://api-features.ign.es',
  mvt: 'https://vt-fedme.idee.es/vt.senderogr/{z}/{x}/{y}.pbf',
};

/** Polígonos sobre la península con atributos de texto (tipo), numéricos (valor) y color. */
export const POLYGONS = {
  type: 'FeatureCollection',
  features: [
    ['a', 5, '#e11d48', [-9, 41], [-6, 43]],
    ['b', 12, '#2563eb', [-6, 41], [-3, 43]],
    ['c', 30, '#16a34a', [-3, 41], [0, 43]],
    ['a', 55, '#f59e0b', [-9, 38], [-6, 41]],
    ['b', 80, '#7c3aed', [-6, 38], [-3, 41]],
    ['d', 120, '#0891b2', [-3, 38], [0, 41]],
  ].map(([tipo, valor, color, [x1, y1], [x2, y2]], i) => ({
    type: 'Feature',
    id: `pol${i}`,
    properties: {
      nombre: `Polígono ${i}`, tipo, valor, color,
    },
    geometry: { type: 'Polygon', coordinates: [[[x1, y1], [x2, y1], [x2, y2], [x1, y2], [x1, y1]]] },
  })),
};

export const LINES = {
  type: 'FeatureCollection',
  features: [
    [[-8.5, 42.8], [-3.7, 40.4], [2.1, 41.4]],
    [[-6, 37.4], [-3.7, 40.4], [-0.9, 41.6]],
  ].map((coordinates, i) => ({
    type: 'Feature',
    id: `lin${i}`,
    properties: { nombre: `Línea ${i}`, tipo: i ? 'b' : 'a', valor: (i + 1) * 10 },
    geometry: { type: 'LineString', coordinates },
  })),
};

/** Genera n puntos aleatorios sobre España con atributos tipo/valor/color/radio. */
export const randomPoints = (n, seed = 1) => {
  let s = seed;
  const rnd = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  const tipos = ['a', 'b', 'c', 'd'];
  const colors = ['#e11d48', '#2563eb', '#16a34a', '#f59e0b'];
  return {
    type: 'FeatureCollection',
    features: Array.from({ length: n }, (_, i) => {
      const t = Math.floor(rnd() * 4);
      return {
        type: 'Feature',
        id: `p${i}`,
        properties: {
          nombre: `Punto ${i}`, tipo: tipos[t], valor: Math.round(rnd() * 100), color: colors[t], radio: 3 + t * 2,
        },
        geometry: { type: 'Point', coordinates: [-9 + rnd() * 12, 36.5 + rnd() * 7] },
      };
    }),
  };
};

/** Mezcla de puntos, líneas y polígonos. */
export const MIXED = {
  type: 'FeatureCollection',
  features: [...POLYGONS.features, ...LINES.features, ...randomPoints(20).features],
};

/** Crea una capa GeoJSON a partir de un FeatureCollection (copia, para no compartir objetos). */
export const geojson = (IDEE, name, source, options = {}, vendor = {}) => new IDEE.layer.GeoJSON({
  name,
  legend: name,
  source: JSON.parse(JSON.stringify(source)),
  extract: true,
}, options, vendor);
