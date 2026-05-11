/* eslint-disable no-console */
/**
 * @module M/control/MapfooterControl
 */

import MapfooterImplControl from 'impl/mapfootercontrol';
import template from 'templates/mapfooter';
import { getValue } from './i18n/language';

export default class MapfooterControl extends IDEE.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api stable
   */
  constructor(config) {
    // 1. checks if the implementation can create PluginControl
    if (IDEE.utils.isUndefined(MapfooterImplControl)) {
      IDEE.exception(getValue('exception.impl'));
    }
    // 2. implementation of this control
    const impl = new MapfooterImplControl();
    super(impl, 'Mapfooter');
    this.config = config;
    this.htmlCode = this.config.htmlCode;
    this.cssList = (IDEE.utils.isArray(this.config.cssList) ? this.config.cssList : this.config.cssList.split(',')).map((s) => s.trim());
    this.injectCSS(this.cssList);
    this.panelHeight = null;
    this.opened = this.config.open === true;
    this.templateVars = { vars: { htmlCode: this.htmlCode } };
    this.setBottomMargin(this.opened);
  }

  /**
   * This function creates the view
   *
   * @public
   * @function
   * @param {IDEE.Map} map to add the control
   * @api stable
   */
  createView(map) {
    return new Promise((success, fail) => {
      const html = IDEE.template.compileSync(template, this.templateVars);
      this.html_ = html;
      // Añadir código dependiente del DOM
      this.addEvents(html);
      success(html);
    });
  }

  addEvents(html) {
    setTimeout(() => {
      if (this.opened) {
        this.checkFooterheight(html);
      } else {
        this.setBottomMargin(false);
      }

      // Selector del botón del panel mapfooter
      const panelMapfooter = document.querySelector('div.m-panel.m-mapfooter');
      const btnMapFooter = panelMapfooter ? panelMapfooter.querySelector('button.m-panel-btn') : null;

      if (btnMapFooter) {
        btnMapFooter.textContent = this.opened ? getValue('hide') : getValue('show');
        btnMapFooter.title = this.opened ? getValue('hidefooter') : getValue('showfooter');
        btnMapFooter.addEventListener('click', () => {
          if (this.opened) {
            btnMapFooter.title = getValue('showfooter');
            btnMapFooter.textContent = getValue('show');
            this.opened = false;
            this.checkFooterheight(html);
            this.setBottomMargin(this.opened);
          } else {
            btnMapFooter.title = getValue('hidefooter');
            btnMapFooter.textContent = getValue('hide');
            this.opened = true;
            this.checkFooterheight(html);
            this.setBottomMargin(this.opened);
          }
        });
      }
    }, 0);
  }

  /**
   * This function is called on the control activation
   *
   * @public
   * @function
   * @api stable
   */
  activate() {
    // calls super to manage de/activation
    super.activate();
  }

  /**
   * This function is called on the control deactivation
   *
   * @public
   * @function
   * @api stable
   */
  deactivate() {
    // calls super to manage de/activation
    super.deactivate();
  }

  /**
   * This function gets activation button
   *
   * @public
   * @function
   * @param {HTML} html of control
   * @api stable
   */
  getActivationButton(html) {
    return html.querySelector('.m-mapfooter button');
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {IDEE.Control} control to compare
   * @api stable
   */
  equals(control) {
    return control instanceof MapfooterControl;
  }

  // Add your own functions
  injectCSS(cssList) {
    for (let index = 0; index < cssList.length; index += 1) {
      const cssFile = cssList[index];
      const link = document.createElement('link');
      link.href = cssFile;
      // link.type = "text/css";
      link.rel = 'stylesheet';
      link.addEventListener('load', () => {
        // console.log('se cargo el enlace: ' + cssList[index])
        this.checkFooterheight();
        // console.log(this.panelHeight)
      });
      link.media = 'screen';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }

  checkFooterheight() {
    let bottomElements = document.querySelectorAll('div.m-bottom');
    if (document.querySelectorAll('div.m-panel.m-mapfooter').length > 0) {
      this.panelHeight = document.querySelectorAll('div.m-panel.m-mapfooter')[0].clientHeight;
    }
    const button = document.querySelectorAll('div.m-panel.m-mapfooter>button')[0];
    if (button) {
      button.style.setProperty('bottom', `${this.panelHeight}px`, 'important');
    }
    for (let index = 0; index < bottomElements.length; index += 1) {
      const element = bottomElements[index];
      if (element.classList.contains('m-right')) {
        element.style.marginBottom = `${this.panelHeight + 10}px`;
      }
    }
    bottomElements = document.querySelectorAll('div.m-bottom.m-left')[0].childNodes;

    for (let index = 0; index < bottomElements.length; index += 1) {
      const element = bottomElements[index];
      if (!element.classList.contains('m-mapfooter')) {
        if (element.classList.contains('m-scaleline')) {
          element.style.setProperty('margin-left', '100px', 'important');
          element.style.setProperty('margin-bottom', `${this.panelHeight + 10}px`, 'important');
        } else {
          element.style.setProperty('margin-bottom', `${this.panelHeight + 30}px`, 'important');
        }
      }
    }
  }

  setBottomMargin(opened) {
    const bottomElements = document.querySelectorAll('div.m-bottom');

    for (let index = 0; index < bottomElements.length; index += 1) {
      const element = bottomElements[index];
      if (element.classList.contains('m-right')) {
        if (opened) {
          element.style.marginBottom = `${this.panelHeight + 10}px`;
        } else {
          element.style.marginBottom = '10px';
        }
      }
    }
  }
}
