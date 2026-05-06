/**
 * @module IDEE/control/Scale
 */
import 'assets/css/controls/scale';
import scaleTemplate from 'templates/scale';
import ScaleImpl from 'impl/control/Scale';
import myhelp from 'templates/scalehelp';
import ControlBase from './Control';
import { isUndefined, isNullOrEmpty, isObject } from '../util/Utils';
import Exception from '../exception/exception';
import { compileSync as compileTemplate } from '../util/Template';
import { getValue } from '../i18n/language';
import * as Position from '../ui/position';

/**
 * @typedef {Object} module:IDEE/control/Scale~Options
 * @api
 * @property {String} [position] Posición del control en el mapa.
 * @property {String} [tooltip] Texto del tooltip.
 * @property {Boolean} [exactScale] Indica si se debe mostrar la escala exacta.
 * @property {Number} [order] Accesibilidad, z-index.
 * @property {Object} [vendorOptions] Opciones específicas del proveedor,
 * usadas en la implementación.
 */

/**
 * @classdesc
 * Agregar escala numérica.
 * @property {String} [position='down'] Posición del control.
 * @property {String} [tooltip_] Texto del tooltip. por defecto la tradcución
 * @property {Boolean} [exactScale=false] Indica si se debe mostrar la escala exacta.
 * @property {Number} [order=0] Accesibilidad, z-index.
 * @api
 * @extends {IDEE.Control}
 *
 * @note Para más opciones heredadas, ver {@link module:IDEE/control/Control~Options}.
 */
class Scale extends ControlBase {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {module:IDEE/control/Scale~Options} options Opciones del control.
   * @example
   * const control = new IDEE.control.Scale({
   *   position: 'down',
   *   tooltip: 'Escala del mapa',
   *   order: 1,
   *   exactScale: true,
   * });
   * @api
   */
  constructor(options = {}) {
    if (isUndefined(ScaleImpl) || (isObject(ScaleImpl) && isNullOrEmpty(Object.keys(ScaleImpl)))) {
      Exception(getValue('exception').scale_method);
    }
    const vendorOptions = {
      ...isObject(options.vendorOptions) ? options.vendorOptions : {},
      exactScale: options.exactScale,
    };

    const impl = new ScaleImpl(vendorOptions);

    super(Scale.NAME, impl, options);

    this.position = options.position ?? Position.DOWN;
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
    return compileTemplate(scaleTemplate, {
      vars: {
        title: this.tooltip ?? `Control ${getValue('scale').title}`,
        scale: getValue('scale').scale,
        level: getValue('scale').level,
        order: this.order,
      },
    });
  }

  /**
   * Obtiene la ayuda del control
   *
   * @function
   * @public
   * @api
  */
  getHelp() {
    const textHelp = getValue('scale').textHelp;
    return {
      title: Scale.NAME,
      content: new Promise((success) => {
        const html = compileTemplate(myhelp, {
          vars: {
            urlImages: `${IDEE.config.STATIC_RESOURCES_URL}/imagenes/controles`,
            translations: {
              help1: textHelp.text1,
              help2: textHelp.text2,
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
    const equals = (obj instanceof Scale);
    return equals;
  }
}

/**
 * Nombre del control.
 * @const
 * @type {string}
 * @public
 * @api
 */
Scale.NAME = 'scale';

export default Scale;
