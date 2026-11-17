/**
 * @module IDEE/impl/layer/MBTilesVector
 */
import { isNullOrEmpty, addParameters } from 'IDEE/util/Utils';
import TileProvider from 'IDEE/provider/Tile';
import { getValue } from 'IDEE/i18n/language';
import MVT from './MVT';

/**
 * @classdesc
 * Implementación para Cesium de la capa MBTiles de teselas vectoriales. Lee las
 * teselas del fichero MBTiles (sqlite) y las pinta como la capa MVT.
 *
 * @api
 * @extends {IDEE.impl.layer.MVT}
 */
class MBTilesVector extends MVT {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Object} userParameters Parámetros de la capa (url, source, tileLoadFunction...).
   * @param {Object} options Opciones de la capa.
   * @param {Object} vendorOptions Opciones de la capa de imágenes de Cesium.
   * @api
   */
  constructor(userParameters = {}, options = {}, vendorOptions = {}) {
    super(userParameters, options, vendorOptions);

    /**
     * Función de carga de teselas del usuario: (z, x, filaTMS) => Promise con sus bytes.
     * @public
     * @type {Function|null}
     */
    this.tileLoadFunction = userParameters.tileLoadFunction || null;

    this.url_ = userParameters.url;

    this.source_ = userParameters.source;

    /**
     * Extensión del usuario, en grados.
     * @private
     * @type {Array<Number>|null}
     */
    this.maxExtent_ = userParameters.maxExtent || null;

    this.maxZoomLevel_ = typeof userParameters.maxZoomLevel === 'number'
      ? userParameters.maxZoomLevel : 0;

    this.opacity_ = typeof options.opacity === 'number' ? options.opacity : 1;

    this.visibility = userParameters.visibility !== false;

    /**
     * Extensión del MBTiles (metadato "bounds"), en grados.
     * @private
     * @type {Array<Number>|null}
     */
    this.bounds_ = null;

    this.tileProvider_ = null;
  }

  /**
   * Añade la capa al visor cuando se ha abierto el MBTiles.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @api
   */
  addTo(map) {
    this.map = map;
    if (this.tileLoadFunction) {
      this.addImageryLayer_({
        extent: this.maxExtent_,
        maximumLevel: this.maxZoomLevel_ || undefined,
      });
      return;
    }
    this.loadPromise_ = this.fetchSource()
      .then(async (tileProvider) => {
        const maxZoomLevel = await tileProvider.getMaxZoomLevel();
        this.bounds_ = await tileProvider.getExtent();
        if (this.map !== map) return;
        this.addImageryLayer_({
          extent: this.maxExtent_ || this.bounds_,
          maximumLevel: this.maxZoomLevel_ || maxZoomLevel || undefined,
        });
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.error(error);
        this.facadeLayer_?.fire('error', [error]);
      });
  }

  /**
   * Abre el MBTiles (fuente del usuario o URL).
   *
   * @public
   * @function
   * @returns {Promise<IDEE.provider.Tile>} Proveedor de teselas.
   * @api
   */
  fetchSource() {
    if (this.tileProvider_) return Promise.resolve(this.tileProvider_);
    if (this.source_) {
      this.tileProvider_ = new TileProvider(this.source_);
      return Promise.resolve(this.tileProvider_);
    }
    if (this.url_) {
      return window.fetch(this.url_).then((response) => {
        this.tileProvider_ = new TileProvider(response);
        return this.tileProvider_;
      });
    }
    return Promise.reject(new Error(getValue('exception').no_source));
  }

  /**
   * Bytes de una tesela (fila TMS en el MBTiles).
   *
   * @public
   * @function
   * @param {Number} x Columna.
   * @param {Number} y Fila (desde arriba).
   * @param {Number} z Nivel.
   * @returns {Promise<Uint8Array|null>} Tesela, o null si no existe.
   * @api
   */
  getTileData(x, y, z) {
    const tmsRow = 2 ** z - 1 - y;
    if (this.tileLoadFunction) {
      return Promise.resolve(this.tileLoadFunction(z, x, tmsRow))
        .then((data) => (data ? new Uint8Array(data) : null));
    }
    return this.tileProvider_.getVectorTile([z, x, tmsRow]).then((data) => data || null);
  }

  /**
   * El MBTiles es local: no hay autorefresco.
   *
   * @public
   * @function
   * @api
   */
  /**
   * Recarga el MBTiles remoto (autorefresco) y vuelve a pintar sus teselas conservando la
   * capa y sus opciones, como en OpenLayers.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @public
   * @function
   * @param {Function} isCurrent Indica si la recarga sigue vigente.
   */
  async refreshSource(isCurrent = () => true) {
    const layer = this.cesiumLayer;
    if (isNullOrEmpty(layer) || this.source_ || this.tileLoadFunction
      || !this.isAutoRefreshRemoteURL(this.url_)) return;
    const response = await window.fetch(addParameters(this.url_, { _ideeRefresh: Date.now() }));
    if (!response.ok) throw new Error(`MBTiles: HTTP ${response.status}`);
    const provider = new TileProvider(response);
    let adopted = false;
    try {
      await provider.getMaxZoomLevel();
      if (!isCurrent() || this.cesiumLayer !== layer) return;
      const previous = this.tileProvider_;
      this.tileProvider_ = provider;
      adopted = true;
      this.replaceAutoRefreshProvider(this.createProvider_());
      previous?.dispose?.();
    } finally {
      if (!adopted) provider.dispose?.();
    }
  }

  /**
   * Extensión de la capa en grados.
   *
   * @public
   * @function
   * @returns {Array<Number>|null} Extensión.
   * @api
   */
  getFeaturesExtent() {
    return this.maxExtent_ || this.bounds_ || null;
  }

  /**
   * Quita la capa del visor.
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    super.destroy();
    if (!isNullOrEmpty(this.tileProvider_) && typeof this.tileProvider_.dispose === 'function') {
      this.tileProvider_.dispose();
    }
    this.tileProvider_ = null;
  }

  /**
   * Comprueba si un objeto es igual a esta capa.
   *
   * @public
   * @function
   * @param {Object} obj Objeto.
   * @returns {Boolean} Verdadero si es la misma capa.
   * @api
   */
  equals(obj) {
    return obj instanceof MBTilesVector && this.name === obj.name
      && this.extract === obj.extract && this.template === obj.template;
  }
}

export default MBTilesVector;
