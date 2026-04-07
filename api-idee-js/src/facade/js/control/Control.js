/**
 * @module IDEE/Control
 */
import {
  isUndefined, isNullOrEmpty, isNumber, isString,
} from '../util/Utils';
import Exception from '../exception/exception';
import Base from '../Base';
import * as EventType from '../event/eventtype';
import { getValue } from '../i18n/language';
import Plugin from '../Plugin';
import * as Position from '../ui/position';
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
   * @param {String} name Nombre del control.
   * @param {Object} impl Control de implementación
   * @param {Object} options Opciones para el control de fachada
   * - tooltip: Representa el valor del título del control
   * - svgPath: Representa el vínculo para la imagen del botón
   * - position: Posición que tendrá en el marco del mapa, un contenedor disponible
   * - order: Orden en el que se colocará dentro del contenedor
   * * @example
   * {
   *   tooltip: 'Mi control',
   *   svgPath: '/assets/icons/control.svg',
   *   position: 'left',
   *   order: 2
   * }
   */
  constructor(name, impl, options = {}) {
    super(impl);
    this.map = null;

    /**
     * @param {Plugin | null} parentPlugin existe quiere decir que está contenido en un Plugin
     */
    this.parentPlugin = null;

    /**
     * @param {HTMLElement} parentContainer define el contenedor que envuelve el control
     */
    this.parentContainer = null;

    this.name = null;
    if (isString(name)) this.name = name;
    else Exception(getValue('exception').control_name_method);

    this.tooltip = '';
    if (isString(options.tooltip)) this.tooltip = options.tooltip;

    this.svgPath = isString(options.svgPath) ?? null;

    /**
     * Position of control on map, default left
     * @type {Position}
     */
    this.position = Position.isValid(options.position) ? options.position : Position.LEFT;

    /**
     * Determines the position of the tool when it is inside a map tool container
     * @type {number}
     */
    this.order = isNumber(options.order) ? options.order : 0;

    this.controls = null;
    this.panel_ = null;
    this.element = null;
    this.activationBtn = null;
    this.activated = false;

    this.options = {
      ...options,
      svgPath: this.svgPath,
      position: this.position,
      order: this.order,
      tooltip: this.tooltip,
    };
  }

  /**
   * @return {Object} and object that contains the control translate JSON.
   */
  get translation() {
    return getValue(this.name);
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
        // eslint-disable-next-line no-console
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
   * Sobrescribe el panel del control.
   *
   * @public
   * @function
   * @param {IDEE.ui.ControlPanel} panel ControlPanel.
   * @api
   * @export
   */
  setPanel(panel) {
    this.panel_ = panel;
  }

  /**
   * Devuelve el panel del control.
   *
   * @public
   * @function
   * @returns {IDEE.ui.ControlPanel} ControlPanel.
   * @api
   * @export
   */
  getPanel() {
    return this.panel_;
  }

  /**
   * Este método establece los elementos a usar en la implementación.
   *
   * @public
   * @function
   * @@param {HTMLElement} element
   * @api stable
   * @export
   */
  setElement(element) {
    this.getImpl().setElement(element);
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
   * Elimina el panel asociado y se desvincula del mapa de fachada
   *
   * @public
   * @function
   * @api
   * @export
   */
  destroy() {
    const el = this.getElement();
    if (el && this.parentContainer.contains(el)) {
      this.parentContainer.removeChild(el);
    }
    this.getImpl().destroy();
  }
}

export default Control;
