/**
 * @module IDEE/impl/control/Rotate
 */
import Control from './Control';
import RotateNative from './native/RotateNative';

/**
 * @classdesc
 * Agrega la funcionalidad para rotar el mapa para que el norte esté arriba.
 *
 * @param {Object} vendorOptions Opciones para la biblioteca base.
 * - element. Contenedor del control.
 * - target. Elemento donde se va a añadir el control.
 * - render. Función que devuelve el HTML del control.
 * @api
 */
class Rotate extends Control {
  /** Overrides original getView to get native ol view */
  getView() {
    return this.controlNative.panel;
  }

  buildControlNative(controlNative) {
    this.controlNative = new RotateNative(this.vendorOptions_);
    this.controlNative.build(this.facadeMap, this.view_);
  }
}

export default Rotate;
