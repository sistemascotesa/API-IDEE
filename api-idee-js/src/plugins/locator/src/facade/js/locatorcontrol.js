/**
 * @module IDEE/control/LocatorControl
 */
import LocatorImpl from 'impl/locator';
import template from '../../templates/locator';
import { getValue } from './i18n/language';
import XYLocatorControl from './xylocatorcontrol';
import IGNSearchLocatorControl from './ignsearchlocatorcontrol';
import InfoCatastroControl from './infocatastrocontrol';

const ID_CONTENEDOR_LOCATOR = '#plugin-panel-content-locator';
const ID_LOCATOR_INFO_CATASTRO = '#m-locator-infocatastro';
const ID_LOCATOR_XYLOCATOR = '#m-locator-xylocator';
const ID_LOCATOR_IGNSEARCH = '#m-locator-ignsearch';

export default class LocatorControl extends IDEE.Control {
  /**
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api
   */
  constructor(
    isDraggable,
    zoom,
    pointStyle,
    byCoordinates,
    byParcelCadastre,
    byPlaceAddressPostal,
    order,
    useProxy,
    statusProxy,
    position,
    pluginName,
  ) {
    if (IDEE.utils.isUndefined(LocatorImpl) || (IDEE.utils.isObject(LocatorImpl)
      && IDEE.utils.isNullOrEmpty(Object.keys(LocatorImpl)))) {
      IDEE.exception(getValue('exception.impl'));
    }

    const impl = new LocatorImpl();
    super('Locator', impl);
    /**
     * Indicates if the control xylocator is added to the plugin
     * @private
     * @type {Boolean|Object}
     */

    this.byCoordinates_ = byCoordinates;

    /**
     * Indicates if the control infocatastro is added to the plugin
     * @private
     * @type {Boolean|Object}
     */
    this.byParcelCadastre_ = byParcelCadastre;

    /**
     * Indicates if the control ignsearchlocator is added to the plugin
     * @private
     * @type {Boolean|Object}
     */
    this.byPlaceAddressPostal_ = byPlaceAddressPostal;

    /**
     * Option to allow the plugin to be draggable or not
     * @private
     * @type {Boolean}
     */
    this.isDraggable_ = isDraggable;

    /**
     * Zoom
     * @private
     * @type {Number}
     */
    this.zoom_ = zoom;

    /**
     * Type of icon to display when a punctual type result is found
     * @private
     * @type {string}
     */
    this.pointStyle_ = pointStyle;

    /**
     * Order of plugin
     * @public
     * @type {Number}
     */
    this.order = order;

    /**
     * Indicates if you want to use proxy in requests
     * @private
     * @type {Number}
     */
    this.useProxy = useProxy;

    /**
     * Stores the proxy state at plugin load time
     * @private
     * @type {Boolean}
     */
    this.statusProxy = statusProxy;

    /**
     * Position of the plugin
     *
     * @private
     * @type {String} 'left' | 'right'
     */
    this.position = position || 'right';

    this.pluginName = pluginName;

    /**
     * Control activated
     * @public
     * @type {Control}
     */
    this.control = null;
  }

  /**
   * This function creates the view
   *
   * @public
   * @function
   * @param {IDEE.Map} map to add the control
   * @api
   */
  createView(map) {
    this.map_ = map;
    return new Promise((success, fail) => {
      const html = IDEE.template.compileSync(template, {
        vars: {
          byParcelCadastre: this.byParcelCadastre_,
          byCoordinates: this.byCoordinates_,
          byPlaceAddressPostal: this.byPlaceAddressPostal_,
          translations: {
            headertitle: getValue('tooltip'),
            infocatastro: getValue('infocatastro'),
            xylocator: getValue('xylocator'),
            ignsearch: getValue('ignsearch'),
          },
        },
      });
      this.html = html;

      if (this.byParcelCadastre_) {
        // infocatastro
        this.infocatastroControl = new InfoCatastroControl(
          this.map_,
          this.zoom_,
          this.pointStyle_,
          this.byParcelCadastre_,
          this.position,
          this.pluginName,
        );
        html.querySelector(ID_LOCATOR_INFO_CATASTRO).addEventListener('click', () => {
          this.deactive(html, 'infocatastro');
          this.infocatastroControl.active(html);
          this.control = this.infocatastroControl;
        });
        html.querySelector(ID_LOCATOR_INFO_CATASTRO).addEventListener('keydown', ({ key }) => {
          if (key === 'Enter') {
            this.deactive(html, 'infocatastro');
            this.infocatastroControl.active(html);
            this.control = this.infocatastroControl;
          }
        });
        this.infocatastroControl.on('infocatastro:locationCentered', (data) => {
          this.fire('infocatastro:locationCentered', data);
        });
      }
      if (this.byCoordinates_) {
        // xylocator
        this.xylocatorControl = new XYLocatorControl(
          this.map_,
          this.zoom_,
          this.pointStyle_,
          this.byCoordinates_,
          this.position,
          this.pluginName,
        );
        html.querySelector(ID_LOCATOR_XYLOCATOR).addEventListener('click', () => {
          this.deactive(html, 'xylocator');
          this.xylocatorControl.active(html);
          this.control = this.xylocatorControl;
        });
        html.querySelector(ID_LOCATOR_XYLOCATOR).addEventListener('keydown', ({ key }) => {
          if (key === 'Enter') {
            this.deactive(html, 'xylocator');
            this.xylocatorControl.active(html);
            this.control = this.xylocatorControl;
          }
        });
        this.xylocatorControl.on('xylocator:locationCentered', (data) => {
          this.fire('xylocator:locationCentered', data);
        });
      }
      if (this.byPlaceAddressPostal_) {
        // ignsearchlocator
        this.ignsearchControl = new IGNSearchLocatorControl(
          this.map_,
          this.zoom_,
          this.pointStyle_,
          this.byPlaceAddressPostal_,
          this.useProxy,
          this.statusProxy,
          this.position,
          this.pluginName,
        );
        this.on(IDEE.evt.ADDED_TO_MAP, () => {
          this.ignsearchControl.initializateAddress(html);
          this.control = this.ignsearchControl;
          html.querySelector(ID_LOCATOR_IGNSEARCH).click();
        });
        html.querySelector(ID_LOCATOR_IGNSEARCH).addEventListener('click', () => {
          this.deactive(html, 'ignsearch');
          this.ignsearchControl.active(html);
          this.control = this.ignsearchControl;
        });
        html.querySelector(ID_LOCATOR_IGNSEARCH).addEventListener('keydown', ({ key }) => {
          if (key === 'Enter') {
            this.deactive(html, 'ignsearch');
            this.ignsearchControl.active(html);
            this.control = this.ignsearchControl;
          }
        });
        this.ignsearchControl.on('ignsearchlocator:entityFound', (extent) => {
          this.fire('ignsearchlocator:entityFound', [extent]);
        });
      }
      if (this.isDraggable_) {
        IDEE.utils.draggabillyPlugin(this.getPanel(), '#m-locator-title');
      }
      this.accessibilityTab(html);
      this.addSvgs();
      success(html);
    });
  }

  /**
   * This function adds the svgs to the control
   *
   * @public
   * @function
   * @api
   */
  addSvgs() {
    const ignSearchTab = this.html.querySelector(ID_LOCATOR_IGNSEARCH);
    const xyLocatorTab = this.html.querySelector(ID_LOCATOR_XYLOCATOR);
    const infoCatastroTab = this.html.querySelector(ID_LOCATOR_INFO_CATASTRO);

    IDEE.utils.loadSvgByUrl('locator', 'ignsearchicon', ignSearchTab);
    IDEE.utils.loadSvgByUrl('locator', 'xylocatoricon', xyLocatorTab);
    IDEE.utils.loadSvgByUrl('locator', 'infocatastroicon', infoCatastroTab);
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {IDEE.Control} control to compare
   * @api
   */
  equals(control) {
    return control instanceof LocatorControl;
  }

  /**
   * This function deactivates the activated control
   * before activating another
   *
   * @public
   * @function
   * @param {Node} html
   * @param {String} control
   * @api
   */
  deactive(html, control) {
    const active = html.querySelector('#m-locator-previews .activated');
    if (active && !active.id.includes(control)) {
      this.control.clearResults();
      active.classList.remove('activated');
      const container = document.querySelector(ID_CONTENEDOR_LOCATOR);
      if (container && container.children.length > 1) {
        container.removeChild(container.children[1]);
      } else if (container && container.children.length > 2) {
        container.removeChild(container.children[2]);
      }
    }
  }

  /**
   * This function changes number of tabindex
   *
   * @public
   * @function
   * @param {Node} html
   * @api
   */
  accessibilityTab(html) {
    html.querySelectorAll('[tabindex="0"]').forEach((el) => el.setAttribute('tabindex', this.order));
  }

  /**
   * This function destroys controls inside this control
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    if (!IDEE.utils.isNullOrEmpty(this.infocatastroControl)) {
      this.infocatastroControl.destroy();
    }
    if (!IDEE.utils.isNullOrEmpty(this.ignsearchControl)) {
      this.ignsearchControl.destroy();
    }
    if (!IDEE.utils.isNullOrEmpty(this.xylocatorControl)) {
      this.xylocatorControl.destroy();
    }
  }
}
