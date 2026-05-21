/**
 * @module IDEE/ui/panels/Panel
 */
import {
  isArray,
  isNullOrEmpty,
  isString,
  isNumber,
  includes,
  isBoolean,
} from '../../util/Utils';
import MObject from '../../Object';
import * as Position from '../position';
import * as EventType from '../../event/eventtype';
import ControlBase from '../../control/Control';

class Panel extends MObject {
  constructor(name, options = {}) {
    super();

    /**
     * @type {string}
     * @api
     * @expose
     */
    this.name = '';
    if (isString(name)) {
      this.name = name;
    }

    /**
     * @private
     * @type {IDEE.Map}
     * @expose
     */
    this.map = null;

    /**
     * @private
     * @type {array}
     * @expose
     */
    this.controls = [];

    /**
     * @private
     * @type {boolean}
     * @expose
     */
    this._multiActivation = false;

    /**
     * @private
     * @type {string}
     * @expose
     */
    this._className = null;

    /**
     * @private
     * @type {string}
     * @expose
     */
    this._collapsedButtonClass = null;

    /**
     * @private
     * @type {string}
     * @expose
     */
    this._openedButtonClass = null;

    /**
     * @private
     * @type {HTMLElement}
     * @expose
     */
    this.element = null;

    /**
     * @private
     * @type {HTMLElement}
     * @expose
     */
    this._areaContainer = null;

    /**
     * @type {Position}
     * @api
     * @expose
     */
    this.position = Position.isValid(options.position) ? options.position : Position.LEFT;

    /**
     * @private
     * @type {boolean}
     * @expose
     */
    this._collapsed = isBoolean(options.collapsed) ? options.collapsed : true;

    /**
     * @private
     * @type {String}
     * @expose
     */
    this._tooltip = null;
    if (isString(options.tooltip)) {
      this._tooltip = options.tooltip;
    }

    /**
     * @private
     * @type {Number}
     * @expose
     */
    if (isNumber(options.order)) {
      this._order = options.order;
    }

    /**
     * Identificador css que aplica a los elementos del panel distintivamente.
     *
     * @private
     * @type {String}
     * @expose
     */
    this.cssName = isString(options.cssName) ? options.cssName : 'base';
  }

  /**
   * Este método elimina el panel.
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    if (this.element != null) {
      this.element.remove();
    }
    this.element = null;
    this._areaContainer = null;
  }

  /**
   * Este método proporciona tab al panel.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @api
   */
  _tabAccessibility() {
    document.body.addEventListener('keyup', ({ key, target }) => {
      if (key === 'Tab') {
        if (document.querySelector('.focusStyle')) {
          document.querySelector('.focusStyle').classList.remove('focusStyle');
        }
        target.classList.add('focusStyle');
      }
    });

    document.body.addEventListener('click', () => {
      if (document.querySelector('.focusStyle')) {
        document.querySelector('.focusStyle').classList.remove('focusStyle');
      }
    });
  }

  /**
   * Este método proporciona el evento de cerrar el panel.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @api
   */
  _collapse(html) {
    this._collapsed = true;
    this.fire(EventType.HIDE);
  }

  /**
   * Este método proporciona el evento de abrir el panel.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @api
   */
  _open(html) {
    this._collapsed = false;
    this.fire(EventType.SHOW);
  }

  /**
   * Este método abre el panel.
   *
   * @public
   * @function
   * @api
   */
  open() {
    this._open(this.element);
  }

  /**
   * Este método cierra el panel.
   *
   * @public
   * @function
   * @api
   */
  collapse() {
    this._collapse(this.element);
  }

  /**
   * Este método devuelve el control del panel.
   *
   * @public
   * @function
   * @return {array<IDEE.Control>} Control.
   * @api
   */
  getControls(filter) {
    if (!filter) {
      return this.controls;
    }

    let filterArray = null;
    let filterControl = null;

    if (!Array.isArray(filter)) {
      filterArray = [filter];
    }

    if (typeof filterArray[0] === 'object') {
      filterControl = Object.values(...filterArray);
    }

    return this.controls.filter(({ name }) => {
      if (filterControl) {
        return filterControl.includes(name);
      }
      return true;
    });
  }

  /**
   * Este método añade un control al panel.
   *
   * @public
   * @function
   * @param {array<IDEE.Control>} controlsParam Control.
   * @api
   */
  addControls(controlsParam) {
    this.contador = 0;
    let controls = controlsParam;
    if (!isNullOrEmpty(controls)) {
      if (!isArray(controls)) {
        controls = [controls];
      }
      controls.forEach((control) => {
        if (control instanceof ControlBase) {
          if (!this.hasControl(control)) {
            this.controls.push(control);
            this.attachControl(control);
            control.on(EventType.DESTROY, this._removeControl.bind(this), this);
          }
          if (!isNullOrEmpty(this.element)) {
            control.on(EventType.ADDED_TO_MAP, this._moveControlView.bind(this), this);
            this.map.addControls(control, true);
          }
          control.on(EventType.ACTIVATED, this._manageActivation.bind(this), this);
        }
        control.on(EventType.ADDED_TO_MAP, () => {
          // eslint-disable-next-line no-underscore-dangle
        });
      });
    }
  }

  attachControl(control) {
    // Implemented by subclasses when control association differs.
  }

  /**
   * Este método te devuelve verdadero si a un control le pertenece este panel.
   *
   * @public
   * @function
   * @param {array<IDEE.Control>} controlParam Control.
   * @returns {Boolean} Verdadero pertenece, falso no.
   *
   * @api
   */
  hasControl(controlParam) {
    let hasControl = false;
    if (!isNullOrEmpty(controlParam)) {
      if (isString(controlParam)) {
        hasControl = this.controls.some((control) => control.name === controlParam);
      } else if (controlParam instanceof ControlBase) {
        hasControl = includes(this.controls, controlParam);
      }
    }
    return hasControl;
  }

  /**
   * Este método elimina los controles del panel.
   *
   * @public
   * @function
   * @param {array<IDEE.Control>} controlsParam Control.
   * @api
   */
  removeControls(controlsParam) {
    let controls = controlsParam;
    if (!isNullOrEmpty(controls)) {
      if (!isArray(controls)) {
        controls = [controls];
      }
      controls.forEach((controlParam) => {
        const control = controlParam;
        if ((control instanceof ControlBase) && this.hasControl(control)) {
          this.controls = this.controls.filter((control2) => !control2.equals(control));
        }
      }, this);
      if (this.controls.length === 0 && this.map && typeof this.map.removePanel === 'function') {
        this.map.removePanel(this);
      }
    }
  }

  /**
   * Este método elimina los controles del panel.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @param {array<IDEE.Control>} controls Control.
   * @api
   */
  _removeControl(controlsParam) {
    const controls = this.map.controls(controlsParam);
    controls.forEach((control) => {
      const index = this.controls.indexOf(control);
      if (index !== -1) {
        this.controls.splice(index, 1);
      }
    });
  }

  /**
   * Este método elimina una clase en el panel.
   *
   * @public
   * @function
   * @param {String} className Nombre de la clase.
   * @api
   */
  removeClassName(className) {
    if (!isNullOrEmpty(this.element)) {
      this.element.classList.remove(className);
    } else if (this._className) {
      this._className = this._className.replace(new RegExp(`s* ${className} s*`), '');
    }
  }

  /**
   * Este método añade una clase al panel.
   *
   * @public
   * @function
   * @param {String} className Nombre de la clase.
   * @api
   */
  addClassName(className) {
    if (!isNullOrEmpty(this.element)) {
      this.element.classList.add(className);
    } else if (this._className) {
      this._className = this._className.concat(' ').concat(className);
    } else {
      this._className = className;
    }
  }

  /**
   * Este método modifica la vista del control.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @param {IDEE.Control} control Control.
   * @api
   */
  _moveControlView(control) {
    const controlElem = control.getElement();
    const container = this.getControlsContainer();
    if (!isNullOrEmpty(container) && !isNullOrEmpty(controlElem)) {
      container.appendChild(controlElem);
      control.fire(EventType.PANEL_VIEW_CHANGE);
    }
  }

  /**
   * Este método maneja la activación del botón.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @param {array<IDEE.Control>} controls Control.
   * @api
   */
  _manageActivation(control) {
    if (this._multiActivation !== true) {
      this.controls.forEach((panelControl) => {
        if (!panelControl.equals(control) && panelControl.activated) {
          panelControl.deactivate();
        }
      });
    }
  }

  /**
   * Este método devuelve verdadero si es igual,
   * falso si no.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @param {Object} Objeto Objeto.
   * @api
   */
  equals(obj) {
    return obj instanceof this.constructor && obj.name === this.name;
  }

  /**
   * Este método devuelve la plantilla.
   *
   * @public
   * @function
   * @api
   * @returns {HTMLElement} Plantilla.
   */
  getTemplatePanel() {
    return this.element;
  }

  /**
   * Este método devuelve el contenido del elemento HTML correspondiente al botón que abre el panel.
   *
   * @public
   * @function
   * @api
   * @returns {HTMLElement} Elemento botón.
   */
  getButtonPanel() {
    return this.button || this._buttonPanel;
  }

  /**
   * Este método devuelve verdadero si el
   * panel esta colapsado.
   *
   * @public
   * @function
   * @api
   * @returns {Boolean} Devuelve verdadero si el
   * panel esta colapsado.
   */
  isCollapsed() {
    return this._collapsed;
  }

  /**
   * Este método devuelve el contenedor.
   *
   * @public
   * @function
   * @returns {HTMLElement} Contenedor.
   */
  getControlsContainer() {
    return this.element;
  }
}

export default Panel;
