/**
 * @module IDEE/control/Measure
 */
import { getValue } from '../i18n/language';
import { compileSync } from '../util/Template';
import Control from './Control';

export default class Measure extends Control {
  static get translation() {
    return getValue(Measure.NAME);
  }

  /**
   * @classdesc
   * Main constructor of the class. Creates a Measure
   * control to provides measure tools
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api stable
   */
  constructor(impl, template, name, options) {
    super(name, impl, options);
    /**
     * Template of the control
     * @private
     * @type {string}
     */
    this.template_ = template;
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
    this.element = compileSync(this.template_, {
      jsonp: true,
      vars: {
        translations: Measure.translation.text,
        order: this.order,
      },
    });
    return this.element;
  }

  /**
   * This function returns the HTML control button
   *
   * @public
   * @function
   * @param {HTMLElement} html to add the control
   * @api stable
   * @export
   */
  getActivationButton(element) {
    return element.querySelector('button'); // button#m-measure-button
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
    if (obj instanceof Measure) {
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
    super.destroy();
    this.template_ = null;
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
Measure.NAME = 'measure';

/**
 * Template for this controls
 * @const
 * @type {string}
 * @public
 * @api stable
 */
Measure.POINTER_TOOLTIP_TEMPLATE = 'measure_pointer_tooltip.html';

/**
 * Template for this controls
 * @const
 * @type {string}
 * @public
 * @api stable
 */
Measure.MEASURE_TOOLTIP_TEMPLATE = 'measure_tooltip.html';

/**
 * Help message
 * @const
 * @type {string}
 * @public
 * @api stable
 */
Measure.HELP_MESSAGE = Measure.translation.text.click_draw;
