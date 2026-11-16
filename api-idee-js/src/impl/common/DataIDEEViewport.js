import dataIDEEBbox from './DataIDEEBbox';

/**
 * Reglas del MRE (mínimo rectángulo envolvente) de DataIDEE que no dependen del motor.
 * Cada implementación aporta un adaptador nativo:
 * - getExtent(): extensión visible en CRS84 sin normalizar, o null si no es calculable.
 * - getProjectionCode(): proyección del mapa, que forma parte de la identidad de la zona.
 * - listen(onChange): suscribe al fin de movimiento/zoom y al cambio de tamaño; devuelve
 *   la función que retira esos escuchadores.
 */
class DataIDEEViewport {
  constructor({ getExtent, getProjectionCode, listen }) {
    this.getExtent_ = getExtent;
    this.getProjectionCode_ = getProjectionCode;
    this.listen_ = listen;
    this.requested_ = null;
    this.unlisten_ = null;
  }

  /**
   * MRE visible normalizado y su identidad.
   * @returns {{bbox: Array<Number>|null, key: String}} bbox es null si la vista no es válida.
   */
  current() {
    const bbox = dataIDEEBbox(this.getExtent_());
    return { bbox, key: JSON.stringify([this.getProjectionCode_(), bbox]) };
  }

  /** Registra la zona visible como la última solicitada y la devuelve. */
  request() {
    const zone = this.current();
    this.requested_ = zone.key;
    return zone;
  }

  /** Indica si una zona solicitada sigue siendo la visible. */
  isCurrent(key) {
    return key === this.current().key;
  }

  /** Indica si la vista actual difiere de la última zona solicitada. */
  hasChanged() {
    return this.current().key !== this.requested_;
  }

  /** Olvida la última zona solicitada para que el próximo cambio de vista la vuelva a pedir. */
  invalidate() {
    this.requested_ = null;
  }

  /** Suscribe los escuchadores nativos sin duplicarlos ni olvidar la zona solicitada. */
  attach(onChange) {
    this.unlisten_?.();
    this.unlisten_ = this.listen_(onChange);
  }

  /** Retira los escuchadores nativos y olvida la zona solicitada. */
  detach() {
    this.unlisten_?.();
    this.unlisten_ = null;
    this.requested_ = null;
  }
}

export default DataIDEEViewport;
