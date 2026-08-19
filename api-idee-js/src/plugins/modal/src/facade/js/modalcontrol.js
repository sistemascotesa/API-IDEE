/**
 * @module IDEE/control/ModalControl
 */

import templateEN from 'templates/modal_en';
import templateES from 'templates/modal_es';
import templateCA from 'templates/modal_ca';
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

    const modalClosedByWindow = impl.modalClosedByWindow;
    impl.modalClosedByWindow = () => {
      modalClosedByWindow.call(impl);
      this.modalClosedByWindow();
    };

    /**
     * Help documentation link.
     * @private
     * @type {String}
     */
    this.url_ = url;

    /**
    * Raw HTML string or plain text to inject directly into the modal,
    * instead of loading from a URL.
    * @private
    * @type {String}
    */
    this.content_ = IDEE.utils.isUndefined(options.content) ? null : options.content;
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

    // Devuelve elemento vacío. El botón se puso con new IDEE.ui.buttons.SidePanelButton
    return document.createElement('div');
  }

  /**
  * Detecta si es un documento HTML completo.
  */
  isFullHtmlDocument(content) {
    if (typeof content !== 'string') {
      return false;
    }

    return (
      /<html[\s>]/i.test(content)
      || /<!doctype\s+html/i.test(content)
    );
  }

  /**
   * Detecta si contiene etiquetas HTML.
   */
  isHtmlFragment(content) {
    const parser = new DOMParser();

    const doc = parser.parseFromString(content, 'text/html');

    return Array.from(doc.body.childNodes).some(
      (node) => node.nodeType === window.Node.ELEMENT_NODE,
    );
  }

  escapeText(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  buildContent(content) {
    if (this.isFullHtmlDocument(content)) {
      return this.createDocumentIframe(content);
    }

    if (this.isHtmlFragment(content)) {
      return content;
    }

    return `<pre>${this.escapeText(content)}</pre>`;
  }

  /**
   * Parea y construye el contenido del modal si se trata de un string que contiene una plantilla
   * html
   * @param {string} content que representa el contenido del modal
   * @returns {string} que representa un iframe con su contenido
   */
  createDocumentIframe(content) {
    const parser = new DOMParser();

    const doc = parser.parseFromString(
      content,
      'text/html',
    );

    const script = doc.createElement('script');

    script.textContent = 'window.IDEE = window.parent.IDEE;';

    doc.head.appendChild(script);

    const finalDocument = `<!DOCTYPE html>${doc.documentElement.outerHTML}`;

    const srcdoc = finalDocument
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;');

    return `
    <iframe
      class="m-modal-document"
      style="width:100%;height:100%;border:none;"
      srcdoc="${srcdoc}">
    </iframe>
  `;
  }

  /**
   * Método llamado por el botón oficial
   */
  async triggerModal() {
    let bodyContent = '';

    if (this.content_) {
      bodyContent = this.buildContent(this.content_);
    } else if (
      this.url_ !== 'template_es'
      && this.url_ !== 'template_en'
      && this.url_ !== 'template_ca'
    ) {
      bodyContent = `
      <iframe
        src="${this.url_}"
        style="width:100%;min-height:90vh;border:none;">
      </iframe>
    `;
    } else {
      const bodyContentMap = {
        en: templateEN,
        es: templateES,
        ca: templateCA,
      };
      bodyContent = bodyContentMap[IDEE.language.getLang()] ?? templateES;
    }

    this.getImpl().showModal(bodyContent);

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
   * Cierra el modal actual
   */
  closeModal() {
    this.getImpl().toggleModal(false);
  }

  /**
   * Metodo disparador usado por otras clases para lanzar la señal de cerrado por la ventana
   * gráfica
   */
  modalClosedByWindow() { }

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
