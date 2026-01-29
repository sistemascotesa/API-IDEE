/**
 * @module IDEE/plugin/SelectionZoom
 */
// import '/assets/css/selectionzoom';
import '../assets/css/selectionzoom';
import api from '../../api';
import SelectionZoomControl from './selectionzoomcontrol';
import { getValue } from './i18n/language';
import myhelp from '../../templates/myhelp';
// eslint-disable-next-line import/no-relative-packages
import { LEFT } from '../../../../../facade/js/ui/position';

import es from './i18n/es';
import en from './i18n/en';

export default class SelectionZoom extends IDEE.Plugin {
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
    super('selectionzoom', {
      position: options.position ?? LEFT,
      tooltip: options.tooltip ?? getValue('tooltip'),
      order: options.order ?? 0,
    });
    /**
     * Facade of the map
     * @private
     * @type {IDEE.Map}
     */
    this.map = null;

    /**
     * Array of controls
     * @private
     * @type {Array<IDEE.Control>}
     */
    this.controls_ = [];

    /**
     * Plugin name
     * @public
     * @type {String}
     */
    this.name = 'selectionzoom';

    /**
     * Plugin parameters
     * @public
     * @type {object}
     */
    this.options = options;

    /**
     * Layers options
     */
    if ('options' in options) {
      this.newparameterization = true;
      this.layerOpts = options.options;

      /**
       * Get layers id's separated by ',' from
       * new parameterization.
       */
      this.ids = this.layerOpts.map((l) => l.id).toString();

      /**
       * Get layers titles separated by ',' from
       * new parameterization.
       */
      this.titles = this.layerOpts.map((l) => l.title).toString();

      /**
       * Get layers previews separated by ',' from
       * new parameterization.
       */
      this.previews = this.layerOpts.map((l) => l.preview).toString();

      /**
       * Get layers MRE from new parameterization.
       */
      this.bboxs = [];
      this.zooms = [];
      this.centers = [];
      this.layerOpts.forEach((l, i) => {
        if ('bbox' in l) {
          this.bboxs[i] = l.bbox;
          this.zooms[i] = '';
          this.centers[i] = '';
        } else if ('zoom' in l && 'center' in l) {
          this.bboxs[i] = '';
          this.zooms[i] = l.zoom;
          this.centers[i] = l.center;
        } else {
          this.bboxs[i] = '';
          this.zooms[i] = '';
          this.centers[i] = '';
        }
      });
      this.zooms = this.zooms.toString();
    } else {
      this.newparameterization = false;
      /**
       * Layers id's separated by ','.
       * @public
       * @type {Array}
       */
      this.ids = options.ids || '';

      /**
       * Layers titles separated by ','.
       * @public
       * @type { Array }
       */
      this.titles = options.titles || '';

      /**
       * Layers preview urls separated by ','.
       * @public
       * @type { Array }
       */
      this.previews = options.previews || '';

      /**
       * Layers preview urls separated by ','.
       * @public
       * @type { Array }
       */
      this.zooms = options.zooms || '';

      /**
       * Layers preview urls separated by ','.
       * @public
       * @type { Array }
       */
      this.bboxs = options.bboxs || '';
    }

    this.collapsed = options.collapsed !== undefined ? options.collapsed : true;
    this.collapsible = options.collapsible !== undefined ? options.collapsible : true;

    /**
     * Metadata from api.json
     * @private
     * @type {Object}
     */
    this.metadata_ = api.metadata;
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
    return IDEE.language.getTranslation(lang).selectionzoom;
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
      collapsible: this.collapsible,
      collapsed: this.collapsed,
      position: this.position,
      className: 'm-plugin-selectionzoom',
      tooltip: this.tooltip,
      collapsedButtonClass: 'g-selectionzoom-selezoom',
      order: this.order,
    });
    map.addPanels(this.panel);

    const control = new SelectionZoomControl(
      map,
      this.ids,
      this.titles,
      this.previews,
      this.bboxs,
      this.zooms,
      this.centers || '',
      this.order,
      this.newparameterization,
    );

    control.setPanel(this.panel);
    control.activationButton = this.button;
    control.on(IDEE.evt.ADDED_TO_MAP, () => {
      this.fire(IDEE.evt.ADDED_TO_MAP);
    });

    this.controls_.push(control);

    this.panel.addControls(this.controls_);

    this.button.panel = this.panel;
    this.panel.button = this.button;
  }

  /**
   * Gets the API REST Parameters of the plugin
   *
   * @function
   * @public
   * @api
   */
  getAPIRest() {
    return `${this.name}=${this.position_}*${this.collapsible}*${this.collapsed}*${this.ids}*${this.titles}*${this.previews}*${this.bboxs}*${this.zooms}`;
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
   * Turns layerOpts parameter into piece of REST url.
   * @public
   * @function
   * @api
   */
  turnLayerOptsIntoUrl() {
    let ids = '';
    let titles = '';
    let previews = '';
    let bboxs = '';
    let zooms = '';

    this.layerOpts.forEach((l) => {
      const backLayerIndex = this.layerOpts.indexOf(l);
      if (backLayerIndex !== 0) {
        ids += ',';
        titles += ',';
        previews += ',';
        bboxs += ',';
        zooms += ',';
      }

      ids += l.ids;
      titles += l.titles;
      previews += l.previews;
      bboxs += l.zooms;
      zooms += l.zooms;
    });

    return `${ids}s*${titles}*${previews}*${bboxs}*${zooms}`;
  }

  /**
   * This function destroys this plugin
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.map.removeButton(this.button);
    this.map.removePanel(this.panel);
    this.map.removeControls(this.controls_);
    this.map = null;
    this.control_ = null;
    this.controls_ = null;
    this.panel = null;
    this.name = null;
  }

  /**
   * This function compare if pluging recieved by param is instance of IDEE.plugin.SelectionZoom
   *
   * @public
   * @function
   * @param {IDEE.plugin} plugin to comapre
   * @api stable
   */
  equals(plugin) {
    return plugin instanceof SelectionZoom;
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
            urlImages: `${IDEE.config.API_IDEE_URL}plugins/selectionzoom/images/`,
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
