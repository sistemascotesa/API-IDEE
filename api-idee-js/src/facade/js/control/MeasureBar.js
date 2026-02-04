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
import { encodeBase64 } from '../util/Utils';

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
     * Facade of the map
     * @private
     * @type {IDEE.Map}
     */
    this.map_ = null;

    /**
     * Array of controls
     *
     * @private
     * @type {Array<Control>}
     */
    this.controls_ = [];

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
    this.measureLength_ = null;

    /**
     * Control MeasureArea
     * @private
     * @type {IDEE.control.MeasureArea}
     */
    this.measureArea_ = null;

    /**
     * Control MeasureClear
     * @private
     * @type {IDEE.control.MeasureClear}
     */
    this.measureClear_ = null;

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
    this.collapsed_ = options.collapsed;
    if (this.collapsed_ === undefined) this.collapsed_ = true;

    /**
     * Option to allow the control to be collapsible or not
     * @private
     * @type {Boolean}
     */
    this.collapsible_ = options.collapsible;
    if (this.collapsible_ === undefined) this.collapsible_ = true;

    /**
     * Control tooltip
     *
     * @private
     * @type {string}
     */
    this.tooltip_ = options.tooltip ?? Measure.translation.text.tooltip;

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
    this.map_ = map;
    this.measureLength_ = new MeasureLength({ order: this.order });
    this.measureArea_ = new MeasureArea({ order: this.order });
    this.measureClear_ = new MeasureClear(
      this.measureLength_,
      this.measureArea_,
      { order: this.order },
    );
    [this.measureLength_, this.measureArea_, this.measureClear_].forEach((control) => {
      // eslint-disable-next-line no-param-reassign
      control.facadeMap = this.map_;
    });
    this.controls_.push(this.measureLength_, this.measureArea_, this.measureClear_);
    this.panel_.addControls(this.controls_);
  }

  /**
   * Get the API REST Parameters of the control
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name}=${this.position_}*${this.collapsed_}*${this.collapsible_}*${this.tooltip_}`;
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
    this.map_.removeControls([this.measureLength_, this.measureArea_, this.measureClear_, this]);
    this.map_ = null;
    this.measureLength_ = null;
    this.measureArea_ = null;
    this.measureClear_ = null;
  }

  /**
   * This function return the control of control
   *
   * @public
   * @function
   * @api stable
   */
  getControls() {
    const aControls = [];
    aControls.push(this.measureArea_, this.measureClear_, this.measureLength_);
    return aControls;
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
