/* eslint-disable max-len */
import Infocoordinates from 'facade/infocoordinates';

window.IDEE.plugin.Infocoordinates = Infocoordinates;

IDEE.language.setLang('es');

const map = IDEE.map({
  container: 'mapjs',
  zoom: 5.5,
  maxZoom: 20,
  minZoom: 4,
  center: [-467062.8225, 4683459.6216],
});
window.map = map;

let mp;

const createPlugin = (options) => {
  mp = new IDEE.plugin.Infocoordinates(options);
  window.mp = mp;
  map.addPlugin(mp);
};

const removePlugin = () => {
  if (mp) map.removePlugins(mp);
};

const botonEliminar = document.getElementById('botonEliminar');
botonEliminar.addEventListener('click', () => { removePlugin(); });

const selectPosicion = document.getElementById('selectPosicion');
const selectCollapsed = document.getElementById('selectCollapsed');
const inputOrder = document.getElementById('inputOrder');
const inputTooltip = document.getElementById('inputTooltip');
const inputHelpUrl = document.getElementById('inputHelpUrl');
const inputDecimalGEOcoord = document.getElementById('inputDecimalGEOcoord');
const inputDecimalUTMcoord = document.getElementById('inputDecimalUTMcoord');
const selectOutputDownloadFormat = document.getElementById('selectOutputDownloadFormat');
const inputEpsgResults = document.getElementById('inputEpsgResults');

const updatePlugin = () => {
  const options = {};
  options.position = selectPosicion.options[selectPosicion.selectedIndex].value;
  options.collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value === '' || selectCollapsed.options[selectCollapsed.selectedIndex].value === 'true';
  options.order = Number(inputOrder.value);
  options.tooltip = inputTooltip.value;
  options.helpUrl = inputHelpUrl.value;
  options.decimalGEOcoord = Number(inputDecimalGEOcoord.value);
  options.decimalUTMcoord = Number(inputDecimalUTMcoord.value);
  options.outputDownloadFormat = selectOutputDownloadFormat.options[selectOutputDownloadFormat.selectedIndex].value;
  options.epsgResults = inputEpsgResults.value;

  removePlugin();
  createPlugin(options);
};

[
  selectPosicion,
  selectCollapsed,
  inputOrder,
  inputTooltip,
  inputHelpUrl,
  inputDecimalGEOcoord,
  inputDecimalUTMcoord,
  selectOutputDownloadFormat,
  inputEpsgResults,
].forEach((ctrl) => {
  ctrl.addEventListener('change', updatePlugin);
});

updatePlugin();
