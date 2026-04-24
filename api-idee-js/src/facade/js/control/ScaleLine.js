/**
 * @module IDEE/control/ScaleLine
 */
import 'assets/css/controls/scale';
import ScaleLineImpl from 'impl/control/ScaleLine';
import scalelineTemplate from 'templates/scaleline';
import myhelp from 'templates/scalelinehelp';
import ControlBase from './Control';
import { isUndefined, isNullOrEmpty, isObject } from '../util/Utils';
import Exception from '../exception/exception';
import { compileSync as compileTemplate } from '../util/Template';
import { getValue } from '../i18n/language';
import * as Position from '../ui/position';

/**
 * @typedef {Object} module:IDEE/control/ScaleLine~Options
 * @api
 * @property {String} [position] Posición del control en el mapa.
 * @property {String} [tooltip] Texto del tooltip.
 * @property {Number} [order] Accesibilidad, z-index.
 * @property {Object} [vendorOptions] Opciones específicas para la implementación de OpenLayers.
 */

/**
 * @classdesc
 * Añadir escala gráfica.
 * @property {String} [position='down'] Posición del control.
 * @property {String} [tooltip] Texto del tooltip. por defecto la tradcución
 * @property {Number} [order=0] Accesibilidad, z-index.
 * @api
 * @extends {IDEE.Control}
 *
 * @note Para más opciones heredadas, ver {@link module:IDEE/control/Control~Options}.
 */
class ScaleLine extends ControlBase {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {module:IDEE/control/ScaleLine~Options} options Opciones del control.
   * @example
   * const control = new IDEE.control.ScaleLine({
   *   position: 'down',
   *   tooltip: 'Escala gráfica',
   *   order: 1,
   *   vendorOptions: {
   *     bar: true,
   *     steps: 4,
   *   },
   * });
   * @api
   */
  constructor(options = {}) {
    if (isUndefined(ScaleLineImpl) || (isObject(ScaleLineImpl)
      && isNullOrEmpty(Object.keys(ScaleLineImpl)))) {
      Exception(getValue('exception').scaleline_method);
    }

    // implementation of this control
    const impl = new ScaleLineImpl(options.vendorOptions ?? {});

    // calls the super constructor
    super(ScaleLine.NAME, impl, options);
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
    return compileTemplate(scalelineTemplate);
  }

  /**
   * Obtiene la ayuda del control
   *
   * @function
   * @public
   * @api
  */
  getHelp() {
    const textHelp = getValue('scaleline').textHelp;
    return {
      title: ScaleLine.NAME,
      content: new Promise((success) => {
        const html = compileTemplate(myhelp, {
          vars: {
            urlImages: `${IDEE.config.STATIC_RESOURCES_URL}/imagenes/controles`,
            translations: {
              help1: textHelp.text1,
              help2: textHelp.text2,
              help3: textHelp.text3,
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
    const equals = (obj instanceof ScaleLine);
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
ScaleLine.NAME = 'scaleline';

export default ScaleLine;
