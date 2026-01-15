import { map as Mmap } from 'IDEE/api-idee';
import WMS from 'IDEE/layer/WMS';
import GetFeatureInfo from 'IDEE/control/GetFeatureInfo';
// import { wms_001, wms_002, wms_003 } from '../layers/wms/wms';

const map = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
  // controls: ['getfeatureinfo'],
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
});

let ctrl;
const selectPosicion = document.getElementById('selectPosicion');

const createControl = (propiedades) => {
  ctrl = new GetFeatureInfo(propiedades);
  map.addControls(ctrl);
};

const removeControl = () => {
  map.removeControls(ctrl);
  ctrl = null;
};

createControl();

const updateControl = () => {
  if (ctrl != null) removeControl();
  createControl({
    position: selectPosicion.options[selectPosicion.selectedIndex].value,
  });
};

selectPosicion.addEventListener('change', updateControl);

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => {
  removeControl();
});

// const layers = [wms_001, wms_002, wms_003];

// mapa.addLayers([wms_001, wms_002, wms_003]);
// mapa.addLayers(layers);
// mapa.addLayers(wms_002);
// mapa.addLayers(wms_003);

// mapa.addControls('getfeatureinfo*true');

const layerinicial = new WMS({
  url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
  name: 'AU.AdministrativeBoundary',
  legend: 'Limite administrativo',
  tiled: false,
}, {});

// const capaWMS3 = new WMS({
//   url: 'http://geostematicos-sigc.juntadeandalucia.es/geoserver/tematicos/wms?',
//   name: 'provincias_pob',
//   legend: 'capaWMS3',
//   tiled: false,
//   isBase: false,
// });

const layer5 = new WMS({
  url: 'https://servicios.ine.es/WMS/WMS_INE_SECCIONES_G01/MapServer/WMSServer?',
  name: 'Secciones2021',
  legend: 'Secciones censales',
  version: '1.1.0',
  tiled: false,
  visibility: true,
}, {});

map.addLayers([layerinicial, layer5]);

// const getControls = mapa.getControls()[0];

// setTimeout(() => {
//   mapa.removeControls(getControls);
// }, 1000);

// mapa.addLayers(layerinicial);
