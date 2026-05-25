import Basic from 'facade/basic';

window.IDEE.plugin.Basic = Basic;

IDEE.language.setLang('es');

const map = IDEE.map({
  container: 'mapjs',
});
window.map = map;

let mp;

const createPlugin = (options) => {
  mp = new IDEE.plugin.Basic(options);
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
const inputSvgPath = document.getElementById('inputSvgPath');
const inputPluginContent = document.getElementById('inputPluginContent');

const parseBool = (val) => {
  if (val === 'true') return true;
  if (val === 'false') return false;
  return undefined;
};

const updatePlugin = () => {
  const options = {};

  options.position = selectPosition.value;
  options.collapsed = parseBool(selectCollapsed.value);
  options.order = Number(inputOrder.value);
  options.tooltip = inputTooltip.value.trim();
  options.svgPath = inputSvgPath.value.trim();
  const pluginContentRaw = inputPluginContent.value.trim();
  if (pluginContentRaw) {
    try { options.pluginContent = JSON.parse(pluginContentRaw); } catch (e) { }
  }

  removePlugin();
  createPlugin(options);
};

[
  selectPosition,
  selectCollapsed,
  inputOrder,
  inputTooltip,
  inputSvgPath,
  inputPluginContent,
].forEach((ctrl) => {
  ctrl.addEventListener('change', updatePlugin);
});

updatePlugin();
