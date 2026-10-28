/**
 * Sección 4 del guion: capas ráster.
 */
import {
  URLS, MBTILES_RASTER_URL, GPKG_RASTER_URL,
} from './data';

const replace = async (ctx, layers) => {
  if (ctx.store.layers) ctx.map.removeLayers(ctx.store.layers);
  ctx.store.layers = [].concat(layers);
  ctx.map.addLayers(ctx.store.layers);
  await ctx.rendered();
  await ctx.wait(1500);
  return ctx.store.layers;
};

const wms = (IDEE, options = {}) => new IDEE.layer.WMS({
  url: URLS.wms, name: 'AU.AdministrativeUnit', legend: 'WMS unidades administrativas', tiled: true, ...options,
});

const check = (ctx, layers, expected = 'webgl') => ctx.all(
  ctx.expectRenderer(layers, expected),
  ctx.noErrors(),
);

export default {
  id: 'raster',
  title: '4. Ráster',
  map: { center: [-420000, 4920000], zoom: 6 },
  steps: [
    {
      id: '4.1',
      text: 'WMS: teselado en WebGL; con singleTile: true sigue en Canvas. Filtros CQL, setTileLoadFunction y estilos WMS.',
      expected: 'El WMS teselado es webgl y el de imagen única canvas; ambos se ven.',
      actions: [
        {
          label: 'WMS teselado + imagen única',
          run: async (ctx) => {
            const tiled = wms(ctx.IDEE, { name: 'AU.AdministrativeUnit', legend: 'WMS teselado' });
            const single = wms(ctx.IDEE, { name: 'AU.AdministrativeBoundary', legend: 'WMS imagen única', tiled: false });
            await replace(ctx, [tiled, single]);
            return ctx.all(ctx.expectRenderer(tiled), ctx.expectRenderer(single, 'canvas'), ctx.noErrors());
          },
        },
        {
          label: 'setTileLoadFunction (registra peticiones)',
          run: async (ctx) => {
            const layer = wms(ctx.IDEE);
            await replace(ctx, layer);
            let calls = 0;
            layer.setTileLoadFunction((tile, src) => {
              calls += 1;
              // eslint-disable-next-line no-param-reassign
              tile.getImage().src = src;
            });
            ctx.map.setZoom(ctx.map.getZoom() + 1);
            await ctx.rendered();
            await ctx.wait(1500);
            return ctx.all(check(ctx, layer), { pass: calls > 0, detail: `${calls} teselas por la función` });
          },
        },
      ],
    },
    {
      id: '4.2',
      text: 'WMTS: con y sin capabilities, en WebGL.',
      expected: 'Se ve la ortofoto PNOA y la capa es webgl.',
      actions: [{
        label: 'WMTS PNOA',
        run: async (ctx) => {
          const layer = new ctx.IDEE.layer.WMTS({
            url: URLS.wmts, name: 'OI.OrthoimageCoverage', legend: 'WMTS PNOA', matrixSet: 'GoogleMapsCompatible', format: 'image/jpeg',
          });
          await replace(ctx, layer);
          return check(ctx, layer);
        },
      }],
    },
    {
      id: '4.3',
      text: 'XYZ, TMS, OSM, MBTiles y GeoPackageTile: en WebGL.',
      expected: 'Cada capa se ve igual que en Canvas y es webgl. Los datos de prueba son sintéticos: el MBTiles son teselas rojas lisas que cubren el mundo y el GeoPackageTile una cuadrícula azul claro/oscuro.',
      actions: [
        {
          label: 'XYZ / TMS / OSM',
          run: async (ctx) => {
            const { IDEE } = ctx;
            const layers = [
              new IDEE.layer.XYZ({
                url: URLS.xyzPnoa, name: 'xyz_pnoa', legend: 'XYZ PNOA',
              }, { opacity: 0.6 }),
              new IDEE.layer.TMS({
                url: URLS.tmsBase, name: 'tms_base', legend: 'TMS IGN Base',
              }, { opacity: 0.6 }),
              new IDEE.layer.OSM({ name: 'osm', legend: 'OSM' }, { opacity: 0.6 }),
            ];
            await replace(ctx, layers);
            return check(ctx, layers);
          },
        },
        {
          label: 'MBTiles',
          run: async (ctx) => {
            const response = await window.fetch(MBTILES_RASTER_URL);
            const layer = new ctx.IDEE.layer.MBTiles({ name: 'mbtiles', legend: 'MBTiles', source: response });
            await replace(ctx, layer);
            return check(ctx, layer);
          },
        },
        {
          label: 'GeoPackageTile',
          run: async (ctx) => {
            const { IDEE } = ctx;
            if (ctx.store.layers) ctx.map.removeLayers(ctx.store.layers);
            const response = await window.fetch(GPKG_RASTER_URL);
            const gpkg = new IDEE.layer.GeoPackage(response);
            const loaded = new Promise((resolve) => { gpkg.once(IDEE.evt.LOAD_LAYERS, resolve); });
            ctx.map.addGeoPackage(gpkg);
            await loaded;
            const tiles = gpkg.getLayers().filter((l) => l.type === 'GeoPackageTile');
            // Para que el siguiente caso las quite del mapa.
            ctx.store.layers = gpkg.getLayers();
            await ctx.rendered();
            return ctx.all(
              { pass: tiles.length > 0, detail: `${tiles.length} capas GeoPackageTile` },
              check(ctx, tiles),
            );
          },
        },
      ],
    },
    {
      id: '4.4',
      text: 'OSM con URL propia: las teselas cargan, sin errores de CORS.',
      expected: 'Se ven las teselas y no hay errores de CORS en la consola del navegador (F12).',
      actions: [{
        label: 'OSM url propia',
        run: async (ctx) => {
          const layer = new ctx.IDEE.layer.OSM({ url: URLS.osm, name: 'osm_url', legend: 'OSM URL propia' });
          await replace(ctx, layer);
          return check(ctx, layer);
        },
      }],
    },
    {
      id: '4.5',
      text: 'Servicio sin CORS o crossOrigin: false: cae a Canvas con aviso.',
      expected: 'La capa se ve, es canvas y hay aviso de CORS.',
      actions: [{
        label: 'XYZ crossOrigin:false',
        run: async (ctx) => {
          const layer = new ctx.IDEE.layer.XYZ({
            url: URLS.xyzPnoa, name: 'xyz_sin_cors', legend: 'XYZ sin CORS',
          }, { crossOrigin: false });
          await replace(ctx, layer);
          return ctx.all(ctx.expectRenderer(layer, 'canvas'), ctx.expectFallbackWarning(true));
        },
      }],
    },
    {
      id: '4.6',
      text: 'getData(pixel) en XYZ y TMS (lo usa mousesrs): devuelve valores.',
      how: 'Se consulta el píxel central del mapa.',
      expected: 'Devuelve un array de valores (RGBA) no nulo en ambas capas.',
      actions: [{
        label: 'getData en el centro',
        run: async (ctx) => {
          const { IDEE } = ctx;
          const xyz = new IDEE.layer.XYZ({ url: URLS.xyzPnoa, name: 'xyz_data', legend: 'XYZ' });
          const tms = new IDEE.layer.TMS({
            url: URLS.tmsBase, name: 'tms_data', legend: 'TMS',
          }, { opacity: 0.5 });
          await replace(ctx, [xyz, tms]);
          const size = ctx.map.getMapImpl().getSize();
          const pixel = [size[0] / 2, size[1] / 2];
          const read = (l) => {
            const data = l.getImpl().getData?.(pixel);
            return data ? Array.from(data).slice(0, 4).join(',') : null;
          };
          const values = [read(xyz), read(tms)];
          return { pass: values.every(Boolean), detail: `XYZ=[${values[0]}] TMS=[${values[1]}]` };
        },
      }],
    },
    {
      id: '4.7',
      text: 'Autorefresco ráster y opacidad.',
      expected: 'La capa se recarga cada 5 s sin parpadeo raro y la opacidad cambia.',
      actions: [
        {
          label: 'XYZ refresco 5 s (15 s)',
          run: async (ctx) => {
            const layer = new ctx.IDEE.layer.XYZ({
              url: URLS.xyzPnoa, name: 'xyz_refresh', legend: 'XYZ refresh', refreshInterval: 5000,
            });
            await replace(ctx, layer);
            await ctx.wait(15000);
            layer.stopAutoRefresh();
            return check(ctx, layer);
          },
        },
        {
          label: 'Opacidad 0.3 / 1',
          run: async (ctx) => {
            const layers = ctx.store.layers || [];
            layers.forEach((l) => l.setOpacity(0.3));
            await ctx.wait(1500);
            layers.forEach((l) => l.setOpacity(1));
            return check(ctx, layers);
          },
        },
      ],
    },
    {
      id: '4.8',
      text: 'GeoTIFF: sin cambios respecto a antes.',
      how: 'El botón centra el mapa en la imagen (escena Sentinel-2 sobre Sudán).',
      expected: 'El GeoTIFF se ve igual que antes (siempre WebGL).',
      actions: [{
        label: 'GeoTIFF',
        run: async (ctx) => {
          const layer = new ctx.IDEE.layer.GeoTIFF({
            url: 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/36/Q/WD/2020/7/S2A_36QWD_20200701_0_L2A/TCI.tif',
            name: 'geotiff',
            legend: 'GeoTIFF Sentinel',
          });
          await replace(ctx, layer);
          const view = await layer.getImpl().getLayer().getSource().getView();
          const { code } = ctx.map.getProjection();
          ctx.map.setBbox(ol.proj.transformExtent(view.extent, view.projection, code));
          await ctx.rendered();
          await ctx.wait(1500);
          return ctx.noErrors();
        },
      }],
    },
  ],
};
