/**
 * @module IDEE/impl/control/OverviewMap
 */
import LayerGroup from 'IDEE/layer/LayerGroup';
import OlControlOverviewMap from 'ol/control/OverviewMap';
import { get } from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';
import WMTSTileGrid from 'ol/tilegrid/WMTS';
import { getTopLeft, getWidth, scaleFromCenter } from 'ol/extent';
import WMTS from 'ol/source/WMTS';
import { fromExtent } from 'ol/geom/Polygon';
import { extend, isNullOrEmpty, isNumber } from '../../../../facade/js/util/Utils';

/**
  * @typedef {Object} VendorOptions Opciones para la biblioteca de OpenLayers
  * @param {boolean} [collapsible] Si el control es colapsable o no.
  * (deprecated) se usa en la clase de fachada.
  * @param {boolean} [collapsed] Si el control está colapsado o no.
  * (deprecated) se usa en la clase de fachada.
*/

/**
  * @typedef {Object} Options Opciones de configuración del control de implementación
  * @param {String} [tipLabel] Etiqueta del botón de la vista general.
  * @param {Number} [zoom] Zoom del minimapa.
  * @param {Number} [maxZoom] Zoom máximo del minimapa.
  * @param {Number} [minZoom] Zoom mínimo del minimapa.
  * @param {Number} [ratio] Ratio del minimapa respecto al mapa principal.
  * @param {String} [baseLayer] Capa base del minimapa,
  * en formato tipo*url*layer*matrixSet*format.
  * @param {VendorOptions} [vendorOptions]
*/

/**
 * @classdesc
 * Esta clase es la implementación del control de vista general, que muestra un mapa en miniatura
 * basándose en la clase de base de OpenLayers ol.control.OverviewMap
 *
 * @api
 */
class OverviewMap extends OlControlOverviewMap {
  /**
   * @constructor
   * @extends {ol.control.OverviewMap}
   * @param {Options} options
   * @api stable
   */
  constructor(options = {}) {
    super(extend({
      layers: [],
      tipLabel: options.tipLabel ?? '',
      collapsed: false,
      collapsible: false,
    }, options.vendorOptions ?? {}, true));
    /**
     * Toggle delayer
     * @private
     * @type {Number}
     */
    this.toggleDelay_ = 1000;
    if (!isNullOrEmpty(options.toggleDelay)) {
      this.toggleDelay_ = options.toggleDelay;
    }

    this.zoom_ = 15;
    if (isNumber(options.zoom) && options.zoom >= 0 && options.zoom <= 22) {
      this.zoom_ = options.zoom;
    }

    this.maxZoom_ = 22;
    if (isNumber(options.maxZoom) && options.maxZoom >= 0 && options.maxZoom <= 22) {
      this.maxZoom_ = options.maxZoom;
    }

    this.minZoom_ = 0;
    if (isNumber(options.minZoom) && options.minZoom >= 0 && options.minZoom <= 22) {
      this.minZoom_ = options.minZoom;
    }

    /**
     * Indicates the ratio of the minimap size to the full map size.
     * Use values from 0.1 to 1.
     * This parameter can be calculated using a valid zoom value.
     * @private
     * @type {number | null}
     */
    // eslint-disable-next-line no-nested-ternary
    this.ratio_ = (isNullOrEmpty(options.ratio) || options.ratio === 0)
      ? null : options.ratio > 1
        ? 1 : options.ratio;

    this.fixed_ = options.fixed ?? false;

    this.baseLayer_ = options.baseLayer || 'WMTS*http://www.ign.es/wmts/ign-base?*IGNBaseTodo*GoogleMapsCompatible*Mapa IGN*false*image/jpeg*false*false*true';

    /**
     * Facade of the map
     * @private
     * @type {*}
     */
    this.facadeMap = null;

    this.order = (options.order) ? options.order : null;

    this.bindedUpdateBox = this.updateBox_.bind(this);
  }

  /**
   * Calculates one ratio in avaliable 0-1 using zoom property if not defined
   * @returns {number} representing the ratio
   */
  getRatioFromZoom() {
    let ratio = this.ratio_;
    const map = this.getOverviewMap();
    if (map && isNullOrEmpty(this.ratio_)) {
      const view = map.getView();
      if (view) {
        const maxZoom = view.getMaxZoom() ?? 22;
        ratio = this.zoom_ / (this.zoom_ + maxZoom);
      }
    }
    return ratio;
  }

  get minRatio() {
    return 0.1 / (this.getRatioFromZoom() ** 0.5);
  }

  get maxRatio() {
    return 0.75 * (1 / this.getRatioFromZoom());
  }

  /**
   * This function sets de control facade of the class
   * @function
   * @param {IDEE/control/OverviewMap}
   * @api
   */
  set facadeControl(c) {
    this.facadeControl_ = c;
  }

  /**
   * This function gets de control facade of the class
   * @function
   * @return {IDEE/control/OverviewMap}
   * @api
   */
  get facadeControl() {
    return this.facadeControl_;
  }

  /**
   * This function adds the control to the specified map
   *
   * @public
   * @function
   * @param {IDEE.Map} map to add the plugin
   * @param {HTMLElement} html of the plugin
   * @api stable
   */
  addTo(map, html) {
    this.facadeMap = map;
    const olMap = map.getMapImpl();
    this.setMap(olMap);

    this.update(map, html);
    this.html_ = html;
    this.addLayers();
  }

  resetExtent_() {
    const map = this.getMap();
    const ovmap = this.getOverviewMap();

    const mapSize = map.getSize();
    const view = map.getView();
    const extent = view.calculateExtentInternal(mapSize);

    const ovview = ovmap.getView();

    const steps = Math.log(this.maxRatio / this.minRatio) / Math.LN2;
    const ratio = 1 / (2 ** (steps / 2) * this.minRatio);

    scaleFromCenter(extent, ratio);
    ovview.fitInternal(fromExtent(extent));
  }

  /**
   * Método para que el panel llame y obtener el HTML.
   * Devuelve el elemento DOM generado por OpenLayers
   *
   * @public
   * @function
   * @api stable
   */
  getView() {
    return this.element; // this.html_ contiene el DOM del plugin
  }

  /**
   * Updates the controls
   * @function
   * @param {IDEE.Map} map to add the plugin
   * @param {function} template template of this control
   */
  update(map, html) {
    const button = this.element.querySelector('button');
    button.setAttribute('tabindex', this.order);
    button.setAttribute('aria-label', 'Plugin overviewmap');
    button.setAttribute('role', 'button');

    if (button) {
      button.style.display = 'none';
    }

    this.addOpenEventListener(button, map);
    this.setTarget();
  }

  /**
   * This method adds the open event listener
   * @function
   * @api
   */
  addOpenEventListener(btn, map) {
    const button = btn;
    button.onclick = this.openEventListener.bind(this);
    button.addEventListener('keydow', ({ keyCode }) => {
      if (keyCode === 13) this.openEventListener();
    });
  }

  /**
   * This function execute the addLayers method when
   * the control is opened.
   * @function
   */
  openEventListener(evt) {
    const event = evt;
    if (this.getCollapsed() === true) {
      this.addLayers();
      event.target.onclick = null;
    }
  }

  /**
   * Sets the target of overviewmap control
   * @function
   * @api
   */
  setTarget() {
    if (!isNullOrEmpty(this.facadeControl)) {
      const panel = this.facadeControl.getPanel();
      if (!isNullOrEmpty(panel)) {
        this.target_ = panel.getControlsContainer();
      }
    }
  }

  /**
   *
   *
   * @public
   * @function
   * @api stable
   * @export
   */
  getElement() {
    return this.element;
  }

  // /**
  //  * function remove the event 'click'
  //  *
  //  * @private
  //  * @function
  //  */
  // addLayer_(layer) {
  //   layer.un(IDEE.evt.ADDED_TO_MAP, this.addLayer_, this);
  //   this.getOverviewMap().addLayer(layer.getLayer());
  // }

  /**
   * This function adds the layers of map to overviewmap control
   * @function
   * @public
   * @param {IDEE/Map}
   */
  addLayers() {
    const olLayers = [];
    this.facadeMap.getLayers().forEach((layer) => {
      if (layer.isBase === true && layer.isVisible()) {
        const olLayer = layer.getImpl().getLayer();
        if (isNullOrEmpty(olLayer)) {
          // layer.getImpl().on(IDEE.evt.ADDED_TO_MAP, this.addLayer_.bind(this));
        } else {
          olLayers.push(olLayer);
        }
      }
    });

    const ovmView = this.getOverviewMap().getView();
    if (this.fixed_) {
      ovmView.setMaxZoom(this.zoom_);
      ovmView.setMinZoom(this.zoom_);
    } else {
      ovmView.setMaxZoom(this.maxZoom_);
      ovmView.setMinZoom(this.minZoom_);
    }

    this.setCollapsed(false);

    // this.view_ = newView;
    if (this.baseLayer_ !== undefined && this.baseLayer_.length > 3) {
      const parameters = this.baseLayer_.split('*');
      if (parameters.length > 1 && (parameters[0] === 'WMS' || parameters[0] === 'WMTS' || parameters[0] === 'LayerGroup')) {
        if (parameters[0] === 'WMS') {
          const layer = new TileLayer({
            visible: true,
            opacity: 1,
            source: new TileWMS({
              url: parameters[2],
              params: {
                LAYERS: parameters[3],
                /*
                FORMAT: 'image/png',
                VERSION: '1.1.1',
                */
                TRANSPARENT: false,
                TILED: true,
              },
            }),
          });

          this.ovmap_.addLayer(layer);
        } else if (parameters[0] === 'LayerGroup') {
          const layer = new LayerGroup(this.baseLayer_);
          layer.getImpl().addTo(this.facadeMap, false);
          const olLayer = layer.getImpl().getLayer();
          this.ovmap_.addLayer(olLayer);
        } else {
          const projection = get(this.facadeMap.getProjection().code);
          const projectionExtent = projection.getExtent();
          const size = getWidth(projectionExtent) / 256;
          const resolutions = new Array(14);
          const matrixIds = new Array(14);
          for (let z = 0; z < 14; z += 1) {
            // generate resolutions and matrixIds arrays for this WMTS
            resolutions[z] = size / (2 ** z);
            matrixIds[z] = z;
          }

          const layer = new TileLayer({
            opacity: 1,
            source: new WMTS({
              url: parameters[1],
              layer: parameters[2],
              matrixSet: parameters[3],
              format: parameters[6],
              projection,
              tileGrid: new WMTSTileGrid({
                origin: getTopLeft(projectionExtent),
                resolutions,
                matrixIds,
              }),
              style: 'default',
              wrapX: true,
            }),
          });

          this.ovmap_.addLayer(layer);
        }
      } else {
        this.ovmap_.addLayer(olLayers[0]);
      }
    } else {
      this.ovmap_.addLayer(olLayers[0]);
    }

    // this.facadeMap.getMapImpl().addControl(this);
    this.wasOpen_ = true;
  }

  /**
   * @overrides ol.control.Control.prototype
   */
  handleToggle_() {
    this.classToggle(this.element, 'ol-collapsed');
    const button = this.element.querySelector('button');
    button.setAttribute('tabindex', this.order);

    setTimeout(() => {
      if (this.collapsed_) {
        this.replaceNode(this.collapseLabel_, this.label_);
      } else {
        this.replaceNode(this.label_, this.collapseLabel_);
      }
      this.collapsed_ = !this.collapsed_;

      // manage overview map if it had not been rendered before and control
      // is expanded
      const ovmap = this.ovmap_;

      if (!this.collapsed_ && !ovmap.isRendered()) {
        ovmap.updateSize();
        this.resetExtent_();
        ovmap.removeEventListener('postrender', this.bindedUpdateBox);
        ovmap.addEventListener('postrender', this.bindedUpdateBox);
      }
    }, this.toggleDelay_);
  }

  /**
   * This function destroys this control, cleaning the HTML
   * and unregistering all events
   *
   * @public
   * @function
   * @api stable
   * @export
   */
  destroy() {
    this.facadeMap.getMapImpl().removeControl(this);
    this.facadeMap = null;
  }

  classToggle(htmlElement, className) {
    const classList = htmlElement.classList;
    if (classList.contains(className)) {
      classList.remove(className);
    } else {
      classList.add(className);
    }
  }

  replaceNode(newNode, oldNode) {
    const parent = oldNode.parentNode;
    if (parent) {
      parent.replaceChild(newNode, oldNode);
    }
  }
}

export default OverviewMap;
