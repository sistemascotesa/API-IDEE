/* eslint-disable max-len */
/**
 * @module IDEE/language
 */
import en from './en';
import es from './es';
import ca from './ca';
import Exception from '../exception/exception';

import pluginsLanguage from './plugins';

/**
 * Opciones de idiomas por defecto, (español, "es.json", en inglés "en.json" o en catalán "ca.json").
 * @public
 * @const
 * @type {object}
 * @api
 */
export const configuration = {
  translations: {
    en,
    es,
    ca,
  },
  lang: 'es',
};

/**
 * Esta función añade un nuevo idioma.
 * @public
 * @function
 * @param {string} lang Idioma.
 * @param {JSON} json Valores, traducción.
 * @api
 */
export const addTranslation = (lang, json) => {
  configuration.translations[lang] = json;
};

/**
 * Esta función te devuelve todas las traducciones disponibles
 * para acceder a los lenguages se usa el operador por ejemplo esBackimglayer
 * en la API-IDEE.
 *
 * @public
 * @function
 *
 * @param {string} lang Idioma.
 * @return {JSON} JSON con todas las traducciones.
 *
 * @api
 */
export const getTranslation = (lang) => {
  if (lang in configuration.translations) {
    configuration.translations[lang].backimglayer = pluginsLanguage.backimglayer[`${lang}Backimglayer`];
    configuration.translations[lang].comparators = pluginsLanguage.comparators[`${lang}Comparators`];
    configuration.translations[lang].contactlink = pluginsLanguage.contactlink[`${lang}Contactlink`];
    configuration.translations[lang].help = pluginsLanguage.help[`${lang}Help`];
    configuration.translations[lang].incicarto = pluginsLanguage.incicarto[`${lang}Incicarto`];
    configuration.translations[lang].infocoordinates = pluginsLanguage.infocoordinates[`${lang}Infocoordinates`];
    configuration.translations[lang].information = pluginsLanguage.information[`${lang}Information`];
    configuration.translations[lang].layerswitcher = pluginsLanguage.layerswitcher[`${lang}Layerswitcher`];
    configuration.translations[lang].mousesrs = pluginsLanguage.mousesrs[`${lang}Mousesrs`];
    configuration.translations[lang].printviewmanagement = pluginsLanguage.printviewmanagement[`${lang}Printviewmanagement`];
    configuration.translations[lang].queryattributes = pluginsLanguage.queryattributes[`${lang}Queryattributes`];
    // configuration.translations[lang].querydatabase = pluginsLanguage.querydatabase[`${lang}Querydatabase`];
    configuration.translations[lang].selectionzoom = pluginsLanguage.selectionzoom[`${lang}Selectionzoom`];
    configuration.translations[lang].sharemap = pluginsLanguage.sharemap[`${lang}Sharemap`];
    configuration.translations[lang].stylemanager = pluginsLanguage.stylemanager[`${lang}Stylemanager`];
    configuration.translations[lang].viewmanagement = pluginsLanguage.viewmanagement[`${lang}Viewmanagement`];
    configuration.translations[lang].locator = pluginsLanguage.locator[`${lang}Locator`];
    configuration.translations[lang].locatorscn = pluginsLanguage.locatorscn[`${lang}Locatorscn`];
    configuration.translations[lang].vectorsmanagement = pluginsLanguage.vectorsmanagement[`${lang}Vectorsmanagement`];
    configuration.translations[lang].filteredsearch = pluginsLanguage.filteredsearch[`${lang}Filteredsearch`];
    configuration.translations[lang].maxextzoom = pluginsLanguage.maxextzoom[`${lang}Maxextzoom`];
    configuration.translations[lang].wfstcontrols = pluginsLanguage.wfstcontrols[`${lang}Wfstcontrols`];
    configuration.translations[lang].mapheader = pluginsLanguage.mapheader[`${lang}Mapheader`];
    configuration.translations[lang].mapfooter = pluginsLanguage.mapfooter[`${lang}Mapfooter`];
    configuration.translations[lang].magnify = pluginsLanguage.magnify[`${lang}Magnify`];
  }
  return configuration.translations[lang];
};

/**
 * Esta función te devuelve una traducción dependiendo
 * del valor que se le pase por parámetros.
 *
 * @public
 * @function
 *
 * @param {string} key Nombre del control, plugin, ...
 * @param {string} lang Idioma.
 * @return {JSON} JSON con la traducción.
 * @api
 */
export const getValue = (key, lang = configuration.lang) => {
  return getTranslation(lang)[key];
};

/**
 * Esta función modifica el idioma del API-IDEE.
 * @public
 * @function
 * @param {string} lang Idioma.
 * @api
 */
export const setLang = (lang) => {
  if (!Object.keys(configuration.translations).includes(lang)) {
    Exception(getValue('exception').unsupported_lang);
  }
  configuration.lang = lang;
};

/**
 * Esta función devuelve el idioma de la API-IDEE.
 *
 * @function
 * @public
 * @return {String} Devuelve el idioma especificado en el archivo "configuration.lang".
 * @api
 */
export const getLang = () => {
  return configuration.lang;
};

/**
 * Este comentario no se verá, es necesario incluir
 * una exportación por defecto para que el compilador
 * muestre las funciones.
 *
 * Esto se produce por al archivo normaliza-exports.js
 * @api stable
 */
export default {};
