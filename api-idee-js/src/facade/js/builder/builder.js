/**
 * @module IDEE/facade/builder
 */
import {
  isUndefined, isNullOrEmpty, isFunction, isString, concatUrlPaths, normalize,
} from 'IDEE/util/Utils';
import ControlPanel from '../ui/ControlPanel';
import * as Position from '../ui/position';
import * as EventType from '../event/eventtype';
import { getValue } from '../i18n/language';
import Control from '../control/Control';
import GetFeatureInfo from '../control/GetFeatureInfo';
import Location from '../control/Location';
import Scale from '../control/Scale';
import Rotate from '../control/Rotate';
import ScaleLine from '../control/ScaleLine';
import Panzoom from '../control/Panzoom';
import Panzoombar from '../control/Panzoombar';
import BackgroundLayers from '../control/BackgroundLayers';
import WMCSelector from '../control/WMCSelector';
import Attributions from '../control/Attributions';
import ImplementationSwitcher from '../control/ImplementationSwitcher';
import * as dialog from '../dialog';
import Exception from '../exception/exception';

/**
 * Esta función devuelve el panel para el control Scale.
 *
 * @public
 * @function
 *
 * @param {Object} map Mapa.
 * @param {Object} params Parámetros del control.
 *
 * @return {Object} Devuelve el panel del control Scale.
 * @api stable
 */
export const getScalePanel = (control, map, params = {}) => {
  let panel = map.getPanels('map-info')[0];
  if (isNullOrEmpty(panel)) {
    panel = new ControlPanel('map-info', {
      collapsible: false,
      className: 'm-map-info',
      position: params.position ?? control.position ?? Position.DOWN,
      order: params.order ?? control.order ?? null,
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
export const getScaleLinePanel = (control, map, params = {}) => {
  const panel = new ControlPanel('scaleline', {
    tooltip: 'Línea de escala',
    collapsible: false,
    className: 'm-scaleline',
    position: params.position ?? control.position,
    order: params.order ?? control.order ?? null,
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
export const getPanzoombarPanel = (control, map, params = {}) => {
  return new ControlPanel('panzoombar', {
    tooltip: 'Nivel de zoom',
    collapsible: false,
    className: 'm-panzoombar',
    position: params.position ?? control.position,
    order: params.order ?? control.order ?? null,
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
export const getPanzoomPanel = (control, map, params = {}) => {
  return new ControlPanel('panzoom', {
    collapsible: false,
    className: 'm-panzoom',
    position: params.position ?? control.position,
    order: params.order ?? control.order ?? null,
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
export const getAttributionsPanel = (control, map, params = {}) => {
  return new ControlPanel('attributions', {
    collapsible: true,
    position: params.position ?? control.position ?? Position.LEFT,
    className: 'm-attributions',
    collapsedButtonClass: 'g-cartografia-comentarios',
    // tooltip: tooltip || getValue('attributionsControl').tooltip,
    tooltip: params.tooltip ?? control.tooltip ?? getValue('attributionsControl').tooltip,
    order: params.order ?? control.order ?? null,
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
export const getLocationPanel = (control, map, params = {}) => {
  return new ControlPanel('location', {
    collapsible: false,
    className: 'm-location',
    position: params.position ?? control.position,
    order: params.order ?? control.order ?? null,
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
export const getRotatePanel = (control, map, params = {}) => {
  return new ControlPanel('rotate', {
    collapsible: false,
    className: 'm-rotate',
    position: params.position ?? control.position,
    order: params.order ?? control.order ?? null,
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
export const getBackgroundLayersPanel = (control, map, params = {}) => {
  return new ControlPanel('backgroundlayers', {
    collapsible: false,
    className: 'm-plugin-baselayer',
    position: params.position ?? control.position,
    order: params.order ?? control.order ?? null,
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
export const getImplementationSwitcherPanel = (control, map, params = {}) => {
  return new ControlPanel('implementationswitcher', {
    collapsible: true,
    collapsedButtonClass: 'g-cartografia-implementacion',
    tooltip: getValue('implementationswitcher').title,
    className: 'm-implementationswitcher',
    position: params.position ?? control.position,
    order: params.order ?? control.order ?? null,
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
export const getWMCSelectorPanel = (control, map, params = {}) => {
  let panel = map.getPanels('map-info')[0];
  if (isNullOrEmpty(panel)) {
    panel = new ControlPanel('map-info', {
      collapsible: false,
      className: 'm-map-info',
      position: params.position ?? control.position,
      order: params.order ?? control.order ?? null,
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
    [Panzoombar.NAME]: () => getPanzoombarPanel(control, map, params),
    [Panzoom.NAME]: () => getPanzoomPanel(control, map, params),
    [GetFeatureInfo.NAME]: () => null, // GetFeatureInfo doesn't use panel
    [Location.NAME]: () => getLocationPanel(control, map, params),
    // [Attributions.NAME]: () => null, // Attributions handled via map.createAttribution
    // Attributions handled via map.createAttribution
    [Attributions.NAME]: () => getAttributionsPanel(control, map, params),
    [Rotate.NAME]: () => getRotatePanel(control, map, params),
    [BackgroundLayers.NAME]: () => getBackgroundLayersPanel(control, map, params),
    [ImplementationSwitcher.NAME]: () => getImplementationSwitcherPanel(control, map, params),
    [WMCSelector.NAME]: () => getWMCSelectorPanel(control, map, params),
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
      [GetFeatureInfo.NAME]: () => new GetFeatureInfo(true),
      /*
      [Attributions.NAME]: () => {
        // Attributions handled separately via map.createAttribution
        if (normalizedControl.length === 2) {
          map.createAttribution({ collectionsAttributions: [normalizedControl[1]] });
        } else {
          map.createAttribution();
        }
        return null;
      },
      */
      [Attributions.NAME]: () => new Attributions({
        // map: this,
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
