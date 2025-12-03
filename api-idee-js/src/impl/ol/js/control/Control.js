/**
 * @module IDEE/impl/Control
 */
import OLControl from 'ol/control/Control';
import ControlBase from '../../../common/control/ControlBase';

/**
 * @classdesc
 * Es la clase de la que heredan todos los controles de la implementación,
 * crea el "OLControl".
 * @api
 */
class Control extends ControlBase {
  /**
   * Este método construye el control de implementación
   * @param {IDEE.Map} map Mapa.
   * @param {HTML} view Plantilla del control.
   * @param {*} controlImpl
   */
  build(map, view) {
    this.facadeMap_ = map;
    this.control_ = new OLControl(this.vendorOptions_);
  }

  /**
   * Devuelve la vista de implementación
   *
   * @public
   * @function
   * @return {HTMLElement} vista de implementación
   * @api stable
   */
  getView() {
    const controlImpl = this.getControlImpl();
    return controlImpl.panel ?? controlImpl.element;
  }
}

export default Control;
