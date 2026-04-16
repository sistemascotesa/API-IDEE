/**
 * @module IDEE/impl/control/Location
 */

import { isNullOrEmpty, extend, setEquals } from 'IDEE/util/Utils';
import * as EventType from 'IDEE/event/eventtype';
// import * as Dialog from 'IDEE/dialog';
// import { getValue } from 'IDEE/i18n/language';
import { get as getProj } from 'ol/proj';
import OLFeature from 'ol/Feature';
import OLGeolocation from 'ol/Geolocation';
import OLGeomPoint from 'ol/geom/Point';
import OLStyle from 'ol/style/Style';
import OLStyleCircle from 'ol/style/Circle';
import OLStyleFill from 'ol/style/Fill';
import OLStyleStroke from 'ol/style/Stroke';
import Control from './Control';
import Feature from '../feature/Feature';

/**
 *  @classdesc
 *  Hereda de {@link module:IDEE/impl/control/Control|Control}.
 *  Control de localización geográfica. Localiza la posición actual del usuario en el mapa
 *  usando la API de Geolocalización del navegador. Dibuja el punto de ubicación y el área
 *  de precisión del posicionamiento.
 *
 *  @property {Boolean} [tracking=true] Seguimiento continuo de la localización.
 *  @property {Boolean} [highAccuracy=false] Alta precisión del seguimiento.
 *  @property {Number} [maximumAge=60000] Antigüedad máxima en milisegundos de una
 * posición en caché.
 *  @property {ol.Geolocation} [locationAPI_] API de geolocalización de OpenLayers.
 *  @property {ol.Feature} [locationFeature_] Feature que representa la ubicación del usuario.
 *
 *  @api stable
 *  @extends {module:IDEE/impl/control/Control}
 */
class Location extends Control {
  /**
   * Constructor principal de la clase. Crea una ubicación
   * que permite al usuario localizar y dibujar su
   * posición en el mapa.
   *
   * @constructor
   * @param {Boolean} tracking Seguimiento de la localización, por defecto verdadero.
   * @param {Boolean} highAccuracy Alta precisión del seguimiento, por defecto falso.
   * @param {Number} maximumAge Indica la antigüedad máxima en milisegundos de una posible
   * posición almacenada en caché.
   * Valor por defecto 60000.
   * @param {Object} vendorOptions Opciones de proveedor para la biblioteca base,
   * por defecto objeto vacío. Estos valores no son configurables.
   * @example
   * const control = new IDEE.impl.ol.control.Location(true, false, 60000, {
   *   enableHighAccuracy: true,
   * });
   * @extends {IDEE.impl.Control}
   * @api stable
   */

  constructor(tracking, highAccuracy, maximumAge, vendorOptions) {
    super(vendorOptions);

    /**
     * Opciones para la biblioteca base.
     * @private
     * @type {Object}
     */
    this.vendorOptions_ = vendorOptions;

    /**
     * Proporcionar Geolocalización HTML5.
     * @private
     * @type {OLGeolocation}
     */
    this.geolocation_ = null;

    /**
     * Objeto geográfico de la posición actual.
     * @private
     * @type {OLFeature}
     */
    const olAccuracyFeature = new OLFeature();
    olAccuracyFeature.set('isUtilityFeature', true); // No interactivo
    this.accuracyFeature_ = Feature.feature2Facade(olAccuracyFeature);

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
     * Objeto geográfico de la posición.
     * @private
     * @type {OLFeature}
     */
    const olPositionFeature = new OLFeature();
    olPositionFeature.setStyle(Location.POSITION_STYLE);
    olPositionFeature.set('isUtilityFeature', true); // No interactivo
    this.positionFeature_ = Feature.feature2Facade(olPositionFeature);
  }

  /**
   * Asocia la fachada del control para poder emitir eventos.
   *
   * @public
   * @function
   * @param {IDEE.control.Location} obj Fachada del control.
   * @api stable
   */
  setFacadeObj(obj) {
    this.facadeObj_ = obj;
  }

  /**
   * Este método pinta un punto en el mapa con tu ubicación.
   *
   * @public
   * @function
   * @api stable
   */
  activate() {
    this.element.classList.add('m-locating');

    if (isNullOrEmpty(this.geolocation_)) {
      const proj = getProj(this.facadeMap_.getProjection().code);
      this.geolocation_ = new OLGeolocation(extend({
        projection: proj,
        tracking: this.tracking_,
        trackingOptions: {
          enableHighAccuracy: this.highAccuracy_,
          maximumAge: this.maximumAge_,
        },
      }, this.vendorOptions_, true));
      this.geolocation_.on('change:accuracyGeometry', (evt) => {
        const accuracyGeom = evt.target.get(evt.key);
        this.accuracyFeature_.getImpl().getFeature().setGeometry(accuracyGeom);
      });
      this.geolocation_.on('change:position', (evt) => {
        const newCoord = evt.target.get(evt.key);
        const newPosition = isNullOrEmpty(newCoord)
          ? null
          : new OLGeomPoint(newCoord);
        this.positionFeature_.getImpl().getFeature().setGeometry(newPosition);
        this.facadeMap_.setCenter(newCoord);
        if (this.element.classList.contains('m-locating')) {
          this.facadeMap_.setZoom(Location.ZOOM); // solo 1a vez
        }
        this.element.classList.remove('m-locating');
        this.element.classList.add('m-located');

        this.geolocation_.setTracking(this.tracking_);

        if (!isNullOrEmpty(this.facadeObj_)) {
          if (!setEquals(newCoord, this.lastCoord_)) {
            this.facadeObj_.fire(EventType.CHANGE, [newCoord]);
            this.lastCoord_ = newCoord;
          }
        }
      });
      // this.geolocation_.on('error', (evt) => {
      //   this.element.classList.remove('m-locating');
      //   Dialog.error(getValue('location').error);
      // });
    }

    this.geolocation_.setTracking(true);
    // this.facadeMap_.drawFeatures([this.accuracyFeature_]);
    this.facadeMap_.drawFeatures([this.accuracyFeature_, this.positionFeature_]);
  }

  /**
   * Este método elimina la ubicación dibujada.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @api stable
   */
  removePositions_() {
    if (!isNullOrEmpty(this.accuracyFeature_)) {
      this.facadeMap_.removeFeatures([this.accuracyFeature_]);
    }
    if (!isNullOrEmpty(this.positionFeature_)) {
      this.facadeMap_.removeFeatures([this.positionFeature_]);
    }
    if (this.geolocation_) {
      this.geolocation_.setTracking(false);
    }
  }

  /**
   * Este método elimina la ubicación dibujada y restaura el botón de estilo.
   *
   * @public
   * @function
   * @api stable
   */
  deactivate() {
    this.removePositions_();
    this.element.classList.remove('m-located');
    this.element.classList.remove('m-locating');
    this.geolocation_ = null;
  }

  /**
   * Este método sobrescribe la ubicación.
   * @public
   * @function
   * @param {Object} tracking Rastreo de localización.
   * @api stable
   */
  setTracking(tracking) {
    this.tracking_ = tracking;
    this.geolocation_.setTracking(tracking);
  }

  /**
   * Esta función destruye este control y limpia el HTML.
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.removePositions_();
    super.destroy();
  }
}

/**
 * Estilo de la localización.
 * @const
 * @type {ol.style.Style}
 * @public
 * @api stable
 * @memberof module:IDEE/impl/control/Location~
 */
Location.POSITION_STYLE = new OLStyle({
  image: new OLStyleCircle({
    radius: 6,
    fill: new OLStyleFill({
      color: '#3399CC',
    }),
    stroke: new OLStyleStroke({
      color: '#fff',
      width: 2,
    }),
  }),
});

/**
 * Zoom de la localización.
 * @const
 * @type {number}
 * @public
 * @api stable
 */
Object.defineProperty(Location, 'ZOOM', {
  get() {
    return IDEE.config.ZOOM_LOCATION;
  },
});

export default Location;
