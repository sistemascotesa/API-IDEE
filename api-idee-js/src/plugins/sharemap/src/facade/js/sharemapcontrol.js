/**
 * @module IDEE/control/ShareMapControl
 */
import template from '../../templates/sharemap';
import modal from '../../templates/modal';
import { getValue } from './i18n/language';
/**
 * This function adds the animation shade class.
 *
 * @function
 * @private
 */
const beginShade = (element) => {
  if (element.classList.contains('m-plugin-sharemap-shade')) {
    element.classList.remove('m-plugin-sharemap-shade');
  } else {
    element.classList.add('m-plugin-sharemap-shade');
    setTimeout(() => {
      element.classList.remove('m-plugin-sharemap-shade');
    }, 2000); // animationDuration 2s
  }
};

/**
 * This function copies the textr input in clipboard
 *
 * @function
 * @private
 */
const copyURL = (input) => {
  const inputVar = input;
  inputVar.disabled = false;
  inputVar.select();
  document.execCommand('copy');
  inputVar.disabled = true;
  document.getSelection().removeAllRanges();
};

/**
 * @classdesc
 * ShareMap api-idee control.
 * This control allows current map state sharing via URL.
 */
export default class ShareMapControl extends IDEE.Control {
  /**
   * @constructor
   * @extends {IDEE.Control}
   * @api stable
   */
  constructor(options) {
    const impl = new IDEE.impl.Control();
    super('sharemap', impl);
    this.restWarnings_ = new WeakSet();
    this.urlSizeWarning_ = false;
    /**
     * Base url of the shared map
     *
     * @private
     * @type {URLLike}
     */
    this.baseUrl_ = options.baseUrl;

    /**
     * Title of the modal
     *
     * @private
     * @type {string}
     */
    this.title_ = options.title;

    /**
     * Text
     *
     * @private
     * @type {string}
     */
    this.text_ = options.text;

    /**
     * Text of the button
     *
     * @private
     * @type {string}
     */
    this.btn_ = options.btn;

    /**
     * Text of the copy button
     *
     * @private
     * @type {string}
     */
    this.copyBtn_ = options.copyBtn;

    /**
     * Text of the copy html button
     *
     * @private
     * @type {string}
     */
    this.copyBtnHtml_ = options.copyBtnHtml;

    /**
     * Primary color of the html view  (hexadecimal format).
     *
     * @private
     * @type {string}
     */
    this.primaryColor_ = options.primaryColor || '#71a7d3';

    /**
     * Secondary color of the html view  (hexadecimal format).
     *
     * @private
     * @type {string}
     */
    this.secondaryColor_ = options.secondaryColor || '#fff';

    /**
     * Classes jss
     *
     * @private
     * @type {object}
     */
    this.styles_ = [
      {
        id: '.m-plugin-sharemap-content button',
        styles: {
          backgroundColor: `${this.primaryColor_} `,
          color: `${this.secondaryColor_} `,
        },
      },
      {
        id: '#m-plugin-sharemap-content',
        styles: {
          backgroundColor: `${this.secondaryColor_} `,
          border: `1px solid ${this.primaryColor_} `,
          boxShadow: `0 2px 4px ${this.primaryColor_}, 0 -1px 0px ${this.primaryColor_} `,
        },
      },
      {
        id: '.m-plugin-sharemap-content span',
        styles: {
          color: `${this.primaryColor_} `,
        },
      },
      {
        id: '.m-plugin-sharemap-dialog div.m-plugin-sharemap-social',
        styles: {
          borderBottom: `${this.primaryColor_} 1px solid `,
        },
      },
      {
        id: '#m-plugin-sharemap-social a svg',
        styles: {
          color: `${this.primaryColor_} `,
        },
      },
      {
        id: 'm-sharemap-geturl',
        styles: {
          backgroundColor: this.primaryColor_,
          color: this.secondaryColor_,
        },
      },
    ];

    /**
     * Styles in js will be overwritten
     *
     * @private
     * @type {bool}
     */
    this.overwriteStyles_ = options.overwriteStyles || false;

    /**
     * Generate minimized url
     *
     * @private
     * @type {bool}
     */
    this.minimize_ = options.minimize || false;

    /**
     * Tooltip information for copy action
     *
     * @private
     * @type {string}
     */
    this.tooltip_ = options.tooltip || '¡Copiado!';

    /**
     * URL API or URL Visor (false visor (default), true API)
     *
     * @private
     * @type {bool}
     */
    this.urlAPI_ = options.urlAPI || false;

    this.order = options.order;
    /**
     * Layers to show in popup
     *
     * @private
     * @type {Array}
     */
    this.filterLayers = options.filterLayers;

    /** Select all layers or not
      * @private
      * @type {Boolean}
      */
    this.shareLayer = options.shareLayer;
  }

  /**
   * This function creates the view
   *
   * @public
   * @function
   * @param {IDEE.Map} map to add the control
   * @api
   */
  createView(map) {
    this.map_ = map;
    return new Promise((success, fail) => {
      const html = IDEE.template.compileSync(template);
      const button = html.querySelector('button');
      button.setAttribute('tabindex', this.order);
      button.setAttribute('aria-label', 'Plugin Sharemap');

      if (this.overwriteStyles_ === true) {
        const [mButtonStyle] = this.styles_.filter(({ id }) => id === button.id);
        button.style.backgroundColor = mButtonStyle.styles.backgroundColor;
        button.style.color = mButtonStyle.styles.color;
        button.style.border = mButtonStyle.styles.border;
      }
      this.accessibilityTab(html);
      this.addEvents(html);
      success(html);
    });
  }

  /**
   * This function adds the event to the view html
   *
   * @public
   * @param html - HTML template of the view
   * @api
   */
  addEvents(html) {
    html.querySelector('#m-sharemap-geturl').addEventListener('click', () => {
      if (!document.querySelector('#m-plugin-sharemap-title')) {
        this.activateModal();
      }
    });
  }

  /**
   * This function adds modal view to html
   *
   * @public
   * @param html - HTML template of the view
   * @api
   */
  activateModal(onClose) {
    const content = IDEE.template.compileSync(modal, {
      jsonp: true,
      parseToHtml: false,
      vars: {
        title: this.title_,
        text: this.text_,
        btn: this.btn_,
        copyBtn: this.copyBtn_,
        copyBtnHtml: this.copyBtnHtml_,
        tooltip: this.tooltip_,
      },
    });

    IDEE.dialog.info(content, getValue('modalTitle'), this.order);

    const dialogEl = document.querySelector('.m-dialog:last-of-type');
    const dialogContainer = dialogEl.querySelector('.m-message');

    dialogEl.classList.add('m-dialog-sharemap');
    this.accessibilityTab(dialogEl);

    if (this.overwriteStyles_ === true) {
      this.styles_.forEach((style) => {
        const elements = dialogContainer.querySelectorAll(style.id);
        elements.forEach((elm) => {
          const changeElementStyle = elm;
          Object.keys(style.styles).forEach((key) => {
            changeElementStyle.style[key] = style.styles[key];
          });
        });
      });
    }

    const message = dialogContainer.querySelector('#m-plugin-sharemap-message input');
    const html = dialogContainer.querySelector('#m-plugin-sharemap-html input');

    const okButton = dialogContainer.querySelector('#m-plugin-sharemap-button > button');
    okButton.addEventListener('click', () => {
      IDEE.dialog.remove();
      if (typeof onClose === 'function') {
        onClose();
      } else {
        document.querySelector('.m-sharemap-container').click();
        document.querySelector('#m-sharemap-geturl').focus();
      }
    });

    const copyButton = dialogContainer.querySelector('#m-plugin-sharemap-copybutton');
    const copyButtonHtml = dialogContainer.querySelector('#m-plugin-sharemap-copybuttonhtml');

    const title = dialogContainer.querySelector('#m-plugin-sharemap-title');
    copyButton.addEventListener('click', () => {
      copyURL(message);
      beginShade(title.querySelector('#m-plugin-sharemap-tooltip'));
    });

    copyButtonHtml.addEventListener('click', () => {
      copyURL(html);
      beginShade(title.querySelector('#m-plugin-sharemap-tooltip'));
    });

    this.buildURL(dialogContainer);
    this.buildHtml(dialogContainer).then(() => { title.focus(); title.click(); });
  }

  /**
   * This method builds the url to sharing.
   *
   * @public
   * @function
   */
  buildURL(html) {
    this.restWarnings_ = new WeakSet();
    this.urlSizeWarning_ = false;
    const input = html.querySelector('input');
    const twitter = html.querySelector('#twitter');
    const facebook = html.querySelector('#facebook');
    const pinterest = html.querySelector('#pinterest');
    return this.getControls().then((controls) => {
      let shareURL;
      if (this.urlAPI_) {
        const { x, y } = this.map_.getCenter();
        const { code, units } = this.map_.getProjection();
        const bgColorContainer = this.map_.getBGColorContainer();
        const stringBgColor = bgColorContainer !== '' ? `&bgcolorcontainer=${encodeURIComponent(bgColorContainer)}` : '';
        shareURL = `${this.baseUrl_}?center=${x},${y}&zoom=${this.map_.getZoom()}${stringBgColor}`;
        if (!this.minimize_) {
          shareURL = shareURL.concat(`&controls=${controls}`).concat(`&${this.getPlugins()}`);
        } else {
          let newControls = controls.filter((c) => {
            return c !== undefined && c.indexOf('backgroundlayers') === -1;
          }).join(',');

          if (newControls.endsWith(',')) {
            newControls = newControls.slice(0, -1);
          }

          if (newControls.indexOf('scale') === -1 || (newControls.indexOf('scale') === newControls.indexOf('scaleline'))) {
            newControls = newControls.concat(',scale*true');
          }
          shareURL = shareURL.concat(`&controls=${newControls}`).concat('&plugins=layerswitcher,mousesrs');
        }

        const layerParam = this.getLayers();
        shareURL = layerParam.length > 0 ? shareURL.concat(`&layers=${layerParam}`) : shareURL;
        shareURL = shareURL.concat(`&projection=${code}*${units}`);
        if (this.map_.getMapImpl().scene) shareURL = shareURL.concat('&implementation=cesium');
      } else {
        const { x, y } = this.map_.getCenter();
        const bgColorContainer = this.map_.getBGColorContainer();
        const stringBgColor = bgColorContainer !== '' ? `&bgcolorcontainer=${encodeURIComponent(bgColorContainer)}` : '';
        const urlBaseVisor = (window.location.search) ? window.location.href.replace(window.location.search, '') : window.location.href;
        shareURL = `${urlBaseVisor}?center=${x},${y}&zoom=${this.map_.getZoom()}&srs=${this.map_.getProjection().code}${stringBgColor}`;
        let layers = [];

        if (this.shareLayer === true) {
          layers = this.getLayersInLayerswitcher();
        } else if (this.shareLayer === false) {
          layers = this.getLayersInfilterLayers();
        }

        shareURL = layers.length > 0 ? shareURL.concat(`&layers=${layers}`) : shareURL.concat('');
      }
      shareURL = this.prepareShareURL_(shareURL);
      input.value = shareURL || '';
      const copyButton = html.querySelector('#m-plugin-sharemap-copybutton');
      if (copyButton) copyButton.disabled = !shareURL;
      [facebook, twitter, pinterest].forEach((button) => {
        if (button) button.toggleAttribute('disabled', !shareURL);
      });
      if (!shareURL) return;
      IDEE.remote.get(`http://tinyurl.com/api-create.php?url=${encodeURIComponent(shareURL)}`).then((response) => {
        facebook.addEventListener('click', () => window.open(`http://www.facebook.com/sharer.php?u=${response.text}`, '_blank'));
        twitter.addEventListener('click', () => window.open(`https://twitter.com/intent/tweet?url=${response.text}`, '_blank'));
        pinterest.addEventListener('click', () => window.open(`https://www.pinterest.es/pin/create/button/?url=${response.text}`, '_blank'));
      });
    });
  }

  /**
   * Codifica la URL de salida y evita publicar peticiones que excedan el límite habitual.
   * Reserva margen para las cabeceras HTTP adicionales del navegador.
   * @param {String} url URL construida.
   * @returns {String|null} URL utilizable o null cuando es demasiado larga.
   * @private
   */
  prepareShareURL_(url) {
    const encoded = encodeURI(url).replace(/%25([0-9a-f]{2})/gi, '%$1').replace(/\+/g, '%2B');
    if (new TextEncoder().encode(encoded).length > 7000) {
      if (!this.urlSizeWarning_) {
        this.urlSizeWarning_ = true;
        IDEE.toast.error(getValue('exception.urlTooLong'));
      }
      return null;
    }
    return encoded;
  }

  /**
   * This method builds the html.
   *
   * @public
   * @function
   */
  buildHtml(dialog) {
    const html = dialog.querySelector('#m-plugin-sharemap-html');
    const input = html.querySelector('input');
    return this.getControls().then((controls) => {
      let shareURL;
      if (this.urlAPI_) {
        const { x, y } = this.map_.getCenter();
        const { code, units } = this.map_.getProjection();
        const bgColorContainer = this.map_.getBGColorContainer();
        const stringBgColor = bgColorContainer !== '' ? `&bgcolorcontainer=${encodeURIComponent(bgColorContainer)}` : '';
        shareURL = `${this.baseUrl_}?center=${x},${y}&zoom=${this.map_.getZoom()}${stringBgColor}`;
        if (!this.minimize_) {
          shareURL = shareURL.concat(`&controls=${controls}`).concat(`&${this.getPlugins()}`);
        } else {
          let newControls = controls.filter((c) => {
            return c !== undefined && c.indexOf('backgroundlayers') === -1;
          }).join(',');

          if (newControls.endsWith(',')) {
            newControls = newControls.slice(0, -1);
          }

          if (newControls.indexOf('scale') === -1 || (newControls.indexOf('scale') === newControls.indexOf('scaleline'))) {
            newControls = newControls.concat(',scale*true');
          }

          shareURL = shareURL.concat(`&controls=${newControls}`).concat('&plugins=layerswitcher,mousesrs');
        }
        const layerParam = this.getLayers();
        shareURL = layerParam.length > 0 ? shareURL.concat(`&layers=${layerParam}`) : shareURL.concat('');
        shareURL = shareURL.concat(`&projection=${code}*${units}`);
        if (this.map_.getMapImpl().scene) shareURL = shareURL.concat('&implementation=cesium');
      } else {
        const { x, y } = this.map_.getCenter();
        const bgColorContainer = this.map_.getBGColorContainer();
        const stringBgColor = bgColorContainer !== '' ? `&bgcolorcontainer=${encodeURIComponent(bgColorContainer)}` : '';
        const urlBaseVisor = (window.location.search) ? window.location.href.replace(window.location.search, '') : window.location.href;
        shareURL = `${urlBaseVisor}?center=${x},${y}&zoom=${this.map_.getZoom()}${stringBgColor}`;
        let layers = [];

        if (this.shareLayer === true) {
          layers = this.getLayersInLayerswitcher();
        } else if (this.shareLayer === false) {
          layers = this.getLayersInfilterLayers();
        }

        shareURL = layers.length > 0 ? shareURL.concat(`&layers=${layers}`) : shareURL.concat('');
      }
      shareURL = this.prepareShareURL_(shareURL);
      input.value = shareURL ? `<iframe width="800" height="600" frameborder="0" style="border:0" src="${shareURL}"></iframe>` : '';
      const copyButton = html.querySelector('#m-plugin-sharemap-copybuttonhtml');
      if (copyButton) copyButton.disabled = !shareURL;
    });
  }

  /**
   * This methods gets the controls url parameters
   *
   * @public
   * @function
   */
  getControls() {
    if (this.controlsPromise_) {
      return this.controlsPromise_;
    }
    const url = this.baseUrl_.match(/(.*[A-Za-z-0-9])/)[0];
    const controls = this.map_.getControls().map((control) => control.name);
    this.controlsPromise_ = new Promise((resolve) => {
      IDEE.remote.get(`${url}/api/actions/controls`).then((response) => {
        const allowedControls = JSON.parse(response.text);
        const resolvedControls = controls.filter((control) => allowedControls.includes(control))
          .filter((c) => c !== 'backgroundlayers');
        if (resolvedControls.includes('mouse')) {
          const mouseControl = this.map_.getControls().find((c) => c.name === 'mouse');
          const { showProj } = mouseControl.getImpl();
          const index = resolvedControls.indexOf('mouse');
          resolvedControls[index] = showProj === true ? 'mouse*true' : 'mouse';
        }
        if (resolvedControls.includes('scale')) {
          const scaleControl = this.map_.getControls().find((c) => c.name === 'scale');
          const { exactScale } = scaleControl.getImpl();
          const index = resolvedControls.indexOf('scale');
          resolvedControls[index] = exactScale === true ? 'scale*true' : 'scale';
        }
        const backgroundlayers = this.map_.getControls().find((c) => c.name === 'backgroundlayers');
        let backgroundlayersAPI;
        if (!IDEE.utils.isNullOrEmpty(backgroundlayers)) {
          const { visible, activeLayer } = backgroundlayers;
          if (typeof visible === 'boolean' && typeof activeLayer === 'number') {
            backgroundlayersAPI = `backgroundlayers*${activeLayer}*${visible}`;
          } else {
            backgroundlayersAPI = 'backgroundlayers';
          }
        }
        resolvedControls.push(backgroundlayersAPI);
        resolve(resolvedControls);
      }).catch((e) => {
        IDEE.toast.error(getValue('exception.baseUrl'));
        resolve([]);
      });
    });
    return this.controlsPromise_;
  }

  /**
   * This method gets the layers parameters
   *
   * @public
   * @function
   */
  getLayers() {
    if (this.shareLayer === false) {
      return this.getLayersInfilterLayers();
    }
    const layers = this.map_.getLayers().filter((layer) => {
      let res = layer.name !== '__draw__' && layer.name !== 'selectionLayer';
      if (layer.name === 'attributions' && (layer.type === 'KML' || layer.type === 'KMZ')) {
        res = res && false;
      }

      if (layer.displayInLayerSwitcher === false && layer.isBase === false) {
        res = res && false;
      }

      return res;
    });

    return layers.map((layer) => this.layerToParam(layer)).filter((param) => param != null);
  }

  /**
   * This method gets the externs layers parameters
   *
   * @public
   * @function
   */
  getLayersInLayerswitcher() {
    const layers = this.map_.getLayers().filter((layer) => {
      return layer.displayInLayerSwitcher === true && layer.isBase === false;
    });

    return layers.map((layer) => this.layerToParam(layer)).filter((param) => param != null);
  }

  /**
   * @public
   * @function
   */
  getLayersInfilterLayers() {
    const layers = this.map_.getLayers().filter((layer) => this.filterLayers.includes(layer.name));
    return layers.map((layer) => this.layerToParam(layer)).filter((param) => param != null);
  }

  /**
   * This function gets the url param from layer
   *
   * @public
   * @function
   */
  layerToParam(layer) {
    try {
      if (typeof layer.getRestLayer !== 'function') {
        throw new Error('REST_LAYER_UNSUPPORTED');
      }
      return layer.getRestLayer();
    } catch (error) {
      const key = error.message === 'REST_LAYER_LOCAL_BINARY' ? 'localBinary' : 'unsupportedLayer';
      if (!this.restWarnings_.has(layer)) {
        this.restWarnings_.add(layer);
        const name = IDEE.utils.escapeXSS(layer.legend || layer.name || layer.type);
        IDEE.toast.error(getValue(`exception.${key}`).replace('{layer}', name));
      }
      return undefined;
    }
  }

  /**
   * This method gets the plugins url parameter
   */
  getPlugins() {
    return this.map_.getPlugins().map((plugin) => {
      let newCurrent = '';
      if (IDEE.utils.isFunction(plugin.getAPIRest)) {
        const parameter = plugin.getAPIRest();
        if (typeof parameter === 'string') {
          const separator = parameter.indexOf('=');
          newCurrent = separator === -1 ? parameter
            : `${parameter.substring(0, separator)}=${encodeURIComponent(parameter.substring(separator + 1))}`;
        }
      }
      return newCurrent;
    }).join('&');
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
    return control instanceof ShareMapControl;
  }

  accessibilityTab(html) {
    html.querySelectorAll('[tabindex="0"]').forEach((el) => el.setAttribute('tabindex', this.order));
  }
}
