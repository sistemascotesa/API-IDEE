import { map as Mmap } from 'IDEE/api-idee';
import OverviewMap from 'IDEE/control/OverviewMap';

const map = Mmap({
  container: 'map',
  controls: ['rotate'],
  projection: 'EPSG:3857',
  center: [-467062.8225, 4683459.6216],
  zoom: 6,
});

const create = (options) => {
  if (!map.hasControl(OverviewMap.NAME)) {
    map.addControls(new OverviewMap(options));
  }
};

const remove = () => {
  const ctrls = map.getControls(OverviewMap.NAME);
  if (ctrls.length === 1) map.removeControls(ctrls);
};

const selectPosition = document.getElementById('selectPosicion');
const inputTooltip = document.getElementById('inputTooltip');
const selectCollapsible = document.getElementById('selectCollapsible');
const selectCollapsed = document.getElementById('selectCollapsed');
const inputOrder = document.getElementById('inputOrder');

const inputZoom = document.getElementById('inputZoom');
const selectFixed = document.getElementById('selectFixed');
const inputBaseLayer = document.getElementById('inputBaseLayer');

const recreate = () => {
  remove();
  const options = {};

  options.position = selectPosition.options[selectPosition.selectedIndex].value;

  if (inputTooltip.value !== '') options.tooltip = inputTooltip.value;

  const collapsible = selectCollapsible.options[selectCollapsible.selectedIndex].value;
  if (collapsible !== '') options.collapsible = (collapsible === 'true');

  const collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value;
  if (collapsed !== '') options.collapsed = (collapsed === 'true');

  if (inputOrder.value !== undefined) options.order = Number(inputOrder.value);

  if (inputZoom.value) options.zoom = Number(inputZoom.value);

  const fixed = selectFixed.options[selectFixed.selectedIndex].value;
  if (fixed !== '') options.fixed = (fixed === 'true');

  if (inputBaseLayer.value !== '') options.baseLayer = inputBaseLayer.value;
  create(options);
};

[
  selectPosition,
  inputTooltip,
  inputOrder,
  selectCollapsed,
  selectCollapsible,
  inputZoom,
  selectFixed,
  inputBaseLayer,
].forEach((ctrl) => {
  ctrl.addEventListener('change', recreate);
});

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => {
  remove();
});

recreate();
