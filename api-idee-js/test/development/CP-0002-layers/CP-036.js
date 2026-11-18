import { map as createMap, proxy } from 'IDEE/api-idee';
import Tiles3D from 'IDEE/layer/Tiles3D';
import Tiles3DStyle from 'IDEE/style/Tiles3D';
import * as EventType from 'IDEE/event/eventtype';

proxy(false);
IDEE.config('CESIUM_URL', new URL('/cesium/', window.location.href).href);

const SAMPLES = 'https://raw.githubusercontent.com/CesiumGS';
const MADRID_VIEW = {
  extent: [-3.697, 40.45, -3.68, 40.46],
  options: { duration: 1, orientation: { heading: 0, pitch: -0.5, roll: 0 } },
};
const PRESETS = {
  discrete: {
    url: `${SAMPLES}/3d-tiles-samples/main/1.0/TilesetWithDiscreteLOD/tileset.json`,
    queryParameters: '{"demo": "query-de-prueba"}',
  },
  pointcloud: {
    url: `${SAMPLES}/cesium/main/Specs/Data/Cesium3DTiles/PointCloud/PointCloudRGB/tileset.json`,
    style: 'pointcloud',
  },
  fixture: {
    url: new URL('/test/development/CP-0002-layers/fixtures/CP-036-tileset.json', window.location.href).href,
    headers: '{"X-Api-Key": "clave-de-prueba"}',
    queryParameters: '{"key": "secreto-de-prueba"}',
    ticket: 'ticket-de-prueba',
  },
  ion: { ionAssetId: '96188', view: MADRID_VIEW },
  ionMelbourne: { ionAssetId: '69380' },
  custom: {},
};
const ION_TOKEN_KEY = 'idee-test-ion-access-token';
const STYLES = {
  none: () => undefined,
  color: () => new Tiles3DStyle({ color: 'orange' }),
  conditions: () => new Tiles3DStyle({
    color: { conditions: [['${id} === 1', "color('red')"], ['true', "color('cyan', 0.9)"]] },
  }),
  defines: () => new Tiles3DStyle({
    defines: { Tono: "color('teal')" },
    color: '${Tono}',
    meta: { descripcion: "'Estilo con defines y meta'" },
  }),
  pointcloud: () => new Tiles3DStyle({ color: '${COLOR}', pointSize: 4 }),
};

const mapa = createMap({
  container: 'map',
  controls: [],
  center: [-3.7, 40.42],
  zoom: 6,
});
window.mapa = mapa;
const cesium = !!mapa.getMapImpl().scene;
const field = (id) => document.getElementById(id);
const log = (...values) => {
  const line = values.map((value) => (typeof value === 'string' ? value : JSON.stringify(value)))
    .join(' ');
  field('log').textContent = `${new Date().toLocaleTimeString()} ${line}\n${field('log').textContent}`;
};

const applyPreset = () => {
  const preset = PRESETS[field('source').value];
  ['url', 'ionAssetId', 'headers', 'queryParameters', 'ticket'].forEach((id) => {
    field(id).value = preset[id] || '';
  });
  if (preset.style) field('style').value = preset.style;
};
field('source').onchange = applyPreset;
applyPreset();

try {
  field('ionAccessToken').value = window.sessionStorage.getItem(ION_TOKEN_KEY) || '';
} catch (error) {
  field('ionAccessToken').value = '';
}
field('ionAccessToken').onchange = () => {
  try {
    window.sessionStorage.setItem(ION_TOKEN_KEY, field('ionAccessToken').value.trim());
  } catch (error) {
    log('No se puede guardar el token en sessionStorage');
  }
};

const parseJSON = (id) => {
  const text = field(id).value.trim();
  return text ? JSON.parse(text) : undefined;
};
const optional = (id) => field(id).value.trim() || undefined;

let currentView;
const zoomTo = () => {
  if (currentView) {
    mapa.getImpl().flyTo(currentView.extent, currentView.options);
    return;
  }
  const tileset = window.capa?.getImpl().getLayer();
  if (tileset) mapa.getMapImpl().flyTo(tileset, { duration: 0.5 });
};

const buildLayer = () => {
  IDEE.config('TICKET', optional('ticket'));
  const userParameters = field('source').value.startsWith('ion')
    ? { ionAssetId: Number(field('ionAssetId').value) }
    : { url: optional('url') };
  const options = {
    headers: parseJSON('headers'),
    queryParameters: parseJSON('queryParameters'),
    ionAccessToken: optional('ionAccessToken'),
    ionServer: optional('ionServer'),
    style: STYLES[field('style').value](),
    opacity: Number(field('opacity').value),
  };
  ['minZoom', 'maxZoom'].forEach((key) => {
    if (optional(key) !== undefined) options[key] = Number(field(key).value);
  });
  const layer = new Tiles3D({ ...userParameters, name: 'cp036', legend: 'CP-036 Tiles3D' }, options);
  layer.on(EventType.ADDED_TO_MAP, () => {
    log('ADDED_TO_MAP: tileset raíz cargado');
    if (layer === window.capa) zoomTo();
  });
  layer.on(EventType.LOAD_ERROR, (error) => log('LOAD_ERROR:', error.message));
  layer.on(EventType.REMOVED_FROM_MAP, () => log('REMOVED_FROM_MAP'));
  return layer;
};

const removeLayer = () => {
  if (window.capa) mapa.removeLayers(window.capa);
  window.capa = undefined;
};

const run = (fn) => () => {
  try {
    fn();
  } catch (error) {
    log(`${error.name}:`, error.message);
  }
};

const createLayer = () => {
  removeLayer();
  window.capa = buildLayer();
  const preset = PRESETS[field('source').value];
  currentView = preset.ionAssetId === field('ionAssetId').value ? preset.view : undefined;
  mapa.addLayers(window.capa);
  log('Capa creada:', window.capa.getRestLayer());
};
field('create').onclick = run(createLayer);
field('remove').onclick = run(removeLayer);
field('removeWhileLoading').onclick = run(() => {
  removeLayer();
  const layer = buildLayer();
  mapa.addLayers(layer);
  mapa.removeLayers(layer);
  const tilesets = () => mapa.getMapImpl().scene.primitives.length;
  const before = tilesets();
  setTimeout(() => log('Retirada durante la carga. Primitivas antes/después:', [before, tilesets()]), 5000);
});
field('applyStyle').onclick = run(() => {
  window.capa?.setStyle(STYLES[field('style').value]());
  log('Estilo aplicado. getStyle():', window.capa?.getStyle()?.getOptions?.() ?? null);
});
field('opacity').oninput = run(() => {
  field('opacityValue').value = field('opacity').value;
  window.capa?.setOpacity(Number(field('opacity').value));
});
field('applyZoom').onclick = run(() => {
  const value = (id, fallback) => (optional(id) === undefined ? fallback : Number(field(id).value));
  window.capa?.setMinZoom(value('minZoom', Number.NEGATIVE_INFINITY));
  window.capa?.setMaxZoom(value('maxZoom', Number.POSITIVE_INFINITY));
  const range = [window.capa?.getMinZoom(), window.capa?.getMaxZoom()].map(String);
  log('Zoom actual:', mapa.getZoom(), 'rango:', range, 'dentro:', window.capa?.inRange());
});
field('zoomTo').onclick = run(zoomTo);
field('inspect').onclick = run(() => {
  log('getRestLayer():', window.capa?.getRestLayer() ?? null);
  log('getStyle():', window.capa?.getStyle()?.getOptions?.() ?? window.capa?.getStyle() ?? null);
  log('getOpacity():', window.capa?.getOpacity() ?? null);
});

if (cesium) {
  run(createLayer)();
} else {
  ['create', 'removeWhileLoading'].forEach((id) => { field(id).disabled = true; });
  log('Tiles3D solo está disponible en Cesium: npm run start:cesium -- --name=CP-0002-layers/CP-036');
}
