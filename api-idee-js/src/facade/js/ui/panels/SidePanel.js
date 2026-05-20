/**
 * @module IDEE/ui/panels/SidePanel
 */
import 'assets/css/panel';
import panelTemplate from 'templates/panel';
import * as Position from '../position';
import {
  isNullOrEmpty,
  isNumber,
  isBoolean,
} from '../../util/Utils';
import Panel from './Panel';
import * as EventType from '../../event/eventtype';
import { compileSync as compileTemplate } from '../../util/Template';
import OverviewMapButton from '../buttons/OverviewMapButton';

/**
 * @classdesc
 * Esta clase se encarga de general el panel de los plugins.
 * @property {String} name Nombre del panel.
 * @property {String} position Posición del panel.
 *
 * @api
 */
class SidePanel extends Panel {
  constructor(name, options = {}) {
    super(name, options);

    /**
     * @private
     * @type {IDEE.Map}
     * @expose
     */
    this.map = null;

    /**
     * @private
     * @type {OverviewMapButton}
     * @expose
     */
    this.button = options.button instanceof OverviewMapButton
      ? options.button : null;

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
    this.position = Position.isRightOrLeft(options.position) ? options.position : Position.RIGHT;

    /**
     * @type {Number}
     * @api
     * @expose
     */
    if (isNumber(options.minWidth)) {
      this.minWidth = options.minWidth;
    }

    /**
     * @type {Number}
     * @api
     * @expose
     */
    if (isNumber(options.maxWidth)) {
      this.maxWidth = options.maxWidth;
    }

    /**
     * Defines minimun height of this panel if is in compact mode
     *
     * @type {Number}
     * @api
     * @expose
     */
    if (isNumber(options.minHeightCompact)) {
      this.minHeightCompact = options.minHeightCompact;
    }

    /**
     * Defines maximun height of this panel if is in compact mode
     *
     * @type {Number}
     * @api
     * @expose
     */
    if (isNumber(options.maxHeightCompact)) {
      this.maxHeightCompact = options.maxHeightCompact;
    }

    /**
     * By default panels are collapsible and start collapsed.
     *
     * @private
     * @type {boolean}
     * @expose
     */
    this._collapsible = true;
    if (isBoolean(options.collapsible)) {
      this._collapsible = options.collapsible;
    }

    /**
     * @private
     * @type {boolean}
     * @expose
     */
    this._collapsed = true;

    if (!this._collapsible) {
      this._collapsed = false;
    } else if (isBoolean(options.collapsed)) {
      this._collapsed = options.collapsed;
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

    this.once(EventType.ADDED_TO_MAP, () => {
      if (this.button && !this._collapsed) {
        this.button.activate();
      }
    });
  }

  destroy() {
    if (this.element != null) {
      this.element.remove();
    }
  }

  addTo(map) {
    this.map = map;

    this.element = compileTemplate(panelTemplate);
    this.element.id = `plugin-panel-${this.name}`;

    this.createTitlePanel();

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

  _collapse(html) {
    this._collapsed = true;
    this.fire(EventType.HIDE);
  }

  _open(html) {
    this._collapsed = false;
    this.fire(EventType.SHOW);
  }

  attachControl(control) {
    control.setParentContainer(this);
  }

  setCollapsed(flag) {
    this._collapsed = flag;
  }
}

export default SidePanel;
