import { map as Mmap } from 'IDEE/api-idee';

import Plugin from 'IDEE/Plugin';
import Control from 'IDEE/control/Control';

const map = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
});

window.mapa = map;

const plugin = new Plugin('MyPlugin', { tooltip: 'GitHub', position: 'right', svgPath: 'https://componentes.idee.es/estaticos/imagenes/logos/logo-github.svg' });
map.addPlugin(plugin);

const control1 = new Control('MyControl1', { tooltip: 'spain', svgPath: 'https://componentes.idee.es/estaticos/imagenes/logos/spain-flag.svg' });
plugin.addControl(control1);

const control2 = new Control('MyControl2', { tooltip: 'uk', svgPath: 'https://componentes.idee.es/estaticos/imagenes/logos/uk-flag.svg' });
plugin.addControl(control2);
