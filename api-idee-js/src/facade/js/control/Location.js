/**
 * @module IDEE/control/Location
 */
import LocationImpl from 'impl/control/Location';
import locationTemplate from 'templates/location';
import myhelp from 'templates/locationhelp';
import 'assets/css/controls/location';
import * as EventType from 'IDEE/event/eventtype';
import { getValue } from '../i18n/language';
import ControlBase from './Control';
import {
  isUndefined, isNullOrEmpty, isObject, isBoolean,
} from '../util/Utils';
import Exception from '../exception/exception';
import { compileSync as compileTemplate } from '../util/Template';
import * as Position from '../ui/position';

/**
 * @typedef {Object} module:IDEE/control/Location~Options
 * @api
 * @property {String} [position] Posición del control en el mapa.
 * @property {Boolean} [tracking] Indica si el seguimiento de la localización está activado.
 * Por defecto verdadero.
 * @property {Boolean} [highAccuracy] Indica si el seguimiento es de alta precisión.
 * Por defecto falso.
 * @property {Object} [vendorOptions] Opciones específicas para la implementación subyacente.
 */

/**
 * @classdesc
 * Hereda de {@link module:IDEE/control/Control|Control}.
 * Localiza la posición del usuario en el mapa y permite dibujarla.
 *
 * @property {String} [position='left'] Posición del control en el mapa.
 * @property {Boolean} [tracking=true] Seguimiento de la localización activado (true)
 * o desactivado (false).
 * @property {Boolean} [highAccuracy=false] Seguimiento de alta precisión activado (true)
 * o desactivado (false).
 * @property {Object} [vendorOptions={}] Opciones para la implementación subyacente.
 *
 * @api
 * @extends {module:IDEE/control/Control}
 */
class Location extends ControlBase {
  /**
   * Constructor principal de la clase. Crea una ubicación
   * que permite al usuario localizar y dibujar su
   * posición en el mapa.
   *
   * @constructor
   * @param {module:IDEE/control/Location~Options} options Opciones del control.
   * @example
   * new Location({
   *  position: "left",
   *  tracking: true,
   *  highAccuracy: false,
   *  vendorOptions: {}
   * })
   * @api
   */
  constructor(options = {}) {
    const tracking = isBoolean(options.tracking) ? options.tracking : true;
    const highAccuracy = isBoolean(options.highAccuracy) ? options.highAccuracy : false;
    const vendorOptions = isObject(options.vendorOptions) ? options.vendorOptions : {};

    if (isUndefined(LocationImpl) || (isObject(LocationImpl)
      && isNullOrEmpty(Object.keys(LocationImpl)))) {
      Exception(getValue('exception').location_method);
    }

    // implementation of this control
    const impl = new LocationImpl({
      tracking,
      highAccuracy,
      vendorOptions,
    });

    // calls the super constructor
    super(Location.NAME, impl, options);

    this.position = options.position ?? Position.LEFT;

    /**
     * @param {Boolean} tracking Seguimiento de la localización, por defecto verdadero.
     * */
    this.tracking = tracking;

    /**
     * @param {Boolean} highAccuracy Seguimiento de alta precisión por defecto falso.
     */
    this.highAccuracy = highAccuracy;

    /**
     * @param {Object} vendorOptions Opciones para la implementación
     */
    this.vendorOptions = vendorOptions;
  }

  /**
   * Esta función crea la vista del mapa especificado.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa
   * @returns {Promise} Plantilla HTML.
   * @api
   */
  createView(map) {
    const lang = this.translation || {};
    const element = compileTemplate(locationTemplate, {
      vars: {
        title: this.tooltip ?? lang.title,
      },
    });

    this.element = element;

    return element;
  }

  /**
   * Este método devuelve si el botón de activación
   * del control esta activado.
   *
   * @public
   * @function
   * @param {HTMLElement} element HTML del botón.
   * @returns {HTMLElement} HTML del botón.
   * @api
   * @export
   */
  getActivationButton(element) {
    if (!element) {
      return null;
    }

    return element.querySelector('button#m-location-button');
  }

  /**
   * Genera un objeto clave-valor traducido con los datos actualizados.
   * Perfecto para el InfoBox nativo de Cesium.
   * @param {number} lon
   * @param {number} lat
   * @returns {Object} Diccionario mapeado con traducciones vigentes
   */
  getPopupProperties(lon, lat) {
    const lang = this.translation || {};
    const labels = lang.popup;

    return {
      [labels.title]: labels.titleValue || 'Mi ubicación',
      [labels.longitude]: typeof lon === 'number' ? lon.toFixed(6) : lon,
      [labels.latitude]: typeof lat === 'number' ? lat.toFixed(6) : lat,
    };
  }

  /**
   * Crea un contenedor DOM con una tabla estructurada y traducida.
   * Perfecto para inyectar en Overlays de OpenLayers.
   * @param {number} lon
   * @param {number} lat
   * @returns {HTMLElement} Elemento contenedor de la tabla
   */
  createPopupContent(lon, lat) {
    const lang = this.translation || {};
    const labels = lang.popup;

    const container = document.createElement('div');
    container.className = 'm-location-popup-container';

    container.innerHTML = `
      <table class="m-location-popup-table">
        <thead>
          <tr>
            <th colspan="2" class="popup-title">${labels.titleValue || 'Mi ubicación'}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="popup-label"><strong>${labels.longitude}</strong></td>
            <td class="popup-value lon-value">${typeof lon === 'number' ? lon.toFixed(6) : lon}</td>
          </tr>
          <tr>
            <td class="popup-label"><strong>${labels.latitude}</strong></td>
            <td class="popup-value lat-value">${typeof lat === 'number' ? lat.toFixed(6) : lat}</td>
          </tr>
        </tbody>
      </table>
    `;
    return container;
  }

  /**
   * Obtiene la ayuda del control
   *
   * @function
   * @public
   * @api
  */
  getHelp() {
    const lang = this.translation || {};
    const textHelp = lang.textHelp;
    return {
      title: Location.NAME,
      content: new Promise((success) => {
        const html = compileTemplate(myhelp, {
          vars: {
            urlImages: `${IDEE.config.STATIC_RESOURCES_URL}/imagenes/controles`,
            translations: {
              help1: textHelp.text1 ?? '',
              help2: textHelp.text2 ?? '',
              help3: textHelp.text2 ?? '',
            },
          },
        });
        success(html);
      }),
    };
  }

  /**
   * Esta función comprueba si un objeto es igual
   * a este control.
   *
   * @public
   * @function
   * @param {*} obj Objeto a comparar.
   * @returns {boolean} Iguales devuelve verdadero, falso si no son iguales.
   * @api
   */
  equals(obj) {
    const equals = (obj instanceof Location);
    return equals;
  }

  /**
   * Sobrescribe el seguimiento de la localización.
   * @param {Object} tracking Seguimiento de la localización.
   * @public
   * @function
   * @api
   */
  setTracking(tracking) {
    this.getImpl().tracking = tracking;
  }

  /**
   * Destroys facade implementacion of this control
   */
  destroy() {
    super.destroy();
    this.un(EventType.CHANGE);
  }
}

/**
 * Nombre para identificar este control.
 * @const
 * @type {string}
 * @public
 * @api
 */
Location.NAME = 'location';

export default Location;
