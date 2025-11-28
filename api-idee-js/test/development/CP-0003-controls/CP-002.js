import { map as Mmap } from 'IDEE/api-idee';
// import Panzoombar from 'IDEE/control/Panzoombar';

const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
  controls: [/*'scale*false', 'scaleline', 'panzoom',*/ 'panzoombar'],
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
});

// mapa.addControls([
//   new Panzoombar(), // No es necesario pasar posición si OpenLayers la maneja
// ]);
