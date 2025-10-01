/**
 * @module IDEE/ui/Button
 */

import 'assets/css/button';
import buttonTemplate from 'templates/button';
import * as Position from './position';
import { isNullOrEmpty } from '../util/Utils';
import { compileSync as compileTemplate } from '../util/Template';
import MObject from '../Object';

/**
 * @classdesc
 * Esta clase se encarga de general el botón de los plugins.
 * @property {String} name Nombre del botón.
 *
 * @api
 */
class Button extends MObject {
  constructor(name, options = {}) {
    super();

    /**
     * @type {string}
     * @expose
     */
    this.name = name;

    /**
     * @type {IDEE.Map}
     * @expose
     */
    this.map = null;

    /**
     * @type {IDEE.ui.Panel}
     * @expose
     */
    this.panel = null;

    /**
     * @type {boolean}
     * @api
     * @expose
     */
    this.pressed = false;

    /**
     * @type {Position}
     * @api
     * @expose
     */
    this.position = Position.RIGHT;
    if (!isNullOrEmpty(options.position)) {
      this.position = options.position;
    }

    /**
     * @private
     * @type {String}
     * @expose
     */
    this.tooltip = null;
    if (!isNullOrEmpty(options.tooltip)) {
      this.tooltip = options.tooltip;
    }
  }

  destroy() {
    if (this.element != null) {
      this.element.remove();
    }
  }

  addTo(map) {
    this.map = map;

    this.element = compileTemplate(buttonTemplate);
    this.element.id = `${this.name.toLowerCase()}-button`;
    this.element.title = this.tooltip;
    this.element.role = 'button';
    this.element.ariaLabel = this.tooltip;
    this.element.tabIndex = '300';

    const svgPath = `plugins/${this.name}/images/icon.svg`;
    fetch(svgPath)
      .then((response) => response.text())
      .then((svgContent) => {
        this.element.innerHTML = svgContent;
      });

    if (this.position === Position.LEFT) {
      map.leftButtons.appendChild(this.element);
    } else {
      map.rightButtons.appendChild(this.element);
    }

    this.element.addEventListener('click', (evt) => {
      if (this.pressed) {
        this.closePanel();
      } else {
        this.openPanel();
      }
    });
  }

  openPanel() {
    this.map.buttons.filter((button) => button.position === this.position).forEach((button) => {
      button.closePanel();
    });

    this.map.openPanel(this.position, this.panel.minWidth, this.panel.maxWidth);
    if (this.position === Position.LEFT) {
      if (!this.map.leftPanel.contains(this.panel.element)) {
        this.map.leftPanel.appendChild(this.panel.element);
      }
    } else if (!this.map.rightPanel.contains(this.panel.element)) {
      this.map.rightPanel.appendChild(this.panel.element);
    }

    this.pressed = true;
    this.element.classList.add('active');
  }

  closePanel() {
    this.map.closePanel(this.position);
    if (this.position === Position.LEFT) {
      if (this.map.leftPanel.contains(this.panel.element)) {
        this.map.leftPanel.removeChild(this.panel.element);
      }
    } else if (this.map.rightPanel.contains(this.panel.element)) {
      this.map.rightPanel.removeChild(this.panel.element);
    }

    this.pressed = false;
    this.element.classList.remove('active');
  }

  equals(obj) {
    return obj instanceof Button && obj.name === this.name;
  }
}

export default Button;
