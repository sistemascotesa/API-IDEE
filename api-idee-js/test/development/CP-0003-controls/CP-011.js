/* eslint-disable camelcase */
import { map as Mmap } from 'IDEE/api-idee';
import ImplementationSwitcher from 'IDEE/control/ImplementationSwitcher';

// IDEE.config('PROXY_URL', 'https://mapea4-sigc.juntadeandalucia.es/mapea/api/proxy');

const map = Mmap({
  container: 'map',
  projection: 'EPSG:4326',
  controls: ['location'],
  zoom: 8,
  center: [
    -7.68,
    43.084999999999994,
  ],
});

IDEE.map = map;

const selectPosition = document.getElementById('selectPosicion');
const inputTooltip = document.getElementById('inputTooltip');
const inputOrder = document.getElementById('inputOrder');
const selectCollapsible = document.getElementById('selectCollapsible');
const selectCollapsed = document.getElementById('selectCollapsed');

const create = (options) => {
  if (!map.hasControl(ImplementationSwitcher.NAME)) {
    map.addControls(new ImplementationSwitcher(options));
  }
};

const remove = () => {
  const ctrls = map.getControls(ImplementationSwitcher.NAME);
  if (ctrls.length === 1) map.removeControls(ctrls[0]);
};

const recreate = () => {
  remove();

  const options = {};
  options.position = selectPosition.options[selectPosition.selectedIndex].value;

  if (inputOrder.value !== undefined) options.order = Number(inputOrder.value);

  if (inputTooltip.value !== '') options.tooltip = inputTooltip.value;

  options.collapsible = (selectCollapsible.options[selectCollapsible.selectedIndex].value === 'true');
  options.collapsed = (selectCollapsed.options[selectCollapsed.selectedIndex].value === 'true');

  create(options);
};

[
  selectPosition,
  inputTooltip,
  inputOrder,
  selectCollapsible,
  selectCollapsed,
].forEach((ctrl) => {
  ctrl.addEventListener('change', recreate);
});

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => {
  remove();
});

recreate();

// ── Test: getNativeProjection ─────────────────────────────────────────────────
const nativeProj = map.getNativeProjection();
console.log('[getNativeProjection] tipo:', nativeProj?.constructor?.name);
console.log('[getNativeProjection] valor:', nativeProj);

// ── Test: addInteraction ──────────────────────────────────────────────────────
const mockInteraction = {
  name: 'test-interaction',
  activate(mapImpl) {
    console.log('[mockInteraction.activate] llamado con impl:', mapImpl);
  },
  deactivate() {
    console.log('[mockInteraction.deactivate] llamado');
  },
};

const returnAdd = map.addInteraction(mockInteraction);
console.log('[addInteraction] retorna el propio mapa (===map):', returnAdd === map);
console.log('[addInteraction] interactions_ tras añadir:', map.getImpl().interactions_.map((i) => i.name));

// Añadir la misma interacción dos veces: no debe duplicarse
map.addInteraction(mockInteraction);
console.log('[addInteraction] interactions_ tras 2º add (sin duplicados):', map.getImpl().interactions_.map((i) => i.name));

// ── Test: removeInteraction ───────────────────────────────────────────────────
const returnRemove = map.removeInteraction(mockInteraction);
console.log('[removeInteraction] retorna el propio mapa (===map):', returnRemove === map);
console.log('[removeInteraction] interactions_ tras eliminar:', map.getImpl().interactions_.map((i) => i.name));

// Eliminar una interacción inexistente: no debe lanzar error
try {
  map.removeInteraction(mockInteraction);
  console.log('[removeInteraction] eliminar inexistente: OK (sin error)');
} catch (e) {
  console.error('[removeInteraction] eliminar inexistente ERROR:', e.message);
}
