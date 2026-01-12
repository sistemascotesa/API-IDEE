/**
 * @module IDEE/impl/control/TimeLine
 */
import Control from './Control';

/**
 * @classdesc
 * Añadir un control de linea de tiempo
 * @api
 */
class TimeLine extends Control {
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

export default TimeLine;
