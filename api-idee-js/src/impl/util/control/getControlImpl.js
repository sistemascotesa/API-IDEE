import ImplOlControl from '../../ol/js/control/Control';
import ImplCesiumControl from '../../cesium/js/control/Control';
import ImplLeafetControl from '../../leaflet/js/control/Control';
import * as MapImplType from '../../common/map-impl-type';

/**
 * @param {ImplOlMap|ImplCesiumMap|ImplLeafetMap} mapImpl
 * el mapa como implementación
 * @return {ImplOlControl|ImplCesiumControl|ImplLeafetControl|null}
 * implementación de control para usar compatible con el mapa,
 * en caso de no encontrarla devolverá null
 */
const getControlImpl = (mapImpl, options = {}) => {
  switch (mapImpl.mapType) {
    case MapImplType.OL:
      return new ImplOlControl(options);
    case MapImplType.Cesium:
      return new ImplCesiumControl(options);
    case MapImplType.Leafet:
      return new ImplLeafetControl(options);
    default:
      return null;
  }
};

export default getControlImpl;
