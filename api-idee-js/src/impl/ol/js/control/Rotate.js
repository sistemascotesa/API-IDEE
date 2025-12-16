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
  buildControlNative(controlNative) {
    this.controlNative = new RotateNative(this.vendorOptions_);
    this.controlNative.init(this.facadeMap, this.element);
    this.setElement(this.controlNative.panel);
  }
}

export default Rotate;
