/**
 * @module IDEE/impl/control/MeasureClear
*/
import FacadeMeasureArea from 'IDEE/control/MeasureArea';
import FacadeMeasureLength from 'IDEE/control/MeasureLength';
import Control from './Control';
// eslint-disable-next-line max-len
// eslint-disable-next-line no-unused-vars, import/no-named-as-default, import/no-named-as-default-member
import MeasureLength from './MeasureLength';
// eslint-disable-next-line no-unused-vars
import MeasureArea from './MeasureArea';

/**
 * @classdesc
 * Hereda de {@link module:IDEE/impl/control/Control|Control}.
 * Control para limpiar las mediciones realizadas. Elimina las geometrías dibujadas
 * y restablece los controles de medición a su estado inicial.
 *
 * @property {MeasureLength} [measureLengthControl_] Referencia al control de medición
 * de distancias.
 * @property {MeasureArea} [measureAreaControl_] Referencia al control de medición de áreas.
 * @property {IDEE.Map} [facadeMap_] Referencia al mapa para acceder a otros controles.
 * @api stable
 * @extends {module:IDEE/impl/control/Control}
 */
class MeasureClear extends Control {
  constructor(measureLengthControl, measureAreaControl) {
    super();

    /**
     * Implementation measureLength
     * @private
     * @type {MeasureLength}
     */
    this.measureLengthControl_ = measureLengthControl;

    /**
     * Facade of the map
     * @private
     * @type {IDEE.Map}
     */
    this.facadeMap_ = null;

    /**
     * Implementation measureArea
     * @private
     * @type {MeasureArea}
     */
    this.measureAreaControl_ = measureAreaControl;
  }

  /**
   * This function adds the control to the specified map
   *
   * @public
   * @function
   * @param {IDEE.Map} map - Map to add the plugin
   * @param {HTMLElement} element - Container MeasureClear
   * @api stable
   */
  addTo(map, element) {
    this.facadeMap_ = map;
    const button = element.querySelector('#measurebar-clear-btn');
    button.addEventListener('click', this.onClick.bind(this));
    this.element = element;
    map.getMapImpl().addControl(this);
  }

  /**
   * This function remove items drawn on the map
   *
   * @public
   * @function
   * @api stable
   */
  onClick() {
    this.measureLengthControl_.clear();
    this.measureAreaControl_.clear();
    this.deactivateOtherBtns();
  }

  /**
   * Deactivates length measure and area measure buttons.
   * @public
   * @function
   * @api
   */
  deactivateOtherBtns() {
    this.facadeMap_.getControls().forEach((control) => {
      if (control instanceof FacadeMeasureLength) { // measureLength
        control.deactivate();
      } else if (control instanceof FacadeMeasureArea) { // measureArea
        control.deactivate();
      }
    });
  }

  /**
   * This function destroys this control and cleaning the HTML
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.element.remove();
    this.facadeMap_.removeControls(this);
    this.facadeMap_ = null;
  }
}

export default MeasureClear;
