/**
* @module IDEE/impl/control/ScaleLine
*/

import Control from './Control';
import ScaleLineNative from './native/ScaleLineNative';

/**
 * @classdesc
 * Añadir escala gráfica.
 * @api
 */
class ScaleLine extends Control {
  /** Overrides original getView to get native ol view */
  getView() {
    return this.controlNative.element;
  }

  buildControlNative(controlNative) {
    this.controlNative = new ScaleLineNative(this.vendorOptions_);
  }
}

export default ScaleLine;
