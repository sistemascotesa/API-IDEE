import { map as Mmap } from 'IDEE/api-idee';
import Panzoombar from '../../../src/facade/js/control/Panzoombar';

const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
  // controls: [/*'scale*false', 'scaleline', 'panzoom',*/ 'panzoombar'],
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
});

const panzoombar = new Panzoombar({
  position: 'down',
});

mapa.addControls([
  panzoombar,
]);
