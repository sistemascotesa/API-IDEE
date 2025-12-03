import { map as Mmap } from 'IDEE/api-idee';
import Panzoombar from 'IDEE/control/Panzoombar';
import * as Position from 'IDEE/ui/position';
// import ScaleLine from 'IDEE/control/ScaleLine';
// import Scale from 'IDEE/control/Scale';

const map = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
  // controls: ['panzoombar'],
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
  // maxZoom: 20,
  // minZoom: 1.90,
});

const panzoombar = new Panzoombar({
  position: Position.LEFT,
});

map.addControls([
  panzoombar,
]);

// const scaleLine = new ScaleLine({
//   position: 'center-top-right',
//   vendorOptions: {
//     units: 'degrees',
//     // bar: true,
//     text: true,
//     minWidth: 90,
//   },
// });

// map.addControls(scaleLine);

/** ----------------------------------------------------------------------------------- */

// const scale = new Scale({
//   position: 'right',
// });

// map.addControls(scale);
