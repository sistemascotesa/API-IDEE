import { map as Mmap } from 'IDEE/api-idee';
import Rotate from 'IDEE/control/Rotate';
import Scale from 'IDEE/control/Scale';
import ScaleLine from 'IDEE/control/ScaleLine';
import * as Position from 'IDEE/ui/position';

/**
 * Este test debería contener todos los controles para comprobar la funcionalidad de
 * order entre otras
 */

const map = Mmap({
  container: 'map',
});

const rotate = new Rotate({
  position: Position.DOWN,
  order: 1,
});

const scale = new Scale({
  order: 3,
});

const scaleLine = new ScaleLine({
  order: 2,
  // bar: true,
  // steps: 4,
});

const controlsDown = [
  rotate,
  scale,
  scaleLine,
];

const controls = [
  ...controlsDown,
];

const log = controls.reduce((acc, ctrl) => {
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

map.addControls(controls);
