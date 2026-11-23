/**
 * Servicio DataIDEE a partir de la URL base que publica su API
 * (p. ej. https://servidor/data-idee-api). Su API OGC API - Features está en {base}/ogc:
 * la clase lee su página de inicio, su conformidad y su listado de colecciones, e informa
 * de si ha encontrado colecciones. No pide la URL base, que en el servicio real redirige
 * (302) por http a la documentación de la API.
 */
import { parseOGCAPIUrl, getCollectionsUrl } from './ogcapiurl';

/** Hay colecciones visibles. */
export const DATAIDEE_FOUND = 'found';

/** El listado de colecciones está vacío (p. ej. sin sesión). */
export const DATAIDEE_EMPTY = 'empty';

/** El listado de colecciones exige autenticación (HTTP 401/403). */
export const DATAIDEE_PROTECTED = 'protected';

/** No hay una API OGC API - Features en {base}/ogc. */
export const DATAIDEE_NOT_FOUND = 'not-found';

/** Hay una API en {base}/ogc, pero su listado de colecciones no es válido. */
export const DATAIDEE_COLLECTIONS_ERROR = 'collections-error';

/** Hay una API en {base}/ogc, pero su listado de colecciones no responde (red o CORS). */
export const DATAIDEE_UNREACHABLE = 'unreachable';

const OGC_PATH = 'ogc';
const UNAUTHORIZED_CODES = [401, 403];
const FEATURES_CORE = /\/ogcapi-features-1\/1\.0\/conf\/core$/;
const OGC_RELATION = 'http://www.opengis.net/def/rel/ogc/1.0/';

const parseJSON = (text) => {
  try {
    return JSON.parse(text);
  } catch (err) {
    return null;
  }
};

/**
 * Pide una URL con IDEE.remote. Sin respuesta (red o CORS), el código es 0.
 * @param {String} url URL.
 * @param {Object} [requestOptions] Opciones de IDEE.remote (cabeceras).
 * @returns {Promise<{code: Number, json: (Object|null)}>} Código HTTP y JSON de la respuesta.
 */
const request = (url, requestOptions) => IDEE.remote.get(url, null, requestOptions)
  .catch(() => ({ code: 0 }))
  .then((response) => ({ code: response.code, json: parseJSON(response.text) }));

export default class DataIDEEService {
  /**
   * @param {String} url URL base del servicio. Se ignoran la consulta y las barras finales.
   */
  constructor(url) {
    /**
     * URL base del servicio.
     * @type {String}
     */
    this.base = parseOGCAPIUrl(url).root;

    /**
     * Raíz de su API OGC API - Features.
     * @type {String}
     */
    this.root = `${this.base}/${OGC_PATH}`;
  }

  /**
   * Busca la API OGC API - Features del servicio y sus colecciones.
   * 1. Página de inicio ({base}/ogc): sin enlaces, no hay API.
   * 2. Conformidad (enlace "conformance" del mismo origen) y listado de colecciones
   *    ({base}/ogc/collections), en paralelo. Si la conformidad se lee y no declara
   *    OGC API - Features Core, no hay API; si no se puede leer, no se tiene en cuenta.
   *
   * @param {Object} [requestOptions] Opciones de IDEE.remote para el listado de colecciones
   * (p. ej. la cabecera Authorization de la sesión del servicio).
   * @returns {Promise<{status: String, root: String, count: (Number|undefined),
   * collectionsJson: (Object|undefined)}>} Estado (DATAIDEE_*), raíz de la API y, con un
   * listado válido, su número de colecciones y su JSON.
   */
  async discover(requestOptions) {
    const result = (status, extra = {}) => ({ status, root: this.root, ...extra });
    const landing = await request(this.root);
    if (!Array.isArray(landing.json?.links)) return result(DATAIDEE_NOT_FOUND);

    const conformanceUrl = this.getLinkUrl_(landing.json.links, 'conformance');
    const [collections, conformance] = await Promise.all([
      request(getCollectionsUrl(this.root), requestOptions),
      conformanceUrl ? request(conformanceUrl) : null,
    ]);
    const conformsTo = conformance?.json?.conformsTo;
    if (Array.isArray(conformsTo) && !conformsTo.some((uri) => FEATURES_CORE.test(uri))) {
      return result(DATAIDEE_NOT_FOUND);
    }
    if (collections.code === 0) return result(DATAIDEE_UNREACHABLE);
    if (UNAUTHORIZED_CODES.includes(collections.code)) return result(DATAIDEE_PROTECTED);
    const list = collections.json?.collections;
    if (!Array.isArray(list)) return result(DATAIDEE_COLLECTIONS_ERROR);
    return result(list.length > 0 ? DATAIDEE_FOUND : DATAIDEE_EMPTY, {
      count: list.length,
      collectionsJson: collections.json,
    });
  }

  /**
   * URL de un enlace de la página de inicio, si es del mismo origen que la API.
   * @private
   * @param {Array<Object>} links Enlaces.
   * @param {String} rel Relación (con o sin el prefijo de OGC).
   * @returns {String|null} URL absoluta o null.
   */
  getLinkUrl_(links, rel) {
    const link = links.find((candidate) => candidate?.rel === rel
      || candidate?.rel === `${OGC_RELATION}${rel}`);
    if (!link?.href) return null;
    try {
      const url = new URL(link.href, `${this.root}/`);
      return url.origin === new URL(this.root).origin ? url.href : null;
    } catch (err) {
      return null;
    }
  }
}
