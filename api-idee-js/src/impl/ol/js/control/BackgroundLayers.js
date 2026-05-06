/**
 * @module IDEE/impl/control/BackgroundLayers
 */

import { isNullOrEmpty } from 'IDEE/util/Utils';
import WMS from 'IDEE/layer/WMS';
import WMTS from 'IDEE/layer/WMTS';
import TMS from 'IDEE/layer/TMS';
import Control from './Control';
import { getQuickLayers } from '../../../../facade/js/api-idee';

/**
 * @typedef {Object} module:IDEE/impl/control/BackgroundLayers~Options
 * @api
 */

/**
 * Esta constante indica el número máximo de capas base que tendrá el control.
 *
 * @type {number}
 * @const
 * @public
 */
const MAXIMUM_LAYERS = 5;

/**
 * @classdesc
 * Control selector de capas base. Hereda de {@link module:IDEE/impl/control/Control|Control}.
 * Permite al usuario cambiar entre diferentes capas base disponibles en el mapa.
 * @property {Array<Layer>} layers Proviene de "IDEE.config.backgroundlayers".
 * @extends {module:IDEE/impl/control/Control}
 * @api
 */
class BackgroundLayers extends Control {
  /**
   * Constructor principal de la clase.
   * Crea las interacciones con el mapa para cambiar las capas base seleccionadas.
   *
   * @constructor
   * @param {module:IDEE/impl/control/BackgroundLayers~Options} options Opciones del control.
   * @example
   * const control = new IDEE.impl.ol.control.BackgroundLayers();
   * @property {Array<Layer>} layers Proviene de "IDEE.config.backgroundlayers".
   * @extends {IDEE.impl.Control}
   * @api stable
   */

  constructor(options = {}) {
    super(options);

    /**
     * Control layers, proviene de "IDEE.config.backgroundlayers".
     */
    this.layers = null;
  }

  /**
   * Este método añade el control al mapa.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @param {HTML} template Plantilla del control.
   * @api stable
   * @export
   */
  addTo(map, template) {
    this.facadeMap_ = map;
    this.element = template;
    if (isNullOrEmpty(this.layers)) this.setLayers();
    map.getMapImpl().addControl(this);
  }

  setLayers() {
    this.layers = IDEE.config.backgroundlayers.slice(0, MAXIMUM_LAYERS).map((layer) => {
      return {
        id: layer.id,
        title: layer.title,
        layers: layer.layers.map((subLayer) => {
          let l = subLayer;
          if (typeof subLayer === 'string') {
            if (/QUICK.*/.test(subLayer)) {
              l = getQuickLayers(subLayer.replace('QUICK*', ''));
            }
            if (typeof l === 'string') {
              if (/WMTS.*/.test(l)) {
                l = new WMTS(l);
              } else if (/TMS.*/.test(l)) {
                l = new TMS(l);
              } else {
                l = new WMS(l);
              }
            }
          }
          return l;
        }),
      };
    });
  }
}

export default BackgroundLayers;
