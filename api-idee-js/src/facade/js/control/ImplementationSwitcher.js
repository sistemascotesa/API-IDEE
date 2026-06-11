/* eslint-disable no-console */
/**
 * @module IDEE/control/ImplementationSwitcher
 */
import 'assets/css/controls/implementationswitcher';
import ImplementationSwitcherImpl from 'impl/control/ImplementationSwitcher';
import template from 'templates/implementationswitcher';
import myhelp from 'templates/implementationswitcherhelp';
import { transform } from 'ol/proj';
import ControlBase from './Control';
import { compileSync as compileTemplate } from '../util/Template';
import Exception from '../exception/exception';
import { getValue } from '../i18n/language';
import {
  isUndefined, isNullOrEmpty, isObject,
  isBoolean,
} from '../util/Utils';
import * as Dialog from '../dialog';

/**
 * @typedef {Object} module:IDEE/control/ImplementationSwitcher~Options
 * @api
 * @property {String} [position] Posición del control en el mapa.
 * @property {Boolean} [collapsible] Indica si el control es colapsable.
 * @property {Boolean} [collapsed] Indica si el control está colapsado.
 * @property {String} [tooltip] Texto del tooltip.
 * @property {Number} [order] Accesibilidad, z-index.
 * @property {Object} [vendorOptions] Opciones específicas para la implementación.
 */

/**
 * @classdesc
 * Agrega la herramienta de cambio de implementación.
 * @property {Boolean} [collapsible=true] Indica si el control es colapsable.
 * @property {Boolean} [collapsed=true] Indica si el control está colapsado.
 *
 * @api
 * @extends {IDEE.Control}
 */
class ImplementationSwitcher extends ControlBase {
  /**
   * Constructor principal de la clase.
   *
   * @constructor
   * @param {module:IDEE/control/ImplementationSwitcher~Options} options Opciones de configuración
   * para el control de fachada.
   * @example
   * const control = new IDEE.control.ImplementationSwitcher({
   *   position: 'left',
   *   tooltip: 'Cambiar implementación',
   *   order: 1,
   *   collapsible: true,
   * });
   * @api
   */
  constructor(options = {}) {
    if (isUndefined(ImplementationSwitcherImpl) || (isObject(ImplementationSwitcherImpl)
      && isNullOrEmpty(Object.keys(ImplementationSwitcherImpl)))) {
      Exception(getValue('exception').implementationswitcher_method);
    }

    const implementationSwitcherImpl = new ImplementationSwitcherImpl();

    super(ImplementationSwitcher.NAME, implementationSwitcherImpl, options);

    if (!window.implementations) {
      window.implementations = (IDEE.config.implementationswitcher || []).map((impl) => ({
        ...impl,
        epsg: impl.type === 'cesium' ? 'EPSG:4979' : impl.epsg,
      }));
    }

    this.collapsible = isBoolean(options.collapsible) ? options.collapsible : true;

    this.collapsed = isBoolean(options.collapsed) ? options.collapsed : this.collapsible;
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
    return new Promise((resolve) => {
      this.selectCurrentImplementation(map);

      this.html = compileTemplate(template, {
        vars: {
          title: this.tooltip ?? getValue(ImplementationSwitcher.NAME).title,
          description: getValue(ImplementationSwitcher.NAME).description,
          implementations: window.implementations,
        },
      });

      this.listen(this.html);

      resolve(this.html);
    });
  }

  /**
   * Selecciona en el desplegable la implementación del mapa actual.
   *
   * @public
   * @function
   * @param {IDEE.Map} map Mapa actual.
   * @api
   */
  selectCurrentImplementation(map) {
    const currentImplementation = map?.getImplementation?.();
    const implementations = window.implementations || [];

    if (implementations.length > 0) {
      const currentIndex = implementations.findIndex((impl) => impl.type === currentImplementation);
      const selectedIndex = implementations.findIndex((impl) => impl.selected);
      const targetIndex = currentIndex >= 0 ? currentIndex : Math.max(selectedIndex, 0);

      window.implementations = implementations.map((impl, index) => {
        const nextImpl = { ...impl };
        if (index === targetIndex) {
          nextImpl.selected = true;
        } else {
          delete nextImpl.selected;
        }
        return nextImpl;
      });
    }
  }

  /**
   * Esta función agrega el detector de eventos en el desplegable de implementaciones.
   * @param {HTMLElement} html Elemento desplegable.
   * @function
   * @public
   * @api
   */
  listen(html) {
    html.querySelectorAll('select#m-implementationswitcher-select').forEach((element) => {
      element.addEventListener('change', (e) => {
        this.loadImplementation(window.implementations[e.target.selectedIndex]);
      });
    });
  }

  /**
   * Carga la implementación seleccionada
   *
   * @function
   * @public
   * @api
   */
  loadImplementation(implementation) {
    const API_IDEE_URL = IDEE.config.API_IDEE_URL || '';
    const baseUrl = API_IDEE_URL.endsWith('/') ? API_IDEE_URL : `${API_IDEE_URL}/`;
    const resolveUrl = (value) => {
      if (!value) return '';
      if (/^(?:https?:)?\/\//i.test(value)) {
        return value;
      }
      try {
        return new URL(value.replace(/^\/+/, ''), baseUrl || document.baseURI).href;
      } catch (error) {
        return `${baseUrl}${value.replace(/^\/+/, '')}`;
      }
    };

    const implementationUrl = resolveUrl(implementation.js);
    const implementationCssUrl = resolveUrl(implementation.css);
    const existingConfigScript = document
      .querySelector('script[src$="/config.js"], script[src$="config.js"], script[src$="/configuration.js"], script[src$="configuration.js"]');

    const configurationUrl = existingConfigScript ? existingConfigScript.src : resolveUrl('js/configuration.js');

    if (existingConfigScript) {
      existingConfigScript.remove();
    }

    window.implementations.forEach((impl) => {
      // eslint-disable-next-line no-param-reassign
      delete impl.selected;

      Array.from(document.querySelectorAll('script'))
        .filter((script) => script.src.endsWith(impl.js))
        .forEach((script) => script.remove());

      Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .filter((style) => style.href.endsWith(impl.css))
        .forEach((style) => style.remove());
    });

    // remove duplicate configuration scripts, keep only the first one
    if (configurationUrl) {
      const configurationScripts = Array.from(document.querySelectorAll('script'))
        .filter((configuration) => configuration.src === configurationUrl);
      configurationScripts.slice(1).forEach((configuration) => configuration.remove());
    }

    // eslint-disable-next-line no-param-reassign
    implementation.selected = true;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = implementationUrl;
    script.onload = () => {
      const existingConfig = configurationUrl && document.querySelector(`script[src="${configurationUrl}"]`);
      if (configurationUrl && !existingConfig) {
        const configScript = document.createElement('script');
        configScript.type = 'text/javascript';
        configScript.src = configurationUrl;
        configScript.onload = () => {
          this.loadMap(implementation);
        };
        configScript.onerror = (error) => {
          console.error('CONFIGURATION LOAD ERROR', configurationUrl, error);
          this.loadMap(implementation);
        };
        document.body.appendChild(configScript);
      } else {
        this.loadMap(implementation);
      }

      // if (configurationUrl && !existingConfig) {
      //   fetch(implementationUrl)
      //     .then((response) => response.text())
      //     .then((scriptContent) => {
      //       // eslint-disable-next-line no-eval
      //       eval(scriptContent);

      //       this.loadMap(implementation);
      //     }).catch((err) => {
      //       console.error('CONFIGURATION LOAD ERROR', configurationUrl, err);
      //       this.loadMap(implementation);
      //     });
      // } else {
      //   this.loadMap(implementation);
      // }
    };
    script.onerror = (err) => {
      // eslint-disable-next-line no-console
      console.error('SCRIPT ERROR', script.src, err);
      Dialog.error(script.src, 'La implementación no se pudo cargar:');
    };
    document.body.appendChild(script);

    const style = document.createElement('link');
    style.type = 'text/css';
    style.href = implementationCssUrl;
    style.rel = 'stylesheet';
    document.head.appendChild(style);
  }

  loadMap(implementation) {
    const zoom = this.map.getZoom();
    const sourceProjection = this.map.getProjection().code;
    const projection = implementation.epsg ?? IDEE.config.DEFAULT_PROJ;
    const { x, y } = this.map.getCenter();
    const center = (typeof ol !== 'undefined' && ol !== null)
      ? ol.proj.transform([x, y], sourceProjection, projection)
      : transform([x, y], sourceProjection, projection);

    const controls = Array.from(this.map.getControls()).map(
      (control) => control.name ?? control.NAME,
    );
    const plugins = this.map.getPlugins();

    // const layers = this.map.getLayers();

    this.map.removeControls(this);

    /** @type {HTMLDivElement} */
    const mapFrameContainer = this.map.getFrameContainer();

    try {
      this.map.destroy();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Error destroying previous map', e);
    }

    IDEE.map({
      container: mapFrameContainer.id,
      zoom,
      projection,
      center,
      controls,
      plugins,
      // layers,
    });
  }

  /**
   * Obtiene la ayuda del control
   *
   * @function
   * @public
   * @api
  */
  getHelp() {
    const textHelp = getValue(ImplementationSwitcher.NAME).textHelp;
    return {
      title: ImplementationSwitcher.NAME,
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

  equals(obj) {
    const equals = (obj instanceof ImplementationSwitcher);
    return equals;
  }
}

/**
 * Nombre del control.
 * @const
 * @type {string}
 * @public
 * @api
 */
ImplementationSwitcher.NAME = 'implementationswitcher';

export default ImplementationSwitcher;
