/**
 * @module IDEE/impl/Control
 */
import OLControl from 'ol/control/Control';
import Exception from '../../../../facade/js/exception/exception';
import * as Dialog from '../../../../facade/js/dialog';
import * as Position from '../../../../facade/js/ui/position';

/**
 * @classdesc
 * Es la clase de la que heredan todos los controles de la implementación,
 * crea el "OLControl".
 * @api
 */
class Control extends OLControl {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @extends {OLControl}
   * @api stable
   */
  constructor() {
    super({});
    /**
     * @private
     * @type {string}
     * @expose
     */
    this.facadeMap_ = null;

    this.panel_ = null;
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
    // this.addViewToMap(map, this.element);

    map.getMapImpl().addControl(this);
  }

  /**
   * Este método añade la vista del control al mapa
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa.
   * @param {HTML} template Plantilla del control.
   * @api stable
   * @export
   */
  addViewToMap(map, template = this.element) {
    const controlName = Object.getPrototypeOf(this).constructor.name;

    try {
      switch (this.facadeMap_.panels.find((panel) => panel.name === controlName).position) {
        case Position.LEFT:
          this.panel_ = map.leftButtons;
          break;

        case Position.RIGHT:
          this.panel_ = map.rightButtons;
          break;

        case Position.DOWN:
          this.panel_ = map.downPanel;
          break;

        case Position.TL:
          this.panel_ = map.upPanelTopLeft;
          break;

        case Position.TR:
          this.panel_ = map.upPanelTopRight;
          break;

        case Position.BL:
          this.panel_ = map.upPanelBottomLeft;
          break;

        case Position.BR:
          this.panel_ = map.upPanelBottomRight;
          break;

        default:
          Dialog.info(`Posición no soportada para el control ${Object.getPrototypeOf(this).constructor.name}`);
          break;
      }
      this.panel_.appendChild(template);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(err.message);
      Exception(err.message);
    }
  }

  /**
   * Este método destruye este control, limpiando el HTML
   * y anulando el registro de todos los eventos.
   *
   * @public
   * @function
   * @api stable
   * @export
   */
  destroy() {
    this.facadeMap_.getMapImpl().removeControl(this);
    this.panel_.remove(this.element);
    this.facadeMap_ = null;

    // eslint-disable-next-line no-console
    console.log('vaya');
  }

  /**
   * Este método retorna los elementos.
   *
   * @public
   * @function
   * @returns {HTMLElement} Elementos.
   * @api stable
   * @export
   */
  getElement() {
    return this.element;
  }
}

export default Control;
