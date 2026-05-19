/**
 * @module IDEE/plugin/Basic
 */
import '../assets/css/basic';
import '../assets/css/fonts';
import BasicControl from './basiccontrol';
import myhelp from '../../templates/myhelp';
import { getValue } from './i18n/language';

import es from './i18n/es';
import en from './i18n/en';

export default class Basic extends IDEE.Plugin {
  /**
   * @classdesc
   * Fachada del plugin plantilla
   *
   * @constructor
   * @extends {IDEE.Plugin}
   * @param {Object} options Opciones para el plugin
   * @api
   */
  constructor(options = {}) {
    super('basic', {
      position: options.position ?? 'right',
      tooltip: options.tooltip ?? getValue('tooltip'),
      order: options.order,
      svgPath: options.svgPath ?? 'https://componentes.idee.es/estaticos/Simbologia/svg/icons_cota/icn_foto.svg',
      ...options,
    });

    /**
     * Fachada del mapa
     * @private
     * @type {IDEE.Map}
     */
    this.map = null;

    /**
     * Lista de controles
     * @private
     * @type {Array<IDEE.Control>}
     */
    this.controls = [];

    /**
     * Nombre de clase de la vista html
     * @public
     * @type {string}
     */
    this.className = 'm-plugin-basic';

    /**
     * Parámetros del plugin
     * @public
     * @type {object}
     */
    this.options = options;
  }

  /**
   * Esta función añade el plugin al mapa.
   *
   * @public
   * @function
   * @param {IDEE.Map} map el mapa al que se añade el plugin
   * @api stable
   */
  addTo(map) {
    this.map = map;
    this.controls.push(new BasicControl(this.isDraggable));

    this.button = new IDEE.ui.buttons.SidePanelButton(this.name, {
      position: this.position,
      tooltip: this.tooltip,
      svgPath: this.svgPath,
      order: this.order,
    });
    map.addButtons(this.button);

    this.panel = new IDEE.ui.Panel('Basic', {
      tooltip: this.tooltip,
      position: this.position,
      collapsed: this.collapsed,
      className: this.className,
      collapsedButtonClass: 'icon-basic-wrench',
      order: this.order,
    });

    this.button.panel = this.panel;
    this.panel.button = this.button;

    this.panel.addControls(this.controls);

    map.addPanels(this.panel);
  }

  /**
   * Obtiene el nombre del plugin
   *
   * @getter
   * @function
   */
  get name() {
    return this.name;
  }

  /**
   * Esta función destruye el plugin
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.map.removeControls(this.controls);
  }

  /**
   * Esta función obtiene los parámetros de
   * la API REST del plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name}=${this.position}*${this.collapsed}*${this.tooltip}`;
  }

  /**
   * Esta función obtiene los parámetros de
   * la API REST en base64 del plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRestBase64() {
    return `${this.name}=base64=${IDEE.utils.encodeBase64(this.options)}`;
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
    return IDEE.language.getTranslation(lang).backimglayer;
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
            urlImages: `${IDEE.config.API_IDEE_URL}plugins/basic/images/`,
            translations: {
              help1: getValue('textHelp.help1'),
              help2: getValue('textHelp.help2'),
              help3: getValue('textHelp.help3'),
            },
          },
        });
        success(html);
      }),
    };
  }
}
