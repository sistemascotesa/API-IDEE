/**
 * Política de rango de zoom independiente del motor: recibe el zoom de la vista, la
 * suscripción a sus cambios y la acción que muestra u oculta la capa.
 *
 * @module IDEE/impl/common/scene/ViewZoomRangePolicy
 */
import { ZoomRangePolicy } from '../../../facade/js/scene/contracts';
import { isZoomInRange } from '../../../facade/js/scene/options';

export default class ViewZoomRangePolicy extends ZoomRangePolicy {
  /**
   * @param {Object} view Vista.
   * @param {function(): Number} view.getZoom Zoom actual de la vista.
   * @param {function(Function): Function} view.onChange Suscribe a los cambios de la vista
   * y devuelve la función que anula la suscripción.
   * @param {function(Boolean): void} apply Muestra (true) u oculta (false) la capa según el
   * rango; solo se llama cuando cambia el resultado o el rango.
   */
  constructor(view, apply) {
    super();
    this.view_ = view;
    this.apply_ = apply;
    this.minZoom_ = Number.NEGATIVE_INFINITY;
    this.maxZoom_ = Number.POSITIVE_INFINITY;
    this.inRange_ = undefined;
    this.unsubscribe_ = view.onChange(() => this.update());
  }

  setRange(minZoom, maxZoom) {
    this.minZoom_ = minZoom;
    this.maxZoom_ = maxZoom;
    this.inRange_ = undefined;
    this.update();
  }

  isInRange() {
    return isZoomInRange(Number(this.view_.getZoom()), this.minZoom_, this.maxZoom_);
  }

  /**
   * Recalcula el rango y avisa si ha cambiado.
   * @returns {Boolean} Verdadero si la capa está dentro del rango.
   */
  update() {
    const inRange = this.isInRange();
    if (inRange !== this.inRange_) {
      this.inRange_ = inRange;
      this.apply_(inRange);
    }
    return inRange;
  }

  dispose() {
    if (typeof this.unsubscribe_ === 'function') this.unsubscribe_();
    this.unsubscribe_ = null;
  }
}
