/**
 * @module IDEE/style/utils
 */

import chroma from 'chroma-js';
import StylePoint from './Point';
import StyleLine from './Line';
import StylePolygon from './Polygon';
import StyleGeneric from './Generic';

/**
 * Esta función devuelve el estilo parametrizable.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @function
 * @public
 * @param {object} options Opciones de estilo.
 * @param {IDEE.layer.Vector} layer Capa a la que se le aplicará.
 * @return {IDEE.style.Simple} Nuevo estilo.
 */
const generateStyleLayer = (options, layer) => {
  let style;
  switch (layer.getGeometryType()) {
    case 'Point':
    case 'MultiPoint':
      style = new StylePoint(options);
      break;
    case 'LineString':
    case 'MultiLineString':
      style = new StyleLine(options);
      break;
    case 'Polygon':
    case 'MultiPolygon':
      style = new StylePolygon(options);
      break;
    default:
      return null;
  }
  return style;
};

/**
 * This functions returns random simple style
 * @function
 * @private
 * @param {M.Feature} feature
 * @return {M.style.Simple}
 */
const generateRandomStyle = (opts) => {
  const radius = opts.radius;
  const fillColor = chroma.random().hex();
  const strokeColor = opts.strokeColor;
  const strokeWidth = opts.strokeWidth;
  const geometry = opts.feature
    .getGeometry()
    .type;
  let style;
  let options;
  switch (geometry) {
    case 'Point':
    case 'MultiPoint':
      options = {
        radius,
        fill: {
          color: fillColor,
        },
        stroke: {
          color: strokeColor,
          width: strokeWidth,
        },
      };
      style = new StylePoint(options);
      break;
    case 'LineString':
    case 'MultiLineString':
      options = {
        fill: {
          color: fillColor,
        },
        stroke: {
          color: strokeColor,
          width: strokeWidth,
        },
      };
      style = new StyleLine(options);
      break;
    case 'Polygon':
    case 'MultiPolygon':
      options = {
        fill: {
          color: fillColor,
        },
        stroke: {
          color: strokeColor,
          width: strokeWidth,
        },
      };
      style = new StylePolygon(options);
      break;
    default:
      style = null;
  }
  return style;
};

/**
 * Genera un estilo aleatorio.
 * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
 * @function
 * @public
 * @param {Object} opts Opciones de "radius", "strokeColor" y "strokeWidth".
 * @return {StyleGeneric} Nuevo estilo genérico.
 */
const generateRandomGenericStyle = (opts) => {
  const radius = opts.radius;
  const fillColor = chroma.random().hex();
  const strokeColor = opts.strokeColor;
  const strokeWidth = opts.strokeWidth;
  const options = {
    point: {
      radius,
      fill: {
        color: fillColor,
      },
      stroke: {
        color: strokeColor,
        width: strokeWidth,
      },
    },
    line: {
      fill: {
        color: fillColor,
      },
      stroke: {
        color: strokeColor,
        width: strokeWidth,
      },
    },
    polygon: {
      fill: {
        color: fillColor,
      },
      stroke: {
        color: strokeColor,
        width: strokeWidth,
      },
    },
  };
  return new StyleGeneric(options);
};

/**
 * @public
 * @constant
 * @type {Object}
 * @api
 */
const Utils = {
  generateStyleLayer,
  generateRandomStyle,
  generateRandomGenericStyle,
};

export default Utils;
