import { map as Mmap } from 'IDEE/api-idee';
import Location from 'IDEE/control/Location';

const map = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
  controls: ['rotate'],
  // controls: ['location*true*false'],
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
});

const selectPosition = document.getElementById('selectPosicion');
const inputTooltip = document.getElementById('inputTooltip');
const inputOrder = document.getElementById('inputOrder');
const selectTraking = document.getElementById('selectTraking');
const selectHighAccuracy = document.getElementById('selectHighAccuracy');
const inputMaximunAge = document.getElementById('inputMaximunAge');

const create = (options) => {
  if (!map.hasControl(Location.NAME)) {
    map.addControls(new Location(options));
  }
};

const remove = () => {
  const ctrls = map.getControls(Location.NAME);
  if (ctrls.length === 1) map.removeControls(ctrls[0]);
};

const recreate = () => {
  remove();

  const options = {};
  options.position = selectPosition.options[selectPosition.selectedIndex].value;

  if (inputOrder.value !== undefined) options.order = Number(inputOrder.value);

  if (inputTooltip.value !== '') options.tooltip = inputTooltip.value;

  options.traking = (selectTraking.options[selectTraking.selectedIndex].value === 'true');
  options.highAccuracy = (selectHighAccuracy.options[selectHighAccuracy.selectedIndex].value === 'true');

  if (inputMaximunAge.value !== undefined) options.maximunAge = Number(inputMaximunAge.value);

  create(options);
};

[
  selectPosition,
  inputTooltip,
  inputOrder,
  selectTraking,
  selectHighAccuracy,
  inputMaximunAge,
].forEach((ctrl) => {
  ctrl.addEventListener('change', recreate);
});

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => {
  remove();
});

recreate();
