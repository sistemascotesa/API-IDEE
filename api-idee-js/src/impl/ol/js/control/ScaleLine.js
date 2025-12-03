/**
* @module IDEE/impl/control/ScaleLine
*/

import Control from './Control';
import ScaleLineNative, { UNITS_PROP } from './control-native/ScaleLineNative';

/**
 * @classdesc
 * Añadir escala gráfica.
 * @api
 */
class ScaleLine extends Control {
  build() {
    this.control_ = new ScaleLineNative(this.vendorOptions_);
  }

  addTo(map, view) {
    this.control_.removeChangeListener(UNITS_PROP, this.handleUnitsChanged);
    this.control_.keyEvent = this.control_.addChangeListener(UNITS_PROP, this.handleUnitsChanged);
    super.addTo(map, view);
  }
}

export default ScaleLine;
