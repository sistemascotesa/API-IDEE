/* eslint-disable no-console */
/**
 * CP-0008-webgl/CP-001 · Comparativa en tiempo real Canvas ⇄ WebGL.
 *
 * Arranque: npm start -- --name=CP-0008-webgl/CP-001
 *
 * El renderer de una capa se fija al construirla, así que cambiar de modo
 * consiste en quitar la capa y crearla de nuevo con el otro valor de 'renderer'
 * (o con IDEE.config.WEBGL si se marca esa casilla).
 *
 * En consola: window.mapa y window.webglDemo.
 */
import { map as Mmap } from 'IDEE/api-idee';
import { getValue } from 'IDEE/i18n/language';
import { isWebGLSupported } from 'impl/webgl/WebGLSupport';
import { transformExtent } from 'ol/proj';
import {
  CATALOG, GROUPS, POINT_COUNTS, DEFAULT_ACTIVE, expectedRenderer,
} from './catalog';
import {
  waitRender, createFrameMeter, runBenchmark, createConsoleCapture,
} from './metrics';

const capture = createConsoleCapture();

const HOME = { center: [-443273.1, 4757481.7], zoom: 6 };
const GROUP_Z = {
  raster: 100, webglonly: 150, vectortile: 200, vector: 300, fallback: 400,
};
const WEBGL_KEYS = ['webgl_not_supported', 'webgl_fallback_cors', 'webgl_fallback_style', 'webgl_fallback_feature_style'];
const CHECK_MAX_POINTS = 10000;
const MODE_LABEL = { canvas: 'Canvas', webgl: 'WebGL' };

const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
  center: HOME.center,
  zoom: HOME.zoom,
  layers: [],
  controls: ['scaleline', 'panzoombar'],
});
const olMap = mapa.getMapImpl();
const meter = createFrameMeter(mapa);
let contextLost = 0;
olMap.getViewport().addEventListener('webglcontextlost', () => {
  contextLost += 1;
}, true);

const state = {
  mode: 'canvas',
  useConfig: false,
  points: 10000,
  busy: '',
  lastReload: null,
  bench: [],
  checks: [],
  layers: new Map(CATALOG.map((entry) => [entry.id, {
    active: DEFAULT_ACTIVE.includes(entry.id),
    override: null,
    layer: null,
    requested: null,
    ms: null,
    timedOut: false,
    loadErrors: 0,
    features: null,
    notes: [],
    error: null,
  }])),
};

const ui = {};

const $ = (id) => document.getElementById(id);
const entryOf = (id) => CATALOG.find((entry) => entry.id === id);
const stateOf = (id) => state.layers.get(id);
const activeIds = () => CATALOG
  .filter((entry) => stateOf(entry.id).active)
  .map((entry) => entry.id);
const exceptionText = (key) => getValue('exception')[key];
const requestedOf = (id) => entryOf(id).fixed || stateOf(id).override || state.mode;
const zIndexOf = (entry) => GROUP_Z[entry.group] + CATALOG.indexOf(entry);

/**
 * Capa sobre la que se consulta el renderer (la tabla hija en un GeoPackage).
 * @param {Object} entry Entrada del catálogo.
 * @param {Object} layer Capa o GeoPackage.
 * @returns {IDEE.layer.Layer|undefined} Capa.
 */
const targetOf = (entry, layer) => (entry.kind === 'geopackage' ? layer?.getLayers?.()[0] : layer);
const olLayerOf = (entry, layer) => targetOf(entry, layer)?.getImpl?.().getLayer?.();
const rendererOf = (entry, layer) => targetOf(entry, layer)?.getRenderer?.();

/**
 * Número de objetos geográficos cargados en las entradas vectoriales.
 * Sirve para detectar servicios que responden sin datos (por ejemplo, un 404).
 * @param {Object} entry Entrada del catálogo.
 * @param {Object} layer Capa.
 * @returns {number|null} Número de objetos, o nulo si la entrada no se comprueba.
 */
const featureCountOf = (entry, layer) => {
  if (entry.group !== 'vector' && !entry.countsFeatures) {
    return null;
  }
  const features = targetOf(entry, layer)?.getFeatures?.();
  return Array.isArray(features) ? features.length : null;
};

/**
 * Indica si la capa de OpenLayers de la entrada ya está en el mapa.
 * @param {Object} entry Entrada del catálogo.
 * @param {Object} layer Capa o GeoPackage.
 * @returns {Boolean} Verdadero si está en el mapa.
 */
const isAttached = (entry, layer) => {
  const olLayer = olLayerOf(entry, layer);
  return !!olLayer && olMap.getAllLayers().includes(olLayer);
};

/**
 * Avisos WebGL de la API (claves webgl_*) presentes en un tramo del registro.
 * @param {Array<Object>} logs Entradas del registro.
 * @returns {Array<string>} Mensajes sin repetir.
 */
const webglNotes = (logs) => {
  const texts = WEBGL_KEYS.map(exceptionText);
  return [...new Set(logs.filter((log) => texts.includes(log.msg)).map((log) => log.msg))];
};

const watchedSources = new WeakSet();

/**
 * Cuenta los errores de carga de teselas, imágenes u objetos geográficos de la fuente de la capa.
 * @param {Object} entry Entrada del catálogo.
 * @param {Object} layer Capa o GeoPackage.
 * @param {Function} onError Función llamada en cada error.
 */
const watchLoadErrors = (entry, layer, onError) => {
  const source = olLayerOf(entry, layer)?.getSource?.();
  if (!source || watchedSources.has(source)) {
    return;
  }
  watchedSources.add(source);
  ['tileloaderror', 'imageloaderror', 'featuresloaderror'].forEach((type) => source.on(type, onError));
};

/**
 * Crea la capa de una entrada con el renderer pedido.
 * Con la casilla de configuración activa, el renderer se aplica mediante IDEE.config.WEBGL.
 * @param {Object} entry Entrada del catálogo.
 * @param {string} requested Renderer pedido.
 * @param {number} points Número de puntos sintéticos.
 * @returns {Object} Capa o GeoPackage.
 */
const createLayer = (entry, requested, points = state.points) => {
  if (state.useConfig) {
    IDEE.config('WEBGL', requested === 'webgl');
  }
  return entry.create(state.useConfig ? undefined : requested, { points });
};

const addToMap = async (entry, layer) => {
  if (entry.kind === 'geopackage') {
    await layer.whenReady();
    mapa.addGeoPackage(layer);
  } else {
    mapa.addLayers(layer);
    layer.setZIndex(zIndexOf(entry));
  }
  if (entry.afterAdd) {
    entry.afterAdd(layer);
  }
};

const removeFromMap = (entry, layer) => {
  try {
    if (entry.kind === 'geopackage') {
      mapa.removeGeoPackage(layer);
    } else {
      mapa.removeLayers(layer);
    }
  } catch (err) {
    console.error(err);
  }
};

const syncConfig = () => {
  IDEE.config('WEBGL', state.useConfig && state.mode === 'webgl');
};

const modeLabel = () => {
  const overrides = activeIds().some((id) => stateOf(id).override && !entryOf(id).fixed);
  return [
    MODE_LABEL[state.mode],
    state.useConfig ? 'config' : '',
    overrides ? 'mixto' : '',
  ].filter(Boolean).join(' · ');
};

const unmount = (id) => {
  const st = stateOf(id);
  if (st.layer) {
    removeFromMap(entryOf(id), st.layer);
  }
  st.layer = null;
  st.requested = null;
  st.ms = null;
};

/**
 * Crea y añade a la vez las capas indicadas y espera a que el mapa termine de renderizar.
 * @param {Array<string>} ids Identificadores de las entradas.
 */
const mountBatch = async (ids) => {
  if (ids.length === 0) {
    return;
  }
  const mark = capture.mark();
  const t0 = performance.now();
  await Promise.all(ids.map(async (id) => {
    const entry = entryOf(id);
    const st = stateOf(id);
    st.requested = requestedOf(id);
    st.ms = null;
    st.timedOut = false;
    st.loadErrors = 0;
    st.notes = [];
    st.error = null;
    try {
      const layer = createLayer(entry, st.requested);
      st.layer = layer;
      await addToMap(entry, layer);
      watchLoadErrors(entry, layer, () => {
        if (st.layer === layer) st.loadErrors += 1;
      });
    } catch (err) {
      st.error = err.message || String(err);
      console.error(err);
    }
  }));
  ui.renderLayers();
  const result = await waitRender(mapa, {
    timeout: 30000,
    ready: () => ids.every((id) => {
      const st = stateOf(id);
      return st.error || !st.layer || isAttached(entryOf(id), st.layer);
    }),
  });
  const ms = Math.round(result.at - t0);
  const notes = webglNotes(capture.since(mark));
  ids.forEach((id) => {
    const entry = entryOf(id);
    const st = stateOf(id);
    if (!st.layer) {
      return;
    }
    const { layer } = st;
    watchLoadErrors(entry, layer, () => {
      if (st.layer === layer) st.loadErrors += 1;
    });
    st.ms = ms;
    st.timedOut = result.timedOut;
    st.features = featureCountOf(entry, layer);
    st.notes = rendererOf(entry, layer) !== st.requested ? notes : [];
  });
  syncConfig();
  state.lastReload = {
    ms, layers: ids.length, timedOut: result.timedOut, label: modeLabel(),
  };
};

const remount = (ids) => {
  ids.forEach(unmount);
  return mountBatch(ids);
};

let queue = Promise.resolve();

/**
 * Encola una operación sobre el mapa para que no se solapen.
 * @param {string} label Texto de estado mientras se ejecuta.
 * @param {Function} task Operación asíncrona.
 * @returns {Promise} Promesa de la cola.
 */
const enqueue = (label, task) => {
  queue = queue.then(async () => {
    state.busy = label;
    ui.renderAll();
    try {
      await task();
    } catch (err) {
      console.error(err);
    } finally {
      state.busy = '';
      ui.renderAll();
    }
  });
  return queue;
};

const setMode = (mode) => {
  if (mode === state.mode) {
    return queue;
  }
  state.mode = mode;
  const ids = activeIds().filter((id) => !entryOf(id).fixed && !stateOf(id).override);
  return enqueue(`Recreando ${ids.length} capas en ${MODE_LABEL[mode]}…`, () => remount(ids));
};

const setUseConfig = (value) => {
  state.useConfig = value;
  syncConfig();
  const ids = activeIds().filter((id) => !entryOf(id).fixed);
  const via = value ? 'IDEE.config.WEBGL' : 'la opción renderer';
  return enqueue(`Recreando ${ids.length} capas mediante ${via}…`, () => remount(ids));
};

const setActive = (id, active) => {
  stateOf(id).active = active;
  if (!active) {
    return enqueue(`Quitando ${entryOf(id).label}…`, async () => unmount(id));
  }
  return enqueue(`Cargando ${entryOf(id).label}…`, () => mountBatch([id]));
};

const setOverride = (id, override) => {
  stateOf(id).override = override;
  if (!stateOf(id).active) {
    ui.renderLayers();
    return queue;
  }
  return enqueue(`Recreando ${entryOf(id).label}…`, () => remount([id]));
};

const setPoints = (points) => {
  state.points = points;
  const ids = activeIds().filter((id) => entryOf(id).usesPoints);
  return enqueue(`Generando ${points} puntos…`, () => remount(ids));
};

const rebuild = (ids = activeIds()) => enqueue(`Recreando ${ids.length} capas…`, () => remount(ids));

const fitTo = async (id) => {
  const entry = entryOf(id);
  const st = stateOf(id);
  if (!st.layer) {
    return;
  }
  let extent;
  if (Array.isArray(entry.fit)) {
    extent = transformExtent(entry.fit, 'EPSG:4326', 'EPSG:3857');
  } else {
    const target = targetOf(entry, st.layer);
    extent = await Promise.resolve(target?.calculateMaxExtent
      ? target.calculateMaxExtent() : target?.getMaxExtent?.());
  }
  const valid = Array.isArray(extent) && extent.length === 4
    && extent.every(Number.isFinite) && extent[2] > extent[0];
  if (valid) {
    olMap.getView().fit(extent, { padding: [40, 40, 40, 40], maxZoom: 15, duration: 400 });
  } else {
    console.warn(`No se ha podido calcular la extensión de ${entry.label}.`);
  }
};

const goHome = () => {
  olMap.getView().animate({ center: HOME.center, zoom: HOME.zoom, duration: 400 });
};

const webglActiveCount = () => activeIds()
  .filter((id) => stateOf(id).layer && rendererOf(entryOf(id), stateOf(id).layer) === 'webgl')
  .length;

const benchmark = () => enqueue('Midiendo la animación de prueba…', async () => {
  const result = await runBenchmark(mapa, meter);
  const ids = activeIds();
  state.bench.push({
    ...result,
    label: modeLabel(),
    layers: ids.length,
    webgl: webglActiveCount(),
    points: ids.some((id) => entryOf(id).usesPoints) ? state.points : null,
    reload: state.lastReload ? state.lastReload.ms : null,
  });
});

/**
 * Comprueba una entrada en un modo: crea la capa sola, espera al render y
 * compara el renderer efectivo con el esperado.
 * @param {Object} entry Entrada del catálogo.
 * @param {string} mode Renderer pedido.
 * @returns {Promise<Object>} Resultado de la comprobación.
 */
const checkOne = async (entry, mode) => {
  const mark = capture.mark();
  const t0 = performance.now();
  let layer = null;
  let loadErrors = 0;
  let error = null;
  let result = { at: performance.now(), timedOut: false };
  const countError = () => {
    loadErrors += 1;
  };
  try {
    layer = createLayer(entry, mode, Math.min(state.points, CHECK_MAX_POINTS));
    await addToMap(entry, layer);
    watchLoadErrors(entry, layer, countError);
    result = await waitRender(mapa, { ready: () => isAttached(entry, layer), timeout: 15000 });
    watchLoadErrors(entry, layer, countError);
  } catch (err) {
    error = err.message || String(err);
  }
  const effective = layer ? rendererOf(entry, layer) : undefined;
  const attached = layer ? isAttached(entry, layer) : false;
  const features = layer ? featureCountOf(entry, layer) : null;
  if (layer) {
    removeFromMap(entry, layer);
  }
  const logs = capture.since(mark);
  const expected = expectedRenderer(entry, mode);
  const reasonText = entry.reason && mode === 'webgl' ? exceptionText(entry.reason) : null;
  const reasonOk = !reasonText || logs.some((log) => log.msg === reasonText);
  const exceptions = logs.filter((log) => log.type === 'error');
  const empty = features === 0;
  const mismatch = effective !== expected || !reasonOk;
  let status = 'pass';
  if (error) {
    status = 'error';
  } else if (exceptions.length > 0 || (mismatch && !(empty && entry.reason))) {
    status = 'fail';
  } else if (mismatch || empty || result.timedOut || !attached || loadErrors > 0) {
    status = 'warn';
  }
  const details = [];
  if (error) details.push(error);
  if (empty) details.push('0 objetos geográficos: servicio sin datos o fuera de la vista');
  if (empty && entry.reason) details.push('sin datos no se puede comprobar la caída a Canvas');
  if (reasonText && !empty) details.push(reasonOk ? 'aviso esperado presente' : `falta el aviso: ${reasonText}`);
  if (!attached && !error) details.push('la capa OL no llegó al mapa');
  if (result.timedOut) details.push('sin rendercomplete');
  if (loadErrors > 0) details.push(`${loadErrors} errores de carga`);
  exceptions.slice(0, 2).forEach((log) => details.push(`excepción: ${log.msg}`));
  return {
    id: entry.id,
    label: entry.label,
    mode,
    expected,
    effective,
    ms: Math.round(result.at - t0),
    status,
    details,
  };
};

const checkAll = () => enqueue('Comprobando todas las capas…', async () => {
  const previous = activeIds();
  previous.forEach(unmount);
  state.checks = [];
  ui.renderLayers();
  ui.renderChecks();
  const runs = CATALOG.flatMap((entry) => ['canvas', 'webgl'].map((mode) => ({ entry, mode })));
  await runs.reduce((prev, { entry, mode }, i) => prev.then(async () => {
    state.busy = `Comprobando ${i + 1}/${runs.length}: ${entry.label} (${MODE_LABEL[mode]})`;
    ui.renderStatus();
    state.checks.push(await checkOne(entry, mode));
    ui.renderChecks();
  }), Promise.resolve());
  syncConfig();
  await mountBatch(previous);
});

/**
 * Crea un elemento del DOM.
 * @param {string} tag Etiqueta.
 * @param {Object} props Propiedades: className, text, on* (eventos) y atributos.
 * @param {Array|Node|string} children Hijos.
 * @returns {HTMLElement} Elemento.
 */
const h = (tag, props = {}, children = []) => {
  const el = document.createElement(tag);
  Object.entries(props).forEach(([key, value]) => {
    if (value === undefined || value === null || value === false) {
      return;
    }
    if (key === 'className') {
      el.className = value;
    } else if (key === 'text') {
      el.textContent = value;
    } else if (key.startsWith('on')) {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else {
      el.setAttribute(key, value === true ? '' : value);
    }
  });
  [].concat(children)
    .filter((child) => child !== null && child !== undefined && child !== false)
    .forEach((child) => el.append(child));
  return el;
};

const badges = new Map();

ui.updateBadge = (id) => {
  const badge = badges.get(id);
  if (!badge) {
    return;
  }
  const entry = entryOf(id);
  const st = stateOf(id);
  if (!st.layer) {
    badge.className = 'badge off';
    badge.textContent = st.error ? `error: ${st.error}` : 'sin cargar';
    badge.title = '';
    return;
  }
  const effective = rendererOf(entry, st.layer);
  const expected = expectedRenderer(entry, st.requested);
  const parts = [`${st.requested} → ${effective}`];
  if (effective !== st.requested) parts[0] += ' ⚠';
  parts.push(st.ms === null ? 'cargando…' : `${st.ms} ms`);
  if (st.ms !== null && st.features === 0) parts.push('0 objetos');
  if (st.timedOut) parts.push('sin rendercomplete');
  if (st.loadErrors > 0) parts.push(`${st.loadErrors} err. de carga`);
  const classes = ['badge', effective];
  if (effective !== expected) classes.push('bad');
  if (st.ms === null) classes.push('loading');
  badge.className = classes.join(' ');
  badge.textContent = parts.join(' · ');
  badge.title = [
    effective !== st.requested ? `Se pidió ${st.requested} y la capa usa ${effective}.` : '',
    effective !== expected ? `Se esperaba ${expected}.` : '',
    entry.reason ? `Aviso esperado: ${exceptionText(entry.reason)}` : '',
    ...st.notes,
  ].filter(Boolean).join('\n');
};

ui.renderRow = (entry) => {
  const st = stateOf(entry.id);
  const disabled = !!state.busy;
  const selector = entry.fixed
    ? h('span', { className: 'fixed', text: 'solo WebGL' })
    : h('select', {
      title: 'Renderer de esta capa',
      disabled,
      onchange: (evt) => setOverride(entry.id, evt.target.value || null),
    }, [['', 'Global'], ['canvas', 'Canvas'], ['webgl', 'WebGL']].map(([value, text]) => h('option', {
      value, text, selected: (st.override || '') === value,
    })));
  const badge = h('span', { className: 'badge' });
  badges.set(entry.id, badge);
  ui.updateBadge(entry.id);
  return h('div', { className: st.active ? 'row active' : 'row' }, [
    h('label', { className: 'name' }, [
      h('input', {
        type: 'checkbox',
        checked: st.active,
        disabled,
        onchange: (evt) => setActive(entry.id, evt.target.checked),
      }),
      h('span', { text: entry.label }),
    ]),
    selector,
    entry.fit ? h('button', {
      className: 'icon',
      title: 'Encuadrar la capa',
      disabled: !st.layer,
      onclick: () => fitTo(entry.id),
      text: '⌖',
    }) : h('span'),
    h('div', { className: 'meta' }, [h('span', { className: 'source', text: entry.source }), badge]),
  ]);
};

ui.renderLayers = () => {
  badges.clear();
  $('layers').replaceChildren(...GROUPS.flatMap((group) => [
    h('h3', { className: 'group', title: group.hint }, [group.title, h('small', { text: group.hint })]),
    ...CATALOG.filter((entry) => entry.group === group.id).map(ui.renderRow),
  ]));
};

ui.renderStatus = () => {
  const status = $('status');
  status.className = state.busy ? 'status busy' : 'status';
  status.textContent = state.busy || 'Listo';
  document.querySelectorAll('[data-mode]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.mode === state.mode));
    button.toggleAttribute('disabled', !!state.busy);
  });
  ['use-config', 'points', 'bench', 'check'].forEach((id) => {
    $(id).disabled = !!state.busy;
  });
  $('use-config').checked = state.useConfig;
};

ui.renderMetrics = () => {
  const snap = meter.snapshot();
  const ids = activeIds().filter((id) => stateOf(id).layer);
  const webgl = webglActiveCount();
  const reload = state.lastReload;
  const heap = performance.memory
    ? `${Math.round(performance.memory.usedJSHeapSize / 1048576)} MB` : 'no disponible';
  const rows = [
    ['Fotogramas/s', snap.fps === 0 ? '0 (el mapa no está renderizando)' : String(snap.fps)],
    ['ms por fotograma (CPU)', `media ${snap.avg} · p95 ${snap.p95} · máx ${snap.max}`],
    ['Capas en el mapa', `${ids.length} (${webgl} WebGL · ${ids.length - webgl} Canvas)`],
    ['<canvas> en el mapa', String(olMap.getViewport().querySelectorAll('canvas').length)],
    ['Contextos WebGL perdidos', String(contextLost)],
    ['Última recarga', reload
      ? `${reload.ms} ms · ${reload.layers} capas · ${reload.label}${reload.timedOut ? ' (sin rendercomplete)' : ''}`
      : '—'],
    ['Memoria JS', heap],
  ];
  $('metrics').replaceChildren(...rows.flatMap(([term, value]) => [h('dt', { text: term }), h('dd', { text: value })]));
  $('metrics-warning').hidden = webgl < 16;
  activeIds().forEach(ui.updateBadge);
};

/**
 * Compara la última medida WebGL con la última Canvas.
 * @returns {string} Resumen o cadena vacía.
 */
const benchSummary = () => {
  const last = (prefix) => [...state.bench].reverse().find((row) => row.label.startsWith(prefix));
  const canvas = last('Canvas');
  const webgl = last('WebGL');
  if (!canvas || !webgl || canvas.fps === 0 || canvas.avg === 0) {
    return '';
  }
  const fps = (webgl.fps / canvas.fps).toFixed(2);
  const ms = Math.round(((webgl.avg - canvas.avg) / canvas.avg) * 100);
  return `Última WebGL frente a última Canvas: FPS ×${fps} · ms por fotograma ${ms > 0 ? '+' : ''}${ms} %`;
};

ui.renderBench = () => {
  const head = ['Modo', 'Capas (WebGL)', 'Puntos', 'FPS', 'ms/fot. media', 'p95', 'máx', 'Recarga ms'];
  $('bench-table').replaceChildren(
    h('thead', {}, h('tr', {}, head.map((text) => h('th', { text })))),
    h('tbody', {}, state.bench.map((row) => h('tr', { title: row.interrupted ? 'Animación interrumpida' : null }, [
      `${row.label}${row.interrupted ? ' *' : ''}`,
      `${row.layers} (${row.webgl})`,
      row.points ?? '—',
      row.fps,
      row.avg,
      row.p95,
      row.max,
      row.reload ?? '—',
    ].map((value) => h('td', { text: String(value) }))))),
  );
  $('bench-summary').textContent = benchSummary();
};

const STATUS_ICON = {
  pass: '✔', warn: '⚠', fail: '✘', error: '✘',
};

ui.renderChecks = () => {
  const counts = state.checks.reduce((acc, row) => ({
    ...acc, [row.status]: (acc[row.status] || 0) + 1,
  }), {});
  $('check-summary').textContent = state.checks.length === 0 ? 'Sin ejecutar.' : [
    `${state.checks.length} pruebas`,
    `✔ ${counts.pass || 0}`,
    `⚠ ${counts.warn || 0} (carga incompleta)`,
    `✘ ${(counts.fail || 0) + (counts.error || 0)}`,
  ].join(' · ');
  const head = ['', 'Capa', 'Pedido', 'Esperado', 'Efectivo', 'ms', 'Detalle'];
  $('check-table').replaceChildren(
    h('thead', {}, h('tr', {}, head.map((text) => h('th', { text })))),
    h('tbody', {}, state.checks.map((row) => h('tr', { className: row.status }, [
      STATUS_ICON[row.status], row.label, row.mode, row.expected, row.effective ?? '—', row.ms,
      row.details.join(' · '),
    ].map((value) => h('td', { text: String(value) }))))),
  );
};

ui.appendLog = (entry) => {
  const list = $('log');
  list.prepend(h('li', { className: entry.type }, [
    h('time', { text: entry.time.toLocaleTimeString() }),
    h('span', { text: entry.msg }),
  ]));
  while (list.children.length > 150) {
    list.lastElementChild.remove();
  }
};

ui.renderAll = () => {
  ui.renderStatus();
  ui.renderLayers();
  ui.renderMetrics();
  ui.renderBench();
  ui.renderChecks();
};

const supported = isWebGLSupported();
$('support').textContent = supported
  ? 'WebGL disponible en este navegador.'
  : 'WebGL no disponible: todas las capas se renderizarán con Canvas.';
$('support').className = supported ? 'support ok' : 'support ko';
document.querySelectorAll('[data-mode]').forEach((button) => {
  button.addEventListener('click', () => setMode(button.dataset.mode));
});
$('use-config').addEventListener('change', (evt) => setUseConfig(evt.target.checked));
$('points').replaceChildren(...POINT_COUNTS.map((n) => h('option', {
  value: n, text: n.toLocaleString('es-ES'), selected: n === state.points,
})));
$('points').addEventListener('change', (evt) => setPoints(Number(evt.target.value)));
$('home').addEventListener('click', goHome);
$('bench').addEventListener('click', benchmark);
$('check').addEventListener('click', checkAll);
$('bench-clear').addEventListener('click', () => {
  state.bench = [];
  ui.renderBench();
});
$('log-clear').addEventListener('click', () => {
  capture.clear();
  $('log').replaceChildren();
});
capture.entries.forEach(ui.appendLog);
capture.onEntry(ui.appendLog);
window.setInterval(ui.renderMetrics, 500);

ui.renderAll();
enqueue('Cargando las capas iniciales…', () => mountBatch(activeIds()));

window.mapa = mapa;
window.webglDemo = {
  state,
  catalog: CATALOG,
  setMode,
  setUseConfig,
  setActive,
  setOverride,
  setPoints,
  rebuild,
  benchmark,
  checkAll,
  active: () => activeIds().filter((id) => stateOf(id).layer).map((id) => ({
    id,
    layer: stateOf(id).layer,
    requested: stateOf(id).requested,
    effective: rendererOf(entryOf(id), stateOf(id).layer),
  })),
};
