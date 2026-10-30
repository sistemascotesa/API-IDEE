/**
 * @module IDEE/control/BackImgLayerControl
 */

import template from '../../templates/backimglayer';
import { getValue } from './i18n/language';

/**
 * This parameter indicates the maximum base layers of plugin
 *
 * @type {number}
 * @const
 * @private
 */
// const MAXIMUM_LAYERS = 5;

/**
 * @classdesc
 * Background layers selector api-idee control.
 * This control puts a set of layers in the background of the map.
 */
export default class BackImgLayerControl extends IDEE.Control {
  /**
   * @constructor
   * @extends {IDEE.Control}
   * @api stable
   */
  constructor({
    map,
    visible,
    layerOpts,
    layerId: idLayer,
    ids,
    titles,
    previews,
    layers,
    empty,
    order,
    columnsNumber,
  }) {
    const impl = new IDEE.impl.Control();
    super('BackImgLayer', impl);

    if (IDEE.util.RestBaseLayerStore.getRestBaseLayers(map) === undefined) {
      map.getBaseLayers().forEach((layer) => {
        layer.on(IDEE.evt.LOAD, map.removeLayers(layer));
      });
    }

    this.layers = [];

    if (layerOpts) {
      this.layers = layerOpts;
    } else {
      const idsArray = ids.split(',');
      const titlesArray = titles.split(',');
      const previewArray = previews.split(',');
      const layersArray = layers.split(',');

      layersArray.forEach((baseLayer, idx) => {
        let backgroundLayers = baseLayer.split('sumar');

        backgroundLayers = backgroundLayers.map((urlLayer) => {
          let aux = null;
          if (/QUICK.*/.test(urlLayer)) {
            aux = IDEE.getQuickLayers(urlLayer.replace('QUICK*', ''));
          }
          let apiIdeeLayer;
          if (!IDEE.utils.isNullOrEmpty(aux)) {
            apiIdeeLayer = aux;
            if (typeof apiIdeeLayer === 'string') {
              apiIdeeLayer = new IDEE.layer.WMTS(apiIdeeLayer);
            }
          } else {
            apiIdeeLayer = new IDEE.layer.WMTS(urlLayer);
          }
          return apiIdeeLayer;
        });

        this.layers.push({
          id: idsArray[idx],
          title: titlesArray[idx],
          preview: previewArray[idx],
          layers: backgroundLayers,
        });
      });
    }

    this.flattedLayers = this.layers.reduce((current, next) => current.concat(next.layers), []);
    this.activeLayer = -1;
    /* this.idLayer saves active layer position on layers array */
    this.idLayer = idLayer === null ? 0 : idLayer;
    this.visible = visible;
    this.empty = empty;
    this.columnsNumber = columnsNumber;
    this.order = order;
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
    this.map = map;
    const hasExplicitBaseLayer = IDEE.util.RestBaseLayerStore.getRestBaseLayers(map) !== undefined;
    if (hasExplicitBaseLayer) {
      IDEE.control.BackgroundLayers.syncRestBaseLayer(this, getValue('shared'));
    }
    return new Promise((success, fail) => {
      const html = IDEE.template.compileSync(template, {
        vars: {
          layers: this.layers,
          columnsNumber: this.columnsNumber,
          empty: this.empty,
          translations: {
            headertitle: getValue('tooltip'),
            none: getValue('none'),
          },
        },
      });
      this.accessibilityTab(html);
      this.html = html;
      this.listen(html);
      this.on(IDEE.evt.ADDED_TO_MAP, () => {
        if (hasExplicitBaseLayer) {
          this.updateBaseLayerSelection();
          map.on(IDEE.evt.ADDED_LAYER, this.updateBaseLayerSelection, this);
          map.on(IDEE.evt.REMOVED_LAYER, this.updateBaseLayerSelection, this);
          this.fire('backimglayer:activeChanges', [{ activeLayerId: this.activeLayer }]);
          return;
        }
        const visible = this.visible;
        if (this.idLayer > -1) {
          this.activeLayer = this.idLayer;
          this.showBaseLayer({
            currentTarget: {
              parentElement: html,
            },
          }, this.layers[this.activeLayer], this.activeLayer);
        }

        if (visible === false) {
          this.map.removeLayers(this.map.getBaseLayers());
          this.html.querySelector('.m-backimglayer-active').classList.remove('m-backimglayer-active');
        }
      });

      success(html);
    });
  }

  /**
   * Method fire the click event on HTMLElement of *`empty layer`*
   * @param {HTMLElement} html
   */
  showEmptyLayer(html) {
    const elem = html.querySelector('#backimglayer-previews div.m-backimglayer-active');
    if (elem !== null) {
      elem.click();
    }
  }

  /**
   * This function adds layer bound to the button clicked
   *
   * @function
   * @public
   * @api
   * @param {Event} e
   * @param {} layersInfo
   * @param {} i
   */
  showBaseLayer(e, layersInfo, i) {
    // Guarda la selección antes de que REMOVED_LAYER actualice los botones.
    const isActivated = e.currentTarget.parentElement
      .querySelector(`#backimglayer-layer-${layersInfo.id}`)
      .classList.contains('m-backimglayer-active');
    this.removeLayers();
    this.visible = false;
    const { layers } = layersInfo;

    layers.forEach((layer, index) => {
      let sumIndex = index;
      if (index !== 0) {
        sumIndex += 16;
      }

      /* eslint-disable no-underscore-dangle */
      if (layer.zindex_) {
        layer.setZIndex(sumIndex);
      }
    });

    e.currentTarget.parentElement.querySelectorAll('div[id^="backimglayer-layer-"]').forEach((imgContainer) => {
      imgContainer.classList.remove('m-backimglayer-active');
    });

    if (!isActivated) {
      this.visible = true;
      this.activeLayer = i;
      e.currentTarget.parentElement
        .querySelector(`#backimglayer-layer-${layersInfo.id}`)
        .classList.add('m-backimglayer-active');
      // IDEE.proxy(false);
      this.map.addLayers(layers);
      // setTimeout(() => {
      // IDEE.proxy(true);
      /*
        layers.forEach((l) => {
          l.setVisible(true);
        });
        */
      // }, 1000);
    } else if (this.empty) {
      e.currentTarget.parentElement
        .querySelector('#backimglayer-layer-empty')
        .classList.add('m-backimglayer-active');
    }

    this.fire('backimglayer:activeChanges', [{ activeLayerId: this.activeLayer }]);
  }

  /**
   * This function removes this.layers from Map.
   * @function
   * @public
   * @api
   */
  removeLayers() {
    if (IDEE.util.RestBaseLayerStore.getRestBaseLayers(this.map) !== undefined) {
      this.map.removeLayers(this.map.getActiveBaseLayers());
    }
    try {
      this.map.removeLayers(this.flattedLayers);
    } catch (err) { /* Continue */ }

    try {
      this.map.removeLayers(this.map.getBaseLayers());
    } catch (err) { /* Continue */ }
  }

  /** Componentes de la selección para la coordinación interna de fondos. @private */
  getSelectedBaseLayers() {
    return this.layers[this.activeLayer]?.layers || [];
  }

  /** Los eventos solo actualizan la selección visual; no vuelven a cargar capas. @private */
  updateBaseLayerSelection() {
    IDEE.control.BackgroundLayers.updateBaseLayerState(this);
    this.html.querySelectorAll('.m-backimglayer-active').forEach((button) => {
      button.classList.remove('m-backimglayer-active');
    });
    const id = this.visible ? this.layers[this.activeLayer].id : 'empty';
    this.html.querySelector(`#backimglayer-layer-${id}`)?.classList.add('m-backimglayer-active');
  }

  /** Retira únicamente los listeners añadidos para sincronizar el fondo REST. */
  destroy() {
    this.map.un(IDEE.evt.ADDED_LAYER, this.updateBaseLayerSelection, this);
    this.map.un(IDEE.evt.REMOVED_LAYER, this.updateBaseLayerSelection, this);
    super.destroy();
  }

  /**
   * This function add the events listener to each button of the html
   * @param {HTMLElement} html
   * @function
   * @public
   * @api
   */
  listen(html) {
    // eslint-disable-next-line no-param-reassign
    html.querySelectorAll('div[id^="backimglayer-layer-"]').forEach((b, i) => {
      if (b.id === 'backimglayer-layer-empty') {
        b.addEventListener('click', this.showEmptyLayer.bind(this, html));
        b.addEventListener('keydown', ({ key }) => {
          if (key === 'Enter') this.showEmptyLayer(html);
        });
      } else {
        b.addEventListener('click', (e) => this.showBaseLayer(e, this.layers[i], i));
        b.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') this.showBaseLayer(e, this.layers[i], i);
        });
      }
    });
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
    return control instanceof BackImgLayerControl;
  }

  accessibilityTab(html) {
    html.querySelectorAll('[tabindex="0"]').forEach((el) => el.setAttribute('tabindex', this.order));
  }
}
