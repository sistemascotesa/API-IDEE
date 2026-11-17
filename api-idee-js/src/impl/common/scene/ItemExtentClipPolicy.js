/**
 * Política de recorte por extensión independiente del motor: oculta los objetos cuya
 * extensión no se cruza con la de la capa, sin borrarlos.
 *
 * @module IDEE/impl/common/scene/ItemExtentClipPolicy
 */
import { ExtentClipPolicy } from '../../../facade/js/scene/contracts';

/**
 * Convierte una extensión del API ([minX, minY, maxX, maxY] u objeto { x: { min, max },
 * y: { min, max } }) en un array, o null si no es válida.
 * @param {Array<Number>|Object|null} extent Extensión.
 * @returns {Array<Number>|null} [minX, minY, maxX, maxY].
 */
export const toExtentArray = (extent) => {
  if (Array.isArray(extent)) {
    return extent.length === 4 && extent.every(Number.isFinite) ? extent.slice() : null;
  }
  if (extent && extent.x && extent.y) {
    const values = [extent.x.min, extent.y.min, extent.x.max, extent.y.max].map(Number);
    return values.every(Number.isFinite) ? values : null;
  }
  return null;
};

/**
 * Indica si un conjunto de coordenadas se cruza con una extensión.
 * @param {Array<Array<Number>>} coordinates Coordenadas [x, y].
 * @param {Array<Number>} extent [minX, minY, maxX, maxY].
 * @returns {Boolean} Verdadero si alguna parte de su caja cae dentro.
 */
export const intersectsExtent = (coordinates, extent) => {
  if (!Array.isArray(coordinates) || coordinates.length === 0) return true;
  const xs = coordinates.map(([x]) => x);
  const ys = coordinates.map(([, y]) => y);
  return Math.max(...xs) >= extent[0] && Math.min(...xs) <= extent[2]
    && Math.max(...ys) >= extent[1] && Math.min(...ys) <= extent[3];
};

export default class ItemExtentClipPolicy extends ExtentClipPolicy {
  /**
   * @param {Object} items Acceso a los objetos de la capa.
   * @param {function(): Array} items.list Objetos actuales.
   * @param {function(*): Array<Array<Number>>} items.coordinates Coordenadas [x, y] de un
   * objeto, en las unidades de la extensión.
   * @param {function(*, Boolean): void} items.setShown Muestra u oculta un objeto.
   */
  constructor(items) {
    super();
    this.items_ = items;
    this.extent_ = null;
  }

  setExtent(extent) {
    const previous = this.extent_;
    this.extent_ = toExtentArray(extent);
    if (previous !== null || this.extent_ !== null) this.apply();
  }

  apply() {
    this.items_.list().forEach((item) => {
      this.items_.setShown(item, this.extent_ === null
        || intersectsExtent(this.items_.coordinates(item), this.extent_));
    });
  }
}
