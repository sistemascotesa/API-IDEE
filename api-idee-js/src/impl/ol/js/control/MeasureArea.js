/**
 * @module IDEE/impl/control/MeasureArea
 */
import FacadeMeasure from 'IDEE/control/Measure';
import FacadeMeasureLength from 'IDEE/control/MeasureLength';
import { HELP_KEEP_MESSAGE } from 'IDEE/control/MeasureArea';
import * as olSphere from 'ol/sphere';
import Measure from './Measure';

/**
 * @classdesc
 * Main constructor of the class. Creates a MeasureArea
 * control
 *
 * @constructor
 * @extends {Measure}
 * @api stable
 */
class MeasureArea extends Measure {
  constructor() {
    super('Polygon');
    /**
     * Help message
     * @private
     * @type {string}
     */
    this.helpMsg_ = FacadeMeasure.HELP_MESSAGE;

    /**
     * Help message
     * @private
     * @type {string}
     */
    this.helpMsgContinue_ = HELP_KEEP_MESSAGE;
    document.addEventListener('keydown', (evt) => {
      if (evt.key === 'Escape') {
        const elem = document.querySelector('.m-panel.m-panel-measurebar.opened');
        if (elem !== null) {
          elem.querySelector('button.m-panel-btn').click();
        }
      }
    });
  }

  /**
   * This function add tooltip with extent of the area
   * @public
   * @param {ol.geom.SimpleGeometry} geometry - Object geometry
   * @return {string} output - Indicate the extent of the area
   * @api stable
   */
  formatGeometry(geometry) {
    let area = null;
    const projection = this.facadeMap_.getProjection();
    area = olSphere.getArea(geometry, { projection: projection.code });
    let output;
    if (area <= 10000) {
      output = `${this.formatNumber(Math.round(area * 100) / 100)} m<sup>2</sup>`;
    } else if (area > 10000 && area <= 1000000) {
      output = `${this.formatNumber((Math.round((area / 10000) * 10000) / 10000))} ha`;
    } else if (area > 1000000) {
      output = `${this.formatNumber((Math.round((area / 1000000) * 10000) / 10000))} km<sup>2</sup>`;
    }

    return output;
  }

  /**
   * This function returns coordinates to tooltip
   * @public
   * @param {ol.geom.Geometry} geometry - Object geometry
   * @return {array} coordinates to tooltip
   * @api stable
   */
  getTooltipCoordinate(geometry) {
    return geometry.getInteriorPoint().getCoordinates();
  }

  activate() {
    const measureLength = this.facadeMap_.getControls().find((control) => {
      return (control instanceof FacadeMeasureLength);
    });

    if (measureLength) {
      measureLength.deactivate();
    }

    super.activate();
    document.querySelector('.m-control.m-measurearea-container').classList.add('activated');
  }

  /* eslint-disable newline-per-chained-call */
  formatNumber(number) {
    return `${number}`.replace(/\d(?=(\d{3})+\.)/g, '$&*').split('.').join(',').split('*').join('.');
  }
}

export default MeasureArea;
