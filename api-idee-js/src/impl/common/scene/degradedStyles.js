/**
 * Traducción a opciones de estilo genérico de los estilos que una implementación no
 * puede representar tal cual (mapa de calor, gráficos y líneas de flujo en 3D).
 * Funciones puras, independientes del motor.
 *
 * @module IDEE/impl/common/scene/degradedStyles
 */

const TEMPLATE = /^\{\{([^}]+)\}\}$/;

const clamp01 = (value) => Math.min(1, Math.max(0, value));

const attributeOf = (feature, name) => (typeof feature?.getAttribute === 'function'
  ? feature.getAttribute(name) : undefined);

const isDynamic = (value) => typeof value === 'function'
  || (typeof value === 'string' && TEMPLATE.test(value));

const resolveValue = (value, feature, map) => {
  if (typeof value === 'function') return value(feature, map);
  if (typeof value === 'string' && TEMPLATE.test(value)) {
    return attributeOf(feature, value.replace(TEMPLATE, '$1'));
  }
  return value;
};

const isPresent = (value) => value !== undefined && value !== null && value !== '';

/**
 * Color del degradado que corresponde a una proporción entre 0 y 1.
 * @param {Array<string>} gradient Colores del degradado.
 * @param {number} ratio Proporción.
 * @returns {string|undefined} Color.
 */
export const gradientStop = (gradient, ratio) => {
  if (!Array.isArray(gradient) || gradient.length === 0) return undefined;
  const index = Math.round(clamp01(Number(ratio) || 0) * (gradient.length - 1));
  return gradient[index];
};

/**
 * Pesos mínimo y máximo de un atributo numérico en un conjunto de objetos geográficos.
 * @param {Array<IDEE.Feature>} features Objetos geográficos.
 * @param {string} attribute Atributo.
 * @returns {{min: (number|undefined), max: (number|undefined)}} Rango.
 */
export const weightRange = (features, attribute) => (features || []).reduce((range, feature) => {
  const value = attributeOf(feature, attribute);
  const weight = isPresent(value) ? Number(value) : Number.NaN;
  if (!Number.isFinite(weight)) return range;
  return {
    min: range.min === undefined ? weight : Math.min(range.min, weight),
    max: range.max === undefined ? weight : Math.max(range.max, weight),
  };
}, { min: undefined, max: undefined });

/**
 * Mapa de calor como puntos: el color sale del degradado y la opacidad del peso, con
 * la misma normalización que el mapa de calor de OpenLayers (valor / peso máximo, o el
 * resultado de la función de peso).
 * @param {Object} heatmap Opciones.
 * @param {string|function} [heatmap.attribute] Atributo o función de peso.
 * @param {Array<string>} heatmap.gradient Degradado.
 * @param {number} heatmap.radius Radio en píxeles.
 * @param {number} [heatmap.opacity] Opacidad máxima.
 * @param {number} [heatmap.maxWeight] Peso máximo de la capa.
 * @returns {Object} Opciones de estilo genérico.
 */
export const heatmapAsPoints = ({
  attribute, gradient, radius, opacity = 1, maxWeight,
}) => {
  const ratioOf = (feature, map) => {
    let weight;
    if (typeof attribute === 'function') {
      weight = Number(attribute(feature, map));
    } else {
      const value = attributeOf(feature, attribute || 'weight');
      weight = isPresent(value) ? Number(value) : Number.NaN;
      if (maxWeight > 0) weight /= maxWeight;
    }
    return Number.isFinite(weight) ? clamp01(weight) : 1;
  };
  return {
    point: {
      radius,
      fill: {
        color: (feature, map) => gradientStop(gradient, ratioOf(feature, map)),
        opacity: (feature, map) => ratioOf(feature, map) * opacity,
      },
    },
  };
};

/**
 * Gráfico como punto con una etiqueta que muestra los valores de sus variables.
 * @param {Object} chart Opciones.
 * @param {Array<Object|string>} [chart.variables] Variables (atributo o { attribute }).
 * @param {Array<string>} [chart.scheme] Colores del gráfico.
 * @param {number} chart.radius Radio en píxeles.
 * @returns {Object} Opciones de estilo genérico.
 */
export const chartAsLabeledPoints = ({ variables = [], scheme = [], radius }) => {
  const attributes = (Array.isArray(variables) ? variables : [variables])
    .map((variable) => (typeof variable === 'string' ? variable : variable?.attribute))
    .filter(isPresent);
  return {
    point: {
      radius,
      fill: { color: (Array.isArray(scheme) && scheme.find(isPresent)) || '#336699', opacity: 0.8 },
      stroke: { color: '#ffffff', width: 1 },
      label: {
        text: (feature) => attributes.map((name) => attributeOf(feature, name))
          .filter(isPresent).join(' / '),
        font: 'bold 12px sans-serif',
        color: '#000000',
        stroke: { color: '#ffffff', width: 3 },
        offset: [0, -(Number(radius) || 0) - 8],
      },
    },
  };
};

/**
 * Línea de flujo como línea con el color inicial y el ancho medio del flujo.
 * @param {Object} flow Opciones de la línea de flujo.
 * @returns {Object} Opciones de estilo genérico.
 */
export const flowLineAsLines = (flow = {}) => {
  const widthOf = (feature, map) => {
    const widths = [flow.width, flow.width2]
      .map((width) => Number(resolveValue(width, feature, map)))
      .filter((width) => Number.isFinite(width) && width > 0);
    return widths.length ? widths.reduce((sum, width) => sum + width, 0) / widths.length : 1;
  };
  const colorOf = (feature, map) => resolveValue(flow.color, feature, map)
    || resolveValue(flow.color2, feature, map) || '#000000';
  const dynamic = (keys) => keys.some((key) => isDynamic(flow[key]));
  return {
    line: {
      stroke: {
        color: dynamic(['color', 'color2']) ? colorOf : colorOf(),
        width: dynamic(['width', 'width2']) ? widthOf : widthOf(),
      },
    },
  };
};

/**
 * Crea un aviso que solo se muestra la primera vez para cada clave.
 * @param {function(string): void} warn Función de aviso.
 * @returns {function(string, string): void} Aviso (clave, mensaje).
 */
export const createOnceWarner = (warn) => {
  const shown = new Set();
  return (key, message) => {
    if (shown.has(key)) return;
    shown.add(key);
    warn(message);
  };
};
