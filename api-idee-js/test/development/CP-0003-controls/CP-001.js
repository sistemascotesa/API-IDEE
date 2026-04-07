import { map as Mmap } from 'IDEE/api-idee';
import WMS from 'IDEE/layer/WMS';
import BackgroundLayers from 'IDEE/control/BackgroundLayers';

// IDEE.config.backgroundlayers = [{
//   id: 'mapa',
//   title: 'Callejero',
//   layers: [
//     Raster3,
//     Raster2,
//   ],
// }];

const map = Mmap({
  container: 'map',
  // controls: ['backgroundlayers'],
  controls: ['scale'],
  zoom: 5,
  maxZoom: 20,
  minZoom: 4,
  center: [-467062.8225, 4683459.6216],
});

const layerinicial = new WMS({
  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeBoundary',
  legend: 'Limite administrativo',
  tiled: false,
}, {});

const layerUA = new WMS({
  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeUnit',
  legend: 'Unidad administrativa',
  tiled: false,
}, {});

const layers = [layerinicial, layerUA];

const selectPosition = document.getElementById('selectPosicion');
const inputTooltip = document.getElementById('inputTooltip');
const inputOrder = document.getElementById('inputOrder');
const inputLayerIndex = document.getElementById('inputLayerIndex');

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

  if (inputLayerIndex.value && inputLayerIndex.value !== '') options.layerIndex = Number(inputLayerIndex.value);

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

map.addLayers(layers);
