/**
 * @module IDEE/plugin/Modal
 */
import 'assets/css/modal';
import ModalControl from './modalcontrol';
import api from '../../api';
import { getValue } from './i18n/language';
import myhelp from '../../templates/myhelp';
// eslint-disable-next-line import/no-relative-packages
// import { LEFT } from '../../../../../facade/js/ui/position';
// eslint-disable-next-line import/no-relative-packages
import * as Position from '../../../../../facade/js/ui/position';

import es from './i18n/es';
import en from './i18n/en';

export default class Modal extends IDEE.Plugin {
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
    // super();
    const pos = options.position || Position.LEFT;

    super('modal', {
      position: pos,
      tooltip: options.tooltip ?? getValue('tooltip'),
      order: options.order ?? 0,
    });
    /**
     * Facade of the map
     * @private
     * @type {IDEE.Map}
     */
    this.map_ = null;

    /**
     * Array of controls
     * @private
     * @type {Array<IDEE.Control>}
     */
    this.controls_ = [];

    /**
     * Plugin position on window.
     * @private
     * @type {String}
     */
    // this.position_ = options.position || Position.LEFT;
    this.position = pos;

    /**
     * Option to allow the plugin to be collapsed or not
     * @private
     * @type {Boolean}
     */
    this.collapsed = options.collapsed !== undefined ? options.collapsed : true;

    /**
     * Collapsible attribute
     * @private
     * @type {boolean}
     */
    this.collapsible = options.collapsible !== undefined ? options.collapsible : true;

    /**
     * Url of HTML with the content for modal in the selected language.
     * @private
     * @type {String}
     */
    if (options.helpLink && Object.keys(options.helpLink).length > 0) {
      this.url_ = options.helpLink[`${IDEE.language.getLang()}`];
    } else if (IDEE.language.getLang() === 'en') {
      this.url_ = options.url_en || 'template_en';
    } else {
      this.url_ = options.url_es || 'template_es';
    }

    /**
     * Metadata from api.json
     * @private
     * @type {Object}
     */
    this.metadata_ = api.metadata;

    /**
     * Name of the plugin
     * @public
     * @type {String}
     */
    this.name = 'modal';

    /**
     * Plugin tooltip
     *
     * @private
     * @type {string}
     */
    this.tooltip_ = options.tooltip || getValue('tooltip');

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
    return IDEE.language.getTranslation(lang).modal;
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
    this.map_ = map;

    const currentPos = this.position;

    // Si la posición es derecha
    const isRightSide = [
      Position.RIGHT,
      Position.CTR,
      Position.CBR,
      'right',
      'center-top-right',
      'center-bottom-right',
    ].includes(currentPos);

    const buttonPos = isRightSide ? Position.RIGHT : Position.LEFT;

    this.control_ = new ModalControl(this.url_);
    this.controls_.push(this.control_);

    this.button = new IDEE.ui.Button(this.name, {
      position: buttonPos,
      tooltip: this.tooltip,
      svgPath: `plugins/${this.name}/images/icon.svg`,
      order: this.order,
    });
    // map.addButtons(this.button);

    this.button.openPanel = () => {
      this.control_.triggerModal();
      this.button.pressed = false;
    };

    this.button.closePanel = () => {};

    if (this.collapsible !== false) {
      map.addButtons(this.button);
    }
    map.addControls(this.controls_);

    if (this.collapsed === false || this.collapsible === false) {
      setTimeout(() => {
        // triggerModal para asegurar la apertura
        this.control_.triggerModal();
      }, 300);
    }
  }

  /**
   * Get the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    const URL = (this.options.helpLink && Object.keys(this.options.helpLink).length > 0)
      ? [this.options.helpLink.es, this.options.helpLink.en] : [this.url_en, this.url_es];
    return `${this.name}=${this.position_}*${this.collapsed}*${this.collapsible}*${URL[0]}*${URL[1]}`;
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
            urlImages: `${IDEE.config.API_IDEE_URL}plugins/modal/images/`,
            translations: {
              help1: getValue('textHelp.help1'),
              help2: getValue('textHelp.help2'),
              help3: getValue('textHelp.help3'),
              help4: getValue('textHelp.help4'),
            },
          },
        });
        success(html);
      }),
    };
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    if (this.control_) {
      this.control_.getImpl().toggleModal(false);
    }

    if (this.button) {
      this.button.destroy();
    }

    if (this.map_ && this.controls_) {
      this.map_.removeControls(this.controls_);
    }

    this.map_ = null;
    this.control_ = null;
    this.controls_ = [];
    this.button = null;
    this.panel_ = null;
  }
}
