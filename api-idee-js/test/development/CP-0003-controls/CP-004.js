import { map as Mmap } from 'IDEE/api-idee';
import WMS from 'IDEE/layer/WMS';
import GetFeatureInfo from 'IDEE/control/GetFeatureInfo';
import { setLang } from '../../../src/facade/js/i18n/language';
// import { wms_001, wms_002, wms_003 } from '../layers/wms/wms';

const urlParams = new URLSearchParams(window.location.search);
setLang(urlParams.get('language') ?? 'es');

const map = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
  // controls: ['getfeatureinfo'],
  controls: ["rotate*position='right'"],
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
});

const selectPosition = document.getElementById('selectPosicion');
const inputTooltip = document.getElementById('inputTooltip');
const inputOrder = document.getElementById('inputOrder');
const featureCountInput = document.getElementById('featureCountInput');
const bufferInput = document.getElementById('bufferInput');
const activatedSelect = document.getElementById('activatedSelect');

const create = (options) => {
  if (!map.hasControl(GetFeatureInfo.NAME)) {
    map.addControls(new GetFeatureInfo(options));
  }
};

const remove = () => {
  const ctrls = map.getControls(GetFeatureInfo.NAME);
  if (ctrls.length === 1) map.removeControls(ctrls);
};

const recreate = () => {
  remove();

  const options = {};

  const position = selectPosition.options[selectPosition.selectedIndex].value;
  if (position !== '') options.position = position;

  if (inputTooltip.value !== '') options.tooltip = inputTooltip.value;

  if (inputOrder.value !== undefined) options.order = Number(inputOrder.value);

  if (featureCountInput.value !== undefined) options.featureCount = Number(featureCountInput.value);

  if (bufferInput.value !== undefined) options.buffer = Number(bufferInput.value);

  const activated = activatedSelect.options[activatedSelect.selectedIndex].value;
  if (activated !== '') options.activated = (activated === 'true');

  create(options);
};

[
  selectPosition,
  inputTooltip,
  inputOrder,
  featureCountInput,
  bufferInput,
  activatedSelect,
].forEach((ctrl) => {
  ctrl.addEventListener('change', recreate);
});

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => {
  remove();
});

recreate();

// const layers = [wms_001, wms_002, wms_003];

// mapa.addLayers([wms_001, wms_002, wms_003]);
// mapa.addLayers(layers);
// mapa.addLayers(wms_002);
// mapa.addLayers(wms_003);

// mapa.addControls('getfeatureinfo*true');

const layerinicial = new WMS({
  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeBoundary',
  legend: 'Limite administrativo',
  tiled: false,
}, {});

// const capaWMS3 = new WMS({
//   url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/wms?',
//   name: 'provincias_pob',
//   legend: 'capaWMS3',
//   tiled: false,
//   isBase: false,
// });

const layer5 = new WMS({
  url: 'https://servicios.ine.es/WMS/WMS_INE_SECCIONES_G01/MapServer/WMSServer?',
  name: 'Secciones2021',
  legend: 'Secciones censales',
  version: '1.1.0',
  tiled: false,
  visibility: true,
}, {});

map.addLayers([layerinicial, layer5]);

// const getControls = mapa.getControls()[0];

// setTimeout(() => {
//   mapa.removeControls(getControls);
// }, 1000);

// mapa.addLayers(layerinicial);
