import { map as Mmap } from 'IDEE/api-idee';
import WMS from 'IDEE/layer/WMS';
import BackgroundLayers from 'IDEE/control/BackgroundLayers';
import * as Position from 'IDEE/ui/position';

// IDEE.config.backgroundlayers = [{
//   id: 'mapa',
//   title: 'Callejero',
//   layers: [
//     Raster3,
//     Raster2,
//   ],
// }];

const map = Mmap({
  container: 'map',
  // controls: ['backgroundlayers'],
  zoom: 5,
  maxZoom: 20,
  minZoom: 4,
  center: [-467062.8225, 4683459.6216],
});

const backgrounLayersControl = new BackgroundLayers(
  map,
  {
    position: Position.DOWN,
  },
);

map.addControls(backgrounLayersControl);

const layerinicial = new WMS({
  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeBoundary',
  legend: 'Limite administrativo',
  tiled: false,
}, {});

const layerUA = new WMS({
  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeUnit',
  legend: 'Unidad administrativa',
  tiled: false,
}, {});

map.addLayers([layerinicial, layerUA]);

// map.removeControls(backgrounLayersControl);

// map.addControls(backgrounLayersControl);
