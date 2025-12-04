/* eslint-disable no-underscore-dangle */
/**
 * @module IDEE/impl/control/Scale
 */
import Control from './Control';
import ScaleNative from './native/ScaleNative';

class Scale extends Control {
  buildControlNative() {
    this.controlNative = new ScaleNative(this.getVendorOptions());
    this.controlNative.build(this.facadeMap, this.getView());
  }

  afterAddTo() {
    this.controlNative.addZoomLevelListeners();
    this.controlNative.addScaleListeners();
  }
}

export default Scale;
