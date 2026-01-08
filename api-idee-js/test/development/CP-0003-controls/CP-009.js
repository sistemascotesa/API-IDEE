import { map as Mmap } from 'IDEE/api-idee';
// import Attributions from 'IDEE/control/Attributions';
// import * as Position from 'IDEE/ui/position';
import WMS from 'IDEE/layer/WMS';

const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
  // controls: ['attributions'],
  controls: ['location', 'attributions*<p>Contenido del control</p>', 'rotate'],
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
});

// En vez de new IDEE.layer.WMS
const layerinicial = new WMS({
  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeBoundary',
  legend: 'Limite administrativo',
  tiled: false,
  attribution: {
    name: 'Capa WMS',
    description: 'Descripción WMS',
    url: 'https://www.ign.es',
    contentAttributions: '${api-idee.static_resources.url}/Datos/reconocimientos/WMTS_PNOA_20170220/atribucionPNOA_Url.kml',
    contentType: 'kml',
  },
}, {});

// const attributionsControl = new Attributions({
//   position: Position.LEFT,
//   order: 100,
//   closePanel: true, // colapsado para ver el botón flotante
// });

mapa.addLayers(layerinicial);

// mapa.addControls([
//   attributionsControl,
// ]);

// mapa.removeControls(attributionsControl);

// mapa.addControls([attributionsControl]);
