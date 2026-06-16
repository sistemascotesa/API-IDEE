/**
 * @module IDEE/control/HomeView
 */
import HomeViewImpl from 'impl/control/HomeView';
import ControlBase from './Control';

/**
* @typedef {Object} module:IDEE/control/HomeView~Options
* @api
* @param {Array<Number>} [extent] Bounding Box inicial [minx, miny, maxx, maxy].
* @param {Array<Number>} [center] Coordenadas del centro inicial [lon, lat].
* @param {Number} [zoom] Nivel de zoom inicial.
* @param {Object} [vendorOptions] Opciones para la clase constructora base
* heredada para el control de implementación
* @api
*/

/**
 * @classdesc
 * Hereda de {@link module:IDEE/control/Control|Control}.
 * Control de mapa que permite restablecer la vista (coordenadas, zoom o extensión/bbox)
 * al estado inicial con el que se cargó el visor o a unos valores preconfigurados.
 */
class HomeView extends ControlBase {
  /**
  * Constructor principal de la clase.
  *
  * @constructor
  * @param {module:IDEE/control/HomeView~Options} options Opciones de configuración
  * del control.
  * @api
  *
  * @example
  * // If this map are un EPSG:4326
  *
  * new HomeView({
  *  position: "left",
  *  extent: [-4.8500, 41.5800, -4.6500, 41.7200],
  *  vendorOptions: {}
  * })
  */
  constructor(options = {}) {
    super(options);

    // Permitimos forzar una extensión o coordenadas fijas por parámetro
    this.extent = options.extent ?? null;
    this.center = options.center ?? null;
    this.zoom = options.zoom ?? null;

    this.impl_ = new HomeViewImpl({
      extent: this.extent,
      center: this.center,
      zoom: this.zoom,
      vendorOptions: options.vendorOptions,
    });
  }

  /**
   * Este método añade el control al mapa.
   *
   * @override
   * @public
   * @function
   * @param {module:IDEE/Map} map Mapa.
   * @api
   * @export
   */
  addTo(map) {
    super.addTo(map);
    this.setViewParams(map);
  }

  /**
   * Guarda los parámetros por defecto del mapa, bien sean los definidos por el usuario
   * o los que el mapa tenga en el momento en el que se añade al mapa
   *
   * @override
   * @public
   * @function
   * @param {module:IDEE/Map} map Mapa.
   * @api
   * @export
   */
  setViewParams(map) {
    if (map && !this.extent && !this.center) {
      if (typeof map.getCenter === 'function') this.center = map.getCenter();
      if (typeof map.getZoom === 'function') this.zoom = map.getZoom();
      if (typeof map.getExtent === 'function') this.extent = map.getExtent();
    }
  }

  /**
   * Recupera los datos guardados de la vista inicial.
   * * @public
   * @returns {Object} Datos de la vista inicial.
   */
  getInitialView() {
    return {
      center: this.center,
      zoom: this.zoom,
      extent: this.extent,
    };
  }
}

HomeView.NAME = 'HomeView';

export default HomeView;
