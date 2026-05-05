/**
 * @module IDEE/impl/control/Panzoom
 */
import OLControlZoom from 'ol/control/Zoom';

/**
 * @typedef {Object} Options
 * @property {number} [duration=250] Animation duration in milliseconds.
 * @property {string} [className='ol-zoom'] CSS class name.
 * @property {string} [zoomInClassName=className + '-in'] CSS class name for the zoom-in button.
 * @property {string} [zoomOutClassName=className + '-out'] CSS class name for the zoom-out button.
 * @property {string|HTMLElement} [zoomInLabel='+'] Text label to use for the zoom-in
 * button. Instead of text, also an element (e.g. a `span` element) can be used.
 * @property {string|HTMLElement} [zoomOutLabel='–'] Text label to use for the zoom-out button.
 * Instead of text, also an element (e.g. a `span` element) can be used.
 * @property {string} [zoomInTipLabel='Zoom in'] Text label to use for the button tip.
 * @property {string} [zoomOutTipLabel='Zoom out'] Text label to use for the button tip.
 * @property {number} [delta=1] The zoom delta applied on each click.
 * @property {HTMLElement|string} [target] Specify a target if you want the control to be
 * rendered outside of the map's viewport.
 */

/**
 * @classdesc
 * Control de Zoom (Panzoom) que extiende
 * {@link https://openlayers.org/en/latest/apidoc/module-ol_control_Zoom-Zoom.html|ol.control.Zoom}.
 * Proporciona botones para acercar y alejar el mapa.
 * @example
 * const control = new IDEE.impl.ol.control.Panzoom({
 *   className: 'ol-zoom',
 *   zoomInLabel: 'más zoom'
 * });
 *
 * @api
 * @extends {ol.control.Zoom}
 */
class Panzoom extends OLControlZoom {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Options} options
   * @api stable
   */
  constructor(options = {}) {
    const vendorOptions = { ...options };
    // eslint-disable-next-line no-prototype-builtins
    if (vendorOptions.hasOwnProperty('tooltipZoomIn')) {
      vendorOptions.zoomInTipLabel = vendorOptions.tooltipZoomIn;
      delete vendorOptions.tooltipZoomIn;
    }
    // eslint-disable-next-line no-prototype-builtins
    if (vendorOptions.hasOwnProperty('tooltipZoomOut')) {
      vendorOptions.zoomOutTipLabel = vendorOptions.tooltipZoomOut;
      delete vendorOptions.tooltipZoomIn;
    }
    super(vendorOptions);

    this.facadeMap_ = null;
  }

  /**
   * Este método añade el control al mapa.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @param {function} template Plantilla del control.
   * @api stable
   */
  addTo(map, element) {
    this.facadeMap_ = map;
    const olMap = map.getMapImpl();
    super.setMap(olMap); // OL añade el control a su sistema interno.
    olMap.addControl(this); // OL añade el elemento al DOM en la posición OL por defecto
  }

  /**
   * Devuelve la vista de implementación
   *
   * @public
   * @function
   * @return {HTMLElement} vista de implementación
   * @api stable
   */
  getView() {
    return this.element;
  }

  /**
   * Retorna la plantilla del control.
   *
   * @public
   * @function
   * @returns {HTMLElement} Elementos del control.
   * @api stable
   * @export
   */
  getElement() {
    return this.element;
  }

  /**
   * Esta función destruye este control, limpiando el HTML y anula el registro de todos los eventos.
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
}

export default Panzoom;
