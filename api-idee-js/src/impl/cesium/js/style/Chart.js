/**
 * @module IDEE/impl/style/Chart
 */
import { getValue } from 'IDEE/i18n/language';
import FacadeChart from 'IDEE/style/Chart';
import Generic from './Generic';
import { chartAsLabeledPoints, createOnceWarner } from '../../../common/scene/degradedStyles';

// eslint-disable-next-line no-console
const warnOnce = createOnceWarner((message) => console.warn(message));

/**
 * @classdesc
 * Gráfico en Cesium, simplificado: cada objeto geográfico se dibuja como un punto con
 * el primer color del esquema y una etiqueta con los valores de sus variables.
 *
 * @api
 * @extends {IDEE.impl.style.Generic}
 */
class Chart extends Generic {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Object} options Opciones del gráfico (variables, scheme, radius...).
   * @api
   */
  constructor(options = {}) {
    super(options);
    warnOnce('chart', getValue('exception').chart_degraded);
  }

  /**
   * Este método traduce las opciones del gráfico a las de un estilo genérico.
   *
   * @public
   * @function
   * @param {Object} options Opciones del gráfico.
   * @api
   */
  updateFacadeOptions(options = {}) {
    super.updateFacadeOptions(chartAsLabeledPoints({
      variables: options.variables,
      scheme: options.scheme,
      radius: Number(options.radius) || FacadeChart.DEFAULT.radius,
    }));
  }
}

export default Chart;
