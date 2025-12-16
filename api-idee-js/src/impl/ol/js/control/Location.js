/**
 * @module IDEE/impl/control/Location
 */

import Control from './Control';
import LocationNative from './native/LocationNative';

/**
 *  @classdesc
 *  Localiza la posición del usuario en el mapa.
 *  @api
 */
class Location extends Control {
  buildControlNative(controlNative) {
    const {
      tracking,
      highAccuracy,
      maximumAge,
      vendorOptions,
    } = this.getVendorOptions();
    this.controlNative = new LocationNative(
      tracking,
      highAccuracy,
      maximumAge,
      this.facadeMap,
      this.getElement(),
      vendorOptions,
    );
  }
}

export default Location;
