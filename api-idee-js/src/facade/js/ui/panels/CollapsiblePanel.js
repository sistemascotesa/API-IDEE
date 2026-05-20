/**
 * @module IDEE/ui/panels/CollapsiblePanel
 */
import 'assets/css/control_panel';
import controlPanelTemplate from 'templates/control_panel';
import PanelButton from '../buttons/PanelButton';
import * as Position from '../position';
import {
  isNullOrEmpty,
  isString,
  isBoolean,
} from '../../util/Utils';
import Panel from './Panel';
import * as EventType from '../../event/eventtype';
import { compileSync as compileTemplate } from '../../util/Template';

/**
 * @classdesc
 * Esta clase se encarga de general el panel de los controles.
 * @property {String} name Nombre del panel.
 * @property {String} position Posición del panel.
 *
 * @api
 */
class CollapsiblePanel extends Panel {
  constructor(name, options = {}) {
    super(name, options);

    /**
     * @private
     * @type {IDEE.Map}
     * @expose
     */
    this._map = null;

    /**
     * @private
     * @type {HTMLElement}
     * @expose
     */
    this._buttonPanel = null;

    /**
     * @private
     * @type {boolean}
     * @expose
     */
    this._collapsible = false;
    if (isBoolean(options.collapsible)) {
      this._collapsible = options.collapsible;
    }

    /**
     * @private
     * @type {boolean}
     * @expose
     */
    this._collapsed = this._collapsible;
    if (isBoolean(options.collapsed)) {
      this._collapsed = (options.collapsed && (this._collapsible === true));
    }

    /**
     * @private
     * @type {boolean}
     * @expose
     */
    this._multiActivation = false;
    if (isBoolean(options.multiActivation)) {
      this._multiActivation = options.multiActivation;
    }

    /**
     * @private
     * @type {string}
     * @expose
     */
    if (isString(options.className)) {
      this._className = options.className;
    }

    /**
     * @private
     * @type {string}
     * @expose
     */
    if (isString(options.collapsedButtonClass)) {
      this._collapsedButtonClass = options.collapsedButtonClass;
    } else if ((this.position === Position.LEFT) || (this.position === Position.CTL)) {
      this._collapsedButtonClass = 'g-cartografia-flecha-derecha';
    } else if ((this.position === Position.RIGHT) || (this.position === Position.CTR)
        || (this.position === Position.DOWN)) {
      this._collapsedButtonClass = 'g-cartografia-flecha-izquierda';
    }

    /**
     * @private
     * @type {string}
     * @expose
     */
    if (isString(options.openedButtonClass)) {
      this._openedButtonClass = options.openedButtonClass;
    } else if (isString(options.collapsedButtonClass) && options.collapsedButtonClass !== null) {
      this._openedButtonClass = options.collapsedButtonClass;
    } else if ((this.position === Position.LEFT) || (this.position === Position.CTL)) {
      this._openedButtonClass = 'g-cartografia-flecha-izquierda';
    } else if ((this.position === Position.RIGHT) || (this.position === Position.CTR)
        || (this.position === Position.DOWN)) {
      this._openedButtonClass = 'g-cartografia-flecha-derecha';
    }

    /**
     * @private
     * @type {HTMLElement}
     * @expose
     */
    this.element = null;

    /** Contains the tool container of facade map
     *
     * @private
     * @type {HTMLElement}
     * @expose
     */
    this._areaContainer = null;

    /** It contains the container that is displayed when the panel is opened
     * this contains the loaded controls.
     *
     * @private
     * @type {HTMLElement}
     * @expose
     */
    this._controlsContainer = null;

    /**
     * @private
     * @type {PanelButton}
     */
    this._panelButtonObj = null;
  }

  destroy() {
    if (this.element != null && this._areaContainer != null) {
      this._areaContainer.removeChild(this.element);
    }
    this.element = null;
    this._areaContainer = null;
    this._controlsContainer = null;
  }

  addTo(map) {
    this.map = map;
    this._map = map;
    this._areaContainer = this._map.getToolsContainer(this.position);
    this.element = compileTemplate(controlPanelTemplate);
    this._panelButtonObj = new PanelButton(this.name, {
      tooltip: this._tooltip,
      classList: 'm-control-panel-btn',
      order: this._order,
      panel: this,
    });
    this._panelButtonObj.createElement();
    this._buttonPanel = this._panelButtonObj.element;

    if (this.element && this._buttonPanel) {
      this.element.insertBefore(this._buttonPanel, this.element.firstChild);
    }

    if (this._order) {
      this.element.style.setProperty('order', this._order, 'important');
      this.element.setAttribute('tabIndex', this._order);
    } else {
      this.element.style.setProperty('order', 100, 'important');
    }

    this._tabAccessibility();

    if (!isNullOrEmpty(this._tooltip)) {
      this.element.setAttribute('title', this._tooltip);
    }

    if (!isNullOrEmpty(this._className)) {
      this._className.split(/\s+/).forEach((className) => {
        this.element.classList.add(className);
      });
    }

    if (!this._collapsible) {
      this.element.classList.add('no-collapsible');
    }
    const openFn = this._panelButtonObj.openPanel;
    this._panelButtonObj.openPanel = () => {
      openFn.bind(this._panelButtonObj)();
      this.open();
    };
    const closeFn = this._panelButtonObj.closePanel;
    this._panelButtonObj.closePanel = () => {
      closeFn.bind(this._panelButtonObj)();
      this.collapse();
    };

    if (this._collapsed) {
      this.collapse();
    } else {
      this._panelButtonObj.click();
    }

    this._controlsContainer = this.element.querySelector('div.m-controls-panel');
    this._areaContainer.appendChild(this.element);
    this.addControls(this.controls);
    this.fire(EventType.ADDED_TO_MAP, this.element);
  }

  _collapse(html) {
    html.classList.remove('opened');
    this._buttonPanel.classList.remove(this._openedButtonClass);
    html.classList.add('collapsed');
    this._buttonPanel.classList.add(this._collapsedButtonClass);
    this._collapsed = true;
    this.fire(EventType.HIDE);
  }

  _open(html) {
    html.classList.remove('collapsed');
    this._buttonPanel.classList.remove(this._collapsedButtonClass);
    html.classList.add('opened');
    this._buttonPanel.classList.add(this._openedButtonClass);
    this._collapsed = false;
    this.fire(EventType.SHOW);
  }

  attachControl(control) {
    control.setPanel(this);
  }

  getControlsContainer() {
    return this._controlsContainer;
  }
}

export default CollapsiblePanel;
