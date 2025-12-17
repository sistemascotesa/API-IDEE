/**
 * @module IDEE/ui/Panel
 */
import 'assets/css/panel';
import panelTemplate from 'templates/panel';
import * as Position from '../../facade/js/ui/position';
import {
  isArray, isNullOrEmpty, isString, includes,
} from '../../facade/js/util/Utils';
import MObject from '../../facade/js/Object';
import * as EventType from '../../facade/js/event/eventtype';
import ControlBase from '../../facade/js/control/Control';
import { compileSync as compileTemplate } from '../../facade/js/util/Template';

/**
 * @classdesc
 * Esta clase se encarga de general el panel de los plugins.
 * @property {String} name Nombre del panel.
 * @property {String} position Posición del panel.
 *
 * @api
 */
class Panel extends MObject {
  /**
   * Constructor principal de la clase.
   * @constructor
   * @param {string} name Nombre del panel.
   * @param {Mx.parameters.Panel} options Opciones del panel.
   * - collapsible: Indica si el panel se puede colapsar.
   * - position: Posición del panel.
   *   - BL: ".m-bottom.m-left".
   *   - BR: ".m-bottom.m-right".
   *   - TL: ".m-top.m-left".
   *   - TR: ".m-top.m-right".
   * - collapsed: Indica si el panel aparece por defecto colapsado o no.
   * - multiActivation: Si el panel puede estar activado o no.
   * - className: Clase CSS del panel.
   * - collapsedButtonClass: Clase CSS del botón del panel.
   * - tooltip: Información sobre la herramienta.
   * - order: Orden del panel respecto a los otros paneles y su posición.
   * @extends {IDEE.Object}
   * @api
   */
  constructor(name, options = {}) {
    super();

    /**
     * @type {string}
     * @api
     * @expose
     */
    this.name = name;

    /**
     * @private
     * @type {IDEE.Map}
     * @expose
     */
    this.map = null;

    /**
     * @private
     * @type {HTMLElement}
     * @expose
     */
    this.buttonPanel = null;

    /**
     * @private
     * @type {array}
     * @expose
     */
    this.controls = [];

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
     * @type {Number}
     * @api
     * @expose
     */
    if (!isNullOrEmpty(options.minWidth)) {
      this.minWidth = options.minWidth;
    }

    /**
     * @type {Number}
     * @api
     * @expose
     */
    if (!isNullOrEmpty(options.maxWidth)) {
      this.maxWidth = options.maxWidth;
    }

    /**
     * @private
     * @type {boolean}
     * @expose
     */
    this._collapsible = false;
    if (!isNullOrEmpty(options.collapsible)) {
      this._collapsible = options.collapsible;
    }

    /**
     * @private
     * @type {boolean}
     * @expose
     */
    this._collapsed = this._collapsible;
    if (!isNullOrEmpty(options.collapsed)) {
      this._collapsed = (options.collapsed && (this._collapsible === true));
    }

    /**
     * @private
     * @type {boolean}
     * @expose
     */
    this._multiActivation = false;
    if (!isNullOrEmpty(options.multiActivation)) {
      this._multiActivation = options.multiActivation;
    }

    /**
     * @private
     * @type {string}
     * @expose
     */
    this._className = null;
    if (!isNullOrEmpty(options.className)) {
      this._className = options.className;
    }

    /**
     * @private
     * @type {string}
     * @expose
     */
    this._collapsedButtonClass = null;
    if (!isNullOrEmpty(options.collapsedButtonClass)) {
      this._collapsedButtonClass = options.collapsedButtonClass;
    } else if ((this.position === Position.CTL) || (this.position === Position.CBL)) {
      this._collapsedButtonClass = 'g-cartografia-flecha-derecha';
    } else if ((this.position === Position.CTR) || (this.position === Position.CBR)) {
      this._collapsedButtonClass = 'g-cartografia-flecha-izquierda';
    }

    /**
     * @private
     * @type {string}
     * @expose
     */
    this._openedButtonClass = null;
    if (!isNullOrEmpty(options.openedButtonClass)) {
      this._openedButtonClass = options.openedButtonClass;
    } else if ((this.position === Position.CTL) || (this.position === Position.CBL)) {
      this._openedButtonClass = 'g-cartografia-flecha-izquierda';
    } else if ((this.position === Position.CTR) || (this.position === Position.CBR)) {
      this._openedButtonClass = 'g-cartografia-flecha-derecha';
    }

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
     * @private
     * @type {HTMLElement}
     * @expose
     */
    // this._controlsContainer = null;

    /**
     * @private
     * @type {String}
     * @expose
     */
    this._tooltip = null;
    if (!isNullOrEmpty(options.tooltip)) {
      this._tooltip = options.tooltip;
    }

    /**
     * @private
     * @type {Number}
     * @expose
     */
    if (!isNullOrEmpty(options.order)) {
      this._order = options.order;
    }

    // Aceptar el elemento principal y el contenedor de contenido
    if (options.element) {
      this.element = options.element;
    }
    if (options.panelContent) {
      this.panelContent = options.panelContent;
    }
  }

  /**
   * Este método elimina el panel.
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    console.log(`[ControlPanel] Destruyendo panel: ${this.name}`);
    if (this.element != null) {
      this.element.remove();
    }
  }

  /**
   * Este método añade el panel al mapa.
   *
   * @public
   * @function
   * @param {IDEE.map} map Mapa.
   * @param {HTMLElement} areaContainer Elemento contenedor.
   * @api
   */
  addTo(map) {
    this.map = map;

    if (!this.element) {
      this.element = compileTemplate(panelTemplate);
      // this.element.id = `plugin-panel-${this.name}`;
      this.createTitlePanel(); // Solo se llama si no se inyecta la plantilla
    }

    this.element.id = `plugin-panel-${this.name}`;

    // Botón flotante
    const newButton = this.element.querySelector('.m-panel-btn');

    if (newButton && newButton !== this.buttonPanel) {
      this.buttonPanel = newButton;
      this.buttonPanel.addEventListener('click', (event) => {
        event.preventDefault();
        if (this.isCollapsed()) {
          this.open();
        } else {
          this.collapse();
        }
      });
    }

    this._tabAccessibility();

    if (!isNullOrEmpty(this._tooltip)) {
      this.element.setAttribute('title', this._tooltip);
    }

    this.addControls(this.controls);
    this.fire(EventType.ADDED_TO_MAP, this.element);
  }

  createTitlePanel() {
    this.panelTitle = document.createElement('div');
    this.panelTitle.id = `plugin-panel-title-${this.name}`;
    this.panelTitle.classList.add('m-plugin-panel-title');
    this.panelTitle.role = 'heading';
    this.panelTitle.ariaLabel = this._tooltip;
    this.panelTitle.tabIndex = 'null';
    this.panelTitle.textContent = this._tooltip;
    this.panelTitle.title = this._tooltip;
    this.element.appendChild(this.panelTitle);
  }

  createContentPanel() {
    this.panelContent = document.createElement('div');
    this.panelContent.id = `plugin-panel-content-${this.name}`;
    this.panelContent.classList.add('m-plugin-panel-content');
    this.panelContent.tabIndex = 'null';
    this.element.appendChild(this.panelContent);
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
    if (!html) return;
    html.classList.remove('opened');
    html.classList.add('collapsed');
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
    if (!html) return;
    html.classList.remove('collapsed');
    html.classList.add('opened');
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
      controls.forEach((control, i) => {
        if (control instanceof ControlBase) {
          if (!this.hasControl(control)) {
            this.controls.push(control);
            control.setParentContainer(this);
            control.on(EventType.DESTROY, this._removeControl.bind(this), this);
          }
          if (!isNullOrEmpty(this.element)) {
            control.on(EventType.ADDED_TO_MAP, this._moveControlView.bind(this), this);
            this._map.addControls(control, true);
          }
          control.on(EventType.ACTIVATED, this._manageActivation.bind(this), this);
        }
        control.on(EventType.ADDED_TO_MAP, () => {
          // eslint-disable-next-line no-underscore-dangle
          // control.element_.setAttribute('role', 'button');

          // eslint-disable-next-line no-underscore-dangle
          // control.element_.setAttribute('tabIndex', 0);

          // eslint-disable-next-line no-underscore-dangle
          // console.log(control.element_);
        });
      });
    }
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
      // if this panel hasn't any controls then it's removed
      // from the map
      if (this.controls.length === 0) {
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
    } else {
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
    } else {
      this._className = this._className.concat(' ').concat(className);
    }
  }

  /**
   * Este método modifica la vista del control.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @param {array<IDEE.Control>} controls Control.
   * @api
   */
  _moveControlView(control) {
    const controlElem = control.getElement();
    // eslint-disable-next-line no-console
    console.log(this.element);
    if (!isNullOrEmpty(this.element)) {
      this.element.appendChild(controlElem);
    }
    control.fire(EventType.ADDED_TO_PANEL);
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
    return obj instanceof Panel && obj.name === this.name;
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
   * Este método devuelve el botón del panel.
   *
   * @public
   * @function
   * @api
   * @returns {HTMLElement} Elemento botón.
   */
  getButtonPanel() {
    return this.buttonPanel;
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
   * @api
   * @returns {HTMLElement} Contenedor.
   */
  getControlsContainer() {
    return this.element;
  }
}

export default Panel;
