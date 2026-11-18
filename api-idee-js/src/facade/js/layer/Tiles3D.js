/**
 * @module IDEE/layer/Tiles3D
 */
import Tiles3DImpl from 'impl/layer/Tiles3D';
import LayerBase from './Layer';
import {
  isNullOrEmpty,
  isUndefined,
  isString,
  normalize,
  isObject,
  escapeXSS,
} from '../util/Utils';
import Exception from '../exception/exception';
import * as LayerType from './Type';
import * as parameter from '../parameter/parameter';
import { getValue } from '../i18n/language';
import * as EventType from '../event/eventtype';
import * as Toast from '../toast';
import normalizeTiles3DOptions from '../../../impl/common/Tiles3DOptions';

/**
 * @classdesc
 * Capa Tiles3D (3D Tiles). Solo disponible para Cesium.
 *
 * La fuente es exclusiva: una URL a un tileset.json o un asset de Cesium ion. Las opciones
 * de acceso (cabeceras, parámetros de consulta y token de ion) nunca se incluyen en
 * getRestLayer() ni en los errores, y las cabeceras y los parámetros de consulta solo se
 * envían al origen de la URL del tileset. Si IDEE.config.TICKET está definido, se añade
 * como parámetro ticket a las peticiones de ese origen.
 *
 * La opacidad se aplica como alfa del color del estilo y solo afecta al color de los
 * objetos (no a etiquetas ni contornos). En las nubes de puntos el color del estilo
 * sustituye al de cada punto: para conservarlo con opacidad, use color: '${COLOR}'.
 *
 * Eventos:
 * - IDEE.evt.ADDED_TO_MAP: el tileset raíz se ha cargado y añadido a la escena.
 * - IDEE.evt.LOAD_ERROR: no se ha podido cargar el tileset raíz; recibe un Error sin
 *   datos de acceso. Se avisa al usuario una vez hasta la siguiente carga correcta.
 *
 * @property {String} idLayer Identificador de la capa.
 * @property {String} url Url del servicio Tiles3D.
 * @property {Number} ionAssetId Identificador del asset de Cesium ion.
 * @property {String} ionServer Servidor de Cesium ion.
 * @property {String} name Identificador de capa.
 * @property {String} legend Indica el nombre que queremos que aparezca en
 * el árbol de contenidos, si lo hay.
 * @property {String} template Plantilla que se mostrará al consultar un objeto geográfico.
 * @property {Object} options Opciones de la capa.
 *
 * @api
 * @extends {IDEE.Layer}
 */
class Tiles3D extends LayerBase {
  /**
   * Constructor principal de la clase. Crea una capa Tiles3D
   * con parámetros especificados por el usuario.
   *
   * Solo disponible para Cesium.
   *
   * @constructor
   * @param {String|Mx.parameters.Tiles3D} userParametersVar Parámetros para la construcción
   * de la capa, estos parámetros los proporciona el usuario.
   * - url: Url del tileset.json. Obligatoria si no se indica ionAssetId.
   * - ionAssetId: Identificador (entero mayor que 0) del asset de Cesium ion. Excluyente
   *   con url.
   * - name: Nombre de la capa en la leyenda.
   * - legend: Indica el nombre que queremos que aparezca en el árbol de contenidos, si lo hay.
   * - visibility: Indica si la capa estará por defecto visible o no.
   * - type: Tipo de la capa.
   * - displayInLayerSwitcher: Indica si la capa se muestra en el selector de capas.
   * - attribution: Atribución de la capa.
   * - isBase: Este tipo de capa no podrá ser capa base.
   * - transparent (deprecated): Falso si es una capa base, verdadero en caso contrario.
   * - extract: Opcional, activa la consulta por click en el objeto geográfico,
   * por defecto verdadero.
   * - infoEventType: Parametriza el método de activación del popup para obtener la información
   *   de un feature ('click' / 'hover'), por defecto 'click'.
   * - template: (opcional) Plantilla que se mostrará al consultar un objeto geográfico.
   * @param {Mx.parameters.LayerOptions} options Estas opciones se mandarán a la implementación.
   * - style: Define el estilo de la capa (IDEE.style.Tiles3D u objeto de estilo 3D Tiles).
   * - opacity: Opacidad entre 0 y 1, por defecto 1.
   * - minZoom: Zoom mínimo a partir del cual se muestra la capa.
   * - maxZoom: Zoom máximo hasta el que se muestra la capa.
   * - maximumScreenSpaceError: Error máximo de espacio en pantalla.
   * - clippingPlanes: Planos de recorte.
   * - ionAccessToken: Token de Cesium ion. Si no se indica, se usa el predeterminado
   *   de Cesium (Ion.defaultAccessToken).
   * - ionServer: URL base del servidor de Cesium ion (p. ej. https://api.cesium.com/).
   * - headers: Cabeceras HTTP (objeto de cadenas) de las peticiones del tileset. Solo con url.
   * - queryParameters: Parámetros de consulta (objeto de cadenas) de las peticiones del
   *   tileset. Solo con url.
   * @param {Object} vendorOptions Opciones para la biblioteca base (opciones de
   * Cesium3DTileset).
   * @throws {TypeError} Si no se indica una única fuente o una opción de acceso no es válida.
   * @example
   * new IDEE.layer.Tiles3D({ name: 'edificios', ionAssetId: 96188 }, {
   *   ionAccessToken: '<token>',
   *   opacity: 0.8,
   * });
   * @api
   */
  constructor(userParameters, options = {}, vendorOptions = {}) {
    // Checks if the implementation can create Tiles3D.
    if (isUndefined(Tiles3DImpl) || (isObject(Tiles3DImpl)
      && isNullOrEmpty(Object.keys(Tiles3DImpl)))) {
      Exception(getValue('exception').tiles3d_method);
    }

    if (isString(userParameters) || !isUndefined(userParameters.transparent)) {
      // eslint-disable-next-line no-console
      console.warn(getValue('exception').transparent_deprecated);
    }

    const parameters = parameter.layer(userParameters, LayerType.Tiles3D);

    const optionsVar = options;

    const sourceParameters = isString(userParameters) ? { url: parameters.url } : userParameters;
    const normalized = normalizeTiles3DOptions(sourceParameters, optionsVar);

    /**
     * Implementación.
     * @public
     * @implements {IDEE.layer.Tiles3DImpl}
     * @type {IDEE.layer.Tiles3DImpl}
     */
    const impl = new Tiles3DImpl(sourceParameters, optionsVar, vendorOptions);
    // Calls the super constructor.
    super(parameters, impl);
    this.constructorParameters = { userParameters, options, vendorOptions };

    /**
     * Tiles3D maxextent: Extensión de visualización
    */
    this.userMaxExtent = null;

    /**
     * Tiles3D url. Url del servicio Tiles3D.
     */
    this.url = parameters.url;

    /**
     * Tiles3D ionAssetId. Identificador del asset de Cesium ion.
     */
    this.ionAssetId = normalized.ionAssetId;

    /**
     * Tiles3D ionServer. Servidor de Cesium ion.
     */
    this.ionServer = normalized.ionServer;

    /**
     * Tiles3D name. Nombre de la capa, Tiles3D.
     */
    this.name = parameters.name;

    /**
     * Tiles3D extract.
     * Activa la consulta por click en el objeto geográfico.
     * Por defecto, verdadero.
     */
    this.extract = !isNullOrEmpty(userParameters.extract) ? userParameters.extract : true;

    /**
     * Tiles3D infoEventType.
     * Parametriza el método de activación del popup para obtener la información
     * de un feature ('click' / 'hover'), por defecto 'click'.
     */
    this.infoEventType = userParameters.infoEventType || 'click';

    /**
     * Tiles3D legend. Indica el nombre que queremos que aparezca
     * en el árbol de contenidos, si lo hay.
     */
    this.legend = parameters.legend;

    /**
     * Zoom mínimo aplicable a la capa.
    */
    this.minZoom = optionsVar.minZoom || Number.NEGATIVE_INFINITY;

    /**
      * Zoom máximo aplicable a la capa.
    */
    this.maxZoom = optionsVar.maxZoom || Number.POSITIVE_INFINITY;

    /**
      * Tiles3D template: Para especificar una plantilla al consultar un objeto geográfico.
      */
    this.template = userParameters.template;

    /**
     * Tiles3D options. Opciones de capa.
     */
    this.options = options;

    /**
     * Indica si ya se ha avisado del fallo de carga. Se rearma tras una carga correcta
     * o al retirar la capa.
     * @private
     * @type {Boolean}
     */
    this.loadErrorNotified_ = false;

    this.on(EventType.LOAD_ERROR, this.notifyLoadError_, this);
    this.on(EventType.ADDED_TO_MAP, this.resetLoadErrorNotice_, this);
    this.on(EventType.REMOVED_FROM_MAP, this.resetLoadErrorNotice_, this);
  }

  /**
   * Este método indica la extensión máxima de la capa.
   *
   * @function
   * @returns {Array} Devuelve la extensión de
   * los objeto geográfico.
   * @api
   */
  getMaxExtent() {
    return this.getImpl().getMaxExtent();
  }

  /**
   * Devuelve el valor de la propiedad "extract". La propiedad "extract" tiene la
   * siguiente función: Activa la consulta al hacer clic en la característica,
   * por defecto verdadero.
   *
   * @function
   * @getter
   * @return {Boolean} Valor de la propiedad "extract".
   * @api
   */
  get extract() {
    return this.getImpl().extract;
  }

  /**
     * Sobrescribe el valor de la propiedad "extract". La propiedad "extract" tiene la
     * siguiente función: Activa la consulta al hacer clic en la característica,
     * por defecto verdadero.
     *
     * @function
     * @setter
     * @param {Boolean|String} newExtract Nuevo valor para sobreescribir la propiedad "extract".
     * @api
  */
  set extract(newExtract) {
    if (!isNullOrEmpty(newExtract)) {
      if (isString(newExtract)) {
        this.getImpl().extract = (normalize(newExtract) === 'true');
      } else {
        this.getImpl().extract = newExtract;
      }
    } else {
      this.getImpl().extract = true;
    }
  }

  /**
   * Devuelve el valor de la propiedad "template". La propiedad "template" tiene la
   * siguiente función: Especifica una plantilla que se mostrará al consultar
   * un objeto geográfico.
   *
   * @function
   * @getter
   * @return {String} Valor de la propiedad "template".
   * @api
   */
  get template() {
    return this.getImpl().template;
  }

  /**
   * Sobrescribe el valor de la propiedad "template". La propiedad "template" tiene la
   * siguiente función: Especifica una plantilla que se mostrará al consultar
   * un objeto geográfico.
   *
   * @function
   * @setter
   * @param {String} newTemplate Nuevo valor para sobreescribir la propiedad "template".
   * @api
   */
  set template(newTemplate) {
    this.getImpl().template = newTemplate;
  }

  /**
   * Este método cambia la extensión máxima de la capa.
   *
   * @function
   * @param {String} maxExtent Nuevo valor para el "MaxExtent".
   * @api
   * @export
   */
  setMaxExtent(maxExtent) {}

  /**
   * Este método devuelve el estilo de la capa.
   *
   * @function
   * @public
   * @returns {Object} Estilo de la capa.
   * @api
   */
  getStyle() {
    return this.getImpl().getStyle();
  }

  /**
   * Este método establece el estilo en capa.
   *
   * @function
   * @public
   * @param {Object|IDEE.style.Tiles3D} style Estilo que se aplicará a la capa.
   * @api
   */
  setStyle(style) {
    if (!isNullOrEmpty(style)) {
      this.getImpl().setStyle(style);
    }
  }

  /**
   * Este método comprueba si un objeto es igual
   * a esta capa.
   *
   * @function
   * @param {Object} obj Objeto a comparar.
   * @returns {Boolean} Valor verdadero es igual, falso no lo es.
   * @api
   */
  equals(obj) {
    let equals = false;
    if (obj instanceof Tiles3D) {
      equals = (this.url === obj.url);
      equals = equals && (this.ionAssetId === obj.ionAssetId);
      equals = equals && (this.ionServer === obj.ionServer);
      equals = equals && (this.name === obj.name);
      equals = equals && (this.idLayer === obj.idLayer);
      equals = equals && (this.template === obj.template);
    }
    return equals;
  }

  /**
   * Devuelve la cadena de carga REST de la capa. No incluye las opciones de acceso
   * (token de ion, cabeceras, parámetros de consulta ni ticket).
   *
   * @function
   * @returns {String|null} Cadena REST de la capa.
   * @api
   */
  getRestLayer() {
    return this.formatRestLayer_({
      ionAssetId: this.ionAssetId,
      extract: this.extract === false ? false : undefined,
      template: isString(this.template) ? this.template : undefined,
      infoEventType: this.infoEventType !== 'click' ? this.infoEventType : undefined,
    });
  }

  /**
   * Avisa al usuario con un toast de que la capa no se ha podido cargar. Se muestra una
   * vez hasta la siguiente carga correcta; el evento load:error se dispara siempre.
   * @private
   * @function
   * @param {Error} error Error de carga saneado.
   */
  notifyLoadError_(error) {
    if (this.loadErrorNotified_) return;
    this.loadErrorNotified_ = true;
    const layer = escapeXSS(String(this.legend || this.name || ''));
    const detail = escapeXSS(String(error?.message || error || ''));
    Toast.error(getValue('toast').tiles3d_load_error
      .replace('{layer}', () => layer)
      .replace('{error}', () => detail));
  }

  /**
   * Permite volver a avisar de un fallo de carga posterior.
   * @private
   * @function
   */
  resetLoadErrorNotice_() {
    this.loadErrorNotified_ = false;
  }
}

export default Tiles3D;
