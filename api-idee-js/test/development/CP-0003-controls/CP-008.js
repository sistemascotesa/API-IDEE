import { map as Mmap } from 'IDEE/api-idee';
// import Plugin from 'IDEE/Plugin';
// import Control from 'IDEE/control/Control';
// import Rotate from 'IDEE/control/Rotate';
import Attributions from 'IDEE/control/Attributions';
import * as Position from 'IDEE/ui/position';
import Panzoom from 'IDEE/control/Panzoom';

const map = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
  // controls: ['rotate'],
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
});

// const rotate = new Rotate({
//   position: 'down',
// });

const attributionsControl = new Attributions({
  position: Position.RIGHT,
  order: 100, // Un orden para asegurar su visibilidad
  closePanel: false,
});

const panzoom = new Panzoom({
  position: Position.LEFT,
});

// const spainFlatControl = new Control('SpainFlat', {
//   tooltip: 'spain',
//   position: 'left',
//   svgPath: 'https://componentes.idee.es/estaticos/imagenes/logos/spain-flag.svg',
// });

// const pluginRight = new Plugin('MyPluginRight', {
//   tooltip: 'GitHub',
//   position: 'right',
//   svgPath: 'https://componentes.idee.es/estaticos/imagenes/logos/logo-github.svg',
// });

// pluginRight.addControl(rotate);

// map.addPlugin(pluginRight);

map.addControls([
  // rotate,
  attributionsControl,
  panzoom,
  // spainFlatControl,
]);

// map.removeControls(rotate);
