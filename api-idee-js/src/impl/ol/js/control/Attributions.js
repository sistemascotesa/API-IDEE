/**
 * @module IDEE/impl/control/Attributions
 */
import DoubleClickZoom from 'ol/interaction/DoubleClickZoom';
import Control from './Control';

/**
 * @classdesc
 * Hereda de {@link module:IDEE/impl/control/Control|Control}.
 * Panel de atribuciones del mapa. Muestra las atribuciones y referencias de las capas
 * visibles en el mapa. Permite al usuario acceder a información adicional sobre
 * las fuentes de datos cartográficos.
 *
 * @property {IDEE.Map} [map_] Referencia al mapa de fachada.
 * @property {ol.interaction.DoubleClickZoom} [dblClickInteraction_] Referencia a la interacción
 * de doble clic para zoom.
 *
 * @api
 * @extends {module:IDEE/impl/control/Control}
 */
class Attributions extends Control {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @extends {ol.control.Control}
   * @api stable
   */
  constructor(options = {}) {
    super(options);
    /**
     * Map of the plugin
     * @private
     * @type {IDEE.Map}
     */
    this.map_ = null;
  }

  /**
   * Este método agrega el control al mapa.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @param {function} template Plantilla del control.
   * @api stable
   */
  addTo(map, element) {
    const olMap = map.getMapImpl();
    olMap.getInteractions().forEach((interaction) => {
      if (interaction instanceof DoubleClickZoom) {
        this.dblClickInteraction_ = interaction;
      }
    });

    super.addTo(map, element); // Llama al addTo de Control.js de impl
    // this.facadeMap_ = map; // Referencia al mapa fachada (IDEE.Map)
    // this.element = element; // Asigna la plantilla/elemento HTML al control
    // map.getMapImpl().addControl(this); // Registro del objeto control en la colección OL
  }

  /**
   * Register events in ol.Map of IDEE.Map
   * @public
   * @function
   */
  registerEvent(type, map, callback) {
    const olMap = map.getMapImpl();

    olMap.on(type, callback);
  }

  /**
   * Esta función destruye este control, limpiando el HTML y anula el registro de todos los eventos.
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    super.destroy();
  }
}

export default Attributions;
