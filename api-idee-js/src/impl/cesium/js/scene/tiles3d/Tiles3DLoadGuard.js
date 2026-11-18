/**
 * @module IDEE/impl/scene/tiles3d/Tiles3DLoadGuard
 */

/**
 * Controla las revisiones de carga de una capa Tiles3D. Cada carga toma una revisión y
 * destruir la capa la invalida; un tileset que llega con una revisión que ya no es la
 * vigente se destruye en lugar de añadirse a la escena.
 */
class Tiles3DLoadGuard {
  constructor() {
    this.revision_ = 0;
  }

  /**
   * Inicia una carga.
   * @returns {Number} Revisión de la carga.
   */
  begin() {
    this.revision_ += 1;
    return this.revision_;
  }

  /**
   * Indica si una carga sigue siendo la vigente.
   * @param {Number} revision Revisión de la carga.
   * @returns {Boolean} Verdadero si es la vigente.
   */
  isCurrent(revision) {
    return revision === this.revision_;
  }

  /**
   * Invalida la carga en curso.
   */
  invalidate() {
    this.revision_ += 1;
  }

  /**
   * Resuelve la llegada de un tileset: lo destruye si su carga ya no es la vigente.
   * @param {Number} revision Revisión de la carga.
   * @param {Cesium.Cesium3DTileset} tileset Tileset cargado.
   * @returns {Boolean} Verdadero si la capa puede usar el tileset.
   */
  settle(revision, tileset) {
    if (this.isCurrent(revision)) return true;
    if (tileset && typeof tileset.isDestroyed === 'function' && !tileset.isDestroyed()) {
      tileset.destroy();
    }
    return false;
  }
}

export default Tiles3DLoadGuard;
