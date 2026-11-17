/**
 * @module IDEE/impl/layer/DataIDEE
 */
import { Math as CesiumMath } from 'cesium';
import FormatGeoJSON from 'IDEE/format/GeoJSON';
import * as EventType from 'IDEE/event/eventtype';
import { isNullOrEmpty } from 'IDEE/util/Utils';
import ServiceDataIDEE from '../service/DataIDEE';
import JsonLoader from '../loader/DataIDEE';
import OGCAPIFeatures from './OGCAPIFeatures';
import ImplUtils from '../util/Utils';
import RequestManager, { RequestCancelledError } from '../../../common/RequestManager';
import { isUnauthorizedError } from '../../../common/DataIDEERequest';
import normalizeDataIDEEOptions, { validateContextToken } from '../../../common/DataIDEEOptions';
import { createContextTokenSource, createUrlDecorator } from '../../../common/DataIDEEContextToken';
import DataIDEEViewport from '../../../common/DataIDEEViewport';

/**
 * OGC API Features JSON vector layer implementation.
 * @extends {IDEE.impl.layer.OGCAPIFeatures}
 * @api
 */
class DataIDEE extends OGCAPIFeatures {
  constructor(options = {}, vendorOptions = {}) {
    super(options, vendorOptions);
    const normalized = normalizeDataIDEEOptions(options, vendorOptions);
    this.requestManagerOptions_ = normalized.requestManager;
    this.requestManager_ = new RequestManager(this.requestManagerOptions_);
    this.requestRevision_ = 0;
    this.bboxStrategy_ = normalized.bboxStrategy;
    this.viewport_ = this.bboxStrategy_ ? new DataIDEEViewport({
      getExtent: () => this.getVisibleExtent_(),
      getProjectionCode: () => this.map?.getProjection().code,
      listen: (onChange) => this.listenViewport_(onChange),
    }) : null;
    this.contextTokenSource_ = createContextTokenSource(vendorOptions.contextToken);
  }

  /**
   * Devuelve el token de autenticación de la capa. Es opcional: una capa
   * pública no tiene token.
   * @returns {String|undefined} Token configurado en getFeature.token.
   * @public
   * @api
   */
  getToken() {
    const token = this.vendorOptions_.getFeature?.token;
    return isNullOrEmpty(token) ? undefined : token;
  }

  /**
   * Cambia el token de autenticación, descarta la caché del token anterior
   * y recarga la capa si está en un mapa.
   * @param {String} token Nuevo token. Si es vacío, se elimina.
   * @public
   * @api
   */
  setToken(token) {
    const newToken = isNullOrEmpty(token) ? undefined : token;
    if (newToken === this.getToken()) return;
    const getFeature = { ...this.vendorOptions_.getFeature, token: newToken };
    if (newToken === undefined) delete getFeature.token;
    this.vendorOptions_.getFeature = getFeature;
    this.clearCache();
    if (this.map) this.refresh(true);
  }

  /**
   * Devuelve el token de contexto que se enviará en la siguiente petición.
   * Si es una función, la invoca.
   * @returns {Promise<String|undefined>} Token de contexto.
   * @public
   * @api
   */
  getContextToken() {
    return this.contextTokenSource_.resolve();
  }

  /**
   * Cambia el token de contexto, descarta la caché y recarga la capa si está en un mapa.
   * @param {String|Function} contextToken Token o función que lo devuelve. Si es vacío,
   * se elimina.
   * @public
   * @api
   */
  setContextToken(contextToken) {
    validateContextToken(contextToken);
    const value = contextToken === '' ? undefined : contextToken;
    if (value === this.vendorOptions_.contextToken) return;
    if (value === undefined) delete this.vendorOptions_.contextToken;
    else this.vendorOptions_.contextToken = value;
    this.contextTokenSource_ = createContextTokenSource(value);
    this.clearCache();
    if (this.map) this.refresh(true);
  }

  /**
   * Añade el token de contexto a una URL del servicio de la capa.
   * @param {String} url URL de la petición.
   * @returns {Promise<String>} URL decorada.
   * @private
   */
  decorateUrl_(url) {
    const origin = new URL(this.url, window.location.href).origin;
    return createUrlDecorator(this.contextTokenSource_, origin)(url);
  }

  /**
   * Loads GeoJSON from the OGC API Features items endpoint into Cesium entities.
   * @param {Boolean} forceNewSource Replaces the current features when true.
   * @private
   */
  updateSource_(forceNewSource, force = false, isCurrent = () => true) {
    if (!isNullOrEmpty(this.vendorOptions_.source)) return Promise.resolve();
    this.requestRevision_ += 1;
    const revision = this.requestRevision_;

    const { bbox, key: zone } = this.bboxStrategy_ ? this.viewport_.request() : { bbox: this.bbox };
    const isZoneCurrent = () => !this.bboxStrategy_ || this.viewport_.isCurrent(zone);
    if (this.bboxStrategy_ && !bbox) return Promise.resolve();

    this.service_ = new ServiceDataIDEE({
      url: this.url,
      namespace: this.namespace,
      name: this.name,
      limit: this.limit,
      offset: this.offset,
      format: this.format,
      id: this.id,
      bbox,
      conditional: this.conditional,
      projection: this.map.getProjection(),
      getFeatureOutputFormat: this.options.getFeatureOutputFormat,
      describeFeatureTypeOutputFormat: this.options.describeFeatureTypeOutputFormat,
    }, this.vendorOptions_);
    this.formater_ = new FormatGeoJSON({
      defaultDataProjection: this.map.getProjection(),
      clampToGround: this.clampToGround,
      elevation: this.elevation,
    });
    const requestedLayer = this.cesiumLayer;
    this.loader_ = new JsonLoader(
      this.map,
      this.service_.getItemsUrl(),
      this.formater_,
      this.requestManager_,
      () => !this.bboxStrategy_ || (this.map && this.cesiumLayer === requestedLayer
        && isZoneCurrent()),
      this.getToken() !== undefined,
      this.service_.getRequestHeaders(),
      (url) => this.decorateUrl_(url),
    );
    const loader = this.loader_;
    loader.on(EventType.LOAD_UNAUTHORIZED, (error) => {
      if (this.loader_ === loader) this.fire(EventType.LOAD_UNAUTHORIZED, [error]);
    });

    return this.requestFeatures_(force).then(async (features) => {
      if (!this.map || this.cesiumLayer !== requestedLayer
        || revision !== this.requestRevision_ || !isCurrent()) return;
      if (!isZoneCurrent()) {
        this.viewport_.invalidate();
        return;
      }
      if (this.bboxStrategy_) {
        this.facadeVector_.removeFeatures(this.facadeVector_.getFeatures(true));
        this.loaded_ = true;
        // All native entities are ready: avoid leaving insertions queued on terrain events.
        await this.addFeatures_(features, true, true);
        this.facadeVector_.resumeAutoRefresh();
        this.map?.getMapImpl().scene.requestRender();
      } else if (forceNewSource === true || isNullOrEmpty(this.cesiumLayer)) {
        if (forceNewSource === true) {
          this.facadeVector_.removeFeatures(this.facadeVector_.getFeatures(true));
        }
        this.loaded_ = true;
        this.facadeVector_.addFeatures(features);
      } else {
        this.facadeVector_.clear();
        this.loaded_ = true;
        this.facadeVector_.addFeatures(features);
      }
    }).catch((error) => {
      const current = this.map && this.cesiumLayer === requestedLayer
        && revision === this.requestRevision_ && isCurrent() && isZoneCurrent();
      if (current && error instanceof RequestCancelledError && error.reason === 'invalidated') {
        return this.updateSource_(forceNewSource, force, isCurrent);
      }
      if (revision === this.requestRevision_) this.viewport_?.invalidate();
      if (current && !(error instanceof RequestCancelledError)) {
        this.facadeVector_.fire(EventType.LOAD_ERROR, [error]);
      }
      return undefined;
    });
  }

  requestFeatures_(force = false) {
    if (!this.loader_) return Promise.resolve([]);
    return this.loader_.loadFeatures(this.map.getProjection(), force);
  }

  getFeaturesExtentPromise(skipFilter, filter) {
    const codeProjection = this.map.getProjection().code;
    if (this.isLoaded()) {
      const features = this.getFeatures(skipFilter, filter);
      return Promise.resolve(ImplUtils.getFeaturesExtent(features, codeProjection));
    }
    return this.requestFeatures_().then((features) => (
      ImplUtils.getFeaturesExtent(features, codeProjection)
    ));
  }

  refresh(forceNewSource) {
    return this.updateSource_(forceNewSource);
  }

  refreshFresh() {
    return this.updateSource_(true, true);
  }

  async refreshSource(isCurrent = () => true) {
    if (this.bboxStrategy_) {
      if (!this.map || !this.loaded_ || this.facadeVector_.isAutoRefreshPaused()) return;
      await this.updateSource_(false, true, () => (
        isCurrent() && !this.facadeVector_.isAutoRefreshPaused()
      ));
      return;
    }
    const revision = this.requestRevision_;
    try {
      return await super.refreshSource(() => isCurrent() && revision === this.requestRevision_);
    } catch (error) {
      const tokenRejected = isUnauthorizedError(error) && this.getToken() !== undefined;
      if (!(error instanceof RequestCancelledError) && !tokenRejected) {
        this.facadeVector_?.fire(EventType.LOAD_ERROR, [error]);
      }
      throw error;
    }
  }

  clearCache() {
    this.requestManager_.clearCache();
    this.viewport_?.invalidate();
  }

  /**
   * Adaptador Cesium del MRE: rectángulo visible del globo en CRS84 sin normalizar.
   * @returns {Array<Number>|null} Extensión, o null si la vista no es calculable.
   * @private
   */
  getVisibleExtent_() {
    const native = this.map?.getMapImpl();
    if (!native?.canvas.clientWidth || !native.canvas.clientHeight) return null;
    const rectangle = native.camera.computeViewRectangle(native.scene.globe.ellipsoid);
    if (!rectangle) return null;
    return [
      rectangle.west, rectangle.south, rectangle.east, rectangle.north,
    ].map((angle) => CesiumMath.toDegrees(angle));
  }

  /**
   * Adaptador Cesium de eventos de vista: fin de movimiento de cámara y cambio de tamaño.
   * El tamaño se comprueba tras renderizar, cuando Cesium ya ha ajustado el frustum.
   * @param {Function} onChange Función a ejecutar.
   * @returns {Function} Retira los escuchadores.
   * @private
   */
  listenViewport_(onChange) {
    const native = this.map.getMapImpl();
    const removeMove = native.camera.moveEnd.addEventListener(onChange);
    let size = `${native.canvas.clientWidth},${native.canvas.clientHeight}`;
    const removeResize = native.scene.postRender.addEventListener(() => {
      const nextSize = `${native.canvas.clientWidth},${native.canvas.clientHeight}`;
      if (nextSize !== size) {
        size = nextSize;
        onChange();
      }
    });
    return () => { removeMove(); removeResize(); };
  }

  // Native sources retain covered extents, but this layer replaces its active zone.
  // Let the request manager decide exact reuse instead of skipping contained viewports.
  // A hidden layer defers the request until it is shown again.
  loadViewport_() {
    if (!this.map || !this.isVisible()) return;
    if (this.viewport_.hasChanged()) this.updateSource_(false);
  }

  setVisible(visibility) {
    super.setVisible(visibility);
    if (visibility && this.bboxStrategy_) this.loadViewport_();
  }

  addTo(map, addLayer = true) {
    if (this.requestManager_.disposed) {
      this.requestManager_ = new RequestManager(this.requestManagerOptions_);
    }
    super.addTo(map, addLayer);
    this.viewport_?.attach(() => this.loadViewport_());
  }

  destroy() {
    this.viewport_?.detach();
    this.requestRevision_ += 1;
    this.requestManager_.dispose();
    super.destroy();
  }
}

export default DataIDEE;
