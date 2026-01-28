/* eslint-disable max-len */
import ViewManagement from 'facade/viewmanagement';

IDEE.language.setLang('es');
// IDEE.language.setLang('en');

const map = IDEE.map({
  container: 'mapjs',
});
window.map = map;

let plugin;

const createControl = (options) => {
  plugin = new ViewManagement({
    position: 'TL', // 'TL' | 'TR' | 'BR' | 'BL'
    // collapsible: true,
    collapsed: true,
    isDraggable: true,
    // tooltip: 'TEST TOOLTIP',
    // predefinedZoom: false, // Prueba de excluir
    // predefinedZoom: true, // Prueba default
    // Prueba de predefinedZoom predefinido por usuario
    predefinedZoom: [{
      name: 'Zoom con CENTER',
      center: [-428106.86611520057, 4334472.25393817],
      zoom: 4,
    },
    {
      name: 'Zoom con BBOX',
      bbox: [-2392173.2372, 3033021.2824, 1966571.8637, 6806768.1648],
    }], // */
    zoomExtent: true,
    viewhistory: true,
    zoompanel: true,
    order: 1,
    ...options,
  });
  map.addPlugin(plugin);
};

const removePlugin = () => {
  if (plugin) {
    map.removePlugin(plugin);
    plugin = null;
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
