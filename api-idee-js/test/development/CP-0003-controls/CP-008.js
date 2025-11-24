import { map as Mmap } from 'IDEE/api-idee';
import Plugin from 'IDEE/Plugin';
import Control from 'IDEE/control/Control';
import Rotate from '../../../src/facade/js/control/Rotate';

const map = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
  // controls: ['rotate'],
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
});

const rotate = new Rotate({
  position: 'center-top-right',
});

map.addControls([
  rotate,
]);

map.removeControls(rotate);

// rotate.destroy();

const pluginRight = new Plugin('MyPluginRight', {
  tooltip: 'GitHub',
  position: 'right',
  svgPath: 'https://componentes.idee.es/estaticos/imagenes/logos/logo-github.svg',
});

map.addPlugin(pluginRight);

const control1 = new Control('MyControl1', {
  tooltip: 'spain',
  position: 'down',
  svgPath: 'https://componentes.idee.es/estaticos/imagenes/logos/spain-flag.svg',
});

pluginRight.addControl(control1);

window.mapa = map;
