/**
 * @module IDEE/control/Rotate
 */
import 'assets/css/controls/rotate';
import RotateImpl from 'impl/control/Rotate';
import template from 'templates/rotate';
import templateCesium from 'templates/rotateCesium';
import myhelp from 'templates/rotatehelp';
import myhelpCesium from 'templates/rotatehelpCesium';
import ControlBase from './Control';
import { compileSync as compileTemplate } from '../util/Template';
import { isUndefined, isNullOrEmpty, isObject } from '../util/Utils';
import Exception from '../exception/exception';
import { getValue } from '../i18n/language';
import * as Position from '../ui/position';
import * as MapImplType from '../../../impl/common/mapImplType';

/**
 * @classdesc
 * Agrega la funcionalidad para rotar el mapa.
 *
 * @api
 * @extends {IDEE.Control}
 */
class Rotate extends ControlBase {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {String} options Opciones del control.
   * - viewInitial: Vista inicial. Solo disponible para Cesium.
   * - help: Indica si se muestra la ayuda al crear el control.
   * Por defecto, verdadero. Solo disponible para Cesium.
   * @api
   */
  constructor(options = {}) {
    if (isUndefined(RotateImpl) || (isObject(RotateImpl)
      && isNullOrEmpty(Object.keys(RotateImpl)))) {
      Exception(getValue('exception').rotate_method);
    }

    const opts = {
      help: isNullOrEmpty(options.help) || isUndefined(options.help) ? true : options.help,
      ...options,
    };

    // implementation of this control
    const impl = new RotateImpl(opts);

    // calls the super constructor
    super(Rotate.NAME, impl, options);

    this.help = opts.help;
    this.position = options.position ?? Position.LEFT;
  }

  /**
   * Este método crea la vista del mapa especificado.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Añade el control al mapa.
   * @returns {Promise} HTML generado, promesa.
   * @api
   */
  createView(map) {
    this.map = map;
    let compTemplate;

    if (this.map.getImplementation() === MapImplType.Cesium) {
      const textHelp = getValue('rotate').help;
      compTemplate = compileTemplate(templateCesium, {
        vars: {
          title: getValue('rotate').titleCesium,
          title_help: getValue('rotate').title_help,
          title_help_container: textHelp.title,
          title1: textHelp.title1,
          text1: textHelp.text1,
          title2: textHelp.title2,
          text2: textHelp.text2,
          text3: textHelp.text3,
          text4: textHelp.text4,
          showHelp: this.help,
          close_not_show_help: getValue('rotate').close_not_show_help,
          image1_description: getValue('rotate').image1_description,
          image2_description: getValue('rotate').image2_description,
          close_btn: getValue('rotate').close_btn,
          order: this.order,
        },
      });
    } else {
      compTemplate = compileTemplate(template, {
        vars: {
          title: getValue('rotate').title,
          order: this.order,
        },
      });
    }
    return compTemplate;
  }

  /**
   * Obtiene la ayuda del control
   *
   * @function
   * @public
   * @api
   */
  getHelp() {
    if (!isNullOrEmpty(this.map) && this.map.getImplementation() === 'cesium') {
      const textHelp = getValue('rotate').textHelp;
      return {
        title: Rotate.NAME,
        content: new Promise((success) => {
          const html = compileTemplate(myhelpCesium, {
            vars: {
              urlImages: 'https://componentes.idee.es/estaticos/imagenes/controles',
              translations: {
                help1: textHelp.text1,
                help2: textHelp.text2,
                help3: textHelp.text3,
                help4: textHelp.text4,
                help5: textHelp.text5,
              },
            },
          });
          success(html);
        }),
      };
    }

    const textHelp = getValue('rotate').textHelp;
    return {
      title: Rotate.NAME,
      content: new Promise((success) => {
        const html = compileTemplate(myhelp, {
          vars: {
            urlImages: `${IDEE.config.STATIC_RESOURCES_URL}/imagenes/controles`,
            translations: {
              help1: textHelp.text1,
              help2: textHelp.text2,
            },
          },
        });
        success(html);
      }),
    };
  }

  /**
   * Este método comprueba si un objeto es igual
   * a este control.
   *
   * @function
   * @param {Object} obj Objeto a comparar.
   * @returns {Boolean} Verdadero es igual, falso si no.
   * @api
   */
  equals(obj) {
    const equals = (obj instanceof Rotate);
    return equals;
  }

  /**
   * Esta función destruye este control y limpia el HTML.
   *
   * @public
   * @function
   * @api stable
   */
  destroy() {
    this.getImpl().destroy();
  }
}

/**
 * Nombre del control.
 * @const
 * @type {string}
 * @public
 * @api
 */
Rotate.NAME = 'rotate';

export default Rotate;
