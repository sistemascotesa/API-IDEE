import Control from 'ol/control/Control';

/**
 * @abstract
 * Clase base para los controles nativos de open layers que se crean de cero
 * se añaden propiedades del control de implementación para poder usarse de forma sencilla
 */
class ControlNative extends Control {
  constructor(options = {}) {
    super(options.vendorOptions ?? {});
    // eslint-disable-next-line no-underscore-dangle
    this.facadeMap_ = options.facadeMap_ ?? null;
    this.element = options.element ?? null;
  }
}

export default ControlNative;
