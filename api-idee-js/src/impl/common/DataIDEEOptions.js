import { isNullOrEmpty } from 'IDEE/util/Utils';
import RequestManager from './RequestManager';

/** Límites predeterminados de una zona de edición DataIDEE. */
export const DEFAULT_EDITING_LIMITS = Object.freeze({
  pageSize: 1000,
  maxFeatures: 1000,
  maxCoordinates: 100000,
  maxBytes: 10 * 1024 * 1024,
});

const TOKEN_LOCATIONS = ['header', 'query'];

function normalizeEditingLimits(editingLimits) {
  if (editingLimits !== undefined && (editingLimits === null
    || typeof editingLimits !== 'object' || Array.isArray(editingLimits))) {
    throw new TypeError('DataIDEE editingLimits must be an object.');
  }
  return Object.fromEntries(Object.entries(DEFAULT_EDITING_LIMITS).map(([key, fallback]) => {
    const value = editingLimits?.[key];
    if (value === undefined) return [key, fallback];
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new TypeError(`DataIDEE editing limit '${key}' must be a positive integer.`);
    }
    return [key, value];
  }));
}

/**
 * Valida y normaliza las opciones propias de DataIDEE sin mezclar sus grupos: options
 * son las opciones generales de la capa y vendorOptions las del proveedor. Es una función
 * pura que comparten la fachada y las implementaciones de cada motor.
 * @param {Object} options Opciones generales de la capa.
 * @param {Object} vendorOptions Opciones del proveedor.
 * @param {Object} context Parámetros de la capa necesarios para validar combinaciones.
 * @param {String|Number} [context.id] Identificador de una entidad individual.
 * @returns {{bboxStrategy: Boolean, requestManager: Object, editingLimits: Object}}
 * Opciones normalizadas.
 * @throws {TypeError} Si un valor o una combinación de valores no son válidos.
 */
export default function normalizeDataIDEEOptions(options = {}, vendorOptions = {}, { id } = {}) {
  const { bboxStrategy = false } = options;
  if (typeof bboxStrategy !== 'boolean') {
    throw new TypeError('DataIDEE bboxStrategy must be a boolean.');
  }
  if (bboxStrategy && !isNullOrEmpty(id)) {
    throw new TypeError('DataIDEE bboxStrategy requires a collection, without an item id.');
  }
  if (bboxStrategy && !isNullOrEmpty(vendorOptions?.source)) {
    throw new TypeError('DataIDEE bboxStrategy is not compatible with an external vendorOpts.source.');
  }
  const tokenLocation = vendorOptions?.tokenLocation;
  if (tokenLocation !== undefined && !TOKEN_LOCATIONS.includes(tokenLocation)) {
    throw new TypeError("DataIDEE tokenLocation must be 'header' or 'query'.");
  }
  const { throttleMs } = RequestManager.normalizeOptions({
    cache: options.cache, throttleMs: options.throttleMs,
  });
  return {
    bboxStrategy,
    requestManager: { cache: options.cache, throttleMs, pendingPolicy: 'latest' },
    editingLimits: normalizeEditingLimits(options.editingLimits),
  };
}
