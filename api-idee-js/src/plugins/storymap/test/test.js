import StoryMap from 'facade/storymap';

window.IDEE.plugin.StoryMap = StoryMap;

const urlParams = new URLSearchParams(window.location.search)
IDEE.language.setLang(urlParams.get('language') || 'es');

const DEFAULT_INDEX = `{"title": "Indice StoryMap","subtitle": "Visualizador de Cervantes y el Madrid del siglo XVII","js": "console.log('HolaMundo')"}`;

const map = IDEE.map({
  container: 'mapjs',
  zoom: 5,
  maxZoom: 20,
  minZoom: 2,
  center: [-467062.8225, 4783459.6216],
});
window.map = map;

let mp = null;

const createPlugin = (options) => {
  mp = new IDEE.plugin.StoryMap(options);
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
const inputDelay = document.getElementById('inputDelay');
const inputContent = document.getElementById('inputContent');
const inputIndexInContent = document.getElementById('inputIndexInContent');

const updatePlugin = () => {
  const options = {};
  options.position = selectPosition.options[selectPosition.selectedIndex].value;
  options.collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value === '' || selectCollapsed.options[selectCollapsed.selectedIndex].value === 'true';
  options.order = Number(inputOrder.value);
  options.tooltip = inputTooltip.value;
  options.delay = Number(inputDelay.value);

  if (inputContent.value.trim() !== '') {
    try { options.content = JSON.parse(inputContent.value); } catch (e) { options.content = undefined; }
  } else {
    options.content = undefined;
  }

  const idxVal = inputIndexInContent.value.trim();
  if (idxVal === 'false') {
    options.indexInContent = false;
  } else if (idxVal !== '') {
    try { options.indexInContent = JSON.parse(idxVal); } catch (e) { options.indexInContent = undefined; }
  } else {
    options.indexInContent = undefined;
  }

  removePlugin();
  createPlugin(options);
};

[
  selectPosition,
  selectCollapsed,
  inputOrder,
  inputTooltip,
  inputDelay,
  inputContent,
  inputIndexInContent,
].forEach((ctrl) => {
  ctrl.addEventListener('change', updatePlugin);
});

updatePlugin();
