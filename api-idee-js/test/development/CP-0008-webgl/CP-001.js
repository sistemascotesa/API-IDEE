/**
 * Revisión manual WebGL (GUION_REVISION_WEBGL.md).
 *
 * Arranque: npm start -- --name=CP-0008-webgl/CP-001
 * Requiere compilados el núcleo (npm run build:core) y los plugins (npm run build:plugins).
 *
 * Parámetros de la URL:
 * - s: sección del guion (selector del panel).
 * - webgl: 1 (por defecto) activa IDEE.config('WEBGL', true); 0 es el modo de control Canvas.
 * - nowebgl: 1 simula un navegador sin WebGL.
 */
import {
  MODE, sectionParam, loadScript, loadCss, captureConsole, createContext, renderPanel, renderError,
} from './harness';
import sections from './sections/index';

const DIST = '/dist';
const pluginDist = (name) => `/src/plugins/${name}/dist/${name}.ol.min`;

const simulateNoWebGL = () => {
  const { getContext } = window.HTMLCanvasElement.prototype;
  window.HTMLCanvasElement.prototype.getContext = function noWebGL(type, ...args) {
    return /webgl/i.test(type) ? null : getContext.call(this, type, ...args);
  };
};

const start = async () => {
  captureConsole();
  if (new URLSearchParams(window.location.search).get('nowebgl') === '1') simulateNoWebGL();

  const section = sections.find((s) => s.id === sectionParam()) || sections[0];
  const impl = section.impl || 'ol';
  loadCss(`${DIST}/assets/css/apiidee.${impl}.min.css`);
  await loadScript(`${DIST}/js/apiidee.${impl}.min.js`);
  await loadScript('/test/configuration_filtered.js');
  window.IDEE.config('WEBGL', MODE === 'webgl');
  // Algunos plugins (p. ej. Magnify) se registran en window.M.plugin.
  window.M = window.M || window.IDEE;

  await (section.plugins || []).reduce((prev, plugin) => prev.then(() => {
    loadCss(`${pluginDist(plugin)}.css`);
    return loadScript(`${pluginDist(plugin)}.js`);
  }), Promise.resolve());

  const map = window.IDEE.map({ container: 'map', ...section.map });
  window.map = map;
  const ctx = createContext(map);
  window.ctx = ctx;
  if (section.setup) await section.setup(ctx);
  if (section.afterSetup) await section.afterSetup(ctx);
  renderPanel(sections, section, ctx);
};

start().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  renderError(`Error al preparar la sección: ${e.message}. ¿Están compilados dist y los plugins?`);
});
