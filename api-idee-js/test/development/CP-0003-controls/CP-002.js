import { map as Mmap } from 'IDEE/api-idee';
import ScaleLine from 'IDEE/control/ScaleLine';

const map = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
  controls: ['scaleline'],
  // controls: ['scale*false', 'scaleline', 'panzoom', 'panzoombar'],
  // controls: ['scale*false', 'panzoom', 'panzoombar'],
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
});

// const scaleLine = new ScaleLine({
//   position: 'left',
// });

// map.addControls(scaleLine);
