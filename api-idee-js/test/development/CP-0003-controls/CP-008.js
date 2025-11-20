import { map as Mmap } from 'IDEE/api-idee';
import Plugin from 'IDEE/Plugin';
import Control from 'IDEE/control/Control';

const map = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
});

window.mapa = map;

const pluginRight = new Plugin('MyPluginRight', {
  tooltip: 'GitHub',
  position: 'right',
  svgPath: 'https://componentes.idee.es/estaticos/imagenes/logos/logo-github.svg',
});

const control1 = new Control('MyControl1', {
  tooltip: 'spain',
  position: 'down',
  svgPath: 'https://componentes.idee.es/estaticos/imagenes/logos/spain-flag.svg',
});

map.addPlugin(pluginRight);

pluginRight.addControl(control1);

map.addPlugin(new Plugin('MyPluginRight2', {
  tooltip: 'GitHub',
  position: 'right',
  svgPath: 'https://componentes.idee.es/estaticos/imagenes/logos/logo-github.svg',
}));

map.addPlugin(new Plugin('MyPluginLeft', {
  tooltip: 'GitHub',
  position: 'left',
  svgPath: 'https://componentes.idee.es/estaticos/imagenes/logos/logo-github.svg',
}));

// const control2 = new Control('MyControl2', {
//   position: 'right',
// });

map.addControls(['rotate']);
