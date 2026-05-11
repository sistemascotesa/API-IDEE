/* eslint-disable no-console */
/**
 * @module M/control/MapheaderControl
 */

import MapheaderImplControl from 'impl/mapheadercontrol';
import template from 'templates/mapheader';
import { getValue } from './i18n/language';

export default class MapheaderControl extends IDEE.Control {
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
    if (IDEE.utils.isUndefined(MapheaderImplControl)) {
      IDEE.exception(getValue('exception.impl'));
    }
    // 2. implementation of this control
    const impl = new MapheaderImplControl();
    super(impl, 'Mapheader');

    this.config = config;
    this.htmlCode = this.config.htmlCode;
    this.opened = config.open === true;
    this.cssList = (IDEE.utils.isArray(this.config.cssList) ? this.config.cssList : this.config.cssList.split(',')).map((s) => s.trim());
    this.injectCSS(this.cssList);
    this.templateVars = { vars: { htmlCode: this.htmlCode } };
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
      this.addEvents();
      success(html);
    });
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
    return html.querySelector('.m-mapheader button');
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
    return control instanceof MapheaderControl;
  }

  // Add your own functions
  injectCSS(cssList) {
    for (let index = 0; index < cssList.length; index += 1) {
      const cssFile = cssList[index];
      const link = document.createElement('link');
      link.href = cssFile;
      link.rel = 'stylesheet';
      link.addEventListener('load', () => {
        if (this.opened) {
          this.checkHeaderheight();
        }
      });
      link.media = 'screen';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }

  addEvents() {
    setTimeout(() => {
      if (this.opened) {
        this.checkHeaderheight();
      } else {
        this.setTopMargin(false);
      }

      // Selector del botón del panel mapheader
      const panelMapheader = document.querySelector('div.m-panel.m-mapheader');
      const btnMapHeader = panelMapheader ? panelMapheader.querySelector('button.m-panel-btn') : null;

      if (btnMapHeader) {
        btnMapHeader.textContent = this.opened ? getValue('hide') : getValue('show');
        btnMapHeader.title = this.opened ? getValue('hideheader') : getValue('showheader');
        btnMapHeader.addEventListener('click', () => {
          if (this.opened) {
            btnMapHeader.textContent = getValue('show');
            btnMapHeader.title = getValue('showheader');
            this.opened = false;
            this.setTopMargin(false);
          } else {
            btnMapHeader.textContent = getValue('hide');
            btnMapHeader.title = getValue('hideheader');
            this.opened = true;
            this.checkHeaderheight();
            this.setTopMargin(true);
          }
        });
      }
    }, 0);
  }

  checkHeaderheight() {
    let bottomElements = document.querySelectorAll('div.m-top');
    if (document.querySelectorAll('div.m-panel.m-mapheader').length > 0) {
      this.panelHeight = document.querySelectorAll('div.m-panel.m-mapheader')[0].clientHeight;
      const button = document.querySelectorAll('div.m-panel.m-mapheader>button')[0];
      if (button) {
        button.style.setProperty('top', `${this.panelHeight}px`, 'important');
      }
    }
    for (let index = 0; index < bottomElements.length; index += 1) {
      const element = bottomElements[index];
      if (element.classList.contains('m-left')) {
        element.style.marginTop = `${this.panelHeight + 30}px`;
      }
    }
    bottomElements = document.querySelectorAll('div.m-top.m-right')[0].childNodes;

    for (let index = 0; index < bottomElements.length; index += 1) {
      const element = bottomElements[index];
      if (!element.classList.contains('m-mapheader')) {
        element.style.setProperty('margin-top', `${this.panelHeight + 10}px`, 'important');
      }
    }
  }

  setTopMargin(opened) {
    const button = document.querySelectorAll('div.m-panel.m-mapheader>button')[0];
    if (button) {
      if (opened) {
        button.style.setProperty('top', `${this.panelHeight}px`, 'important');
      } else {
        button.style.removeProperty('top');
      }
    }

    let bottomElements = document.querySelectorAll('div.m-top');
    for (let index = 0; index < bottomElements.length; index += 1) {
      const element = bottomElements[index];
      if (element.classList.contains('m-left')) {
        if (opened) {
          element.style.marginTop = `${this.panelHeight + 30}px`;
        } else {
          element.style.marginTop = '30px';
        }
      }
    }
    bottomElements = document.querySelectorAll('div.m-top.m-right')[0].childNodes;
    for (let index = 0; index < bottomElements.length; index += 1) {
      const element = bottomElements[index];
      if (!element.classList.contains('m-mapheader')) {
        if (opened) {
          element.style.setProperty('margin-top', `${this.panelHeight + 10}px`, 'important');
          document.getElementById('div-contenedor').style.display = 'block';
        } else {
          element.style.setProperty('margin-top', '10px', 'important');
          document.getElementById('div-contenedor').style.display = 'none';
        }
      }
    }
  }
}
