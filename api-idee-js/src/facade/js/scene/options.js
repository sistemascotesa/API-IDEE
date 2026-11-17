/**
 * Opciones de visualización independientes del motor: elevación de las geometrías y
 * equivalencia entre zoom y altura de cámara. Funciones puras.
 *
 * @module IDEE/scene/options
 */
import Exception from '../exception/exception';
import { getValue } from '../i18n/language';

/**
 * Modos de tratamiento de la tercera coordenada.
 * - auto: 2D pegado al terreno y 3D con su cota (comportamiento por defecto).
 * - clamp: siempre pegado al terreno.
 * - absolute: la cota como altura sobre el elipsoide.
 * - relative: la cota sumada a la altura del terreno.
 * @const
 * @type {Array<String>}
 */
export const ELEVATION_MODES = Object.freeze(['auto', 'clamp', 'absolute', 'relative']);

/**
 * Sistemas de alturas admitidos para la tercera coordenada.
 * @const
 * @type {Array<String>}
 */
export const HEIGHT_SYSTEMS = Object.freeze(['ellipsoid', 'geoid']);

/**
 * Elevación por defecto.
 * @const
 * @type {{mode: String, offset: Number, heightSystem: String}}
 */
export const DEFAULT_ELEVATION = Object.freeze({ mode: 'auto', offset: 0, heightSystem: 'ellipsoid' });

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

/**
 * Valida y completa las opciones de elevación.
 * @param {Object|String|undefined} elevation Opciones ({ mode, offset, heightSystem }) o
 * solo el modo.
 * @returns {{mode: String, offset: Number, heightSystem: String}} Opciones completas.
 */
export const normalizeElevation = (elevation) => {
  if (elevation === undefined || elevation === null) {
    return { ...DEFAULT_ELEVATION };
  }
  const options = typeof elevation === 'string' ? { mode: elevation } : elevation;
  if (!isRecord(options)) {
    Exception(getValue('exception').elevation_options);
  }
  const mode = options.mode ?? DEFAULT_ELEVATION.mode;
  if (!ELEVATION_MODES.includes(mode)) {
    Exception(getValue('exception').elevation_mode);
  }
  const offset = options.offset ?? DEFAULT_ELEVATION.offset;
  if (typeof offset !== 'number' || !Number.isFinite(offset)) {
    Exception(getValue('exception').elevation_offset);
  }
  const heightSystem = options.heightSystem ?? DEFAULT_ELEVATION.heightSystem;
  if (!HEIGHT_SYSTEMS.includes(heightSystem)) {
    Exception(getValue('exception').elevation_height_system);
  }
  return { mode, offset, heightSystem };
};

/**
 * Combina la elevación de la capa con la del estilo: cada valor definido en el estilo
 * prevalece.
 * @param {Object|String|undefined} layerElevation Elevación de la capa.
 * @param {Object|String|undefined} styleElevation Elevación del estilo.
 * @returns {{mode: String, offset: Number, heightSystem: String}} Opciones completas.
 */
export const mergeElevation = (layerElevation, styleElevation) => {
  const base = normalizeElevation(layerElevation);
  if (styleElevation === undefined || styleElevation === null) {
    return base;
  }
  const style = typeof styleElevation === 'string' ? { mode: styleElevation } : styleElevation;
  if (!isRecord(style)) {
    Exception(getValue('exception').elevation_options);
  }
  const defined = Object.fromEntries(Object.entries(style)
    .filter(([key, value]) => value !== undefined && key in DEFAULT_ELEVATION));
  return normalizeElevation({ ...base, ...defined });
};

/**
 * Indica si un zoom está dentro del rango de una capa, con la regla de OpenLayers.
 * @param {Number} zoom Zoom de la vista.
 * @param {Number} minZoom Zoom mínimo (-Infinity si no hay).
 * @param {Number} maxZoom Zoom máximo (Infinity si no hay).
 * @returns {Boolean} Verdadero si zoom > minZoom y zoom <= maxZoom.
 */
export const isZoomInRange = (zoom, minZoom, maxZoom) => {
  if (!Number.isFinite(zoom)) {
    return true;
  }
  const min = Number.isFinite(Number(minZoom)) ? Number(minZoom) : Number.NEGATIVE_INFINITY;
  const max = Number.isFinite(Number(maxZoom)) ? Number(maxZoom) : Number.POSITIVE_INFINITY;
  return zoom > min && zoom <= max;
};

/**
 * Obtiene el zoom equivalente a una altura de cámara con la tabla de metros por nivel del
 * mapa: el primer nivel cuya altura de referencia no supera la altura dada.
 * @param {Number} height Altura de la cámara en metros.
 * @param {Object<String, Number>} table Altura en metros de cada nivel de zoom.
 * @returns {Number} Nivel de zoom.
 */
export const zoomForHeight = (height, table) => {
  const levels = Object.entries(table)
    .map(([zoom, meters]) => [Number(zoom), meters])
    .sort(([a], [b]) => a - b);
  const level = levels.find(([, meters]) => Math.round(height) >= meters);
  return level ? level[0] : levels[levels.length - 1][0];
};
