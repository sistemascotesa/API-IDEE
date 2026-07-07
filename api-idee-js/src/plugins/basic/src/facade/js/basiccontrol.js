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
  constructor(content) {
    // 1. Comprueba si la implementación puede crear el control
    if (IDEE.utils.isUndefined(BasicImplControl)
      || (IDEE.utils.isObject(BasicImplControl)
      && IDEE.utils.isNullOrEmpty(Object.keys(BasicImplControl)))) {
      IDEE.exception(getValue('exception.impl'));
    }
    // 2. Crea la implementación del control
    const impl = new BasicImplControl();
    super('Basic', impl);
    this.content = IDEE.utils.isString(content) ? content : undefined;
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
      const html = IDEE.template.compileSync(template, {});

      if (this.content) {
        const insertContent = (htmlContent) => {
          const iframe = document.createElement('iframe');
          iframe.classList.add('m-basic-iframe');
          iframe.srcdoc = htmlContent;
          html.appendChild(iframe);
        };

        if (IDEE.utils.isUrl(this.content)) {
          fetch(this.content)
            .then((response) => {
              if (!response.ok) throw new Error(response.statusText);
              return response.text();
            })
            .then(insertContent)
            .catch(() => IDEE.dialog.error(getValue('exception.invalidContent')));
        } else {
          insertContent(this.content);
        }
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
