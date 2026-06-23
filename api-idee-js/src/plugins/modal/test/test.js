import Modal from 'facade/modal';

IDEE.language.setLang('es');
// IDEE.language.setLang('en');

const map = IDEE.map({
  container: 'mapjs',
});
window.map = map;

let mp;

const createControl = (options) => {
  mp = new Modal({
    // eslint-disable-next-line object-property-newline
    url_en: 'template_en',
    url_es: 'template_es',
    // url_en: 'https://www.ign.es/iberpix/ayuda/en.html', url_es: 'https://www.ign.es/iberpix/ayuda/es.html',
    // helpLink: { en: 'https://www.ign.es/iberpix/ayuda/en.html', es: 'https://www.ign.es/iberpix/ayuda/es.html'},
    ...options,
  });
  map.addPlugin(mp);
  window.mp = mp;
};

const removePlugin = () => {
  if (mp) {
    map.removePlugin(mp);
    mp = null;
  }
};

const selectPosition = document.getElementById('selectPosicion');
const selectCollapsed = document.getElementById('selectCollapsed');
const selectCollapsible = document.getElementById('selectCollapsible');
const inputOrder = document.getElementById('inputOrder');
const inputTooltip = document.getElementById('inputTooltip');
const inputButtonIcon = document.getElementById('buttonIconInput');

const recreatePlugin = () => {
  removePlugin();
  const options = {};
  options.position = selectPosition.options[selectPosition.selectedIndex].value;
  options.collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value === 'true';
  options.collapsible = selectCollapsible.options[selectCollapsible.selectedIndex].value === 'true';
  options.order = Number(inputOrder.value);
  if (inputTooltip.value !== '' && inputTooltip.value) {
    options.tooltip = inputTooltip.value;
  }
  if (inputButtonIcon.value !== '' && inputButtonIcon.value) {
    options.svgPath = inputButtonIcon.value;
  }
  createControl(options);
};

[
  selectPosition,
  selectCollapsed,
  selectCollapsible,
  inputOrder,
  inputTooltip,
  inputButtonIcon,
].forEach((field) => {
  field.addEventListener('change', recreatePlugin);
});

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => {
  removePlugin();
});

recreatePlugin();
