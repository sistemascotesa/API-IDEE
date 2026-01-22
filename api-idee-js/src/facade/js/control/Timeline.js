/**
 * @module IDEE/control/Timeline
 */
import 'assets/css/fonts';
import 'assets/css/controls/timeline';
import timelineTemplate from 'templates/timeline';
import myhelp from 'templates/timelineHelp';
import timelineDinamicTemplate from 'templates/timelineDinamic';
import TimelineImpl from 'impl/control/Timeline';
import WMS from 'IDEE/layer/WMS';
import WMTS from 'IDEE/layer/WMTS';
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
  constructor(options = {}) {
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
     * Value: Array with each interval attributes [name, tag, service]
     * @property {String} intervals
     */
    if (options !== undefined) {
      if (isString(options.intervals)) {
        this.intervals = JSON.parse(options.intervals.replace(/!!/g, '[').replace(/¡¡/g, ']'));
      } else if (isArray(options.intervals)) {
        this.intervals = options.intervals;
      } else {
        // IDEE.dialog.error(getValue('intervals_error'));
        this.intervals = [];
      }
    }

    /**
     * Animation of the timeline
     * Value: true / false
     * @type {boolean}
     */
    this.animation = options.animation;
    if (this.animation === undefined) this.animation = true;

    /**
    * Speed of animation
    * Value: 1 - 100
    * @type {number}
    */
    this.speed = parseFloat(options.speed) || 1;

    /**
     *@type { Number }
     */
    this.speedDate = (options.speedDate) ? options.speedDate : 2;

    /**
     *@type { String }
     */
    this.paramsDate = (options.paramsDate) ? options.paramsDate : 'yr';

    /**
     *@type { Number }
     */
    this.stepValue = (options.stepValue) ? options.stepValue : 1;

    /**
     *@type { String }
     */
    this.sizeWidthDinamic = (options.sizeWidthDinamic) ? options.sizeWidthDinamic : '';

    /**
     *@type { String }
     */
    this.formatMove = (options.formatMove === 'discrete') ? 'discrete' : 'continuous';

    /**
     *@type { String }
     */
    this.formatValue = (options.formatValue) ? options.formatValue : 'linear';

    /**
     *@type { String }
     */
    this.timelineType = options.timelineType || false;

    /** --- Comprobaciones necesarias antes de poder añadir el control --- */

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
     * @type {Position}
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
      const template = compileSync((isType) ? timelineDinamicTemplate : timelineTemplate, {
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
      this.setElement(template);

      if (isType) {
        this.createtimeLineDinamic();
        success(this.getElement());
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
          this.getElement().querySelector('.slider-tags').append(tag);
        });
        this.getElement().querySelector('.div-m-timeline-panel').style.setProperty('--num', this.intervals.length);
        const slider = this.getElement().querySelector('#input-slider');
        slider.setAttribute('max', intervals.length - 1);
        slider.addEventListener('input', (e) => this.changeSlider(slider));
        slider.addEventListener('change', (e) => {
          this.getPlayTimeButton().classList.add('g-cartografia-control-siguiente');
          this.getPlayTimeButton().classList.remove('g-cartografia-control-pausa');
          document.querySelector('.div-m-timeline-slider').style.setProperty('--opacity', '0');
          clearTimeout(this.running);
          this.running = false;
        });
        const play = this.getElement().querySelector('#m-timeline-play');
        play.addEventListener('click', (e) => this.playTimeline(false));
        success(this.getElement());
      }
    });
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
    super.addTo(map);
  }

  /**
    * This function transform string to IDEE.Layer
    *
    * @public
    * @function
    * @api stable
    * @param {string | object}
    * @return {Boolean}
    */
  isValidLayer(layer) {
    return isObject(layer) && (layer.type === 'WMTS' || layer.type === 'WMS');
  }

  /**
   * Transform StringLayers to api-idee IDEE.Layer
   *
   * WMTS*http://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*EPSG:25830*PNOA
   * WMS*IGN*http://www.ign.es/wms-inspire/ign-base*IGNBaseTodo
   *
   * @public
   * @function
   * @api stable
   * @param {string}
   * @return {object}
   */
  transformToLayers(layer) {
    let newLayer = null;
    if (!(layer instanceof Object)) {
      if (layer.indexOf('*') >= 0) {
        const urlLayer = layer.split('*');
        if (urlLayer[0].toUpperCase() === 'WMS') {
          newLayer = new WMS({
            url: urlLayer[2],
            name: urlLayer[3],
          });
        } else if (urlLayer[0].toUpperCase() === 'WMTS') {
          newLayer = new WMTS({
            url: urlLayer[2],
            name: urlLayer[3],
          });
        }
      } else {
        const layerByName = this.map.getLayers().find((l) => layer.includes(l.name));
        newLayer = this.isValidLayer(layerByName) ? layerByName : null;
      }
    } else if (layer instanceof Object) {
      const layerByObject = this.map.getLayers().find((l) => layer.name.includes(l.name));
      newLayer = this.isValidLayer(layerByObject) ? layerByObject : null;
    }
    if (newLayer !== null) {
      newLayer.displayInLayerSwitcher = false;
      newLayer.setVisible(false);
      return newLayer;
    }
    this.map.removeLayers(layer);
  }

  /** This function change layers and show layer name when slider moves
   *
   * @public
   * @function
   * @api stable
   */
  changeSlider(elem) {
    document.querySelector('.div-m-timeline-slider').style.setProperty('--opacity', '0');
    const left = (((elem.value - elem.min) / (elem.max - elem.min)) * ((256 - 5) - 5)) + 5;
    document.querySelector('.div-m-timeline-slider').style.setProperty('--left', `${left}px`);
    if (this.animation || this.intervals[0].name !== '') {
      document.querySelector('.m-timeline-names').style.display = 'block';
    }
    if (this.animation) {
      document.querySelector('.m-timeline-button').style.display = 'block';
    }
    const step = parseFloat(elem.value);
    this.intervals.forEach((interval) => {
      this.getMapLayer(interval.service).setVisible(false);
      document.querySelector('.m-timeline-names').innerHTML = '';
    });
    if (step % 1 === 0) {
      document.querySelector('.div-m-timeline-slider').style.setProperty('--left', `${left + 20}px`);
      this.getMapLayer(this.intervals[step].service).setVisible(true);
      document.querySelector('.m-timeline-names').innerHTML = this.intervals[step].name;
      document.querySelector('.div-m-timeline-panel').style.setProperty('--valor', `"${this.intervals[step].tag}"`);
      if (this.intervals[step].tag !== '') {
        document.querySelector('.div-m-timeline-slider').style.setProperty('--opacity', '1');
      } else {
        document.querySelector('.div-m-timeline-slider').style.setProperty('--opacity', '0');
      }
    } else {
      this.getMapLayer(this.intervals[parseInt(step, 10)].service).setVisible(true);
      this.getMapLayer(this.intervals[parseInt(step, 10) + 1].service).setVisible(true);
      if (this.intervals[parseInt(step, 10)].tag !== '' && this.intervals[parseInt(step, 10) + 1].tag !== '') {
        document.querySelector('.div-m-timeline-slider').style.setProperty('--left', `${left}px`);
        document.querySelector('.div-m-timeline-slider').style.setProperty('--opacity', '1');
        document.querySelector('.div-m-timeline-panel').style.setProperty('--valor', `"${this.intervals[parseInt(step, 10)].tag} - ${this.intervals[parseInt(step, 10) + 1].tag}"`);
        document.querySelector('.m-timeline-names').innerHTML = `${this.intervals[parseInt(step, 10)].name} y ${this.intervals[parseInt(step, 10) + 1].name}`;
      } else if (this.intervals[parseInt(step, 10)].tag === '' && this.intervals[parseInt(step, 10) + 1].tag === '') {
        document.querySelector('.div-m-timeline-slider').style.setProperty('--opacity', '0');
      } else {
        document.querySelector('.div-m-timeline-slider').style.setProperty('--left', `${left + 20}px`);
        document.querySelector('.div-m-timeline-slider').style.setProperty('--opacity', '10');
        document.querySelector('.m-timeline-names').innerHTML = this.intervals[parseInt(step, 10)].name + this.intervals[parseInt(step, 10) + 1].name;
        document.querySelector('.div-m-timeline-panel').style.setProperty('--valor', `"${this.intervals[parseInt(step, 10)].tag}${this.intervals[parseInt(step, 10) + 1].tag}"`);
      }
    }
  }

  /** This function search a layer in the map
   *
   * @public
   * @function
   * @api stable
   * @return {object}
   */
  getMapLayer(layerSearch) {
    return this.map.getLayers()
      .find((layer) => layer.getImpl().legend === layerSearch.getImpl().legend);
  }

  /** Returns the play button element used to init timeline process
   *
   * @public
   * @api stable
   * @function
   * @returns {HTMLButtonElement}
   */
  getPlayTimeButton() {
    return document.getElementById('m-timeline-play');
  }

  /** This function make the play animation
   *
   * @public
   * @function
   * @api stable
   * @return {void}
   */
  playTimeline(next) {
    const start = 0;
    const end = this.intervals.length - 1;
    const slider = document.querySelector('#input-slider');
    let step = parseInt(slider.value, 10);
    if (this.running) {
      this.getPlayTimeButton().classList.add('g-cartografia-control-siguiente');
      this.getPlayTimeButton().classList.remove('g-cartografia-control-pausa');
      clearTimeout(this.running);
    }
    if (!next) {
      if (step > start && step < end && this.running) {
        this.running = false;
        return;
      }
      if (step > end) {
        step = start;
      }
    }
    if (step >= end) {
      slider.value = 0;
      this.changeSlider(slider);
      return;
    }
    if (step < start) {
      step = start;
    }
    slider.value = parseFloat(slider.value) + 1;
    this.changeSlider(slider);
    this.getPlayTimeButton().classList.remove('g-cartografia-control-siguiente');
    this.getPlayTimeButton().classList.add('g-cartografia-control-pausa');
    this.running = setTimeout((e) => this.playTimeline(true), this.speed * 1000);
  }

  /**
   * This function remove the timeline layers
   *
   * @public
   * @function
   * @api stable
   */
  removeTimelineLayers() {
    clearInterval(this.running);
    this.intervals.forEach((interval) => {
      this.map.removeLayers(this.getMapLayer(interval.service));
    });
  }

  // ++ timeLineDinamic
  /**
   * Create TimeLine Dinamic
   *
   * @private
   * @function
   */
  createtimeLineDinamic() {
    this.createStepsTimeLine();
    this.createSelectorLayers();
    this.createInputDate();
  }

  /**
   * Create input date TimeLine Dinamic
   *
   * @private
   * @function
   */
  createInputDate() {
    const init = this.getElement().querySelector('#init');
    const end = this.getElement().querySelector('#end');

    init.value = this.date.init;
    end.value = this.date.end;

    ['focusout', 'keypress'].forEach((event) => {
      init.addEventListener(event, ({ target, key = false } = {}) => {
        if (event === 'focusout' || key === 'Enter') {
          const value = this.getValues_inputDate(target.value);
          const endValue = this.getValues_inputDate(end.value);
          this.changeDateLayer(new Date(target.value).getTime(), new Date(end.value).getTime());
          this.changeValueSlider(value, endValue);
        }
      });

      end.addEventListener(event, ({ target, key = false } = {}) => {
        if (event === 'focusout' || key === 'Enter') {
          const value = this.getValues_inputDate(target.value);
          const valueInit = this.getValues_inputDate(init.value);
          this.changeDateLayer(new Date(init.value).getTime(), new Date(target.value).getTime());
          this.changeValueSlider(valueInit, value);
        }
      });
    });
  }

  /**
   * Create selector layers TimeLine Dinamic
   *
   * @private
   * @function
   */
  createSelectorLayers() {
    const selectDinamic = this.getElement().querySelector('#selectDinamicLayer');
    this.intervals.forEach(({
      id, init, end, layer, grupo, attributeParam, equalsTimeLine = false,
    }) => {
      if (!equalsTimeLine) {
        // eslint-disable-next-line no-param-reassign
        equalsTimeLine = (this.timelineType === 'absolute');
      }

      const l = this.transformToLayersDinamic(
        { init, end },
        layer,
        id,
        attributeParam,
        equalsTimeLine,
      );
      if (grupo) {
        const layerGroup = this.allLayersDinamic.groupLayer.find(({ name }) => name === grupo);

        if (layerGroup) {
          const lastGroup = selectDinamic.querySelector(`#${grupo}`);

          const lastGroupInit = lastGroup.getAttribute('init');
          const lastGroupEnd = lastGroup.getAttribute('end');

          lastGroup.setAttribute('init', (new Date(lastGroupInit).getTime() < new Date(init).getTime()) ? lastGroupInit : init);
          lastGroup.setAttribute('end', (new Date(lastGroupEnd).getTime() > new Date(end).getTime()) ? lastGroupEnd : end);

          layerGroup.layers.push(l);
        } else {
          this.allLayersDinamic.groupLayer.push({
            name: grupo,
            layers: [l],
          });
          selectDinamic.innerHTML += `<option id="${grupo}" equalsTimeLine="${equalsTimeLine}" init="${init}" end="${end}" value="group">${grupo}</option>`;
        }
      } else {
        this.allLayersDinamic.noGroupLayer.push({
          name: l.name,
          layers: [l],
        });
        selectDinamic.innerHTML += `<option id="${id}" equalsTimeLine="${equalsTimeLine}" init="${init}" end="${end}" value="${id}">${l.name}</option>`;
      }
    });
    this.selectorEventLayer();
  }

  /**
   * Create steps TimeLine Dinamic
   *
   * @private
   * @function
  */
  createStepsTimeLine() {
    this.getElement().querySelector('#m-timelineDinamic-play').addEventListener('click', ({ target }) => {
      const active = target.classList.contains('active');
      if (!active) {
        const id = this.stepsTimeLineDinamic();
        target.classList.add('active');
        target.setAttribute('intervalID', id);
      } else {
        clearInterval(target.getAttribute('intervalID'));
        target.classList.remove('active');
      }
    });

    [this.getElement().querySelector('#m-timelineDinamic-back'),
      this.getElement().querySelector('#m-timelineDinamic-before')].forEach((l) => {
      l.addEventListener('click', ({ target }) => {
        this.evtFormatMove(target.id);
      });
    });
  }

  /**
   * Search Layers Dinamic
   *
   * @private
   * @function
  */
  searchLayerDinamic(layer) {
    return this.intervals.find(({ id }) => layer.id === id);
  }

  /**
   * Return layers filter Date
   *
   * @private
   * @function
  */
  transformToLayersDinamic({ init, end }, layer, id, attributeParam, equalsTimeLine) {
    const layerAux = layer;
    if (!(layerAux instanceof Object)) {
      const [type, legend, url, name] = layerAux.split('*');
      const layerWMS = new IDEE.layer.WMS(
        {
          type, legend, url, name,
        },
        {
          params: {
            CQL_FILTER: (equalsTimeLine)
              ? `${attributeParam} = '${new Date(end).toISOString()}'`
              : `${attributeParam} DURING ${new Date(init).toISOString()}/${new Date(end).toISOString()}`,
          },
        },
      );
      layerWMS.id = id;
      layerWMS.layerTimeLine = true;
      layerWMS.attributeParam = attributeParam;
      layerWMS.equalsTimeLine = equalsTimeLine;
      return layerWMS;
    }
    if ((layerAux instanceof IDEE.layer.Vector)) {
      layerAux.layerTimeLine = true;
      layerAux.id = id;
      layerAux.attributeParam = attributeParam;
      layerAux.equalsTimeLine = equalsTimeLine;
      return layerAux;
    }
    // WMS
    layerAux.layerTimeLine = true;
    layerAux.id = id;
    layerAux.attributeParam = attributeParam;
    layerAux.equalsTimeLine = equalsTimeLine;
    return layerAux;
  }

  /**
   * Return Date Input Format
   *
   * @private
   * @function
  */
  getValues_inputDate(value) {
    const format = this.formatValue;
    const formatRevert = this.getReverseFormat(format);
    const dateToNumber = new Date(value).getTime();
    return this.getFormatValue(dateToNumber, formatRevert);
  }

  /**
   * Event to Selector Layer TimeLine Dinamic
   *
   * @private
   * @function
  */
  selectorEventLayer() {
    const selectDinamic = this.getElement().querySelector('#selectDinamicLayer');
    selectDinamic.addEventListener('change', ({ target }) => {
      this.removeLayers();

      if (target.selectedIndex === 0) {
        this.changeValueInputDate('Please choose an option', 'Please choose an option');
        this.sliderEventDinamic(0, 1);
        return;
      }

      const selected = target.children[target.selectedIndex];

      const init = selected.getAttribute('init');
      const end = selected.getAttribute('end');
      const equalsTimeLine = selected.getAttribute('equalsTimeLine');

      if (equalsTimeLine === 'true') {
        document.querySelector('#a').setAttribute('disabled', '');
        document.querySelector('#init').setAttribute('disabled', '');
      } else {
        document.querySelector('#a').removeAttribute('disabled');
        document.querySelector('#init').removeAttribute('disabled');
      }

      if (selected.value === 'group') {
        const layerGroup = this.allLayersDinamic.groupLayer
          .find(({ name }) => name === selected.id);
        this.map.addLayers(layerGroup.layers);
        this.changeVectorLayer(
          new Date(init).getTime(),
          new Date(end).getTime(),
          layerGroup.layers,
        );

        this.changeValueInputDate(init, end);
        this.sliderEventDinamic(new Date(init).getTime(), new Date(end).getTime());
      } else {
        const layerNoGroup = this.allLayersDinamic.noGroupLayer
          .find(({ name, layers }) => layers[0].id === selected.id);

        this.map.addLayers(layerNoGroup.layers);
        this.changeVectorLayer(
          new Date(init).getTime(),
          new Date(end).getTime(),
          layerNoGroup.layers,
        );

        this.changeValueInputDate(init, end);
        this.sliderEventDinamic(
          new Date(init).getTime(),
          new Date(end).getTime(),
        );
      }
    });
  }

  /**
   * Remove Layer TimeLine Dinamic
   *
   * @private
   * @function
  */
  removeLayers() {
    const removeLayers = this.map.getLayers().filter((l) => l.layerTimeLine === true);
    this.map.removeLayers(removeLayers);
  }

  /**
   * Get Layers TimeLine Dinamic
   *
   * @private
   * @function
  */
  getLayerTimeLine() {
    return this.map.getLayers().filter((l) => l.layerTimeLine === true);
  }

  /**
   * Event Slider TimeLine Dinamic
   *
   * @private
   * @function
  */
  sliderEventDinamic(init, end) {
    this.generateValueSlider(init, end);

    this.getElement().querySelector('.wrap #a').addEventListener('input', ({ target }) => {
      const inputvalue = Number(document.querySelector('.wrap #b').value);
      if (Number(target.value) >= inputvalue) {
        // eslint-disable-next-line no-param-reassign
        target.value = inputvalue;
        return;
      }

      const formatValue = this.formatValue;
      const valueInit = this.getFormatValue(Number(target.value), formatValue);
      const valueEnd = this.getFormatValue(Number(inputvalue), formatValue);

      this.changeDateLayer(valueInit, valueEnd);
      this.changeValueInputDate(
        new Date(valueInit).toISOString(),
        new Date(valueEnd).toISOString(),
      );
    });

    this.getElement().querySelector('.wrap #b').addEventListener('input', ({ target }) => {
      const inputvalue = Number(document.querySelector('.wrap #a').value);
      if (Number(target.value) <= inputvalue) {
        // eslint-disable-next-line no-param-reassign
        target.value = inputvalue;
        return;
      }

      const formatValue = this.formatValue;
      const valueEnd = this.getFormatValue(Number(target.value), formatValue);
      const valueInit = this.getFormatValue(Number(inputvalue), formatValue);

      this.changeDateLayer(valueInit, valueEnd);
      this.changeValueInputDate(
        new Date(valueInit).toISOString(),
        new Date(valueEnd).toISOString(),
      );
    });
  }

  /**
   * Generate Values Slider TimeLine Dinamic
   *
   * @private
   * @function
  */
  generateValueSlider(init, end) {
    const inputInit = this.getElement().querySelector('.wrap #a');
    const inputEnd = this.getElement().querySelector('.wrap #b');

    const dateInit = new Date(init).getTime();
    const dateEnd = new Date(end).getTime();

    inputInit.min = dateInit;
    inputInit.max = dateEnd;
    inputInit.value = dateInit;

    inputEnd.min = dateInit;
    inputEnd.max = dateEnd;
    inputEnd.value = dateEnd;
  }

  /**
   * Change Value Input Date TimeLine Dinamic
   *
   * @private
   * @function
  */
  changeValueInputDate(init, end) {
    this.getElement().querySelector('#init').value = init;
    this.getElement().querySelector('#end').value = end;
  }

  /**
   * Change Value Slider TimeLine Dinamic
   *
   * @private
   * @function
  */
  changeValueSlider(init, end) {
    const wrapInputs = this.getElement().querySelectorAll('.wrap input');
    wrapInputs[0].value = init;
    wrapInputs[1].value = end;
  }

  /**
   * Change Date Layer TimeLine Dinamic
   *
   * @private
   * @function
  */
  changeDateLayer(init, end) {
    const initValue = Number(init);
    const endValue = Number(end);

    const layersTimeLine = this.getLayerTimeLine();
    this.removeLayers();

    layersTimeLine.forEach((l) => {
      if (l instanceof IDEE.layer.Vector) {
        l.on(IDEE.evt.LOAD, () => {
          const searhDinamic = this.searchLayerDinamic(l);
          const [vectorInitValue, vectorEndValue] = this
            .getGroupLimit(initValue, endValue, searhDinamic);

          const filter = new IDEE.filter.Function((f) => {
            const dateTime = f.getAttributes()[l.attributeParam];
            if (l.equalsTimeLine) {
              if (
                vectorEndValue === new Date(this.transformTime_NumbToDate(dateTime)[0]).getTime()
              ) {
                return f;
              }
            }

            if (
              vectorInitValue <= new Date(this.transformTime_NumbToDate(dateTime)[0]).getTime()
              && vectorEndValue >= new Date(this.transformTime_NumbToDate(dateTime)[0]).getTime()
            ) {
              return f;
            }
          });

          // eslint-disable-next-line no-param-reassign
          l.setFilter(filter);
        });
      } else {
        const searhDinamic = this.searchLayerDinamic(l);
        const [wmsInitValue, wmsEndValue] = this.getGroupLimit(initValue, endValue, searhDinamic);
        // eslint-disable-next-line no-param-reassign
        l.options.params.CQL_FILTER = (l.equalsTimeLine)
          ? `${l.attributeParam} = '${new Date(end).toISOString()}'`
          : `${l.attributeParam} DURING ${new Date(wmsInitValue).toISOString()}/${new Date(wmsEndValue).toISOString()}`;
      }
      this.map.addLayers(l);
    });
  }

  /**
   * Vector Layer Change Date TimeLine Dinamic
   *
   * @private
   * @function
  */
  changeVectorLayer(init, end, layers) {
    const vectorLayers = layers.filter((l) => l instanceof IDEE.layer.Vector);
    vectorLayers.forEach((l) => {
      l.on(IDEE.evt.LOAD, () => {
        const searhDinamic = this.searchLayerDinamic(l);
        const [vectorInitValue, vectorEndValue] = this.getGroupLimit(init, end, searhDinamic);

        const filter = new IDEE.filter.Function((f) => {
          const dateTime = f.getAttributes()[l.attributeParam];
          if (l.equalsTimeLine) {
            if (
              vectorEndValue === new Date(this.transformTime_NumbToDate(dateTime)[0]).getTime()
            ) {
              return f;
            }

            if (
              vectorInitValue <= new Date(this.transformTime_NumbToDate(dateTime)[0]).getTime()
              && vectorEndValue >= new Date(this.transformTime_NumbToDate(dateTime)[0]).getTime()
            ) {
              return f;
            }
          }
        });

        l.setFilter(filter);
      });
    });
  }

  /**
   * Continuous Event Back
   *
   * @private
   * @function
  */
  evtFormatMove(id) {
    if (this.getElement().querySelector('#selectDinamicLayer').value === '') {
      this.changeValueInputDate('Please choose an option', 'Please choose an option');
      this.sliderEventDinamic(0, 1);
      return;
    }

    const format = this.formatValue;
    const formatRevert = this.getReverseFormat(format);

    const [dateInit, dateEnd] = this.getValueDateInput().map((numberIntEnd, i) => {
      if (i === 0 && this.formatMove === 'discrete') {
        return numberIntEnd;
      }
      if (id === 'm-timelineDinamic-before') {
        const sliderMax = this.getValueSliderB().max;
        return this.getValueBeforeEvent(numberIntEnd, sliderMax);
      }
      const sliderMin = this.getValueSliderB().min;
      return this.getValueBackEvent(numberIntEnd, sliderMin);
    });

    this.changeValueInputDate(new Date(dateInit).toISOString(), new Date(dateEnd).toISOString());
    const [reverseInit, reverseEnd] = [dateInit, dateEnd]
      .map((n) => this.getFormatValue(n, formatRevert));

    this.changeDateLayer(dateInit, dateEnd);
    this.changeValueSlider(reverseInit, reverseEnd);
  }

  /**
   * Get Value Back Event
   *
   * @private
   * @function
  */
  getValueBackEvent(value, sliderMin) {
    return ((value - this.getStepValue()) <= sliderMin)
      ? sliderMin
      : value - this.getStepValue();
  }

  /**
   * Reverse Format TimeLine Dinamic
   *
   * @private
   * @function
  */
  getReverseFormat(format) {
    const formatValue = format;
    if (formatValue === 'logarithmic') return 'exponential';
    if (formatValue === 'exponential') return 'logarithmic';
    return 'linear';
  }

  /**
   * Before Event Get Values
   *
   * @private
   * @function
  */
  getValueBeforeEvent(number, sliderMax) {
    return ((number + this.getStepValue()) >= sliderMax)
      ? sliderMax
      : number + this.getStepValue();
  }

  /**
   * Get Value Date Input
   *
   * @private
   * @function
  */
  getValueDateInput() {
    const init = document.querySelector('#init').value;
    const end = document.querySelector('#end').value;
    return [new Date(init).getTime(), new Date(end).getTime()];
  }

  /**
   * Get Format Value
   *
   * @private
   * @function
  */
  getFormatValue(value, format) {
    const sliderMax = Number(document.querySelector('#b').max);
    const sliderMin = Number(document.querySelector('#b').min);

    const formatValue = format;
    if (formatValue === 'exponential') {
      return this.exponential(sliderMin, sliderMax, value);
    } if (formatValue === 'logarithmic') {
      return this.logarithmic(sliderMin, sliderMax, value);
    }
    return value;
  }

  /**
   * Get Value Slider B
   *
   * @private
   * @function
  */
  getValueSliderB() {
    return {
      min: Number(document.querySelector('#b').min),
      max: Number(document.querySelector('#b').max),
      value: Number(document.querySelector('#b').value),
    };
  }

  /**
   * Get Value Slider A
   *
   * @private
   * @function
  */
  getValueSliderA() {
    return {
      min: Number(document.querySelector('#a').min),
      max: Number(document.querySelector('#a').max),
      value: Number(document.querySelector('#a').value),
    };
  }

  /**
   * Step TimeLine Dinamic
   *
   * @private
   * @function
  */
  stepsTimeLineDinamic() {
    if (this.getElement().querySelector('#selectDinamicLayer').value === '') {
      this.changeValueInputDate('Please choose an option', 'Please choose an option');
      this.sliderEventDinamic(0, 1);
      return;
    }

    const speed = this.speedDate;

    const time = setInterval(() => {
      this.evtFormatMove('m-timelineDinamic-before');
    }, 1000 * speed);

    return time;
  }

  /**
   * Get Value Step
   *
   * @private
   * @function
  */
  getStepValue() {
    const date = this.paramsDate;
    switch (date) {
      case 'sec':
        return 1000 * this.stepValue;

      case 'min':
        return (1000 * 60) * this.stepValue;

      case 'hrs':
        return (1000 * 60 * 60) * this.stepValue;

      case 'day':
        return (1000 * 60 * 60 * 24) * this.stepValue;

      case 'mos':
        return (1000 * 60 * 60 * 24 * 30) * this.stepValue;

      case 'yr':
        return (1000 * 60 * 60 * 24 * 30 * 12) * this.stepValue;

      default:
        return 86400000; // day in ms
    }
  }

  /**
   * Get Limit Group
   *
   * @private
   * @function
  */
  getGroupLimit(init, end, userValues) {
    const initValue = (init <= new Date(userValues.init).getTime())
      ? new Date(userValues.init).getTime()
      : init;
    const endValues = (end >= new Date(userValues.end).getTime())
      ? new Date(userValues.end).getTime()
      : end;
    return [initValue, endValues];
  }

  /**
   * Transform Time/Number to Date
   *
   * @private
   * @function
  */
  transformTime_NumbToDate(init = 0, end = 0) {
    const initVal = (Number.isNaN(Number(init)))
      ? new Date(init).toISOString()
      : new Date(Number(init)).toISOString();
    const endVal = (Number.isNaN(Number(end)))
      ? new Date(end).toISOString()
      : new Date(Number(end)).toISOString();
    return [initVal, endVal];
  }

  /**
   * Logarithmic Formt
   *
   * @private
   * @function
  */
  logarithmic(min, max, val) {
    const [minv, , scale] = this.formatValueType(min, max);

    if (min > 0) {
      return Math.round(Math.exp(minv - min * scale + scale * val));
    }
    return Math.round(
      Math.exp(-min * scale) * (Math.exp(minv + scale * val)
        + min * Math.exp(min * scale) - Math.exp(min * scale)),
    );
  }

  /**
   * Type Format Value
   *
   * @private
   * @function
  */
  formatValueType(min, max) {
    const fristDate = min;
    const endDate = max;

    let minv = 0;
    let maxv = 0;

    if (fristDate > 0) {
      minv = Math.log(fristDate);
      maxv = Math.log(endDate);
    } else {
      minv = Math.log(1);
      maxv = Math.log(endDate + Math.abs(fristDate) + 1);
    }

    const scale = (maxv - minv) / (endDate - fristDate);
    return [minv, maxv, scale];
  }

  /**
   *  Exponentialformar
   *
   * @private
   * @function
  */
  exponential(min, max, val) {
    const [minv, , scale] = this.formatValueType(min, max);

    if (min > 0) {
      return Math.round((Math.log(val) - minv) / scale + min);
    }
    return Math.round((Math.log((val - min + 1)) - minv) / scale + min);
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
  * Obtiene la ayuda del control
  * Su construcción es similar a la del plugin, por ello se usa la misma plantilla
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
    super.destroy();
    if (['absolute', 'relative'].includes(this.timelineType)) {
      this.removeLayers();
    } else {
      this.removeTimelineLayers();
    }
    [this.impl_, this.panel_, this.map_, this.layers, this.radius] = [
      null, null, null, null, null,
    ];
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
