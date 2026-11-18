/**
 * @module IDEE/impl/scene/tiles3d/Tiles3DOpacityStyle
 */

const clampOpacity = (opacity) => Math.min(1, Math.max(0, Number(opacity)));

const formatAlpha = (opacity) => String(Math.round(clampOpacity(opacity) * 1e6) / 1e6);

const withAlpha = (color, alpha) => `(${color}) * color('white', ${alpha})`;

/**
 * Compone un estilo 3D Tiles con la opacidad de la capa. La opacidad se expresa como el
 * alfa del color: el color del usuario (o el de cada rama de conditions) se multiplica por
 * color('white', alfa) y, sin color, se usa color('white', alfa). El literal color() con
 * alfa hace que el visor dibuje también las nubes de puntos en el pase translúcido.
 * @function
 * @param {Object|undefined} styleJson Estilo 3D Tiles del usuario (JSON).
 * @param {Number} opacity Opacidad entre 0 y 1.
 * @returns {Object|undefined} Estilo compuesto; el mismo estilo si la opacidad es 1.
 */
const composeTiles3DOpacityStyle = (styleJson, opacity) => {
  if (!Number.isFinite(Number(opacity)) || clampOpacity(opacity) >= 1) {
    return styleJson;
  }
  const alpha = formatAlpha(opacity);
  const style = { ...(styleJson || {}) };
  const { color } = style;
  if (typeof color === 'string' && color.trim() !== '') {
    style.color = withAlpha(color, alpha);
  } else if (color && Array.isArray(color.conditions)) {
    style.color = {
      ...color,
      conditions: color.conditions.map((condition) => (Array.isArray(condition)
        && typeof condition[1] === 'string'
        ? [condition[0], withAlpha(condition[1], alpha), ...condition.slice(2)]
        : condition)),
    };
  } else {
    style.color = `color('white', ${alpha})`;
  }
  return style;
};

export default composeTiles3DOpacityStyle;
