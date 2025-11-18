/**
 * @module IDEE/plugin/Infocoordinates
 */
import 'assets/css/infocoordinates';
import InfocoordinatesControl from './infocoordinatescontrol';
import api from '../../api';
import { getValue } from './i18n/language';
import myhelp from '../../templates/myhelp';

import es from './i18n/es';
import en from './i18n/en';

export default class Infocoordinates extends IDEE.Plugin {
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
    super('infocoordinates', {
      position: options.position || 'right',
      tooltip: options.tooltip || getValue('tooltip'),
    });
    /**
     *  Decimal digits fixed on geographic coordinates
     * @public     *
     * @type {int}
     */
    this.decimalGEOcoord_ = 4;
    /**
     *  Decimal digits fixed on projected coordinates
     * @public     *
     * @type {int}
     */
    this.decimalUTMcoord_ = 2;

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
     * Metadata from api.json
     * @private
     * @type {Object}
     */
    this.metadata_ = api.metadata;

    /**
     * URL to the help for the icon
     * @private
     * @type {string}
     */
    this.helpUrl_ = options.helpUrl || 'https://www.ign.es/';

    /**
     * Output Format
     * @private
     * @type {string}
     */
    this.outputDownloadFormat_ = options.outputDownloadFormat || 'txt';

    /**
     *@private
     *@type { Number }
     */
    this.order = options.order >= -1 ? options.order : null;

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
    return IDEE.language.getTranslation(lang).infocoordinates;
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
    // Crear el botón por separado
    this.button = new IDEE.ui.Button(this.name, {
      position: this.position,
      tooltip: this.tooltip,
      svgPath: `plugins/${this.name}/images/icon.svg`,
    });
    map.addButtons(this.button);
    // Crear el panel por separado
    this.panel = new IDEE.ui.Panel(this.name, {
      collapsed: this.collapsed_,
      collapsible: this.collapsible_,
      position: this.position,
      className: 'm-plugin-infocoordinates',
      collapsedButtonClass: 'icon-target',
      tooltip: this.tooltip,
      order: this.order,
    });

    map.addPanels(this.panel);

    this.controls.push(new InfocoordinatesControl(
      this.decimalGEOcoord_,
      this.decimalUTMcoord_,
      this.helpUrl_,
      this.order,
      this.outputDownloadFormat_,
    ));
    // this.controls.push(new InfocoordinatesControl({
    //   decimalGEOcoord: this.decimalGEOcoord_,
    //   decimalUTMcoord: this.decimalUTMcoord_,
    //   helpUrl: this.helpUrl_,
    //   order: this.order,
    //   outputDownloadFormat: this.outputDownloadFormat_,
    // }));
    this.panel.addControls(this.controls);

    this.button.panel = this.panel;
    this.panel.button = this.button;
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.map.removeControls([this.control_]);
    this.control_.deactivate();
    this.control_.removeLayerFeatures();
    [this.control_, this.panel, this.map] = [null, null, null];
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
   * Get the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name}=${this.position}*${this.collapsed_}*${this.collapsible_}*${this.tooltip}*${this.decimalGEOcoord_}*${this.decimalUTMcoord_}*${this.helpUrl_}*${this.outputDownloadFormat_}`;
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
            urlImages: `${IDEE.config.API_IDEE_URL}plugins/infocoordinates/images/`,
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
              help12: getValue('textHelp.help12'),
              help13: getValue('textHelp.help13'),
            },
          },
        });
        success(html);
      }),
    };
  }
}
