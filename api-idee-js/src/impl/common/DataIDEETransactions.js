import { normalizeDataIDEESchema } from './DataIDEEFormSchema';
import exceptionMessage from './exceptionMessage';

/** DataIDEE-only OGC API Features transaction client. */
const normalizedPath = (pathname) => pathname.split('/').map((part) => {
  try { return decodeURIComponent(part); } catch (error) { return part; }
}).join('/').replace(/\/$/, '');
const isMissing = (error) => error?.status === 404;

function advertisedLink(links, rel, fallback, baseUrl, allowedOrigin) {
  const link = (links || []).find((candidate) => candidate.rel === rel
    || candidate.rel === `http://www.opengis.net/def/rel/ogc/1.0/${rel}`);
  const url = new URL(link?.href || fallback, baseUrl);
  if (url.origin !== allowedOrigin) {
    throw new Error(exceptionMessage('dataidee_link_origin', { rel }));
  }
  return url.href;
}

/**
 * Service descriptions shared by the transaction clients of a page: key → promise of
 * { document, descriptionUrl } or null (see DataIDEETransactions#serviceDescription_).
 */
const serviceDescriptions = new Map();

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const TEMPLATE_PARAMETER = /^\{[^}]+\}$/;

/**
 * Path of an OpenAPI description that describes one of the candidate paths followed by
 * the suffix. A literal path wins; otherwise a templated one, where each {parameter}
 * stands for one path segment.
 * @param {Object} paths OpenAPI "paths".
 * @param {Array<String>} candidates Collection paths.
 * @param {String} suffix "/items" or "/items/{featureId}".
 * @returns {String|undefined} Key of the matching path.
 */
function findOperationPath(paths, candidates, suffix) {
  const keys = Object.keys(paths || {});
  const targets = candidates.map((candidate) => `${normalizedPath(candidate)}${suffix}`);
  const literal = keys.find((path) => targets.includes(normalizedPath(path)));
  if (literal) return literal;
  const samples = targets.map((target) => target.replace(/\{[^}]+\}/g, 'x'));
  return keys.find((path) => {
    const pattern = new RegExp(`^${normalizedPath(path).split(/(\{[^}]+\})/)
      .map((part) => (TEMPLATE_PARAMETER.test(part) ? '[^/]+' : escapeRegExp(part))).join('')}$`);
    return samples.some((sample) => pattern.test(sample));
  });
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
        // JSON formats come first so a server that negotiates returns JSON; "*/*" with low
        // priority keeps a server without those formats from answering 406 Not Acceptable.
        Accept: 'application/geo+json, application/json, application/schema+json, application/vnd.oai.openapi+json, */*;q=0.1',
        ...this.headers_,
        ...options.headers,
        ...(token && this.tokenLocation_ !== 'query'
          ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (!response.ok) {
      const error = new Error(exceptionMessage('dataidee_transaction_failed', {
        status: response.status,
      }));
      error.status = response.status;
      throw error;
    }
    return response;
  }

  /**
   * Edit capabilities of the collection. They are requested once per token: later
   * calls share the same promise, and a failed request is retried on the next call.
   * @returns {Promise<Object>} Capabilities.
   */
  capabilities() {
    const token = this.getToken_() || '';
    if (!this.capabilities_ || this.capabilitiesToken_ !== token) {
      const pending = this.loadCapabilities_();
      this.capabilities_ = pending;
      this.capabilitiesToken_ = token;
      pending.catch(() => {
        if (this.capabilities_ === pending) this.capabilities_ = null;
      });
    }
    return this.capabilities_;
  }

  /**
   * Root of the service ("…/ogc/") without query parameters.
   * @private
   * @returns {String} URL.
   */
  serviceRoot_() {
    const collectionBase = new URL(this.collectionUrl_);
    return `${collectionBase.origin}${collectionBase.pathname.split('/collections/')[0]}/`;
  }

  /**
   * Service description (OpenAPI document linked as "service-desc" from the landing page),
   * shared by every layer and collection of the service with the same credentials.
   * @private
   * @returns {Promise<{document: Object, descriptionUrl: String}|null>} null without one.
   */
  serviceDescription_() {
    const root = this.serviceRoot_();
    const key = JSON.stringify([root, this.getToken_() || '', this.parameters_, this.headers_]);
    if (!serviceDescriptions.has(key)) {
      const pending = (async () => {
        try {
          const service = await (await this.request(root)).json();
          const descriptionLink = service.links?.find((link) => link.rel === 'service-desc');
          if (!descriptionLink) return null;
          const descriptionUrl = new URL(descriptionLink.href, root);
          if (descriptionUrl.origin !== new URL(root).origin) {
            throw new Error(exceptionMessage('dataidee_service_description_origin'));
          }
          const document = await (await this.request(descriptionUrl.href)).json();
          return { document, descriptionUrl: descriptionUrl.href };
        } catch (error) {
          // Without a JSON description the capabilities come from the conformance classes
          if (isMissing(error) || error instanceof SyntaxError) return null;
          throw error;
        }
      })();
      serviceDescriptions.set(key, pending);
      pending.catch(() => {
        if (serviceDescriptions.get(key) === pending) serviceDescriptions.delete(key);
      });
    }
    return serviceDescriptions.get(key);
  }

  async loadCapabilities_() {
    const root = `${this.collectionUrl_.split('/collections/')[0]}/`;
    const collectionBase = new URL(this.collectionUrl_);
    const collectionRoot = this.serviceRoot_();
    const optionalJson = async (url) => {
      try {
        return await (await this.request(url)).json();
      } catch (error) {
        if (isMissing(error) || error instanceof SyntaxError) return null;
        throw error;
      }
    };
    // The collection (with the schemas it links) and the service description do not
    // depend on each other: they are requested in parallel.
    const collectionDetails = async () => {
      const collection = await (await this.request(this.collectionUrl_)).json();
      const collectionLinks = collection.links || [];
      const queryablesUrl = advertisedLink(collectionLinks, 'queryables', `${this.collectionUrl_}/queryables`, this.collectionUrl_, collectionBase.origin);
      const schemaUrl = advertisedLink(collectionLinks, 'schema', `${this.collectionUrl_}/schema`, this.collectionUrl_, collectionBase.origin);
      const [queryables, schema] = await Promise.all([
        optionalJson(queryablesUrl), optionalJson(schemaUrl),
      ]);
      return {
        collection, queryables, schema, queryablesUrl, schemaUrl,
      };
    };
    const serviceOperations = async () => {
      const description = await this.serviceDescription_();
      if (!description) return null;
      const { document, descriptionUrl } = description;
      // The description may publish the collection by its full path, relative to the
      // service root, or relative to its server URL, and literally or as a template
      // (/ogc/collections/{collectionId}/items)
      const collectionPath = collectionBase.pathname;
      const relativeTo = (basePath) => (basePath && collectionPath.startsWith(`${basePath}/`)
        ? collectionPath.slice(basePath.length) : null);
      let serverPath = null;
      try {
        const server = document.servers?.[0]?.url;
        if (server) serverPath = new URL(server, descriptionUrl).pathname.replace(/\/$/, '');
      } catch (error) {
        serverPath = null;
      }
      const candidates = [
        collectionPath,
        relativeTo(new URL(collectionRoot).pathname.replace(/\/$/, '')),
        relativeTo(serverPath),
      ].filter(Boolean);
      const itemsPath = findOperationPath(document.paths, candidates, '/items');
      const featurePath = findOperationPath(document.paths, candidates, '/items/{featureId}');
      return itemsPath ? {
        items: document.paths[itemsPath],
        feature: featurePath ? document.paths[featurePath] : {},
      } : null;
    };
    const [{
      collection, queryables, schema, queryablesUrl, schemaUrl,
    }, operations] = await Promise.all([collectionDetails(), serviceOperations()]);
    // The conformance classes only decide the capabilities when the description does
    // not publish the collection
    const conformance = operations === null ? await optionalJson(`${root}conformance`) : null;
    const conformanceValues = conformance?.conformsTo || conformance?.conforms || [];
    const conforms = conformanceValues.join(' ').toLowerCase();
    const writable = collection.writable !== false;
    const methods = new Set(Object.keys(operations?.items || {})
      .map((method) => method.toUpperCase()));
    const featureMethods = new Set(Object.keys(operations?.feature || {})
      .map((method) => method.toUpperCase()));
    const writableFromApi = operations !== null;
    let form = { available: false, reason: exceptionMessage('dataidee_schema_unavailable') };
    if (schema) {
      try {
        const normalized = normalizeDataIDEESchema(schema);
        const unsupportedRoot = ['allOf', 'anyOf', 'oneOf', 'not', 'if', 'then', 'else']
          .filter((key) => Object.hasOwn(normalized.schema, key));
        form = {
          available: unsupportedRoot.length === 0,
          ...(unsupportedRoot.length ? {
            reason: exceptionMessage('dataidee_schema_keywords', {
              keywords: unsupportedRoot.join(', '),
            }),
          } : {}),
          ...normalized,
          defaults: Object.fromEntries(normalized.properties
            .filter((field) => field.default !== undefined)
            .map((field) => [field.name, field.default])),
        };
      } catch (error) {
        form.reason = exceptionMessage('dataidee_schema_unusable', { error: error.message });
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
        throw new Error(exceptionMessage('dataidee_location_outside'));
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
