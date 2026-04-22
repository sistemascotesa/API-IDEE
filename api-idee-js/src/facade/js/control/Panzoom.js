/**
 * @module IDEE/control/Panzoom
 */
import panzoomTemplate from 'templates/panzoom';
import myhelp from 'templates/panzoomhelp';
import PanzoomImpl from 'impl/control/Panzoom';
import ControlBase from './Control';
import { isUndefined, isNullOrEmpty, isObject } from '../util/Utils';
import Exception from '../exception/exception';
import { compileSync as compileTemplate } from '../util/Template';
import { getValue } from '../i18n/language';
import * as Position from '../ui/position';

/**
 * @typedef {Object} module:IDEE/control/Panzoom~Options
 * @api
 * @property {String} [position] Posición del control en el mapa.
 * @property {String} [tooltip] Texto del tooltip.
 * @property {Number} [order] Accesibilidad, z-index.
 * @property {Object} [vendorOptions] Opciones específicas para la implementación.
 */

/**
 * @classdesc
 * Control que muestra los botones '+' y '-' para acercar y alejar el mapa.
 * @property {String} [position='down'] Posición del control.
 * @property {String} [tooltip_] Texto del tooltip. por defecto la tradcución
 * @property {Number} [order=0] Accesibilidad, z-index.
 * @api
 * @extends {IDEE.Control}
 *
 * @note Para más opciones heredadas, ver {@link module:IDEE/control/Control~Options}.
 */
class Panzoom extends ControlBase {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {module:IDEE/control/Panzoom~Options} options Opciones del control.
   * @example
   * const control = new IDEE.control.Panzoom({
   *   position: 'left',
   *   tooltip: 'Zoom',
   *   order: 2,
   *   vendorOptions: {
   *     zoomInLabel: '+',
   *     zoomOutLabel: '-',
   *   },
   * });
   * @api
   */
  constructor(options = {}) {
    if (isUndefined(PanzoomImpl) || (isObject(PanzoomImpl)
      && isNullOrEmpty(Object.keys(PanzoomImpl)))) {
      Exception(getValue('exception').panzoombar_method);
    }

    // implementation of this control
    const impl = new PanzoomImpl(options.vendorOptions);

    // calls the super constructor
    super(Panzoom.NAME, impl, options);

    // Asignar la posición
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
    return compileTemplate(panzoomTemplate);
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
    const equals = (obj instanceof Panzoom);
    return equals;
  }

  /**
   * Obtiene la ayuda del control
   *
   * @function
   * @public
   * @api
   */
  getHelp() {
    const textHelp = this.translation.textHelp;
    return {
      title: Panzoom.NAME,
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
Panzoom.NAME = 'panzoom';

export default Panzoom;
