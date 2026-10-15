/**
 * Serialización de capas mediante los parámetros nombrados de API-REST.
 * @module IDEE/util/RestLayer
 */
import pako from 'pako';

const origins = new WeakMap();
const optionNames = [
  'format', 'crossOrigin', 'minZoom', 'maxZoom', 'minScale', 'maxScale',
  'minResolution', 'maxResolution', 'tileSize', 'tileGridMaxZoom',
  'projection', 'normalize', 'height', 'clampToGround', 'disableBackgroundColor',
  'extractStyles', 'removeFolderChildren', 'tiled', 'useCapabilities',
  'bands', 'nodata', 'convertToRGB', 'sldBody', 'maximumScreenSpaceError',
];

/**
 * Codifica un valor sin introducir separadores en la entrada REST.
 * Las comillas preservan las cadenas que podrían interpretarse como números o booleanos.
 * @param {*} value Valor serializable.
 * @returns {String} Valor en formato de parámetros nombrados.
 */
const encodeValue = (value) => {
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  if (typeof value === 'string' && /^[A-Za-z_][A-Za-z0-9_./:-]*$/.test(value)
    && value !== 'true' && value !== 'false') return value;
  const text = typeof value === 'string' ? `'${value}'` : JSON.stringify(value);
  const encoded = window.btoa(unescape(encodeURIComponent(text)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  if (text.length >= 512) {
    const compressed = pako.deflate(text, { level: 9 });
    const binary = Array.from(compressed, (byte) => String.fromCharCode(byte)).join('');
    const packed = window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    if (packed.length + 8 < encoded.length + 7) return `deflate~${packed}`;
  }
  return `base64~${encoded}`;
};

/**
 * Devuelve una entrada TYPE*key=value;key=value, sin el prefijo layers=.
 * @param {String} type Tipo de capa.
 * @param {Object} parameters Parámetros de carga.
 * @returns {String} Entrada REST.
 */
export const serialize = (type, parameters) => {
  const fields = Object.entries(parameters).filter(([, value]) => value !== undefined
    && value !== null && !(typeof value === 'number' && !Number.isFinite(value)));
  return `${type}*${fields.map(([key, value]) => `${key}=${encodeValue(value)}`).join(';')}`;
};

/**
 * Obtiene la configuración común actual sin copiar instancias del motor ni credenciales.
 * @param {IDEE.Layer} layer Capa.
 * @returns {Object} Configuración común.
 */
export const getParameters = (layer) => {
  const original = layer.constructorParameters || {};
  const options = { ...(original.options || original.opt), ...layer.options };
  const serializableOptions = {};
  optionNames.forEach((key) => {
    if (options[key] !== undefined
      && !(typeof options[key] === 'number' && !Number.isFinite(options[key]))) {
      serializableOptions[key] = options[key];
    }
  });
  ['minZoom', 'maxZoom'].forEach((key) => {
    if (Number.isFinite(layer[key])) serializableOptions[key] = layer[key];
  });
  if (options.style && Object.getPrototypeOf(options.style) === Object.prototype) {
    serializableOptions.style = options.style;
  }
  const style = layer.getStyle?.();
  let serializedStyle;
  if (style?.serialize) serializedStyle = style.serialize();
  else if (style && Object.getPrototypeOf(style) === Object.prototype) serializedStyle = style;
  return {
    name: layer.name,
    legend: layer.legend,
    url: layer.url,
    isBase: layer.isBase,
    visibility: layer.getImpl().isVisible ? layer.isVisible() : undefined,
    displayInLayerSwitcher: layer.displayInLayerSwitcher,
    opacity: layer.getImpl().getOpacity ? layer.getOpacity() : undefined,
    zIndex: layer.getZIndex(),
    maxExtent: layer.userMaxExtent,
    attribution: layer.attribution,
    refreshInterval: layer.getAutoRefreshInterval?.(),
    extract: layer.extract,
    infoEventType: layer.infoEventType,
    template: typeof layer.template === 'string' ? layer.template : undefined,
    style: serializedStyle,
    options: Object.keys(serializableOptions).length ? serializableOptions : undefined,
  };
};

/**
 * Conserva el origen de una tabla sin añadir referencias circulares a la capa.
 * @param {IDEE.Layer} layer Capa hija.
 * @param {IDEE.layer.GeoPackage} container Contenedor.
 * @param {String} table Nombre de tabla.
 */
export const setOrigin = (layer, container, table) => origins.set(layer, { container, table });

/**
 * @param {IDEE.Layer} layer Capa hija.
 * @returns {Object|undefined} Origen.
 */
export const getOrigin = (layer) => origins.get(layer);

/**
 * Comprueba que el recurso puede cargarse desde otra sesión.
 * @param {String} url URL.
 * @returns {Boolean} URL HTTP(S), absoluta o relativa.
 */
export const isRemote = (url) => {
  if (typeof url !== 'string' || !url.trim()) return false;
  try {
    return /^https?:$/.test(new URL(url, document.baseURI).protocol);
  } catch (error) {
    return false;
  }
};

/**
 * Resuelve las rutas relativas antes de compartir con otra aplicación.
 * @param {String} url URL.
 * @returns {String} URL absoluta.
 */
export const remoteURL = (url) => {
  if (!isRemote(url)) throw new Error('REST_LAYER_LOCAL_BINARY');
  // URL conserva los patrones de teselas, que no deben convertirse en %7B y %7D.
  return new URL(url, document.baseURI).href.replace(/%7B/gi, '{').replace(/%7D/gi, '}');
};

export default {};
