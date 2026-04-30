/**
 * @module IDEE/control/MouseSRSControl
 */

import MouseSRSImplControl from 'impl/mousesrscontrol';
import template from '../../templates/mousesrs';
import { getValue } from './i18n/language';

class MouseSRSControl extends IDEE.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api
   */

  constructor(options = {}) {
    if (IDEE.utils.isUndefined(MouseSRSImplControl)
      || (IDEE.utils.isObject(MouseSRSImplControl)
      && IDEE.utils.isNullOrEmpty(Object.keys(MouseSRSImplControl)))) {
      IDEE.exception(getValue('exception.impl'));
    }

    const impl = new MouseSRSImplControl(options);
    super('MouseSRS', impl, {
      tooltip: options.tooltip,
      position: options.position,
      order: options.order,
    });
  }

  /**
   * This function creates the view
   *
   * @public
   * @function
   * @param {IDEE.Map} map to add the control
   * @api
   */
  createView(map) {
    return new Promise((success, fail) => {
      const html = IDEE.template.compileSync(template, {
        vars: {
          translations: {
            tooltip: this.tooltip,
          },
          order: this.order,
        },
      });
      html.style.setProperty('order', this.order, 'important');
      success(html);
    });
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {IDEE.Control} control to compare
   * @api
   */
  equals(control) {
    return control instanceof MouseSRSControl;
  }

  destroy() {
    this.getImpl().destroy();
  }
}

/**
   * Nombre para identificar este control.
   * @const
   * @type {string}
   * @public
   * @api
   */
MouseSRSControl.NAME = 'mousesrs';

export default MouseSRSControl;
