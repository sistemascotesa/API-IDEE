import MeasureLengthImpl from 'impl/control/MeasureLength';
import measureLengtTemplate from 'templates/measurelength';
import Measure from './Measure';
import { isNullOrEmpty, isObject, isUndefined } from '../util/Utils';
import exception from '../exception/exception';
import { getValue } from '../i18n/language';

/**
 * @classdesc
 * Main constructor of the class. Creates a MeasureLength
 * control to provides measure distances
 *
 * @constructor
 * @extends {IDEE.control.Measure}
 * @api stable
 */

export default class MeasureLength extends Measure {
  constructor(options) {
    // checks if the implementation can create WMC layers
    if (isUndefined(MeasureLengthImpl) || (isObject(MeasureLengthImpl)
      && isNullOrEmpty(Object.keys(MeasureLengthImpl)))) {
      exception(getValue('exception').impl_length);
    }

    // implementation of this control
    const impl = new MeasureLengthImpl();

    // calls the super constructor
    super(impl, measureLengtTemplate, MeasureLength.NAME, options);
  }

  /**
   * This function checks if an object is equals
   * to this control
   *
   * @public
   * @function
   * @param {*} obj - Object to compare
   * @returns {boolean} equals - Returns if they are equal or not
   * @api stable
   */
  equals(obj) {
    let equals = false;
    if (obj instanceof MeasureLength) {
      equals = (this.name === obj.name);
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
MeasureLength.NAME = 'measurelength';

/**
 * Template for this controls
 * @const
 * @type {string}
 * @public
 * @api stable
 */
MeasureLength.TEMPLATE = 'measurelength.html';

/**
 * Help message
 * @const
 * @type {string}
 * @public
 * @api stable
 */
export const HELP_KEEP_MESSAGE = Measure.translation.text.keep_drawing;
