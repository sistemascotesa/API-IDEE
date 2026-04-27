/* eslint-disable max-len */
/* eslint-disable no-nested-ternary */
/**
 * @module IDEE/facade/builder
 */
import {
  isUndefined, isNullOrEmpty, isFunction, isString, concatUrlPaths, normalize,
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
import { decodeBase64Utf8, isBoolean, isNumber } from '../util/Utils';
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
  tooltip: control.translation ? control.translation.title : (params.tooltip ?? null),
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
    [Scale.NAME]: () => getScalePanel(control, map, params),
    [`${Scale.NAME}*true`]: () => getScalePanel(control, map, params),
    [ScaleLine.NAME]: () => getScaleLinePanel(control, map, params),
    [MeasureBar.NAME]: () => getMeasureBarPanel(control, map, params),
    [OverviewMap.NAME]: () => getOverviewMapPanel(control, map, params),
    [Panzoombar.NAME]: () => getPanzoombarPanel(control, map, params),
    [Panzoom.NAME]: () => getPanzoomPanel(control, map, params),
    [GetFeatureInfo.NAME]: () => getGetFeatureInfo(control, map, params),
    [Location.NAME]: () => getLocationPanel(control, map, params),
    [Attributions.NAME]: () => getAttributionsPanel(control, map, params),
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
 * Intelligently parses a value based on its content.
 * Supports: boolean, number, JSON (object/array), base64-encoded values, and strings.
 * If a value starts with 'base64~', it will be decoded and recursively parsed.
 * @private
 * @function
 * @param {string} rawValue The raw value to parse.
 * @param {string} paramKey The parameter key for error messages.
 * @param {string} controlName The control name for error messages.
 * @returns {*} Parsed value with detected type.
 */
const parseValueByType = (rawValue, paramKey, controlName) => {
  if (!rawValue) return rawValue;
  const value = rawValue.trim();
  if (value.startsWith('base64~')) {
    try {
      const encoded = value.substring(7);
      const decoded = decodeBase64Utf8(encoded);
      return parseValueByType(decoded, paramKey, controlName);
    } catch (e) {
      dialog.error(getValue('exception').parseControlParamError
        .replace('{param}', paramKey)
        .replace('{control}', controlName)
        .replace('{error}', getValue('exception').invalidBase64Encoding));
      return null;
    }
  }

  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }

  if (value !== '') {
    const numValue = Number(value);
    if (!Number.isNaN(numValue)) {
      return numValue;
    }
  }

  const trimmed = value.trim();
  if ((trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
    try {
      return JSON.parse(trimmed);
    } catch (e) {
      dialog.error(getValue('exception').parseControlParamError
        .replace('{param}', paramKey)
        .replace('{control}', controlName)
        .replace('{error}', getValue('exception').invalidJsonFormat));
      return value;
    }
  }

  return value;
};

/**
 * Parses control parameters from a string with automatic type detection.
 * No longer requires allowedAttributes - intelligently detects types from values.
 * Supports: boolean (true/false), numbers, JSON (objects/arrays), base64-encoded values, and strings.
 * Base64 encoding is indicated by 'base64~' prefix.
 *
 * Default separators: semicolon (;) for fields, equals (=) for key-value pairs.
 * These separators are chosen to minimize conflicts with JSON syntax.
 *
 * @function
 * @param {string} stringToParse The string to parse (e.g., "collapsed=false;position=right").
 * @param {string} controlName The name of the control for error messages.
 * @param {string} fieldSeparator Separator for fields (default ';').
 * @param {string} keyValueSeparator Separator for key-value pairs (default '=').
 * @returns {Object} Parsed options object.
 */
export const parseControlParams = (stringToParse, controlName, fieldSeparator = ';', keyValueSeparator = '=') => {
  const result = {};
  if (!stringToParse) return result;

  const fields = stringToParse.split(fieldSeparator);
  fields.forEach((field) => {
    const parts = field.split(keyValueSeparator, 2);
    if (parts.length === 2) {
      const [key, rawValue] = parts;
      if (key && rawValue) {
        result[key] = parseValueByType(rawValue, key, controlName);
      }
    }
  });
  return result;
};

/**
 * This method create the mapea control from its name string.
 * @function
 * @param {string|Object} controlParam Control name or control instance.
 * @param {Object} map Map instance.
 * @returns {Object} Built control instance.
 */
export const buildControl = (controlParam, map) => {
  let builtControl = null;
  const params = {};

  if (isString(controlParam)) {
    const controlNameSeparator = '*';
    const normalizedControlParams = normalize(controlParam).split(controlNameSeparator);
    const controlName = normalizedControlParams[0];
    const controlParams = controlParam.split(controlNameSeparator).slice(1).join(controlNameSeparator);

    const controls = {
      [Attributions.NAME]: () => {
        // eslint-disable-next-line no-underscore-dangle, no-param-reassign
        map._attributionsMap = [...map._attributionsMap, ...normalizedControlParams];
        return new Attributions({
          map,
          collectionsAttributions: normalizedControlParams.length === 2
            ? [normalizedControlParams[1]].map((l) => {
              if (typeof l !== 'string') {
                const attr = l;
                attr.id = l.idLayer;
                return attr;
              }
              return l;
            }) : [],
        });
      },
      [Scale.NAME]: () => {
        normalizedControlParams.forEach((p) => {
          if (p === 'true') params.exactScale = true;
          // eslint-disable-next-line no-restricted-globals
          if (!isNaN(p)) params.order = Number(p);
        });
        return new Scale(params);
      },
      [ScaleLine.NAME]: () => new ScaleLine(),
      [MeasureBar.NAME]: () => new MeasureBar(),
      [OverviewMap.NAME]: () => new OverviewMap(),
      [Panzoombar.NAME]: () => new Panzoombar(),
      [Panzoom.NAME]: () => new Panzoom(),
      [Location.NAME]: () => new Location(),
      // [GetFeatureInfo.NAME]: () => new GetFeatureInfo(true),
      [GetFeatureInfo.NAME]: () => {
        let activated = true;
        // Si el usuario define false...
        if (normalizedControlParams.includes('false')) {
          activated = false;
        }
        return new GetFeatureInfo({
          activated,
        });
      },
      [Rotate.NAME]: () => {
        normalizedControlParams.forEach((p) => {
          if (!isUndefined(p)) {
            const bbox = p.split(',');
            if (bbox.length === 4) {
              params.viewInitial = bbox;
            }
            if (p === 'false') params.help = false;
            // eslint-disable-next-line no-restricted-globals
            if (!isNaN(p)) params.order = Number(p);
          }
        });
        return new Rotate(params);
      },
      [BackgroundLayers.NAME]: () => {
        // Check for special pattern: backgroundlayers*[0-9]*true|false
        if (/backgroundlayers\*([0-9])+\*(true|false)/.test(controlParam)) {
          const idLayer = controlParam.match(/backgroundlayers\*([0-9])+\*(true|false)/)[1];
          const visible = controlParam.match(/backgroundlayers\*([0-9])+\*(true|false)/)[2] === 'true';
          return new BackgroundLayers({
            visible,
            idLayer: Number.parseInt(idLayer, 10),
          });
        }
        return new BackgroundLayers();
      },
      [ImplementationSwitcher.NAME]: () => new ImplementationSwitcher(),
      [WMCSelector.NAME]: () => new WMCSelector(),
      [Timeline.NAME]: () => {
        const parsedOptions = parseControlParams(controlParams, controlName);
        // eslint-disable-next-line no-console
        // console.log(parsedOptions);
        return new Timeline({
          timelineType: 'absoluteSimple',
          ...parsedOptions,
        });
      },
    };

    const builderFunction = controls[controlName];
    if (isFunction(builderFunction)) {
      builtControl = builderFunction();
      if (builtControl) {
        builtControl.builderParams = params;
      }
    } else {
      const getControlsAvailable = concatUrlPaths([IDEE.config.API_IDEE_URL, '/api/actions/controls']);
      const exceptionMessage = getValue('exception').undefined_control;
      dialog.error(`( "${controlParam}" ) ${exceptionMessage} <a href='${getControlsAvailable}' target="_blank">aquí</a>`);
    }
  } else if (controlParam instanceof Control) {
    builtControl = controlParam;
  } else {
    Exception(`${getValue('exception').invalid_control} ( ${controlParam} )`);
  }

  return builtControl;
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
