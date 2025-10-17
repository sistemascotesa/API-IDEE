/**
 * @module IDEE/control/XYLocatorControl
 */

import template from 'templates/xylocator';
import XYLocatorImpl from 'impl/xylocatorcontrol';
import { getValue } from './i18n/language';

const ID_CONTENEDOR_LOCATOR = '#div-contenedor-locator';
const ID_XYLOCATOR = '#m-locator-xylocator';
const ID_PANEL_XYLOCATOR = '#m-xylocator-panel';
const ID_BUTTON_LIMPIAR = '#m-xylocator-limpiar';
const ID_BUTTON_LOCATE = '#m-xylocator-loc';
const ID_SELECT_SRS = '#m-xylocator-srs';
const ID_UTM_X = '#UTM-X';
const ID_UTM_Y = '#UTM-Y';
const ID_LON = '#LON';
const ID_LAT = '#LAT';
const ID_LONHH = '#LONHH';
const ID_LONMM = '#LONMM';
const ID_LONSS = '#LONSS';
const ID_LATHH = '#LATHH';
const ID_LATMM = '#LATMM';
const ID_LATSS = '#LATSS';
const ID_M_XYLOCATOR_UTM = '#m-xylocator-utm';
const ID_M_XYLOCATOR_DMS = '#m-xylocator-dms';
const ID_M_XYLOCATOR_LATLON = '#m-xylocator-latlon';

export default class XYLocatorControl extends IDEE.Control {
  /**
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api
   */
  constructor(map, zoom, pointStyle, options, positionPlugin) {
    if (IDEE.utils.isUndefined(XYLocatorImpl) || (IDEE.utils.isObject(XYLocatorImpl)
      && IDEE.utils.isNullOrEmpty(Object.keys(XYLocatorImpl)))) {
      IDEE.exception(getValue('exception.impl_xylocator'));
    }
    const impl = new XYLocatorImpl(map);
    super(impl, 'XYLocatorImpl');

    /**
     * Projections options
     *
     * @private
     * @type {Array<object>} - {code: ..., title: ..., units: m | d}
     */
    this.projections = options.projections;

    /**
     * Zoom
     *
     * @private
     * @type {number}
     */
    this.zoom = zoom;

    /**
     * Type of icon to display when a punctual type result is found
     * @private
     * @type {string}
     */
    this.pointStyle = pointStyle;

    /**
     * Help
     *
     * @private
     * @type {string}
     */
    this.help = options.help;

    /**
     * Map
     */
    this.map = map;

    /**
     * Position plugin
     * @private
     * @type {String}
     */
    this.positionPlugin = positionPlugin;
  }

  /**
   * This function active control
   *
   * @public
   * @function
   * @param {Node} html
   * @api
   */
  active(html) {
    this.html_ = html;
    const xylocatoractive = this.html_.querySelector(ID_XYLOCATOR).classList.contains('activated');
    this.deactive();
    if (!xylocatoractive) {
      this.html_.querySelector(ID_XYLOCATOR).classList.add('activated');
      const panel = IDEE.template.compileSync(template, {
        vars: {
          hasHelp: !IDEE.utils.isUndefined(this.help) && IDEE.utils.isUrl(this.help),
          helpUrl: this.help,
          projections: this.projections,
          translations: {
            srs: getValue('srs'),
            longitude: getValue('longitude'),
            latitude: getValue('latitude'),
            locate: getValue('locate'),
            clean: getValue('clean'),
            east: getValue('east'),
            west: getValue('west'),
            north: getValue('north'),
            south: getValue('south'),
            geographic: getValue('geographic'),
            zone: getValue('zone'),
            dms: getValue('dms'),
            dd: getValue('dd'),
          },
        },
      });
      const contenedorLocator = document.querySelector(ID_CONTENEDOR_LOCATOR);
      if (contenedorLocator) {
        contenedorLocator.appendChild(panel);
      }
      this.activeDefaultLabel();
      this.html_.querySelector(ID_BUTTON_LIMPIAR).addEventListener('click', () => this.clearResults());
      this.html_.querySelector(ID_SELECT_SRS).addEventListener('change', (evt) => this.manageInputs_(evt));
      this.html_.querySelector(ID_BUTTON_LOCATE).addEventListener('click', (evt) => this.calculate_());
    }
  }

  /**
   * This function deactive control
   *
   * @public
   * @function
   * @api
   */
  deactive() {
    this.html_.querySelector(ID_XYLOCATOR).classList.remove('activated');
    const panel = this.html_.querySelector(ID_PANEL_XYLOCATOR);
    if (panel) {
      this.clearResults();
      document.querySelector(ID_CONTENEDOR_LOCATOR).removeChild(panel);
    }
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {IDEE.Control} control to compare
   * @api
   */
  equals(control) {
    return control instanceof XYLocatorControl;
  }

  /**
   * This function clears input values
   *
   * @private
   * @function
   */
  clearResults() {
    this.html_.querySelector(ID_UTM_X).value = '';
    this.html_.querySelector(ID_UTM_Y).value = '';
    this.html_.querySelector(ID_LON).value = '';
    this.html_.querySelector(ID_LAT).value = '';
    this.html_.querySelector(ID_LONHH).value = 0;
    this.html_.querySelector(ID_LONMM).value = 0;
    this.html_.querySelector(ID_LONSS).value = 0;
    this.html_.querySelector(ID_LATHH).value = 0;
    this.html_.querySelector(ID_LATMM).value = 0;
    this.html_.querySelector(ID_LATSS).value = 0;
    this.map.removeLayers(this.coordinatesLayer);
  }

  /**
   * This function sets the active section for the XYLocator control
   * @param {string} section - The section to activate
   */
  setActiveSection(section) {
    const sections = [
      ID_M_XYLOCATOR_UTM,
      ID_M_XYLOCATOR_DMS,
      ID_M_XYLOCATOR_LATLON,
    ];
    sections.forEach((sel) => {
      const el = this.html_.querySelector(sel);
      if (el) {
        el.classList.remove('m-xylocator-active');
        el.classList.add('m-xylocator-inactive');
      }
    });
    const activeEl = this.html_.querySelector(section);
    if (activeEl) {
      activeEl.classList.remove('m-xylocator-inactive');
      activeEl.classList.add('m-xylocator-active');
    }
  }

  /**
   * This function activates default label depending on SRS
   *
   * @private
   * @function
   */
  activeDefaultLabel() {
    const selectTarget = this.html_.querySelector(ID_SELECT_SRS);
    const selectedOption = selectTarget.options[selectTarget.selectedIndex];
    const units = selectedOption.getAttribute('data-units');
    if (units === 'd') {
      this.setActiveSection(ID_M_XYLOCATOR_LATLON);
    } else if (units === 'dms') {
      this.setActiveSection(ID_M_XYLOCATOR_DMS);
    } else {
      this.setActiveSection(ID_M_XYLOCATOR_UTM);
    }
  }

  /**
   * This function changes input label depending on SRS
   *
   * @private
   * @function
   * @param {DOMEvent} evt - event
   */
  manageInputs_(evt) {
    const selectTarget = evt.target;
    const selectedOption = selectTarget.options[selectTarget.selectedIndex];
    const units = selectedOption.getAttribute('data-units');
    if (units === 'd') {
      this.setActiveSection(ID_M_XYLOCATOR_LATLON);
    } else if (units === 'dms') {
      this.setActiveSection(ID_M_XYLOCATOR_DMS);
    } else {
      this.setActiveSection(ID_M_XYLOCATOR_UTM);
    }
  }

  /**
   * This function transforms coordinates to map SRS
   *
   * @public
   * @function
   * @api
   */
  calculate_() {
    try {
      const selectTarget = this.html_.querySelector(ID_SELECT_SRS);
      const selectedOption = selectTarget.options[selectTarget.selectedIndex];
      const origin = selectedOption.value;
      const unit = selectedOption.getAttribute('data-units');
      let x = -1;
      let y = -1;
      let selectors;
      if (unit !== 'dms') {
        selectors = unit === 'd' ? [ID_LON, ID_LAT] : [ID_UTM_X, ID_UTM_Y];
        const xString = this.html_.querySelector(selectors[0]).value.replace(',', '.');
        const yString = this.html_.querySelector(selectors[1]).value.replace(',', '.');
        x = parseFloat(xString);
        y = parseFloat(yString);
      } else {
        const hhLon = this.html_.querySelector(ID_LONHH).value;
        const mmLon = this.html_.querySelector(ID_LONMM).value;
        const ssLon = this.html_.querySelector(ID_LONSS).value;
        const dirLon = this.html_.querySelector('input[name="LONDIR"]:checked').value;
        const hhLat = this.html_.querySelector(ID_LATHH).value;
        const mmLat = this.html_.querySelector(ID_LATMM).value;
        const ssLat = this.html_.querySelector(ID_LATSS).value;
        const dirLat = this.html_.querySelector('input[name="LATDIR"]:checked').value;

        if (this.checkDegreeValue_(mmLon) && this.checkDegreeValue_(ssLon)
          && this.checkDegreeValue_(mmLat)
          && this.checkDegreeValue_(ssLat) && parseFloat(hhLon) >= 0
          && parseFloat(hhLon) <= 180 && parseFloat(hhLat) >= 0 && parseFloat(hhLat) <= 180) {
          x = parseFloat(hhLon) + (parseFloat(mmLon) / 60) + (parseFloat(ssLon) / 3600);
          y = parseFloat(hhLat) + (parseFloat(mmLat) / 60) + (parseFloat(ssLat) / 3600);

          if (dirLon !== 'east' && x !== 0) {
            x = -x;
          }

          if (dirLat !== 'north' && y !== 0) {
            y = -y;
          }
        } else {
          IDEE.dialog.error(getValue('exception.wrong_values'), 'Error');
        }
      }
      try {
        const coordinatesTransform = this.getImpl().reproject(origin, [x, y]);
        this.locator_(coordinatesTransform);
      } catch (ex) {
        IDEE.dialog.error(getValue('exception.transforming'), 'Error');
      }
    } catch (ex) {
      IDEE.dialog.error(getValue('exception.wrong_coords'), 'Error');
      throw ex;
    }
  }

  /**
   * This function centers the map on given point
   *
   * @public
   * @function
   * @param coords - coordinates writen by user
   * @api
   */
  locator_(coords) {
    const x = parseFloat(coords[0]);
    const y = parseFloat(coords[1]);
    this.map.removeLayers(this.coordinatesLayer);
    if (!Number.isNaN(x) && !Number.isNaN(y)) {
      this.map.setCenter(`${x},${y}*false`);
      this.map.setZoom(this.zoom);

      this.fire('xylocator:locationCentered', [{
        zoom: this.zoom,
        center: [x, y],
      }]);

      this.coordinatesLayer = new IDEE.layer.Vector({
        name: 'coordinatexylocator',
      }, { displayInLayerSwitcher: false });

      const feature = new IDEE.Feature('localizacion', {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [x, y],
        },
      });

      this.coordinatesLayer.addFeatures([feature]);
      this.createGeometryStyles();
      this.map.addLayers(this.coordinatesLayer);
    } else {
      IDEE.dialog.error(getValue('exception.wrong_coords'), 'Error');
    }
  }

  /**
   * This function creates the style of the geometry according
   * to the user parameter
   *
   * @function
   * @public
   * @api
   */
  createGeometryStyles() {
    let style = {
      radius: 8,
      fill: {
        color: '#f00',
        opacity: 0.5,
      },
      stroke: {
        color: '#f00',
        opacity: 1,
        width: 3,
      },
    };

    if (this.pointStyle === 'pinAzul') {
      style = {
        radius: 5,
        icon: {
          src: `${IDEE.config.STATIC_RESOURCES_URL}/Simbologia/svg/marcadores/marker.svg`,
          scale: 1.4,
          fill: {
            color: '#71a7d3',
          },
          stroke: {
            width: 30,
            color: 'white',
          },
          anchor: [0.5, 1],
        },
      };
    } else if (this.pointStyle === 'pinRojo') {
      style = {
        radius: 5,
        icon: {
          src: `${IDEE.config.STATIC_RESOURCES_URL}/Simbologia/svg/marcadores/pinign.svg`,
        },
      };
    } else if (this.pointStyle === 'pinMorado') {
      style = {
        radius: 5,
        icon: {
          src: `${IDEE.config.STATIC_RESOURCES_URL}/Simbologia/svg/marcadores/m-pin-24.svg`,
        },
      };
    }
    this.coordinatesLayer.setStyle(new IDEE.style.Point(style));
  }

  /**
   * This function checks degree value
   *
   * @public
   * @function
   * @param {String} num
   * @returns {boolean} True if value is greater than 60
   * @api
   */
  checkDegreeValue_(num) {
    return parseFloat(num) >= 0 && parseFloat(num) < 60;
  }

  /**
   * This function destroys this control
   *
   * @public
   * @function
   * @api
   */
  destroy() {
    this.map.removeLayers(this.coordinatesLayer);
  }
}
