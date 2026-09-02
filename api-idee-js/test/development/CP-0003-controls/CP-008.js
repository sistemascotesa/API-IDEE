import { map as Mmap } from 'IDEE/api-idee';
// import Control from 'IDEE/control/Control';
import Rotate from 'IDEE/control/Rotate';
import * as Position from 'IDEE/ui/position';

const map = Mmap({
  container: 'map',
  controls: ['rotate'],
  projection: 'EPSG:4326',
  zoom: 8,
  center: [
    -7.68,
    43.084999999999994,
  ],
});

const rotate = new Rotate({
  position: Position.DOWN,
});

// map.addControls([rotate]);

// map.removeControls(rotate);

// map.addControls([rotate]);

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
