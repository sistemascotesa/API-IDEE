/**
 * @module IDEE/impl/Control
 */

/**
 * @classdesc
 * Es la clase de la que heredan todos los controles de la implementación,
 * crea el "CesiumControl".
 * @api
 */
class Control {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @api stable
   */
  constructor() {
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
   * @param {function} template Plantilla del control.
   * @api stable
   * @export
   */
  addTo(map, element) {
    this.facadeMap_ = map;
    this.setElement(element);
  }

  /**
   * Devuelve la vista de implementación.
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
   * Este método establece los elementos a usar.
   *
   * @public
   * @function
   * @param {HTMLElement} element Elemento HTML del control.
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
    if (this.element) this.element.remove();
    this.setElement(null);
    this.facadeMap_ = null;
  }
}

export default Control;
