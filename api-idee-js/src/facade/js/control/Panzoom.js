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
 * @classdesc
 * Agregue los botones '+' y '-' para acercar y alejar el mapa.
 *
 * @api
 * @extends {IDEE.Control}
 */
class Panzoom extends ControlBase {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Object} options recibe las opciones de configuración por defecto
   * position: {@link Position posicion} válida para el control
   * @api
   */
  constructor(options = {}) {
    const position = options.position ?? Position.DOWN;
    const vendorOptions = options.vendorOptions ?? {};

    if (isUndefined(PanzoomImpl) || (isObject(PanzoomImpl)
      && isNullOrEmpty(Object.keys(PanzoomImpl)))) {
      Exception(getValue('exception').panzoombar_method);
    }

    // implementation of this control
    const impl = new PanzoomImpl(vendorOptions);

    // calls the super constructor
    super(Panzoom.NAME, impl);

    // Asignar la posición
    this.position = position;
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
    const textHelp = getValue('panzoom').textHelp;
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
