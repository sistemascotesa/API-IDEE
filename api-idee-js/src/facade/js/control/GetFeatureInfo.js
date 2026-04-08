/**
 * @module IDEE/control/GetFeatureInfo
 */
import 'assets/css/controls/getfeatureinfo';
import GetFeatureInfoImpl from 'impl/control/GetFeatureInfo';
import myhelp from 'templates/getfeatureinfohelp';
import getfeatureinfoTemplate from 'templates/getfeatureinfo';
import ControlBase from './Control';
import {
  isUndefined, isNullOrEmpty, isObject, isString,
} from '../util/Utils';
import Exception from '../exception/exception';
import { getValue } from '../i18n/language';
import { compileSync as compileTemplate } from '../util/Template';
import * as Position from '../ui/position';
import * as EventType from '../event/eventtype';

/**
 * @classdesc
 * Agrega la herramienta de consulta de información de capas
 * WMS y WMTS a través de su servicio getFeatureInfo.
 *
 * @api
 * @extends {IDEE.Control}
 */
class GetFeatureInfo extends ControlBase {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {object} options Opciones del control.
   * - activated. Booleano que activa o no el control.
   * - featureCount. Número de objetos geográficos, por defecto 10.
   * - buffer. Configuración del "buffer", por defecto 5.
   * @api
   */
  constructor(options = {}) {
    if (isUndefined(GetFeatureInfoImpl) || (isObject(GetFeatureInfoImpl)
      && isNullOrEmpty(Object.keys(GetFeatureInfoImpl)))) {
      Exception(getValue('exception').getfeatureinfo_method);
    }
    const impl = new GetFeatureInfoImpl(options);
    super(GetFeatureInfo.NAME, impl, options);

    /**
     * position: posición del control
     */
    this.position = options.position ?? Position.RIGHT;

    /**
     * tooltip: título del control
     * */
    this.tooltip = isString(options.tooltip) ? options.tooltip : null;
  }

  /**
   * Este método crea la vista del mapa especificado.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @returns {Promise} Plantilla HTML.
   * @api
   */
  createView(map) {
    this.element = compileTemplate(getfeatureinfoTemplate, {
      vars: {
        title: this.tooltip ?? getValue('getfeatureinfo').title,
        order: this.order,
      },
    });

    return this.element;
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
    this.once(EventType.ADDED_TO_MAP, () => {
      if (this.getImpl().activated) this.activate();
    });

    super.addTo(map);
  }

  /**
   * Este método devuelve el botón de activación
   *
   * @public
   * @function
   * @param {HTMLElement} element HTML del botón.
   * @returns {HTMLElement} HTML del botón.
   * @api
   * @export
   */
  getActivationButton(element = this.element) {
    if (!element) {
      return null;
    }

    return element.querySelector('#m-getfeatureinfo-button');
  }

  /**
   * Obtiene la ayuda del control
   *
   * @function
   * @public
   * @api
  */
  getHelp() {
    const textHelp = getValue('getfeatureinfo').textHelp;
    return {
      title: GetFeatureInfo.NAME,
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
    let equals = false;
    if (obj instanceof GetFeatureInfo) {
      equals = (this.name === obj.name);
    }
    return equals;
  }
}

/**
 * Nombre para identificar este control.
 * @const
 * @type {string}
 * @public
 * @api
 */
GetFeatureInfo.NAME = 'getfeatureinfo';

export default GetFeatureInfo;
