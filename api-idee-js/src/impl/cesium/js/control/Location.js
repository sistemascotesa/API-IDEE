/**
 * @module IDEE/impl/control/Location
 */

import { isNullOrEmpty, extend, setEquals } from 'IDEE/util/Utils';
import * as EventType from 'IDEE/event/eventtype';
import * as Cesium from 'cesium';
import Control from './Control';
import Feature from '../feature/Feature';

/**
 * @classdesc
 * Hereda de {@link module:IDEE/impl/control/Control|Control}.
 * Control de localización geográfica para Cesium 3D. Localiza la posición actual del usuario
 * usando la API de Geolocalización del navegador y la dibuja mediante Entidades de Cesium.
 *
 * @property {Boolean} tracking Seguimiento de la localización.
 * @property {Boolean} highAccuracy Alta precisión del seguimiento.
 * @property {Number} maximumAge Antigüedad máxima en caché.
 * @property {Object} vendorOptions Opciones de proveedor para Cesium/Geolocation.
 *
 * @api stable
 * @extends {module:IDEE/impl/control/Control}
 */
class Location extends Control {
  /**
   * @constructor
   * @param {Boolean} tracking Seguimiento de la localización.
   * @param {Boolean} highAccuracy Alta precisión del seguimiento.
   * @param {Number} maximumAge Antigüedad máxima en caché.
   * @param {Object} vendorOptions Opciones de proveedor para Cesium/Geolocation.
   * @example
   * const control = new IDEE.impl.ol.control.Location(true, false, 60000, {
   *   enableHighAccuracy: true,
   * });
   */
  constructor(tracking, highAccuracy, maximumAge, vendorOptions) {
    super(vendorOptions);

    /**
     * Opciones para la biblioteca base.
     * @private
     * @type {Object}
     */
    this.vendorOptions_ = vendorOptions;
    this.watchId_ = null;

    /**
     * Seguimiento de localización, por defecto verdadero.
     * @private
     * @type {Boolean}
     */
    this.tracking_ = tracking;

    /**
     * Alta precisión del seguimiento, por defecto falso.
     * @private
     * @type {Boolean}
     */
    this.highAccuracy_ = highAccuracy;

    /**
     * Valor por defecto 60000.
     * @private
     * @type {Number}
     */
    this.maximumAge_ = maximumAge;

    /**
     * Activa el control.
     * @private
     * @type {Boolean}
     */
    this.activated_ = false;

    /**
     * Referencia a la fachada del control (IDEE.control.Location).
     * @private
     * @type {Object|null}
     */
    this.facadeObj_ = null;

    /**
     * Última coordenada emitida.
     * @private
     * @type {Object|null}
     */
    this.lastCoord_ = [];

    /**
     * Entidad Cesium que representa el anillo de precisión.
     * @private
     */
    const cesiumAccuracyEntity = new Cesium.Entity({
      ellipse: {
        semiMajorAxis: 0,
        semiMinorAxis: 0,
        material: Cesium.Color.fromCssColorString('#3399CC').withAlpha(0.2),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString('#3399CC'),
        outlineWidth: 1,
      },
    });
    // Inyección de compatibilidad (Duck Typing) para la fachada Feature.js
    cesiumAccuracyEntity.get = (key) => {
      return this[key];
    };
    cesiumAccuracyEntity.isUtilityFeature = true;
    this.accuracyFeature_ = Feature.feature2Facade(cesiumAccuracyEntity);

    /**
     * Entidad Cesium que representa el punto de la posición actual.
     * @private
     */
    const cesiumPositionEntity = new Cesium.Entity({
      point: {
        pixelSize: Location.POSITION_STYLE.pixelSize,
        color: Cesium.Color.fromCssColorString(Location.POSITION_STYLE.color),
        outlineColor: Cesium.Color.fromCssColorString(Location.POSITION_STYLE.outlineColor),
        outlineWidth: Location.POSITION_STYLE.outlineWidth,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
    // Inyección de compatibilidad (Duck Typing) para la fachada Feature.js
    cesiumPositionEntity.get = (key) => {
      return this[key];
    };
    cesiumPositionEntity.isUtilityFeature = true;

    this.positionFeature_ = Feature.feature2Facade(cesiumPositionEntity);
  }

  /**
   * Asocia la fachada del control para poder emitir eventos.
   * @param {IDEE.control.Location} obj Fachada del control.
   */
  setFacadeObj(obj) {
    this.facadeObj_ = obj;
  }

  /**
   * Activa el control de geolocalización y empieza a escuchar la posición del navegador.
   */
  activate() {
    this.element.classList.add('m-locating');

    const successCallback = (position) => {
      const lon = position.coords.longitude;
      const lat = position.coords.latitude;
      const accuracy = position.coords.accuracy;
      const newCoord = [lon, lat];

      // Cesium trabaja con coordenadas Cartesianas 3D basándose en WGS84 (grados)
      const centerCartesian = Cesium.Cartesian3.fromDegrees(lon, lat);

      // 1. Actualizar posición y radio de la geometría de precisión
      const accEntity = this.accuracyFeature_.getImpl().getFeature();
      accEntity.position = centerCartesian;
      if (accEntity.ellipse) {
        accEntity.ellipse.semiMajorAxis = accuracy;
        accEntity.ellipse.semiMinorAxis = accuracy;
      }

      // 2. Actualizar posición del punto indicador
      const posEntity = this.positionFeature_.getImpl().getFeature();
      posEntity.position = centerCartesian;

      // 3. Reposicionar el mapa global (Fachada)
      this.facadeMap_.setCenter(newCoord);
      if (this.element.classList.contains('m-locating')) {
        this.facadeMap_.setZoom(Location.ZOOM);
      }

      this.element.classList.remove('m-locating');
      this.element.classList.add('m-located');

      // Si no requiere trackear continuamente, apagamos el watcher tras la primera lectura fija
      if (!this.tracking_) {
        this.clearWatch_();
      }

      // 4. Notificar cambios a la fachada mediante eventos abstractos
      if (!isNullOrEmpty(this.facadeObj_)) {
        if (!setEquals(newCoord, this.lastCoord_)) {
          this.facadeObj_.fire(EventType.CHANGE, [newCoord]);
          this.lastCoord_ = newCoord;
        }
      }
    };

    const errorCallback = (error) => {
      this.element.classList.remove('m-locating');
      // eslint-disable-next-line no-console
      console.error('Cesium Geolocation Error Code: ', error.code, error.message);
    };

    const options = extend({
      enableHighAccuracy: this.highAccuracy_,
      maximumAge: this.maximumAge_,
    }, this.vendorOptions_, true);

    // Asegurar limpieza antes de registrar un nuevo watcher
    this.clearWatch_();
    // Iniciamos el rastreo nativo
    this.watchId_ = window.navigator
      .geolocation.watchPosition(successCallback, errorCallback, options);

    // Pintamos los elementos en el mapa de la fachada
    this.facadeMap_.drawFeatures([this.accuracyFeature_, this.positionFeature_]);
  }

  /**
   * Limpia el watcher nativo de geolocalización HTML5.
   * @private
   */
  clearWatch_() {
    if (this.watchId_ !== null && this.watchId_ !== undefined) {
      window.navigator.geolocation.clearWatch(this.watchId_);
      this.watchId_ = null;
    }
  }

  /**
   * Elimina las entidades visuales del mapa de Cesium y detiene el tracking.
   * @private
   */
  removePositions_() {
    if (!isNullOrEmpty(this.accuracyFeature_)) {
      this.facadeMap_.removeFeatures([this.accuracyFeature_]);
    }
    if (!isNullOrEmpty(this.positionFeature_)) {
      this.facadeMap_.removeFeatures([this.positionFeature_]);
    }
    this.clearWatch_();
  }

  /**
   * Desactiva por completo el control y limpia estilos e hilos de geolocalización.
   */
  deactivate() {
    this.removePositions_();
    this.element.classList.remove('m-located');
    this.element.classList.remove('m-locating');
  }

  /**
   * Cambia dinámicamente la estrategia de rastreo.
   * @param {Boolean} tracking
   */
  setTracking(tracking) {
    this.tracking_ = tracking;
    if (!tracking) {
      this.clearWatch_();
    } else {
      this.activate();
    }
  }

  /**
   * Destruye el control liberando memoria.
   */
  destroy() {
    this.removePositions_();
    super.destroy();
  }
}

/**
 * Estilo adaptado para el renderizado nativo del PointGraphics de Cesium.
 * @const
 * @type {Object}
 */
Location.POSITION_STYLE = {
  pixelSize: 12, // Diámetro equivalente al radio 6 de OpenLayers
  color: '#3399CC',
  outlineColor: '#ffffff',
  outlineWidth: 2,
};

/**
 * Zoom por defecto extraído de la configuración de la fachada.
 */
Object.defineProperty(Location, 'ZOOM', {
  get() {
    return IDEE.config.ZOOM_LOCATION;
  },
});

export default Location;
