/**
 * @module IDEE/impl/control/Rotate
 */
import Control from './Control';

/**
 * @typedef {module:IDEE/impl/Control~Options} module:IDEE/impl/control/Rotate~Options
 * @api
 */

/**
 * @classdesc
 * Hereda de {@link module:IDEE/impl/control/Control|Control}.
 * Agrega la funcionalidad para rotar el mapa de manera que el norte apunte hacia arriba.
 * Proporciona una brújula interactiva que permite rotar el mapa.
 *
 * @api
 * @extends {module:IDEE/impl/control/Control}
 */
class Rotate extends Control {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {module:IDEE/impl/control/Rotate~Options} options Opciones del control.
   * @api stable
   */
  constructor(options) {
    super(options);

    this.facadeMap_ = null;
  }

  /**
   * Este método añade el control al mapa.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Map.
   * @param {function} template Plantilla del control.
   * @param {HTML} parentContainer Plantilla del mapa que contiene este control.
   * @api stable
   */
  addTo(map, template) {
    super.addTo(map, template);
    const olMap = map.getMapImpl();
    this.olMap = olMap;
    // panel
    this.panel = template;
    // REV_OL
    // El funcionamiento por defecto en OL es mostrar el control oculto
    // En api-idee por defecto vamos a mostrar si alguien lo pone se interpreta
    // que es para usarlo en un contexto de uso para su visualización sobre el mapa
    // if (this.parentContainer) {
    // this.panel.style.display = 'none';
    // }
    this.panel.querySelector('button').addEventListener('click', () => {
      this.resetRotation();
    });

    this.addRotationEvent(olMap);

    olMap.on('change:view', (e) => {
      this.addRotationEvent(e.target);
    });
  }

  /**
   * Gira el icono junto con la vista.
   * @public
   * @function
   * @api
   * @param {ol.Map} olMap Mapa de OpenLayers.
   */
  addRotationEvent(olMap) {
    olMap.getView().on('change:rotation', (ev) => {
      const newView = ev.target;
      const rotation = newView.getRotation();
      const iconRotation = `rotate(${(rotation * 360) / (2 * Math.PI)}deg)`;
      this.panel.querySelector('button').style.transform = iconRotation;
    });
  }

  /**
   * Retorna los elementos del control.
   *
   * @public
   * @function
   * @api stable
   */
  getElement() {
    return this.element;
  }

  /**
   * Esta función destruye este control, limpiando el HTML y anula el registro de todos los eventos.
   *
   * @public
   * @function
   * @api stable
   * @export
   */
  destroy() {
    this.facadeMap_.getMapImpl().removeControl(this);
    this.facadeMap_ = null;
  }

  /**
   * Restaura la rotación del mapa a 0.
   *
   * @public
   * @function
   * @api
   */
  resetRotation() {
    this.olMap.getView().setRotation(0);
  }

  /**
   * TODO:
   */
  onChangeView(html) {
    const marker = html.querySelector('#m-rotate-marker');
    this.olMap.on('change:view', (e) => {
      e.target.getView().on('change:rotation', (ev) => {
        const newView = ev.target;
        const rotation = newView.getRotation();
        marker.style.transform = `rotate(${(rotation * (180 / Math.PI)) + 45}deg)`;
      });
    });
  }
}

/**
 * ID del panel.
 * @const
 * @type {string}
 * @public
 * @api stable
 */
Rotate.PANEL_ID = 'm-rotate-panel';

export default Rotate;
