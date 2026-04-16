import { map as Mmap } from 'IDEE/api-idee';
import Panzoom from 'IDEE/control/Panzoom';

const map = Mmap({
  container: 'map',
  controls: ['rotate'],
  projection: 'EPSG:3857',
  center: [-467062.8225, 4683459.6216],
  zoom: 6,
});

const create = (options) => {
  if (!map.hasControl(Panzoom.NAME)) {
    map.addControls(new Panzoom(options));
  }
};

const remove = () => {
  const ctrls = map.getControls(Panzoom.NAME);
  if (ctrls.length === 1) map.removeControls(ctrls);
};

const selectPosition = document.getElementById('selectPosicion');
const inputTooltip = document.getElementById('inputTooltip');
const inputOrder = document.getElementById('inputOrder');

const recreate = () => {
  remove();
  const options = {};

  options.position = selectPosition.options[selectPosition.selectedIndex].value;

  if (inputTooltip.value !== '') options.tooltip = inputTooltip.value;

  if (inputOrder.value !== undefined) options.order = Number(inputOrder.value);
  create(options);
};

[
  selectPosition,
  inputTooltip,
  inputOrder,
].forEach((ctrl) => {
  ctrl.addEventListener('change', recreate);
});

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => {
  remove();
});

recreate();
