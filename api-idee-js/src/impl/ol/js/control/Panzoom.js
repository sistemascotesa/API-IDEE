/**
 * @module IDEE/impl/control/Panzoom
 */
// eslint-disable-next-line no-unused-vars
import OLControlZoom, { Options } from 'ol/control/Zoom';

/**
 * @classdesc
 * Control de Panzoom dee implementación de OpenLayers.
 *
 * @api
 * @extends {OLControlZoom}
 * @api
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
