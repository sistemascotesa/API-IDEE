/**
 * Almacén interno del fondo recibido por REST, independiente para cada mapa.
 * @module IDEE/util/RestBaseLayerStore
 */
const baseLayers = new WeakMap();

/**
 * @param {IDEE.Map} map Mapa.
 * @returns {Array<IDEE.Layer>|undefined} Capas recibidas; undefined si no hubo baseLayer.
 * @api
 */
export const getRestBaseLayers = (map) => baseLayers.get(map);

/**
 * @param {IDEE.Map} map Mapa.
 * @param {Array<IDEE.Layer>} layers Capas recibidas.
 * @api
 */
export const setRestBaseLayers = (map, layers) => baseLayers.set(map, layers);

export default {};
