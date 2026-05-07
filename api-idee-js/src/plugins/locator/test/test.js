/* eslint-disable max-len */
import Locator from 'facade/locator';

IDEE.language.setLang('es');
// IDEE.language.setLang('en');

// IDEE.proxy(false);

const map = IDEE.map({
  container: 'mapjs',
  zoom: 5,
  maxZoom: 20,
  minZoom: 4,
  center: [-467062.8225, 4783459.6216],
});
window.map = map;

// const mp = new Locator({
//   useProxy: false,
//   byPlaceAddressPostal: {
//     // maxResults: 5,
//     // noProcess: 'poblacion', // 'municipio' | 'poblacion' | 'toponimo' | 'callejero' | 'municipio,poblacion' | 'municipio,provincia,comunidad%20autonoma,poblacion,toponimo,expendeduria,ngbe,callejero,carretera,portal' | etc
//     countryCode: 'es',
//     reverse: true, // Añadir o no la opción de escoger punto del mapa en el buscado
//     resultVisibility: true,
//     // urlCandidates: 'https://www.cartociudad.es/geocoder/api/geocoder/candidatesJsonp',
//     // urlFind: 'https://www.cartociudad.es/geocoder/api/geocoder/findJsonp',
//     urlReverse: 'https://www.cartociudad.es/geocoder/api/geocoder/reverseGeocode',
//     // geocoderCoords: [-5.741757, 41.512058], // Muestra popup con información de este punto, desaparece instantáneamente si esta "requestStreet" puesto.
//     // requestStreet: 'https://www.cartociudad.es/geocoder/api/geocoder/findJsonp?q=Sevilla&type=provincia&tip_via=null&id=41&portal=null&extension=null',
//   },
//   byParcelCadastre: true,
//   byCoordinates: true,
// });

// map.addPlugin(mp);

// map.addPlugin(new IDEE.plugin.Vectors({ position: 'left' }));
map.addPlugin(new IDEE.plugin.Layerswitcher({ position: 'right' }));

// mp.on("infocatastro:locationCentered", (data) => {
//   window.alert(`zoom: ${data.zoom}
//   center: ${data.center[0].toFixed(2)}, ${data.center[1].toFixed(2)}`);
// });

// mp.on("xylocator:locationCentered", (data) => {
//   window.alert(`zoom: ${data.zoom}
//   center: ${data.center[0].toFixed(2)}, ${data.center[1].toFixed(2)}`);
// });

// mp.on("ignsearchlocator:entityFound", (extent) => {
//   // eslint-disable-next-line no-alert
//   window.alert("Encontrado");
// });

let mp = null;

const selectPosicion = document.getElementById('selectPosicion');
const inputOrder = document.getElementById('inputOrder');
const inputTooltip = document.getElementById('inputTooltip');
const selectCollapsed = document.getElementById('selectCollapsed');
const inputZoom = document.getElementById('inputZoom');
const selectPointStyle = document.getElementById('selectPointStyle');
const selectProxy = document.getElementById('selectProxy');
const selectParcel = document.getElementById('inputByParcelCadastre');
const selectCoordinates = document.getElementById('inputByCoordinates');
const selectPlace = document.getElementById('inputByPlaceAddressPostal');

function create(propiedades) {
  mp = new Locator(propiedades);
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

  if (inputZoom.value !== '') options.zoom = Number(inputZoom.value);

  const pointStyleValue = selectPointStyle.options[selectPointStyle.selectedIndex].value;
  if (pointStyleValue !== '') options.pointStyle = pointStyleValue;

  const useProxySelectValue = selectProxy.options[selectProxy.selectedIndex].value;
  if (useProxySelectValue !== '') options.useProxy = useProxySelectValue === 'true';

  if (selectParcel.value !== '') options.byParcelCadastre = JSON.parse(selectParcel.value);
  if (selectCoordinates.value !== '') options.byCoordinates = JSON.parse(selectCoordinates.value);
  if (selectPlace.value !== '') options.byPlaceAddressPostal = JSON.parse(selectPlace.value);
  create(options);
}

[
  selectPosicion,
  inputTooltip,
  selectCollapsed,
  inputOrder,
  selectProxy,
  inputZoom,
  selectPointStyle,
  selectParcel,
  selectCoordinates,
  selectPlace,
].forEach((elm) => { elm.addEventListener('change', changeTest); });

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => { remove(); });

changeTest();
