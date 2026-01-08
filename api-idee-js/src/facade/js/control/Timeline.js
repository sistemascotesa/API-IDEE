/**
 * @module IDEE/control/TimeLine
 */
import TimelineImpl from 'impl/control/Timeline';
import { isNullOrEmpty, isObject, isUndefined } from '../util/Utils';
import Control from './Control';
import { getValue } from '../i18n/language';
import Exception from '../exception/exception';

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
  }
}

export default Timeline;
