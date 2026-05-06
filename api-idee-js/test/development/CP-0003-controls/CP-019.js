import { map as Mmap } from 'IDEE/api-idee';
import Scale from 'IDEE/control/Scale';

const map = Mmap({
  container: 'map',
  controls: ['scaleline'],
  projection: 'EPSG:3857',
  center: [-467062.8225, 4683459.6216],
  zoom: 6,
});

const create = (options) => {
  if (!map.hasControl(Scale.NAME)) {
    map.addControls(new Scale(options));
  }
};

const remove = () => {
  const ctrls = map.getControls(Scale.NAME);
  if (ctrls.length === 1) map.removeControls(ctrls);
};

const selectPosition = document.getElementById('selectPosicion');
const inputTooltip = document.getElementById('inputTooltip');
const inputOrder = document.getElementById('inputOrder');
const selectExactScale = document.getElementById('selectExactScale');

const recreate = () => {
  remove();
  const options = {};

  const position = selectPosition.options[selectPosition.selectedIndex].value;
  if (position !== '') options.position = position;

  if (inputTooltip.value !== '') options.tooltip = inputTooltip.value;

  if (inputOrder.value !== undefined) options.order = Number(inputOrder.value);

  const exactScale = selectExactScale.options[selectExactScale.selectedIndex].value;
  if (exactScale !== '') options.exactScale = exactScale === 'true';

  create(options);
};

[
  selectPosition,
  inputTooltip,
  inputOrder,
  selectExactScale,
].forEach((ctrl) => {
  ctrl.addEventListener('change', recreate);
});

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => {
  remove();
});

recreate();
