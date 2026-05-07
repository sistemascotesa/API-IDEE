/**
 * @module IDEE/impl/control/Panzoombar
 */
import { extend } from 'IDEE/util/Utils';

// eslint-disable-next-line no-unused-vars
import OLControlZoomSlider, { Options } from 'ol/control/ZoomSlider';

/**
 * @classdesc
 * Barra deslizante de zoom que extiende
 * {@link https://openlayers.org/en/latest/apidoc/module-ol_control_ZoomSlider-ZoomSlider.html|ol.control.ZoomSlider}.
 * Proporciona una barra de desplazamiento para acercar/alejar el mapa.
 *
 * @property {String} [className='ol-zoomslider'] Nombre de la clase CSS.
 * @property {Number} [duration=200] Duración de la animación de zoom en milisegundos.
 * @property {Boolean} [minWidth=10] Ancho mínimo de la barra en píxeles.
 *
 * @api
 * @extends {ol.control.ZoomSlider}
 */
class Panzoombar extends OLControlZoomSlider {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Options} [vendorOptions] Opciones de proveedor para la biblioteca base.
   * @example
   * const control = new IDEE.impl.ol.control.Panzoombar({
   *   className: 'm-panzoombar',
   * });
   * Esto se llama en una devolución de llamada de "requestAnimationFrame".
   * @extends {ol.control.Control}
   * @api stable
   */
  constructor(vendorOptions = {}) {
    super(extend({}, vendorOptions, true));
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
   * Devuelve los elementos de la plantilla.
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

export default Panzoombar;
