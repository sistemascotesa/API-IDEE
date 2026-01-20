/**
 * @module IDEE/facade/builder
 */
import {
  isUndefined, isNullOrEmpty, isFunction, isString, concatUrlPaths, normalize,
} from 'IDEE/util/Utils';
import ControlPanel from '../ui/ControlPanel';
import * as EventType from '../event/eventtype';
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

/**
 * Esta función devuelve el panel para el control Scale.
 *
 * @public
 * @function
 *
 * @param {Object} control Control.
 * @param {Object} map Mapa.
 * @param {Object} params Parámetros del control.
 * @param {Object} defaultOptions Parámetros por defecto para el panel
 *
 * @return {Object} Devuelve el panel del control Scale.
 * @api stable
 */
export const getScalePanel = (control, map, params = {}, defaultOptions = {}) => {
  let panel = map.getPanels('map-info')[0];
  if (isNullOrEmpty(panel)) {
    panel = new ControlPanel('map-info', {
      ...defaultOptions,
      collapsible: false,
      className: 'm-map-info',
    });
    panel.on(EventType.ADDED_TO_MAP, () => {
      if (map.getControls(['wmcselector', 'scale', 'scaleline']).length === 3) {
        map.getControls(['scaleline'])[0].getImpl().getElement().classList.add('ol-scale-line-up');
      }
    });
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
 * @param {Object} map Mapa.
 *
 * @return {Object} Devuelve el panel del control ScaleLine.
 * @api stable
 */
export const getScaleLinePanel = (control, map, params = {}, defaultOptions = {}) => {
  const panel = new ControlPanel('scaleline', {
    ...defaultOptions,
    tooltip: 'Línea de escala',
    collapsible: false,
    className: 'm-scaleline',
  });
  panel.on(EventType.ADDED_TO_MAP, () => {
    if (map.getControls(['wmcselector', 'scale', 'scaleline']).length === 3) {
      map.getControls(['scaleline'])[0].getImpl().getElement().classList.add('ol-scale-line-up');
    }
  });
  return panel;
};

/**
 * Esta función devuelve el panel para el control Panzoombar.
 *
 * @public
 * @function
 *
 * @return {Object} Devuelve el panel del control Panzoombar.
 * @api stable
 */
export const getPanzoombarPanel = (control, map, params = {}, defaultOptions = {}) => {
  return new ControlPanel('panzoombar', {
    tooltip: 'Nivel de zoom',
    collapsible: false,
    className: 'm-panzoombar',
  });
};

/**
 * Esta función devuelve el panel para el control Panzoom.
 *
 * @public
 * @function
 *
 * @return {Object} Devuelve el panel del control Panzoom.
 * @api stable
 */
export const getPanzoomPanel = (control, map, params = {}, defaultOptions = {}) => {
  return new ControlPanel('panzoom', {
    collapsible: false,
    className: 'm-panzoom',
  });
};

/**
 * Esta función devuelve el panel para el control GetFeatureInfo.
 *
 * @public
 * @function
 *
 * @return {Object} Devuelve el panel del control GetFeatureInfo.
 * @api stable
 */
export const getGetFeatureInfo = (control, map, params = {}, defaultOptions = {}) => {
  return new ControlPanel('getfeatureinfo', {
    ...defaultOptions,
    collapsible: false,
    className: 'm-getfeatureinfo',
    collapsedButtonClass: 'g-cartografia-featureInfo',
    tooltip: params.tooltip ?? control.tooltip ?? getValue('getfeatureinfo').tooltip,
  });
};

/**
 * Esta función devuelve el panel para el control Attributions.
 *
 * @public
 * @function
 *
 * @return {Object} Devuelve el panel del control Attributions.
 * @api stable
 */
export const getAttributionsPanel = (control, map, params = {}, defaultOptions = {}) => {
  return new ControlPanel('attributions', {
    ...defaultOptions,
    collapsible: true,
    className: 'm-attributions',
    collapsedButtonClass: 'g-cartografia-comentarios',
    tooltip: params.tooltip ?? control.tooltip ?? getValue('attributionsControl').tooltip,
  });
};

/**
 * Esta función devuelve el panel para el control Location.
 *
 * @public
 * @function
 *
 * @return {Object} Devuelve el panel del control Location.
 * @api stable
 */
export const getLocationPanel = (control, map, params = {}, defaultOptions = {}) => {
  return new ControlPanel('location', {
    collapsible: false,
    className: 'm-location',
  });
};

/**
 * Esta función devuelve el panel para el control Rotate.
 *
 * @public
 * @function
 *
 * @param {Object} params Parámetros del control.
 *
 * @return {Object} Devuelve el panel del control Rotate.
 * @api stable
 */
export const getRotatePanel = (control, map, params = {}, defaultOptions = {}) => {
  return new ControlPanel('rotate', {
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
 * @return {Object} Devuelve el panel del control BackgroundLayers.
 * @api stable
 */
export const getBackgroundLayersPanel = (control, map, params = {}, defaultOptions = {}) => {
  return new ControlPanel('backgroundlayers', {
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
 * @return {Object} Devuelve el panel del control ImplementationSwitcher.
 * @api stable
 */
export const getImpSwitcherPanel = (control, map, params = {}, defaultOptions = {}) => {
  return new ControlPanel('implementationswitcher', {
    collapsible: true,
    collapsedButtonClass: 'g-cartografia-implementacion',
    tooltip: getValue('implementationswitcher').title,
    className: 'm-implementationswitcher',
  });
};

/**
 * Esta función devuelve el panel para el control WMCSelector.
 *
 * @public
 * @function
 *
 * @param {Object} map Mapa.
 *
 * @return {Object} Devuelve el panel del control WMCSelector.
 * @api stable
 */
export const getWMCSelectorPanel = (control, map, params = {}, defaultOptions = {}) => {
  let panel = map.getPanels('map-info')[0];
  if (isNullOrEmpty(panel)) {
    panel = new ControlPanel('map-info', {
      ...defaultOptions,
      collapsible: false,
      className: 'm-map-info',
    });
    panel.on(EventType.ADDED_TO_MAP, () => {
      if (map.getControls(['wmcselector', 'scale', 'scaleline']).length === 3) {
        map.getControls(['scaleline'])[0].getImpl().getElement().classList.add('ol-scale-line-up');
      }
    });
  }
  panel.addClassName('m-with-wmcselector');
  return panel;
};

/**
 * Esta función devuelve el panel para el control de línea de tiempo
 *
 * @public
 * @function
 *
 * @param {Object} control Control.
 * @param {Object} map Mapa.
 * @param {Object} params Parámetros del control.
 *
 * @return {Object} Devuelve el panel del control Timeline.
 * @api stable
 */
export const getTimelinePanel = (control, map, params = {}, defaultOptions = {}) => {
  return new ControlPanel('timeline', {
    ...defaultOptions,
    collapsible: true,
    className: 'm-control-timeline',
    collapsedButtonClass: 'g-cartografia-gestion-reloj2',
    tooltip: params.tooltip ?? getValue('timeline').tooltip,
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
  const defaultOptions = {
    order: params.order ?? control.order ?? null,
    position: params.position ?? control.position,
  };
  const panels = {
    [Scale.NAME]: () => getScalePanel(control, map, params, defaultOptions),
    [`${Scale.NAME}*true`]: () => getScalePanel(control, map, params, defaultOptions),
    [ScaleLine.NAME]: () => getScaleLinePanel(control, map, params, defaultOptions),
    [Panzoombar.NAME]: () => getPanzoombarPanel(control, map, params, defaultOptions),
    [Panzoom.NAME]: () => getPanzoomPanel(control, map, params, defaultOptions),
    [GetFeatureInfo.NAME]: () => null,
    [Location.NAME]: () => getLocationPanel(control, map, params, defaultOptions),
    [Attributions.NAME]: () => getAttributionsPanel(control, map, params, defaultOptions),
    [Rotate.NAME]: () => getRotatePanel(control, map, params, defaultOptions),
    [BackgroundLayers.NAME]: () => getBackgroundLayersPanel(control, map, params, defaultOptions),
    [ImplementationSwitcher.NAME]: () => getImpSwitcherPanel(control, map, params, defaultOptions),
    [Timeline.NAME]: () => getTimelinePanel(control, map, params, defaultOptions),
    [WMCSelector.NAME]: () => getWMCSelectorPanel(control, map, params, defaultOptions),
  };
  const controlParam = control.name;
  const builderFunction = panels[controlParam];

  return isFunction(builderFunction) ? builderFunction() : null;
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
    const normalizedControlParams = normalize(controlParam).split('*');
    const controlName = normalizedControlParams[0];

    const controls = {
      [Scale.NAME]: () => {
        normalizedControlParams.forEach((p) => {
          if (p === 'true') params.exactScale = true;
          // eslint-disable-next-line no-restricted-globals
          if (!isNaN(p)) params.order = Number(p);
        });
        return new Scale(params);
      },
      [ScaleLine.NAME]: () => new ScaleLine(),
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
      [Attributions.NAME]: () => new Attributions({
        map,
        scale: undefined,
        collectionsAttributions: normalizedControlParams.length === 2
          ? [normalizedControlParams[1]].map((l) => {
            if (typeof l !== 'string') {
              const attr = l;
              attr.id = l.idLayer;
              return attr;
            }
            return l;
          }) : [],
        order: undefined,
      }),
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
          return new BackgroundLayers(map, {
            visible,
            idLayer: Number.parseInt(idLayer, 10),
          });
        }
        return new BackgroundLayers(map);
      },
      [ImplementationSwitcher.NAME]: () => new ImplementationSwitcher(),
      [WMCSelector.NAME]: () => new WMCSelector(),
      [Timeline.NAME]: () => new Timeline({
        timelineType: 'absoluteSimple',
      }),
    };

    const builderFunction = controls[controlName];
    if (isFunction(builderFunction)) {
      builtControl = builderFunction();
      if (builtControl) {
        builtControl.builderParams = params; // Store params for panel creation
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
