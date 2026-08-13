/* eslint-disable one-var-declaration-per-line */
/* eslint-disable no-unused-vars,max-len */
import BackImgLayer from 'facade/backimglayer';

IDEE.language.setLang('es');
// IDEE.language.setLang('en');

// const wmstTestLayer0 = new IDEE.layer.WMTS({url: 'https://www.ign.es/wmts/pnoa-ma?', name: 'OI.OrthoimageCoverage', matrixSet: 'GoogleMapsCompatible', legend: 'Imagen', isBase: false, displayInLayerSwitcher: false, queryable: false, visible: true, format: 'image/jpeg', minZoom: 5, maxZoom: 10}); // NO BASE
// const wmstTestLayer0 = new IDEE.layer.WMTS({url: 'https://www.ign.es/wmts/pnoa-ma?', name: 'OI.OrthoimageCoverage', matrixSet: 'GoogleMapsCompatible', legend: 'Imagen', isBase: true, displayInLayerSwitcher: false, queryable: false, visible: true, format: 'image/jpeg', minZoom: 5, maxZoom: 10}); // BASE
// const map = IDEE.map({
//   container: 'mapjs',
//   controls: ['scale'],
//   center: [-458756.9690741142, 4682774.665868655],
//   layers: ['OSM'], // [wmstTestLayer0], // Este layer OSM o wmstTestLayer se quitan al añadir el plugin, si son layer base, en este caso si fue configurado como transparente false. Parece ser por map.getBaseLayers().forEach((layer) => {layer.on(IDEE.evt.LOAD, map.removeLayers(layer));});.
//   zoom: 6,
// });

// Variables necesarias para las pruebas.
// const wmtsLayer1 = 'WMTS*https://www.ign.es/wmts/ign-base?*IGNBaseTodo*GoogleMapsCompatible*Mapa IGN*false*image/jpeg*false*false*true';
// const wmtsLayer2 = 'WMTS*https://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*GoogleMapsCompatible*Imagen (PNOA)*false*image/png*false*false*true';
// const wmtsLayer3 = 'WMTS*https://www.ign.es/wmts/ign-base?*IGNBaseOrto*GoogleMapsCompatible*Mapa IGN*true*image/jpeg*false*false*true';
// const old_restLayer4= 'WMTSasteriscohttps://www.ign.es/wmts/ign-base?asteriscoIGNBaseTodoasteriscoGoogleMapsCompatibleasteriscoMapa IGNasteriscofalseasteriscoimage/jpegasteriscofalseasteriscofalseasteriscotrue,WMTSasteriscohttps://www.ign.es/wmts/pnoa-ma?asteriscoOI.OrthoimageCoverageasteriscoGoogleMapsCompatibleasteriscoImagen (PNOA)asteriscofalseasteriscoimage/pngasteriscofalseasteriscofalseasteriscotruesumarWMTSasteriscohttps://www.ign.es/wmts/ign-base?asteriscoIGNBaseOrtoasteriscoGoogleMapsCompatibleasteriscoMapa IGNasteriscotrueasteriscoimage/jpegasteriscofalseasteriscofalseasteriscotrue'; // Los 'asterisco' no se usan, se debería de ser hecho con '*'
// const restLayer4 = 'WMTS*https://www.ign.es/wmts/ign-base?*IGNBaseTodo*GoogleMapsCompatible*Mapa IGN*false*image/jpeg*false*false*true,WMTS*https://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*GoogleMapsCompatible*Imagen (PNOA)*false*image/png*false*false*truesumarWMTS*https://www.ign.es/wmts/ign-base?*IGNBaseOrto*GoogleMapsCompatible*Mapa IGN*true*image/jpeg*false*false*true';
// const pwImg1 = '../src/facade/assets/images/svqimagen.png';
// const pwImg2 = 'https://www.ign.es/iberpix/static/media/raster.c7a904f3.png';
// const pwImg3 = '../src/facade/assets/images/svqmapa.png';
// const pwImg4 = '../src/facade/assets/images/svqhibrid.png';

// const i = new IDEE.plugin.Information({}); map.addPlugin(i);

/**
const mp = new BackImgLayer({
  collapsed: false,
  tooltip: 'Capas de fondo',
  layerVisibility: false,
  columnsNumber: 2,
  empty: false,
  layerId: 0,
  // PRUEBA 1 // Cuando no se pasa layerOpts, se usan los parámetros ids, titles, previews y layers
  // position: 'left',
  ids: 'mapa,hibrido',
  titles: 'Mapa,Hibrido',
  previews: `${pwImg1}, ${pwImg3}`,
  layers: `${wmtsLayer1} ,${wmtsLayer2}`,

  // PRUEBA 2
  // position: 'left',
  // //ids: ['mapa', 'hibrido'],
  // ids: 'mapa,hibrido',
  // // titles: ['Mapa', 'Hibrido'],
  // titles: 'Mapa,Hibrido',
  // // previews: [pwImg3, pwImg4],
  // previews: `${pwImg3},${pwImg4}`,
  // // layers: [wmtsLayer1, wmtsLayer2 + '+' + wmtsLayer3],
  // // layers: wmtsLayer1+','+wmtsLayer2 + '+' + wmtsLayer3,
  // layers: `${wmtsLayer1},${wmtsLayer2}sumar${wmtsLayer3}`,
  // // ids: 'mapa,hibrido,orto', titles: 'Mapa,Hibrido,Orto', layers: wmtsLayer1+','+wmtsLayer2 + ',' + wmtsLayer3,
  // // layers: wmtsLayer1 + ',' + wmtsLayer2,

  // PRUEBA 4
  // position: 'left',
  // ids: 'mapa,hibrido',
  // titles: 'Mapa,Hibrido',
  // previews: `${pwImg3},${pwImg4}`,
  // layers: restLayer4,
});
*/

// map.addPlugin(mp);
// window.mp = mp;
// window.BackImgLayer = BackImgLayer;

const map = IDEE.map({
  container: 'mapjs',
  controls: ['rotate', "measurebar*position='center-top-right'"],
  center: [-458756.9690741142, 4682774.665868655],
  // Este layer OSM o wmstTestLayer se quitan al añadir el plugin, si son layer base, en este caso si fue configurado como transparente false.
  // Parece ser por map.getBaseLayers().forEach((layer) => {layer.on(IDEE.evt.LOAD, map.removeLayers(layer));});.
  // layers: ['OSM'],
  // [wmstTestLayer0],
  zoom: 6,
});

window.map = map;

map.addPlugin(
  new IDEE.plugin.VectorsManagement({
    position: 'left',
  }),
);

let mp;

const createPlugin = (options) => {
  mp = new IDEE.plugin.BackImgLayer(options);
  window.mp = mp;
  window.BackImgLayer = IDEE.plugin.BackImgLayer.BackImgLayer;
  map.addPlugin(mp);
};

const removePlugin = () => {
  if (mp) map.removePlugins(mp);
};

const removeButton = document.getElementById('removeButton');
removeButton.addEventListener('click', () => { removePlugin(); });

const selectPosicion = document.getElementById('selectPosicion');
const inputTooltip = document.getElementById('inputTooltip');
const ncolumn = document.getElementById('ncolumn');
const selectCollapsed = document.getElementById('selectCollapsed');
const inputOrder = document.getElementById('inputOrder');
const selectVisibility = document.getElementById('selectVisibility');
const selectEmpty = document.getElementById('selectEmpty');
const selectEnableLayerOpts = document.getElementById('selectEnableLayerOpts');
const inputIds = document.getElementById('inputIds');
const inputTitles = document.getElementById('inputTitles');
const inputPreviews = document.getElementById('inputPreviews');
const inputLayers = document.getElementById('inputLayers');

const updatePlugin = () => {
  const options = {};
  options.position = selectPosicion.options[selectPosicion.selectedIndex].value;
  options.tooltip = inputTooltip.value !== '' ? options.tooltip = inputTooltip.value : '';
  options.columnsNumber = ncolumn.value ?? 2;

  options.collapsed = (selectCollapsed.options[selectCollapsed.selectedIndex].value === 'true');
  if (inputOrder.value !== undefined) options.order = Number(inputOrder.value);
  options.layerVisibility = (selectVisibility.options[selectVisibility.selectedIndex].value === 'true');
  options.empty = (selectEmpty.options[selectEmpty.selectedIndex].value === 'true');

  options.selectEnableLayerOpts = (selectEnableLayerOpts.options[selectEnableLayerOpts.selectedIndex].value === 'true');

  if (inputIds.value !== '') options.ids = inputIds.value;
  if (inputPreviews.value !== '') options.previews = inputPreviews.value;
  if (inputTitles.value !== '') options.titles = inputTitles.value;
  if (inputLayers.value !== '') options.layers = inputLayers.value;

  if ((selectEnableLayerOpts.options[selectEnableLayerOpts.selectedIndex].value === 'true')) {
    // Variables necesarias para las pruebas.
    const wmtsLayer1 = 'WMTS*https://www.ign.es/wmts/ign-base?*IGNBaseTodo*GoogleMapsCompatible*Mapa IGN*false*image/jpeg*false*false*true';
    const wmtsLayer2 = 'WMTS*https://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*GoogleMapsCompatible*Imagen (PNOA)*false*image/png*false*false*true';
    const wmtsLayer3 = 'WMTS*https://www.ign.es/wmts/ign-base?*IGNBaseOrto*GoogleMapsCompatible*Mapa IGN*true*image/jpeg*false*false*true';
    // const old_restLayer4= 'WMTSasteriscohttps://www.ign.es/wmts/ign-base?asteriscoIGNBaseTodoasteriscoGoogleMapsCompatibleasteriscoMapa IGNasteriscofalseasteriscoimage/jpegasteriscofalseasteriscofalseasteriscotrue,WMTSasteriscohttps://www.ign.es/wmts/pnoa-ma?asteriscoOI.OrthoimageCoverageasteriscoGoogleMapsCompatibleasteriscoImagen (PNOA)asteriscofalseasteriscoimage/pngasteriscofalseasteriscofalseasteriscotruesumarWMTSasteriscohttps://www.ign.es/wmts/ign-base?asteriscoIGNBaseOrtoasteriscoGoogleMapsCompatibleasteriscoMapa IGNasteriscotrueasteriscoimage/jpegasteriscofalseasteriscofalseasteriscotrue'; // Los 'asterisco' no se usan, se debería de ser hecho con '*'
    const restLayer4 = 'WMTS*https://www.ign.es/wmts/ign-base?*IGNBaseTodo*GoogleMapsCompatible*Mapa IGN*false*image/jpeg*false*false*true,WMTS*https://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*GoogleMapsCompatible*Imagen (PNOA)*false*image/png*false*false*truesumarWMTS*https://www.ign.es/wmts/ign-base?*IGNBaseOrto*GoogleMapsCompatible*Mapa IGN*true*image/jpeg*false*false*true';

    /** a usar en el .jsp */
    // const pwImg1 = 'plugins/backimglayer/images/svqimagen.png';
    // const pwImg2 = 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/14/7896/10319.jpeg';
    // const pwImg3 = 'plugins/backimglayer/images/svqmapa.png';
    // const pwImg4 = 'plugins/backimglayer/images/svqhibrid.png';
    const pwImg1 = '../src/facade/assets/images/svqimagen.png';
    const pwImg2 = 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/14/7896/10319.jpeg';
    const pwImg3 = '../src/facade/assets/images/svqmapa.png';
    const pwImg4 = '../src/facade/assets/images/svqhibrid.png';
    options.layerOpts = [
      {
        id: 'raster',
        preview: pwImg1,
        title: 'Mapa',
        layers: [
          new IDEE.layer.WMTS({
            url: 'https://www.ign.es/wmts/mapa-raster?',
            name: 'MTN',
            legend: 'Mapa',
            matrixSet: 'GoogleMapsCompatible',
            isBase: true,
            displayInLayerSwitcher: false,
            queryable: false,
            visible: true,
            format: 'image/jpeg',
          }),
        ],
      },
      {
        id: 'imagen',
        preview: pwImg2,
        title: 'Imagen',
        layers: [
          new IDEE.layer.XYZ({
            url: 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg',
            name: 'PNOA-MA',
            legend: 'Imagen',
            projection: 'EPSG:3857',
            isBase: true,
            displayInLayerSwitcher: false,
            queryable: false,
            visible: true,
            maxZoom: 19,
          }),
          new IDEE.layer.WMTS({
            url: 'https://www.ign.es/wmts/pnoa-ma?',
            name: 'OI.OrthoimageCoverage',
            matrixSet: 'GoogleMapsCompatible',
            legend: 'Imagen',
            isBase: false,
            displayInLayerSwitcher: false,
            queryable: false,
            visible: true,
            format: 'image/jpeg',
            minZoom: 19,
          }),
        ],
      },
      {
        id: 'mapa',
        preview: pwImg3,
        title: 'Callejero',
        layers: [
          new IDEE.layer.WMTS({
            url: 'https://www.ign.es/wmts/ign-base?',
            name: 'IGNBaseTodo',
            legend: 'Callejero',
            matrixSet: 'GoogleMapsCompatible',
            isBase: true,
            displayInLayerSwitcher: false,
            queryable: false,
            visible: true,
            format: 'image/jpeg',
          }),
        ],
      },
      {
        id: 'hibrido',
        title: 'Híbrido',
        preview: pwImg4,
        layers: [
          new IDEE.layer.XYZ({
            url: 'https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg',
            name: 'PNOA-MA',
            legend: 'Imagen',
            projection: 'EPSG:3857',
            isBase: true,
            displayInLayerSwitcher: false,
            queryable: false,
            visible: true,
            maxZoom: 19,
          }),
          new IDEE.layer.WMTS({
            url: 'https://www.ign.es/wmts/pnoa-ma?',
            name: 'OI.OrthoimageCoverage',
            matrixSet: 'GoogleMapsCompatible',
            legend: 'Imagen',
            isBase: false,
            displayInLayerSwitcher: false,
            queryable: false,
            visible: true,
            format: 'image/jpeg',
            minZoom: 19,
          }),
          new IDEE.layer.WMTS({
            url: 'https://www.ign.es/wmts/ign-base?',
            name: 'IGNBaseOrto',
            matrixSet: 'GoogleMapsCompatible',
            legend: 'Topónimos',
            isBase: false,
            displayInLayerSwitcher: false,
            queryable: false,
            visible: true,
            format: 'image/png',
          }),
        ],
      },
      {
        id: 'lidar',
        preview: 'https://wmts-mapa-lidar.idee.es/lidar?layer=EL.GridCoverageDSM&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix=15&TileCol=16138&TileRow=12559',
        title: 'LiDAR',
        layers: [
          new IDEE.layer.WMTS({
            url: 'https://wmts-mapa-lidar.idee.es/lidar?',
            name: 'EL.GridCoverageDSM',
            legend: 'LiDAR',
            matrixSet: 'GoogleMapsCompatible',
            isBase: true,
            displayInLayerSwitcher: false,
            queryable: false,
            visible: true,
            format: 'image/png',
          }),
        ],
      },
      {
        id: 'ocupacion-suelo',
        preview: 'https://servicios.idee.es/wmts/ocupacion-suelo?layer=LC.LandCoverSurfaces&style=LC.LandCoverSurfaces.Default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fpng&TileMatrix=17&TileCol=64554&TileRow=50237',
        title: 'Ocupación',
        layers: [
          new IDEE.layer.WMTS({
            url: 'https://servicios.idee.es/wmts/ocupacion-suelo?',
            name: 'LC.LandCoverSurfaces',
            legend: 'Ocupación',
            matrixSet: 'GoogleMapsCompatible',
            isBase: true,
            displayInLayerSwitcher: false,
            queryable: false,
            visible: true,
            format: 'image/png',
          }),
        ],
      },
      {
        id: 'historicos',
        preview: 'https://www.ign.es/wmts/primera-edicion-mtn?layer=mtn50-edicion1&style=default&tilematrixset=GoogleMapsCompatible&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image%2Fjpeg&TileMatrix=14&TileCol=8071&TileRow=6278',
        title: 'Históricos',
        layers: [
          new IDEE.layer.WMTS({
            url: 'https://www.ign.es/wmts/primera-edicion-mtn?',
            name: 'mtn50-edicion1',
            legend: 'Históricos',
            matrixSet: 'GoogleMapsCompatible',
            isBase: true,
            displayInLayerSwitcher: false,
            queryable: false,
            visible: true,
            format: 'image/jpeg',
          }),
        ],
      },
    ];
  }

  removePlugin();
  createPlugin(options);
};

[
  selectPosicion,
  inputTooltip,
  ncolumn,
  selectCollapsed,
  inputOrder,
  selectVisibility,
  selectEmpty,
  selectEnableLayerOpts,
  inputIds,
  inputTitles,
  inputPreviews,
  inputLayers,
].forEach((ctrl) => {
  ctrl.addEventListener('change', updatePlugin);
});

updatePlugin();
