import SelectionZoom from 'facade/selectionzoom';

window.IDEE.plugin.SelectionZoom = SelectionZoom;

IDEE.language.setLang('es');

const map = IDEE.map({
  container: 'mapjs',
  zoom: 5,
  maxZoom: 20,
  minZoom: 2,
  center: [-467062.8225, 4783459.6216],
});
window.map = map;

const DEFAULT_OPTIONS = [
  {
    id: 'peninsula',
    title: 'Peninsula',
    preview: '../src/facade/assets/images/espana.png',
    bbox: '-1200091.444315327, 4348955.797933925, 365338.89496508264, 5441088.058207252',
  },
  {
    id: 'canarias',
    title: 'Canarias',
    preview: '../src/facade/assets/images/canarias.png',
    center: '-1844272.618465, 3228700.074766',
    zoom: 8,
  },
  {
    id: 'baleares',
    title: 'Baleares',
    preview: '../src/facade/assets/images/baleares.png',
    bbox: '115720.89020469127,4658411.436032817,507078.4750247937,4931444.501067467',
  },
  {
    id: 'ceuta',
    title: 'Ceuta',
    preview: '../src/facade/assets/images/ceuta.png',
    bbox: '-599755.2558583047, 4281734.817081453, -587525.3313326766, 4290267.100363785',
  },
  {
    id: 'melilla',
    title: 'Melilla',
    preview: '../src/facade/assets/images/melilla.png',
    center: '-327838.4143151213, 4203788.135342773',
    zoom: 14,
  },
];

let mp = null;

const createPlugin = (options) => {
  mp = new SelectionZoom(options);
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
const inputOptions = document.getElementById('inputOptions');

const boolVal = (select, defaultVal = true) => {
  const v = select.options[select.selectedIndex].value;
  if (v === '') return defaultVal;
  return v === 'true';
};

const updatePlugin = () => {
  removePlugin();
  const options = {};
  options.position = selectPosition.options[selectPosition.selectedIndex].value;
  options.collapsed = boolVal(selectCollapsed, true);
  options.order = Number(inputOrder.value);
  options.tooltip = inputTooltip.value || '';
  if (inputOptions.value.trim() !== '') {
    try { options.options = JSON.parse(inputOptions.value); } catch (e) { options.options = DEFAULT_OPTIONS; }
  } else {
    options.options = DEFAULT_OPTIONS;
  }
  createPlugin(options);
};

[
  selectPosition,
  selectCollapsed,
  inputOrder,
  inputTooltip,
  inputOptions,
].forEach((ctrl) => {
  ctrl.addEventListener('change', updatePlugin);
});

updatePlugin();
