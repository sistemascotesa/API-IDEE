/**
 * @module IDEE/impl/Control
 */
import OLControl from 'ol/control/Control';

/**
 * @classdesc
 * Es la clase de la que heredan todos los controles de la implementación,
 * crea el "OLControl".
 * @api
 */
class Control extends OLControl {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @extends {OLControl}
   * @api stable
   */
  constructor() {
    super({});
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
