/**
 * @module IDEE/impl/control/OverviewMapControl
 */
/* eslint-disable import/no-extraneous-dependencies */
import OverviewMap from 'ol/control/OverviewMap';
import { getValue } from '../../../facade/js/i18n/language';

// export default class OverviewMapControl extends ol.control.OverviewMap {
export default class OverviewMapControl extends OverviewMap {
  /**
   * @constructor
   * @extends {ol.control.Control}
   * @api stable
   */
  constructor(options, vendorOptions = {}) {
    super(IDEE.utils.extend({
      layers: [],
      tipLabel: getValue('tooltip'),
      collapsed: false,
      collapsible: false,
    }, vendorOptions, true));

    this.isOverviewMap = true;

    /**
     * Toggle delayer
     * @private
     * @type {Number}
     */
    this.toggleDelay_ = 1000;
    if (!IDEE.utils.isNullOrEmpty(options.toggleDelay)) {
      this.toggleDelay_ = options.toggleDelay;
    }

    /**
     * Collapsed button class
     * @private
     * @type {String}
     */
    this.collapsedButtonClass_ = 'overviewmap-mundo';
    if (!IDEE.utils.isNullOrEmpty(options.collapsedButtonClass)) {
      this.collapsedButtonClass_ = options.collapsedButtonClass;
    }

    if (options.position === 'right'
      || options.position === 'center-bottom-right'
      || options.position === 'center-top-right'
    ) {
      this.openedButtonClass_ = 'g-cartografia-flecha-derecha';
    } else {
      this.openedButtonClass_ = 'g-cartografia-flecha-izquierda';
    }

    if (!IDEE.utils.isNullOrEmpty(options.openedButtonClass)) {
      this.openedButtonClass_ = options.openedButtonClass;
    }

    this.fixed_ = options.fixed || false;

    this.zoom_ = options.zoom || 4;

    this.baseLayer_ = options.baseLayer || 'WMTS*http://www.ign.es/wmts/ign-base?*IGNBaseTodo*GoogleMapsCompatible*Mapa IGN*false*image/jpeg*false*false*true';

    /**
     * Facade of the map
     * @private
     * @type {*}
     */
    this.facadeMap_ = null;

    this.order = (options.order) ? options.order : null;

    this.bindedUpdateBox = this.updateBox_.bind(this);
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
    // No existe el método addTo de la clase base
    // super.addTo(map, html); // Llama al addTo de IDEE.Control si existe
    this.facadeMap_ = map;
    const olMap = map.getMapImpl();
    this.setMap(olMap);

    // Para que no esté el control colapsado desde el principio
    // this.setCollapsed(false);

    this.update(map, html);
    this.html_ = html;
    // if (!this.getCollapsed()) {
    //   this.addLayers();
    // }
    this.addLayers();
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

    if (this.collapsed_ === true) {
      if (button.classList.contains(this.collapsedButtonClass_)) {
        button.classList.remove(this.collapsedButtonClass_);
      } else {
        button.classList.add(this.collapsedButtonClass_);
      }
    } else if (button.classList.contains(this.openedButtonClass_)) {
      button.classList.remove(this.openedButtonClass_);
    } else {
      button.classList.add(this.openedButtonClass_);
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
    const facadeControl = this.facadeControl_;
    if (!IDEE.utils.isNullOrEmpty(facadeControl)) {
      const panel = facadeControl.getPanel();
      if (!IDEE.utils.isNullOrEmpty(panel)) {
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
    this.facadeMap_.getLayers().forEach((layer) => {
      if (layer.isBase === true && layer.isVisible()) {
        const olLayer = layer.getImpl().getLayer();
        if (IDEE.utils.isNullOrEmpty(olLayer)) {
          // layer.getImpl().on(IDEE.evt.ADDED_TO_MAP, this.addLayer_.bind(this));
        } else {
          olLayers.push(olLayer);
        }
      }
    });
    // let newView = {};
    let newView;
    const currentProjection = ol.proj.get(this.facadeMap_.getProjection().code);
    const currentCenter = this.facadeMap_.getCenter();
    // eslint-disable-next-line max-len
    const centerArray = Array.isArray(currentCenter) ? currentCenter : [currentCenter.x, currentCenter.y];
    if (this.fixed_) {
      newView = new ol.View({
        projection: currentProjection,
        center: centerArray,
        maxZoom: this.zoom_,
        minZoom: this.zoom_,
        zoom: this.zoom_,
      });
    } else {
      const ideeView = new IDEE.impl.View({
        projection: currentProjection,
        center: currentCenter,
        resolutions: this.facadeMap_.getResolutions(),
      });

      // Extracción de la instancia real
      if (typeof ideeView.getImpl === 'function') {
        // Si existe, ejecuta y devuelve objeto nativo OL.
        newView = ideeView.getImpl();
      } else {
        newView = ideeView;
      }
    }

    // this.ovmap_.setView(newView);
    this.ovmap_.setView(Promise.resolve(newView));

    this.setCollapsed(false);

    this.view_ = newView;
    if (this.baseLayer_ !== undefined && this.baseLayer_.length > 3) {
      const parameters = this.baseLayer_.split('*');
      if (parameters.length > 1 && (parameters[0] === 'WMS' || parameters[0] === 'WMTS' || parameters[0] === 'LayerGroup')) {
        if (parameters[0] === 'WMS') {
          const layer = new ol.layer.Tile({
            visible: true,
            opacity: 1,
            source: new ol.source.TileWMS({
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
          const layer = new IDEE.layer.LayerGroup(this.baseLayer_);
          layer.getImpl().addTo(this.facadeMap_, false);
          const olLayer = layer.getImpl().getLayer();
          this.ovmap_.addLayer(olLayer);
        } else {
          const projection = ol.proj.get(this.facadeMap_.getProjection().code);
          const projectionExtent = projection.getExtent();
          const size = ol.extent.getWidth(projectionExtent) / 256;
          const resolutions = new Array(14);
          const matrixIds = new Array(14);
          for (let z = 0; z < 14; z += 1) {
            // generate resolutions and matrixIds arrays for this WMTS
            resolutions[z] = size / (2 ** z);
            matrixIds[z] = z;
          }

          const layer = new ol.layer.Tile({
            opacity: 1,
            source: new ol.source.WMTS({
              url: parameters[1],
              layer: parameters[2],
              matrixSet: parameters[3],
              format: parameters[6],
              projection,
              tileGrid: new ol.tilegrid.WMTS({
                origin: ol.extent.getTopLeft(projectionExtent),
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

    // this.facadeMap_.getMapImpl().addControl(this);
    this.wasOpen_ = true;
  }

  /**
   * @overrides ol.control.Control.prototype
   */
  handleToggle_() {
    this.classToggle(this.element, 'ol-collapsed');
    const button = this.element.querySelector('button');
    button.setAttribute('tabindex', this.order);
    this.classToggle(button, this.openedButtonClass_);
    this.classToggle(button, this.collapsedButtonClass_);

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
    this.facadeMap_.getMapImpl().removeControl(this);
    this.facadeMap_ = null;
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
