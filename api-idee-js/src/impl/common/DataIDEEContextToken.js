import exceptionMessage from './exceptionMessage';

/** Nombre del parámetro de consulta con el que Data-IDEE recibe el token de contexto. */
export const CONTEXT_TOKEN_PARAMETER = 'contextToken';

const isToken = (value) => typeof value === 'string' && value !== '';

/**
 * Crea la fuente del token de contexto de una capa DataIDEE.
 * @param {String|Function|undefined} value Token o función que lo devuelve (también
 * mediante una promesa). La función se invoca en cada petición.
 * @returns {{isConfigured: Function, resolve: Function}} Fuente del token.
 */
export function createContextTokenSource(value) {
  return {
    isConfigured: () => typeof value === 'function' || isToken(value),
    resolve: async () => {
      let token = value;
      if (typeof value === 'function') {
        try {
          token = await value();
        } catch (error) {
          throw new Error(exceptionMessage('dataidee_context_token_failed'));
        }
      }
      return isToken(token) ? token : undefined;
    },
  };
}

/**
 * Añade el token de contexto a una URL del origen permitido. No modifica la entrada.
 * @param {String|URL} url URL de la petición.
 * @param {String|undefined} token Token de contexto.
 * @param {String} allowedOrigin Origen del servicio de la capa.
 * @returns {String|URL} URL con un único parámetro contextToken, o la entrada sin cambios.
 */
export function applyContextToken(url, token, allowedOrigin) {
  if (!isToken(token)) return url;
  let target;
  try {
    const base = typeof window === 'undefined' ? undefined : window.location?.href;
    target = new URL(String(url), base || 'http://localhost/');
  } catch (error) {
    return url;
  }
  if (target.origin !== allowedOrigin) return url;
  target.searchParams.set(CONTEXT_TOKEN_PARAMETER, token);
  return target.href;
}

/**
 * Crea el decorador de URLs de una capa DataIDEE: resuelve el token en cada petición.
 * @param {{isConfigured: Function, resolve: Function}} source Fuente del token.
 * @param {String} allowedOrigin Origen del servicio de la capa.
 * @returns {Function} Función asíncrona que recibe una URL y devuelve la URL decorada.
 */
export function createUrlDecorator(source, allowedOrigin) {
  return async (url) => {
    if (!source?.isConfigured()) return url;
    return applyContextToken(url, await source.resolve(), allowedOrigin);
  };
}
