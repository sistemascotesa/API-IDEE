/**
 * @module IDEE/impl/control/Timeline
 */
import Control from './Control';

/**
 * @classdesc
 * Hereda de {@link module:IDEE/impl/control/Control|Control}.
 * Control de línea de tiempo que permite visualizar y controlar datos temporales en el mapa.
 * Proporciona una interfaz para reproducir animaciones y navegar por diferentes momentos
 * en el tiempo.
 *
 * @api
 * @extends {module:IDEE/impl/control/Control}
 */
class Timeline extends Control {
  /**
   * This function adds the control to the specified map
   *
   * @public
   * @function
   * @param {IDEE.Map} map to add
   * @param {HTMLElement} template of the control
   * @api stable
   */
  addTo(map, template) {
    super.addTo(map, template);
  }
}

export default Timeline;
