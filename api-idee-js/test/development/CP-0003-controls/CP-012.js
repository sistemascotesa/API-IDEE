/* eslint-disable max-len */
import { map as Mmap } from 'IDEE/api-idee';
import ImplementationSwitcher from 'IDEE/control/ImplementationSwitcher';
import Rotate from 'IDEE/control/Rotate';

const map = Mmap({
  container: 'map',
  controls: [ImplementationSwitcher.NAME],
  // controls: ['rotate'],
  // controls: ['rotate**false'],
  // controls: ['rotate*-47.232404252143944,12.669332411802236,38.21770136603959,51.13167021619439'],
  // controls: ['rotate*-47.232404252143944,12.669332411802236,38.21770136603959,51.13167021619439*false'],
});

const create = (options) => {
  if (!map.hasControl(Rotate.NAME)) {
    map.addControls(new Rotate(options));
  }
};

const remove = () => {
  const ctrls = map.getControls(Rotate.NAME);
  if (ctrls.length === 1) map.removeControls(ctrls);
};

const selectPosition = document.getElementById('selectPosicion');
const inputTooltip = document.getElementById('inputTooltip');
const inputOrder = document.getElementById('inputOrder');
const selectHelp = document.getElementById('selectHelp');

const recreate = () => {
  remove();
  const options = {};

  options.position = selectPosition.options[selectPosition.selectedIndex].value;

  if (inputTooltip.value !== '') options.tooltip = inputTooltip.value;

  if (inputOrder.value !== undefined) options.order = Number(inputOrder.value);

  const help = selectHelp.options[selectHelp.selectedIndex].value;
  if (help !== '') options.help = (help === 'true');

  create(options);
};

[
  selectPosition,
  inputTooltip,
  inputOrder,
  selectHelp,
].forEach((ctrl) => {
  ctrl.addEventListener('change', recreate);
});

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => {
  remove();
});

recreate();
