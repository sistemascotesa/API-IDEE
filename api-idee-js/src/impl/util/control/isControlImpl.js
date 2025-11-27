import ImplCesiumControl from '../../cesium/js/control/Control';
import ImplLeafetControl from '../../leaflet/js/control/Control';
import Utils from '../../ol/js/util/Utils';

/**
 * @param {null|Object|ImplOlControl|ImplCesiumControl|ImplLeafetControl} control
 * como implementación
 * @return {boolean} indica si el control en cuestión es una implementación válida o no
 */
const isControlImpl = (control) => {
  return control instanceof ImplLeafetControl
  || control instanceof ImplCesiumControl
  || Utils.isOlControlImpl(control);
};

export default isControlImpl;
