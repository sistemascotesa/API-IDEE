/* eslint-disable no-underscore-dangle */
/**
 * @module IDEE/impl/layer/Tiles3D
 */
import {
  ClippingPlane, ClippingPlaneCollection,
  Cesium3DTileStyle, Rectangle, Math as CesiumMath,
} from 'cesium';
import ClusteredFeature from 'IDEE/feature/Clustered';
import {
  isNullOrEmpty,
  extend,
  isFunction,
  includes,
} from 'IDEE/util/Utils';
import { compileSync as compileTemplate } from 'IDEE/util/Template';
import Popup from 'IDEE/Popup';
import * as EventType from 'IDEE/event/eventtype';

import geojsonPopupTemplate from 'templates/geojson_popup';
import Layer from './Layer';
import normalizeTiles3DOptions from '../../../common/Tiles3DOptions';
import { createTilesetSource } from '../scene/tiles3d/Tiles3DSource';
import composeTiles3DOpacityStyle from '../scene/tiles3d/Tiles3DOpacityStyle';
import Tiles3DLoadGuard from '../scene/tiles3d/Tiles3DLoadGuard';

/**
 * Resuelve un estilo de fachada o un objeto plano al formato de Cesium3DTileStyle.
 *
 * @function
 * @param {Object} style Estilo IDEE.style.Tiles3D u objeto de estilo 3D Tiles.
 * @returns {Object} Objeto para Cesium3DTileStyle.
 */
const resolveCesium3DTileStyle = (style) => {
  if (isNullOrEmpty(style)) {
    return undefined;
  }
  if (style instanceof Cesium3DTileStyle) {
    return style.style;
  }
  if (isFunction(style.getImpl)) {
    const styleImpl = style.getImpl();
    if (!isNullOrEmpty(styleImpl) && isFunction(styleImpl.toCesiumStyle)) {
      return styleImpl.toCesiumStyle();
    }
  }
  return style;
};

const toOpacity = (opacity) => {
  const value = Number(opacity);
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : undefined;
};

/**
 * @classdesc
 * Las capas Tiles3D son un estándar OGC que se refieren a un conjunto de teselas que
 * se organizan en una estructura de datos espaciales jerárquica.
 *
 * https://URL/tileset.json
 *
 * @property {String} url Url del servicio Tiles3D.
 * @property {Boolean} visibility Define si la capa es visible o no.
 * @property {Boolean} displayInLayerSwitcher Mostrar en el selector de capas.
 *
 * @api
 * @extends {IDEE.impl.Layer}
 */
class Tiles3D extends Layer {
  /**
   * Constructor principal de la clase. Crea una capa Tiles3D
   * con parámetros especificados por el usuario.
   *
   * @constructor
   * @param {Mx.parameters.Tiles3D} userParameters Parámetros para la construcción de la capa.
   * - url: Url del servicio de la capa.
   * - ionAssetId: Identificador del asset de Cesium ion (alternativa a url).
   * - name: Nombre de la capa en la leyenda.
   * - legend: Indica el nombre que queremos que aparezca en el árbol de contenidos, si lo hay.
   * - visibility: Indica si la capa estará por defecto visible o no.
   * - type: Tipo de la capa.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * @param {Mx.parameters.LayerOptions} options Parámetros opcionales para la capa.
   * - style: Define el estilo de la capa.
   * - extract: Activa la consulta por click en el objeto geográfico, por defecto, falso.
   * - maximumScreenSpaceError: Error máximo de espacio en pantalla.
   * - clippingPlanes: Planos de recorte.
   * - ionAccessToken, ionServer, headers, queryParameters: Opciones de acceso.
   * - opacity, minZoom, maxZoom: Opacidad y rango de zoom.
   * @param {Object} vendorOptions Opciones para la biblioteca base. Ejemplo vendorOptions:
   * @api stable
   */
  constructor(userParameters, options = {}, vendorOptions = {}) {
    super(options, vendorOptions);

    /**
     * Fuente y opciones de acceso normalizadas.
     * @private
     */
    this.normalized_ = normalizeTiles3DOptions(userParameters, options);

    /**
      * Tiles3D url.
      * La URL de origen de la capa Tiles3D.
      */
    this.url = this.normalized_.url;

    /**
     * Identificador del asset de Cesium ion.
     */
    this.ionAssetId = this.normalized_.ionAssetId;

    /**
     * Servidor de Cesium ion.
     */
    this.ionServer = this.normalized_.ionServer;

    /**
     * Tiles3D visibility.
     * Define si la capa es visible o no.
     */
    this.visibility = userParameters.visibility === false ? userParameters.visibility : true;

    /**
     * Tiles3D displayInLayerSwitcher:
     * Mostrar en el selector de capas.
     */
    this.displayInLayerSwitcher = userParameters.displayInLayerSwitcher !== false;

    /**
     * Tiles3D opacity_.
     * Opacidad de la capa.
     */
    this.opacity_ = toOpacity(options.opacity) ?? 1;

    /**
     * Tiles3D style.
     * Estilo de la capa.
     */
    this.style = !isNullOrEmpty(options.style) ? options.style : undefined;

    /**
     * Revisiones de carga del tileset.
     * @private
     */
    this.loadGuard_ = new Tiles3DLoadGuard();

    /**
     * Fuente del tileset.
     * @private
     */
    this.source_ = null;
  }

  /**
   * Este método añade la capa al mapa de la implementación.
   *
   * @public
   * @function
   * @param {IDEE.impl.Map} map Mapa de la implementación.
   * @api
   */
  addTo(map) {
    this.map = map;
    const optCesiumLayer = extend({
      show: this.visibility,
      enablePick: true,
    }, this.vendorOptions_, true);

    const { maximumScreenSpaceError, clippingPlanes } = this.options;

    const source = createTilesetSource(this.normalized_, { ticket: IDEE.config.TICKET });
    this.source_ = source;
    const revision = this.loadGuard_.begin();
    source.load({
      tilesetOptions: {
        maximumScreenSpaceError,
        clippingPlanes,
        ...optCesiumLayer,
      },
    }).then((tileset) => {
      if (this.loadGuard_.settle(revision, tileset)) {
        this.adoptTileset_(tileset);
      }
    }).catch((error) => {
      if (this.loadGuard_.isCurrent(revision)) {
        this.facadeLayer_?.fire(EventType.LOAD_ERROR, [source.sanitizeError(error)]);
      }
    });
  }

  /**
   * Incorpora a la escena el tileset cargado con el estilo y la opacidad de la capa.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @function
   * @param {Cesium3DTileset} tileset Tileset cargado.
   */
  adoptTileset_(tileset) {
    this.cesiumLayer = tileset;
    try {
      this.applyStyle_();
    } catch (error) {
      this.cesiumLayer = null;
      tileset.destroy();
      throw error;
    }
    this.map.getMapImpl().scene.primitives.add(tileset);
    this.fireAddedToMap_();
  }

  /**
   * Aplica al tileset el estilo del usuario combinado con la opacidad de la capa.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @function
   */
  applyStyle_() {
    if (isNullOrEmpty(this.cesiumLayer)) return;
    const style = composeTiles3DOpacityStyle(resolveCesium3DTileStyle(this.style), this.opacity_);
    this.cesiumLayer.style = isNullOrEmpty(style) ? undefined : new Cesium3DTileStyle(style);
  }

  /**
   * Pasa los objetos geográficos a la plantilla.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   *
   * @public
   * @function
   * @param {Cesium.EntityCollection} feature Objetos geográficos de Cesium.
   * @returns {Object} "FeaturesTemplate.features".
   * @api stable
   */
  parseFeaturesForTemplate_(features) {
    const featuresTemplate = {
      features: [],
    };

    features.forEach((feature) => {
      const featureTemplate = {
        id: feature.getId(),
        attributes: this.recursiveExtract_(feature.getAttributes()),
      };
      featuresTemplate.features.push(featureTemplate);
    });
    return featuresTemplate;
  }

  recursiveExtract_(properties, parentKey = '') {
    const attributes = [];

    const propertyKeys = Object.keys(properties);

    propertyKeys.forEach((key) => {
      let addAttribute = true;
      // adds the attribute just if it is not in
      // hiddenAttributes_ or it is in showAttributes_
      if (!isNullOrEmpty(this.showAttributes_)) {
        addAttribute = includes(this.showAttributes_, key);
      } else if (!isNullOrEmpty(this.hiddenAttributes_)) {
        addAttribute = !includes(this.hiddenAttributes_, key);
      }

      if ((typeof properties[key] === 'object' && properties[key]) && !Array.isArray(properties[key])) {
        const values = this.recursiveExtract_(properties[key], (parentKey) ? `${parentKey} | ${key}` : key);
        attributes.push(...values);
      } else if (addAttribute) { // No se añade si es null o undefined
        const fullKey = parentKey ? `${parentKey} | ${key}` : key;
        const filter = fullKey.split(' | ');
        attributes.push({
          key: (parentKey) ? `${filter[filter.length - 2]} | ${filter[filter.length - 1]}` : key,
          value: properties[key],
        });
      }
    });

    return attributes;
  }

  /**
   * Este método devuelve el índice z de esta capa.
   *
   * @function
   * @return {Number} Índice de la capa.
   * @api stable
   * @expose
   */
  getZIndex() {
    return this.zIndex_;
  }

  /**
   * Este método establece el índice z de esta capa. El índice es la clave de
   * orden de la capa en su colección del visor; el mapa reordena la colección.
   *
   * @function
   * @param {Number} zIndex Índice de la capa.
   * @api stable
   * @expose
   */
  setZIndex(zIndex) {
    this.zIndex_ = zIndex;
    if (!isNullOrEmpty(this.map) && !isNullOrEmpty(this.getLayer())) {
      // eslint-disable-next-line no-underscore-dangle
      this.map.getImpl().sortLayers_();
    }
  }

  /**
    * Este método devuelve la opacidad de esta capa.
    *
    * @function
    * @returns {Number} Opacidad (0, 1). Predeterminado 1.
    * @api stable
    * @expose
    */
  getOpacity() {
    return this.opacity_;
  }

  /**
   * Este método establece la opacidad de esta capa, que se aplica como alfa del color
   * del estilo.
   *
   * @function
   * @param {Number} opacity Opacidad (0, 1). Predeterminado 1.
   * @api stable
   * @expose
   */
  setOpacity(opacity) {
    const value = toOpacity(opacity);
    if (value === undefined) return;
    this.opacity_ = value;
    this.applyStyle_();
  }

  /**
   * Este método establece la máxima extensión de la capa.
   *
   * @function
   * @param {Mx.Extent} maxExtent Máxima extensión.
   * @public
   * @api
   */
  setMaxExtent(maxExtent) {}

  /**
   * Este método devuelve la máxima extensión de la capa.
   *
   * @function
   * @param {Mx.Extent} maxExtent Máxima extensión.
   * @public
   * @api
   */
  getMaxExtent() {
    if (!isNullOrEmpty(this.cesiumLayer)) {
      const boundingSphere = this.cesiumLayer.boundingSphere;
      const rectangle = Rectangle.fromBoundingSphere(boundingSphere);

      return [
        CesiumMath.toDegrees(rectangle.west),
        CesiumMath.toDegrees(rectangle.south),
        CesiumMath.toDegrees(rectangle.east),
        CesiumMath.toDegrees(rectangle.north),
      ];
    }
    return [-180, -90, 180, 90];
  }

  /**
   * Este método ejecuta un objeto geográfico seleccionado.
   *
   * @function
   * @param {Cesium.Entity} features Objeto geográfico de Cesium.
   * @param {Array} coord Coordenadas.
   * @param {Object} evt Eventos.
   * @api stable
   * @expose
   */
  selectFeatures(features, coord, evt) {
    const feature = features[0];
    if (!(feature instanceof ClusteredFeature) && (this.extract === true)) {
      if (!isNullOrEmpty(feature)) {
        const clickFn = feature.getAttribute('vendor.api_idee.click');
        if (isFunction(clickFn)) {
          clickFn(evt, feature);
        } else {
          const htmlAsText = compileTemplate(geojsonPopupTemplate, {
            vars: this.parseFeaturesForTemplate_(features),
            parseToHtml: false,
          });
          const featureTabOpts = {
            icon: 'g-cartografia-pin',
            title: this.name,
            content: htmlAsText,
          };
          let popup = this.map.getPopup();
          if (isNullOrEmpty(popup)) {
            popup = new Popup();
            popup.addTab(featureTabOpts);
            this.map.addPopup(popup, coord);
          } else {
            popup.addTab(featureTabOpts);
          }
        }
      }
    }
  }

  /**
   * Este método establece la capa Cesium.
   *
   * @function
   * @param {Cesium3DTileset} layer Capa de Cesium.
   * @api stable
   * @expose
   */
  setLayer(layer) {
    const cesiumMap = this.map.getMapImpl();
    if (this.cesiumLayer !== layer) {
      let zIndex = cesiumMap.scene.primitives._primitives
        .findIndex((l) => this.cesiumLayer === l);
      zIndex = zIndex !== -1 ? zIndex : 0;

      cesiumMap.scene.primitives.remove(this.cesiumLayer);
      this.cesiumLayer = layer;
      cesiumMap.scene.primitives.add(layer, zIndex);
    }
    return this;
  }

  /**
   * Este método devuelve el estilo de la capa.
   *
   * @function
   * @public
   * @returns {Object} Estilo de la capa.
   * @api
   */
  getStyle() {
    return this.style;
  }

  /**
   * Este método establece el estilo en capa.
   *
   * @function
   * @public
   * @param {Object|IDEE.style.Tiles3D} style Estilo que se aplicará a la capa.
   * @api
   */
  setStyle(style) {
    this.style = style;
    this.applyStyle_();
  }

  /**
   * Este método destruye esta capa, limpiando el HTML
   * y anulando el registro de todos los eventos.
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.facadeLayer_?.stopAutoRefresh();
    this.loadGuard_.invalidate();
    const tileset = this.cesiumLayer;
    if (!isNullOrEmpty(tileset)) {
      const primitives = this.map?.getMapImpl()?.scene?.primitives;
      if (primitives?.contains(tileset)) {
        primitives.destroyPrimitives = true;
        primitives.remove(tileset);
      } else if (!tileset.isDestroyed()) {
        tileset.destroy();
      }
    }
    this.cesiumLayer = null;
    this.source_ = null;
    this.map = null;
  }

  /**
   * Este método comprueba si un objeto es igual
   * a esta capa.
   *
   * @function
   * @param {Object} obj Objeto a comparar.
   * @returns {Boolean} Verdadero es igual, falso si no.
   * @api stable
   */
  equals(obj) {
    let equals = false;

    if (obj instanceof Tiles3D) {
      equals = (this.url === obj.url);
      equals = equals && (this.ionAssetId === obj.ionAssetId);
      equals = equals && (this.ionServer === obj.ionServer);
      equals = equals && (this.name === obj.name);
    }

    return equals;
  }

  /**
   * Recarga la fuente manteniendo la capa y sus opciones de representación.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   */
  async refreshSource(isCurrent = () => true) {
    const previous = this.cesiumLayer;
    const source = this.source_;
    if (!previous || !previous.tilesLoaded) return;
    if (!source || !source.canRefresh()) return;
    let next;
    try {
      next = await source.load({
        tilesetOptions: {
          ...this.vendorOptions_,
          maximumScreenSpaceError: previous.maximumScreenSpaceError,
          modelMatrix: previous.modelMatrix,
          show: previous.show,
        },
        queryParameters: { _ideeRefresh: Date.now() },
      });
    } catch (error) {
      throw source.sanitizeError(error);
    }
    if (!isCurrent() || this.cesiumLayer !== previous) {
      next.destroy();
      return;
    }
    next.style = previous.style;
    if (previous.clippingPlanes) {
      const clipping = previous.clippingPlanes;
      next.clippingPlanes = new ClippingPlaneCollection({
        planes: Array.from({ length: clipping.length }, (_, index) => {
          const plane = clipping.get(index);
          return new ClippingPlane(plane.normal, plane.distance);
        }),
        enabled: clipping.enabled,
        modelMatrix: clipping.modelMatrix,
        unionClippingRegions: clipping.unionClippingRegions,
        edgeColor: clipping.edgeColor,
        edgeWidth: clipping.edgeWidth,
      });
    }
    const primitives = this.map.getMapImpl().scene.primitives;
    let index = 0;
    while (index < primitives.length && primitives.get(index) !== previous) index += 1;
    if (index === primitives.length) {
      next.destroy();
      return;
    }
    primitives.add(next, index);
    primitives.remove(previous);
    this.cesiumLayer = next;
    this.map.getMapImpl().scene.requestRender();
  }
}

export default Tiles3D;
