/* eslint-disable max-len */
/* eslint-disable no-nested-ternary */
/**
 * @module IDEE/facade/builder
 */
import {
  isNullOrEmpty, isFunction, isString, concatUrlPaths, normalize,
} from 'IDEE/util/Utils';
import ControlPanel from '../ui/ControlPanel';
import { getValue } from '../i18n/language';
import Control from '../control/Control';
import Attributions from '../control/Attributions';
import GetFeatureInfo from '../control/GetFeatureInfo';
import Location from '../control/Location';
import Scale from '../control/Scale';
import Rotate from '../control/Rotate';
import ScaleLine from '../control/ScaleLine';
import Panzoom from '../control/Panzoom';
import Panzoombar from '../control/Panzoombar';
import BackgroundLayers from '../control/BackgroundLayers';
import ImplementationSwitcher from '../control/ImplementationSwitcher';
import WMCSelector from '../control/WMCSelector';
import Timeline from '../control/Timeline';
import * as dialog from '../dialog';
import Exception from '../exception/exception';
import { isBoolean, isNumber, parseUrlParams } from '../util/Utils';
import MeasureBar from '../control/MeasureBar';
import OverviewMap from '../control/OverviewMap';

/**
 * Get default panel options for a control.
 *
 * @public
 * @function
 * @param {IDEE.Control} control Control instance.
 * @param {Object} params Additional parameters for panel creation.
 * @returns {Object}
 */
export const getDefaultPanelOptions = (control, params) => ({
  order: isNumber(control.order) ? control.order : params.order,
  position: control.position ?? params.position,
  collapsible: isBoolean(control.collapsible) ? control.collapsible : params.collapsible,
  collapsed: isBoolean(control.collapsed) ? control.collapsed : params.collapsed,
  tooltip: isString(control.tooltip) ? control.tooltip
    : (control.translation ? control.translation.title : (params.tooltip ?? null)),
  className: `m-${control.name}`,
});

/**
 * Esta función devuelve el panel para el control Attributions.
 *
 * @public
 * @function
 *
 * @param {IDEE.Control} control Control.
 * @param {IDEE.Map} map Mapa.
 * @param {Object} params Parámetros del control.
 * @param {Object} defaultOptions Parámetros por defecto para el panel
 *
 * @return {ControlPanel} Devuelve un panel de control compatible.
 * @api stable
 */
export const getAttributionsPanel = (control, map, params = {}) => {
  return new ControlPanel(Attributions.NAME, {
    ...getDefaultPanelOptions(control, params),
    collapsedButtonClass: 'g-cartografia-comments-simple',
  });
};

/**
 * Esta función devuelve el panel para el control Scale.
 *
 * @public
 * @function
 *
 * @param {IDEE.Control} control Control.
 * @param {IDEE.Map} map Mapa.
 * @param {Object} params Parámetros del control.
 * @param {Object} defaultOptions Parámetros por defecto para el panel
 *
 * @return {ControlPanel} Devuelve un panel de control compatible.
 * @api stable
 */
export const getScalePanel = (control, map, params = {}) => {
  let panel = map.getPanels('map-info')[0];
  if (isNullOrEmpty(panel)) {
    panel = new ControlPanel('map-info', {
      ...getDefaultPanelOptions(control, params),
      collapsible: false,
      className: 'm-map-info',
    });
    map.addUpClass_(panel); // eslint-disable-line no-underscore-dangle
  }
  panel.addClassName('m-with-scale');
  return panel;
};

/**
 * Esta función devuelve el panel para el control ScaleLine.
 *
 * @public
 * @function
 *
 * @param {IDEE.Control} control Control.
 * @param {IDEE.Map} map Mapa.
 * @param {Object} params Parámetros del control.
 * @param {Object} defaultOptions Parámetros por defecto para el panel
 *
 * @return {ControlPanel} Devuelve un panel de control compatible.
 * @api stable
 */
export const getScaleLinePanel = (control, map, params = {}) => {
  const panel = new ControlPanel(ScaleLine.NAME, {
    ...getDefaultPanelOptions(control, params),
    collapsible: false,
    tooltip: params.tooltip ?? control.title ?? getValue('scaleline').title,
  });
  map.addUpClass_(panel); // eslint-disable-line no-underscore-dangle
  return panel;
};

/**
 * Esta función devuelve el panel que alberga los controles de medida
 *
 * @public
 * @function
 *
 * @param {IDEE.Control} control Control.
 * @param {IDEE.Map} map Mapa.
 * @param {Object} params Parámetros del control.
 * @param {Object} defaultOptions Parámetros por defecto para el panel
 *
 * @return {ControlPanel} Devuelve un panel de control compatible.
 * @api stable
 */
export const getMeasureBarPanel = (control, map, params = {}) => {
  const panel = new ControlPanel(MeasureBar.NAME, {
    ...getDefaultPanelOptions(control, params),
    className: `m-control-${MeasureBar.NAME}`,
    collapsedButtonClass: 'g-cartografia-regla',
  });
  return panel;
};

/**
 * Esta función devuelve el panel que alberga el control de mini mapa observable
 *
 * @public
 * @function
 *
 * @param {IDEE.Control} control Control.
 * @param {IDEE.Map} map Mapa.
 * @param {Object} params Parámetros del control.
 * @param {Object} defaultOptions Parámetros por defecto para el panel
 *
 * @return {ControlPanel} Devuelve un panel de control compatible.
 * @api stable
 */
export const getOverviewMapPanel = (control, map, params = {}) => {
  const panel = new ControlPanel(OverviewMap.NAME, {
    ...getDefaultPanelOptions(control, params),
    className: `m-control-${OverviewMap.NAME}`,
    collapsedButtonClass: 'g-cartografia-mundo',
  });
  return panel;
};

/**
 * Esta función devuelve el panel para el control Panzoombar.
 *
 * @public
 * @function
 *
 * @param {IDEE.Control} control Control.
 * @param {IDEE.Map} map Mapa.
 * @param {Object} params Parámetros del control.
 * @param {Object} defaultOptions Parámetros por defecto para el panel
 *
 * @return {ControlPanel} Devuelve un panel de control compatible.
 * @api stable
 */
export const getPanzoombarPanel = (control, map, params = {}) => {
  return new ControlPanel(Panzoombar.NAME, {
    ...getDefaultPanelOptions(control, params),
    collapsible: false,
  });
};

/**
 * Esta función devuelve el panel para el control Panzoom.
 *
 * @public
 * @function
 *
 * @param {IDEE.Control} control Control.
 * @param {IDEE.Map} map Mapa.
 * @param {Object} params Parámetros del control.
 * @param {Object} defaultOptions Parámetros por defecto para el panel
 *
 * @return {ControlPanel} Devuelve un panel de control compatible.
 * @api stable
 */
export const getPanzoomPanel = (control, map, params = {}) => {
  return new ControlPanel('panzoom', {
    ...getDefaultPanelOptions(control, params),
    collapsible: false,
  });
};

/**
 * Esta función devuelve el panel para el control GetFeatureInfo.
 *
 * @public
 * @function
 *
 * @param {IDEE.Control} control Control.
 * @param {IDEE.Map} map Mapa.
 * @param {Object} params Parámetros del control.
 * @param {Object} defaultOptions Parámetros por defecto para el panel
 *
 * @return {ControlPanel} Devuelve un panel de control compatible.
 * @api stable
 */
export const getGetFeatureInfo = (control, map, params = {}) => {
  return new ControlPanel(GetFeatureInfo.NAME, {
    ...getDefaultPanelOptions(control, params),
    collapsible: false,
    collapsedButtonClass: 'g-cartografia-featureInfo',
  });
};

/**
 * Esta función devuelve el panel para el control Location.
 *
 * @public
 * @function
 *
 * @param {IDEE.Control} control Control.
 * @param {IDEE.Map} map Mapa.
 * @param {Object} params Parámetros del control.
 * @param {Object} defaultOptions Parámetros por defecto para el panel
 *
 * @return {ControlPanel} Devuelve un panel de control compatible.
 * @api stable
 */
export const getLocationPanel = (control, map, params = {}) => {
  return new ControlPanel(Location.NAME, {
    ...getDefaultPanelOptions(control, params),
    collapsible: false,
  });
};

/**
 * Esta función devuelve el panel para el control Rotate.
 *
 * @public
 * @function
 *
 * @param {IDEE.Control} control Control.
 * @param {IDEE.Map} map Mapa.
 * @param {Object} params Parámetros del control.
 * @param {Object} defaultOptions Parámetros por defecto para el panel
 *
 * @return {ControlPanel} Devuelve un panel de control compatible.
 * @api stable
 */
export const getRotatePanel = (control, map, params = {}) => {
  return new ControlPanel('rotate', {
    ...getDefaultPanelOptions(control, params),
    collapsible: false,
    className: 'm-rotate',
  });
};

/**
 * Esta función devuelve el panel para el control BackgroundLayers.
 *
 * @public
 * @function
 *
 * @param {IDEE.Control} control Control.
 * @param {IDEE.Map} map Mapa.
 * @param {Object} params Parámetros del control.
 * @param {Object} defaultOptions Parámetros por defecto para el panel
 *
 * @return {ControlPanel} Devuelve un panel de control compatible.
 * @api stable
 */
export const getBackgroundLayersPanel = (control, map, params = {}) => {
  return new ControlPanel('backgroundlayers', {
    ...getDefaultPanelOptions(control, params),
    collapsible: false,
    className: 'm-control-baselayer',
  });
};

/**
 * Esta función devuelve el panel para el control ImplementationSwitcher.
 *
 * @public
 * @function
 *
 * @param {IDEE.Control} control Control.
 * @param {IDEE.Map} map Mapa.
 * @param {Object} params Parámetros del control.
 * @param {Object} defaultOptions Parámetros por defecto para el panel
 *
 * @return {ControlPanel} Devuelve un panel de control compatible.
 * @api stable
 */
export const getImpSwitcherPanel = (control, map, params = {}) => {
  return new ControlPanel(ImplementationSwitcher.NAME, {
    ...getDefaultPanelOptions(control, params),
    collapsedButtonClass: 'g-cartografia-implementacion',
    className: 'm-implementationswitcher',
  });
};

/**
 * Esta función devuelve el panel para el control WMCSelector.
 *
 * @public
 * @function
 *
 * @param {IDEE.Control} control Control.
 * @param {IDEE.Map} map Mapa.
 * @param {Object} params Parámetros del control.
 * @param {Object} defaultOptions Parámetros por defecto para el panel
 *
 * @return {ControlPanel} Devuelve un panel de control compatible.
 * @api stable
 */
export const getWMCSelectorPanel = (control, map, params = {}) => {
  let panel = map.getPanels('map-info')[0];
  if (isNullOrEmpty(panel)) {
    panel = new ControlPanel('map-info', {
      ...getDefaultPanelOptions(control, params),
      collapsible: false,
      className: 'm-map-info',
    });
    map.addUpClass_(panel); // eslint-disable-line no-underscore-dangle
  }
  panel.addClassName(`m-with-${WMCSelector.NAME}`);
  return panel;
};

/**
 * Esta función devuelve el panel para el control de línea de tiempo
 *
 * @public
 * @function
 *
 * @param {IDEE.Control} control Control.
 * @param {IDEE.Map} map Mapa.
 * @param {Object} params Parámetros del control.
 * @param {Object} defaultOptions Parámetros por defecto para el panel
 *
 * @return {ControlPanel} Devuelve un panel de control compatible.
 * @api stable
 */
export const getTimelinePanel = (control, map, params = {}) => {
  const defaultOptions = getDefaultPanelOptions(control, params);
  return new ControlPanel(Timeline.NAME, {
    ...defaultOptions,
    className: 'm-control-timeline',
    collapsedButtonClass: 'g-cartografia-gestion-reloj2',
  });
};

/**
 * This method create the mapea panel control from the name control.
 * @function
 * @param {Object} control Control instance.
 * @param {Object} map Map instance.
 * @param {Object} params Additional parameters for panel creation.
 * @private
 */
export const getPanelForControl = (control, map, params = {}) => {
  const panels = {
    [Attributions.NAME]: () => getAttributionsPanel(control, map, params),
    [Scale.NAME]: () => getScalePanel(control, map, params),
    [`${Scale.NAME}*true`]: () => getScalePanel(control, map, params),
    [ScaleLine.NAME]: () => getScaleLinePanel(control, map, params),
    [MeasureBar.NAME]: () => getMeasureBarPanel(control, map, params),
    [OverviewMap.NAME]: () => getOverviewMapPanel(control, map, params),
    [Panzoombar.NAME]: () => getPanzoombarPanel(control, map, params),
    [Panzoom.NAME]: () => getPanzoomPanel(control, map, params),
    [GetFeatureInfo.NAME]: () => getGetFeatureInfo(control, map, params),
    [Location.NAME]: () => getLocationPanel(control, map, params),
    [Rotate.NAME]: () => getRotatePanel(control, map, params),
    [BackgroundLayers.NAME]: () => getBackgroundLayersPanel(control, map, params),
    [ImplementationSwitcher.NAME]: () => getImpSwitcherPanel(control, map, params),
    [Timeline.NAME]: () => getTimelinePanel(control, map, params),
    [WMCSelector.NAME]: () => getWMCSelectorPanel(control, map, params),
  };
  const controlParam = control.name;
  const builderFunction = panels[controlParam];

  return isFunction(builderFunction) ? builderFunction() : null;
};

/**
 * Infers the JS type of a raw string value coming from a URL query parameter.
 * Handles: boolean, number, JSON array ([a,b,c] or [1,2,3]), JSON object ({...}), string.
 * @private
 */
const inferValue = (rawVal) => {
  const v = rawVal.trim();
  if (v === 'true') return true;
  if (v === 'false') return false;
  // eslint-disable-next-line no-restricted-globals
  if (!isNaN(v) && v !== '') return Number(v);
  if (v.startsWith('{') && v.endsWith('}')) {
    try { return JSON.parse(v); } catch (e) { return v; }
  }
  if (v.startsWith('[') && v.endsWith(']')) {
    const inner = v.slice(1, -1);
    return inner.split(',').map((el) => {
      const e = el.trim().replace(/^['"]|['"]$/g, ''); // strip quotes
      if (e === 'true') return true;
      if (e === 'false') return false;
      // eslint-disable-next-line no-restricted-globals
      if (!isNaN(e) && e !== '') return Number(e);
      return e;
    });
  }
  return rawVal;
};

/**
 * Parses an OpenAPI key=value layer string like:
 *   'layers.0.type=WMTS&layers.0.url=http://...&layers.0.name=MTN'
 * into an object like:
 *   { type: 'WMTS', url: 'http://...', name: 'MTN' }
 * which Map.getLayerByString() can use via its switch(type) block.
 *
 * Multiple layers in a single string are not supported here — each
 * array element must correspond to one layer.
 * @private
 */
export const parseKeyValueLayer = (layerStr) => {
  const params = {};
  layerStr.split('&').forEach((pair) => {
    const eqIndex = pair.indexOf('=');
    if (eqIndex <= 0) return;
    const key = pair.substring(0, eqIndex);
    const value = pair.substring(eqIndex + 1);
    // extract the param name after the second dot: layers.0.type → type
    const parts = key.split('.');
    if (parts.length >= 3) {
      params[parts.slice(2).join('.')] = inferValue(value);
    }
  });
  return params;
};

/**
 * This method create the mapea control from its name string.
 * @function
 * @param {string|Object} controlParam Control name or control instance.
 * @param {Object} map Map instance.
 * @returns {Object} Built control instance.
 */
export const buildControl = (controlParam, map) => {
  let control = null;
  const controlNameSeparator = '*';
  const normalizedControlParams = normalize(controlParam).split(controlNameSeparator);
  const controlName = normalizedControlParams[0];

  if (isString(controlParam)) {
    const controls = {
      [Attributions.NAME]: (options) => {
        const collectionsAttributions = options.collectionsAttributions ?? [];
        // eslint-disable-next-line no-underscore-dangle, no-param-reassign
        map._attributionsMap = [...map._attributionsMap, ...collectionsAttributions];
        return new Attributions({
          ...options,
          collectionsAttributions: collectionsAttributions.map((l) => {
            if (typeof l !== 'string') {
              const attr = l;
              attr.id = l.idLayer;
              return attr;
            }
            return l;
          }),
        });
      },
      [Scale.NAME]: (options) => new Scale(options),
      [ScaleLine.NAME]: (options) => new ScaleLine(options),
      [MeasureBar.NAME]: (options) => new MeasureBar(options),
      [OverviewMap.NAME]: (options) => new OverviewMap(options),
      [Panzoombar.NAME]: (options) => new Panzoombar(options),
      [Panzoom.NAME]: (options) => new Panzoom(options),
      [Location.NAME]: (options) => new Location(options),
      [GetFeatureInfo.NAME]: (options) => new GetFeatureInfo(options),
      [Rotate.NAME]: (options) => new Rotate(options),
      [BackgroundLayers.NAME]: (options) => new BackgroundLayers(options),
      [ImplementationSwitcher.NAME]: (options) => new ImplementationSwitcher(options),
      [WMCSelector.NAME]: (options) => new WMCSelector(options),
      [Timeline.NAME]: (options) => new Timeline({
        timelineType: 'absoluteSimple',
        ...options,
      }),
    };

    const builderFunction = controls[controlName];
    if (isFunction(builderFunction)) {
      const controlParams = controlParam.split(controlNameSeparator).slice(1).join(controlNameSeparator);
      const controlOptions = parseUrlParams(controlParams, controlName);
      control = builderFunction(controlOptions);
      if (control) {
        control.builderParams = controlOptions;
      }
    } else {
      const getControlsAvailable = concatUrlPaths([IDEE.config.API_IDEE_URL, '/api/actions/controls']);
      const exceptionMessage = getValue('exception').undefined_control;
      dialog.error(`( "${controlParam}" ) ${exceptionMessage} <a href='${getControlsAvailable}' target="_blank">aquí</a>`);
    }
  } else if (controlParam instanceof Control) {
    control = controlParam;
  } else {
    Exception(`${getValue('exception').invalid_control} ( ${controlParam} )`);
  }

  return control;
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
