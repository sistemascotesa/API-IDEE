import { map as Mmap } from 'IDEE/api-idee';
import MeasureBar from 'IDEE/control/MeasureBar';

const map = Mmap({
  container: 'map',
  controls: ['rotate'],
  projection: 'EPSG:3857',
  center: [-467062.8225, 4683459.6216],
  zoom: 6,
});

const selectPosition = document.getElementById('selectPosicion');
const inputTooltip = document.getElementById('inputTooltip');
const inputOrder = document.getElementById('inputOrder');
const selectCollapsed = document.getElementById('selectCollapsed');
const selectCollapsible = document.getElementById('selectCollapsible');

const create = (options) => {
  if (!map.hasControl(MeasureBar.NAME)) {
    map.addControls(new MeasureBar(options));
  }
};

const remove = () => {
  const ctrls = map.getControls(MeasureBar.NAME);
  if (ctrls.length === 1) map.removeControls(ctrls);
};

const recreate = () => {
  remove();

  const options = {};
  options.position = selectPosition.options[selectPosition.selectedIndex].value;

  if (inputTooltip.value !== '') options.tooltip = inputTooltip.value;

  if (inputOrder.value !== undefined) options.order = Number(inputOrder.value);

  const collapsible = selectCollapsible.options[selectCollapsible.selectedIndex].value;
  if (collapsible !== '') options.collapsible = (collapsible === 'true');

  const collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value;
  if (collapsed !== '') options.collapsed = (collapsed === 'true');

  create(options);
};

[
  selectPosition,
  inputTooltip,
  inputOrder,
  selectCollapsed,
  selectCollapsible,
].forEach((ctrl) => {
  ctrl.addEventListener('change', recreate);
});

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => {
  remove();
});

recreate();
