/**
 * @module IDEE/plugin/Layerswitcher
 */

import '../assets/css/layerswitcher';
import '../assets/css/fonts';
import LayerswitcherControl from './layerswitchercontrol';
import api from '../../api';
import { getValue } from './i18n/language';
import myhelp from '../../templates/myhelp';

import es from './i18n/es';
import en from './i18n/en';

// Estas capas hacen referencia a la estructura de iberpix
const PRECHARGED = {
  groups: [{
    'Cartografía': {
      'Mapas': {
        'type': 'WMTS',
        'url': 'https://www.ign.es/wmts/mapa-raster?',
      },
      'Callejero': {
        'type': 'WMTS',
        'url': 'https://www.ign.es/wmts/ign-base?',
      },
      'Primera edición MTN y Minutas de 1910-1970': {
        'type': 'WMTS',
        'url': 'https://www.ign.es/wmts/primera-edicion-mtn?',
      },
      'Planimetrías (1870 y 1950)': {
        'type': 'WMS',
        'url': 'https://www.ign.es/wms/minutas-cartograficas?',
      },
      'Planos de Madrid (1622 - 1960)': {
        'type': 'WMTS',
        'url': 'https://www.ign.es/wmts/planos?',
      },
      'Hojas kilométricas (Madrid - 1860)': {
        'type': 'WMS',
        'url': 'https://www.ign.es/wms/hojas-kilometricas?',
      },
      'Cuadrículas Mapa Topográfico Nacional': {
        'type': 'WMS',
        'url': 'https://www.ign.es/wms-inspire/cuadriculas?',
      },
    },
    'Imagenes': {
      'Ortofotos': {
        'Máxima actualidad PNOA': {
          'type': 'WMTS',
          'url': 'https://www.ign.es/wmts/pnoa-ma?',
        },
        'Históricas y PNOA anual': {
          'type': 'WMS',
          'url': 'https://www.ign.es/wms/pnoa-historico?',
        },
        'PNOA Provisionales': {
          'type': 'WMS',
          'url': 'https://wms-pnoa.idee.es/pnoa-provisionales?',
        },
      },
      'Mosaicos de satélite': {
        'type': 'WMS',
        'url': 'https://wms-satelites-historicos.idee.es/satelites-historicos?',
      },
      'Fototeca (Consulta de fotogramas históricos y PNOA)': {
        'type': 'WMS',
        'url': 'https://wms-fototeca.idee.es/fototeca?',
      },
    },
    'Información geográfica de referencia y temática': {
      'Catastro': {
        'type': 'WMS',
        'url': 'https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?',
      },
      'Unidades administrativas': {
        'type': 'WMS',
        'url': ' https://www.ign.es/wms-inspire/unidades-administrativas?',
      },
      'Nombres geográficos (Nomenclátor Geográfico Básico NGBE)': {
        'type': 'WMS',
        'url': 'https://www.ign.es/wms-inspire/ngbe?',
      },
      'Redes de transporte': {
        'type': 'WMS',
        'url': 'https://servicios.idee.es/wms-inspire/transportes?',
      },
      'Hidrografía': {
        'type': 'WMS',
        'url': 'https://servicios.idee.es/wms-inspire/hidrografia?',
      },
      'Direcciones y códigos postales': {
        'type': 'WMS',
        'url': 'https://www.cartociudad.es/wms-inspire/direcciones-ccpp?',
      },
      'Ocupación del suelo': {
        'Actual (Corine y SIOSE)': {
          'type': 'WMTS',
          'url': 'https://servicios.idee.es/wmts/ocupacion-suelo?',
        },
        'Histórico (Corine y SIOSE)': {
          'type': 'WMS',
          'url': 'https://servicios.idee.es/wms-inspire/ocupacion-suelo-historico?',
        },
        'Copernicus Land Monitoring Service': {
          'type': 'WMS',
          'url': 'https://servicios.idee.es/wms/copernicus-landservice-spain?',
        },
      },
      'Información sísmica (terremotos)': {
        'type': 'WMS',
        'url': 'https://www.ign.es/wms-inspire/geofisica?',
      },
      'Red de vigilancia volcánica': {
        'type': 'WMS',
        'url': 'https://wms-volcanologia.ign.es/volcanologia?',
      },
      'Redes geodésicas': {
        'type': 'WMS',
        'url': 'https://www.ign.es/wms-inspire/redes-geodesicas?',
      },
    },
    'Modelos digitales de elevaciones': {
      'Modelo Digital de Superficies (Sombreado superficies y consulta de elevaciones edificios y vegetación)': {
        'type': 'WMTS',
        'url': 'https://wmts-mapa-lidar.idee.es/lidar?',
      },
      'Modelo Digital del Terreno (Sombreado terreno y consulta de altitudes)': {
        'type': 'WMTS',
        'url': 'https://servicios.idee.es/wmts/mdt?',
        'white_list': ['EL.ElevationGridCoverage'],
      },
      'Curvas de nivel y puntos acotados': {
        'type': 'WMS',
        'url': 'https://servicios.idee.es/wms-inspire/mdt?',
        'white_list': ['EL.Contourline', 'EL.SpotElevation'],
      },
    },
  },

  ],
};
export default class Layerswitcher extends IDEE.Plugin {
  constructor(options = {}) {
    super('layerswitcher', {
      position: options.position || 'right',
      tooltip: options.tooltip || getValue('tooltip'),
      order: options.order,
    });

    /**
     * Plugin parameters
     * @public
     * @type {object}
     */
    this.options = options;

    this.minPanelWidth = 360;

    // Permite saber si el plugin está colapsado o no
    this.collapsed_ = !IDEE.utils.isUndefined(options.collapsed) ? options.collapsed : true;

    // Permite que el plugin sea colapsado o no
    this.collapsible_ = !IDEE.utils.isUndefined(options.collapsible) ? options.collapsible : true;

    // Determina si el plugin es draggable o no
    this.isDraggable = !IDEE.utils.isUndefined(options.isDraggable) ? options.isDraggable : false;

    // Permite saber si se permite movimiento de capas
    this.isMoveLayers = options.isMoveLayers || true;

    // Determina el modo de selección de las capas
    this.modeSelectLayers = IDEE.utils.isUndefined(options.modeSelectLayers) ? 'eyes' : options.modeSelectLayers;

    // Herramientas para mostrar en las capas
    this.tools = IDEE.utils.isUndefined(options.tools) ? ['transparency', 'legend', 'zoom', 'information', 'style', 'delete'] : options.tools;

    // Funcionalidad añadir capas
    this.addLayers = options.addLayers;

    // Funcionalidad ocultar/añadir capas
    this.statusLayers = options.statusLayers;

    // Servicios precargados
    this.precharged = options.precharged || PRECHARGED;

    // Mostrar tipo de capa
    this.displayLabel = !IDEE.utils.isUndefined(options.displayLabel)
      ? options.displayLabel : false;

    //  Metadatos
    this.metadata_ = api.metadata;

    //  Determina si permite o no servicios http
    this.http = true;
    if (options.http !== undefined && (options.http === false || options.http === 'false')) {
      this.http = false;
    }

    // Determina si permite o no servicios https
    this.https = true;
    if (options.https !== undefined && (options.https === false || options.https === 'false')) {
      this.https = false;
    }

    // showCatalog
    this.showCatalog = options.showCatalog || false;

    // use proxy
    this.useProxy = IDEE.utils.isUndefined(options.useProxy) ? IDEE.useproxy : options.useProxy;

    // Estado inicial del proxy
    this.statusProxy = IDEE.useproxy;

    // Añadir attributions
    this.useAttributions = options.useAttributions || false;
  }

  // Devuelve el idioma del plugin
  static getJSONTranslations(lang) {
    if (lang === 'en' || lang === 'es') {
      return (lang === 'en') ? en : es;
    }
    return IDEE.language.getTranslation(lang).layerswitcher;
  }

  // Esta función añade el plugin al mapa
  addTo(map) {
    this.map = map;

    this.button = new IDEE.ui.Button(this.name, {
      position: this.position,
      tooltip: this.tooltip,
      svgPath: `plugins/${this.name}/images/icon.svg`,
      order: this.order,
    });
    map.addButtons(this.button);

    this.panel = new IDEE.ui.Panel(this.name, {
      tooltip: this.tooltip,
      position: this.position,
      minWidth: this.minPanelWidth,
      maxWidth: this.maxPanelWidth,
      className: 'm-plugin-layerswitcher',
      collapsible: this.collapsible_,
      collapsed: this.collapsed_,
      collapsedButtonClass: 'm-layerswitcher-icons-layers',
      order: this.order,
    });
    map.addPanels(this.panel);

    this.controls.push(new LayerswitcherControl({
      isDraggable: this.isDraggable,
      modeSelectLayers: this.modeSelectLayers,
      tools: this.tools,
      addLayers: this.addLayers,
      statusLayers: this.statusLayers,
      collapsed: this.collapsed_,
      isMoveLayers: this.isMoveLayers,
      precharged: this.precharged,
      http: this.http,
      https: this.https,
      showCatalog: this.showCatalog,
      order: this.order,
      useProxy: this.useProxy,
      statusProxy: this.statusProxy,
      useAttributions: this.useAttributions,
      displayLabel: this.displayLabel,
    }));

    this.controls[0].on(IDEE.evt.ADDED_TO_MAP, () => {
      this.fire(IDEE.evt.ADDED_TO_MAP);
    });

    this.panel.addControls(this.controls);

    this.button.panel = this.panel;
    this.panel.button = this.button;

    // control.addEventPanel(panel);
  }

  // Devuelve la cadena API-REST del plugin
  getAPIRest() {
    return `${this.name}=${this.position}*${this.collapsed}*${this.collapsible}*${this.tooltip}*${this.isDraggable}*${this.isMoveLayers}*${this.modeSelectLayers}*${this.tools}*${this.http}*${this.https}*${this.showCatalog}*${this.useProxy}*${this.displayLabel}*${this.addLayers}*${this.statusLayers}`;
  }

  // Devuelve la cadena API-REST del plugin en base64
  getAPIRestBase64() {
    return `${this.name}=base64=${IDEE.utils.encodeBase64(this.options)}`;
  }

  // Esta función devuelve los metadatos del plugin
  getMetadata() {
    return this.metadata_;
  }

  getPanel() {
    return this.panel;
  }

  // Esta función elimina el plugin del mapa
  destroy() {
    this.map.removeButton(this.button);
    this.map.removePanel(this.panel);
  }

  // Esta función devuelve si el plugin recibido por parámetro es instancia de Layerswitcher
  equals(plugin) {
    return plugin instanceof Layerswitcher;
  }

  /**
   * Obtiene la ayuda del plugin
   *
   * @function
   * @public
   * @api
   */
  getHelp() {
    return {
      title: this.name,
      content: new Promise((success) => {
        const html = IDEE.template.compileSync(myhelp, {
          vars: {
            urlImages: `${IDEE.config.API_IDEE_URL}plugins/layerswitcher/images/`,
            translations: {
              help1: getValue('textHelp.help1'),
              help2: getValue('textHelp.help2'),
              help3: getValue('textHelp.help3'),
              help4: getValue('textHelp.help4'),
              help5: getValue('textHelp.help5'),
              help6: getValue('textHelp.help6'),
              help7: getValue('textHelp.help7'),
              help8: getValue('textHelp.help8'),
              help9: getValue('textHelp.help9'),
              help10: getValue('textHelp.help10'),
              help11: getValue('textHelp.help11'),
              help12: getValue('textHelp.help12'),
              help13: getValue('textHelp.help13'),
              help14: getValue('textHelp.help14'),
              help15: getValue('textHelp.help15'),
              help16: getValue('textHelp.help16'),
              help17: getValue('textHelp.help17'),
              help18: getValue('textHelp.help18'),
              help19: getValue('textHelp.help19'),
              help20: getValue('textHelp.help20'),
            },
          },
        });
        success(html);
      }),
    };
  }
}
