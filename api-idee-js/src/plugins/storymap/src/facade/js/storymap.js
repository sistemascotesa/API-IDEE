/**
 * @module IDEE/plugin/StoryMap
 */
import '../assets/css/storymap';
import api from '../../api';
import StoryMapControl from './storymapcontrol';
import myhelp from '../../templates/myhelp';
import StoryMapJSON1 from '../../../test/StoryMapJSON1';
import StoryMapJSON2 from '../../../test/StoryMapJSON2';
import { getValue } from './i18n/language';

import es from './i18n/es';
import en from './i18n/en';

export default class StoryMap extends IDEE.Plugin {
  /**
   * @constructor
   * @extends {IDEE.Plugin}
   * @param {Object} impl implementation object
   * @api
   */
  constructor(options = {}) {
    super('storymap', {
      position: options.position || 'right',
      tooltip: options.tooltip || getValue('tooltip'),
    });

    /**
     * This parameter set if the plugin is collapsed
     * @private
     * @type {boolean}
     */
    this.collapsed_ = options.collapsed === true;

    /**
     * Metadata from api.json
     * @private
     * @type {Object}
     */
    this.metadata_ = api.metadata;

    /**
    * JSON HTML
    *
    * @private
    * @type {string}
    */
    this.content_ = options.content || { es: StoryMapJSON2, en: StoryMapJSON1 };

    /**
       * Delay auto move scroll
       *
       * @private
       * @type {string}
       */
    this.delay = options.delay || 2000;

    /**
      * collapsible panel
      *
      * @private
      * @type {string}
      */
    this.collapsible = options.collapsible || false;

    /**
     * Content of index
     * @private
     * @type {Object}
     */
    this.indexInContent = options.indexInContent || false;

    /**
     * Options of the plugin
     * @private
     * @type {Object}
     */
    this.options_ = options;

    /**
     * Option to allow the plugin to be draggable or not
     * @private
     * @type {Boolean}
     */
    this.isDraggable = !IDEE.utils.isUndefined(options.isDraggable) ? options.isDraggable : false;
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
    return IDEE.language.getTranslation(lang).storymap;
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
    });
    window.map = map;
    window.mapjs = map;
    map.addButtons(this.button);
    this.panel = new IDEE.ui.Panel(this.name, {
      tooltip: this.tooltip,
      position: IDEE.ui.position[this.position],
      minWidth: this.minPanelWidth,
      maxWidth: this.maxPanelWidth,
      className: 'm-plugin-storymap',
      collapsible: this.collapsible,
      collapsed: this.collapsed_,
      collapsedButtonClass: 'icon-capas2',
    });
    map.addPanels(this.panel);
    this.controls.push(new StoryMapControl(
      this.content_[IDEE.language.getLang()],
      this.delay,
      this.indexInContent,
      this.isDraggable,
    ));
    this.panel.addControls(this.controls);

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
    return `${this.name}=${this.position}*${this.collapsed}*${this.tooltip}*${this.delay}*${this.isDraggable}`;
  }

  /**
   * Gets the API REST Parameters in base64 of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRestBase64() {
    return `${this.name}=base64=${IDEE.utils.encodeBase64(this.options_)}`;
  }

  /**
   * This function compares plugins
   *
   * @public
   * @function
   * @param {IDEE.Plugin} plugin to compare
   * @api
   */
  equals(plugin) {
    return plugin instanceof StoryMap;
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
            urlImages: `${IDEE.config.API_IDEE_URL}plugins/storymap/images/`,
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
            },
          },
        });
        success(html);
      }),
    };
  }
}
