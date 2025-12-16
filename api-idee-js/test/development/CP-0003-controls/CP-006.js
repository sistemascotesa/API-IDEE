import { map as Mmap } from 'IDEE/api-idee';
import Location from '../../../src/facade/js/control/Location';

const map = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
  // controls: ['location*true*false'],
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
});

const location = new Location({
  position: 'left',
});

map.addControls([
  location,
]);

map.removeControls(location);

map.addControls([location]);
