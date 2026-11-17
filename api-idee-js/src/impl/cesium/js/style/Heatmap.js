/**
 * @module IDEE/impl/style/Heatmap
 */
import { getValue } from 'IDEE/i18n/language';
import Generic from './Generic';
import {
  createOnceWarner,
  heatmapAsPoints,
  weightRange,
} from '../../../common/scene/degradedStyles';

// eslint-disable-next-line no-console
const warnOnce = createOnceWarner((message) => console.warn(message));

/**
 * @classdesc
 * Mapa de calor en Cesium, simplificado: cada objeto geográfico se dibuja como un
 * punto con el color del degradado y la opacidad que corresponden a su peso.
 *
 * @api
 * @extends {IDEE.impl.style.Generic}
 */
class Heatmap extends Generic {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {string|function} attribute Atributo o función de peso.
   * @param {Object} options Opciones del estilo (gradient, radius, blur).
   * @param {Object} vendorOptions Opciones de la librería base (opacity).
   * @api
   */
  constructor(attribute, options = {}, vendorOptions = {}) {
    super({});
    this.attribute_ = attribute;
    this.minWeight_ = undefined;
    this.maxWeight_ = undefined;
    this.setOptions(options, vendorOptions);
    warnOnce('heatmap', getValue('exception').heatmap_degraded);
  }

  /**
   * Este método modifica las opciones del estilo.
   *
   * @public
   * @function
   * @param {Object} options Opciones del estilo.
   * @param {Object} vendorOptions Opciones de la librería base.
   * @api
   */
  setOptions(options = {}, vendorOptions = {}) {
    this.heatmapOptions_ = { ...options, ...vendorOptions };
    if (options.weight !== undefined) this.attribute_ = options.weight;
  }

  /**
   * Este método aplica el estilo a la capa: calcula el rango de pesos y dibuja los
   * objetos geográficos como puntos.
   *
   * @public
   * @function
   * @param {IDEE.layer.Vector} layer Capa.
   * @api
   */
  applyToLayer(layer) {
    const attribute = typeof this.attribute_ === 'function' ? undefined : this.attribute_ || 'weight';
    const range = attribute ? weightRange(layer?.getFeatures?.(), attribute) : {};
    this.minWeight_ = range.min;
    this.maxWeight_ = range.max;
    const { gradient, radius, opacity } = this.heatmapOptions_;
    this.options_ = heatmapAsPoints({
      attribute: this.attribute_,
      gradient,
      radius,
      opacity: Number.isFinite(Number(opacity)) ? Number(opacity) : 1,
      maxWeight: this.maxWeight_,
    });
    this.updateFacadeOptions(this.options_);
    super.applyToLayer(layer);
  }

  /**
   * Este método devuelve el peso mínimo de la capa.
   *
   * @public
   * @function
   * @returns {number} Peso mínimo.
   * @api
   */
  getMinWeight() {
    return this.minWeight_;
  }

  /**
   * Este método devuelve el peso máximo de la capa.
   *
   * @public
   * @function
   * @returns {number} Peso máximo.
   * @api
   */
  getMaxWeight() {
    return this.maxWeight_;
  }
}

export default Heatmap;
