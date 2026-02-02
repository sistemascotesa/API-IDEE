/**
 * @module IDEE/impl/control/ModalControl
 */
export default class ModalControl extends IDEE.impl.Control {
  constructor() {
    super();
    this.modalElement = null;
  }

  setTemplates(es, en) {
    this.templateES = es;
    this.templateEN = en;
  }

  /**
   * This function adds the control to the specified map
   *
   * @public
   * @function
   * @param {IDEE.Map} map to add the plugin
   * @param {HTMLElement} html of the plugin
   * @api stable
   */
  addTo(map, html) {
    super.addTo(map, html);
    if (!this.facadeMap_) {
      this.facadeMap_ = map;
    }
    this._createModalStructure();
  }

  _createModalStructure() {
    if (this.modalElement) return;

    // Contenedor del mapa para colgar el modal
    const viewport = this.facadeMap_.getMapImpl().getViewport();

    const overlay = document.createElement('div');
    overlay.className = 'm-modal-overlay hidden';
    overlay.innerHTML = `
      <div class="m-modal-window">
        <span class="m-modal-close">×</span>
        <div class="m-modal-body"></div>
      </div>
    `;

    this.modalElement = overlay;
    viewport.appendChild(overlay);

    this.modalElement.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
    });

    this.modalElement.addEventListener('wheel', (e) => {
      e.stopPropagation();
    });

    // Eventos de cierre
    overlay.querySelector('.m-modal-close').onclick = () => this.toggleModal(false);
    overlay.onclick = (e) => {
      if (e.target === overlay) this.toggleModal(false);
    };
  }

  /**
   * Nuevo método que recibe el HTML desde la fachada
   */
  showModal(htmlContent) {
    if (!this.modalElement) this._createModalStructure();

    const body = this.modalElement.querySelector('.m-modal-body');
    if (body) {
      body.innerHTML = htmlContent;
      this.toggleModal(true);
    }
  }

  toggleModal(visible) {
    if (this.modalElement) {
      this.modalElement.classList.toggle('hidden', !visible);
    }
  }
}
