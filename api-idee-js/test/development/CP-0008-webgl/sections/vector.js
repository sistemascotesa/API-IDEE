/**
 * Sección 1 del guion: capas vectoriales.
 */
import {
  DATA_URL, KMZ_URL, URLS, MIXED, POLYGONS, geojson, randomPoints,
} from './data';

const vectorLayers = (ctx) => ctx.store.vector || [];

const createVectorLayers = (ctx) => {
  const { IDEE } = ctx;
  const local = geojson(IDEE, 'geojson_local', MIXED);
  const wfs = new IDEE.layer.WFS({
    url: URLS.wfs, name: 'RED_REGENTE', legend: 'WFS RED_REGENTE', geometry: 'POINT', extract: true,
  });
  const ogc = new IDEE.layer.OGCAPIFeatures({
    url: URLS.ogcapi, name: 'falls', legend: 'OGCAPIFeatures falls', limit: 50, extract: true,
  });
  const dataidee = new IDEE.layer.DataIDEE({
    url: URLS.dataidee, name: 'nuc', legend: 'DataIDEE nuc', limit: 50,
  });
  const kml = new IDEE.layer.KML({
    url: `${DATA_URL}/puntos.kml`, name: 'kml_sin_estilos', legend: 'KML extractStyles:false', extract: true,
  }, { extractStyles: false });
  const kmz = new IDEE.layer.KMZ({
    url: KMZ_URL, name: 'kmz_sin_estilos', legend: 'KMZ extractStyles:false', extract: true,
  }, { extractStyles: false });
  const gpx = new IDEE.layer.GPX({ url: `${DATA_URL}/ruta.gpx`, name: 'gpx', legend: 'GPX' });
  const kmlStyled = new IDEE.layer.KML({
    url: `${DATA_URL}/puntos.kml`, name: 'kml_con_estilos', legend: 'KML extractStyles:true', extract: true,
  });
  ctx.store.vector = [local, wfs, ogc, dataidee, kml, kmz, gpx];
  ctx.store.kmlStyled = kmlStyled;
  return [...ctx.store.vector, kmlStyled];
};

export default {
  id: 'vector',
  title: '1. Capas vectoriales',
  intro: 'Pulsa primero "Cargar capas" del punto 1.1. Los demás puntos actúan sobre esas capas.',
  map: { center: [-450000, 4900000], zoom: 6 },
  steps: [
    {
      id: '1.1',
      text: 'Se pintan y getRenderer() devuelve \'webgl\'. Excepción: KML con extractStyles cae a Canvas con aviso.',
      how: 'Carga GeoJSON local, WFS, OGCAPIFeatures, DataIDEE, KML y KMZ sin estilos, GPX y un KML con estilos propios.',
      expected: 'Todas las capas visibles. En WebGL: todas \'webgl\' salvo kml_con_estilos (\'canvas\' + aviso).',
      actions: [{
        label: 'Cargar capas',
        run: async (ctx) => {
          ctx.map.removeLayers([...vectorLayers(ctx), ctx.store.kmlStyled].filter(Boolean));
          ctx.map.addLayers(createVectorLayers(ctx));
          await ctx.rendered();
          await ctx.wait(2500);
          return ctx.all(
            ctx.expectRenderer(vectorLayers(ctx), 'webgl'),
            ctx.expectRenderer(ctx.store.kmlStyled, 'canvas'),
            ctx.expectFallbackWarning(true),
            ctx.noErrors(),
          );
        },
      }],
    },
    {
      id: '1.2',
      text: 'Popups con extract: true, al hacer clic y con infoEventType: \'hover\'.',
      how: 'Haz clic en puntos, líneas y polígonos de geojson_local, WFS y KML. Después crea la capa hover y pasa el ratón por encima.',
      expected: 'El popup muestra los atributos del objeto pulsado, igual que en Canvas.',
      actions: [{
        label: 'Añadir capa hover',
        run: (ctx) => {
          ctx.map.removeLayers(ctx.store.hover || []);
          ctx.store.hover = geojson(ctx.IDEE, 'geojson_hover', POLYGONS, { infoEventType: 'hover' });
          ctx.map.addLayers(ctx.store.hover);
          return ctx.expectRenderer(ctx.store.hover);
        },
      }],
    },
    {
      id: '1.3',
      text: 'Opacidad, visibilidad, setZIndex, zoom y escala mínimos/máximos, y maxExtent.',
      how: 'Usa cada botón y comprueba el mapa. minZoom 8 debe ocultar las capas al zoom inicial (6).',
      expected: 'Cada cambio se refleja igual que en Canvas y las capas siguen en el mismo renderer.',
      actions: [
        ['Opacidad 0.3', (l) => l.setOpacity(0.3)],
        ['Opacidad 1', (l) => l.setOpacity(1)],
        ['Ocultar', (l) => l.setVisible(false)],
        ['Mostrar', (l) => l.setVisible(true)],
        ['minZoom 8', (l) => l.setMinZoom(8)],
        ['minZoom 0', (l) => l.setMinZoom(0)],
        ['maxExtent norte', (l) => l.setMaxExtent([-1100000, 4900000, 400000, 5400000])],
        ['Quitar maxExtent', (l) => l.resetMaxExtent()],
      ].map(([label, fn]) => ({
        label,
        run: async (ctx) => {
          vectorLayers(ctx).forEach(fn);
          await ctx.rendered();
          return ctx.all(ctx.expectRenderer(vectorLayers(ctx)), ctx.noErrors());
        },
      })).concat([{
        label: 'geojson_local arriba (z 999)',
        run: async (ctx) => {
          vectorLayers(ctx)[0].setZIndex(999);
          await ctx.rendered();
          return `zIndex=${vectorLayers(ctx)[0].getZIndex()}`;
        },
      }]),
    },
    {
      id: '1.4',
      text: 'Filtros (setFilter) y getFeaturesExtent.',
      how: 'Filtra geojson_local por tipo = \'a\' y centra el mapa en la extensión de sus objetos.',
      expected: 'Solo se ven los objetos de tipo a; el mapa encuadra esos objetos. Al quitar el filtro vuelven todos.',
      actions: [
        {
          label: 'Filtrar tipo = a y encuadrar',
          run: async (ctx) => {
            const layer = vectorLayers(ctx)[0];
            const total = layer.getFeatures(true).length;
            layer.setFilter(ctx.IDEE.filter.EQUAL('tipo', 'a'));
            const visible = layer.getFeatures().length;
            ctx.map.setBbox(layer.getFeaturesExtent());
            await ctx.rendered();
            return ctx.all(
              { pass: visible > 0 && visible < total, detail: `${visible} de ${total} objetos` },
              ctx.expectRenderer(layer),
            );
          },
        },
        {
          label: 'Quitar filtro',
          run: (ctx) => {
            vectorLayers(ctx)[0].removeFilter();
            return `${vectorLayers(ctx)[0].getFeatures().length} objetos`;
          },
        },
      ],
    },
    {
      id: '1.5',
      text: 'Capa dentro de un LayerGroup: se pinta y respeta el orden. Si cae a Canvas, sigue dentro del grupo.',
      how: 'Crea un grupo con una capa de polígonos (WebGL) y el KML con estilos (cae a Canvas).',
      expected: 'Ambas capas se ven dentro del grupo; el KML queda en Canvas y sigue perteneciendo al grupo.',
      actions: [{
        label: 'Crear grupo',
        run: async (ctx) => {
          const { IDEE } = ctx;
          if (ctx.store.group) ctx.map.removeLayers(ctx.store.group);
          const pols = geojson(IDEE, 'grupo_poligonos', POLYGONS);
          const kml = new IDEE.layer.KML({ url: `${DATA_URL}/puntos.kml`, name: 'grupo_kml', extract: true });
          ctx.store.group = new IDEE.layer.LayerGroup({ name: 'grupo_webgl', legend: 'Grupo WebGL', layers: [pols, kml] });
          ctx.map.addLayers(ctx.store.group);
          await ctx.rendered();
          await ctx.wait(1000);
          const olGroup = ctx.store.group.getImpl().getLayer();
          const olKml = kml.getImpl().getLayer();
          const inGroup = olKml && olGroup.getLayers().getArray().includes(olKml);
          return ctx.all(
            ctx.expectRenderer(pols),
            ctx.expectRenderer(kml, 'canvas'),
            { pass: !!inGroup, detail: inGroup ? 'el KML sigue en el grupo' : 'el KML NO está en el grupo' },
          );
        },
      }],
    },
    {
      id: '1.6',
      text: 'Quitar la capa y volver a añadirla: sin errores y se pinta igual.',
      expected: 'La capa desaparece y vuelve a aparecer igual; sin errores en consola.',
      actions: [{
        label: 'Quitar y añadir geojson_local',
        run: async (ctx) => {
          const layer = vectorLayers(ctx)[0];
          ctx.map.removeLayers(layer);
          await ctx.rendered();
          ctx.map.addLayers(layer);
          await ctx.rendered();
          return ctx.all(ctx.expectRenderer(layer), ctx.noErrors());
        },
      }],
    },
    {
      id: '1.7',
      text: 'Autorefresco (refreshInterval) en GeoJSON, KML y WFS.',
      how: 'Crea capas con refreshInterval de 5 s y observa durante 15 s la consola y el mapa.',
      expected: 'Las capas se recargan sin parpadeos raros, sin errores y conservan el renderer.',
      actions: [{
        label: 'Crear capas con autorefresco',
        run: async (ctx) => {
          const { IDEE } = ctx;
          ctx.map.removeLayers(ctx.store.refresh || []);
          ctx.store.refresh = [
            new IDEE.layer.GeoJSON({ url: `${DATA_URL}/puntos.geojson`, name: 'geojson_refresh', refreshInterval: 5000 }),
            new IDEE.layer.KML({ url: `${DATA_URL}/puntos.kml`, name: 'kml_refresh', refreshInterval: 5000 }, { extractStyles: false }),
            new IDEE.layer.WFS({
              url: URLS.wfs, name: 'RED_REGENTE', legend: 'WFS refresh', geometry: 'POINT', refreshInterval: 5000,
            }),
          ];
          ctx.map.addLayers(ctx.store.refresh);
          await ctx.wait(15000);
          return ctx.all(ctx.expectRenderer(ctx.store.refresh), ctx.noErrors());
        },
      }, {
        label: 'Parar autorefresco',
        run: (ctx) => {
          (ctx.store.refresh || []).forEach((l) => l.stopAutoRefresh());
          return 'parado';
        },
      }],
    },
    {
      id: '1.8',
      text: 'Cambio de proyección del mapa con la capa cargada.',
      expected: 'Las capas se reproyectan y siguen visibles; renderer igual que antes del cambio.',
      actions: [
        {
          label: 'EPSG:4326',
          run: async (ctx) => {
            ctx.map.setProjection('EPSG:4326*d');
            await ctx.rendered();
            await ctx.wait(1500);
            return ctx.all(ctx.expectRenderer(vectorLayers(ctx)), ctx.noErrors());
          },
        },
        {
          label: 'EPSG:3857',
          run: async (ctx) => {
            ctx.map.setProjection('EPSG:3857*m');
            await ctx.rendered();
            return ctx.all(ctx.expectRenderer(vectorLayers(ctx)), ctx.noErrors());
          },
        },
      ],
    },
    {
      id: '1.9',
      text: 'Añadir y eliminar features en caliente (addFeatures / removeFeatures).',
      expected: 'Aparecen 50 puntos nuevos repartidos por la península (sobre geojson_local) y luego desaparecen; la capa sigue en WebGL.',
      actions: [
        {
          label: 'Añadir 50 puntos',
          run: async (ctx) => {
            const { IDEE } = ctx;
            const layer = vectorLayers(ctx)[0];
            // IDEE.Feature espera las coordenadas en la proyección del mapa.
            const projection = ctx.map.getProjection().code;
            ctx.store.added = randomPoints(50, 7).features.map((f) => new IDEE.Feature(`n${f.id}`, {
              ...f,
              geometry: {
                ...f.geometry,
                coordinates: ol.proj.fromLonLat(f.geometry.coordinates, projection),
              },
            }));
            layer.addFeatures(ctx.store.added);
            await ctx.rendered();
            return ctx.all(ctx.expectRenderer(layer), { pass: true, detail: `${layer.getFeatures().length} objetos` });
          },
        },
        {
          label: 'Eliminarlos',
          run: async (ctx) => {
            const layer = vectorLayers(ctx)[0];
            layer.removeFeatures(ctx.store.added || []);
            await ctx.rendered();
            return ctx.all(ctx.expectRenderer(layer), { pass: true, detail: `${layer.getFeatures().length} objetos` });
          },
        },
      ],
    },
  ],
};
