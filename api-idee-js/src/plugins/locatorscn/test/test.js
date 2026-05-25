/* eslint-disable max-len,object-property-newline */
import Locatorscn from 'facade/locatorscn';

window.IDEE.plugin.Locatorscn = Locatorscn;

IDEE.language.setLang('es');

const map = IDEE.map({
  container: 'mapjs',
  zoom: 5,
  minZoom: 4,
  maxZoom: 20,
  center: [-467062.8225, 4783459.6216],
});
window.map = map;

let mp;

const createPlugin = (options) => {
  mp = new IDEE.plugin.Locatorscn(options);
  window.mp = mp;
  map.addPlugin(mp);
};

const removePlugin = () => {
  if (mp) map.removePlugins(mp);
};

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => { removePlugin(); });

const selectPosition = document.getElementById('selectPosition');
const selectCollapsed = document.getElementById('selectCollapsed');
const inputOrder = document.getElementById('inputOrder');
const inputTooltip = document.getElementById('inputTooltip');
const inputZoom = document.getElementById('inputZoom');
const selectPointStyle = document.getElementById('selectPointStyle');
const inputSearchOptions = document.getElementById('inputSearchOptions');
const selectUseProxy = document.getElementById('selectUseProxy');

const safeParseJSON = (val, fallback) => {
  try { return val ? JSON.parse(val) : fallback; } catch (e) { return fallback; }
};

const updatePlugin = () => {
  const options = {};
  options.position = selectPosition.value;
  options.collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value === '' || selectCollapsed.options[selectCollapsed.selectedIndex].value === 'true';
  options.order = Number(inputOrder.value);
  options.tooltip = inputTooltip.value;
  options.zoom = Number(inputZoom.value);
  options.pointStyle = selectPointStyle.options[selectPointStyle.selectedIndex].value;
  options.searchOptions = safeParseJSON(inputSearchOptions.value, {});
  if (selectUseProxy.value !== '') options.useProxy = selectUseProxy.value === 'true';

  removePlugin();
  createPlugin(options);
};

[
  selectPosition,
  selectCollapsed,
  inputOrder,
  inputTooltip,
  inputZoom,
  selectPointStyle,
  inputSearchOptions,
  selectUseProxy,
].forEach((ctrl) => {
  ctrl.addEventListener('change', updatePlugin);
});

updatePlugin();
