/**
 * @module IDEE/ui/buttons/OverviewMapButton
 */

import 'assets/css/overview_map_button';
import buttonTemplate from 'templates/overview_map_button';
import * as Position from '../position';
import { isNullOrEmpty, isNumber, isString } from '../../util/Utils';
import { compileSync as compileTemplate } from '../../util/Template';
import * as Dialog from '../../dialog';
import { getValue } from '../../i18n/language';
import Exception from '../../exception/exception';
import MObject from '../../Object';

/**
 * @classdesc
 * Clase base de los botones posicionables sobre el mapa. Esta clase no implementa
 * lógica de panel: solo gestiona el elemento DOM, su posición en el mapa y los
 * estados pressed/active. El método `appendToContainer` es sobrescribible para
 * permitir restricciones de posición en subclases.
 * @property {String} name Nombre del botón.
 *
 * @api
 */
class OverviewMapButton extends MObject {
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
    this.position = isNullOrEmpty(options.position) ? Position.RIGHT : options.position;

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
    this.tooltip = isString(options.tooltip) ? options.tooltip : null;

    /**
     * Representa el path de un SVG a cargar dentro del botón. Si se proporciona, el contenido
     * @private
     * @type {String}
     * @expose
     */
    this.svgPath = isString(options.svgPath) ? options.svgPath : null;

    /**
     * CSS class applied to the rendered button element. Subclases pueden pasar
     * un valor distinto por `options.className` para reutilizar la plantilla.
     * @type {string}
     * @api
     * @expose
     */
    this.className = isString(options.className) ? options.className : 'm-overviewmap-button';

    /**
     * Additional CSS classes to add to the rendered button element. Can be
     * a space-separated string or an array of class names.
     * @type {string|Array<string>|null}
     * @expose
     */
    this.classList = options.classList ?? null;

    /**
     * contenido html del botón.
     *
     * @type {HTMLButtonElement}
     * @api
     * @expose
     */
    this.element = null;

    this.pressed = null;
  }

  destroy() {
    if (this.element != null) {
      this.element.remove();
    }
  }

  /**
   * Compila la plantilla del botón y aplica id, tooltip, atributos ARIA, orden
   * y el SVG opcional. Puede sobrescribirse si una subclase necesita un
   * elemento DOM diferente.
   */
  createElement() {
    this.element = compileTemplate(buttonTemplate, {
      vars: { className: this.className },
    });
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

    // Apply any additional classes requested by the caller
    if (this.classList) {
      const classes = Array.isArray(this.classList) ? this.classList : String(this.classList).split(/\s+/);
      classes.forEach((c) => {
        if (c) this.element.classList.add(c);
      });
    }

    this.element.addEventListener('click', (evt) => {
      this.click.bind(this)(evt);
    });
  }

  /**
   * Inserta el elemento del botón en el contenedor del mapa que corresponda a
   * `this.position`. Método independiente y sobrescribible para que subclases
   * puedan restringir o ampliar las posiciones soportadas.
   * @param {IDEE.Map} map
   * @param {IDEE.Map} position
   */
  appendToContainer(map, position = this.position) {
    const container = map.getToolsContainer(position);
    if (container) {
      container.appendChild(this.element);
    } else {
      Dialog.info(`${getValue('exception').invalid_tool_position} ${this.name}`);
    }
  }

  addTo(map) {
    this.map = map;
    this.createElement();

    try {
      this.appendToContainer(map);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(err);
      Exception(`${getValue('exception').no_tool_position} (${this.name})`);
    }
  }

  /**
   * This event is triggered when the user clicks on the button
   *
   * @param {PointerEvent} event
   */
  click(event) {
    if (this.pressed) {
      this.deactivate();
    } else {
      this.activate();
    }
  }

  /**
   * Activate the button, changing its state to pressed and
   * adding the 'active' class to its element.
   */
  activate() {
    this.pressed = true;
    this.element.classList.add('active');
  }

  /**
   * Deactivate the button, changing its state to not pressed and
   * removing the 'active' class from its element.
   */
  deactivate() {
    this.pressed = false;
    this.element.classList.remove('active');
  }

  /**
   * Igualdad por nombre. No sobrescribir en subclases:
   * `Map.deactivateSidePanelButtons` depende de este contrato para evitar
   * desactivar el botón actualmente activo.
   * @param {*} obj
   * @returns {boolean}
   */
  equals(obj) {
    return obj instanceof this.constructor && obj.name === this.name;
  }
}

export default OverviewMapButton;
