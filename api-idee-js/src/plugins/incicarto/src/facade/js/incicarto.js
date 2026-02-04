/**
 * @module IDEE/plugin/Incicarto
 */
import '../assets/css/incicarto';
import IncicartoControl from './incicartocontrol';
import api from '../../api';
import { getValue } from './i18n/language';
import myhelp from '../../templates/myhelp';

import es from './i18n/es';
import en from './i18n/en';

export default class Incicarto extends IDEE.Plugin {
  /**
   * @classdesc
   * Main facade plugin object. This class creates a plugin
   * object which has an implementation Object
   *
   * @constructor
   * @extends {IDEE.Plugin}
   * @param {Object} impl implementation object
   * @api stable
   */
  constructor(options = {}) {
    super('incicarto', {
      position: options.position || 'right',
      tooltip: options.tooltip || getValue('tooltip'),
      order: options.order,
    });

    /**
     * Option to allow the plugin to be collapsed or not
     * @private
     * @type {Boolean}
     */
    this.collapsed_ = options.collapsed;
    if (this.collapsed_ === undefined) this.collapsed_ = true;

    /**
     * Option to allow the plugin to be collapsible or not
     * @private
     * @type {Boolean}
     */
    this.collapsible_ = options.collapsible;
    if (this.collapsible_ === undefined) this.collapsible_ = true;

    /**
     * Option to allow the plugin to be collapsible or not
     * @private
     * @type {Boolean}
     */
    this.wfszoom_ = parseInt(options.wfszoom, 10);
    if (this.wfszoom_ === undefined || Number.isNaN(this.wfszoom_)) this.wfszoom_ = 12;

    this.controllist_ = options.controllist || [{
      id: 'themeList',
      name: 'Temas de errores',
      mandatory: true,
    },
    {
      id: 'errorList',
      name: 'Tipos de errores',
      mandatory: true,
    },
    {
      id: 'productList',
      name: 'Lista de productos',
      mandatory: true,
    },
    ];

    this.interfazmode_ = options.interfazmode;
    if (this.interfazmode_ === undefined) this.interfazmode_ = 'simple';

    this.buzones_ = options.buzones || [];
    this.themes_ = options.themeList || [];
    this.errors_ = options.errorList || [];
    this.products_ = options.productList || [];

    this.prefixSubject_ = options.prefixSubject;
    if (this.prefixSubject_ === undefined) this.prefixSubject_ = 'Incidencia cartografía - ';

    /**
     * Metadata from api.json
     * @private
     * @type {Object}
     */
    this.metadata_ = api.metadata;

    /**
     * Option to allow the plugin to be draggable or not
     * @private
     * @type {Boolean}
     */
    this.isDraggable = !IDEE.utils.isUndefined(options.isDraggable) ? options.isDraggable : false;

    /**
     * Plugin parameters
     * @public
     * @type {object}
     */
    this.options = options;
  }

  /**
   * Return plugin language
   *
   * @public
   * @function
   * @param {string} lang type language
   * @api stable
   */
  static getJSONTranslations(lang) {
    if (lang === 'en' || lang === 'es') {
      return (lang === 'en') ? en : es;
    }
    return IDEE.language.getTranslation(lang).incicarto;
  }

  /**
   * This function adds this plugin into the map
   *
   * @public
   * @function
   * @param {IDEE.Map} map the map to add the plugin
   * @api stable
   */
  addTo(map) {
    this.map = map;

    this.button = new IDEE.ui.Button(this.name, {
      position: this.position,
      tooltip: this.tooltip,
      svgPath: `plugins/${this.name}/images/icon.svg`,
      order: this.order,
    });
    map.addButtons(this.button);

    this.panel = new IDEE.ui.Panel(this.name, {
      className: 'm-incicarto',
      collapsed: this.collapsed_,
      collapsible: this.collapsible_,
      position: IDEE.ui.position[this.position],
      collapsedButtonClass: 'icon-incicarto',
      tooltip: this.tooltip,
      order: this.order,
    });
    map.addPanels(this.panel);

    if (this.controllist_[0].id === 'themeList') {
      this.errThemes_ = this.controllist_[0];
    }
    if (this.controllist_[1].id === 'errorList') {
      this.errTypes_ = this.controllist_[1];
    }
    if (this.controllist_[2].id === 'productList') {
      this.errProducts_ = this.controllist_[2];
    }

    this.control = new IncicartoControl({
      wfszoom: this.wfszoom_,
      controllist: this.controllist_,
      interfazmode: this.interfazmode_,
      prefixSubject: this.prefixSubject_,
      buzones: this.buzones_,
      themes: this.themes_,
      errors: this.errors_,
      products: this.products_,
      errThemes: this.errThemes_,
      errTypes: this.errTypes_,
      errProducts: this.errProducts_,
      isDraggable: this.isDraggable,
    });

    this.controls.push(this.control);
    this.panel.addControls(this.controls);

    this.map.on(IDEE.evt.ADDED_LAYER, () => {
      if (this.control !== null) {
        this.control.renderLayers();
      }
    });

    this.map.on(IDEE.evt.REMOVED_LAYER, () => {
      if (this.control !== null) {
        this.control.renderLayers();
      }
    });
    this.button.panel = this.panel;
    this.panel.button = this.button;
  }

  /**
   * Get the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    // eslint-disable-next-line max-len
    // *${JSON.stringify(this.buzones_)}*${JSON.stringify(this.controllist_)}*${JSON.stringify(this.themes_)}*${JSON.stringify(this.errors_)}*${JSON.stringify(this.products_)}
    return `${this.name}=${this.position}*${this.collapsed_}*${this.collapsible_}*${this.tooltip}*${this.wfszoom_}*${this.prefixSubject_}*${this.interfazmode_}*${this.isDraggable}`;
  }

  /**
   * Gets the API REST Parameters in base64 of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRestBase64() {
    return `${this.name}=base64=${IDEE.utils.encodeBase64(this.options)}`;
  }

  /**
   * This function gets metadata plugin
   *
   * @public
   * @function
   * @api stable
   */
  getMetadata() {
    return this.metadata_;
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    this.control.resetInteractions();
    this.map.removeButton(this.button);
    this.map.removePanel(this.panel);
  }

  /**
   * Obtiene la ayuda del plugin
   *
   * @function
   * @public
   * @api
   */
  getHelp() {
    return {
      title: this.name,
      content: new Promise((success) => {
        const html = IDEE.template.compileSync(myhelp, {
          vars: {
            urlImages: `${IDEE.config.API_IDEE_URL}plugins/incicarto/images/`,
            translations: {
              help1: getValue('textHelp.help1'),
              help2: getValue('textHelp.help2'),
              help3: getValue('textHelp.help3'),
              help4: getValue('textHelp.help4'),
              help5: getValue('textHelp.help5'),
              help6: getValue('textHelp.help6'),
              help7: getValue('textHelp.help7'),
              help8: getValue('textHelp.help8'),
              help9: getValue('textHelp.help9'),
              help10: getValue('textHelp.help10'),
              help11: getValue('textHelp.help11'),
            },
          },
        });
        success(html);
      }),
    };
  }
}
