/**
 * @module IDEE/impl/control/Mouse
 */

import { getValue } from '../../../facade/js/i18n/language';
import WCSLoaderManager from './wcsloadermanager';

const COVERAGE_NAME = 'OGCApiCoverage';
/**
 * @classdesc
 * @api
 */
class Mouse extends ol.control.MousePosition {
  /**
   * @classdesc
   * Main constructor of the class. Creates a WMC selector
   * control
   *
   * @constructor
   * @extends {ol.control.Control}
   * @param {Object} vendorOptions vendor options for the base library
   * @api
   */
  constructor(vendorOptions) {
    super(vendorOptions);

    /**
     * Coordinate format given in OpenLayers format.
     * @private
     * @type {Object}
     */
    this.coordinateFormat = vendorOptions.coordinateFormat;

    this.label = vendorOptions.label;

    this.mapProjection_ = vendorOptions.projection;

    this.target = vendorOptions.target;

    this.geoDecimalDigits = vendorOptions.geoDecimalDigits;

    this.utmDecimalDigits = vendorOptions.utmDecimalDigits;

    this.activeZ = vendorOptions.activeZ;

    this.order = vendorOptions.order;

    this.mode_ = vendorOptions.mode;

    this.coveragePrecissions = vendorOptions.coveragePrecissions;
  }

  initLoaderManager(map) {
    this.facadeMap_ = map;
    if (this.activeZ) {
      if (this.mode_ === 'wcs') {
        this.wcsloadermanager = new WCSLoaderManager();
        const layers = [
          {
            url: 'https://servicios.idee.es/wcs-inspire/mdt',
            options: {
              coverage: 'Elevacion4258_200',
              crs: 'EPSG:4326',
              format: 'ArcGrid',
              height: 500,
              interpolationMethod: 'bilinear',
              service: 'WCS',
              version: '1.0.0',
              width: 500,
            },
          },
          {
            url: 'https://servicios.idee.es/wcs-inspire/mdt',
            options: {
              coverage: 'Elevacion4258_25',
              crs: 'EPSG:4326',
              format: 'ArcGrid',
              height: 500,
              interpolationMethod: 'bilinear',
              service: 'WCS',
              version: '1.0.0',
              width: 500,
            },
          },
          {
            url: 'https://servicios.idee.es/wcs-inspire/mdt',
            options: {
              coverage: 'Elevacion4258_500',
              crs: 'EPSG:4326',
              format: 'ArcGrid',
              height: 500,
              interpolationMethod: 'bilinear',
              service: 'WCS',
              version: '1.0.0',
              width: 500,
            },
          },
          {
            url: 'https://servicios.idee.es/wcs-inspire/mdt',
            options: {
              coverage: 'Elevacion4258_5',
              crs: 'EPSG:4326',
              format: 'ArcGrid',
              height: 500,
              interpolationMethod: 'bilinear',
              service: 'WCS',
              version: '1.0.0',
              width: 500,
            },
          },
        ];

        this.wcsloadermanager.addLayers(layers);

        this.onMoveEndWCS_ = () => this.updateDataGrid(map);
        map.getMapImpl().on('moveend', this.onMoveEndWCS_);
      } else if (this.mode_ === 'ogcapicoverage') {
        this.updateOGCApiCoverage(map);

        this.onMoveEndOGC_ = () => this.updateOGCApiCoverage(map);
        map.getMapImpl().on('moveend', this.onMoveEndOGC_);
      }
    }
  }

  updateDataGrid(map) {
    const innerMap = this.facadeMap_ !== undefined ? this.facadeMap_ : map;
    const bbox = innerMap.getBbox();
    let extent = [bbox.x.min, bbox.y.min, bbox.x.max, bbox.y.max];
    extent = ol.proj.transformExtent(extent, innerMap.getProjection().code, 'EPSG:4326');
    this.wcsloadermanager.updateDataGrid(extent, 'EPSG:4326');
  }

  updateOGCApiCoverage(map) {
    const layers = map.getLayers();
    const oldLayer = layers ? layers.find((l) => l.name === COVERAGE_NAME) : null;
    if (oldLayer) {
      map.removeLayers([oldLayer]);
    }

    const urlCoverage = this.getUrlCoverageByZoom(map.getZoom());

    // Si la URL es vacía (zoom fuera de rango), Se aborta.
    if (!urlCoverage || urlCoverage === '') {
      return;
    }

    let bbox = map.getBbox();
    bbox = this.transformExtent(bbox, map.getProjection().code, 'EPSG:4326');
    const bboxStr = `${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}`;

    const coverage = new IDEE.layer.GeoTIFF({
      blob: `${urlCoverage}?f=COG&lang=es&bbox-crs=4326&bbox=${bboxStr}`,
      name: COVERAGE_NAME,
      legend: COVERAGE_NAME,
      normalize: false,
      displayInLayerSwitcher: false,
    }, {
      convertToRGB: false,
      bands: [1],
      opacity: 0, // Invisible pero consultable
    });

    coverage.setZIndex(-9999);
    map.addLayers(coverage);
  }

  getUrlCoverageByZoom(mapZoom) {
    // Redondear el zoom para evitar huecos
    const zoom = Math.round(mapZoom);

    if (!this.coveragePrecissions || !Array.isArray(this.coveragePrecissions)) {
      return '';
    }

    const coverage = this.coveragePrecissions.find((o) => {
      // Definir límites seguros
      const min = (o.minzoom !== undefined && o.minzoom !== null) ? o.minzoom : 0;
      const max = (o.maxzoom !== undefined && o.maxzoom !== null) ? o.maxzoom : 99;

      return zoom >= min && zoom <= max;
    });

    return coverage ? coverage.url : '';
  }

  transformExtent(bbox, orig, dest) {
    const transformFn = ol.proj.getTransform(orig, dest);
    const min = transformFn([bbox.x.min, bbox.y.min]);
    const max = transformFn([bbox.x.max, bbox.y.max]);
    return [min[0], min[1], max[0], max[1]];
  }

  /**
   * function remove the event 'click'
   *
   * @public
   * @function
   * @api
   */
  getElement() {
    return this.element;
  }

  /**
   * This function destroys this control, cleaning the HTML
   * and unregistering all events
   *
   * @public
   * @function
   * @api
   * @export
   */
  destroy() {
    const olMap = this.facadeMap_.getMapImpl();
    if (olMap) {
      if (this.onMoveEndWCS_) {
        olMap.un('moveend', this.onMoveEndWCS_);
        this.onMoveEndWCS_ = null;
      }
      if (this.onMoveEndOGC_) {
        olMap.un('moveend', this.onMoveEndOGC_);
        this.onMoveEndOGC_ = null;
      }
    }

    if (this.wcsloadermanager) {
      this.wcsloadermanager = null;
    }

    const coverage = this.facadeMap_.getLayers()
      .find((l) => l.name === COVERAGE_NAME);
    this.facadeMap_.removeLayers(coverage);
    this.facadeMap_.getMapImpl().removeControl(this);
    this.facadeMap_ = null;
  }

  /**
   * @param {Event} event Browser event.
   * @protected
   */
  handleMouseMove(event) {
    const map = this.getMap();
    this.lastMouseMovePixel_ = map.getEventPixel(event);
    this.updateHTML_(this.lastMouseMovePixel_);
  }

  /**
   * @param {Event} event Browser event.
   * @protected
   */
  handleMouseOut(event) {
    this.updateHTML_(this.lastMouseMovePixel_);
    this.lastMouseMovePixel_ = null;
  }

  /**
   * @private
   * @function
   */
  updateHTML_(pixel) {
    let html = '';
    const projection = this.getProjection();
    if (pixel && this.mapProjection_) {
      if (!this.transform_) {
        if (projection) {
          this.transform_ = ol.proj.getTransform(this.mapProjection_, projection);
        } else {
          this.transform_ = ol.proj.identityTransform;
        }
      }

      const map = this.getMap();
      const coordinate = map.getCoordinateFromPixel(pixel);
      if (coordinate) {
        this.transform_(coordinate, coordinate);
        html = `${this.coordinateFormat(coordinate)}`.replace('.', ',').replace('.', ',').replace(', ', '&nbsp;&nbsp;&nbsp;');
        if (this.activeZ) {
          const value = this.mode_ === 'wcs' ? this.getZByWCS(pixel) : this.getZByTiff(pixel);
          if (!Number.isNaN(value) && value > 0) {
            html += `&nbsp;&nbsp;&nbsp;${value}`;
          }
        }
      }

      html += ` | <b role="button" tabindex="${this.order}" aria-label="${getValue('accessibility.src')}" class="m-mousesrs-pointer">${this.label}</b>`;
    }

    if (!this.renderedHTML_ || html !== this.renderedHTML_) {
      this.element.innerHTML = html;
      this.renderedHTML_ = html;
    }
  }

  getZByWCS(pixel) {
    if (!this.facadeMap_ || !this.wcsloadermanager) {
      return 0;
    }

    const orgCoord = this.getMap().getCoordinateFromPixel(pixel);
    const tCoord = ol.proj.transform(orgCoord, this.facadeMap_.getProjection().code, 'EPSG:4326');
    const value = Math.round(this.wcsloadermanager.getValue(tCoord, 'EPSG:4326'));
    return value;
  }

  getZByTiff(pixel) {
    try {
      if (!this.facadeMap_) return 0;

      const layers = this.facadeMap_.getLayers();
      const coverageLayer = layers ? layers.find((l) => l.name === COVERAGE_NAME) : null;

      if (!coverageLayer) return 0;

      // Implementación de la capa
      const layerImpl = coverageLayer.getImpl().getLayer();

      const value = layerImpl ? layerImpl.getData(pixel) : null;

      if (!value || !Array.isArray(value)) {
        return 0;
      }

      return Math.round(value[0]);
    } catch (err) {
      // Bloqueo silencioso
      return 0;
    }
  }
}

export default Mouse;
