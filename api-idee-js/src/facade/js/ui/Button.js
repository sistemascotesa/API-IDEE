/**
 * @module IDEE/ui/Button
 */

import 'assets/css/button';
import buttonTemplate from 'templates/button';
import * as Position from './position';
import { isNullOrEmpty, isNumber } from '../util/Utils';
import { compileSync as compileTemplate } from '../util/Template';
import * as Dialog from '../dialog';
import Exception from '../exception/exception';
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
     * Determines the position of the tool when it is inside a map tool container
     * @type {number}
     * @api
     * @expose
     */
    this.order = isNumber(options.order) ? options.order : 0;

    /**
     * @private
     * @type {String}
     * @expose
     */
    this.tooltip = null;
    if (!isNullOrEmpty(options.tooltip)) {
      this.tooltip = options.tooltip;
    }

    this.svgPath = null;
    if (!isNullOrEmpty(options.svgPath)) {
      this.svgPath = options.svgPath;
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
    if (this.order) {
      this.element.style.setProperty('order', this.order, 'important');
      this.element.setAttribute('tabIndex', this.order);
    } else {
      this.element.setAttribute('tabIndex', '300');
    }

    if (this.svgPath) {
      fetch(this.svgPath)
        .then((response) => response.text())
        .then((svgContent) => {
          this.element.innerHTML = svgContent;
        });
    }

    try {
      switch (this.position) {
        case Position.LEFT:
          map.leftButtons.appendChild(this.element);
          break;

        case Position.RIGHT:
          map.rightButtons.appendChild(this.element);
          break;

          /*
        case Position.DOWN:
          map.downPanel.appendChild(this.element);
          break;

        case Position.TL:
          map.upPanelTopLeft.appendChild(this.element);
          break;

        case Position.TR:
          map.upPanelTopRight.appendChild(this.element);
          break;

        case Position.BL:
          map.upPanelBottomLeft.appendChild(this.element);
          break;

        case Position.BR:
          map.upPanelBottomRight.appendChild(this.element);
          break;
        */

        default:
          Dialog.info(`Posición no soportada para el botón ${this.name}`);
          break;
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(err);
      Exception(`El botón "${this.name}",no se ha podido colocar`);
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

    this.panel.open();
    this.pressed = true;
    this.element.classList.add('active');
  }

  closePanel() {
    this.map.closeSidePanels();
    if (this.position === Position.LEFT) {
      if (this.map.leftPanel.contains(this.panel.element)) {
        this.map.leftPanel.removeChild(this.panel.element);
      }
    } else if (this.map.rightPanel.contains(this.panel.element)) {
      this.map.rightPanel.removeChild(this.panel.element);
    }

    this.panel.collapse();
    this.pressed = false;
    this.element.classList.remove('active');
  }

  equals(obj) {
    return obj instanceof Button && obj.name === this.name;
  }
}

export default Button;
