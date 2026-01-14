import { map as Mmap } from 'IDEE/api-idee';
import Attributions from 'IDEE/control/Attributions';
// import * as Position from 'IDEE/ui/position';
import WMS from 'IDEE/layer/WMS';
// import Panzoom from 'IDEE/control/Panzoom';
import * as Position from 'IDEE/ui/position';

const mapa = Mmap({
  container: 'map',
  projection: 'EPSG:3857',
  // controls: ['attributions*<p>Contenido del control</p>'],
  // controls: ['location', 'attributions*<p>Contenido del control</p>', 'rotate', 'ImplementationSwitcher'],
  center: [-443273.10081370454, 4757481.749296248],
  zoom: 6,
});

let ctrl;

const createControl = (propiedades) => {
  ctrl = new Attributions(propiedades);
  mapa.addControls(ctrl);
};

const removeControl = () => {
  mapa.removeControls(ctrl);
  ctrl = null;
};

const position = Position.LEFT;

// const attributions = new Attributions({
//   position: Position.LEFT,
// });

// const panzoom = new Panzoom({
//   position: Position.DOWN,
// });

// mapa.addControls([
//   panzoom,
// ]);

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

// mapa.addControls(attributions);

// attributions.on('added:map', () => {
//   mapa.removeControls(attributions);
// });

// setTimeout(() => {
//   mapa.removeControls([attributions]);
// }, 1000);

// mapa.addControls([
//   attributionsControl,
// ]);

// mapa.removeControls(attributionsControl);

// mapa.addControls([attributionsControl]);

const removeButton = document.getElementById('removeButton');

const selectPosicion = document.getElementById('selectPosicion');

function changeTest() {
  if (ctrl) removeControl();
  const options = {};
  options.position = selectPosicion.options[selectPosicion.selectedIndex].value;
  createControl(options);
}

selectPosicion.addEventListener('change', changeTest);

removeButton.addEventListener('click', () => {
  mapa.removeControls('attributions');
});
