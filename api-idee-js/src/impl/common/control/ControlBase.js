/**
 * Clase base abstracta para la implementación de controles en IDEE.
 *
 * Esta clase no debe instanciarse directamente. Sirve como clase abstracta
 * que define la estructura y comportamiento común de todos los controles.
 *
 * @abstract
 * @class
 */
class ControlBase {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @api stable
   */
  constructor(vendorOptions = {}) {
    this.facadeMap_ = null;
    this.control_ = null;
    this.view_ = null;
    this.vendorOptions_ = vendorOptions ?? {};
  }

  /**
   * @returns una instancia de control de implementación compatible con el mapa de fachada
   */
  getControlImpl() {
    return this.control_;
  }

  /**
   * Este método construye el control de implementación
   *
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @param {*} controlImpl
   */
  build(controlImpl) {
    this.control_ = controlImpl;
  }

  /**
  * Este método añade el control al mapa.
  *
  * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
  * @param {IDEE.Map} map Mapa.
  * @param {HTMLElement} view Plantilla del control.
  * @public
  * @function
  * @api stable
  * @export
  */
  addTo(map, view) {
    this.facadeMap_ = map;
    this.view_ = view;
    this.facadeMap_.getMapImpl().addControl(this.getControlImpl());
  }

  /**
   * Establece la vista del control de implementación
   *
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @param {HTMLElement} view vista de implementación
   * @api stable
   */
  setView(view) {
    this.view_ = view;
  }

  /**
   * Devuelve la vista de implementación
   *
   * @public
   * @function
   * @return {HTMLElement} Vista Opciones para el control de implementación
   * @api stable
   */
  getView() {
    return this.view_;
  }

  /**
   * Devuelve las opciones del control de implementación si las tiene
   *
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @return {Object} Opciones para el control de implementación
   * @api stable
   */
  getVendorOptions() {
    return this.vendorOptions_;
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
    this.facadeMap_.getMapImpl().removeControl(this.control_);
    this.facadeMap_ = null;
  }
}

export default ControlBase;
