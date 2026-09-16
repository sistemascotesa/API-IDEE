/**
 * @module IDEE/layer/GeoPackage
 */
import GeoPackageProvider from '../connector/GeoPackageConnector';
import MObject from '../Object';
import * as LayerType from './Type';
import GeoPackageTile from './GeoPackageTile';
import GeoJSON from './GeoJSON';
import { generateRandom } from '../util/Utils';
import * as EventType from '../event/eventtype';
import * as Dialog from '../dialog';

/**
 * @classdesc
 *
 * El formato Geopackage permite agrupar múltiples capas, tanto vectoriales como raster,
 * en un contenedor SQLite.
 *
 * @property {String} idLayer Identificador de la capa.
 * @property {IDEE.layer.GeoPackageTile|IDEE.layer.GeoJSON} layers_ Capas de GeoPackage.
 * @property {IDEE.GeoPackageConnector} connector_ Conector.
 * @property {Object} options Opciones de la capa.
 * @property {Boolean} loadedVectorLayers_ Determina si las capas vectoriales están cargadas.
 * @property {Boolean} loadedTileLayers_ Determina si las capas teseladas están cargadas.
 *
 * @api
 * @extends {IDEE.Object}
 */
class GeoPackage extends MObject {
  /**
   * Constructor principal de la clase. Crea una capa GeoPackage
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @param {Response|File|ArrayBuffer|Uint8Array|Object} data Fichero GeoPackage o parámetros.
   * - source: Fuente binaria. No se puede combinar con url.
   * - url: URL del fichero completo, descargado y procesado en el navegador.
   * - name: Nombre del paquete.
   * - legend: Leyenda del paquete.
   * La forma histórica con el fichero como primer argumento sigue siendo válida.
   * @param {Object} options Parámetros opcionales proporcionados por el usuario
   * para las capas vectoriales o ráster contenidas en el GeoPackage.
   * En la nueva firma contiene opciones comunes (style, opacity, visibility, etc.) y
   * tables, cuyas claves son los nombres de tabla y cuyos valores sobrescriben las comunes.
   * tile y vector mantienen las opciones de los proveedores, indexadas por tabla.
   * No se modifican los objetos del llamador. Las instancias de estilo se conservan.
   * La firma histórica mantiene las opciones de tabla directamente en el segundo argumento:
   * <pre><code>
   * {
   *  id_capa_vectorial_en_geopackage: {
   *    extent,
   *    name,
   *    legend,
   *  },
   *  id_capa_raster_en_geopackage: {
   *    transparent,
   *    extent,
   *    name,
   *    legend,
   *  }
   * }
   * </code></pre>
   * @extends {IDEE.Object}
   * @api
   */
  constructor(data, options = {}) {
    super({});
    this.constructorParameters = { data, options };

    /**
     * Distingue los parámetros normalizados de la firma histórica con datos binarios.
     * @private
     * @type {Boolean}
     */
    this.legacyParameters_ = !data || Object.getPrototypeOf(data) !== Object.prototype;
    const parameters = this.legacyParameters_ ? { source: data } : { ...data };

    /**
     * Id de la capa.
     */
    this.idLayer = generateRandom(LayerType.GeoPackage, parameters.name || options.name).replace(/[^a-zA-Z0-9\-_]/g, '');

    /** Nombre, leyenda y origen del paquete, independientes de sus tablas. */
    this.name = parameters.name || options.name || this.idLayer;
    this.legend = parameters.legend === undefined ? this.name : parameters.legend;
    this.source = parameters.source;
    this.url = parameters.url;

    /**
     * Capas
     */
    this.layers_ = Object.create(null);

    /** Opciones propias del paquete, sin compartir objetos de configuración mutables. */
    this.options = this.copyOptions_(options);
    const {
      tables = {}, tile, vector, ...commonOptions
    } = this.options;
    this.tableOptions_ = this.legacyParameters_ ? this.options : tables;
    this.commonOptions_ = this.legacyParameters_ ? {} : commonOptions;

    /**
     * Conector
     */
    this.connector_ = new GeoPackageProvider(parameters, { tile, vector });

    /**
     * Determina si las capas vectoriales están cargadas.
     */
    this.loadedVectorLayers_ = false;

    /**
     * Determina si las capas teseladas están cargadas.
     */
    this.loadedTileLayers_ = false;
  }

  /**
   * Este método devuelve el identificador de la capa.
   *
   * @function
   * @returns {String} Devuelve el identificador de la capa.
   * @api
   */
  getId() {
    return this.idLayer;
  }

  /**
   * Devuelve el tipo de layer.
   *
   * @function
   * @getter
   * @returns {String} Tipo.
   * @api
   */
  get type() {
    return LayerType.GeoPackage;
  }

  /**
   * Copia registros y arrays de configuración, conservando instancias de estilos y fuentes.
   * @private
   * @param {*} value Valor de configuración.
   * @returns {*} Copia del valor o la instancia original si no es un registro/array.
   */
  copyOptions_(value) {
    if (Array.isArray(value)) {
      return value.map((item) => this.copyOptions_(item));
    }
    if (value && (Object.getPrototypeOf(value) === Object.prototype
      || Object.getPrototypeOf(value) === null)) {
      return Object.fromEntries(Object.entries(value)
        .map(([key, item]) => [key, this.copyOptions_(item)]));
    }
    return value;
  }

  /**
   * Combina opciones comunes y específicas sin modificar ninguna de las dos.
   * @private
   * @param {String} tableName Nombre original de la tabla.
   * @param {Boolean} raster Indica si se trata de una tabla de teselas.
   * @returns {Object} Opciones independientes para la capa hija.
   */
  getTableOptions_(tableName, raster = false) {
    const options = this.copyOptions_({
      ...this.commonOptions_,
      ...(Object.prototype.hasOwnProperty.call(this.tableOptions_, tableName)
        ? this.tableOptions_[tableName] : {}),
    });
    if (options.name === undefined) {
      options.name = this.legacyParameters_ ? tableName : `${this.name}:${tableName}`;
    }
    if (options.legend === undefined && (raster || !this.legacyParameters_)) {
      options.legend = tableName;
    }
    return options;
  }

  /**
   * Este método agrega la capa al mapa.
   *
   * @function
   * @param {M/Map} map
   * @returns {Promise} Finalización de la creación y adición de las capas.
   * @api
   */
  addTo(map, addLayer = true) {
    this.map_ = map;
    const vectorLayers = this.connector_.getVectorProviders().then((vectorProviders) => {
      vectorProviders.forEach((vectorProvider) => {
        const geojson = vectorProvider.getGeoJSON();
        const tableName = vectorProvider.getTableName();
        const optsExt = this.getTableOptions_(tableName);
        const vectorLayer = new GeoJSON({
          ...optsExt,
          source: geojson,
        }, this.copyOptions_(optsExt));

        this.layers_[tableName] = vectorLayer;
        if (addLayer) {
          map.addLayers(vectorLayer);
        }
      });

      this.loadedVectorLayers_ = true;
      if (this.loadedTileLayers_) {
        this.fire(EventType.LOAD_LAYERS, [this.layers_]);
      }
    });

    const tileLayers = this.connector_.getTileProviders().then((tileProviders) => {
      tileProviders.forEach((tileProvider) => {
        const tableName = tileProvider.getTableName();
        const optsExt = this.getTableOptions_(tableName, true);
        const tileLayer = new GeoPackageTile(optsExt, tileProvider);

        this.layers_[tableName] = tileLayer;
        if (addLayer) {
          map.addLayers(tileLayer);
        }
      });
      this.loadedTileLayers_ = true;

      if (this.loadedVectorLayers_) {
        this.fire(EventType.LOAD_LAYERS, [this.layers_]);
      }
    });

    this.fire(EventType.ADDED_TO_MAP);
    const loading = Promise.all([vectorLayers, tileLayers]);
    loading.catch((error) => Dialog.error(String(error)));
    return loading;
  }

  /**
   * Este método obtiene las capas de GeoPackage.
   *
   * @function
   * @public
   * @return {Array<IDEE.layer.GeoPackageTile|IDEE.layer.GeoJSON>} Devuelve las capas añadidas
   * al GeoPackage.
   * @api
   */
  getLayers() {
    return Object.values(this.layers_);
  }

  /**
   * Este método obtiene la capa de GeoPackage por el nombre de la tabla.
   *
   * @function
   * @public
   * @param {string} tableName Nombre de la tabla.
   * @return {Null|M.layer.GeoPackageTile|M.layer.GeoJSON} Devuelve la capa de GeoPackage
   * con ese nombre de tabla, en caso contrario devuelve null.
   * @api
   */
  getLayer(tableName) {
    return this.layers_[tableName] || null;
  }

  /**
   * Este método elimina todas las capas de GeoPackage.
   *
   * @function
   * @public
   * @api
   */
  removeLayers() {
    this.map_.removeLayers(this.getLayers());
  }

  /**
   * Este método elimina la capa con el nombre de la tabla proporcionado por el usuario.
   *
   * @function
   * @public
   * @param {string} tableName Nombre de la tabla.
   * @api
   */
  removeLayer(tableName) {
    this.map_.removeLayers(this.getLayer(tableName));
  }

  /**
   * Este método comprueba si un objeto es igual
   * a esta capa.
   *
   * @function
   * @param {Object} obj Objeto a comparar.
   * @returns {Boolean} Valor verdadero es igual, falso no lo es.
   * @public
   * @api
   */
  equals(obj) {
    let equals = false;

    if (obj instanceof GeoPackage) {
      equals = this.idLayer === obj.idLayer;
    }

    return equals;
  }
}

export default GeoPackage;
