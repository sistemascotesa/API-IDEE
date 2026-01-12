/**
 * @module IDEE/control/TimeLine
 */
import TimelineImpl from 'impl/control/TimeLine';
import { isNullOrEmpty, isObject, isUndefined } from '../util/Utils';
import Control from './Control';
import { getValue } from '../i18n/language';
import Exception from '../exception/exception';
import * as Position from '../ui/position';

class Timeline extends Control {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @api
   */
  constructor(options) {
    if (isUndefined(TimelineImpl) || (isObject(TimelineImpl)
      && isNullOrEmpty(Object.keys(TimelineImpl)))) {
      Exception(getValue('exception').timeline_method);
    }

    // implementation of this control
    const impl = new TimelineImpl();

    // calls the super constructor
    super(Timeline.NAME, impl, options);

    this.position = options.position ?? Position.LEFT;
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
    const equals = (obj instanceof Timeline);
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
Timeline.NAME = 'timeline';

export default Timeline;
