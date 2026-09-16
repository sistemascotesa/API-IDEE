/**
 * @module IDEE/GeoPackageConnector
 */
import sqljs from 'sql.js';
import { GeoPackageConnection, GeoPackage, setSqljsWasmLocateFile } from '@ngageoint/geopackage';
import GeoPackageTile from '../provider/TileProvider';
import GeoPackageVector from '../provider/VectorProvider';
import Exception from '../exception/exception';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 * Esta clase permite leer y procesar un archivo GeoPackage (.gpkg).
 * Obtiene proveedores para caps vectoriales y ráster.
 *
 * @property {Object} tileOpts_ Opciones específicas para capas ráster.
 * @property {Object} vectorOpts_ Opciones específicas para capas vectoriales.
 * @property {Array<GeoPackageVector>} vectorProviders_  Proveedores de capas vectoriales.
 * @property {Array<GeoPackageTile>} tileProviders_ Proveedores de capas ráster.
 * @property {GeoPackage} gpkg_ GeoPackage.
 *
 * @api
 */
class GeoPackageConnector {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {File|Response|ArrayBuffer|Uint8Array|Object} data Fuente binaria o parámetros
   * con una única propiedad source o url.
   * @param {Object} options Opciones por tipo de capa.
   * - tile: Opciones especificadas para capas ráster.
   * - vector: Opciones especificadas para capas vectoriales.
   *
   * @api
   */
  constructor(data, { tile, vector } = {}) {
    /**
     * Opciones para capas ráster.
     * @private
     * @type {Object}
     */
    this.tileOpts_ = tile || {};

    /**
     * Opciones para capas vectoriales.
     * @private
     * @type {Object}
     */
    this.vectorOpts_ = vector || {};

    /**
      * Proveedores de capas vectoriales.
      * @private
      * @type {Array<GeoPackageVector>}
      */
    this.vectorProviders_ = [];

    /**
      * Proveedores de capas ráster.
      * @private
      * @type {Array<GeoPackageTile>}
      */
    this.tileProviders_ = [];

    /**
    * GeoPackage
    * @private
    * @type {GeoPackage}
    */
    this.gpkg_ = null;

    setSqljsWasmLocateFile((file) => `${IDEE.config.SQL_WASM_URL}${file}`);

    this.init(data);
  }

  /**
   * Este método carga el archivo GeoPackage, crea la base de datos
   * y genera los proveedores de capas vectoriales y de teselas.
   *
   * @function
   * @public
   * @param {ArrayBuffer} data Uint8Array que representa un archivo
   * de base de datos.
   * @returns {Promise<Object>} Proveedores del paquete o rechazo de la carga.
   * @api
   */
  init(data) {
    this.initPromise_ = this.readSource_(data).then(async (uint8Array) => {
      const SQL = await sqljs({
        locateFile: (file) => `${IDEE.config.SQL_WASM_URL}${file}`,
      });
      const db = new SQL.Database(uint8Array);
      try {
        const conn = await GeoPackageConnection.connectWithDatabase(db);
        this.gpkg_ = new GeoPackage('', '', conn);
        const { features, tiles } = this.gpkg_.getTables();
        this.tileProviders_ = tiles
          .map((name) => new GeoPackageTile(this.gpkg_, name, this.tileOpts_[name]));
        this.vectorProviders_ = features
          .map((name) => new GeoPackageVector(this.gpkg_, name, this.vectorOpts_[name]));
        return {
          tileProviders: this.tileProviders_,
          vectorProviders: this.vectorProviders_,
        };
      } catch (error) {
        db.close();
        this.gpkg_ = null;
        throw error;
      }
    });
    // La promesa original conserva el rechazo aunque el consumidor se suscriba más tarde.
    this.initPromise_.catch(() => undefined);
    return this.initPromise_;
  }

  /**
   * Lee una fuente binaria o descarga el fichero completo indicado por url.
   * No modifica la fuente ni interpreta respuestas binarias como texto.
   * @private
   * @param {File|Response|ArrayBuffer|Uint8Array|Object} data Fuente o parámetros.
   * @returns {Promise<Uint8Array>} Bytes del fichero GeoPackage.
   */
  async readSource_(data) {
    let source = data;
    if (data && Object.getPrototypeOf(data) === Object.prototype) {
      const hasSource = data.source !== undefined;
      const hasURL = data.url !== undefined;
      if (hasSource === hasURL) {
        Exception(getValue('exception').geopackage_source);
      }
      if (hasURL) {
        if (typeof data.url !== 'string' || data.url.trim().length === 0) {
          Exception(getValue('exception').geopackage_source);
        }
        source = await window.fetch(data.url);
      } else {
        source = data.source;
      }
    }
    if (source instanceof Response) {
      if (!source.ok) {
        Exception(`${getValue('exception').geopackage_response} (${source.status})`);
      }
      source = await source.arrayBuffer();
    } else if (source instanceof File) {
      source = await source.arrayBuffer();
    }
    if (!(source instanceof ArrayBuffer) && !(source instanceof Uint8Array)) {
      Exception(getValue('exception').geopackage_source);
    }
    if (source.byteLength === 0) {
      Exception(getValue('exception').geopackage_source);
    }
    return new Uint8Array(source);
  }

  /**
   * Este método obtiene los proveedores de capas vectoriales.
   *
   * @function
   * @public
   * @returns {Array<GeoPackageVector>} Proveedores de capas vectoriales.
   * @api
   */
  getVectorProviders() {
    return this.initPromise_.then(({ vectorProviders }) => vectorProviders);
  }

  /**
   * Este método obtiene los proveedores de capas ráster.
   *
   * @function
   * @public
   * @returns {Array<GeoPackageTile>} Proveedores de capas ráster.
   * @api
   */
  getTileProviders() {
    return this.initPromise_.then(({ tileProviders }) => tileProviders);
  }
}

export default GeoPackageConnector;
