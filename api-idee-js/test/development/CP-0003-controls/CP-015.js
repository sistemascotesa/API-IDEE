import { map as Mmap } from 'IDEE/api-idee';
import MeasureBar from 'IDEE/control/MeasureBar';

const map = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
  center: [-467062.8225, 4683459.6216],
  zoom: 6,
});

let ctrl;

const createControl = (options) => {
  ctrl = new MeasureBar(options);
  map.addControls(ctrl);
};

const removeControl = () => {
  map.removeControls(ctrl);
  ctrl = null;
};

const selectPosition = document.getElementById('selectPosicion');
const selectCollapsed = document.getElementById('selectCollapsed');
const selectCollapsible = document.getElementById('selectCollapsible');
const inputTooltip = document.getElementById('inputTooltip');

const recreateControl = () => {
  if (ctrl) removeControl();
  const options = {};
  options.position = selectPosition.options[selectPosition.selectedIndex].value;
  const collapsible = selectCollapsible.options[selectCollapsible.selectedIndex].value;
  if (collapsible !== '') options.collapsible = (collapsible === 'true');
  const collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value;
  if (collapsed !== '') options.collapsed = (collapsed === 'true');
  if (inputTooltip.value !== '') options.tooltip = inputTooltip.value;
  createControl(options);
};

selectPosition.addEventListener('change', recreateControl);
selectCollapsed.addEventListener('change', recreateControl);
selectCollapsible.addEventListener('change', recreateControl);
inputTooltip.addEventListener('change', recreateControl);

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => {
  removeControl();
});

recreateControl();
