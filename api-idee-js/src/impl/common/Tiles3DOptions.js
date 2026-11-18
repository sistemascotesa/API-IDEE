import exceptionMessage from './exceptionMessage';

const isEmpty = (value) => value === undefined || value === null || value === '';

const isPlainObject = (value) => {
  if (Object.prototype.toString.call(value) !== '[object Object]') return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

const normalizeString = (value, key) => {
  if (isEmpty(value)) return undefined;
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(exceptionMessage('tiles3d_option_string', { key }));
  }
  return value;
};

const normalizeStringMap = (value, key) => {
  if (isEmpty(value)) return {};
  if (!isPlainObject(value) || Object.values(value).some((item) => typeof item !== 'string')) {
    throw new TypeError(exceptionMessage('tiles3d_option_string_map', { key }));
  }
  return { ...value };
};

const normalizeIonAssetId = (value) => {
  const assetId = typeof value === 'string' && /^\d+$/.test(value.trim())
    ? Number(value.trim()) : value;
  if (!Number.isSafeInteger(assetId) || assetId <= 0) {
    throw new TypeError(exceptionMessage('tiles3d_ion_asset_id'));
  }
  return assetId;
};

/**
 * Valida y normaliza la fuente y las opciones de acceso de una capa Tiles3D. Es una
 * función pura que comparten la fachada y la implementación. La fuente es exclusiva:
 * userParameters.url o userParameters.ionAssetId. Las opciones de acceso van en options
 * (no en vendorOptions) y no se pasan al visor como opciones del tileset.
 * @param {Object} userParameters Parámetros de la capa.
 * @param {String} [userParameters.url] URL del tileset.json.
 * @param {Number|String} [userParameters.ionAssetId] Identificador del asset de Cesium ion.
 * @param {Object} options Opciones de la capa.
 * @param {String} [options.ionAccessToken] Token de Cesium ion.
 * @param {String} [options.ionServer] URL base del servidor de Cesium ion.
 * @param {Object<String, String>} [options.headers] Cabeceras HTTP de las peticiones.
 * @param {Object<String, String>} [options.queryParameters] Parámetros de consulta.
 * @returns {{type: String, url: (String|undefined), ionAssetId: (Number|undefined),
 * ionAccessToken: (String|undefined), ionServer: (String|undefined),
 * headers: Object<String, String>, queryParameters: Object<String, String>}}
 * Opciones normalizadas.
 * @throws {TypeError} Si la fuente o alguna opción no son válidas. El mensaje nunca
 * incluye los valores recibidos.
 */
export default function normalizeTiles3DOptions(userParameters = {}, options = {}) {
  const parameters = isPlainObject(userParameters) ? userParameters : {};
  const hasUrl = !isEmpty(parameters.url);
  const hasIonAssetId = !isEmpty(parameters.ionAssetId);
  if (hasUrl === hasIonAssetId) {
    throw new TypeError(exceptionMessage('tiles3d_source'));
  }
  if (hasUrl && (typeof parameters.url !== 'string' || parameters.url.trim() === '')) {
    throw new TypeError(exceptionMessage('tiles3d_url'));
  }
  const accessOptions = isPlainObject(options) ? options : {};
  return {
    type: hasUrl ? 'url' : 'ion',
    url: hasUrl ? parameters.url : undefined,
    ionAssetId: hasIonAssetId ? normalizeIonAssetId(parameters.ionAssetId) : undefined,
    ionAccessToken: normalizeString(accessOptions.ionAccessToken, 'ionAccessToken'),
    ionServer: normalizeString(accessOptions.ionServer, 'ionServer'),
    headers: normalizeStringMap(accessOptions.headers, 'headers'),
    queryParameters: normalizeStringMap(accessOptions.queryParameters, 'queryParameters'),
  };
}
