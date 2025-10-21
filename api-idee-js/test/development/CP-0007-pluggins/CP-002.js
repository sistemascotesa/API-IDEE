import { map as Mmap } from 'IDEE/api-idee';

import Plugin from 'IDEE/Plugin';
import Tool from 'IDEE/tool/Tool';
// import ControlImpl from 'IDEE/control/Control';

const map = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
});

window.mapa = map;

const plugin = new Plugin('MyPlugin', { tooltip: 'GitHub', position: 'right', svgPath: 'https://componentes.idee.es/estaticos/imagenes/logos/logo-github.svg' });
map.addPlugin(plugin);

const tool1 = new Tool('MyTool1', { tooltip: 'tool 1', svgPath: 'https://componentes.idee.es/estaticos/imagenes/logos/spain-flag.svg' });
plugin.addTool(tool1);
