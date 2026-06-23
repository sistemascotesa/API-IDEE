/**
 * @module IDEE/impl/control/ScaleLine
 */
import OLControlScaleLine from 'ol/control/ScaleLine';
// import ProjUnits from 'ol/proj/Units';
import { getPointResolution, METERS_PER_UNIT } from 'ol/proj';
import { assert } from 'ol/asserts';

/**
 * @typedef {Object} module:IDEE/impl/control/ScaleLine~Options
 * @api
 * @property {String} [className='ol-scale-line'] Nombre de la clase CSS.
 * @property {Number} [minWidth=64] Ancho mínimo en píxeles.
 * @property {Function} [render] Función de renderizado personalizada.
 * @property {HTMLElement|String} [target] Elemento objetivo donde se renderiza el control.
 * @property {String} [units='metric'] Unidades de medida:
 * 'degrees', 'imperial', 'nautical', 'metric', 'us'.
 * @property {Boolean} [bar=false] Si es verdadero representa barras de escala
 * en lugar de una línea.
 * @property {Number} [steps=4] Número de pasos para la barra de escala.
 * @property {Boolean} [text=false] Si es verdadero representa texto encima de la barra.
 * @property {Number} [dpi] DPI del dispositivo de salida.
 *
 * @see {@link https://openlayers.org/en/latest/apidoc/module-ol_control_ScaleLine-ScaleLine.html|OpenLayers ScaleLine}
 */

/**
 * @type {string}
 */
const UNITS_PROP = 'units';

const Units = {
  DEGREES: 'degrees',
  IMPERIAL: 'imperial',
  NAUTICAL: 'nautical',
  METRIC: 'metric',
  US: 'us',
};

const LEADING_DIGITS = [1, 2, 5];

/**
 * @classdesc
 * Implementación del control de escala gráfica que extiende
 * {@link https://openlayers.org/en/latest/apidoc/module-ol_control_ScaleLine-ScaleLine.html|ol.control.ScaleLine}.
 * Muestra la escala del mapa en la unidad de medida especificada.
 *
 * @api
 * @extends {ol.control.ScaleLine}
 */
class ScaleLine extends OLControlScaleLine {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {module:IDEE/impl/control/ScaleLine~Options} options Opciones del control.
   * @api
   */
  constructor(options) {
    super(options);

    this.facadeMap_ = null;

    this.keyEvent_ = null;
  }

  /**
   * Este método añade el control al mapa.
   * (Como este no extiende directamente de open layers debemos tener en cuenta )
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @param {HTMLElement} template Plantilla del control.
   * @api stable
   */
  addTo(map, template) {
    this.facadeMap_ = map;
    this.panel = template;
    this.removeChangeListener(UNITS_PROP, this.handleUnitsChanged);
    this.keyEvent_ = this.addChangeListener(UNITS_PROP, this.handleUnitsChanged);
    map.getMapImpl().addControl(this);
  }

  /**
   * Devuelve la vista de implementación
   *
   * @public
   * @function
   * @return {HTMLElement} vista de implementación
   * @api stable
   */
  getView() {
    return this.element;
  }

  /**
   * Devuelve los elementos del control.
   *
   * @public
   * @function
   * @returns {HTMLElement} Retorna los elementos del control.
   * @api stable
   * @export
   */
  getElement() {
    return this.element;
  }

  /**
   * Esta función destruye este control, limpiando el HTML y anula el registro de todos los eventos.
   *
   * @public
   * @function
   * @api stable
   * @export
   */
  destroy() {
    this.facadeMap_.getMapImpl().removeControl(this);
    this.facadeMap_ = null;
  }

  /**
   * Actualiza los elementos del control.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @api stable
   */
  handleUnitsChanged_() {
    this.updateElement_();
  }

  /**
   * Actualiza los elementos del control.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @public
   * @function
   * @api stable
   */
  updateElement_() {
    const viewState = this.viewState_;

    if (!viewState) {
      if (this.renderedVisible_) {
        this.element.style.display = 'none';
        this.renderedVisible_ = false;
      }
      return;
    }

    const center = viewState.center;
    const projection = viewState.projection;
    const units = this.getUnits();
    const pointResolutionUnits = units === Units.DEGREES ? 'degrees' : 'm';
    let pointResolution = getPointResolution(
      projection,
      viewState.resolution,
      center,
      pointResolutionUnits,
    );
    if (projection.getUnits() !== 'degrees' && projection.getMetersPerUnit()
      && pointResolutionUnits === 'm') {
      pointResolution *= projection.getMetersPerUnit();
    }

    if (projection.getUnits() === 'd') {
      pointResolution /= 120000;
    }
    let nominalCount = this.minWidth_ * pointResolution;
    let suffix = '';
    if (units === Units.DEGREES) {
      const metersPerDegree = METERS_PER_UNIT.degrees;
      if (projection.getUnits() === 'degrees') {
        nominalCount *= metersPerDegree;
      } else {
        pointResolution /= metersPerDegree;
      }
      if (nominalCount < metersPerDegree / 60) {
        suffix = '\u2033'; // seconds
        pointResolution *= 3600;
      } else if (nominalCount < metersPerDegree) {
        suffix = '\u2032'; // minutessep
        pointResolution *= 60;
      } else {
        suffix = '\u00b0'; // degrees
      }
    } else if (units === Units.IMPERIAL) {
      if (nominalCount < 0.9144) {
        suffix = 'in';
        pointResolution /= 0.0254;
      } else if (nominalCount < 1609.344) {
        suffix = 'ft';
        pointResolution /= 0.3048;
      } else {
        suffix = 'mi';
        pointResolution /= 1609.344;
      }
    } else if (units === Units.NAUTICAL) {
      pointResolution /= 1852;
      suffix = 'nm';
    } else if (units === Units.METRIC) {
      if (nominalCount < 0.001) {
        suffix = 'μm';
        pointResolution *= 1000000;
      } else if (nominalCount < 1) {
        suffix = 'mm';
        pointResolution *= 1000;
      } else if (nominalCount < 1000) {
        suffix = 'm';
      } else {
        suffix = 'km';
        pointResolution /= 1000;
      }
    } else if (units === Units.US) {
      if (nominalCount < 0.9144) {
        suffix = 'in';
        pointResolution *= 39.37;
      } else if (nominalCount < 1609.344) {
        suffix = 'ft';
        pointResolution /= 0.30480061;
      } else {
        suffix = 'mi';
        pointResolution /= 1609.3472;
      }
    } else {
      assert(false, 33); // Invalid units
    }

    let i = 3 * Math.floor(Math.log(this.minWidth_ * pointResolution) / Math.log(10));
    let count;
    let width;
    const flag = true;
    while (flag) {
      count = LEADING_DIGITS[((i % 3) + 3) % 3] * (10 ** (Math.floor(i / 3)));
      width = Math.round(count / pointResolution);
      if (Number.isNaN(width)) {
        this.element.style.display = 'none';
        this.renderedVisible_ = false;
        return;
      }
      if (width >= this.minWidth_) {
        break;
      }
      i += 1;
    }

    const html = this.scaleBar_
      ? this.createScaleBar(width, count, suffix)
      : count.toString().concat(' ').concat(suffix);
    if (this.renderedHTML_ !== html) {
      this.innerElement_.innerHTML = html;
      this.renderedHTML_ = html;
    }

    if (this.renderedWidth_ !== width) {
      this.innerElement_.style.width = width.toString().concat('px');
      this.renderedWidth_ = width;
    }

    if (!this.renderedVisible_) {
      this.element.style.display = '';
      this.renderedVisible_ = true;
    }
  }
}

export default ScaleLine;
