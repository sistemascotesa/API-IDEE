/**
 * @module IDEE/control/MeasureBar
 */
import myhelp from 'templates/measurehelp';
import Control from './Control';
import Measure from './Measure';
import MeasureLength from './MeasureLength';
import MeasureArea from './MeasureArea';
import MeasureClear from './MeasureClear';
import * as Position from '../ui/position';
import 'assets/css/controls/measurebar';

import { compileSync } from '../util/Template';
import { encodeBase64, isBoolean } from '../util/Utils';

/**
 * @classdesc
 * Control that uses measure controls
 *
 * @api
 * @extends {IDEE.Control}
 */
class MeasureBar extends Control {
  /**
   * @classdesc
   * Main facade control object. This class creates a control
   * object which has an implementation Object
   *
   * @constructor
   * @extends {Control}
   * @api stable
   */
  constructor(options = {}) {
    super(MeasureBar.NAME, undefined, options);

    /**
     * Array of controls
     *
     * @private
     * @type {Array<Control>}
     */
    this.controls = [];

    /**
     * position of control on map, default left
     * @type {Position}
     */
    this.position = Position.isValid(options.position) ? options.position : Position.LEFT;

    /**
     * Control MeasureLength
     * @private
     * @type {IDEE.control.MeasureLength}
     */
    this.measureLength = null;

    /**
     * Control MeasureArea
     * @private
     * @type {IDEE.control.MeasureArea}
     */
    this.measureArea = null;

    /**
     * Control MeasureClear
     * @private
     * @type {IDEE.control.MeasureClear}
     */
    this.measureClear = null;

    /**
     *@private
     *@type { Number }
     */
    this.order = options.order >= -1 ? options.order : null;

    /**
     * Option to allow the control to be collapsed or not
     * @private
     * @type {Boolean}
     */
    this.collapsed = isBoolean(options.collapsed) ? options.collapsed : true;

    /**
     * Option to allow the control to be collapsible or not
     * @private
     * @type {Boolean}
    */
    this.collapsible = isBoolean(options.collapsible) ? options.collapsible : true;

    /**
     * Control tooltip
     *
     * @private
     * @type {string}
     */
    this.tooltip = options.tooltip ?? Measure.translation.text.tooltip;

    /**
     * Control parameters
     * @public
     * @type {object}
     */
    this.options = options;
  }

  /**
   * @inheritdoc
   * @public
   * @function
   * @param {IDEE.Map} map - Map to add the control
   * @api stable
   */
  addTo(map) {
    this.map = map;
    this.measureLength = new MeasureLength();
    this.measureArea = new MeasureArea();
    this.measureClear = new MeasureClear(
      this.measureLength,
      this.measureArea,
    );
    [this.measureLength, this.measureArea, this.measureClear].forEach((control) => {
      // eslint-disable-next-line no-param-reassign
      control.facadeMap = this.map;
    });
    this.controls.push(this.measureLength, this.measureArea, this.measureClear);
    this.panel_.addControls(this.controls);
  }

  /**
   * Get the API REST Parameters of the control
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name}=${this.position_}*${this.collapsed}*${this.collapsible}*${this.tooltip}`;
  }

  /**
   * Gets the API REST Parameters in base64 of the control
   *
   * @function
   * @public
   * @api
   */
  getAPIRestBase64() {
    return `${this.name}=base64=${encodeBase64(this.options)}`;
  }

  /**
   * This function destroys this control
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.map.removeControls(this.getControls());
    this.map = null;
    this.panel_ = null;
    this.measureLength = null;
    this.measureArea = null;
    this.measureClear = null;
  }

  /**
   * This function return the control of control
   *
   * @public
   * @function
   * @api stable
   */
  getControls() {
    return [this.measureArea, this.measureClear, this.measureLength];
  }

  /**
   * This function compare if control recieved by param is instance of IDEE.control.MeasureBar
   *
   * @public
   * @function
   * @param {Control} control to comapre
   * @api stable
   */
  equals(control) {
    return control instanceof MeasureBar;
  }

  /**
   * Obtiene la ayuda del control
   *
   * @function
   * @public
   * @api
   */
  getHelp() {
    return {
      title: this.name,
      content: new Promise((success) => {
        const html = compileSync(myhelp, {
          vars: {
            urlImages: `${IDEE.config.STATIC_RESOURCES_URL}facade/assets/images/help/${MeasureBar.NAME}`,
            translations: {
              help1: Measure.translation.textHelp.help1,
              help2: Measure.translation.textHelp.help2,
              help3: Measure.translation.textHelp.help3,
              help4: Measure.translation.textHelp.help4,
              help5: Measure.translation.textHelp.help5,
              help6: Measure.translation.textHelp.help6,
              help7: Measure.translation.textHelp.help7,
              help8: Measure.translation.textHelp.help8,
              help9: Measure.translation.textHelp.help9,
              help10: Measure.translation.textHelp.help10,
              help11: Measure.translation.textHelp.help11,
              help12: Measure.translation.textHelp.help12,
              help13: Measure.translation.textHelp.help13,
              help14: Measure.translation.textHelp.help14,
              help15: Measure.translation.textHelp.help15,
            },
          },
        });
        success(html);
      }),
    };
  }
}

/**
 * Name for this control
 * @const
 * @type {string}
 * @public
 * @api stable
 */
MeasureBar.NAME = 'measurebar';

export default MeasureBar;
