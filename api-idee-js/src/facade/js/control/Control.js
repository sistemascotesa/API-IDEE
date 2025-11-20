/**
 * @module IDEE/Control
 */
import { isUndefined, isNullOrEmpty } from '../util/Utils';
import Exception from '../exception/exception';
import Base from '../Base';
import * as EventType from '../event/eventtype';
import { getValue } from '../i18n/language';
import Plugin from '../Plugin';

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

    this.name = name;
    this.tooltip = options.tooltip || '';
    this.svgPath = options.svgPath || null;

    this.map = null;
    this.panel = null;
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
   * Este método añade el control al mapa.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @api
   * @export
   */
  addTo(parent) {
    this.parent = parent;
    const controlImpl = this.getImpl();
    const view = this.createView(parent);
    if (view instanceof Promise) { // the view is a promise
      view.then((html) => {
        this.manageActivation(html);
        controlImpl.addTo(parent, html);
        this.fire(EventType.ADDED_TO_MAP);
      });
    } else { // view is an HTML or text
      this.manageActivation(view);

      if (parent instanceof Plugin) {
        parent.addControlToPlugin(this);
      } else {
        // eslint-disable-next-line no-console
        console.log(controlImpl);
        controlImpl.addTo(parent, view);
      }

      this.fire(EventType.ADDED_TO_MAP);
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
    if (!isNullOrEmpty(this.parent)) {
      this.parent.getControls().forEach((control) => {
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
   * Sobrescribe el panel del control.
   *
   * @public
   * @function
   * @param {IDEE.ui.Panel} panel Panel.
   * @api
   * @export
   */
  setPanel(panel) {
    this.panel = panel;
  }

  /**
   * Devuelve el panel del control.
   *
   * @public
   * @function
   * @returns {IDEE.ui.Panel} Panel.
   * @api
   * @export
   */
  getPanel() {
    return this.panel;
  }

  /**
   * Elimina el control.
   *
   * @public
   * @function
   * @api
   * @export
   */
  destroy() {}
}

export default Control;
