import { map as Mmap } from 'IDEE/api-idee';
import Attributions from 'IDEE/control/Attributions';
import * as Position from 'IDEE/ui/position';

const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
  // controls: ['attributions'],
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
});

// mapa.addControls(['attributions']);

const attributionsControl = new Attributions({
  position: Position.LEFT,
  order: 100,
  closePanel: true, // colapsado para ver el botón flotante
});

mapa.addControls([
  attributionsControl,
]);

// mapa.removeControls(attributionsControl);

// mapa.addControls([attributionsControl]);
