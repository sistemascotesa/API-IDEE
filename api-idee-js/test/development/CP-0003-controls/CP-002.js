import { map as Mmap } from 'IDEE/api-idee';
// import ScaleLine from 'IDEE/control/ScaleLine';

const map = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
  controls: ['scaleline'],
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
});

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
