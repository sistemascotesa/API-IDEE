/**
 * @module IDEE/control/ModalControl
 */

import templateEN from 'templates/modal_en';
import templateES from 'templates/modal_es';
import ModalImplControl from 'impl/modalcontrol';
import { getValue } from './i18n/language';

export default class ModalControl extends IDEE.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api stable
   */
  constructor(url, options = {}) {
    if (IDEE.utils.isUndefined(ModalImplControl) || (IDEE.utils.isObject(ModalImplControl)
      && IDEE.utils.isNullOrEmpty(Object.keys(ModalImplControl)))) {
      IDEE.exception(getValue('exception_modalcontrol'));
    }
    const impl = new ModalImplControl();
    impl.setTemplates(templateES, templateEN);
    super('Modal', impl, {});

    /**
     * Help documentation link.
     * @private
     * @type {String}
     */
    this.url_ = url;
  }

  /**
   * This function creates the view
   *
   * @public
   * @function
   * @param {IDEE.Map} map to add the control
   * @api stable
   */
  createView(map) {
    this.map_ = map;

    document.addEventListener('keydown', (evt) => {
      if (evt.key === 'Escape') {
        this.getImpl().toggleModal(false);
      }
    });

    // Devuelve elemento vacío. El botón se puso con new IDEE.ui.Button
    return document.createElement('div');
  }

  /**
   * Método llamado por el botón oficial
   */
  async triggerModal() {
    let content = '';

    if (this.url_ !== 'template_es' && this.url_ !== 'template_en') {
      content = `<iframe src="${this.url_}" class="m-modal-iframe" frameborder="0"></iframe>`;
    } else {
      content = IDEE.language.getLang() === 'en' ? templateEN : templateES;
    }

    this.getImpl().showModal(content);

    const modalBody = this.getImpl().modalElement.querySelector('.m-modal-body');
    if (modalBody) {
      const links = modalBody.querySelectorAll('a');
      links.forEach((link) => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      });
    }
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {IDEE.Control} control to compare
   * @api stable
   */
  equals(control) {
    return control instanceof ModalControl;
  }
}
