/* eslint-disable camelcase */
import { map as Mmap } from 'IDEE/api-idee';
import ImplementationSwitcher from 'IDEE/control/ImplementationSwitcher';

IDEE.config('PROXY_URL', 'https://mapea4-sigc.juntadeandalucia.es/mapea/api/proxy');

const map = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
  // controls: ['rotate'],
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
});

map.flyTo([
  -1060000,
  5150000,
  -650000,
  5450000,
], {
  duration: 500,
  padding: [20, 20, 20, 20],
});

const selectPosition = document.getElementById('selectPosicion');
const inputTooltip = document.getElementById('inputTooltip');
const inputOrder = document.getElementById('inputOrder');
const selectCollapsible = document.getElementById('selectCollapsible');
const selectCollapsed = document.getElementById('selectCollapsed');

const create = (options) => {
  if (!map.hasControl(ImplementationSwitcher.NAME)) {
    map.addControls(new ImplementationSwitcher(options));
  }
};

const remove = () => {
  const ctrls = map.getControls(ImplementationSwitcher.NAME);
  if (ctrls.length === 1) map.removeControls(ctrls[0]);
};

const recreate = () => {
  remove();

  const options = {};
  options.position = selectPosition.options[selectPosition.selectedIndex].value;

  if (inputOrder.value !== undefined) options.order = Number(inputOrder.value);

  if (inputTooltip.value !== '') options.tooltip = inputTooltip.value;

  options.collapsible = (selectCollapsible.options[selectCollapsible.selectedIndex].value === 'true');
  options.collapsed = (selectCollapsed.options[selectCollapsed.selectedIndex].value === 'true');

  create(options);
};

[
  selectPosition,
  inputTooltip,
  inputOrder,
  selectCollapsible,
  selectCollapsed,
].forEach((ctrl) => {
  ctrl.addEventListener('change', recreate);
});

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => {
  remove();
});

recreate();
