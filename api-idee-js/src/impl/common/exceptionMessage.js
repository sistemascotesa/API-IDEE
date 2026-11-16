import { getValue } from '../../facade/js/i18n/language';

/**
 * Devuelve un texto traducido de la sección "exception" con sus marcadores {nombre}
 * sustituidos. Se reemplaza con una función para que un "$" de los valores
 * (por ejemplo, "$ref" en un esquema) no se interprete como patrón de String.replace.
 * @param {String} key Clave de la sección "exception".
 * @param {Object} params Valores de los marcadores.
 * @returns {String} Mensaje en el idioma configurado.
 */
export default function exceptionMessage(key, params = {}) {
  return getValue('exception')[key].replace(/\{(\w+)\}/g, (match, name) => (
    params[name] === undefined ? match : String(params[name])
  ));
}
