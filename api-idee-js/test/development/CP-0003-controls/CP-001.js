/* eslint-disable camelcase */
import { map as Mmap } from 'IDEE/api-idee';
import BackgroundLayers from 'IDEE/control/BackgroundLayers';
import { setLang } from '../../../src/facade/js/i18n/language';

const backgroundlayersIds = 'mapa,imagen,hibrido'.split(',');
const backgroundlayersTitles = 'Base IGN,Imagen,Hibrido'.split(',');
// const backgroundlayersTooltips = 'Base IGN,Imagen,Hibrido'.split(',');
const backgroundlayersLayers = 'QUICK*Base_IGNBaseTodo_TMS,QUICK*BASE_PNOA_MA_TMS,QUICK*BASE_HIBRIDO_LayerGroup'.split(',');
IDEE.config.backgroundlayers = backgroundlayersIds.map((id, index) => {
  return {
    id,
    title: backgroundlayersTitles[index],
    // tooltip: `Seleccionar ${backgroundlayersTooltips[index]}`,
    layers: backgroundlayersLayers[index].split('+'),
  };
});

// eslint-disable-next-line no-console
// console.log(JSON.parse(JSON.stringify(IDEE.config.backgroundlayers)));

const urlParams = new URLSearchParams(window.location.search);
setLang(urlParams.get('language') || 'es');

const map = Mmap({
  container: 'map',
  // controls: ['backgroundlayers'],
  controls: ['scale'],
  zoom: 5,
  maxZoom: 20,
  minZoom: 4,
  center: [-467062.8225, 4683459.6216],
});

const selectPosition = document.getElementById('selectPosicion');
const inputTooltip = document.getElementById('inputTooltip');
const inputOrder = document.getElementById('inputOrder');
const inputLayerIndex = document.getElementById('inputLayerIndex');
const selectVisible = document.getElementById('selectVisible');

const create = (options) => {
  if (!map.hasControl(BackgroundLayers.NAME)) map.addControls(new BackgroundLayers(options));
};

const remove = () => {
  const ctrls = map.getControls(BackgroundLayers.NAME);
  if (ctrls.length === 1) map.removeControls(ctrls[0]);
};

const recreate = () => {
  remove();

  const options = {};
  options.position = selectPosition.options[selectPosition.selectedIndex].value;

  const order = inputOrder.value;
  if (order !== undefined) options.order = Number(order);

  if (inputTooltip.value !== '') options.tooltip = inputTooltip.value;

  if (inputLayerIndex.value !== '') options.layerIndex = Number(inputLayerIndex.value);

  const visible = selectVisible.options[selectVisible.selectedIndex].value;
  if (visible !== '') options.visible = visible === 'true';

  create(options);
};

[
  selectPosition,
  inputTooltip,
  inputOrder,
  inputLayerIndex,
].forEach((ctrl) => {
  ctrl.addEventListener('change', recreate);
});

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => {
  remove();
});

recreate();
