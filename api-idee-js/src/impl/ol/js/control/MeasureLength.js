import * as olProj from 'ol/proj';
import MeasureBase from './MeasureBase';
import FacadeMeasure from '../../../../facade/js/control/Measure';
import FacadeMeasureArea from '../../../../facade/js/control/MeasureArea';
import { HELP_KEEP_MESSAGE } from '../../../../facade/js/control/MeasureLength';

const WGS84 = 'EPSG:4326';
const { measurements } = require('../../../../geoprocesses');

/**
 * @classdesc
 * Main constructor of the class. Creates a MeasureLength
 * control
 *
 * @constructor
 * @extends {MeasureBase}
 * @api stable
 */
export default class MeasureLength extends MeasureBase {
  constructor() {
    super('LineString');

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
  }

  /**
   * This function add tooltip with measure distance
   * @public
   * @param {ol.geom.SimpleGeometry} geometry - Object geometry
   * @return {string} output - Indicates the measure distance
   * @api stable
   */
  formatGeometry(geometry) {
    let length = 0;
    const coordinates = geometry.getCoordinates();

    for (let i = 0; i < coordinates.length - 1; i += 1) {
      const a = coordinates[i];
      const b = coordinates[i + 1];

      if (a.toString() !== b.toString()) {
        const aWGS84 = olProj.transform(a, this.facadeMap_.getProjection().code, WGS84);
        const bWGS84 = olProj.transform(b, this.facadeMap_.getProjection().code, WGS84);

        length += measurements.calculateDistance(aWGS84[1], aWGS84[0], bWGS84[1], bWGS84[0]);
      }
    }

    let output;
    if (length > 1000) {
      output = `${((length / 1000).toFixed(2)).replace('.', ',')} km`;
    } else {
      output = `${(length.toFixed(2)).replace('.', ',')} m`;
    }
    return output;
  }

  /**
   * This function returns coordinates to tooltip
   * @public
   * @param {ol.geom.SimpleGeometry} geometry - Object geometry
   * @return {array} coordinates to tooltip
   * @api stable
   */
  getTooltipCoordinate(geometry) {
    return geometry.getLastCoordinate();
  }

  activate() {
    const measureArea = this.facadeMap_.getControls().find((control) => {
      return (control instanceof FacadeMeasureArea);
    });
    if (measureArea) {
      measureArea.deactivate();
    }
    super.activate();
    document.querySelector('.m-control.m-measurelength-container').classList.add('activated');
  }
}
