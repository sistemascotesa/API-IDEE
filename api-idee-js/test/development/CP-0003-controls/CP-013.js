import { map as Mmap } from 'IDEE/api-idee';
import Control from 'IDEE/control/Control';
import Plugin from 'IDEE/Plugin';
import Rotate from 'IDEE/control/Rotate';
import Scale from 'IDEE/control/Scale';
import ScaleLine from 'IDEE/control/ScaleLine';
import Panzoom from 'IDEE/control/Panzoom';
import * as Position from 'IDEE/ui/position';

/**
 * Este test debería contener todos los controles para comprobar la funcionalidad de
 * order entre otras
 */

const map = Mmap({
  container: 'map',
});

window.mapa = map;

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
];

const githubPLugin = new Plugin('github-left', {
  tooltip: 'Githuh Left',
  position: Position.LEFT,
  svgPath: 'https://componentes.idee.es/estaticos/imagenes/logos/logo-github.svg',
  order: 2,
});

const githubPLugin2 = new Plugin('github-right', {
  tooltip: 'Github Right',
  position: Position.RIGHT,
  svgPath: 'https://componentes.idee.es/estaticos/imagenes/logos/logo-github.svg',
  order: 3,
});

const tools = [
  ...controlsDown,
  githubPLugin,
  githubPLugin2,
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
