/**
 * @module IDEE/layer/KMZ
 */
import KMZImpl from 'impl/layer/KMZ';
import KML from './KML';
import * as LayerType from './Type';

/**
 * KML comprimido con recursos internos. Conserva las opciones de KML.
 * @extends {IDEE.layer.KML}
 * @api
 */
class KMZ extends KML {
  /**
   * Serializa la capa con los parámetros nombrados de API-REST.
   * @returns {String} Cadena de carga REST.
   * @api
   */
  getRestLayer() {
    return super.getRestLayer();
  }

  /**
   * @param {string|Object} userParameters URL, nombre y opciones de la capa KMZ.
   * @param {Object} options Opciones de KML, incluidos estilos, etiquetas y carpetas.
   * @param {Object} vendorOptions Opciones del motor.
   * @api
   */
  constructor(userParameters = {}, options = {}, vendorOptions = {}) {
    super(userParameters, options, vendorOptions, KMZImpl, LayerType.KMZ);
  }
}

export default KMZ;
