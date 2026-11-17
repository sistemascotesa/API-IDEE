/**
 * @module IDEE/impl/layer/DataIDEE
 */
import FormatGeoJSON from 'IDEE/format/GeoJSON';
import { isNullOrEmpty } from 'IDEE/util/Utils';
import * as EventType from 'IDEE/event/eventtype';
import OLSourceVector from 'ol/source/Vector';
import { get as getProj, transformExtent } from 'ol/proj';
import { getIntersection, isEmpty as isEmptyExtent } from 'ol/extent';
import ServiceDataIDEE from '../service/DataIDEE';
import LoaderDataIDEE from '../loader/DataIDEE';
import ImplUtils from '../util/Utils';
import OGCAPIFeatures from './OGCAPIFeatures';
import RequestManager, { RequestCancelledError } from '../../../common/RequestManager';
import DataIDEETransactions from '../../../common/DataIDEETransactions';
import { isUnauthorizedError } from '../../../common/DataIDEERequest';
import DataIDEEEditingSession from '../../../common/DataIDEEEditingSession';
import normalizeDataIDEEOptions, { validateContextToken } from '../../../common/DataIDEEOptions';
import {
  CONTEXT_TOKEN_PARAMETER, createContextTokenSource, createUrlDecorator,
} from '../../../common/DataIDEEContextToken';
import DataIDEEViewport from '../../../common/DataIDEEViewport';
import exceptionMessage from '../../../common/exceptionMessage';

/**
 * Puntos por lado al transformar la extensión visible a CRS84: en proyecciones no
 * cilíndricas los bordes son curvos y las esquinas no bastan para envolver la vista.
 */
const EXTENT_STOPS = 8;

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
    this.editing_ = false;
    this.preparingEditing_ = false;
    this.destroyed_ = false;
    this.readThrottleMs_ = normalized.requestManager.throttleMs;
    this.pendingReads_ = new Set();
    this.editingLimits_ = normalized.editingLimits;
    this.transactions_ = null;
    this.transactionCollectionUrl_ = null;
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
    this.transactionCollectionUrl_ = null;
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
   * Loads GeoJSON from the OGC API Features items endpoint into the vector source.
   * @param {Boolean} forceNewSource Replaces the existing source when true.
   * @private
   */
  updateSource_(forceNewSource, force = false, isCurrent = () => true) {
    if (this.editing_) return Promise.resolve();
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
      defaultDataProjection: getProj(this.map.getProjection().code),
    });
    const requestedLayer = this.olLayer;
    this.loader_ = new LoaderDataIDEE(
      this.map,
      this.service_.getItemsUrl(),
      this.formater_,
      this.requestManager_,
      () => {
        if (this.editing_) return false;
        return !this.bboxStrategy_ || (this.map && this.olLayer === requestedLayer
          && isZoneCurrent());
      },
      this.getToken() !== undefined,
      this.service_.getRequestHeaders(),
      (url) => this.decorateUrl_(url),
    );
    const loader = this.loader_;
    loader.on(EventType.LOAD_UNAUTHORIZED, (error) => {
      if (this.loader_ === loader) this.fire(EventType.LOAD_UNAUTHORIZED, [error]);
    });

    const ol3LayerSource = this.olLayer.getSource();
    return this.requestFeatures_(force).then((features) => {
      if (!this.map || this.olLayer !== requestedLayer
        || revision !== this.requestRevision_ || !isCurrent()) return;
      if (!isZoneCurrent()) {
        this.viewport_.invalidate();
        return;
      }
      if (this.bboxStrategy_) {
        if (!this.olLayer.getSource()) this.olLayer.setSource(new OLSourceVector());
        this.facadeVector_.removeFeatures(this.facadeVector_.getFeatures(true));
        this.loaded_ = true;
        this.facadeVector_.addFeatures(features);
        this.facadeVector_.resumeAutoRefresh();
        this.fire(EventType.LOAD, [features]);
        this.facadeVector_.redraw();
      } else if (forceNewSource === true || isNullOrEmpty(ol3LayerSource)) {
        if (forceNewSource === true) {
          this.facadeVector_.removeFeatures(this.facadeVector_.getFeatures(true));
        }
        const newSource = new OLSourceVector({
          loader: () => {
            this.loaded_ = true;
            this.facadeVector_.addFeatures(features);
            this.fire(EventType.LOAD, [features]);
            this.facadeVector_.redraw();
          },
        });
        this.olLayer.setSource(newSource);
      } else {
        this.facadeVector_.removeFeatures(this.facadeVector_.getFeatures(true));
        this.loaded_ = true;
        this.facadeVector_.addFeatures(features);
        this.fire(EventType.LOAD, [features]);
        this.facadeVector_.redraw();
      }
    }).catch((error) => {
      const current = this.map && this.olLayer === requestedLayer
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
    const request = this.loader_.loadFeatures(getProj(this.map.getProjection().code), force);
    this.pendingReads_.add(request);
    request.then(
      () => this.pendingReads_.delete(request),
      () => this.pendingReads_.delete(request),
    );
    return request;
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
    if (this.editing_) return Promise.resolve();
    return this.updateSource_(forceNewSource);
  }

  refreshFresh() {
    if (this.editing_) return Promise.resolve();
    return this.updateSource_(true, true);
  }

  async refreshSource(isCurrent = () => true) {
    if (this.editing_) return;
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

  getEditingCapabilities() {
    if (!isNullOrEmpty(this.vendorOptions_.source)) {
      return Promise.resolve({
        create: false, update: false, delete: false, externalSource: true,
      });
    }
    return this.getTransactions_().capabilities();
  }

  async beginEditing({ bbox }) {
    if (this.editing_ || this.preparingEditing_) {
      throw new Error(exceptionMessage('dataidee_editing_active'));
    }
    if (!Array.isArray(bbox) || bbox.length !== 4 || !bbox.every(Number.isFinite)) {
      throw new TypeError(exceptionMessage('dataidee_edit_bbox_required'));
    }
    if (bbox[0] < -180 || bbox[2] > 180 || bbox[1] < -90 || bbox[3] > 90
      || bbox[0] > bbox[2] || bbox[1] > bbox[3]) {
      throw new RangeError(exceptionMessage('dataidee_edit_bbox_invalid'));
    }
    this.preparingEditing_ = true;
    this.editing_ = true;
    this.requestRevision_ += 1;
    let capabilities;
    try {
      capabilities = await this.getEditingCapabilities();
      if (this.destroyed_ || !this.map) {
        throw new Error(exceptionMessage('dataidee_edit_layer_removed'));
      }
      if (!capabilities.create && !capabilities.update && !capabilities.delete) {
        throw new Error(exceptionMessage('dataidee_read_only'));
      }
    } catch (error) {
      this.editing_ = false;
      this.viewport_?.invalidate();
      this.preparingEditing_ = false;
      throw error;
    }
    this.preparingEditing_ = false;
    try {
      await Promise.allSettled([...this.pendingReads_]);
      // The layer limit caps the zone, which may then be incomplete. Without a limit,
      // or with one above the session budget, the whole zone is loaded and a zone
      // larger than the budget is rejected.
      const layerLimit = Number(this.limit);
      const loadLimit = Number.isInteger(layerLimit) && layerLimit > 0
        && layerLimit <= this.editingLimits_.maxFeatures ? layerLimit : null;
      const pageSize = loadLimit
        ? Math.min(this.editingLimits_.pageSize, loadLimit) : this.editingLimits_.pageSize;
      let complete = true;
      const readService = new ServiceDataIDEE({
        url: this.url,
        namespace: this.namespace,
        name: this.name,
        limit: pageSize,
        offset: 0,
        format: this.format,
        id: null,
        bbox,
        conditional: this.conditional,
        projection: this.map.getProjection(),
      }, this.vendorOptions_);
      const collectionUrl = readService.getItemsUrl();
      const seen = new Set();
      let nextUrl = new URL(collectionUrl, window.location?.href || 'http://localhost/');
      nextUrl.searchParams.set('bbox', bbox.join(','));
      nextUrl.searchParams.set('limit', String(pageSize));
      const documents = [];
      let bytes = 0;
      let coordinates = 0;
      let lastPageStarted = 0;
      // Each validated next link determines the following page, so requests stay sequential.
      // eslint-disable-next-line no-await-in-loop
      while (nextUrl) {
        if (seen.has(nextUrl.href)) throw new Error(exceptionMessage('dataidee_pagination_repeated'));
        seen.add(nextUrl.href);
        const expectedCollection = new URL(collectionUrl);
        const normalizedPath = (pathname) => pathname.split('/').map((part) => {
          try { return decodeURIComponent(part); } catch (error) { return part; }
        }).join('/').replace(/\/$/, '');
        const expectedPath = normalizedPath(expectedCollection.pathname);
        const nextPath = normalizedPath(nextUrl.pathname);
        const validPath = nextPath === expectedPath || nextPath.startsWith(`${expectedPath}/`);
        if (nextUrl.origin !== expectedCollection.origin || !validPath) {
          throw new Error(exceptionMessage('dataidee_pagination_escaped'));
        }
        const pageUrl = new URL(nextUrl.href);
        const ticket = window.IDEE?.config?.TICKET;
        if (ticket) pageUrl.searchParams.set('ticket', ticket);
        const waitMs = Math.max(0, this.readThrottleMs_ - (Date.now() - lastPageStarted));
        if (waitMs > 0) {
          // Honor the configured read interval while following pages sequentially.
          // eslint-disable-next-line no-await-in-loop
          await new Promise((resolve) => {
            window.setTimeout(resolve, waitMs);
          });
        }
        lastPageStarted = Date.now();
        // eslint-disable-next-line no-await-in-loop
        const response = await window.fetch(await this.decorateUrl_(pageUrl.href), {
          cache: 'no-store',
          headers: {
            Accept: 'application/geo+json, application/json',
            ...(this.getToken() ? { Authorization: `Bearer ${this.getToken()}` } : {}),
          },
        });
        if (!response.ok) throw new Error(exceptionMessage('dataidee_edit_preparation_failed', { status: response.status }));
        // eslint-disable-next-line no-await-in-loop
        const text = await response.text();
        bytes += new Blob([text]).size;
        if (bytes > this.editingLimits_.maxBytes) {
          throw new Error(exceptionMessage('dataidee_edit_size_limit'));
        }
        const page = JSON.parse(text);
        if (page.type !== 'FeatureCollection' || !Array.isArray(page.features)) {
          throw new Error(exceptionMessage('dataidee_incomplete_page'));
        }
        const next = page.links?.find((link) => link.rel === 'next')?.href;
        const pageFeatures = loadLimit
          ? page.features.slice(0, loadLimit - documents.length) : page.features;
        const reachedLimit = loadLimit !== null
          && documents.length + pageFeatures.length >= loadLimit;
        if (reachedLimit && (pageFeatures.length < page.features.length || next)) {
          complete = false;
        }
        documents.push(...pageFeatures);
        if (documents.length > this.editingLimits_.maxFeatures) {
          throw new Error(exceptionMessage('dataidee_edit_feature_limit'));
        }
        const count = (value) => {
          if (!Array.isArray(value)) return 0;
          if (typeof value[0] === 'number') return 1;
          return value.reduce((sum, part) => sum + count(part), 0);
        };
        const supportedGeometry = new Set([
          'Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon',
        ]);
        if (pageFeatures.some((feature) => !supportedGeometry.has(feature.geometry?.type))) {
          throw new Error(exceptionMessage('dataidee_edit_geometry_type'));
        }
        const oversizedFeature = pageFeatures.find((feature) => (
          count(feature.geometry?.coordinates) > this.editingLimits_.maxCoordinates
          || new Blob([JSON.stringify(feature)]).size > this.editingLimits_.maxBytes
        ));
        if (oversizedFeature) {
          throw new Error(exceptionMessage('dataidee_edit_feature_budget'));
        }
        coordinates += pageFeatures.reduce((sum, feature) => (
          sum + count(feature.geometry?.coordinates)
        ), 0);
        if (coordinates > this.editingLimits_.maxCoordinates) {
          throw new Error(exceptionMessage('dataidee_edit_coordinate_limit'));
        }
        if (next && !reachedLimit) {
          nextUrl = new URL(next, nextUrl);
          nextUrl.searchParams.delete(CONTEXT_TOKEN_PARAMETER);
          const initialUrl = new URL(collectionUrl);
          const pageTarget = nextUrl;
          initialUrl.searchParams.forEach((value, key) => {
            if (!['offset', 'page'].includes(key)) pageTarget.searchParams.set(key, value);
          });
        } else nextUrl = null;
      }
      const features = this.formater_.read(JSON.stringify({ type: 'FeatureCollection', features: documents }), {
        featureProjection: getProj(this.map.getProjection().code),
      });
      if (features.some((feature) => feature.getId() === undefined || feature.getId() === null)) {
        throw new Error(exceptionMessage('dataidee_missing_identifier'));
      }
      this.facadeVector_.removeFeatures(this.facadeVector_.getFeatures(true));
      this.facadeVector_.addFeatures(features);
      const source = this.olLayer.getSource();
      this.loaded_ = true;
      const session = new DataIDEEEditingSession(this.facadeVector_, {
        features: source.getFeatures(),
        capabilities,
        format: new FormatGeoJSON(),
        projection: this.map.getMapImpl().getView().getProjection(),
        limits: { ...this.editingLimits_ },
        layerImpl: this,
        schema: capabilities.schema,
      });
      this.editingSession_ = session;
      return {
        features: source.getFeatures(),
        capabilities,
        bbox: bbox.slice(),
        limits: { ...this.editingLimits_ },
        session,
        complete,
      };
    } catch (error) {
      this.editing_ = false;
      this.viewport_?.invalidate();
      throw error;
    }
  }

  endEditing(refresh = true) {
    this.editingSession_?.destroy();
    this.editingSession_ = null;
    this.editing_ = false;
    this.viewport_?.invalidate();
    this.requestRevision_ += 1;
    if (!refresh || !this.map) return Promise.resolve();
    // The edit zone replaced the layer features: reload the layer's own query.
    return this.bboxStrategy_ ? this.updateSource_(false, true) : this.updateSource_(true, true);
  }

  getEditingSession() { return this.editingSession_ || null; }

  getTransactions_() {
    const collectionUrl = `${this.url}/collections/${encodeURIComponent(this.name)}`;
    if (this.transactionCollectionUrl_ !== collectionUrl) {
      this.transactions_ = new DataIDEETransactions({
        url: this.url,
        collection: this.name,
        parameters: this.options.transactionParameters,
        headers: this.options.transactionHeaders,
        defaultProperties: this.options.dataideeDefaultProperties,
        getToken: () => this.getToken(),
        tokenLocation: this.vendorOptions_.tokenLocation,
        decorateUrl: (url) => this.decorateUrl_(url),
      });
      this.transactionCollectionUrl_ = collectionUrl;
    }
    return this.transactions_;
  }

  createFeature(feature, options = {}) { return this.getTransactions_().create(feature, options); }

  getEditingFeature(id) { return this.getTransactions_().getFeature(id); }

  updateFeature(id, feature, method, etag, options = {}) {
    return this.getTransactions_().update(id, feature, etag, method, options);
  }

  deleteFeature(id, etag) { return this.getTransactions_().delete(id, etag); }

  /**
   * Adaptador OpenLayers del MRE: extensión visible en CRS84 sin normalizar.
   * @returns {Array<Number>|null} Extensión, o null si la vista no es calculable.
   * @private
   */
  getVisibleExtent_() {
    const native = this.map?.getMapImpl();
    const size = native?.getSize();
    const view = native?.getView();
    if (!size || size[0] <= 0 || size[1] <= 0 || !view?.isDef()) return null;
    const projection = view.getProjection();
    let extent = view.calculateExtent(size);
    if (!projection.isGlobal() && projection.getUnits() !== 'degrees' && projection.getExtent()) {
      extent = getIntersection(extent, projection.getExtent());
      if (isEmptyExtent(extent)) return null;
    }
    return transformExtent(extent, projection, 'EPSG:4326', EXTENT_STOPS);
  }

  /**
   * Adaptador OpenLayers de eventos de vista: fin de desplazamiento o zoom y cambio de tamaño.
   * @param {Function} onChange Función a ejecutar.
   * @returns {Function} Retira los escuchadores.
   * @private
   */
  listenViewport_(onChange) {
    const native = this.map.getMapImpl();
    native.on('moveend', onChange);
    native.on('change:size', onChange);
    return () => {
      native.un('moveend', onChange);
      native.un('change:size', onChange);
    };
  }

  // Native sources retain covered extents, but this layer replaces its active zone.
  // Let the request manager decide exact reuse instead of skipping contained viewports.
  // A hidden layer defers the request until it is shown again.
  loadViewport_() {
    if (this.editing_ || !this.map || !this.isVisible()) return;
    if (this.viewport_.hasChanged()) this.updateSource_(false);
  }

  setVisible(visibility) {
    super.setVisible(visibility);
    if (visibility && this.bboxStrategy_) this.loadViewport_();
  }

  addTo(map, addLayer = true) {
    this.destroyed_ = false;
    if (this.requestManager_.disposed) {
      this.requestManager_ = new RequestManager(this.requestManagerOptions_);
    }
    super.addTo(map, addLayer);
    this.viewport_?.attach(() => this.loadViewport_());
  }

  destroy() {
    this.destroyed_ = true;
    this.editingSession_?.destroy();
    this.editingSession_ = null;
    this.editing_ = false;
    this.preparingEditing_ = false;
    this.viewport_?.detach();
    this.requestRevision_ += 1;
    this.requestManager_.dispose();
    super.destroy();
  }
}

export default DataIDEE;
