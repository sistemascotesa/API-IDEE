import Layerswitcher from 'facade/layerswitcher';

window.IDEE.plugin.Layerswitcher = Layerswitcher;

IDEE.language.setLang('es');

const map = IDEE.map({
  container: 'mapjs',
  zoom: 5,
  maxZoom: 20,
  minZoom: 2,
  center: [-467062.8225, 4783459.6216],
  controls: ['attributions']
});
window.map = map;

const PRECHARGED = {
  services: [{
    type: 'WMS', name: 'Camino de Santiago',
    url: 'https://www.ign.es/wms-inspire/camino-santiago',
  }, {
    type: 'WMS', name: 'Redes Geodésicas',
    url: 'https://www.ign.es/wms-inspire/redes-geodesicas',
  }, {
    type: 'WMS', name: 'Planimetrías',
    url: 'https://www.ign.es/wms/minutas-cartograficas',
  }, {
    type: 'MapLibre', name: 'Mapa Libre', legend: 'Mapa Libre',
    url: 'https://vt-mapabase.idee.es/files/styles/mapaBase_scn_color1_CNIG.json',
  }],
  groups: [{
    name: 'Cartografía',
    services: [{
      type: 'WMTS', name: 'Mapas',
      url: 'https://www.ign.es/wmts/mapa-raster?',
    }, {
      type: 'WMTS', name: 'Callejero',
      url: 'https://www.ign.es/wmts/ign-base?',
    }, {
      type: 'WMTS', name: 'Primera edición MTN y Minutas de 1910-1970',
      url: 'https://www.ign.es/wmts/primera-edicion-mtn?',
    }, {
      type: 'WMS', name: 'Planimetrías (1870 y 1950)',
      url: 'https://www.ign.es/wms/minutas-cartograficas?',
    }, {
      type: 'WMTS', name: 'Planos de Madrid (1622 - 1960)',
      url: 'https://www.ign.es/wmts/planos?',
    }, {
      type: 'WMS', name: 'Hojas kilométricas (Madrid - 1860)',
      url: 'https://www.ign.es/wms/hojas-kilometricas?',
    }, {
      type: 'WMS', name: 'Cuadrículas Mapa Topográfico Nacional',
      url: 'https://www.ign.es/wms-inspire/cuadriculas?',
    }],
  }, {
    name: 'Imágenes',
    services: [{
      type: 'WMTS', name: 'Ortofotos máxima actualidad PNOA',
      url: 'https://www.ign.es/wmts/pnoa-ma?',
    }, {
      type: 'WMS', name: 'Ortofotos históricas y PNOA anual',
      url: 'https://www.ign.es/wms/pnoa-historico?',
    }, {
      type: 'WMS', name: 'Ortofotos provisionales PNOA',
      url: 'https://wms-pnoa.idee.es/pnoa-provisionales?',
    }, {
      type: 'WMS', name: 'Mosaicos de satélite',
      url: 'https://wms-satelites-historicos.idee.es/satelites-historicos?',
    }, {
      type: 'WMS', name: 'Fototeca (Consulta de fotogramas históricos y PNOA)',
      url: 'https://wms-fototeca.idee.es/fototeca?',
    }],
  }, {
    name: 'Información geográfica de referencia y temática',
    services: [{
      type: 'WMS', name: 'Catastro',
      url: 'https://ovc.catastro.meh.es/Cartografia/WMS/ServidorWMS.aspx?',
    }, {
      type: 'WMS', name: 'Unidades administrativas',
      url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
    }, {
      type: 'WMS', name: 'Nombres geográficos (Nomenclátor Geográfico Básico NGBE)',
      url: 'https://www.ign.es/wms-inspire/ngbe?',
    }, {
      type: 'WMS', name: 'Redes de transporte',
      url: 'https://servicios.idee.es/wms-inspire/transportes?',
    }, {
      type: 'WMS', name: 'Hidrografía',
      url: 'https://servicios.idee.es/wms-inspire/hidrografia?',
    }, {
      type: 'WMS', name: 'Direcciones y códigos postales',
      url: 'https://www.cartociudad.es/wms-inspire/direcciones-ccpp?',
    }, {
      type: 'WMTS', name: 'Ocupación del suelo (Corine y SIOSE)',
      url: 'https://servicios.idee.es/wmts/ocupacion-suelo?',
    }, {
      type: 'WMS', name: 'Ocupación del suelo Histórico (Corine y SIOSE)',
      url: 'https://servicios.idee.es/wms-inspire/ocupacion-suelo-historico?',
    }, {
      type: 'WMS', name: 'Copernicus Land Monitoring Service',
      url: 'https://servicios.idee.es/wms/copernicus-landservice-spain?',
    }, {
      type: 'WMS', name: 'Información sísmica (terremotos)',
      url: 'https://www.ign.es/wms-inspire/geofisica?',
    }, {
      type: 'WMS', name: 'Red de vigilancia volcánica',
      url: 'https://wms-volcanologia.ign.es/volcanologia?',
    }, {
      type: 'WMS', name: 'Redes geodésicas',
      url: 'https://www.ign.es/wms-inspire/redes-geodesicas?',
    }],
  }, {
    name: 'Modelos digitales de elevaciones',
    services: [{
      type: 'WMTS', name: 'Modelo Digital de Superficies (Sombreado superficies y consulta de elevaciones edificios y vegetación)',
      url: 'https://wmts-mapa-lidar.idee.es/lidar?',
    }, {
      type: 'WMTS', name: 'Modelo Digital del Terreno (Sombreado terreno y consulta de altitudes)',
      url: 'https://servicios.idee.es/wmts/mdt?',
      white_list: ['EL.ElevationGridCoverage'],
    }, {
      type: 'WMS', name: 'Curvas de nivel y puntos acotados',
      url: 'https://servicios.idee.es/wms-inspire/mdt?',
      white_list: ['EL.ContourLine', 'EL.SpotElevation'],
    }],
  }],
};

const capaGeoJSON = new IDEE.layer.GeoJSON({
  name: 'Capa GeoJSON',
  url: 'https://www.ign.es/resources/geodesia/GNSS/SPTR_geo.json',
  extract: false,
});

map.addLayers(capaGeoJSON);

const capaWMS = new IDEE.layer.WMS({
  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeUnit',
  legend: 'Capa WMS',
});

map.addLayers(capaWMS);

let mp = null;

const createPlugin = (options) => {
  mp = new IDEE.plugin.Layerswitcher(options);
  window.mp = mp;
  map.addPlugin(mp);
};

const removePlugin = () => {
  if (mp) map.removePlugins(mp);
};

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => { removePlugin(); });

const selectPosition = document.getElementById('selectPosition');
const selectCollapsed = document.getElementById('selectCollapsed');
const inputTooltip = document.getElementById('inputTooltip');
const inputOrder = document.getElementById('inputOrder');
const selectAdd = document.getElementById('selectAddLayers');
const selectStatus = document.getElementById('selectStatusLayers');
const inputTools = document.getElementById('inputTools');
const selectMoveLayer = document.getElementById('isMoveLayers');
const selectModeSelectLayers = document.getElementById('modeSelectLayers');
const inputPrecharged = document.getElementById('inputPrecharged');
const selectHttp = document.getElementById('isHttp');
const selectHttps = document.getElementById('isHttps');
const selectShowCatalog = document.getElementById('isShowCatalog');
const selectProxy = document.getElementById('selectProxy');
const selectDisplay = document.getElementById('selectDisplay');
const selectUseAttributions = document.getElementById('selectUseAttributions');

const boolVal = (select, defaultVal = true) => {
  const v = select.options[select.selectedIndex].value;
  if (v === '') return defaultVal;
  return v === 'true';
};

const updatePlugin = () => {
  const options = {};
  options.position = selectPosition.options[selectPosition.selectedIndex].value;
  options.collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value === '' || selectCollapsed.options[selectCollapsed.selectedIndex].value === 'true';
  options.order = Number(inputOrder.value);
  options.addLayers = boolVal(selectAdd, true);
  options.statusLayers = boolVal(selectStatus, true);
  options.tooltip = inputTooltip.value || '';
  options.tools = inputTools.value !== '' ? inputTools.value.split(', ') : [];
  options.isMoveLayers = boolVal(selectMoveLayer, false);
  options.modeSelectLayers = selectModeSelectLayers.options[selectModeSelectLayers.selectedIndex].value || 'eyes';
  if (inputPrecharged.value.trim() !== '') {
    try { options.precharged = JSON.parse(inputPrecharged.value); } catch (e) { options.precharged = inputPrecharged.value; }
  } else {
    options.precharged = PRECHARGED;
  }
  options.http = boolVal(selectHttp, true);
  options.https = boolVal(selectHttps, true);
  options.showCatalog = boolVal(selectShowCatalog, false);
  options.useProxy = boolVal(selectProxy, true);
  options.displayLabel = boolVal(selectDisplay, false);
  options.useAttributions = boolVal(selectUseAttributions, false);

  removePlugin();
  createPlugin(options);
};

[
  selectPosition,
  selectCollapsed,
  inputOrder,
  inputTooltip,
  selectAdd,
  selectStatus,
  inputTools,
  selectMoveLayer,
  selectModeSelectLayers,
  inputPrecharged,
  selectHttp,
  selectHttps,
  selectShowCatalog,
  selectProxy,
  selectDisplay,
  selectUseAttributions,
].forEach((ctrl) => {
  ctrl.addEventListener('change', updatePlugin);
});

updatePlugin();
