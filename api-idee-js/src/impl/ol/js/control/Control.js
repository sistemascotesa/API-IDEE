/**
 * @module IDEE/impl/Control
 */
// eslint-disable-next-line no-unused-vars
import OLControl, { Options as OlControlOptions } from 'ol/control/Control';

/**
 * @typedef {OlControlOptions} Options
 * @api
 * @see {@link https://openlayers.org/en/latest/apidoc/module-ol_control_Control-Control.html|ol.control.Control Options}
 */

/**
 * @public
 * @classdesc
 * Clase base de la que heredan todos los controles de la implementación.
 * Extiende {@link https://openlayers.org/en/latest/apidoc/module-ol_control_Control-Control.html|ol.control.Control}.
 * Proporciona la funcionalidad común para todos los controles, permitiendo añadir,
 * remover y gestionar controles en el mapa.
 *
 * @property {IDEE.Map} [facadeMap_] Referencia al mapa de fachada (IDEE.Map).
 * @property {HTMLElement} [element] El elemento DOM del control.
 * @property {String} [target_] Identificador o referencia del elemento objetivo.
 *
 * @api
 * @extends {ol.control.Control}
 */
class Control extends OLControl {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @extends {OLControl}
   * @param {Options} [options] Control options.
   * @api stable
   */
  constructor(options = {}) {
    super(options);
    /**
     * @private
     * @type {string}
     * @expose
     */
    this.facadeMap_ = null;
  }

  /**
   * Guarda la referencia del al mapa de fachada
   * Este método no debe ser usado por el usuario
   *
   * @private
   * @function
   * @param {IDEE.Map} map Mapa de fachada
   * @api stable
   * @export
   */
  set facadeMap(map) {
    this.facadeMap_ = map;
  }

  /**
   * Este método añade el control al mapa.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @param {HTML} template Plantilla del control.
   * @api stable
   * @export
   */
  addTo(map, template) {
    this.facadeMap = map;
    this.setElement(template);
    map.getMapImpl().addControl(this);
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
    return this.panel ?? this.element;
  }

  /**
   * Este método destruye este control, limpiando el HTML
   * y anulando el registro de todos los eventos.
   *
   * @public
   * @function
   * @api stable
   * @export
   */
  destroy() {
    this.facadeMap_.getMapImpl().removeControl(this);
    this.facadeMap_ = null;
    this.setElement(null);
  }

  /**
   * Este método establece los elementos a usar.
   *
   * @public
   * @function
   * @@param {HTMLElement} element
   * @api stable
   * @export
   */
  setElement(element) {
    this.element = element;
  }

  /**
   * Este método retorna los elementos.
   *
   * @public
   * @function
   * @returns {HTMLElement} Elementos.
   * @api stable
   * @export
   */
  getElement() {
    return this.element;
  }
}

export default Control;
