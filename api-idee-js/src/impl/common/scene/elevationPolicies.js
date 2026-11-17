/**
 * Estrategias de elevación, una por modo, y su factoría. Deciden cómo se coloca en
 * altura una geometría a partir de las opciones { mode, offset, heightSystem }, sin
 * depender del motor (los valores de heightReference son los de IDEE.style.heightReference).
 *
 * @module IDEE/impl/common/scene/elevationPolicies
 */
import { ElevationPolicy } from '../../../facade/js/scene/contracts';
import { normalizeElevation } from '../../../facade/js/scene/options';

/**
 * Pega la geometría al terreno: la cota y el desplazamiento no se usan.
 */
export class ClampElevationPolicy extends ElevationPolicy {
  resolve() {
    return {
      mode: 'clamp',
      clampToGround: true,
      heightReference: 'CLAMP_TO_GROUND',
      perPositionHeight: false,
      offset: 0,
    };
  }
}

/**
 * Usa la cota (o 0 si no hay) más el desplazamiento como altura absoluta.
 */
export class AbsoluteElevationPolicy extends ElevationPolicy {
  constructor(offset = 0) {
    super();
    this.offset = offset;
  }

  resolve(geometryType, hasZ) {
    return {
      mode: 'absolute',
      clampToGround: false,
      heightReference: 'NONE',
      perPositionHeight: !!hasZ,
      offset: this.offset,
    };
  }
}

/**
 * Suma la cota (o 0) y el desplazamiento a la altura del terreno.
 */
export class RelativeElevationPolicy extends ElevationPolicy {
  constructor(offset = 0) {
    super();
    this.offset = offset;
  }

  resolve() {
    return {
      mode: 'relative',
      clampToGround: false,
      heightReference: 'RELATIVE_TO_GROUND',
      perPositionHeight: false,
      offset: this.offset,
    };
  }
}

/**
 * Comportamiento por defecto: las geometrías 2D se pegan al terreno y las 3D usan su
 * cota como altura absoluta.
 */
export class AutoElevationPolicy extends ElevationPolicy {
  constructor(offset = 0) {
    super();
    this.flat = new ClampElevationPolicy();
    this.withZ = new AbsoluteElevationPolicy(offset);
  }

  resolve(geometryType, hasZ) {
    return hasZ ? this.withZ.resolve(geometryType, hasZ) : this.flat.resolve(geometryType, hasZ);
  }
}

const POLICIES = {
  auto: (offset) => new AutoElevationPolicy(offset),
  clamp: () => new ClampElevationPolicy(),
  absolute: (offset) => new AbsoluteElevationPolicy(offset),
  relative: (offset) => new RelativeElevationPolicy(offset),
};

/**
 * Crea la estrategia de elevación de unas opciones.
 * @param {Object|String|undefined} elevation Opciones de elevación o nombre del modo.
 * @returns {ElevationPolicy} Estrategia.
 */
export const createElevationPolicy = (elevation) => {
  const { mode, offset } = normalizeElevation(elevation);
  return POLICIES[mode](offset);
};

/**
 * Indica si unas opciones de elevación dejan las geometrías como hasta ahora (modo
 * auto, sin desplazamiento y con alturas sobre el elipsoide).
 * @param {Object|String|undefined} elevation Opciones de elevación.
 * @returns {Boolean} Verdadero si no cambian nada.
 */
export const isDefaultElevation = (elevation) => {
  const { mode, offset, heightSystem } = normalizeElevation(elevation);
  return mode === 'auto' && offset === 0 && heightSystem === 'ellipsoid';
};
