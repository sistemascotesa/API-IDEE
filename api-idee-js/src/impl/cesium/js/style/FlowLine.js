/**
 * @module IDEE/impl/style/FlowLine
 */
import { getValue } from 'IDEE/i18n/language';
import Generic from './Generic';
import { createOnceWarner, flowLineAsLines } from '../../../common/scene/degradedStyles';

// eslint-disable-next-line no-console
const warnOnce = createOnceWarner((message) => console.warn(message));

/**
 * @classdesc
 * Línea de flujo en Cesium, simplificada: cada línea se dibuja con el color inicial y
 * el ancho medio del flujo, sin degradado ni flechas.
 *
 * @api
 * @extends {IDEE.impl.style.Generic}
 */
class FlowLine extends Generic {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Object} options Opciones de la línea de flujo.
   * @api
   */
  constructor(options = {}) {
    super(options);
    warnOnce('flowline', getValue('exception').flowline_degraded);
  }

  /**
   * Este método traduce las opciones de la línea de flujo a las de un estilo genérico.
   *
   * @public
   * @function
   * @param {Object} options Opciones de la línea de flujo.
   * @api
   */
  updateFacadeOptions(options = {}) {
    super.updateFacadeOptions(flowLineAsLines(options));
  }
}

export default FlowLine;
