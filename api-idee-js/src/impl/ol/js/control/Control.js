/**
 * @module IDEE/impl/Control
 */
import OLControl from 'ol/control/Control';
import ControlBase from '../../../common/control/ControlBase';

/**
 * @classdesc
 * Es la clase de la que heredan todos los controles de la implementación,
 * crea un controlNative "OLControl" por defecto.
 * @extends {ControlBase}
 * @api
 */
class Control extends ControlBase {
  buildControlNative(controlNative = new OLControl(this.vendorOptions_)) {
    this.controlNative = controlNative;
  }
}

export default Control;
