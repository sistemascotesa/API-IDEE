/**
 * Contratos de las políticas de visualización que no todos los motores resuelven de
 * forma nativa (rango de zoom, recorte por extensión, elevación y marcadores). No
 * dependen de OpenLayers ni de Cesium: las implementaciones concretas dependen de ellos.
 *
 * @module IDEE/scene/contracts
 */

/**
 * Lanza el error de un método abstracto sin implementar.
 * @param {String} contract Nombre del contrato.
 * @param {String} method Nombre del método.
 */
const notImplemented = (contract, method) => {
  throw new Error(`${contract}.${method}: método abstracto no implementado`);
};

/**
 * Impide instanciar directamente un contrato.
 * @param {Function} target Constructor invocado (new.target).
 * @param {Function} contract Contrato abstracto.
 * @param {String} name Nombre del contrato.
 */
const assertAbstract = (target, contract, name) => {
  if (target === contract) {
    throw new Error(`${name}: clase abstracta`);
  }
};

/**
 * Muestra u oculta una capa según el zoom del mapa, con la misma regla que OpenLayers:
 * visible si zoom > minZoom y zoom <= maxZoom.
 * @abstract
 */
export class ZoomRangePolicy {
  constructor() {
    assertAbstract(new.target, ZoomRangePolicy, 'ZoomRangePolicy');
  }

  /**
   * Fija los límites de zoom.
   * @abstract
   * @param {Number} minZoom Zoom mínimo (-Infinity si no hay).
   * @param {Number} maxZoom Zoom máximo (Infinity si no hay).
   */
  setRange(minZoom, maxZoom) {
    return notImplemented('ZoomRangePolicy', 'setRange');
  }

  /**
   * Indica si la capa está dentro de su rango de zoom con la vista actual.
   * @abstract
   * @returns {Boolean} Verdadero si está dentro.
   */
  isInRange() {
    return notImplemented('ZoomRangePolicy', 'isInRange');
  }

  /** Deja de escuchar la vista. */
  dispose() {}
}

/**
 * Limita los objetos visibles de una capa a una extensión.
 * @abstract
 */
export class ExtentClipPolicy {
  constructor() {
    assertAbstract(new.target, ExtentClipPolicy, 'ExtentClipPolicy');
  }

  /**
   * Fija la extensión.
   * @abstract
   * @param {Array<Number>|null} extent [minX, minY, maxX, maxY] en grados, o null para no
   * recortar.
   */
  setExtent(extent) {
    return notImplemented('ExtentClipPolicy', 'setExtent');
  }

  /**
   * Vuelve a aplicar el recorte (p. ej. tras cargar objetos nuevos).
   * @abstract
   */
  apply() {
    return notImplemented('ExtentClipPolicy', 'apply');
  }

  /** Libera los recursos de la política. */
  dispose() {}
}

/**
 * Decide cómo se dibuja la tercera coordenada de una geometría.
 * @abstract
 */
export class ElevationPolicy {
  constructor() {
    assertAbstract(new.target, ElevationPolicy, 'ElevationPolicy');
  }

  /**
   * Resuelve el tratamiento de la altura de una geometría.
   * @abstract
   * @param {String} geometryType Tipo GeoJSON de la geometría.
   * @param {Boolean} hasZ Verdadero si las coordenadas tienen tercera componente.
   * @returns {{clampToGround: Boolean, heightReference: String, perPositionHeight: Boolean,
   * offset: Number}} Tratamiento de la altura, con valores de IDEE.style.heightReference.
   */
  resolve(geometryType, hasZ) {
    return notImplemented('ElevationPolicy', 'resolve');
  }
}

/**
 * Convierte alturas de un sistema de referencia vertical a alturas sobre el elipsoide.
 * @abstract
 */
export class HeightConverter {
  constructor() {
    assertAbstract(new.target, HeightConverter, 'HeightConverter');
  }

  /**
   * Prepara el conversor (p. ej. descarga la rejilla de ondulación).
   * @abstract
   * @returns {Promise<Boolean>} Verdadero si puede convertir.
   */
  ready() {
    return notImplemented('HeightConverter', 'ready');
  }

  /**
   * Convierte una altura al elipsoide.
   * @abstract
   * @param {Number} lon Longitud en grados.
   * @param {Number} lat Latitud en grados.
   * @param {Number} height Altura en el sistema de origen.
   * @returns {Number} Altura sobre el elipsoide.
   */
  toEllipsoidal(lon, lat, height) {
    return notImplemented('HeightConverter', 'toEllipsoidal');
  }
}

/**
 * Convierte la parte de etiqueta e icono de un estilo en los marcadores del motor.
 * @abstract
 */
export class LabelMarkerBuilder {
  constructor() {
    assertAbstract(new.target, LabelMarkerBuilder, 'LabelMarkerBuilder');
  }

  /**
   * Construye las opciones de la etiqueta.
   * @abstract
   * @param {Object} label Opciones de etiqueta del estilo, con los valores ya resueltos.
   * @param {Object} context Contexto ({ geometryType, heightReference }).
   * @returns {Object} Opciones de etiqueta del motor.
   */
  buildLabel(label, context) {
    return notImplemented('LabelMarkerBuilder', 'buildLabel');
  }
}
