/**
 * @module IDEE/control/Panzoombar
 */
import myhelp from 'templates/panzoombarhelp';
import PanzoombarImpl from 'impl/control/Panzoombar';
import FacadeControl from './Control';
import { isUndefined, isNullOrEmpty, isObject } from '../util/Utils';
import Exception from '../exception/exception';
import { compileSync as compileTemplate } from '../util/Template';
import { getValue } from '../i18n/language';
import * as Position from '../ui/position';

/**
 * @typedef {Object} Options
 * @property {string} [position=Position.DOWN] Posición del control en el mapa.
 * Por defecto usada por el panel en el que se añade el control.
 * @property {Object} [vendorOptions] Opciones de proveedor para la biblioteca base.
 */

/**
 * @classdesc
 * Añade una barra de desplazamiento para acercar/alejar el mapa.
 *
 * @api
 * @extends {FacadeControl}
 */
class Panzoombar extends FacadeControl {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Options} options recibe las opciones de configuración por defecto
   * @api
   */
  constructor(options = {}) {
    if (isUndefined(PanzoombarImpl) || (isObject(PanzoombarImpl)
      && isNullOrEmpty(Object.keys(PanzoombarImpl)))) {
      Exception(getValue('exception').panzoombar_method);
    }

    // implementation of this control
    const impl = new PanzoombarImpl(options.vendorOptions);

    // calls the super constructor
    super(Panzoombar.NAME, impl, options);

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
    // Obtiene el DOM de OL
    const element = this.getImpl().getElement();
    // Asigna al elemento de Fachada
    this.element = element;
    return element;
  }

  /**
   * Obtiene la ayuda del control
   *
   * @function
   * @public
   * @api
  */
  getHelp() {
    const textHelp = getValue('panzoombar').textHelp;
    return {
      title: Panzoombar.NAME,
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
    const equals = (obj instanceof Panzoombar);
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
Panzoombar.NAME = 'panzoombar';

export default Panzoombar;
