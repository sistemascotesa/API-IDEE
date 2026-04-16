/* eslint-disable no-unused-vars,max-len */
import Comparators from 'facade/comparators';

window.IDEE.plugin.Comparators = Comparators;

IDEE.language.setLang('es');

const map = IDEE.map({
  container: 'mapjs',
  zoom: 6,
  center: [-467062.8225, 4683459.6216],
});

window.map = map;

/* // Capas de prueba SENTINEL
const SENTINELlistBaseLayersByString = [
  'WMS*Huellas Sentinel2*https://wms-satelites-historicos.idee.es/satelites-historicos*teselas_sentinel2_espanna*true',
  'WMS*Invierno 2022 falso color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2022invierno_432-1184*true',
  'WMS*Invierno 2022 falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*SENTINEL.2022invierno_843*true',
  'WMS*Filomena*https://wms-satelites-historicos.idee.es/satelites-historicos*Filomena*true',
]; // */

/* // Capas de prueba Landsat
const capas = [
  'WMS*Landsat 5 TM 1996. Color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT5.1996_321-543*true',
  'WMS*Landsat 5 TM 1996. Falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT5.1996_432*true',
  'WMS*Landsat 5 TM 1991. Color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT5.1991_321-543*true',
  'WMS*Landsat 5 TM 1991. Falso color infrarrojo*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT5.1991_432*true',
  'WMS*Landsat 5 TM 1986. Color natural*https://wms-satelites-historicos.idee.es/satelites-historicos*LANDSAT5.1986_321-543*true',
]; // */

let mp;

const createPlugin = (options) => {
  mp = new IDEE.plugin.Comparators(options);
  window.mp = mp;
  map.addPlugin(mp);
};

const removePlugin = () => {
  if (mp) map.removePlugins(mp);
};

const parseOrFalse = (input) => {
  const val = input.value.trim();
  return val === 'false' ? false : JSON.parse(val);
};

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => { removePlugin(); });

const selectPosicion = document.getElementById('selectPosicion');
const selectCollapsed = document.getElementById('selectCollapsed');
const selectEnabledKeyFunctions = document.getElementById('enabledKeyFunctions');
const selectDefaultCompareMode = document.getElementById('defaultCompareMode');
const inputListLayers = document.getElementById('listLayers');
const inputTooltipComparator = document.getElementById('tooltipComparator');
const inputTransparencyParams = document.getElementById('transparencyParams');
const inputLyrcompareParams = document.getElementById('lyrcompareParams');
const inputMirrorpanelParams = document.getElementById('mirrorpanelParams');
const inputWindowsyncParams = document.getElementById('windowsyncParams');

const updatePlugin = () => {
  const options = {};
  options.position = selectPosicion.options[selectPosicion.selectedIndex].value;
  options.collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value === 'true';
  options.enabledKeyFunctions = selectEnabledKeyFunctions.options[selectEnabledKeyFunctions.selectedIndex].value === 'true';
  options.defaultCompareMode = selectDefaultCompareMode.options[selectDefaultCompareMode.selectedIndex].value;
  options.listLayers = JSON.parse(inputListLayers.value.replace(/'/g, '"'));
  options.tooltip = inputTooltipComparator.value;
  options.transparencyParams = parseOrFalse(inputTransparencyParams);
  options.lyrcompareParams = parseOrFalse(inputLyrcompareParams);
  options.mirrorpanelParams = parseOrFalse(inputMirrorpanelParams);
  options.windowsyncParams = parseOrFalse(inputWindowsyncParams);

  removePlugin();
  createPlugin(options);
};

[
  selectPosicion,
  selectCollapsed,
  selectEnabledKeyFunctions,
  selectDefaultCompareMode,
  inputListLayers,
  inputTooltipComparator,
  inputTransparencyParams,
  inputLyrcompareParams,
  inputMirrorpanelParams,
  inputWindowsyncParams,
].forEach((ctrl) => {
  ctrl.addEventListener('change', updatePlugin);
});

updatePlugin();
