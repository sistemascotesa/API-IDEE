/* eslint-disable max-len */
import ViewManagement from 'facade/viewmanagement';

IDEE.language.setLang('es');
// IDEE.language.setLang('en');

const map = IDEE.map({
  container: 'mapjs',
  zoom: 5,
  maxZoom: 20,
  minZoom: 4,
  center: [-467062.8225, 4783459.6216],
});
window.map = map;

let mp = null;

const selectPosicion = document.getElementById('selectPosicion');
const inputOrder = document.getElementById('inputOrder');
const inputTooltip = document.getElementById('inputTooltip');
const selectCollapsed = document.getElementById('selectCollapsed');
const inputPredefinedZoom = document.getElementById('inputPredefinedZoom');
const selectZoomExtent = document.getElementById('selectZoomExtent');
const selectViewhistory = document.getElementById('selectViewhistory');
const selectZoompanel = document.getElementById('selectZoompanel');

function create(propiedades) {
  mp = new ViewManagement(propiedades);
  map.addPlugin(mp);
}

function remove() {
  if (mp) map.removePlugin(mp);
  mp = null;
}

function changeTest() {
  remove();
  const options = {};

  const selectPosition = selectPosicion.options[selectPosicion.selectedIndex].value;
  if (selectPosition !== '') options.position = selectPosition;

  if (inputTooltip.value !== '') options.tooltip = inputTooltip.value;

  const collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value;
  if (collapsed !== '') options.collapsed = (collapsed === 'true');

  if (inputOrder.value !== undefined) options.order = Number(inputOrder.value);

  if (inputPredefinedZoom.value !== '') options.predefinedZoom = JSON.parse(inputPredefinedZoom.value);

  const zoomExtent = selectZoomExtent.options[selectZoomExtent.selectedIndex].value;
  if (zoomExtent !== '') options.zoomExtent = (zoomExtent === 'true');

  const viewhistory = selectViewhistory.options[selectViewhistory.selectedIndex].value;
  if (viewhistory !== '') options.viewhistory = (viewhistory === 'true');

  const zoompanel = selectZoompanel.options[selectZoompanel.selectedIndex].value;
  if (zoompanel !== '') options.zoompanel = (zoompanel === 'true');

  create(options);
}

[
  selectPosicion,
  inputTooltip,
  selectCollapsed,
  inputOrder,
  inputPredefinedZoom,
  selectZoomExtent,
  selectViewhistory,
  selectZoompanel,
].forEach((elm) => { elm.addEventListener('change', changeTest); });

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => { remove(); });

changeTest();
