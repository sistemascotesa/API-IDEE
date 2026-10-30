/**
 * @module IDEE/control/BackgroundLayers
 */
import template from 'templates/backgroundlayers';
import myhelp from 'templates/backgroundlayershelp';
import 'assets/css/controls/backgroundlayers';
import ControlImpl from 'impl/control/Control';
import WMS from 'IDEE/layer/WMS';
import WMTS from 'IDEE/layer/WMTS';
import TMS from 'IDEE/layer/TMS';
import { getQuickLayers } from '../api-idee';
import ControlBase from './Control';
import { compileSync as compileTemplate } from '../util/Template';
import {
  LOAD, ADDED_TO_MAP, ADDED_LAYER, REMOVED_LAYER,
} from '../event/eventtype';
import { getValue } from '../i18n/language';
import {
  isBoolean, isNumber, isString, parseUrlParams,
} from '../util/Utils';
import * as Position from '../ui/position';
import { getRestBaseLayers } from '../util/RestBaseLayerStore';

// El aspecto de una entrada no cambia la identidad del recurso que representa.
const visualProperties = new Set([
  'legend', 'visibility', 'displayInLayerSwitcher', 'opacity', 'zIndex', 'isBase', 'queryable',
]);
/**
 * @typedef {Object} module:IDEE/control/BackgroundLayers~Options
 * @api
 * @property {String} [position] Posición del control en el mapa.
 * @property {Number} [order] Accesibilidad, z-index.
 * @property {Number} [layerIndex] Índice de la capa base preseleccionada.
 * @property {Boolean} [visible] Indicador de visibilidad inicial.
 * @property {String} [tooltip] Texto del tooltip.
 * @property {Object} [vendorOptions] Opciones específicas para la implementación.
 */

/**
 * Esta constante indica el número máximo de capas base que tendrá el control.
 *
 * @type {number}
 * @const
 * @public
 */
const MAXIMUM_LAYERS = 5;

/**
 * @classdesc
 * Selector de capas de fondo API-CING.
 * Añade un selector de capas base al mapa.
 *
 * @property {Array<Layer>} layers Proviene de "IDEE.config.backgroundlayers".
 * @property {Array<Layer>} flattedLayers Concadena las capas generadas.
 * @property {Number} activeLayer Esta propiedad indica la capa que se activa.
 * @property {Number} layerIndex Indice de una de las capas de
 * "layers" que se preactivará si se define.
 * @property {Boolean} visible Indica si sera visible o no inicialmente.
 *
 * @extends {IDEE.Control}
 * @api
 */
class BackgroundLayers extends ControlBase {
  /**
   * Constructor principal de la clase.
   * Las capas base provienen de "IDEE.config.backgroundlayers".
   *
   * @constructor
   * @param {module:IDEE/control/BackgroundLayers~Options} options Opciones del control.
   * @example
   *
   * // Ejemplo de como configurar las capas base del mapa usando el control
   * // los "tooltip" de las capas suplen al tooltip general del control en caso de definirse
   * // La configuración debe definirse antes de la creación del mapa
   *
   * IDEE.config.backgroundlayers = [
   *  {
   *      "id": "baseign",
   *      "title": "Base IGN",
   *      "tooltip": "Seleccionar Base IGN",
   *      "layers": [
   *          "QUICK*Base_IGNBaseTodo_TMS"
   *      ]
   *  },
   *  {
   *      "id": "imagen",
   *      "title": "Imagen",
   *      "tooltip": "Seleccionar Imagen",
   *      "layers": [
   *          "QUICK*BASE_PNOA_MA_TMS"
   *      ]
   *  },
   *  {
   *      "id": "hibrido",
   *      "title": "Hibrido",
   *      "tooltip": "Seleccionar Hibrido",
   *      "layers": [
   *          "QUICK*BASE_HIBRIDO_LayerGroup"
   *      ]
   *  }
   * ]
   *
   * const control = new IDEE.control.BackgroundLayers({
   *   position: 'left',
   *   order: 2,
   *   layerIndex: 1,
   *   visible: true,
   *   tooltip: 'Selector de capas base',
   * });
   *
   * @api
   */
  constructor(options = {}) {
    const impl = new ControlImpl(options.vendorOptions);
    super(BackgroundLayers.NAME, impl, options);

    /**
     * layers: Control layers, proviene de "IDEE.config.backgroundlayers".
     */
    this.layers = IDEE.config.backgroundlayers.slice(0, MAXIMUM_LAYERS).map((layer) => {
      return {
        id: layer.id,
        title: layer.title,
        tooltip: layer.tooltip ?? this.tooltip ?? this.translation.title,
        layers: (layer.layers ?? []).map((subLayer) => {
          let l = subLayer;
          if (typeof subLayer === 'string') {
            if (/QUICK.*/.test(subLayer)) {
              l = getQuickLayers(subLayer.replace('QUICK*', ''));
            }
            if (typeof l === 'string') {
              if (/WMTS.*/.test(l)) {
                l = new WMTS(l);
              } else if (/TMS.*/.test(l)) {
                l = new TMS(l);
              } else {
                l = new WMS(l);
              }
            }
          }
          return l;
        }),
      };
    });

    /**
     * flattedLayers: Concadena las capas generadas.
     */
    this.flattedLayers = this.layers.reduce((current, next) => current.concat(next.layers), []);

    /**
     * activeLayer: capa activa por defecto default -1.
     */
    this.activeLayer = -1;

    /**
     * layerIndex: Índice de la capa que se preactivará
     */
    this.layerIndex = (isNumber(options.layerIndex) && options.layerIndex < this.layers.length)
      ? options.layerIndex : 0;

    /**
     * visible: Visibility.
     */
    this.visible = isBoolean(options.visible) ? options.visible : true;

    /**
     * position: Posición del control en el mapa.
     */
    this.position = options.position ?? Position.DOWN;

    /**
    * tooltip: Título del control
    * */
    this.tooltip = isString(options.tooltip) ? options.tooltip : null;
  }

  /**
   * Este método genera la vista.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa donde se incluirá el control.
   * @api
   */
  createView(map) {
    this.map = map;
    const hasExplicitBaseLayer = getRestBaseLayers(map) !== undefined;
    if (hasExplicitBaseLayer) BackgroundLayers.syncRestBaseLayer(this, getValue('backgroundlayers').shared);
    return new Promise((success, fail) => {
      const html = compileTemplate(template, {
        vars: {
          layers: this.layers,
        },
      });
      this.html = html;
      this.listen(html);
      // html.querySelector('button').click();
      // this.uniqueButton = this.html.querySelector('#m-baselayerselector-unique-btn');
      // this.uniqueButton.innerHTML = this.layers[0].title;
      this.on(ADDED_TO_MAP, () => {
        if (hasExplicitBaseLayer) {
          this.updateBaseLayerSelection();
          map.on(ADDED_LAYER, this.updateBaseLayerSelection, this);
          map.on(REMOVED_LAYER, this.updateBaseLayerSelection, this);
          return;
        }
        const visible = this.visible;
        if (this.layerIndex > -1) {
          if (window.innerWidth > IDEE.config.MOBILE_WIDTH) {
            this.activeLayer = this.layerIndex;
          }

          this.showBaseLayer({
            target: {
              parentElement: html,
            },
          }, this.layers[this.activeLayer], this.activeLayer);
        }

        if (visible === false) {
          this.map.removeLayers(this.map.getBaseLayers());
        }
      });
      success(html);
    });
  }

  /**
   * Este método añade el control al mapa.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @api
   * @export
   */
  addTo(map) {
    if (getRestBaseLayers(map) === undefined) {
      map.getBaseLayers().forEach((layer) => {
        layer.once(LOAD, map.removeLayers(layer));
      });
    }
    super.addTo(map);
  }

  /**
   * Este método compara los controles.
   *
   * @public
   * @function
   * @param {IDEE.Control} control Objeto control para comparar.
   * @returns {Boolean} Verdadero es igual, falso si no.
   * @api
   */
  equals(control) {
    return control instanceof BackgroundLayers;
  }

  /**
   * Evento que muestra la capa cuando se hace clic.
   * @public
   * @param {DOMEvent} e Clic en html.
   * @param {object} layersInfo Opciones de la capa.
   * @api
   */
  showBaseLayer(e, layersInfo, i) {
    let callback = this.handlerClickDesktop.bind(this);
    if (window.innerWidth <= IDEE.config.MOBILE_WIDTH) {
      callback = this.handlerClickMobile.bind(this);
    }

    callback(e, layersInfo, i);
  }

  /**
   * Cambia al estilo "responsive".
   * @public
   * @param {Boolean} change Falso móvil (768px), ordenador verdadera (2000px).
   * @api
   */
  changeStyleResponsive(change) {
    IDEE.config.MOBILE_WIDTH = (change) ? '2000' : '768';

    const buttons = document.querySelectorAll('.m-plugin-baselayer .m-panel-controls #div-contenedor button');
    buttons.forEach((e) => {
      // eslint-disable-next-line no-unused-expressions
      (e.classList.contains('m-background-unique-btn'))
        // eslint-disable-next-line space-infix-ops
        ? e.style.display = (change) ? 'block' : 'none'
        : e.style.display = (change) ? 'none' : 'block';
    });
  }

  /**
   * Este método administra el evento de clic cuando la
   * aplicación está en resolución de escritorio.
   *
   * @Public
   * @param {Event} e Evento.
   * @param {IDEE.layer} layersInfo Capas.
   * @param {Number} i Índice.
   * @function
   * @api
   */
  handlerClickDesktop(e, layersInfo, i) {
    // Guarda la selección antes de que REMOVED_LAYER actualice los botones.
    const isActived = e.target.parentElement
      .querySelector(`#m-baselayerselector-${layersInfo.id}`)
      .classList.contains('activeBaseLayerButton');
    this.removeLayers();
    this.visible = false;
    const { layers } = layersInfo;
    layers.forEach((layer, index, array) => layer.setZIndex(index - array.length));

    e.target.parentElement.querySelectorAll('button[id^="m-baselayerselector-"]').forEach((button) => {
      if (button.classList.contains('activeBaseLayerButton')) {
        button.classList.remove('activeBaseLayerButton');
      }
    });
    if (!isActived) {
      this.visible = true;
      this.activeLayer = i;
      // e.target.parentElement.querySelector('#m-baselayerselector-unique-btn').innerText = title;
      e.target.parentElement
        .querySelector(`#m-baselayerselector-${layersInfo.id}`).classList.add('activeBaseLayerButton');
      this.map.addLayers(layers);
    }
  }

  /**
   * Esta función gestiona el evento de clic cuando la aplicación está en resolución móvil.
   * @function
   * @public
   * @param {Event} e Evento.
   * @api
   */
  handlerClickMobile(e) {
    this.removeLayers();
    this.activeLayer += 1;
    this.activeLayer %= this.layers.length;
    const layersInfo = this.layers[this.activeLayer];
    const { layers, id, title } = layersInfo;
    layers.forEach((layer, index, array) => layer.setZIndex(index - array.length));
    e.target.parentElement.querySelectorAll('button[id^="m-baselayerselector-"]').forEach((button) => {
      if (button.classList.contains('activeBaseLayerButton')) {
        button.classList.remove('activeBaseLayerButton');
      }
    });

    e.target.innerHTML = title;
    e.target.parentElement.querySelector(`#m-baselayerselector-${id}`).classList.add('activeBaseLayerButton');
    this.map.addLayers(layers);
    this.visible = true;
  }

  /**
   * Esta función elimina "this.flattedLayers" del mapa.
   * @function
   * @public
   * @api
   */
  removeLayers() {
    if (getRestBaseLayers(this.map) !== undefined) {
      this.map.removeLayers(this.map.getActiveBaseLayers());
    }
    this.map.removeLayers(this.flattedLayers);
    this.map.removeLayers(this.map.getBaseLayers());
  }

  /** Componentes de la selección para la coordinación interna de fondos. @private */
  getSelectedBaseLayers() {
    return this.layers[this.activeLayer]?.layers || [];
  }

  /** Normaliza los parámetros del recurso sin modificar el objeto original. @private */
  static resource(value) {
    if (Array.isArray(value)) return value.map(BackgroundLayers.resource);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(Object.keys(value).sort().filter((key) => !visualProperties.has(key))
      .map((key) => [key, BackgroundLayers.resource(value[key])]));
  }

  /**
   * Clave de comparación REST para los catálogos de selectores, sin modificar sus entradas.
   * @param {IDEE.Map} map Mapa que interpreta las definiciones del catálogo.
   * @param {Array<IDEE.Layer|String>} layers Componentes de una entrada.
   * @returns {String} Identidad normalizada de sus recursos.
   * @private
   */
  static getBaseLayerResourceKey(map, layers) {
    const resources = (values) => values.flatMap((value) => {
      const layer = typeof value === 'string' ? map.getLayerByString(value) : value;
      if (layer.type === 'LayerGroup') {
        const children = layer.getLayers();
        return resources(children.length ? children
          : layer.constructorParameters.userParameters.layers);
      }
      const [type, parameters] = layer.getRestLayer().split('*');
      return [BackgroundLayers.resource({ type, ...parseUrlParams(parameters, type) })];
    });
    return JSON.stringify(resources(layers));
  }

  /**
   * Busca una entrada equivalente en el catálogo de cualquiera de los dos selectores.
   * @param {IDEE.Control} selector Selector de fondos.
   * @param {Array<IDEE.Layer>} layers Componentes del fondo actual.
   * @returns {Number} Índice de la entrada o -1.
   * @private
   */
  static findBaseLayer(selector, layers) {
    const key = BackgroundLayers.getBaseLayerResourceKey(selector.map, layers);
    return selector.layers.findIndex((entry) => {
      try {
        return BackgroundLayers.getBaseLayerResourceKey(selector.map, entry.layers) === key;
      } catch (error) {
        return false;
      }
    });
  }

  /**
   * Integra el fondo actual en una copia del catálogo antes de generar la vista.
   * @param {IDEE.Control} selector Selector de fondos.
   * @param {String} fallbackTitle Título traducido si las capas no tienen nombre ni leyenda.
   * @private
   */
  static syncRestBaseLayer(selector, fallbackTitle) {
    const control = selector;
    const layers = control.map.getActiveBaseLayers();
    if (!layers.length) return;
    let index = BackgroundLayers.findBaseLayer(control, layers);
    control.layers = control.layers.map((entry) => ({ ...entry }));
    if (index < 0) {
      const title = layers.flatMap((layer) => (layer.type === 'LayerGroup' && layer.name === 'shared-base'
        ? layer.getLayers() : [layer]))
        .map((layer) => layer.legend || layer.name).filter(Boolean).join(' + ') || fallbackTitle;
      index = control.layers.length;
      control.layers.push({
        id: 'rest-shared-base', title, tooltip: title, preview: '', layers,
      });
    } else {
      control.layers[index].layers = layers;
    }
    control.flattedLayers = control.layers.flatMap((entry) => entry.layers);
    control.activeLayer = index;
  }

  /**
   * Actualiza el índice y la visibilidad del selector según las capas presentes.
   * @param {IDEE.Control} selector Selector de fondos.
   * @private
   */
  static updateBaseLayerState(selector) {
    const control = selector;
    const present = new Set(control.map.getLayers().filter((layer) => layer.isVisible()));
    const index = control.layers.findIndex((entry) => entry.layers.length
      && entry.layers.every((layer) => present.has(layer)));
    control.visible = index >= 0;
    if (control.visible) control.activeLayer = index;
  }

  /** Los eventos solo actualizan la selección visual; no vuelven a cargar capas. @private */
  updateBaseLayerSelection() {
    BackgroundLayers.updateBaseLayerState(this);
    this.html.querySelectorAll('.activeBaseLayerButton').forEach((button) => {
      button.classList.remove('activeBaseLayerButton');
    });
    if (this.visible) {
      this.html.querySelector(`#m-baselayerselector-${this.layers[this.activeLayer].id}`)
        .classList.add('activeBaseLayerButton');
    }
  }

  /** Retira únicamente los listeners añadidos para sincronizar el fondo REST. */
  destroy() {
    this.map.un(ADDED_LAYER, this.updateBaseLayerSelection, this);
    this.map.un(REMOVED_LAYER, this.updateBaseLayerSelection, this);
    super.destroy();
  }

  /**
   * Esta función agrega el detector de eventos a cada botón del html.
   * @param {HTMLElement} html Elemento botón.
   * @function
   * @public
   * @api
   */
  listen(html) {
    html.querySelectorAll('button.m-background-group-btn')
      .forEach((b, i) => b.addEventListener('click', (e) => this.showBaseLayer(e, this.layers[i], i)));
    // html.querySelector('#m-baselayerselector-unique-btn')
    // .addEventListener('click', (e) => this.showBaseLayer(e));
  }

  /**
   * Obtiene la ayuda del control
   *
   * @function
   * @public
   * @api
  */
  getHelp() {
    const textHelp = getValue(BackgroundLayers.NAME).textHelp;
    return {
      title: BackgroundLayers.NAME,
      content: new Promise((success) => {
        const html = compileTemplate(myhelp, {
          vars: {
            urlImages: `${IDEE.config.STATIC_RESOURCES_URL}/imagenes/controles`,
            translations: {
              help1: textHelp.text1,
            },
          },
        });
        success(html);
      }),
    };
  }
}

/**
 * Nombre para identificar este control.
 * @const
 * @type {string}
 * @public
 * @api
 */
BackgroundLayers.NAME = 'backgroundlayers';

export default BackgroundLayers;
