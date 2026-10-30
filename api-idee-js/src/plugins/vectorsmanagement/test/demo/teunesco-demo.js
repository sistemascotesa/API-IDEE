const serviceUrl = 'https://teunescodes.grupotecopy.es/data-idee-api';
const collection = 'local:todos_los_tipos';
const statusElement = document.getElementById('teunesco-status');
const accessStatus = document.getElementById('teunesco-access-status');
const tokenInput = document.getElementById('teunesco-token');

IDEE.config('terrain', { ...IDEE.config.terrain, default: '' });
IDEE.config('baseLayer', []);
IDEE.config('MIN_ZOOM', '');
IDEE.config('MAX_ZOOM', '');

const map = IDEE.map({
  container: 'map',
  projection: 'EPSG:3857',
  bbox: ol.proj.transformExtent([-7.35, 38.65, -5.95, 39.75], 'EPSG:4326', 'EPSG:3857'),
});
map.addLayers(new IDEE.layer.OSM({ name: 'osm', legend: 'OpenStreetMap' }));

const layer = new IDEE.layer.DataIDEE({
  url: serviceUrl,
  name: collection,
  legend: 'Todos los tipos · TEUNESCO',
  limit: 250,
  extract: false,
}, {
  bboxStrategy: false,
  tokenLocation: 'header',
  editingLimits: {
    pageSize: 250, maxFeatures: 1000, maxCoordinates: 100000, maxBytes: 10 * 1024 * 1024,
  },
  style: new IDEE.style.Generic({
    point: { radius: 9, fill: { color: '#007f95' }, stroke: { color: '#fff', width: 3 } },
  }),
});

function onLayerLoad() {
  statusElement.textContent = `${layer.getFeatures().length} entidades cargadas · ${collection}`;
}

function onLayerLoadError() {
  statusElement.textContent = 'No se pudo cargar la colección. Revisa el acceso al servicio y, si requiere autenticación, configura el token.';
}

function onAccessSubmit(event) {
  event.preventDefault();
  const token = tokenInput.value.trim().replace(/^Bearer\s+/i, '');
  if (!token) {
    accessStatus.textContent = 'Introduce el token de tu sesión.';
    tokenInput.focus();
    return;
  }
  layer.setToken(token);
  tokenInput.value = '';
  accessStatus.textContent = 'Token aplicado a la capa. Puedes continuar la edición.';
}

function onClearTokenClick() {
  layer.setToken(null);
  tokenInput.value = '';
  accessStatus.textContent = 'Token eliminado de la capa.';
}

layer.on('load', onLayerLoad);
layer.on('loaderror', onLayerLoadError);
map.addLayers(layer);
const plugin = new IDEE.plugin.VectorsManagement({
  position: 'right',
  collapsed: false,
  selection: true,
  creation: true,
  edition: true,
  addlayer: true,
  style: true,
  analysis: true,
  turf: true,
  download: true,
  help: true,
  snapping: { allLayers: true, intersection: true },
});
plugin.minPanelWidth = 360;
plugin.maxPanelWidth = 440;
map.addPlugin(plugin);
document.getElementById('teunesco-access').addEventListener('submit', onAccessSubmit);
document.getElementById('teunesco-clear-token').addEventListener('click', onClearTokenClick);
document.querySelector('.teunesco-guide').addEventListener('toggle', () => map.getMapImpl().updateSize());

window.teunescoDemo = { map, layer, plugin };
