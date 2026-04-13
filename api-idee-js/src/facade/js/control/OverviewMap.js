/**
 * @module IDEE/control/OverviewMap
 */
import 'assets/css/controls/overviewmap';
import myhelp from 'templates/overviewmaphelp';
import OverviewMapImpl from 'impl/control/OverviewMap';
import {
  isUndefined, isNullOrEmpty, isObject, isBoolean,
} from '../util/Utils';
import Exception from '../exception/exception';
import * as Position from '../ui/position';
// eslint-disable-next-line import/no-relative-packages
import Control from './Control';
import { getValue } from '../i18n/language';
import { compileSync } from '../util/Template';
import apiIdee from '../api-idee';

class OverviewMap extends Control {
  /**
  * @classdesc
  * Main facade control object. This class creates a control
  * object which has an implementation Object
  *
  * @constructor
  * @extends {IDEE.Control}
  * @param {Object} impl implementation object
  * @api stable
  */
  constructor(options = {}) {
    if (isUndefined(OverviewMapImpl) || (isObject(OverviewMapImpl)
        && isNullOrEmpty(Object.keys(OverviewMapImpl)))) {
      Exception(getValue('exception').impl_overviewmap);
    }
    const impl = new OverviewMapImpl(
      {
        tipLabel: OverviewMap.translation.title,
        ...options,
      },
    );

    super(
      OverviewMap.NAME,
      impl,
      {
        position: Position.isValid(options.position) ? options.position : Position.LEFT,
        ...options,
      },
    );

    impl.facadeControl = this;

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
    * Options of the control
    * @private
    * @type {Object}
    */
    this.options_ = options || {};

    /**
    * Fixed zoom
    * @private
    * @type {Boolean}
    */
    this.fixed_ = options.fixed !== undefined ? options.fixed : false;

    /**
    * Zoom to make fixed
    * @private
    * @type {Number}
    */
    this.zoom_ = options.zoom !== undefined ? options.zoom : '';

    /**
    * Zoom to make fixed
    * @private
    * @type {Number}
    */
    this.baseLayer_ = options.baseLayer !== undefined ? options.baseLayer : 'WMTS*http://www.ign.es/wmts/ign-base?*IGNBaseTodo*GoogleMapsCompatible*Mapa IGN*false*image/jpeg*false*false*true';

    /**
    * Vendor options
    * @public
    * @type {Object}
    */
    this.vendorOptions = {
      collapsed: options.collapsed,
      collapsible: options.collapsible,
    };

    if (options !== undefined && options.collapsed !== undefined && (options.collapsed === false || options.collapsed === 'false')) {
      this.vendorOptions.collapsed = false;
    }

    if (options !== undefined && options.collapsible !== undefined && (options.collapsible === false || options.collapsible === 'false')) {
      this.vendorOptions.collapsible = false;
    }

    /**
    * Vendor options
    * @public
    * @type {Object}
    */
    this.collapsible = isBoolean(options.collapsible) ? options.collapsible : true;

    /**
    * Vendor options
    * @public
    * @type {Object}
    */
    this.collapsed = isBoolean(options.collapsed) ? options.collapsed : this.collapsible;

    /**
    * Metadata from api.json
    * @private
    * @type {Object}
    */
    this.metadata_ = apiIdee.metadata;

    /**
    * Control parameters
    * @public
    * @type {object}
    */
    this.options = options;
  }

  /**
  * Este método es el que busca Map.js para insertar el control en el DOM
  */
  getView() {
    return this.getImpl().getView();
  }

  getActivationButton(element) {
    return document.createElement('button');
  }

  /**
  * This function creates the view
  *
  * @public
  * @function
  * @param {IDEE.Map} map to add the control
  * @api stable
  */
  createView(map) {
    this.element = new Promise((success, fail) => {
      const html = this.getImpl().getView();
      // const html = IDEE.template.compileSync(template);
      success(html);
    });
    return this.element;
  }

  /**
  * This function adds this control into the map
  *
  * @public
  * @function
  * @param {IDEE.Map} map the map to add the control
  * @api stable
  */
  //   addTo(map) {
  //     this.map = map;

  //     this.control_ = new OverviewMapControl(this.options_, this.vendorOptions);

  //     this.panel_ = new IDEE.ui.ControlPanel('OverviewMap', {
  //       collapsible: true,
  //       className: 'm-overviewmap-panel',
  //       collapsedButtonClass: 'overviewmap-mundo',
  //       tooltip: this.tooltip,
  //       order: this.order,
  //       position: this.position,
  //     });

  //     this.map.addControlPanels(this.panel_);
  //     this.panel_.addControls(this.control_);
  //     // this.control_.setPanel(this.panel_);
  //     this.map.addPanels(this.panel_);

  //     // this.map_.addControls(this.controls_);
  //     this.controls_.push(this.control_);
  //   }

  /**
  * This function gets metadata control
  *
  * @public
  * @function
  * @api stable
  */
  getMetadata() {
    return this.metadata_;
  }

  /**
  * Get the API REST Parameters of the control
  *
  * @function
  * @public
  * @api
  */
  getAPIRest() {
    // position*collapsed*collapsible*fixed*zoom*baseLayer
    return `${this.name}=${this.position}*!${this.vendorOptions.collapsed}*!${this.vendorOptions.collapsible}*!${this.fixed_}*!${this.zoom_}*!${this.baseLayer_}*!${this.tooltip}`;
  }

  /**
  * Gets the API REST Parameters in base64 of the control
  *
  * @function
  * @public
  * @api
  */
  getAPIRestBase64() {
    return `${this.name}=base64=${IDEE.utils.encodeBase64(this.options)}`;
  }

  /**
  * This function compares controls
  *
  * @public
  * @function
  * @param {IDEE.Control} control to compare
  * @api stable
  */
  equals(control) {
    return control instanceof OverviewMap && control.name === OverviewMap.NAME;
  }

  /**
  * Obtiene la ayuda del control
  *
  * @function
  * @public
  * @api
  */
  getHelp() {
    return {
      title: this.name,
      content: new Promise((success) => {
        const html = compileSync(myhelp, {
          vars: {
            urlImages: `${IDEE.config.API_IDEE_URL}facade/assets/images/help/${OverviewMap.NAME}`,
            translations: {
              help1: this.translation.textHelp.help1,
              help2: this.translation.textHelp.help2,
              help3: this.translation.textHelp.help3,
              help4: this.translation.textHelp.help4,
              help5: this.translation.textHelp.help5,
            },
          },
        });
        success(html);
      }),
    };
  }

  /**
  * This function destroys this control
  *
  * @public
  * @function
  * @api
  */
  destroy() {
    super.destroy();
    [this.map, this.panel_] = [null, null, null];
  }
}

/**
 * Name for this control
 * @const
 * @type {string}
 * @public
 * @api stable
 */
OverviewMap.NAME = 'overviewmap';

/**
 * Name for this control
 * @const
 * @type {string}
 * @public
 * @api stable
 */
OverviewMap.translation = getValue(OverviewMap.NAME);

export default OverviewMap;
