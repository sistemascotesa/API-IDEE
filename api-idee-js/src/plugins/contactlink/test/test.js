import ContactLink from 'facade/contactlink';
// eslint-disable-next-line import/no-relative-packages
import { LEFT } from '../../../facade/js/ui/position';

IDEE.language.setLang('es');
//IDEE.language.setLang('en');

const map = IDEE.map({
  container: 'mapjs',
  // controls: ['layerswitcher'],
});
window.map = map;

let plugin;

const createControl = (options) => {
  /* //PRUEBA con capa
  const mvt = new IDEE.layer.MVT({
    url: 'https://herramienta-centralizada-sigc.desarrollo.guadaltel.es/geoserver/gwc/service/tms/1.0.0/Global:carloscastellano_rios____cc_20191104@EPSG%3A3857@pbf/{z}/{x}/{-y}.pbf',
    name: 'vectortile',
    projection: 'EPSG:3857',
  });
  map.addLayers(mvt)
  */
  plugin = new ContactLink({
    position: LEFT,
    collapsed: false,
    collapsible: false, // false,
    descargascnig: 'http://centrodedescargas.cnig.es/CentroDescargas/index.jsp',
    pnoa: 'https://www.ign.es/web/comparador_pnoa/index.html',
    visualizador3d: 'https://visualizadores.ign.es/estereoscopico/',
    fototeca: 'https://fototeca.cnig.es/',
    twitter: 'https://twitter.com/IGNSpain',
    instagram: 'https://www.instagram.com/ignspain/',
    facebook: 'https://www.facebook.com/IGNSpain/',
    pinterest: 'https://www.pinterest.es/IGNSpain/',
    youtube: 'https://www.youtube.com/user/IGNSpain',
    mail: 'mailto:ign@fomento.es',
    tooltip: 'Contacta con nosotros',
    // order: 1, //
    ...options,
  });
  map.addPlugin(plugin);
};

const removePlugin = () => {
  map.removePlugin(plugin);
  plugin = null;
};

const selectPosition = document.getElementById('selectPosicion');
const selectCollapsed = document.getElementById('selectCollapsed');
const selectCollapsible = document.getElementById('selectCollapsible');

const recreatePlugin = () => {
  if (plugin) removePlugin();
  const options = {};
  options.position = selectPosition.options[selectPosition.selectedIndex].value;
  const collapsible = selectCollapsible.options[selectCollapsible.selectedIndex].value;
  if (collapsible !== '') options.collapsible = (collapsible === 'true');
  const collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value;
  if (collapsed !== '') options.collapsed = (collapsed === 'true');
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
