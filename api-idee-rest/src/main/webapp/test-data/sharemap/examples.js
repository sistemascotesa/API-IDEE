/* global Cesium */
// Catálogo manual. Cada llamada añade una capa; no se ejecutan ejemplos al cargar el script.
(function sharemapExamples() {
  const base = new URL('./', document.currentScript.src).href;
  const url = (file) => `${base}${file}`;
  const data = {
    type: 'FeatureCollection',
    features: [{
      type: 'Feature',
      id: 'demo',
      geometry: { type: 'Point', coordinates: [-3, 40] },
      properties: { nombre: 'Punto de prueba', valor: 1 },
    }],
  };

  const factories = {
    WMS: () => new IDEE.layer.WMS({
      name: 'AU.AdministrativeBoundary',
      url: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
      isBase: false,
    }),
    WMTS: () => new IDEE.layer.WMTS({
      name: 'IGNBaseTodo',
      url: 'https://www.ign.es/wmts/ign-base?',
      matrixSet: 'GoogleMapsCompatible',
      isBase: false,
    }),
    WFS: () => new IDEE.layer.WFS({
      name: 'cities',
      namespace: 'ms',
      geometry: 'POINT',
      url: 'https://demo.mapserver.org/cgi-bin/wfs?',
      isBase: false,
    }, {
      getFeatureOutputFormat: 'geojson', vendor: { getFeature: { count: 10 } },
    }),
    OGCAPIFeatures: () => new IDEE.layer.OGCAPIFeatures({
      name: 'lakes',
      url: 'https://demo.pygeoapi.io/master/collections/',
      limit: 10,
    }),
    DataIDEE: () => new IDEE.layer.DataIDEE({
      name: 'lakes',
      url: 'https://demo.pygeoapi.io/master/collections/',
      limit: 10,
    }),
    OSM: () => new IDEE.layer.OSM({ name: 'osm-prueba', isBase: false }),
    XYZ: () => new IDEE.layer.XYZ({ name: 'xyz-prueba', url: url('tile.png'), isBase: false }),
    TMS: () => new IDEE.layer.TMS({ name: 'tms-prueba', url: url('tile.png'), isBase: false }),
    GeoJSON: () => new IDEE.layer.GeoJSON({ name: 'geojson-prueba', url: url('puntos.geojson') }),
    KML: () => new IDEE.layer.KML({ name: 'kml-prueba', url: url('puntos.kml'), extract: true }),
    KMZ: () => new IDEE.layer.KMZ({ name: 'kmz-prueba', url: url('puntos.kmz'), extract: true }),
    GPX: () => new IDEE.layer.GPX({ name: 'gpx-prueba', url: url('ruta.gpx'), extract: true }),
    GeoTIFF: () => new IDEE.layer.GeoTIFF({
      name: 'geotiff-prueba',
      url: url('raster.tif'),
      projection: 'EPSG:3857',
      normalize: true,
      isBase: false,
    }),
    MVT: () => new IDEE.layer.MVT({ name: 'mvt-prueba', url: url('point.pbf'), isBase: false }),
    MBTiles: () => new IDEE.layer.MBTiles({ name: 'mbtiles-prueba', url: url('raster.mbtiles'), isBase: false }),
    MBTilesVector: () => new IDEE.layer.MBTilesVector({
      name: 'mbtiles-vector-prueba',
      url: url('vector.mbtiles'),
      isBase: false,
    }),
    MapLibre: () => new IDEE.layer.MapLibre({ name: 'maplibre-prueba', url: url('style.json'), isBase: false }),
    GeoPackage: () => new IDEE.layer.GeoPackage({ name: 'geopackage-prueba', url: url('mixto.gpkg') }),
    WMC: () => new IDEE.layer.WMC({ name: 'wmc-prueba', url: url('contexto.wmc') }),
    Terrain: () => new IDEE.layer.Terrain({ name: 'terrain-prueba', url: url('terrain/') }),
    Tiles3D: () => new IDEE.layer.Tiles3D({ name: 'tiles3d-prueba', url: url('tiles3d/tileset.json') }),
    LayerGroup: () => new IDEE.layer.LayerGroup({
      name: 'grupo-prueba',
      layers: [
        new IDEE.layer.GeoJSON({ name: 'hija-geojson', url: url('puntos.geojson') }),
        new IDEE.layer.GPX({ name: 'hija-gpx', url: url('ruta.gpx') }),
      ],
    }),
  };

  const publicURLs = {
    WMS: 'https://www.ign.es/wms-inspire/unidades-administrativas?',
    WMTS: 'https://www.ign.es/wmts/ign-base?',
    WFS: 'https://demo.mapserver.org/cgi-bin/wfs?service=WFS&count=10',
    OGCAPIFeatures: 'https://demo.pygeoapi.io/master/collections/',
    DataIDEE: 'https://demo.pygeoapi.io/master/collections/',
    OSM: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    XYZ: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    TMS: 'https://tms-ign-base.idee.es/1.0.0/IGNBaseTodo/{z}/{x}/{-y}.jpeg',
    GeoJSON: 'https://openlayers.org/en/latest/examples/data/geojson/line-samples.geojson',
    KML: 'https://openlayers.org/en/latest/examples/data/kml/2012-02-10.kml',
    KMZ: 'https://openlayers.org/en/latest/examples/data/kmz/iceland.kmz',
    GPX: 'https://openlayers.org/en/latest/examples/data/gpx/fells_loop.gpx',
    GeoTIFF: 'https://maplibre.org/maplibre-gl-js/docs/assets/cog.tif',
    MVT: 'https://demotiles.maplibre.org/tiles/{z}/{x}/{y}.pbf',
    MBTiles: 'https://raw.githubusercontent.com/mapbox/node-mbtiles/master/test/fixtures/plain_1.mbtiles',
    MapLibre: 'https://demotiles.maplibre.org/style.json',
    GeoPackage: 'https://ngageoint.github.io/GeoPackage/examples/rivers.gpkg',
    GeoPackageTile: 'https://ngageoint.github.io/GeoPackage/examples/rivers.gpkg',
    Tiles3D: 'https://raw.githubusercontent.com/CesiumGS/cesium/main/Apps/SampleData/Cesium3DTiles/PointCloud/PointCloudBatched/tileset.json',
  };
  const publicFactories = {
    WMS: factories.WMS,
    WMTS: factories.WMTS,
    WFS: factories.WFS,
    OGCAPIFeatures: factories.OGCAPIFeatures,
    DataIDEE: factories.DataIDEE,
    OSM: factories.OSM,
    XYZ: () => new IDEE.layer.XYZ({ name: 'xyz-publico', url: publicURLs.XYZ, isBase: false }),
    TMS: () => new IDEE.layer.TMS({ name: 'tms-publico', url: publicURLs.TMS, isBase: false }),
    GeoJSON: () => new IDEE.layer.GeoJSON({ name: 'geojson-publico', url: publicURLs.GeoJSON }),
    KML: () => new IDEE.layer.KML({ name: 'kml-publico', url: publicURLs.KML, extract: true }),
    KMZ: () => new IDEE.layer.KMZ({ name: 'kmz-publico', url: publicURLs.KMZ, extract: true }),
    GPX: () => new IDEE.layer.GPX({ name: 'gpx-publico', url: publicURLs.GPX, extract: true }),
    GeoTIFF: () => new IDEE.layer.GeoTIFF({ name: 'geotiff-publico', url: publicURLs.GeoTIFF, isBase: false }),
    MVT: () => new IDEE.layer.MVT(
      {
        name: 'mvt-publico', url: publicURLs.MVT, layers: ['countries'], isBase: false,
      },
      { maxZoom: 6 },
    ),
    MBTiles: () => new IDEE.layer.MBTiles({ name: 'mbtiles-publico', url: publicURLs.MBTiles, isBase: false }),
    MapLibre: () => new IDEE.layer.MapLibre({ name: 'maplibre-publico', url: publicURLs.MapLibre, isBase: false }),
    GeoPackage: () => new IDEE.layer.GeoPackage({ name: 'geopackage-publico', url: publicURLs.GeoPackage }),
    GeoPackageTile: () => new IDEE.layer.GeoPackage({ name: 'paquete-publico', url: publicURLs.GeoPackageTile }),
    Tiles3D: () => new IDEE.layer.Tiles3D({ name: 'tiles3d-publico', url: publicURLs.Tiles3D }),
  };

  async function add(type, map, publicSource = false) {
    const cesium = Boolean(map.getMapImpl().scene);
    if (['Terrain', 'Tiles3D'].includes(type) && !cesium) {
      throw new Error(`${type} requiere un visualizador Cesium.`);
    }
    if (['GeoTIFF', 'MVT', 'MBTilesVector', 'MapLibre', 'WMC', 'GeoPackage', 'GeoPackageTile'].includes(type) && cesium) {
      throw new Error(`Prueba ${type} en OpenLayers: su implementación Cesium no está disponible.`);
    }
    if (publicSource && !publicFactories[type]) {
      throw new Error(`No hay un ejemplo público verificado para ${type}; usa add() para su muestra del WAR.`);
    }
    const selectedFactories = publicSource ? publicFactories : factories;
    let layer;
    if (type === 'Vector') {
      layer = new IDEE.layer.Vector({ name: 'vector-local' });
      map.addLayers(layer);
      const coordinates = cesium ? [-3, 40] : ol.proj.transform([-3, 40], 'EPSG:4326', map.getProjection().code);
      layer.addFeatures(new IDEE.Feature('demo', {
        ...data.features[0],
        geometry: { type: 'Point', coordinates },
      }));
    } else if (type === 'GenericVector') {
      let native;
      if (cesium) {
        native = new Cesium.CustomDataSource('nativa');
        native.entities.add({
          id: 'demo',
          position: Cesium.Cartesian3.fromDegrees(-3, 40),
          point: { pixelSize: 12, color: Cesium.Color.ORANGE },
          properties: { nombre: 'Punto nativo' },
        });
      } else {
        const coordinates = ol.proj.transform([-3, 40], 'EPSG:4326', map.getProjection().code);
        native = new ol.layer.Vector({
          source: new ol.source.Vector({
            features: [new ol.Feature({ geometry: new ol.geom.Point(coordinates), nombre: 'Punto nativo' })],
          }),
        });
      }
      layer = new IDEE.layer.GenericVector({ name: 'generic-vector' }, {}, native);
      map.addLayers(layer);
    } else if (type === 'GenericRaster') {
      const native = cesium
        ? new Cesium.ImageryLayer(new Cesium.UrlTemplateImageryProvider({ url: url('tile.png') }))
        : new ol.layer.Tile({ source: new ol.source.XYZ({ url: url('tile.png') }) });
      layer = new IDEE.layer.GenericRaster({ name: 'generic-raster', isBase: false }, {}, native);
      map.addLayers(layer);
    } else if (type === 'GeoPackageTile') {
      const gpkg = publicSource ? publicFactories.GeoPackageTile()
        : new IDEE.layer.GeoPackage({ name: 'paquete-teselas', url: url('raster.gpkg') });
      map.addLayers(gpkg);
      await gpkg.whenReady();
      layer = gpkg.getLayers().find((item) => item.type === 'GeoPackageTile');
    } else {
      if (!selectedFactories[type]) throw new Error(`Tipo desconocido: ${type}`);
      layer = selectedFactories[type]();
      map.addLayers(layer);
      if (layer.whenReady) await layer.whenReady();
    }
    return layer;
  }

  window.sharemapSamples = {
    types: [...Object.keys(factories), 'Vector', 'GenericVector', 'GenericRaster', 'GeoPackageTile'],
    base,
    add,
    publicURLs,
    addPublic: (type, map) => add(type, map, true),
  };
}());
