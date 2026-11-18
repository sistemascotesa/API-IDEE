/* eslint-disable no-console */
/**
 * Utilidades de medida de la comparativa Canvas ⇄ WebGL (CP-0008-webgl/CP-001).
 */
import { unByKey } from 'ol/Observable';

/**
 * Estadísticos de una serie de duraciones.
 * @param {Array<number>} values Duraciones en milisegundos.
 * @returns {Object} n, avg, p95 y max redondeados a dos decimales.
 */
export const stats = (values) => {
  if (values.length === 0) {
    return {
      n: 0, avg: 0, p95: 0, max: 0,
    };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const round = (v) => Math.round(v * 100) / 100;
  return {
    n: values.length,
    avg: round(values.reduce((sum, v) => sum + v, 0) / values.length),
    p95: round(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))]),
    max: round(sorted[sorted.length - 1]),
  };
};

/**
 * Espera a que el mapa termine de cargar y renderizar.
 * Solo acepta un 'rendercomplete' cuando ready() es verdadero y no empieza
 * otra carga ('loadstart') durante el margen de estabilización.
 *
 * @param {IDEE.Map} map Mapa.
 * @param {Object} options Opciones.
 * - ready: Función que indica si las capas esperadas ya están en el mapa.
 * - timeout: Tiempo máximo en milisegundos.
 * - settle: Margen de estabilización en milisegundos.
 * @returns {Promise<Object>} { at: instante del último rendercomplete válido, timedOut }.
 */
export const waitRender = (map, {
  ready = () => true, timeout = 20000, settle = 500,
} = {}) => new Promise((resolve) => {
  const olMap = map.getMapImpl();
  let lastComplete = null;
  let settleTimer;
  let timeoutTimer;
  let keys = [];
  const finish = (timedOut) => {
    clearTimeout(settleTimer);
    clearTimeout(timeoutTimer);
    unByKey(keys);
    keys = [];
    resolve({ at: lastComplete ?? performance.now(), timedOut });
  };
  timeoutTimer = setTimeout(() => finish(true), timeout);
  keys.push(olMap.on('loadstart', () => clearTimeout(settleTimer)));
  keys.push(olMap.on('rendercomplete', () => {
    clearTimeout(settleTimer);
    if (!ready()) {
      return;
    }
    lastComplete = performance.now();
    settleTimer = setTimeout(() => finish(false), settle);
  }));
  olMap.render();
});

/**
 * Medidor de fotogramas del mapa. Mide el tiempo de CPU de cada fotograma
 * (de 'precompose' a 'postcompose') y cuenta los fotogramas por segundo.
 *
 * @param {IDEE.Map} map Mapa.
 * @param {number} size Número de fotogramas recientes que se conservan.
 * @returns {Object} { snapshot(), startRecording(), stopRecording() }.
 */
export const createFrameMeter = (map, size = 120) => {
  const olMap = map.getMapImpl();
  const durations = [];
  const timestamps = [];
  let frameStart = 0;
  let recording = null;
  olMap.on('precompose', () => {
    frameStart = performance.now();
  });
  olMap.on('postcompose', () => {
    const now = performance.now();
    const duration = now - frameStart;
    durations.push(duration);
    if (durations.length > size) {
      durations.shift();
    }
    timestamps.push(now);
    while (timestamps.length > 0 && now - timestamps[0] > 1000) {
      timestamps.shift();
    }
    if (recording) {
      recording.push(duration);
    }
  });
  return {
    snapshot: () => {
      const now = performance.now();
      return { ...stats(durations), fps: timestamps.filter((t) => now - t <= 1000).length };
    },
    startRecording: () => {
      recording = [];
    },
    stopRecording: () => {
      const frames = recording || [];
      recording = null;
      return frames;
    },
  };
};

/**
 * Ejecuta una animación fija (desplazamiento y zoom) y mide los fotogramas.
 * Los desplazamientos se calculan en píxeles para que la prueba sea comparable a cualquier zoom.
 *
 * @param {IDEE.Map} map Mapa.
 * @param {Object} meter Medidor creado con createFrameMeter.
 * @param {number} duration Duración total en milisegundos.
 * @returns {Promise<Object>} fps, n, avg, p95, max, elapsed e interrupted.
 */
export const runBenchmark = (map, meter, duration = 6000) => new Promise((resolve) => {
  const view = map.getMapImpl().getView();
  const center = view.getCenter();
  const zoom = view.getZoom();
  const resolution = view.getResolution();
  const dx = 450 * resolution;
  const dy = 250 * resolution;
  const step = duration / 4;
  meter.startRecording();
  const start = performance.now();
  view.animate(
    { center: [center[0] + dx, center[1] + dy], duration: step },
    { zoom: zoom + 2, duration: step },
    { center: [center[0] - dx / 4, center[1] - dy / 4], duration: step },
    { center, zoom, duration: step },
    (complete) => {
      const elapsed = performance.now() - start;
      const frames = meter.stopRecording();
      resolve({
        ...stats(frames),
        fps: Math.round((frames.length / (elapsed / 1000)) * 10) / 10,
        elapsed: Math.round(elapsed),
        interrupted: !complete,
      });
    },
  );
});

/**
 * Captura console.warn, console.error y los errores no controlados.
 * Los mensajes se siguen mostrando en la consola del navegador.
 *
 * @returns {Object} { entries, mark(), since(mark), onEntry(fn), clear() }.
 */
export const createConsoleCapture = () => {
  const entries = [];
  const listeners = new Set();
  let total = 0;
  const format = (arg) => {
    if (arg instanceof Error) {
      return arg.message;
    }
    if (typeof arg === 'string') {
      return arg;
    }
    try {
      return JSON.stringify(arg);
    } catch (e) {
      return String(arg);
    }
  };
  const push = (type, args) => {
    const entry = {
      seq: total, type, msg: args.map(format).join(' '), time: new Date(),
    };
    total += 1;
    entries.push(entry);
    if (entries.length > 500) {
      entries.shift();
    }
    listeners.forEach((fn) => fn(entry));
  };
  ['warn', 'error'].forEach((type) => {
    const original = console[type];
    console[type] = (...args) => {
      push(type, args);
      original.apply(console, args);
    };
  });
  window.addEventListener('error', (evt) => push('error', [evt.message || 'Error']));
  window.addEventListener('unhandledrejection', (evt) => push('error', [evt.reason?.message || String(evt.reason)]));
  return {
    entries,
    mark: () => total,
    since: (mark) => entries.filter((e) => e.seq >= mark),
    onEntry: (fn) => listeners.add(fn),
    clear: () => {
      entries.length = 0;
    },
  };
};
