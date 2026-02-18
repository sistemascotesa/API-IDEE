/* eslint-disable max-len */
import Infocoordinates from 'facade/infocoordinates';
// eslint-disable-next-line import/no-relative-packages
import { RIGHT } from '../../../facade/js/ui/position';

IDEE.language.setLang('es');
// IDEE.language.setLang('en');

const map = IDEE.map({
  container: 'mapjs',
  zoom: 7,
  center: [-467062.8225, 4783459.6216],
});
window.map = map;

let plugin;

const createControl = (options) => {
  plugin = new Infocoordinates({
    position: RIGHT,
    collapsed: true,
    collapsible: true,
    tooltip: 'Información coordenadas',
    decimalGEOcoord: 12,
    decimalUTMcoord: 12,
    helpUrl: 'https://www.ign.es/',
    outputDownloadFormat: 'txt', // csv | txt
  });
  map.addPlugin(plugin);
};

const removePlugin = () => {
  if (plugin) {
    map.removePlugin(plugin);
  }
};

const selectPosition = document.getElementById('selectPosicion');
const selectCollapsed = document.getElementById('selectCollapsed');

const recreatePlugin = () => {
  removePlugin();
  const options = {};
  options.position = selectPosition.options[selectPosition.selectedIndex].value;
  const collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value;
  if (collapsed !== '') options.collapsed = (collapsed === 'true');
  createControl(options);
};

selectPosition.addEventListener('change', recreatePlugin);
selectCollapsed.addEventListener('change', recreatePlugin);

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => {
  removePlugin();
});

recreatePlugin();

/* / PRUEBA con otros plugins
const mp2 = new IDEE.plugin.Information({ position: 'TR', buffer: 100 });
const mp3 = new IDEE.plugin.Vectors({ position: 'TR', collapsed: true, collapsible: true, wfszoom: 12 });
const mp4 = new IDEE.plugin.MeasureBar({ position: 'TR' });
map.addPlugin(mp2); window.mp2 = mp2;
map.addPlugin(mp3); window.mp3 = mp3;
map.addPlugin(mp4); window.mp4 = mp4; // */
