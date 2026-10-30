import { normalizeDataIDEESchema } from './DataIDEEFormSchema';

/** DataIDEE-only OGC API Features transaction client. */
const normalizedPath = (pathname) => pathname.split('/').map((part) => {
  try { return decodeURIComponent(part); } catch (error) { return part; }
}).join('/').replace(/\/$/, '');
const isMissing = (error) => error?.status === 404;

function advertisedLink(links, rel, fallback, baseUrl, allowedOrigin) {
  const link = (links || []).find((candidate) => candidate.rel === rel
    || candidate.rel === `http://www.opengis.net/def/rel/ogc/1.0/${rel}`);
  const url = new URL(link?.href || fallback, baseUrl);
  if (url.origin !== allowedOrigin) throw new Error(`DataIDEE ${rel} link escaped the configured origin.`);
  return url.href;
}

function operationContent(operation) {
  return new Set(Object.keys(operation?.requestBody?.content || {})
    .map((type) => type.toLowerCase()));
}

export default class DataIDEETransactions {
  constructor({
    url,
    collection,
    parameters = {},
    headers = {},
    defaultProperties = {},
    getToken = () => undefined,
    tokenLocation = 'header',
  }) {
    const base = new URL(url, window.location?.href || 'http://localhost/');
    ['bbox', 'limit', 'offset', 'f', 'filter', 'filter-lang', '_ideeRefresh']
      .forEach((key) => base.searchParams.delete(key));
    const collectionPath = `/collections/${encodeURIComponent(collection)}`;
    const itemsPath = `${collectionPath}/items`;
    if (base.pathname.endsWith(itemsPath)) base.pathname = base.pathname.slice(0, -'/items'.length);
    else if (!base.pathname.endsWith(collectionPath)) {
      base.pathname = `${base.pathname.replace(/\/+$/, '')}${collectionPath}`;
    }
    this.collectionUrl_ = base.href.replace(/\/$/, '');
    const readOnlyParameters = new Set([
      'bbox', 'limit', 'offset', 'f', 'filter', 'filter-lang', '_ieerefresh',
    ]);
    this.parameters_ = Object.fromEntries(Object.entries(parameters).filter(([key]) => (
      !readOnlyParameters.has(key.toLowerCase())
    )));
    this.headers_ = headers;
    this.defaultProperties_ = defaultProperties;
    this.getToken_ = getToken;
    this.tokenLocation_ = tokenLocation;
  }

  async request(url, options = {}) {
    const target = new URL(url, window.location?.href || 'http://localhost/');
    Object.entries(this.parameters_).forEach(([key, value]) => target.searchParams.set(key, value));
    const ticket = window.IDEE?.config?.TICKET;
    if (ticket && target.origin === new URL(this.collectionUrl_).origin) {
      target.searchParams.set('ticket', ticket);
    }
    const token = this.getToken_();
    if (token && this.tokenLocation_ === 'query') target.searchParams.set('token', token);
    const response = await window.fetch(target.href, {
      cache: 'no-store',
      ...options,
      headers: {
        Accept: 'application/geo+json, application/json, application/schema+json, application/vnd.oai.openapi+json',
        ...this.headers_,
        ...options.headers,
        ...(token && this.tokenLocation_ !== 'query'
          ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) {
      const error = new Error(`DataIDEE transaction failed (HTTP ${response.status}).`);
      error.status = response.status;
      throw error;
    }
    return response;
  }

  async capabilities() {
    const collectionResponse = await this.request(this.collectionUrl_);
    const collection = await collectionResponse.json();
    const root = `${this.collectionUrl_.split('/collections/')[0]}/`;
    const collectionLinks = collection.links || [];
    const queryablesUrl = advertisedLink(collectionLinks, 'queryables', `${this.collectionUrl_}/queryables`, this.collectionUrl_, new URL(this.collectionUrl_).origin);
    const schemaUrl = advertisedLink(collectionLinks, 'schema', `${this.collectionUrl_}/schema`, this.collectionUrl_, new URL(this.collectionUrl_).origin);
    const optionalJson = async (url) => {
      try {
        return await (await this.request(url)).json();
      } catch (error) {
        if (isMissing(error) || error instanceof SyntaxError) return null;
        throw error;
      }
    };
    const [conformance, queryables, schema] = await Promise.all([
      optionalJson(`${root}conformance`), optionalJson(queryablesUrl), optionalJson(schemaUrl),
    ]);
    const conformanceValues = conformance?.conformsTo || conformance?.conforms || [];
    const conforms = conformanceValues.join(' ').toLowerCase();
    const writable = collection.writable !== false;
    const collectionBase = new URL(this.collectionUrl_);
    const collectionRoot = `${collectionBase.origin}${collectionBase.pathname.split('/collections/')[0]}/`;
    let operations = null;
    try {
      const serviceResponse = await this.request(collectionRoot);
      const service = await serviceResponse.json();
      const descriptionLink = service.links?.find((link) => link.rel === 'service-desc');
      if (descriptionLink) {
        const descriptionUrl = new URL(descriptionLink.href, collectionRoot);
        if (descriptionUrl.origin !== collectionBase.origin) {
          throw new Error('DataIDEE service description escaped the configured origin.');
        }
        const response = await this.request(descriptionUrl.href);
        const document = await response.json();
        const collectionPath = new URL(this.collectionUrl_).pathname;
        const servicePath = new URL(collectionRoot).pathname.replace(/\/$/, '');
        const relativeCollectionPath = collectionPath.startsWith(`${servicePath}/`)
          ? collectionPath.slice(servicePath.length) : collectionPath;
        const itemsPath = Object.keys(document.paths || {}).find((path) => (
          [collectionPath, relativeCollectionPath].some((candidate) => (
            decodeURIComponent(path.replace(/\/$/, ''))
              === `${decodeURIComponent(candidate)}/items`
          ))
        ));
        const featurePath = Object.keys(document.paths || {}).find((path) => (
          [collectionPath, relativeCollectionPath].some((candidate) => (
            decodeURIComponent(path.replace(/\/$/, ''))
              === `${decodeURIComponent(candidate)}/items/{featureId}`
          ))
        ));
        operations = itemsPath ? {
          items: document.paths[itemsPath],
          feature: featurePath ? document.paths[featurePath] : {},
        } : null;
      }
    } catch (error) {
      if (error.status !== 404) throw error;
    }
    const methods = new Set(Object.keys(operations?.items || {})
      .map((method) => method.toUpperCase()));
    const featureMethods = new Set(Object.keys(operations?.feature || {})
      .map((method) => method.toUpperCase()));
    const writableFromApi = operations !== null;
    let form = { available: false, reason: 'The collection schema is unavailable.' };
    if (schema) {
      try {
        const normalized = normalizeDataIDEESchema(schema);
        const unsupportedRoot = ['allOf', 'anyOf', 'oneOf', 'not', 'if', 'then', 'else']
          .filter((key) => Object.hasOwn(normalized.schema, key));
        form = {
          available: unsupportedRoot.length === 0,
          ...(unsupportedRoot.length ? { reason: `Unsupported collection schema keywords: ${unsupportedRoot.join(', ')}` } : {}),
          ...normalized,
          defaults: Object.fromEntries(normalized.properties
            .filter((field) => field.default !== undefined)
            .map((field) => [field.name, field.default])),
        };
      } catch (error) {
        form.reason = `The collection schema cannot be used for editing: ${error.message}`;
      }
    }
    const capability = (method, standard) => writable && (writableFromApi
      ? methods.has(method) : new RegExp(standard).test(conforms));
    let updateMethod = featureMethods.has('PATCH') || /patch/.test(conforms) ? 'PATCH' : 'PUT';
    if (operationContent(operations?.feature?.put).has('application/geo+json')) updateMethod = 'PUT';
    return {
      create: capability('POST', 'create|transactions'),
      update: writable && (operations !== null
        ? featureMethods.has('PATCH') || featureMethods.has('PUT')
        : /update|replace|transactions/.test(conforms)),
      delete: writable && (operations !== null
        ? featureMethods.has('DELETE') : /delete|transactions/.test(conforms)),
      updateMethod,
      updateMethods: {
        patchAvailable: operations === null ? undefined : featureMethods.has('PATCH'),
        patch: featureMethods.has('PATCH') ? [...operationContent(operations?.feature?.patch)] : [],
        put: featureMethods.has('PUT') ? [...operationContent(operations?.feature?.put)] : [],
      },
      collection,
      queryables,
      schema,
      form,
      schemaUrl,
      queryablesUrl,
      geometryTypes: schema?.['x-ogc-geometry-types'] || (schema
        ? Object.values(schema.properties || {})
          .filter((property) => property['x-ogc-role'] === 'primary-geometry')
          .map((property) => property.format?.replace('geometry-', '')) : null),
      creationFields: schema ? Object.entries(schema.properties || {})
        .filter(([name, property]) => name !== 'id' && !property.readOnly
          && property['x-ogc-role'] !== 'primary-geometry')
        .map(([name, property]) => ({
          name,
          type: property.type || 'string',
          required: (schema.required || []).includes(name),
        })) : [],
      clientAssignedId: Boolean(Object.values(schema?.properties || {}).find((property) => {
        const types = Array.isArray(property.type) ? property.type : [property.type];
        return property['x-ogc-role'] === 'id' && property.readOnly !== true
          && types.some((type) => type === 'integer' || type === 'string');
      })),
      idType: (() => {
        const property = Object.values(schema?.properties || {})
          .find((item) => item['x-ogc-role'] === 'id');
        return Array.isArray(property?.type) ? property.type.find((type) => type !== 'null') : property?.type || null;
      })(),
    };
  }

  getItemsUrl() { return `${this.collectionUrl_}/items`; }

  async getFeature(id) {
    const response = await this.request(`${this.collectionUrl_}/items/${encodeURIComponent(id)}`);
    return { feature: await response.json(), etag: response.headers.get('ETag') };
  }

  async create(feature, { applyDefaults = true } = {}) {
    const properties = {
      ...(applyDefaults ? this.defaultProperties_ : {}), ...(feature.properties || {}),
    };
    const payload = { ...feature, properties };
    const response = await this.request(`${this.collectionUrl_}/items`, {
      method: 'POST', headers: { 'Content-Type': 'application/geo+json' }, body: JSON.stringify(payload),
    });
    const location = response.headers.get('Location');
    const responseText = response.status === 204 ? '' : await response.text();
    let created = responseText ? JSON.parse(responseText) : null;
    if ((!created || (created.id === undefined && created.id !== 0)) && location) {
      const itemUrl = new URL(location, response.url);
      const collectionUrl = new URL(this.collectionUrl_);
      if (itemUrl.origin !== collectionUrl.origin
        || !normalizedPath(itemUrl.pathname).startsWith(`${normalizedPath(collectionUrl.pathname)}/items/`)) {
        throw new Error('DataIDEE returned a Location outside the configured collection.');
      }
      const itemResponse = await this.request(itemUrl.href);
      created = await itemResponse.json();
    }
    return { feature: created, location };
  }

  async update(id, feature, etag, method, options = {}) {
    const updateMethod = method || 'PATCH';
    const body = updateMethod === 'PATCH' ? {
      ...(options.geometryChanged === false ? {} : { geometry: feature.geometry }),
      ...(options.propertiesPatch ? { properties: options.propertiesPatch } : {}),
    } : (options.putFeature || feature);
    const headers = { 'Content-Type': 'application/merge-patch+json' };
    if (updateMethod === 'PUT') headers['Content-Type'] = 'application/geo+json';
    if (etag && !/^W\//i.test(etag)) headers['If-Match'] = etag;
    const response = await this.request(`${this.collectionUrl_}/items/${encodeURIComponent(id)}`, {
      method: updateMethod, headers, body: JSON.stringify(body),
    });
    return response.status === 204 ? null : response.json();
  }

  async delete(id, etag) {
    const headers = {};
    if (etag && !/^W\//i.test(etag)) headers['If-Match'] = etag;
    await this.request(`${this.collectionUrl_}/items/${encodeURIComponent(id)}`, { method: 'DELETE', headers });
  }
}
