/**
 * @module IDEE/control/MeasureBar
 */
import 'assets/css/controls/scale';
import scaleTemplate from 'templates/scale';
import MeasureBarImpl from 'impl/control/MeasureBar';
import myhelp from 'templates/scalehelp';
import ControlBase from './Control';
import { isUndefined, isNullOrEmpty, isObject } from '../util/Utils';
import Exception from '../exception/exception';
import { compileSync as compileTemplate } from '../util/Template';
import { getValue } from '../i18n/language';
import * as Position from '../ui/position';

/**
 * @classdesc
 * Agregar escala numérica.
 * @property {Number} order Orden que tendrá con respecto al
 * resto de plugins y controles por pantalla.
 *
 * @api
 * @extends {IDEE.Control}
 */
class MeasureBar extends ControlBase {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Object} options Opciones del control.
   * - exactMeasurebar: Escala exacta.
   * @api
   */
  constructor(options = {}) {
    if (isUndefined(MeasureBarImpl)
      || (isObject(MeasureBarImpl) && isNullOrEmpty(Object.keys(MeasureBarImpl)))) {
      Exception(getValue('exception').measure_method);
    }
    // implementation of this control
    const impl = new MeasureBarImpl(options);

    // calls the super constructor
    super(MeasureBar.NAME, impl, options);
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
        title: getValue('scale').title,
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
    const textHelp = getValue(MeasureBar.NAME).textHelp;
    return {
      title: MeasureBar.NAME,
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
    const equals = (obj instanceof MeasureBar);
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
MeasureBar.NAME = 'measurebar';

export default MeasureBar;
