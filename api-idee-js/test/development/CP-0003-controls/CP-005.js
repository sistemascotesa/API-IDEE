/* eslint-disable camelcase */
import { map as Mmap } from 'IDEE/api-idee';
import GetFeatureInfo from 'IDEE/control//GetFeatureInfo';
import { wms_001, wms_002, wms_003 } from '../layers/wms/wms';

const map = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
  // controls: ['getfeatureinfo*false'],
  controls: ['location'],
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
});

const selectPosition = document.getElementById('selectPosicion');
const inputTooltip = document.getElementById('inputTooltip');
const inputOrder = document.getElementById('inputOrder');
const inputBuffer = document.getElementById('inputBuffer');
const inputFeatureCount = document.getElementById('inputFeatureCount');
const selectActivated = document.getElementById('selectActivated');

const create = (options) => {
  if (!map.hasControl(GetFeatureInfo.NAME)) map.addControls(new GetFeatureInfo(options));
};

const remove = () => {
  const ctrls = map.getControls(GetFeatureInfo.NAME);
  if (ctrls.length === 1) map.removeControls(ctrls[0]);
};

const recreate = () => {
  remove();

  const options = {};
  options.position = selectPosition.options[selectPosition.selectedIndex].value;

  if (inputOrder.value !== undefined) options.order = Number(inputOrder.value);

  if (inputTooltip.value !== '') options.tooltip = inputTooltip.value;

  if (inputBuffer.value !== '') options.buffer = Number(inputBuffer.value);

  const featuresCount = Number(inputFeatureCount.value);
  if (featuresCount > 0) options.featureCount = featuresCount;

  options.activated = (selectActivated.options[selectActivated.selectedIndex].value === 'true');

  create(options);
};

[
  selectPosition,
  inputTooltip,
  inputOrder,
  inputBuffer,
  inputFeatureCount,
  selectActivated,
].forEach((ctrl) => {
  ctrl.addEventListener('change', recreate);
});

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => {
  remove();
});

recreate();

map.addLayers([wms_001, wms_002, wms_003]);
