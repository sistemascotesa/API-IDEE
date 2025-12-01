/**
 * @module IDEE/Control
 */
import { isUndefined, isNullOrEmpty } from '../util/Utils';
import Exception from '../exception/exception';
import Base from '../Base';
import * as EventType from '../event/eventtype';
import { getValue } from '../i18n/language';
import * as Position from '../ui/position';
import Plugin from '../Plugin';
import isControlImpl from '../../../impl/util/control/isControlImpl';
import getControlImpl from '../../../impl/util/control/getControlImpl';

/**
 * @classdesc
 * Es la clase de la que heredan todos los controles.
 *
 * @property {Boolean} activated Define si el control esta activado, por defecto falso.
 * @property {String} name Nombre del control.
 *
 * @api
 * @extends {IDEE.Base}
 */
class Control extends Base {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @api
   * @param {Object} implParam Opciones para generar el control.
   * @param {String} name Nombre del control.
   */
  constructor(name, options = {}) {
    super(options);
    this.map = null;

    /**
     * @param {Plugin | null} parentPlugin existe quiere decir que está contenido en un Plugin
     */
    this.parentPlugin = null;

    /**
     * @param {HTMLElement} parentContainer define el contenedor que envuelve el control
     */
    this.parentContainer = null;

    this.name = name;
    this.tooltip = options.tooltip || '';
    this.svgPath = options.svgPath || null;
    this.position = options.position ?? Position.LEFT;
    this.order = options.order ?? 0;

    this.controls = null;
    this.element = null;
    this.activationBtn = null;
    this.activated = false;
  }

  /**
   * Este método establece la implementación de este control.
   *
   * @public
   * @function
   * @param {IDEE.Map} impl Implementación del mapa.
   * @api
   */
  setImpl(implParam) {
    const impl = implParam;
    // checks if the implementation can create WMC layers
    if (isUndefined(impl.addTo)) {
      Exception(getValue('exception').addto_method);
    }
    if (isUndefined(impl.getElement)) {
      Exception(getValue('exception').getelement_method);
    }
    // checks if the implementation can create default controls
    if (isUndefined(impl.isByDefault)) {
      impl.isByDefault = true;
    }
  }

  /**
   * Consige el contenedor que contiene el control
   *
   * @constructor
   * @returns {HTML} Plantilla del control.
   * @api stable
   * @export
   */
  getParentContainer() {
    return this.parentContainer;
  }

  /**
   * Asigna el contenedor que contendrá el control
   *
   * @param {HTML} parentContainer Plantilla del control.
   * @api stable
   * @export
   */
  setParentContainer(parentContainer) {
    this.parentContainer = parentContainer;
  }

  /**
   * Este método añade el control al mapa.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @api
   * @export
   */
  addTo(map) {
    this.map = map;

    const buildImpl = (templateReady) => {
      let controlImpl = this.getImpl();
      if (!isControlImpl(controlImpl)) {
        // Consige una implementación de control nueva para un mapa de implementación concreto
        controlImpl = getControlImpl(this.map.getImpl(), controlImpl);
        super.setImpl(controlImpl);
      }
      this.manageActivation(templateReady);
      controlImpl.addTo(this.map, templateReady);
      if (this.parentPlugin instanceof Plugin) {
        this.parentPlugin.addControlToPlugin(this);
        this.parentContainer = this.parentPlugin.panel.panelContent;
      } else {
        const mapToolsContainer = this.map.getToolsContainer(this.position);
        if (mapToolsContainer) {
          this.setParentContainer(mapToolsContainer);
          this.map.addToolToContainer(mapToolsContainer, controlImpl);
        } else {
          Exception(getValue('exception').invalid_tool_position);
        }
      }
      this.fire(EventType.ADDED_TO_MAP);
    };

    const template = this.createView(map);
    if (template instanceof Promise) {
      template.then((templateReady) => {
        buildImpl(templateReady);
      });
    } else { // view is an HTML or text
      buildImpl(template);
    }
  }

  /**
   * Este método añade la vista al mapa.
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @api
   * @export
   */
  createView(map) {
    const element = document.createElement('button');
    element.classList.add('m-control-button');
    element.id = `m-control-button-${this.name}`;
    element.title = this.tooltip;
    element.role = 'button';
    element.ariaLabel = this.tooltip;

    if (this.svgPath) {
      fetch(this.svgPath)
        .then((response) => response.text())
        .then((svgContent) => {
          element.innerHTML = svgContent;
        });
    }

    this.element = element;
    return element;
  }

  /**
   * Este método maneja la activación del control.
   *
   * @public
   * @function
   * @param {HTMLElement} html HTML del control.
   * @api
   * @export
   */
  manageActivation(html) {
    this.activationBtn = this.getActivationButton(this.element);
    if (!isNullOrEmpty(this.activationBtn)) {
      this.activationBtn.addEventListener('click', (evt) => {
        evt.preventDefault();
        if (!this.activated) {
          this.activate();
          this.activated = true;
          this.element.classList.add('active');
        } else {
          this.deactivate();
          this.activated = false;
          this.element.classList.remove('active');
        }
      }, false);
    }
  }

  /**
   * Activación del botón.
   *
   * @public
   * @function
   * @param {HTMLElement} html HTML del botón.
   * @api
   * @export
   */
  getActivationButton(html) {
    return html;
  }

  /**
   * Método que añade el evento "click".
   *
   * @public
   * @function
   * @api
   * @export
   */
  activate() {
    if (!isNullOrEmpty(this.map)) {
      this.map.getControls().forEach((control) => {
        control.deactivate();
      });
    }
    if (!isNullOrEmpty(this.element)) {
      this.element.classList.add('active');
    }
    if (!isUndefined(this.getImpl()) && !isUndefined(this.getImpl().activate)) {
      this.getImpl().activate();
    }
    this.activated = true;
    this.fire(EventType.ACTIVATED);
  }

  /**
   * Método que elimina el evento "click".
   *
   * @public
   * @function
   * @api
   * @export
   */
  deactivate() {
    if (!isNullOrEmpty(this.element)) {
      this.element.classList.remove('active');
    }
    if (!isUndefined(this.getImpl()) && !isUndefined(this.getImpl().deactivate)) {
      this.getImpl().deactivate();
    }
    this.activated = false;
    this.fire(EventType.DEACTIVATED);
  }

  /**
   * Este método devuelve todos los elementos de la implementación.
   *
   * @public
   * @function
   * @returns {Object} Devuelve los elementos extraidos de la implementación.
   * @api
   * @export
   */
  getElement() {
    return this.getImpl().getElement();
  }

  /**
   * Elimina el control.
   *
   * @public
   * @function
   * @api
   * @export
   */
  destroy() {
    this.parentContainer.removeChild(this.getElement());
  }
}

export default Control;
