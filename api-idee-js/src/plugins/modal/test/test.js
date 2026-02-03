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
    collapsed: options.collapsed !== undefined ? options.collapsed : true,
    collapsible: options.collapsible !== undefined ? options.collapsible : true,
    position: options.position ? options.position : 'LEFT',
    tooltip: 'Más información',
    // eslint-disable-next-line object-property-newline
    url_en: 'template_en', url_es: 'template_es',
    // url_en: 'https://www.ign.es/iberpix/ayuda/en.html', url_es: 'https://www.ign.es/iberpix/ayuda/es.html',
    // helpLink: { en: 'https://www.ign.es/iberpix/ayuda/en.html', es: 'https://www.ign.es/iberpix/ayuda/es.html'},
    order: 1,
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

const recreatePlugin = () => {
  removePlugin();
  const options = {};
  // Position
  options.position = selectPosition.options[selectPosition.selectedIndex].value;

  // Collapsed
  const collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value;
  if (collapsed !== '') options.collapsed = (collapsed === 'true');

  // Collapsible
  const collapsibleValue = selectCollapsible.options[selectCollapsible.selectedIndex].value;
  options.collapsible = (collapsibleValue === 'true');

  createControl(options);
};

selectPosition.addEventListener('change', recreatePlugin);
selectCollapsed.addEventListener('change', recreatePlugin);
selectCollapsible.addEventListener('change', recreatePlugin);

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => {
  removePlugin();
});

recreatePlugin();
