/**
 * @module IDEE/impl/control/Panzoom
 */
// eslint-disable-next-line no-unused-vars
import OLControlZoom, { Options } from 'ol/control/Zoom';

/**
 * @classdesc
 * Control de Zoom (Panzoom) que extiende
 * {@link https://openlayers.org/en/latest/apidoc/module-ol_control_Zoom-Zoom.html|ol.control.Zoom}.
 * Proporciona botones para acercar y alejar el mapa.
 *
 * @property {String} [className='ol-zoom'] Nombre de la clase CSS.
 * @property {Number} [duration=250] Duración de la animación de zoom en milisegundos.
 * @property {Number} [zoomInClassName='ol-zoom-in'] Clase CSS para el botón de zoom in.
 * @property {Number} [zoomOutClassName='ol-zoom-out'] Clase CSS para el botón de zoom out.
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
  constructor(options) {
    super(options);
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
