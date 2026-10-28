/**
 * Sección 5 del guion: plugins. Una página por grupo de plugins; cada una carga
 * los plugins desde su dist (src/plugins/<plugin>/dist), que debe estar compilado.
 */
import {
  URLS, POLYGONS, MIXED, geojson,
} from './data';

/** Añade un plugin; si falla, lo registra en la consola sin bloquear la sección. */
const addPlugin = (ctx, name, factory) => {
  try {
    ctx.map.addPlugin(factory());
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`No se pudo crear ${name}: ${e.message}`);
  }
};

/** Lista los renderers de todas las capas del mapa. */
const layersState = {
  label: 'Estado de capas',
  run: (ctx) => {
    // Sin las capas internas de la API (__draw__...).
    const layers = ctx.map.getLayers().filter((l) => l.getRenderer && !String(l.name).startsWith('__'));
    return {
      pass: layers.length > 0,
      detail: layers.map((l) => `${l.name || l.type}=${l.getRenderer()}`).join(', '),
    };
  },
};

/** Comprueba que no queden recortes clip-path en los canvas WebGL. */
const residualClip = {
  label: 'Comprobar recorte residual',
  run: () => {
    const clipped = Array.from(document.querySelectorAll('canvas.ol-layer'))
      .filter((c) => c.style.clipPath && c.style.clipPath !== 'none');
    return { pass: clipped.length === 0, detail: `${clipped.length} canvas WebGL con clip-path` };
  },
};

/** Añade capas con estilos Generic, Category y Choropleth (estilos aplicados ya en el mapa). */
const addThematicLayers = (ctx) => {
  const { IDEE } = ctx;
  const generic = geojson(IDEE, 'generic', MIXED);
  const category = geojson(IDEE, 'category', POLYGONS);
  const choropleth = geojson(IDEE, 'choropleth', POLYGONS);
  ctx.map.addLayers([generic, category, choropleth]);
  generic.setStyle(new IDEE.style.Generic({
    point: { radius: 6, fill: { color: '#f59e0b' } },
    line: { stroke: { color: '#7c3aed', width: 3 } },
    polygon: { fill: { color: '#16a34a', opacity: 0.4 }, stroke: { color: '#14532d', width: 2 } },
  }));
  category.setStyle(new IDEE.style.Category('tipo', {
    a: new IDEE.style.Generic({ polygon: { fill: { color: '#e11d48', opacity: 1 } } }),
    b: new IDEE.style.Generic({ polygon: { fill: { color: '#2563eb', opacity: 1 } } }),
    other: new IDEE.style.Generic({ polygon: { fill: { color: '#9ca3af', opacity: 1 } } }),
  }));
  choropleth.setStyle(new IDEE.style.Choropleth('valor'));
  choropleth.setVisible(false);
};

const LIST_LAYERS = [
  'XYZ*PNOA-MA*https://tms-pnoa-ma.idee.es/1.0.0/pnoa-ma/{z}/{x}/{-y}.jpeg*true*true',
  'TMS*IGNBase*https://tms-ign-base.idee.es/1.0.0/IGNBaseTodo/{z}/{x}/{-y}.jpeg*true*false*17***anonymous',
  'WMTS*https://www.ign.es/wmts/pnoa-ma?*OI.OrthoimageCoverage*GoogleMapsCompatible*PNOA WMTS*true*image/jpeg*true*true*true',
  'WMS*Unidades administrativas*https://www.ign.es/wms-inspire/unidades-administrativas?*AU.AdministrativeUnit*true',
];

export const comparators = {
  id: 'plugins-comparators',
  title: '5.1 Plugins: Comparators',
  plugins: ['comparators'],
  map: { center: [-420000, 4920000], zoom: 7 },
  setup: (ctx) => {
    const { IDEE } = ctx;
    ctx.plugin = new IDEE.plugin.Comparators({
      position: 'TR',
      collapsed: false,
      listLayers: LIST_LAYERS,
      // Atajos de teclado (Ctrl+Shift+Enter congela la transparencia).
      enabledKeyFunctions: true,
      transparencyParams: {
        radius: 80, maxRadius: 200, minRadius: 20,
      },
      lyrcompareParams: {
        staticDivision: 2,
        defaultLyrA: 0,
        defaultLyrB: 1,
        defaultLyrC: 2,
        defaultLyrD: 3,
        opacityVal: 100,
      },
      mirrorpanelParams: {
        showCursors: true, principalMap: true, modeVizTypes: [0, 1, 2, 3, 4, 5],
      },
      windowsyncParams: false,
    });
    ctx.map.addPlugin(ctx.plugin);
  },
  steps: [
    {
      id: '5.1.1',
      text: 'Mirrorpanel.',
      how: 'Abre el comparador espejo y prueba 2 y 4 mapas con capas distintas.',
      expected: 'Las capas se ven en todos los mapas y se sincronizan al mover.',
      actions: [layersState],
    },
    {
      id: '5.1.2',
      text: 'Lyrcompare en modos 1, 2 y 3, con división estática y dinámica. El recorte coincide con la línea divisoria.',
      how: 'Abre el comparador de cortina; cambia entre modos y entre división estática/dinámica; mueve las líneas.',
      expected: 'Cada capa se recorta exactamente por la línea divisoria, sin huecos ni solapes.',
      actions: [layersState],
    },
    {
      id: '5.1.3',
      text: 'Transparencia: cambiar el radio y congelar.',
      how: 'Abre la transparencia, mueve el ratón, cambia el radio (Shift + rueda o control) y congela (clic/tecla F).',
      expected: 'La capa se ve solo dentro del círculo, que sigue al ratón y cambia de tamaño. Limitación conocida: en WebGL no se dibuja el aro del círculo.',
      actions: [layersState],
    },
    {
      id: '5.1.4',
      text: 'Al desactivar, las capas WebGL se ven completas, sin recorte residual.',
      how: 'Desactiva cortina y transparencia y pulsa el botón.',
      expected: 'Las capas se ven completas y el botón no encuentra canvas con clip-path.',
      actions: [residualClip],
    },
    {
      id: '5.1.5',
      text: 'Probar con capas WebGL, Canvas y mezcladas.',
      how: 'Repite 5.1.2–5.1.4 en modo Canvas (enlace "cambiar a canvas"). En modo WebGL el WMS de imagen única queda en Canvas, lo que ya da una mezcla.',
      expected: 'Mismo comportamiento en los tres casos.',
      actions: [layersState],
    },
  ],
};

export const print = {
  id: 'plugins-print',
  title: '5.2 Plugins: PrintViewManagement',
  plugins: ['printviewmanagement'],
  map: { center: [-450000, 4900000], zoom: 6 },
  setup: (ctx) => {
    const { IDEE } = ctx;
    addThematicLayers(ctx);
    ctx.map.addLayers(new IDEE.layer.MVT({
      url: URLS.mvt, name: 'sendero_gr', legend: 'MVT senderos', visibility: false,
    }));
    ctx.map.addPlugin(new IDEE.plugin.PrintViewManagement({
      position: 'TR', collapsed: false, isDraggable: true, georefImageEpsg: true, georefImage: true, printermap: true,
    }));
  },
  steps: [
    {
      id: '5.2.1',
      text: 'Impresión Mapfish con capas vectoriales WebGL: los estilos impresos coinciden con los del mapa (Generic, Category, Choropleth).',
      how: 'Imprime en PDF; luego oculta "category", muestra "choropleth" y vuelve a imprimir.',
      expected: 'Los colores y grosores del PDF coinciden con el mapa.',
      actions: [layersState],
    },
    {
      id: '5.2.2',
      text: 'MVT.',
      how: 'Muestra la capa MVT (consola: map.getMVT()[0].setVisible(true)) e imprime.',
      expected: 'Los senderos aparecen en el PDF.',
      actions: [{
        label: 'Mostrar MVT',
        run: (ctx) => {
          const layer = ctx.map.getMVT()[0];
          layer.setVisible(true);
          return ctx.expectRenderer(layer);
        },
      }],
    },
    {
      id: '5.2.3',
      text: 'Georreferenciación de imagen con capas WebGL, incluida su opacidad y la escala por DPI.',
      how: 'Pon opacidad 0.5 a "category" y exporta la imagen georreferenciada a 72 y 300 DPI.',
      expected: 'La imagen contiene las capas WebGL con su opacidad, a la escala correcta.',
      actions: [{
        label: 'Opacidad 0.5 en category',
        run: (ctx) => {
          ctx.map.getLayers().find((l) => l.name === 'category')?.setOpacity(0.5);
          return 'opacidad aplicada';
        },
      }],
    },
    {
      id: '5.2.4',
      text: 'Plantilla personalizada (templateCustomizer).',
      how: 'Abre la personalización de plantilla y genera la vista previa / descarga.',
      expected: 'La imagen del mapa de la plantilla incluye las capas WebGL (no sale en blanco).',
    },
  ],
};

export const stereoscopic = {
  id: 'plugins-stereoscopic',
  title: '5.3 Plugins: Stereoscopic',
  plugins: ['stereoscopic'],
  map: { center: [-420000, 4920000], zoom: 9 },
  setup: (ctx) => {
    const { IDEE } = ctx;
    ctx.map.addLayers(new IDEE.layer.XYZ({
      url: URLS.xyzPnoa, name: 'pnoa', legend: 'PNOA', isBase: true,
    }));
    ctx.map.addPlugin(new IDEE.plugin.Stereoscopic({
      position: 'TL', collapsible: true, collapsed: false, orbitControls: false, anaglyphActive: true, defaultAnaglyphActive: true, maxMaginification: 50,
    }));
  },
  steps: [{
    id: '5.3.1',
    text: 'Con capa base WebGL, la textura no sale en negro ni vacía tras mover el mapa.',
    how: 'Activa la vista estereoscópica, mueve el mapa y vuelve a activarla.',
    expected: 'La textura 3D muestra la ortofoto.',
    actions: [layersState],
  }],
};

export const wfst = {
  id: 'plugins-wfst',
  title: '5.4 Plugins: WFSTControls',
  plugins: ['wfstcontrols'],
  map: { center: [-450000, 4900000], zoom: 6 },
  setup: (ctx) => {
    const { IDEE } = ctx;
    const wfs = new IDEE.layer.WFS({
      url: 'https://hcsigc-geoserver-sigc.desarrollo.guadaltel.es/geoserver/Global/wfs?',
      legend: 'capa wfs',
      name: 'superadmin_mispuntos_1758802353451',
      geometry: 'LINE',
      extract: false,
    });
    wfs.setStyle(new IDEE.style.Generic({ line: { stroke: { color: '#dc2626', width: 4 } } }));
    ctx.map.addWFS(wfs);
    ctx.map.addPlugin(new IDEE.plugin.WFSTControls({ features: 'drawfeature,modifyfeature,deletefeature,editattribute', position: 'BR' }));
  },
  steps: [{
    id: '5.4.1',
    text: 'Dibujar y modificar sobre una capa WFS en WebGL; el estilo de edición es el de la capa.',
    how: 'Usa dibujar y modificar (sin guardar). Requiere acceso al GeoServer de pruebas del plugin.',
    expected: 'Las líneas nuevas y las modificadas se ven en rojo, como la capa. Sin errores.',
    actions: [layersState],
  }],
};

export const viewers = {
  id: 'plugins-viewers',
  title: '5.5 Plugins: Magnify, OverviewMap y LayerSwitcher',
  plugins: ['magnify', 'layerswitcher'],
  map: { center: [-420000, 4920000], zoom: 7, controls: ['overviewmap', 'scale'] },
  setup: (ctx) => {
    const { IDEE } = ctx;
    ctx.map.addLayers([
      new IDEE.layer.XYZ({
        url: URLS.xyzPnoa, name: 'pnoa', legend: 'PNOA',
      }, { opacity: 0.7 }),
    ]);
    addThematicLayers(ctx);
    addPlugin(ctx, 'Magnify', () => new IDEE.plugin.Magnify({
      position: 'TL', zoomMax: 19, zoom: 3, layers: 'pnoa',
    }));
    addPlugin(ctx, 'Layerswitcher', () => new IDEE.plugin.Layerswitcher({ position: 'TR', collapsed: false }));
  },
  steps: [
    {
      id: '5.5.1',
      text: 'Magnify: la lupa muestra las capas WebGL y la capa principal sigue viéndose en el mapa.',
      expected: 'La lupa muestra el PNOA ampliado y el mapa principal no pierde la capa.',
      actions: [layersState],
    },
    {
      id: '5.5.2',
      text: 'OverviewMap: con capa base WebGL se ven el mapa principal y el de situación.',
      expected: 'El mapa de situación (esquina) muestra la base y el principal también.',
    },
    {
      id: '5.5.3',
      text: 'LayerSwitcher: añadir y quitar capas WebGL, opacidad, orden, leyendas y grupos.',
      how: 'Desde el layerswitcher: cambia opacidad, orden y visibilidad, elimina "generic" y añade un servicio (p. ej. WMTS PNOA).',
      expected: 'Todo se refleja en el mapa; las leyendas de Category/Choropleth se ven.',
      actions: [layersState, {
        label: 'Añadir grupo',
        run: (ctx) => {
          const { IDEE } = ctx;
          const group = new IDEE.layer.LayerGroup({
            name: 'grupo', legend: 'Grupo WebGL', layers: [geojson(IDEE, 'grupo_pol', POLYGONS)],
          });
          ctx.map.addLayers(group);
          return 'grupo añadido';
        },
      }],
    },
  ],
};

export const editing = {
  id: 'plugins-editing',
  title: '5.6 Plugins: VectorsManagement, Incicarto, QueryAttributes, InfoCoordinates, MouseSRS',
  plugins: ['vectorsmanagement', 'incicarto', 'queryattributes', 'infocoordinates', 'mousesrs'],
  map: { center: [-450000, 4900000], zoom: 6 },
  setup: (ctx) => {
    const { IDEE } = ctx;
    ctx.map.addLayers(geojson(IDEE, 'geojson_local', MIXED));
    const add = (name, factory) => addPlugin(ctx, name, factory);
    add('VectorsManagement', () => new IDEE.plugin.VectorsManagement({ position: 'TL', collapsed: true }));
    add('Incicarto', () => new IDEE.plugin.Incicarto({
      position: 'TR', collapsed: true, interfazmode: 'simple', buzones: [{ name: 'prueba', email: 'prueba@example.com' }],
    }));
    add('QueryAttributes', () => new IDEE.plugin.QueryAttributes({
      position: 'TL',
      collapsed: true,
      configuration: {
        layer: 'geojson_local',
        pk: 'nombre',
        initialSort: { name: 'nombre', dir: 'asc' },
        columns: [
          {
            name: 'nombre', alias: 'Nombre', visible: true, searchable: true, showpanelinfo: true, align: 'left', type: 'string',
          },
          {
            name: 'tipo', alias: 'Tipo', visible: true, searchable: true, showpanelinfo: true, align: 'left', type: 'string',
          },
          {
            name: 'valor', alias: 'Valor', visible: true, searchable: false, showpanelinfo: true, align: 'right', type: 'string',
          },
        ],
      },
    }));
    add('Infocoordinates', () => new IDEE.plugin.Infocoordinates({ position: 'TR' }));
    add('MouseSRS', () => new IDEE.plugin.MouseSRS({ position: 'BL' }));
  },
  steps: [
    {
      id: '5.6.1',
      text: 'VectorsManagement e Incicarto: selección y edición sobre capas WebGL; si la edición asigna estilo a una feature, cae a Canvas sin perder el estilo.',
      how: 'En VectorsManagement selecciona geojson_local, selecciona objetos, cambia el estilo de uno y edita geometría. En Incicarto, selecciona un objeto.',
      expected: 'La selección funciona; tras cambiar el estilo de un objeto la capa pasa a Canvas (aviso) y conserva el estilo del resto.',
      actions: [layersState],
    },
    {
      id: '5.6.2',
      text: 'QueryAttributes e InfoCoordinates: la selección por píxel funciona sobre capas WebGL.',
      how: 'En QueryAttributes abre la tabla y pulsa un registro / clic en el mapa. En InfoCoordinates haz clic sobre un objeto.',
      expected: 'Se resalta/muestra el objeto correcto.',
      actions: [layersState],
    },
    {
      id: '5.6.3',
      text: 'MouseSRS: getData de capas ráster WebGL.',
      how: 'Mueve el ratón por el mapa con la barra de coordenadas visible.',
      expected: 'Coordenadas correctas y sin errores en consola.',
    },
  ],
};
