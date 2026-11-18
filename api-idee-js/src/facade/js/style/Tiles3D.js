/**
 * @module IDEE/style/Tiles3D
 */
import Tiles3DImpl from 'impl/style/Tiles3D';
import Style from './Style';
import { stringifyFunctions } from '../util/Utils';

/**
 * @classdesc
 * Estilo para capas 3D Tiles.
 * @api
 * @extends {IDEE.style}
 */
class Tiles3D extends Style {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {Mx.Tiles3DStyleOptions} optionsParam Opciones del estilo.
   * - color: Nombre del color (p. ej. 'red'), expresión 3D Tiles
   *   (p. ej. '(${Temperature} > 90) ? color("red") : color("white")')
   *   u objeto con conditions (p. ej.
   *   { conditions: [['${height} > 2', 'color("cyan")'], ['true', 'color("blue")']] }).
   * - show: Booleano, expresión 3D Tiles (p. ej. '${Height} > 0')
   *   u objeto con conditions (p. ej.
   *   { conditions: [['${height} > 2', 'false'], ['true', 'true']] }).
   * - pointSize: Número, expresión 3D Tiles o objeto con conditions (nubes de puntos).
   * - pointOutlineColor, labelColor, labelOutlineColor, backgroundColor, anchorLineColor:
   *   Colores, con el mismo formato que color.
   * - backgroundEnabled, anchorLineEnabled: Booleanos o expresiones, como show.
   * - pointOutlineWidth, labelOutlineWidth, font, labelStyle, labelText, backgroundPadding,
   *   scaleByDistance, translucencyByDistance, distanceDisplayCondition, heightOffset, image,
   *   disableDepthTestDistance, horizontalOrigin, verticalOrigin, labelHorizontalOrigin,
   *   labelVerticalOrigin: Expresiones 3D Tiles de Cesium3DTileStyle.
   * - defines: Expresiones con nombre reutilizables en el resto de propiedades.
   * - meta: Expresiones de metadatos de cada objeto.
   * Las propiedades desconocidas se ignoran.
   * @param {Object} vendorOptionsParam Opciones de la biblioteca base.
   * @api
   */
  constructor(optionsParam = {}, vendorOptionsParam = {}) {
    const options = { ...optionsParam };
    const vendorOptions = vendorOptionsParam;

    const impl = new Tiles3DImpl(options, vendorOptions);
    super(options, impl);

    /**
     * @private
     * @type {Mx.Tiles3DStyleOptions}
     */
    this.options_ = options;

    /**
     * @private
     * @type {Object}
     */
    this.vendorOptions_ = vendorOptions;
  }

  /**
   * Devuelve las opciones del estilo.
   *
   * @function
   * @public
   * @returns {Mx.Tiles3DStyleOptions} Opciones del estilo.
   * @api
   */
  getOptions() {
    return { ...this.options_ };
  }

  /**
   * Deserializa el método IDEE.style.Simple.deserialize.
   * - ⚠️ Advertencia: Este método no debe ser llamado por el usuario.
   * @function
   * @public
   * @return {Function} Devuelve la función IDEE.style.Simple.deserialize.
   * @api
   */
  getDeserializedMethod_() {
    return "((serializedParameters) => IDEE.style.Simple.deserialize(serializedParameters, 'IDEE.style.Tiles3D'))";
  }

  /**
   * Este método genera el JSON de esta instancia, con las opciones del estilo y las de
   * la biblioteca base.
   *
   * @public
   * @return {Object} JSON del estilo.
   * @function
   * @api
   */
  toJSON() {
    return {
      parameters: [stringifyFunctions(this.getOptions()), stringifyFunctions(this.vendorOptions_)],
      deserializedMethod: this.getDeserializedMethod_(),
    };
  }
}

export default Tiles3D;
