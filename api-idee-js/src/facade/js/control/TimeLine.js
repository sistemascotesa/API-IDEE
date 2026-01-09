/**
 * @module IDEE/control/TimeLine
 */
import template from 'templates/timeline';
import myhelp from 'templates/timelineHelp';
import templateDinamic from 'templates/timelineDinamic';
import TimelineImpl from 'impl/control/TimeLine';
import {
  isArray, isNullOrEmpty, isObject, isString, isUndefined,
} from '../util/Utils';
import Control from './Control';
import { getValue } from '../i18n/language';
import Exception from '../exception/exception';
import * as Position from '../ui/position';
import { compileSync } from '../util/Template';

const typesTimeline = ['absoluteSimple', 'absolute', 'relative'];

class Timeline extends Control {
  get translation() {
    return getValue('timeline');
  }

  /**
   * Constructor principal de la clase. This classs create one facade control
   * object which has an implementation Object
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

    /**
     * Intervals
     * @public
     * Value: Array with each interval attributes [name, tag, service]
     * @type {String}
     */
    if (options !== undefined) {
      if (isString(options.intervals)) {
        this.intervals = JSON.parse(options.intervals.replace(/!!/g, '[').replace(/¡¡/g, ']'));
      } else if (isArray(options.intervals)) {
        this.intervals = options.intervals;
      } else {
        this.intervals = [];
      }
    }

    /**
     * Animation of the timeline
     * @public
     * Value: true / false
     * @type {boolean}
     */
    this.animation = options.animation;
    if (this.animation === undefined) this.animation = true;

    /**
    * Speed of animation
    * @public
    * Value: 1 - 100
    * @type {number}
    */
    this.speed = parseFloat(options.speed) || 1;

    /**
     *@private
     *@type { string }
     */
    this.tooltip_ = options.tooltip || this.translation.tooltip;

    /**
     *@private
     *@type { Number }
     */
    this.speedDate = (options.speedDate) ? options.speedDate : 2;

    /**
     *@private
     *@type { String }
     */
    this.paramsDate = (options.paramsDate) ? options.paramsDate : 'yr';

    /**
     *@private
     *@type { Number }
     */
    this.stepValue = (options.stepValue) ? options.stepValue : 1;

    /**
     *@private
     *@type { String }
     */
    this.sizeWidthDinamic = (options.sizeWidthDinamic) ? options.sizeWidthDinamic : '';

    /**
     *@private
     *@type { String }
     */
    this.formatMove = (options.formatMove === 'discrete') ? 'discrete' : 'continuous';

    /**
     *@private
     *@type { String }
     */
    this.formatValue = (options.formatValue) ? options.formatValue : 'linear';

    /**
     *@private
     *@type { String }
     */
    this.timelineType = options.timelineType || false;

    /** --- Comprobaciones necesarias antes de poder añadir el control --- */

    if (!this.timelineType || !typesTimeline.includes(this.timelineType)) {
      throw new Error('Add correct typesTimeline, (absoluteSimple', 'absolute', 'relative)');
    }

    if (this.timelineType === 'absolute' || this.timelineType === 'relative') {
      this.intervals = this.intervals.filter(({ layer }) => {
        if (typeof layer === 'string') {
          return !layer.includes('GenericRaster') || !layer.includes('GenericVector');
        }

        return layer.type !== 'GenericRaster' || layer.type !== 'GenericVector';
      });
    } else {
      this.intervals = this.intervals.filter((layer) => {
        if (typeof layer === 'string') {
          return !layer.includes('GenericRaster') || !layer.includes('GenericVector');
        }

        return layer.type !== 'GenericRaster' || layer.type !== 'GenericVector';
      });
    }

    // Dinamic TimeLine
    if (options.intervals) {
      if (!['absolute', 'relative'].includes(this.timelineType)) {
        this.intervals = options.intervals;
      } else {
        this.intervals = Object.entries(options.intervals)
          .map(([key, values]) => {
            const valuesNew = values;
            const [init, end] = this.transformTime_NumbToDate(valuesNew.init, valuesNew.end);
            valuesNew.init = init;
            valuesNew.end = end;
            return valuesNew;
          });
      }
    }

    /**
     * position
     * @public
     * Value: Array with each interval attributes [name, tag, service]
     * @type {String}
     */
    this.position = Position.isValid(options.position) ? options.position : Position.LEFT;

    this.running = false;

    this.date = {
      init: 0,
      end: 0,
    };

    this.allLayersDinamic = {
      groupLayer: [],
      noGroupLayer: [],
    };

    /**
     * Template
     * @public
     * @type { HTMLElement }
     */
    this.template = null;
  }

  /**
  * This function creates the view
  *
  * @public
  * @function
  * @param {IDEE.Map} map to add the control
  * @returns {Promise} Plantilla HTML.
  * @api stable
  */
  createView(map) {
    return new Promise((success, fail) => {
      const isType = ['absolute', 'relative'].includes(this.timelineType);
      this.template = compileSync((isType) ? templateDinamic : template, {
        vars: {
          translations: {
            title: this.translation.title,
            play: this.translation.play,
            initValue: this.translation.initValue,
            endValue: this.translation.endValue,
          },
          sizeWidthDinamic: this.sizeWidthDinamic,
        },
      });

      if (isType) {
        this.createtimeLineDinamic();
        success(this.template);
      } else {
        const intervals = [];
        this.intervals.forEach((interval, k) => {
          const layer = this.transformToLayers(interval[2]);
          const copy = this.getMapLayer(layer);
          if (copy !== undefined) {
            this.map.removeLayers(copy);
          }
          this.map.addLayers(layer);
          const iv = {
            number: k,
            name: interval[0],
            tag: interval[1],
            service: layer,
          };
          intervals.push(iv);
        });
        this.intervals = intervals;

        this.intervals.forEach((interval, k) => {
          const tag = document.createElement('div');
          if (k !== 0 && k !== this.intervals.length - 1 && k
            !== parseInt(this.intervals.length / 2, 10)) {
            tag.dataset.tag = '';
          } else {
            tag.dataset.tag = interval.tag;
          }
          this.template.querySelector('.slider-tags').append(tag);
        });
        this.template.querySelector('.div-m-timeline-panel').style.setProperty('--num', this.intervals.length);
        const slider = this.template.querySelector('#input-slider');
        slider.setAttribute('max', intervals.length - 1);
        slider.addEventListener('input', (e) => this.changeSlider(slider));
        slider.addEventListener('change', (e) => {
          document.querySelector('.m-timeline-button button').classList.add('timeline-control-siguiente');
          document.querySelector('.m-timeline-button button').classList.remove('timeline-control-pausa');
          document.querySelector('.div-m-timeline-slider').style.setProperty('--opacity', '0');
          clearTimeout(this.running);
          this.running = false;
        });
        const play = this.template.querySelector('#m-timeline-play');
        play.addEventListener('click', (e) => this.playTimeline(false));
        success(this.template);
      }
    });
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {IDEE.Control} control to compare
   * @api stable
   * @return {Boolean}
   */
  equals(control) {
    return control instanceof Timeline;
  }

  /**
  * Obtiene la ayuda del plugin
  *
  * @function
  * @public
  * @api
  */
  getHelp() {
    return {
      title: this.name,
      content: new Promise((success) => {
        const html = compileSync(myhelp, {
          vars: {
            urlImages: `${IDEE.config.STATIC_RESOURCES_URL}/imagenes/controles`,
            translations: {
              help1: this.translation.textHelp.help1,
              help2: this.translation.textHelp.help2,
              help3: this.translation.textHelp.help3,
              help4: this.translation.textHelp.help4,
              help5: this.translation.textHelp.help5,
            },
          },
        });
        success(html);
      }),
    };
  }

  /**
   * Elimina el control.
   *
   * @public
   * @function
   * @api
   * @export
   */
  destroy() {
    if (['absolute', 'relative'].includes(this.timelineType)) {
      this.control_.removeLayers();
    } else {
      this.control_.removeTimelineLayers();
    }
    [this.control_, this.panel_, this.map_, this.layers, this.radius] = [
      null, null, null, null, null,
    ];
    super.destroy();
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
