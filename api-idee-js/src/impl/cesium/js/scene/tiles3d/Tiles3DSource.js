/**
 * @module IDEE/impl/scene/tiles3d/Tiles3DSource
 */
import { Cesium3DTileset, IonResource, Resource } from 'cesium';
import FacadeLayer from 'IDEE/layer/Layer';
import { getValue } from 'IDEE/i18n/language';

const MASK = '***';

const getOrigin = (url) => {
  try {
    return new URL(url, window.location.href).origin;
  } catch (error) {
    return null;
  }
};

/**
 * Sustituye en un texto los valores secretos, tal cual y codificados para URL.
 * @function
 * @param {*} text Texto.
 * @param {Array<String>} secrets Valores secretos.
 * @returns {String} Texto enmascarado.
 */
export const maskSecrets = (text, secrets) => secrets
  .filter((secret) => typeof secret === 'string' && secret !== '')
  .flatMap((secret) => [secret, encodeURIComponent(secret)])
  .reduce((masked, secret) => masked.split(secret).join(MASK), String(text ?? ''));

/**
 * Credenciales que solo pueden viajar al origen de la URL del tileset.
 */
class CredentialScope {
  constructor(url, headers, queryParameters) {
    this.origin_ = getOrigin(url);
    this.headers_ = headers;
    this.queryParameters_ = queryParameters;
  }

  /**
   * Añade las credenciales al recurso si es del mismo origen y las retira si no.
   * @param {Cesium.Resource} resource Recurso.
   * @returns {Cesium.Resource} El mismo recurso.
   */
  applyTo(resource) {
    const target = resource;
    const allowed = getOrigin(target.url) === this.origin_;
    const query = target.queryParameters;
    Object.entries(this.headers_).forEach(([key, value]) => {
      if (allowed) {
        target.headers[key] = value;
      } else {
        delete target.headers[key];
      }
    });
    Object.entries(this.queryParameters_).forEach(([key, value]) => {
      if (allowed) {
        query[key] = value;
      } else {
        delete query[key];
      }
    });
    return target;
  }
}

/**
 * Recurso cuyas derivaciones (contenido, tilesets externos) solo llevan las credenciales
 * cuando su origen coincide con el de la URL del tileset.
 */
export class OriginScopedResource extends Resource {
  constructor(options, scope) {
    super(options);
    this.credentialScope_ = scope;
  }

  clone(result) {
    const target = result || new OriginScopedResource({ url: this.url }, this.credentialScope_);
    return super.clone(target);
  }

  getDerivedResource(options) {
    return this.credentialScope_.applyTo(super.getDerivedResource(options));
  }
}

/**
 * Fuente de un tileset: carga el tileset raíz y sanea los errores sin exponer secretos.
 */
export class Tiles3DSource {
  /**
   * Carga el tileset.
   * @param {Object} [params] Parámetros.
   * @param {Object} [params.tilesetOptions] Opciones de Cesium3DTileset.
   * @param {Object} [params.queryParameters] Parámetros de consulta adicionales.
   * @returns {Promise<Cesium.Cesium3DTileset>} Tileset.
   */
  load() {
    return Promise.reject(new Error('Tiles3DSource'));
  }

  /**
   * Indica si la fuente admite recargas con autorefresco.
   * @returns {Boolean} Verdadero si se puede recargar.
   */
  canRefresh() {
    return false;
  }

  /**
   * Valores secretos de la fuente.
   * @returns {Array<String>} Secretos.
   */
  getSecrets() {
    return [];
  }

  /**
   * Devuelve un error sin secretos a partir del error de carga.
   * @param {*} error Error de carga.
   * @returns {Error} Error saneado.
   */
  sanitizeError(error) {
    const statusCode = error?.statusCode;
    const message = Number.isFinite(statusCode)
      ? `HTTP ${statusCode}`
      : maskSecrets(error?.message ?? error, this.getSecrets());
    const sanitized = new Error(message);
    if (statusCode !== undefined) sanitized.statusCode = statusCode;
    return sanitized;
  }

  /**
   * Sustituye el registro en consola de Cesium de las teselas fallidas, que incluye la
   * URL con sus parámetros, por un aviso saneado.
   * @param {Cesium.Cesium3DTileset} tileset Tileset.
   * @returns {Cesium.Cesium3DTileset} El mismo tileset.
   */
  watchTileFailures(tileset) {
    tileset.tileFailed.addEventListener(({ url, message }) => {
      const secrets = this.getSecrets();
      // eslint-disable-next-line no-console
      console.warn(
        getValue('exception').tiles3d_tile_failed,
        maskSecrets(url, secrets),
        maskSecrets(message, secrets),
      );
    });
    return tileset;
  }
}

/**
 * Tileset publicado en una URL, con cabeceras, parámetros de consulta y ticket.
 */
export class UrlTilesetSource extends Tiles3DSource {
  constructor({ url, headers, queryParameters }, { ticket } = {}) {
    super();
    this.url_ = url;
    this.headers_ = { ...headers };
    this.queryParameters_ = {
      ...queryParameters,
      ...(typeof ticket === 'string' && ticket !== '' ? { ticket } : {}),
    };
  }

  /**
   * Crea el recurso raíz del tileset.
   * @param {Object} [queryParameters] Parámetros de consulta adicionales.
   * @returns {OriginScopedResource} Recurso.
   */
  createResource(queryParameters = {}) {
    const scope = new CredentialScope(this.url_, this.headers_, this.queryParameters_);
    return new OriginScopedResource({
      url: this.url_,
      headers: this.headers_,
      queryParameters: { ...this.queryParameters_, ...queryParameters },
    }, scope);
  }

  load({ tilesetOptions, queryParameters } = {}) {
    return Cesium3DTileset.fromUrl(this.createResource(queryParameters), tilesetOptions)
      .then((tileset) => this.watchTileFailures(tileset));
  }

  canRefresh() {
    return FacadeLayer.isAutoRefreshRemoteURL(this.url_);
  }

  getSecrets() {
    return [...Object.values(this.headers_), ...Object.values(this.queryParameters_)];
  }
}

/**
 * Tileset de Cesium ion. El IonResource de Cesium gestiona su propio token.
 */
export class IonTilesetSource extends Tiles3DSource {
  constructor({ ionAssetId, ionAccessToken, ionServer }) {
    super();
    this.assetId_ = ionAssetId;
    this.accessToken_ = ionAccessToken;
    this.server_ = ionServer;
  }

  load({ tilesetOptions } = {}) {
    return IonResource.fromAssetId(this.assetId_, {
      accessToken: this.accessToken_,
      server: this.server_,
    }).then((resource) => Cesium3DTileset.fromUrl(resource, tilesetOptions))
      .then((tileset) => this.watchTileFailures(tileset));
  }

  getSecrets() {
    return [this.accessToken_];
  }
}

/**
 * Crea la fuente de un tileset a partir de las opciones normalizadas.
 * @function
 * @param {Object} normalized Resultado de normalizeTiles3DOptions.
 * @param {Object} [context] Contexto de la carga.
 * @param {String} [context.ticket] Ticket de IDEE.
 * @returns {Tiles3DSource} Fuente.
 */
export const createTilesetSource = (normalized, context = {}) => (normalized.type === 'ion'
  ? new IonTilesetSource(normalized)
  : new UrlTilesetSource(normalized, context));

export default createTilesetSource;
