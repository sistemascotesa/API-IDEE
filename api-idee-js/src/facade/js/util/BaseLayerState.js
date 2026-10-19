/**
 * Fondo REST de un mapa.
 * @module IDEE/util/BaseLayerState
 */
import { buildLayer } from '../builder/builder';
import { serialize } from './RestLayer';

const restoredMaps = new WeakMap();

export const hasRestoredBaseLayer = (map) => restoredMaps.has(map);

/** Selección real de los proveedores presentes; sin proveedor, bases raíz visibles. */
export const getSelection = (map) => {
  const present = new Set(map.getLayers());
  const selected = map.getControls()
    .filter((control) => typeof control.getSelectedBaseLayers === 'function')
    .flatMap((control) => control.getSelectedBaseLayers())
    .concat(restoredMaps.get(map) || [])
    .filter((layer) => present.has(layer) && layer.isVisible());
  return [...new Set(selected.length ? selected
    : map.getRootLayers().filter((layer) => layer.isBase && layer.isVisible()))];
};

/** Serializa composiciones sin crear grupos ni modificar las capas originales. */
export const getRestBaseLayer = (map) => {
  const layers = getSelection(map);
  if (!layers.length) return 'none';
  if (layers.length === 1) return layers[0].getRestLayer();
  return serialize('LayerGroup', {
    name: 'shared-base',
    isBase: true,
    visibility: true,
    displayInLayerSwitcher: false,
    layers: layers.map((layer) => layer.getRestLayer()),
  });
};

/** Solo se invoca para un baseLayer explícito y antes de inicializar selectores. */
export const restore = (map, value) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Invalid baseLayer');
  // Cesium no implementa LayerGroup: conserva la composición como capas raíz.
  const readLayers = (rest) => {
    const definition = buildLayer(rest);
    if (map.getImplementation() === 'cesium' && definition.type === 'LayerGroup') {
      return definition.layers.flatMap(readLayers);
    }
    return [map.getLayerByString(rest)];
  };
  const layers = value === 'none' ? [] : readLayers(value);
  if (layers.some((layer) => !layer)) throw new Error('Invalid baseLayer');
  restoredMaps.set(map, layers);
  map.removeLayers(map.getBaseLayers());
  layers.forEach((selectedLayer, index) => {
    const layer = selectedLayer;
    layer.isBase = index === 0;
    layer.displayInLayerSwitcher = false;
    layer.setZIndex(index - layers.length);
  });
  map.addLayers(layers);
};

// Compara recursos y opciones, sin depender del índice ni del estado visual del catálogo.
const resource = (value) => {
  if (Array.isArray(value)) return value.map(resource);
  if (!value || typeof value !== 'object') return value;
  const ignored = ['legend', 'visibility', 'displayInLayerSwitcher', 'opacity', 'zIndex', 'isBase',
    'queryable'];
  return Object.fromEntries(Object.keys(value).sort().filter((key) => !ignored.includes(key))
    .map((key) => [key, resource(value[key])]));
};

const resources = (map, layers) => layers.flatMap((value) => {
  const layer = typeof value === 'string' ? map.getLayerByString(value) : value;
  if (layer.type === 'LayerGroup') {
    // El catálogo puede contener grupos todavía sin añadir al mapa.
    const children = layer.getLayers();
    return resources(map, children.length ? children
      : layer.constructorParameters.userParameters.layers);
  }
  return [resource(buildLayer(layer.getRestLayer()))];
});

/**
 * Adapta el catálogo ANTES de dibujarlo. Los selectores mantienen sus manejadores de clic.
 * Contrato: layers [{id,title,layers}], activeLayer, visible y flattedLayers.
 * Solo actúa en mapas con baseLayer explícito; lee el fondo actual para altas tardías.
 */
export const prepareSelector = (map, selector, sharedTitle) => {
  const control = selector;
  if (!restoredMaps.has(map)) return false;
  const layers = getSelection(map);
  let index = -1;
  if (layers.length) {
    const key = JSON.stringify(resources(map, layers));
    index = control.layers.findIndex((entry) => {
      try {
        return JSON.stringify(resources(map, entry.layers)) === key;
      } catch (error) {
        return false;
      }
    });
    // Copias del catálogo: las opciones del llamante no reciben la entrada temporal.
    control.layers = control.layers.map((entry) => ({ ...entry }));
    if (index < 0) {
      index = control.layers.length;
      control.layers.push({
        id: 'rest-shared-base',
        title: sharedTitle,
        tooltip: sharedTitle,
        preview: '',
        layers,
      });
    } else {
      control.layers[index].layers = layers;
    }
    control.flattedLayers = control.layers.flatMap((entry) => entry.layers);
  }
  control.activeLayer = index;
  control.visible = index >= 0;
  return true;
};

export default {};
