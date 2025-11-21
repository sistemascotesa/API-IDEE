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
    this.parentContainer = null;
  }

  /**
   * Este método añade el control al mapa.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @param {HTML} template Plantilla del control.
   * @param {HTML} parentContainer Plantilla del control.
   * @api stable
   * @export
   */
  addTo(map, template, parentContainer) {
    this.facadeMap_ = map;
    this.element = template;
    this.parentContainer = parentContainer;
    map.getMapImpl().addControl(this);
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
