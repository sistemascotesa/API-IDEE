import Exception from '../../../facade/js/exception/exception';
import { isUndefined } from '../../../facade/js/util/Utils';

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
   * @returns una instancia del control nativo compatible con la impleementación
   */
  get controlNative() {
    return this.controlNative_;
  }

  /**
   * guarda una instancia del control nativo compatible con la implementación
   */
  set controlNative(controlNative) {
    this.controlNative_ = controlNative;
  }

  /**
   * @returns una estancia del mapa de fachada
   */
  get facadeMap() {
    return this.facadeMap_;
  }

  /**
   * guarda una estancia del mapa de fachada
   */
  set facadeMap(facadeMap) {
    this.facadeMap_ = facadeMap;
  }

  /**
   * Constructor principal de la clase.
   * @param {Object} vendorOptions opciones para el control nativo alojado en la implementación
   * - facadeMap_ mapa de fachada
   * - view_ vista que representa al control de implementación
   * - controlNative_ control nativo alojado que opera en el mapa implementado
   * @constructor
   * @api stable
   */
  constructor(vendorOptions = {}) {
    this.vendorOptions_ = vendorOptions ?? {};
    this.facadeMap_ = null;
    this.element = null;
    this.controlNative_ = null;
  }

  /**
   * Este método construye el control de implementación
   *
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @param {IDEE.Map} map Mapa.
   * @param {HTMLElement} view Plantilla del control.
   */
  build(map, view) {
    this.facadeMap = map;
    this.setElement(view);
  }

  /**
   * Este método construye el control de implementación que se almacenará en
   * controlNative_
   *
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @param {*} controlNative control nativo compatible con el mapa implementado
   */
  buildControlNative(controlNative) {}

  /**
   * Este método construye el control de implementación que se almacenará en
   * controlNative_
   *
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @param {*} controlNative control nativo compatible con el mapa implementado
   */
  afterBuildNative(controlNative) {
    // eslint-disable-next-line no-underscore-dangle
    this.controlNative.facadeMap_ = this.facadeMap;
  }

  /**
  * Este método añade el control al mapa implementado.
  *
  * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
  * @public
  * @function
  * @param {IDEE.Map} map Mapa.
  * @param {HTMLElement} view Plantilla del control.
  * @api stable
  * @export
  */
  addTo(map, view) {
    this.build(map, view);
    this.buildControlNative();
    if (isUndefined(this.controlNative)) {
      Exception('El control nativo no ha sido generado, use el método buildControlNative() para generar un control nativo compatible con el mapa');
    } else {
      this.afterBuildNative(this.controlNative);
      this.facadeMap.getMapImpl().addControl(this.controlNative);
      this.afterAddTo();
    }
  }

  /**
   * Método que se dispara justo después de que el control nativo se agrega al mapa.
   *
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   */
  afterAddTo() {}

  /**
   * Activa el control nativo de la implementación
   */
  activate() {
    if (!isUndefined(this.controlNative.activate)) this.controlNative.activate();
  }

  /**
   * Desactiva el control nativo de la implementación
   */
  deactivate() {
    if (!isUndefined(this.controlNative.activate)) this.controlNative.deactivate();
  }

  /**
   * Guarda todos los elementos de la implementación.
   *
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @param {HTMLElement} element vista de implementación
   * @api stable
   */
  setElement(element) {
    this.element = element;
  }

  /**
   * Devuelve todos los elementos de la implementación.
   *
   * @public
   * @function
   * @return {HTMLElement} Vista para el control de implementación
   * @api stable
   */
  getElement() {
    return this.element;
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
    this.facadeMap.getMapImpl().removeControl(this.controlNative);
    this.vendorOptions_ = null;
    this.controlNative = null;
    this.facadeMap = null;
  }
}

export default ControlBase;
