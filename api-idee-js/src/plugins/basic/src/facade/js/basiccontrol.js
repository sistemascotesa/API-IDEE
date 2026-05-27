/**
 * @module IDEE/control/BasicControl
 */

import BasicImplControl from 'impl/basiccontrol';
import template from 'templates/basic';
import { getValue } from './i18n/language';

export default class BasicControl extends IDEE.Control {
  /**
   * @classdesc
   * Constructor de la clase. Crea un control BasicControl
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api stable
   */
  constructor(pluginContent) {
    // 1. Comprueba si la implementación puede crear el control
    if (IDEE.utils.isUndefined(BasicImplControl)
      || (IDEE.utils.isObject(BasicImplControl)
      && IDEE.utils.isNullOrEmpty(Object.keys(BasicImplControl)))) {
      IDEE.exception(getValue('exception.impl'));
    }
    // 2. Crea la implementación del control
    const impl = new BasicImplControl();
    super('Basic', impl);
    this.pluginContent = pluginContent;
  }

  /**
   * Esta función crea la vista
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa al que se añade el control
   * @api stable
   */
  createView(map) {
    return new Promise((success, fail) => {
      const html = IDEE.template.compileSync(template, {
        vars: {
          text: getValue('text'),
        },
      });

      if (this.pluginContent?.html) {
        html.querySelector('.m-plugin-basic-default-content').style.display = 'none';
        html.querySelector('.m-plugin-basic-custom-content').innerHTML = this.pluginContent.html;
      }

      if (this.pluginContent?.css) {
        const style = document.createElement('style');
        style.textContent = this.pluginContent.css;
        document.head.appendChild(style);
      }

      if (this.pluginContent?.js) {
        // eslint-disable-next-line no-new-func
        setTimeout(() => new Function(this.pluginContent.js)(), 0);
      }

      success(html);
    });
  }

  /**
   * Esta función compara controles
   *
   * @public
   * @function
   * @param {IDEE.Control} control control para comparar
   * @api stable
   */
  equals(control) {
    return control instanceof BasicControl;
  }
}
