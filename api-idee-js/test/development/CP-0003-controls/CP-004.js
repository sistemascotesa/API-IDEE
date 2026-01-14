import { map as Mmap } from 'IDEE/api-idee';
// import { WMS } from 'IDEE/layer/WMS';
import { wms_001, wms_002, wms_003 } from '../layers/wms/wms';

const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
  controls: ['getfeatureinfo*true'],
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
});

mapa.addLayers([wms_001, wms_002, wms_003]);

/* const layerinicial = new WMS({
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
}, {}); */

// mapa.addLayers(layerinicial);
