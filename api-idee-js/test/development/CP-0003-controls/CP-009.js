import { map as Mmap } from 'IDEE/api-idee';
import Attributions from 'IDEE/control/Attributions';
// import WMS from 'IDEE/layer/WMS';
import OSM from 'IDEE/layer/OSM';
import { setLang } from '../../../src/facade/js/i18n/language';

const urlParams = new URLSearchParams(window.location.search);
setLang(urlParams.get('language') || 'es');
const map = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
  controls: ['rotate'],
  center: [-443273.10081370454, 4757481.749296248],
  // layers: ['OSM'],
  zoom: 6,
});

// const layerBaseAdministrative = new WMS({
//   is: 'ign_adm_uds',
//   url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
//   name: 'AU.AdministrativeBoundary',
//   legend: 'Limite administrativo',
//   tiled: false,
//   attribution: {
//     name: 'Capa WMS',
//     description: 'Descripción WMS',
//     url: 'https://www.ign.es',
//     // eslint-disable-next-line max-len
//     // contentAttributions: '${api-idee.static_resources.url}/Datos/reconocimientos/WMTS_PNOA_20170220/atribucionPNOA_Url.kml',
//     contentAttributions: '',
//     contentType: 'kml',
//   },
// }, {});

const layerOpenStreetMap = new OSM({
  name: 'OSM',
  legend: 'OSM',
  url: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
  matrixSet: 'EPSG:3857',
  isBase: false,
  visibility: true,
});

const layers = [
  // layerBaseAdministrative,
  layerOpenStreetMap,
];

const selectPosition = document.getElementById('selectPosicion');
const selectCollapsed = document.getElementById('selectCollapsed');
const selectCollapsible = document.getElementById('selectCollapsible');
const inputOrder = document.getElementById('inputOrder');
const inputTooltip = document.getElementById('inputTooltip');
const inputTitle = document.getElementById('inputTitle');

const create = (options) => {
  if (!map.hasControl(Attributions.NAME)) map.addControls(new Attributions(options));
};

const remove = () => {
  const ctrls = map.getControls(Attributions.NAME);
  if (ctrls.length === 1) map.removeControls(ctrls[0]);
};

const recreate = () => {
  remove();

  const options = {};

  options.position = selectPosition.options[selectPosition.selectedIndex].value;
  const collapsible = selectCollapsible.options[selectCollapsible.selectedIndex].value;
  if (collapsible !== '') options.collapsible = (collapsible === 'true');

  const collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value;
  if (collapsed !== '') options.collapsed = (collapsed === 'true');

  const order = inputOrder.value;
  if (order !== undefined) options.order = Number(order);

  if (inputTooltip.value !== '') options.tooltip = inputTooltip.value;

  if (inputTitle.value !== '') options.title = inputTitle.value;

  create(options);
};

[
  selectPosition,
  selectCollapsed,
  selectCollapsible,
  inputOrder,
  inputTooltip,
  inputTitle,
].forEach((ctrl) => {
  ctrl.addEventListener('change', recreate);
});

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => {
  remove();
});

const removeLayerOSMButton = document.getElementById('removeLayerOSM');
removeLayerOSMButton.addEventListener('click', () => {
  map.removeLayers(layerOpenStreetMap);
});

const addLayerOSMButton = document.getElementById('addLayerOSM');
addLayerOSMButton.addEventListener('click', () => {
  map.removeLayers(layerOpenStreetMap);
  map.addLayers(layerOpenStreetMap);
});

recreate();

map.addLayers(layers);
