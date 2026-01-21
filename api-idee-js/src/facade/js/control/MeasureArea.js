import MeasureAreaImpl from 'impl/control/MeasureArea';
import measureAreaTemplate from 'templates/measurearea';
import Measure from './Measure';
import { getValue } from '../i18n/language';
import { isNullOrEmpty, isObject, isUndefined } from '../util/Utils';
import exception from '../exception/exception';

/**
 * @classdesc
 * Control de medida de una area
 *
 * @api
 * @extends {IDEE.Control}
 */
export default class MeasureArea extends Measure {
  constructor(options) {
    // checks if the implementation can create WMC layers
    if (isUndefined(MeasureAreaImpl) || (isObject(MeasureAreaImpl)
      && isNullOrEmpty(Object.keys(MeasureAreaImpl)))) {
      exception(getValue('exception').impl_area);
    }
    // implementation of this control
    const impl = new MeasureAreaImpl();
    super(impl, measureAreaTemplate, MeasureArea.NAME, options);
  }

  /**
   * This function checks if an object is equals
   * to this control
   *
   * @public
   * @function
   * @param {*} control - Object to compare
   * @returns {boolean} equals - Returns if they are equal or not
   * @api stable
   */
  equals(control) {
    let equals = false;
    if (control instanceof MeasureArea) {
      equals = (this.name === control.name);
    }
    return equals;
  }
}

/**
 * Name for this controls
 * @const
 * @type {string}
 * @public
 * @api stable
 */
MeasureArea.NAME = 'measurearea';

/**
 * Template for this controls
 * @const
 * @type {string}
 * @public
 * @api stable
 */

MeasureArea.TEMPLATE = 'measurearea.html';

/**
 * Help message
 * @const
 * @type {string}
 * @public
 * @api stable
 */
export const HELP_KEEP_MESSAGE = Measure.translation.text.keep_drawing_area;
