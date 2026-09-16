import { map as Mmap, proxy } from 'IDEE/api-idee';
import WMS from 'IDEE/layer/WMS';
import GeoJSON from 'IDEE/layer/GeoJSON';
import XYZ from 'IDEE/layer/XYZ';
import LayerGroup from 'IDEE/layer/LayerGroup';

const query = new URLSearchParams(window.location.search);
const interval = Number(query.get('interval') || 5000);
const ownInterval = Number(query.get('own') || 1000);
const mode = query.get('mode') || 'on';
const base = query.get('data') || 'http://localhost:8083/datos-prueba/';
proxy(false);
IDEE.config('baseLayer', []);
IDEE.config('terrain', { default: [] });
// El servidor de desarrollo publica los recursos Cesium en /cesium/.
IDEE.config('CESIUM_URL', new URL('/cesium/', window.location.href).href);
const wms = new WMS({ name: 'prueba', url: base + 'wms', useCapabilities: false,
  tiled: false, refreshInterval: ownInterval });
const vector = new GeoJSON({ name: 'vector-inicial', url: base + 'puntos.geojson' });
const params = { container: 'map', projection: 'EPSG:3857', center: [0, 0], zoom: 5,
  layers: [wms, vector], controls: [] };
if (mode === 'on') params.refreshInterval = interval;
if (mode === 'invalid') params.refreshInterval = 0;
const mapa = Mmap(params);
const cesium = !!mapa.getMapImpl().scene;
const capas = [wms, vector];
window.mapa = mapa;
window.capas = capas;
window.capaVector = vector;
let sequence = 0;
let last = vector;
let edited;
document.getElementById('interval').value = interval;
document.getElementById('own').value = ownInterval;
document.getElementById('mode').value = mode;
document.getElementById('data').value = base;
document.getElementById('params').textContent = JSON.stringify({
  mapa: mode === 'none' ? {} : { refreshInterval: params.refreshInterval },
  WMS: { refreshInterval: ownInterval }, GeoJSON: {},
});
document.getElementById('add').onclick = () => {
  sequence += 1;
  last = new XYZ({ name: 'posterior-' + sequence, url: base + 'tiles/{z}/{x}/{y}.png',
    refreshInterval: ownInterval });
  capas.push(last);
  mapa.addLayers(last);
};
document.getElementById('group').disabled = cesium;
document.getElementById('group').onclick = () => {
  sequence += 1;
  const child = new XYZ({ name: 'hijo-' + sequence,
    url: base + 'tiles/{z}/{x}/{y}.png', refreshInterval: 0 });
  last = new LayerGroup({ name: 'grupo-' + sequence, layers: [child], refreshInterval: ownInterval });
  capas.push(last, child);
  mapa.addLayers(last);
};
document.getElementById('remove').onclick = () => mapa.removeLayers(last);
document.getElementById('reinsert').onclick = () => mapa.addLayers(last);
document.getElementById('edit').onclick = () => {
  const feature = vector.getFeatures()[0];
  if (!feature || edited) return;
  edited = { feature, value: feature.getAttribute('revision') };
  feature.setAttribute('revision', 'edición local');
};
document.getElementById('resume').onclick = () => {
  if (!edited) return;
  edited.feature.setAttribute('revision', edited.value);
  vector.resumeAutoRefresh();
  edited = undefined;
};
const statusTimer = setInterval(() => {
  document.getElementById('status').textContent = JSON.stringify(capas.map(layer => ({
    nombre: layer.name, tipo: layer.type, intervaloEfectivo: layer.getAutoRefreshInterval(),
    pausa: layer.isAutoRefreshPaused?.(),
    revision: layer.getFeatures?.()[0]?.getAttribute('revision'),
  })), null, 2);
}, 1000);
document.getElementById('destroy').onclick = () => { clearInterval(statusTimer); mapa.destroy(); };
