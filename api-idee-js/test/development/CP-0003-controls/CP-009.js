import { map as Mmap } from 'IDEE/api-idee';
import Attributions from 'IDEE/control/Attributions';
import WMS from 'IDEE/layer/WMS';
import OSM from 'IDEE/layer/OSM';

const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
  // controls: ['attributions*<p>Contenido del control</p>'],
  // eslint-disable-next-line max-len
  // controls: ['location', 'attributions*<p>Contenido del control</p>', 'rotate', 'ImplementationSwitcher'],
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
});

// En vez de new IDEE.layer.WMS
const layerBaseAdministrative = new WMS({
  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeBoundary',
  legend: 'Limite administrativo',
  tiled: false,
  attribution: {
    name: 'Capa WMS',
    description: 'Descripción WMS',
    url: 'https://www.ign.es',
    // contentAttributions: '${api-idee.static_resources.url}/Datos/reconocimientos/WMTS_PNOA_20170220/atribucionPNOA_Url.kml',
    contentAttributions: '',
    contentType: 'kml',
  },
}, {});

const layerOpenStreetMap = new OSM({
  name: 'OSM',
  legend: 'OSM',
  url: 'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
  matrixSet: 'EPSG:3857',
  isBase: false,
  visibility: true,
});

mapa.addLayers([layerBaseAdministrative, layerOpenStreetMap]);

let ctrl;

const selectPosition = document.getElementById('selectPosicion');
const selectCollapsed = document.getElementById('selectCollapsed');
const selectCollapsible = document.getElementById('selectCollapsible');
const inputTooltip = document.getElementById('inputTooltip');

const create = (options) => {
  ctrl = new Attributions(options);
  mapa.addControls(ctrl);
};

const remove = () => {
  mapa.removeControls(ctrl);
  ctrl = null;
};

const recreate = () => {
  if (ctrl != null) remove();
  const options = {};

  options.position = selectPosition.options[selectPosition.selectedIndex].value;
  const collapsible = selectCollapsible.options[selectCollapsible.selectedIndex].value;
  if (collapsible !== '') options.collapsible = (collapsible === 'true');

  const collapsed = selectCollapsed.options[selectCollapsed.selectedIndex].value;
  if (collapsed !== '') options.collapsed = (collapsed === 'true');

  if (inputTooltip.value !== '') options.tooltip = inputTooltip.value;
  create(options);
};

selectPosition.addEventListener('change', recreate);
selectCollapsed.addEventListener('change', recreate);
selectCollapsible.addEventListener('change', recreate);
inputTooltip.addEventListener('change', recreate);

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => {
  remove();
});

recreate();
