import { map as Mmap } from 'IDEE/api-idee';
import ScaleLine from 'IDEE/control/ScaleLine';

const map = Mmap({
  container: 'map',
  controls: ['scale'],
  projection: 'EPSG:3857',
  center: [-467062.8225, 4683459.6216],
  zoom: 6,
});

const create = (options) => {
  if (!map.hasControl(ScaleLine.NAME)) {
    map.addControls(new ScaleLine(options));
  }
};

const remove = () => {
  const ctrls = map.getControls(ScaleLine.NAME);
  if (ctrls.length === 1) map.removeControls(ctrls);
};

const selectPosition = document.getElementById('selectPosicion');
const inputTooltip = document.getElementById('inputTooltip');
const inputOrder = document.getElementById('inputOrder');

const recreate = () => {
  remove();
  const options = {};

  const position = selectPosition.options[selectPosition.selectedIndex].value;
  if (position !== '') options.position = position;

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
