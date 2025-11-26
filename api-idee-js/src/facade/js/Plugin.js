/**
 * @module IDEE/Plugin
 */
import Base from './Base';
import Button from './ui/Button';
import Panel from './ui/Panel';

import { isArray, isNullOrEmpty } from './util/Utils';
import Control from './control/Control';
import Tool from './tool/Tool';
import Exception from './exception/exception';

/**
 * @classdesc
 * Esta clase crea los métodos necesarios para añadir los plugins al mapa.
 * @extends {IDEE.facade.Base}
 * @api
 */
class Plugin extends Base {
  constructor(name, options = {}) {
    super(options);

    this.name = name;
    this.tooltip = options.tooltip || '';
    this.position = options.position || 'right';
    this.svgPath = options.svgPath || null;
    this.minPanelWidth = 256;
    this.maxPanelWidth = 360;

    this.map = null;
    this.button = null;
    this.panel = null;
    this.controls = [];
    this.tools = [];
  }

  /**
   * Este método añade el plugin al mapa.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Añade el plugin al mapa.
   * @api
   */
  addTo(map) {
    this.map = map;

    this.button = new Button(this.name, {
      position: this.position,
      tooltip: this.tooltip,
      svgPath: this.svgPath,
    });
    map.addButtons(this.button);

    this.panel = new Panel(this.name, {
      tooltip: this.tooltip,
      position: this.position,
      minWidth: this.minPanelWidth,
      maxWidth: this.maxPanelWidth,
    });
    map.addPanels(this.panel);

    this.button.panel = this.panel;
    this.panel.button = this.button;

    map.addControls(this.controls);
  }

  /**
   * Añade la vista al mapa.
   * @public
   * @function
   * @param {IDEE.Map} map Añade la vista al mapa.
   * @api
   */
  createView(map) {}

  addControl(controlsParamVar) {
    let controlsParam = controlsParamVar;
    if (!isNullOrEmpty(controlsParam)) {
      if (!isArray(controlsParam)) {
        controlsParam = [controlsParam];
      }

      controlsParam.forEach((controlParamVar) => {
        const controlParam = controlParamVar;
        let control;
        let panel;

        if (controlParam instanceof Control) {
          control = controlParam;
        } else {
          Exception('El control "'.concat(controlParam).concat('" no es un control válido.'));
        }

        if (!isNullOrEmpty(panel) && !panel.hasControl(control)) {
          panel.addControls(control);
          this.addPanels(panel);
        } else if (!isNullOrEmpty(control)) {
          control.parentPlugin = this;
          this.controls.push(control);
        }
      });
      if (!isNullOrEmpty(this.map)) {
        this.map.addControls(this.controls);
      }
    }
    return this;
  }

  addControlToPlugin(control) {
    if (isNullOrEmpty(this.panel.panelContent)) {
      this.panel.createContentPanel();
    }
    this.panel.panelContent.appendChild(control.getImpl().element);
  }

  addTool(toolsParamVar) {
    let toolsParam = toolsParamVar;
    if (!isNullOrEmpty(toolsParam)) {
      if (!isArray(toolsParam)) {
        toolsParam = [toolsParam];
      }

      toolsParam.forEach((toolParamVar) => {
        const toolParam = toolParamVar;
        let tool;
        let panel;

        if (toolParam instanceof Tool) {
          tool = toolParam;
        } else {
          Exception('El tool "'.concat(toolParam).concat('" no es un tool válido.'));
        }

        if (!isNullOrEmpty(panel) && !panel.hasTool(tool)) {
          panel.addTools(tool);
          this.addPanels(panel);
        } else if (!isNullOrEmpty(tool)) {
          tool.addTo(this);
          this.tools.push(tool);
        }
      });
      // this.getImpl().addControls(controls);
    }
    return this;
  }

  addToolToPlugin(tool) {
    if (isNullOrEmpty(this.panel.panelContent)) {
      this.panel.createContentPanel();
      this.createToolsPanel();
    }

    const ulElement = this.panel.panelContent.querySelector(`#plugin-panel-tools-${this.name}`);
    ulElement.appendChild(tool.element);
  }

  createToolsPanel() {
    this.toolsPanel = document.createElement('ul');
    this.toolsPanel.classList.add('m-api-idee-tabs-container');
    this.toolsPanel.id = `plugin-panel-tools-${this.name}`;
    this.panel.panelContent.appendChild(this.toolsPanel);
  }

  /**
   * Devuelve los plugins.
   * @public
   * @function
   * @param {Array} controls Devuelve los plugins.
   * @api
   */
  getControls() {
    return this.controls;
  }

  getTools() {
    return this.tools;
  }

  equals(obj) {
    return obj instanceof Plugin && obj.name === this.name;
  }
}

export default Plugin;
