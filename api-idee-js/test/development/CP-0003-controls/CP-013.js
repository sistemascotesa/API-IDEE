import { map as Mmap } from 'IDEE/api-idee';
import Control from 'IDEE/control/Control';
import Plugin from 'IDEE/Plugin';
import Rotate from 'IDEE/control/Rotate';
import Scale from 'IDEE/control/Scale';
import ScaleLine from 'IDEE/control/ScaleLine';
import Panzoom from 'IDEE/control/Panzoom';
import * as Position from 'IDEE/ui/position';
import MeasureBar from 'IDEE/control/MeasureBar';

/**
 * Este test debería contener todos los controles para comprobar la funcionalidad de
 * order entre otras
 */

const map = Mmap({
  container: 'map',
  // controls: ['attributions*title=postada;position=down;collapsed=false'],
});

window.mapa = map;

const measurebar = new MeasureBar({
  order: 5,
  position: Position.CBR,
  collapsed: false,
});

const panzoom = new Panzoom({
  order: 1,
});

const rotate = new Rotate({
  order: 1,
});

const scale = new Scale({
  order: 2,
});

const scaleLine = new ScaleLine({
  order: 3,
  // bar: true,
  // steps: 4,
});

const controlsDown = [
  rotate,
  scale,
  scaleLine,
  panzoom,
  measurebar,
];

const githubPlugin = new Plugin('github-1', {
  tooltip: 'Githuh 1',
  position: Position.LEFT,
  svgPath: 'https://componentes.idee.es/estaticos/imagenes/logos/logo-github.svg',
  order: 2,
  collapsed: false,
});

const githubPlugin2 = new Plugin('github-2', {
  tooltip: 'Github 2',
  position: Position.RIGHT,
  svgPath: 'https://componentes.idee.es/estaticos/imagenes/logos/logo-github.svg',
  order: 3,
});

const githubPlugin3 = new Plugin('github-3', {
  tooltip: 'Github 3',
  position: Position.RIGHT,
  svgPath: 'https://componentes.idee.es/estaticos/imagenes/logos/logo-github.svg',
  order: 4,
  collapsed: false,
});

const tools = [
  ...controlsDown,
  githubPlugin,
  githubPlugin2,
  githubPlugin3,
];

const log = tools.reduce((acc, ctrl) => {
  acc[ctrl.position] = {
    [ctrl.name]: {
      order: ctrl.order,
    },
    ...(acc[ctrl.position] ?? {}),
  };
  return acc;
}, {});

// eslint-disable-next-line no-console
console.info(JSON.parse(JSON.stringify(log)));

tools.forEach((tool) => {
  if (tool instanceof Control) map.addControls(tool);
  else if (tool instanceof Plugin) map.addPlugins(tool);
});

map.removePlugin(githubPlugin2);
// map.closeSidePanels(githubPlugin2.position);
map.addPlugin(githubPlugin2);
