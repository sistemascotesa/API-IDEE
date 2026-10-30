/* Local in-memory OGC API Features service used by the editing example. */
const http = require('http');
const path = require('path');
const fs = require('fs');

const repositoryRoot = path.resolve(__dirname, '../../../../..');
const pluginRoot = path.resolve(__dirname, '../..');
const port = Number(process.env.DATAIDEE_DEMO_PORT || 8787);
const versions = new Map();
const initialFormFeatures = () => [{
  type: 'Feature', id: 7,
  properties: {
    name: 'Casa de la cultura', description: 'Edificio municipal', category: 'public',
    depth: 12.5, active: true, inspectionDate: '2026-10-01', optionalCode: null,
    assetCode: 'VLL-007',
    address: { street: 'Calle Mayor', number: 8, municipality: 'Valladolid', postalCode: '47001' },
    tags: ['municipal', 'cultural'],
    inspections: [{ date: '2026-09-12', score: 4, note: 'Buen estado', inspector: 'Equipo A' }],
    internalNote: 'Preservar este dato aunque no aparezca en el formulario.',
    updatedAt: '2026-10-01T10:00:00Z',
  },
  geometry: { type: 'Point', coordinates: [0.01, 0.01] },
}];
const collections = new Map([
  ['demo', [
    {
      type: 'Feature', id: 0, properties: { name: 'Punto 0', category: 'demo' }, geometry: { type: 'Point', coordinates: [0, 0] },
    },
    {
      type: 'Feature', id: 2, properties: { name: 'Línea', category: 'demo' }, geometry: { type: 'LineString', coordinates: [[-1, -1], [0, 0], [1, 1]] },
    },
    {
      type: 'Feature', id: 3, properties: { name: 'Polígono con hueco', category: 'demo' }, geometry: { type: 'Polygon', coordinates: [[[-2, -2], [2, -2], [2, 2], [-2, 2], [-2, -2]], [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5], [-0.5, -0.5]]] },
    },
    {
      type: 'Feature', id: 4, properties: { name: 'Multipunto', category: 'demo' }, geometry: { type: 'MultiPoint', coordinates: [[-1, 0], [1, 0]] },
    },
    {
      type: 'Feature', id: 5, properties: { name: 'Multipolígono', category: 'demo' }, geometry: { type: 'MultiPolygon', coordinates: [[[[-3, -1], [-2, -1], [-2, 0], [-3, 0], [-3, -1]]], [[[2, -1], [3, -1], [3, 0], [2, 0], [2, -1]]]] },
    },
  ]],
  ['readonly', [{
    type: 'Feature', id: 0, properties: { name: 'Solo lectura' }, geometry: { type: 'Point', coordinates: [0, 0] },
  }]],
  ['empty', []],
  ['conflict', [{
    type: 'Feature', id: 0, properties: { name: 'Estado inicial' }, geometry: { type: 'Point', coordinates: [0, 0] },
  }]],
  ['write-error', [{
    type: 'Feature', id: 0, properties: { name: 'Error controlado' }, geometry: { type: 'Point', coordinates: [0, 0] },
  }]],
  ['partial', [0, 2].map((id) => ({
    type: 'Feature', id, properties: { name: `Parcial ${id}` }, geometry: { type: 'Point', coordinates: [id / 100, 0] },
  }))],
  ['uncertain', []],
  ['dense', Array.from({ length: 1001 }, (_, id) => ({
    type: 'Feature', id, properties: { name: `Punto ${id}` }, geometry: { type: 'Point', coordinates: [id / 100000, 0] },
  }))],
  ['complex', [{
    type: 'Feature', id: 1, properties: { name: 'Línea compleja' }, geometry: { type: 'LineString', coordinates: Array.from({ length: 100001 }, (_, index) => [index / 100000, 0]) },
  }]],
  ['form', initialFormFeatures()],
  ['patch-only', initialFormFeatures()],
  ['missing-queryables', initialFormFeatures()],
  ['malformed-schema', initialFormFeatures()],
  ['missing-schema', initialFormFeatures()],
]);

function formSchema(name, origin) {
  return {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `${origin}/local/collections/${encodeURIComponent(name)}/schema`,
    title: 'Entidad de ejemplo',
    type: 'object',
    required: ['name', 'active', 'address'],
    'x-ogc-geometry-types': ['point'],
    properties: {
      id: { type: 'integer', readOnly: true, 'x-ogc-role': 'id', 'x-ogc-propertySeq': 1 },
      geometry: { format: 'geometry-point', 'x-ogc-role': 'primary-geometry', 'x-ogc-propertySeq': 2 },
      name: { title: 'Nombre', type: 'string', minLength: 2, maxLength: 100, 'x-ogc-propertySeq': 3 },
      description: { title: 'Descripción', type: 'string', maxLength: 300, 'x-ogc-propertySeq': 4 },
      category: { title: 'Categoría', type: 'string', enum: ['public', 'private', 'heritage'], 'x-ogc-propertySeq': 5 },
      depth: { title: 'Profundidad (m)', type: 'number', minimum: 0, maximum: 1000, 'x-ogc-propertySeq': 6 },
      active: { title: 'En servicio', type: 'boolean', 'x-ogc-propertySeq': 7 },
      inspectionDate: { title: 'Fecha de inspección', type: 'string', format: 'date', 'x-ogc-propertySeq': 8 },
      optionalCode: { title: 'Código opcional', type: ['string', 'null'], maxLength: 12, 'x-ogc-propertySeq': 9 },
      assetCode: { title: 'Código de activo', type: 'string', maxLength: 30, 'x-ogc-propertySeq': 9.5 },
      address: {
        title: 'Dirección', type: 'object', required: ['street', 'municipality'], 'x-ogc-propertySeq': 10,
        properties: {
          street: { title: 'Calle', type: 'string', minLength: 1 },
          number: { title: 'Número', type: 'integer', minimum: 0 },
          municipality: { title: 'Municipio', type: 'string', minLength: 1 },
          postalCode: { title: 'Código postal', type: 'string', pattern: '^\\d{5}$' },
        },
      },
      tags: { title: 'Etiquetas', type: 'array', items: { type: 'string', minLength: 1 }, uniqueItems: true, 'x-ogc-propertySeq': 11 },
      inspections: {
        title: 'Inspecciones', type: 'array', 'x-ogc-propertySeq': 12,
        items: {
          type: 'object', required: ['date', 'score'],
          properties: {
            date: { title: 'Fecha', type: 'string', format: 'date' },
            score: { title: 'Puntuación', type: 'integer', minimum: 1, maximum: 5 },
            note: { title: 'Notas', type: 'string', maxLength: 200 },
            inspector: { title: 'Inspector', type: 'string' },
          },
        },
      },
      internalNote: { type: 'string', readOnly: true },
      updatedAt: { title: 'Actualizado', type: 'string', format: 'date-time', readOnly: true },
    },
  };
}

function applyMergePatch(target, patch) {
  if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return patch;
  const result = target && typeof target === 'object' && !Array.isArray(target) ? { ...target } : {};
  Object.entries(patch).forEach(([key, value]) => {
    if (value === null) delete result[key];
    else result[key] = value && typeof value === 'object' && !Array.isArray(value)
      ? applyMergePatch(result[key], value) : value;
  });
  return result;
}

function formValidationError(feature) {
  const properties = feature.properties || {};
  if (typeof properties.name !== 'string' || properties.name.length < 2) {
    return 'A name with at least two characters is required.';
  }
  if (typeof properties.active !== 'boolean') return 'The active field must be boolean.';
  if (!properties.address || typeof properties.address !== 'object'
    || typeof properties.address.street !== 'string'
    || typeof properties.address.municipality !== 'string') {
    return 'A street and municipality are required.';
  }
  if (properties.category !== undefined
    && !['public', 'private', 'heritage'].includes(properties.category)) {
    return 'The category is not allowed.';
  }
  if (properties.depth !== undefined
    && (typeof properties.depth !== 'number' || properties.depth < 0 || properties.depth > 1000)) {
    return 'Depth must be a number between 0 and 1000.';
  }
  if (properties.tags !== undefined
    && (!Array.isArray(properties.tags) || properties.tags.some((value) => typeof value !== 'string'))) {
    return 'Tags must be an array of strings.';
  }
  if (properties.inspections !== undefined
    && (!Array.isArray(properties.inspections) || properties.inspections.some((item) => (
      !item || typeof item.date !== 'string' || !Number.isInteger(item.score)
      || item.score < 1 || item.score > 5
    )))) return 'Each inspection needs a date and a score from one to five.';
  if (properties.optionalCode !== undefined && properties.optionalCode !== null
    && typeof properties.optionalCode !== 'string') return 'Optional code must be a string or null.';
  return null;
}

function versionKey(name, id) { return `${name}:${id}`; }
function etagFor(name, id) { return `"${id}-v${versions.get(versionKey(name, id)) || 1}"`; }

const sendJson = (response, status, value, headers = {}) => {
  response.writeHead(status, { 'Content-Type': 'application/geo+json', ...headers });
  response.end(JSON.stringify(value));
};

function initialDemoFeatures() {
  return [
    {
      type: 'Feature', id: 0, properties: { name: 'Punto 0', category: 'demo' }, geometry: { type: 'Point', coordinates: [0, 0] },
    },
    {
      type: 'Feature', id: 2, properties: { name: 'Línea', category: 'demo' }, geometry: { type: 'LineString', coordinates: [[-1, -1], [0, 0], [1, 1]] },
    },
    {
      type: 'Feature', id: 3, properties: { name: 'Polígono con hueco', category: 'demo' }, geometry: { type: 'Polygon', coordinates: [[[-2, -2], [2, -2], [2, 2], [-2, 2], [-2, -2]], [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5], [-0.5, -0.5]]] },
    },
    {
      type: 'Feature', id: 4, properties: { name: 'Multipunto', category: 'demo' }, geometry: { type: 'MultiPoint', coordinates: [[-1, 0], [1, 0]] },
    },
    {
      type: 'Feature', id: 5, properties: { name: 'Multipolígono', category: 'demo' }, geometry: { type: 'MultiPolygon', coordinates: [[[[-3, -1], [-2, -1], [-2, 0], [-3, 0], [-3, -1]]], [[[2, -1], [3, -1], [3, 0], [2, 0], [2, -1]]]] },
    },
  ];
}

function resetCollections() {
  versions.clear();
  collections.set('demo', initialDemoFeatures());
  collections.set('readonly', [{
    type: 'Feature', id: 0, properties: { name: 'Solo lectura' },
    geometry: { type: 'Point', coordinates: [0, 0] },
  }]);
  collections.set('empty', []);
  collections.set('conflict', [{
    type: 'Feature', id: 0, properties: { name: 'Estado inicial' },
    geometry: { type: 'Point', coordinates: [0, 0] },
  }]);
  collections.set('write-error', [{
    type: 'Feature', id: 0, properties: { name: 'Error controlado' },
    geometry: { type: 'Point', coordinates: [0, 0] },
  }]);
  collections.set('partial', [0, 2].map((id) => ({
    type: 'Feature', id, properties: { name: `Parcial ${id}` },
    geometry: { type: 'Point', coordinates: [id / 100, 0] },
  })));
  collections.set('uncertain', []);
  collections.set('dense', Array.from({ length: 1001 }, (_, id) => ({
    type: 'Feature', id, properties: { name: `Punto ${id}` },
    geometry: { type: 'Point', coordinates: [id / 100000, 0] },
  })));
  collections.set('complex', [{
    type: 'Feature', id: 1, properties: { name: 'Línea compleja' },
    geometry: { type: 'LineString', coordinates: Array.from(
      { length: 100001 }, (_, index) => [index / 100000, 0],
    ) },
  }]);
  collections.set('form', initialFormFeatures());
  collections.set('patch-only', initialFormFeatures());
  collections.set('missing-queryables', initialFormFeatures());
  collections.set('malformed-schema', initialFormFeatures());
  collections.set('missing-schema', initialFormFeatures());
}

function localApi(request, response, url) {
  const origin = request.headers.origin || `http://localhost:${port}`;
  response.setHeader('Access-Control-Allow-Origin', origin);
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, If-Match, Accept');
  response.setHeader('Access-Control-Expose-Headers', 'Location, ETag, Link');
  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }
  if (url.pathname === '/local/') {
    sendJson(response, 200, { links: [{ rel: 'service-desc', href: '/local/api' }] }, {
      'Content-Type': 'application/json',
    });
    return;
  }
  if (url.pathname === '/local/conformance') {
    sendJson(response, 200, {
      conformsTo: [
        'http://www.opengis.net/spec/ogcapi-common-5/1.0/conf/create-replace-delete',
        'http://www.opengis.net/spec/ogcapi-common-5/1.0/conf/update',
        'http://www.opengis.net/spec/ogcapi-features-4/1.0/conf/features',
      ],
    }, { 'Content-Type': 'application/json' });
    return;
  }
  if (url.pathname === '/local/api') {
    const paths = {};
    collections.forEach((features, name) => {
      paths[`/collections/${name}/items`] = { get: {}, post: {} };
      const patch = { requestBody: { content: { 'application/merge-patch+json': {} } } };
      const put = { requestBody: { content: { 'application/geo+json': {} } } };
      paths[`/collections/${name}/items/{featureId}`] = name === 'readonly'
        ? { get: {} }
        : { get: {}, patch, ...(name === 'patch-only' ? {} : { put }), delete: {} };
    });
    sendJson(response, 200, { paths }, { 'Content-Type': 'application/vnd.oai.openapi+json' });
    return;
  }
  if (request.method === 'POST' && url.pathname === '/local/reset') {
    resetCollections();
    sendJson(response, 200, { reset: true });
    return;
  }
  const match = url.pathname.match(/^\/local\/collections\/([^/]+)(?:\/(queryables|schema|items(?:\/(.+))?))?$/);
  if (!match) return sendJson(response, 404, { error: 'Unknown local collection.' });
  const [, rawName, endpoint, rawId] = match;
  const name = decodeURIComponent(rawName);
  const writable = name !== 'readonly';
  const features = collections.get(name);
  if (!features) return sendJson(response, 404, { error: 'Unknown local collection.' });
  if (endpoint === 'queryables') {
    if (name === 'missing-queryables') return sendJson(response, 404, { error: 'Queryables are not published.' });
    return sendJson(response, 200, {
      type: 'object', properties: {
        name: { type: 'string' }, category: { type: 'string' }, calculatedArea: { type: 'number' },
      },
    }, { 'Content-Type': 'application/schema+json' });
  }
  if (endpoint === 'schema') {
    if (name === 'malformed-schema') {
      return sendJson(response, 200, { type: 'array' }, {
        'Content-Type': 'application/schema+json',
      });
    }
    if (name === 'missing-schema') return sendJson(response, 404, { error: 'Schema is not published.' });
    if (name === 'form' || name === 'patch-only' || name === 'missing-queryables') {
      const origin = `${request.headers['x-forwarded-proto'] || 'http'}://${request.headers.host || `localhost:${port}`}`;
      return sendJson(response, 200, formSchema(name, origin), { 'Content-Type': 'application/schema+json' });
    }
    return sendJson(response, 200, {
      type: 'object',
      required: [],
      'x-ogc-geometry-types': [
        'point', 'multipoint', 'linestring', 'multilinestring', 'polygon', 'multipolygon',
      ],
      properties: {
        id: { type: 'integer', 'x-ogc-role': 'id', readOnly: true },
        geometry: { format: 'geometry-point', 'x-ogc-role': 'primary-geometry' },
        name: { type: 'string' },
        category: { type: 'string' },
      },
    }, { 'Content-Type': 'application/schema+json' });
  }
  if (!rawId && !url.pathname.endsWith('/items')) {
      return sendJson(response, 200, {
        id: name,
        writable,
        links: [
          { rel: 'http://www.opengis.net/def/rel/ogc/1.0/schema', href: `${url.pathname}/schema` },
          { rel: 'http://www.opengis.net/def/rel/ogc/1.0/queryables', href: `${url.pathname}/queryables` },
        ],
      }, { 'Content-Type': 'application/json' });
  }
  if (rawId) {
    const id = decodeURIComponent(rawId);
    const index = features.findIndex((feature) => String(feature.id) === id);
    if (request.method === 'GET') {
      if (index < 0) return sendJson(response, 404, {});
      const result = { ...features[index] };
      if (name === 'conflict') result.properties = { ...result.properties, name: 'Cambio remoto' };
      return sendJson(response, 200, result, { ETag: etagFor(name, features[index].id) });
    }
    if (!writable) return sendJson(response, 403, { error: 'Read-only collection.' });
    if (index < 0) return sendJson(response, 404, {});
    if (request.headers['if-match'] && request.headers['if-match'] !== etagFor(name, id)) {
      return sendJson(response, 412, { error: 'ETag conflict.' });
    }
    if (request.method === 'DELETE') {
      features.splice(index, 1);
      response.writeHead(204);
      return response.end();
    }
    let body = '';
    request.on('data', (chunk) => { body += chunk; });
    request.on('end', () => {
      const update = JSON.parse(body);
      if (name === 'partial' && id === '2') return sendJson(response, 422, { error: 'Controlled failure.' });
      if (['form', 'patch-only', 'missing-queryables'].includes(name)) {
        const forbidden = request.method === 'PATCH'
          ? Object.keys(update.properties || {}).find((key) => ['id', 'internalNote', 'updatedAt'].includes(key))
          : Object.keys(update.properties || {}).find((key) => ['internalNote', 'updatedAt'].includes(key));
        if (forbidden) return sendJson(response, 422, { error: `Property '${forbidden}' cannot be written.` });
        const candidate = request.method === 'PATCH'
          ? { ...features[index], ...update, properties: applyMergePatch(features[index].properties, update.properties || {}) }
          : update;
        const validationError = formValidationError(candidate);
        if (validationError) return sendJson(response, 422, { error: validationError });
        // Server-owned values are not receivable in PUT and survive replacement.
        candidate.properties.internalNote = features[index].properties.internalNote;
        candidate.properties.updatedAt = new Date().toISOString();
        features[index] = candidate;
      } else if (request.method === 'PATCH') {
        features[index] = {
          ...features[index],
          ...update,
          properties: applyMergePatch(features[index].properties, update.properties || {}),
        };
      } else features[index] = update;
      features[index].id = Number.isNaN(Number(id)) ? id : Number(id);
      versions.set(versionKey(name, id), (versions.get(versionKey(name, id)) || 1) + 1);
      sendJson(response, 200, features[index], { ETag: etagFor(name, id) });
    });
    return undefined;
  }
  if (request.method === 'POST') {
    if (!writable) return sendJson(response, 403, { error: 'Read-only collection.' });
    if (name === 'write-error') return sendJson(response, 422, { error: 'Controlled validation error.' });
    let body = '';
    request.on('data', (chunk) => { body += chunk; });
    request.on('end', () => {
      const feature = JSON.parse(body);
      if (['form', 'patch-only', 'missing-queryables'].includes(name)) {
        const validationError = formValidationError(feature);
        if (validationError) return sendJson(response, 422, { error: validationError });
      }
      const id = features.reduce((max, item) => Math.max(max, Number(item.id) || 0), -1) + 1;
      const created = { ...feature, id };
      features.push(created);
      if (name === 'uncertain') {
        response.destroy();
        return;
      }
      sendJson(response, 201, created, { Location: `/local/collections/${name}/items/${id}` });
    });
    return undefined;
  }
  const limit = Math.max(1, Number(url.searchParams.get('limit')) || 250);
  const offset = Math.max(0, Number(url.searchParams.get('offset')) || 0);
  const bboxValue = url.searchParams.get('bbox');
  const bbox = bboxValue ? bboxValue.split(',').map(Number) : null;
  const filtered = bbox?.length === 4 ? features.filter((feature) => {
    const coordinates = feature.geometry?.coordinates;
    const positions = (value) => {
      if (!Array.isArray(value)) return [];
      if (typeof value[0] === 'number' && typeof value[1] === 'number') return [value];
      return value.flatMap(positions);
    };
    const points = positions(coordinates);
    if (points.length === 0) return false;
    const extent = points.reduce((result, [x, y]) => [
      Math.min(result[0], x), Math.min(result[1], y),
      Math.max(result[2], x), Math.max(result[3], y),
    ], [Infinity, Infinity, -Infinity, -Infinity]);
    return extent[0] <= bbox[2] && extent[2] >= bbox[0]
      && extent[1] <= bbox[3] && extent[3] >= bbox[1];
  }) : features;
  const page = filtered.slice(offset, offset + limit);
  const nextUrl = new URL(`/local/collections/${name}/items`, `http://localhost:${port}`);
  url.searchParams.forEach((value, key) => {
    if (key !== 'offset') nextUrl.searchParams.set(key, value);
  });
  nextUrl.searchParams.set('offset', String(offset + limit));
  const links = offset + limit < filtered.length
    ? [{ rel: 'next', href: `${nextUrl.pathname}${nextUrl.search}` }]
    : [];
  return sendJson(response, 200, { type: 'FeatureCollection', features: page, links });
}

const assets = new Map([
  ['/', path.join(__dirname, 'index.html')],
  ['/teunesco.html', path.join(__dirname, 'teunesco.html')],
  ['/demo.js', path.join(__dirname, 'dataidee-demo.js')],
  ['/teunesco.js', path.join(__dirname, 'teunesco-demo.js')],
  ['/teunesco.css', path.join(__dirname, 'teunesco.css')],
  ['/assets/apiidee.js', path.join(repositoryRoot, 'dist/js/apiidee-2.0.ol.min.js')],
  ['/assets/apiidee.css', path.join(repositoryRoot, 'dist/assets/css/apiidee-2.0.ol.min.css')],
  ['/assets/configuration.js', path.join(repositoryRoot, 'test/configuration_filtered.js')],
  ['/assets/vectorsmanagement.js', path.join(pluginRoot, 'dist/vectorsmanagement.ol.min.js')],
  ['/assets/vectorsmanagement.css', path.join(pluginRoot, 'dist/vectorsmanagement.ol.min.css')],
]);
const helpImages = path.join(pluginRoot, 'dist/images');
if (fs.existsSync(helpImages)) {
  fs.readdirSync(helpImages).filter((file) => file.endsWith('.png')).forEach((file) => {
    assets.set(`/plugins/vectorsmanagement/images/${file}`, path.join(helpImages, file));
  });
}

http.createServer((request, response) => {
  const url = new URL(request.url, `http://localhost:${port}`);
  if (url.pathname.startsWith('/local/')) return localApi(request, response, url);
  const file = assets.get(url.pathname);
  if (!file || !fs.existsSync(file)) {
    response.writeHead(404);
    return response.end('Build the OpenLayers core and VectorsManagement plugin first.');
  }
  let contentType = 'text/html; charset=utf-8';
  if (file.endsWith('.js')) contentType = 'text/javascript';
  else if (file.endsWith('.css')) contentType = 'text/css';
  else if (file.endsWith('.png')) contentType = 'image/png';
  response.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
  return fs.createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => {
  process.stdout.write(`DataIDEE editing demo: http://127.0.0.1:${port}\n`);
});
