/**
 * @module IDEE/control/MeasureClear
 */
import MeasureClearImpl from 'impl/control/MeasureClear';
import measureClearTemplate from 'templates/measureclear';
import Control from './Control';
import { isNullOrEmpty, isObject, isUndefined } from '../util/Utils';
import exception from '../exception/exception';
import { compileSync } from '../util/Template';
import { getValue } from '../i18n/language';
import Measure from './Measure';

/**
 * @classdesc
 * Main constructor of the class. Creates a MeasureClear
 * control to provides clean items drawn on the map
 *
 * @constructor
 * @param {IDEE.control.MeasureLength} measureLengthControl - Control measure distances
 * @param {IDEE.control.MeasureArea} measureAreaControl - Control measure areas
 * @extends {IDEE.Control}
 * @api stable
 */
export default class MeasureClear extends Control {
  constructor(measureLengthControl, measureAreaControl, options) {
    // checks if the implementation can create MeasureClear
    if (isUndefined(MeasureClearImpl) || (isObject(MeasureClearImpl)
      && isNullOrEmpty(Object.keys(MeasureClearImpl)))) {
      exception(getValue('exception').impl_clear);
    }

    // implementation of this control
    const impl = new MeasureClearImpl(measureLengthControl.getImpl(), measureAreaControl.getImpl());

    // calls the super constructor
    super(MeasureClear.NAME, impl, options);
  }

  /**
   * This function creates the view to the specified map
   *
   * @public
   * @function
   * @param {IDEE.Map} map - Map to add the control
   * @returns {HTMLElement} HTML template
   * @api stable
   */
  createView(map) {
    return compileSync(measureClearTemplate, {
      jsonp: true,
      vars: {
        translations: Measure.translation.text,
        order: this.order,
      },
    });
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
    if (obj instanceof MeasureClear) {
      equals = (this.name === obj.name);
    }
    return equals;
  }

  /**
   * This function destroys this control
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.getImpl().destroy();
    this.impl = null;
  }
}

/**
 * Name to identify this control
 * @const
 * @type {string}
 * @public
 * @api stable
 */
MeasureClear.NAME = 'measurebar';

/**
 * Template for this controls
 * @const
 * @type {string}
 * @public
 * @api stable
 */
MeasureClear.TEMPLATE = 'measureclear.html';
