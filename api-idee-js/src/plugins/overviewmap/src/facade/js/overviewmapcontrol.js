/**
 * @module IDEE/control/OverviewMapControl
 */

import OverviewMapImplControl from 'impl/overviewmapcontrol';
// import template from 'templates/overviewmap';
import { getValue } from './i18n/language';

class OverviewMapControl extends IDEE.Control {
  /**
   * @classdesc
   * Main constructor of the class. Creates a PluginControl
   * control
   *
   * @constructor
   * @extends {IDEE.Control}
   * @api stable
   */
  constructor(options = {}, vendorOptions = {}) {
    if (IDEE.utils.isUndefined(OverviewMapImplControl)
      || (IDEE.utils.isObject(OverviewMapImplControl)
      && IDEE.utils.isNullOrEmpty(Object.keys(OverviewMapImplControl)))) {
      IDEE.exception(getValue('exception.impl'));
    }
    const impl = new OverviewMapImplControl(options, vendorOptions);
    super('OverviewMap', impl, {});

    impl.facadeControl = this;
  }

  /**
   * This function creates the view
   *
   * @public
   * @function
   * @param {IDEE.Map} map to add the control
   * @api stable
   */
  createView(map) {
    return new Promise((success, fail) => {
      const html = this.getImpl().getView();
      console.log('Vista obtenida de la impl:', html);
      // const html = IDEE.template.compileSync(template);
      success(html);
    });
  }

  /**
   * Este método es el que busca Map.js para insertar el control en el DOM
   */
  getView() {
    // Le pedimos a la implementación de OpenLayers su elemento real
    return this.getImpl().getView();
  }

  /**
   * This function compares controls
   *
   * @public
   * @function
   * @param {IDEE.Control} control to compare
   * @api stable
   */
  equals(control) {
    return control instanceof OverviewMapControl;
  }

  destroy() {
    this.getImpl().destroy();
  }
}

OverviewMapControl.NAME = 'overviewmap';

export default OverviewMapControl;
