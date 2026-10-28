/**
 * Sección 2 del guion: estilos vectoriales.
 * Cada acción crea una capa nueva (la anterior se elimina) para que el renderer
 * y los avisos sean solo de ese estilo.
 */
import {
  POLYGONS, LINES, MIXED, geojson, randomPoints,
} from './data';

const ICON_SVG = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="10" fill="#7c3aed" stroke="#fff" stroke-width="3"/></svg>')}`;

/** Sustituye la capa de prueba de la sección por una nueva. */
const replaceLayer = async (ctx, layer, style) => {
  if (ctx.store.layer) ctx.map.removeLayers(ctx.store.layer);
  ctx.store.layer = layer;
  ctx.map.addLayers(layer);
  if (style) layer.setStyle(style);
  await ctx.rendered();
  return layer;
};

const fresh = (ctx, source = MIXED, name = 'estilos') => geojson(ctx.IDEE, name, source);

/** Acción que crea una capa con un estilo y comprueba renderer y aviso. */
const styleAction = (label, makeStyle, { source = MIXED, expected = 'webgl' } = {}) => ({
  label,
  run: async (ctx) => {
    const layer = await replaceLayer(ctx, fresh(ctx, source), makeStyle(ctx.IDEE));
    return ctx.all(
      ctx.expectRenderer(layer, expected),
      ctx.expectFallbackWarning(expected === 'canvas'),
      ctx.noErrors(),
    );
  },
});

const categories = (IDEE) => ({
  a: new IDEE.style.Generic({ polygon: { fill: { color: '#e11d48', opacity: 1 } }, point: { radius: 6, fill: { color: '#e11d48' } }, line: { stroke: { color: '#e11d48', width: 4 } } }),
  b: new IDEE.style.Generic({ polygon: { fill: { color: '#2563eb', opacity: 1 } }, point: { radius: 6, fill: { color: '#2563eb' } }, line: { stroke: { color: '#2563eb', width: 4 } } }),
  other: new IDEE.style.Generic({ polygon: { fill: { color: '#9ca3af', opacity: 1 } }, point: { radius: 4, fill: { color: '#9ca3af' } }, line: { stroke: { color: '#9ca3af', width: 2 } } }),
});

export default {
  id: 'styles',
  title: '2. Estilos vectoriales',
  intro: 'Cada botón crea una capa nueva con el estilo indicado. Compara a simple vista con el modo Canvas.',
  map: { center: [-450000, 4900000], zoom: 6 },
  steps: [
    {
      id: '2.1',
      text: 'Generic: punto (círculo e icono, incluido un SVG), línea (trazo, relleno y linedash) y polígono; la capa sigue en WebGL.',
      expected: 'Se pinta el estilo indicado en cada caso y la capa sigue en WebGL, sin aviso.',
      actions: [
        styleAction('Punto círculo', (IDEE) => new IDEE.style.Generic({
          point: {
            radius: 8, fill: { color: '#f59e0b', opacity: 0.8 }, stroke: { color: '#000', width: 2 },
          },
        }), { source: randomPoints(30) }),
        styleAction('Punto icono SVG', (IDEE) => new IDEE.style.Generic({
          point: { icon: { src: ICON_SVG, scale: 1 } },
        }), { source: randomPoints(30) }),
        styleAction('Línea con relleno y linedash', (IDEE) => new IDEE.style.Generic({
          line: { stroke: { color: '#111827', width: 8, linedash: [12, 8] }, fill: { color: '#fde047', width: 3 } },
        }), { source: LINES }),
        styleAction('Polígono', (IDEE) => new IDEE.style.Generic({
          polygon: { fill: { color: '#16a34a', opacity: 0.5 }, stroke: { color: '#14532d', width: 3 } },
        }), { source: POLYGONS }),
      ],
    },
    {
      id: '2.2',
      text: 'Generic con atributos: valores \'{{atributo}}\' en color, radio y opacidad, en WebGL.',
      expected: 'Cada punto/polígono toma el color de su atributo "color" y el radio de "radio".',
      actions: [
        styleAction('Puntos {{color}} / {{radio}}', (IDEE) => new IDEE.style.Generic({
          point: { radius: '{{radio}}', fill: { color: '{{color}}', opacity: 1 } },
        }), { source: randomPoints(60) }),
        styleAction('Polígonos {{color}}', (IDEE) => new IDEE.style.Generic({
          polygon: { fill: { color: '{{color}}', opacity: 1 }, stroke: { color: '#000', width: 1 } },
        }), { source: POLYGONS }),
      ],
    },
    {
      id: '2.3',
      text: 'style.set(...) en caliente: la capa se repinta en WebGL.',
      expected: 'Los polígonos pasan a rojo sin recargar; la capa sigue en WebGL.',
      actions: [{
        label: 'Crear y cambiar a rojo',
        run: async (ctx) => {
          const style = new ctx.IDEE.style.Generic({ polygon: { fill: { color: '#2563eb', opacity: 1 } } });
          const layer = await replaceLayer(ctx, fresh(ctx, POLYGONS), style);
          await ctx.wait(800);
          style.set('polygon.fill.color', '#dc2626');
          await ctx.rendered();
          return ctx.all(ctx.expectRenderer(layer), ctx.expectFallbackWarning(false));
        },
      }],
    },
    {
      id: '2.4',
      text: 'Etiquetas (label), patrones, icon.form y funciones JS como valor: cae a Canvas con aviso y se ve igual que antes.',
      expected: 'Cada caso cae a Canvas con aviso y se ve correctamente (etiqueta, patrón, forma, color calculado).',
      actions: [
        styleAction('label', (IDEE) => new IDEE.style.Generic({
          polygon: { fill: { color: '#93c5fd' }, label: { text: '{{nombre}}', font: 'bold 12px sans-serif' } },
        }), { source: POLYGONS, expected: 'canvas' }),
        styleAction('patrón', (IDEE) => new IDEE.style.Generic({
          polygon: { fill: { color: '#dc2626', opacity: 1, pattern: { name: 'brick', scale: 2, color: '#dc2626' } } },
        }), { source: POLYGONS, expected: 'canvas' }),
        styleAction('icon.form', (IDEE) => new IDEE.style.Generic({
          point: {
            icon: {
              form: IDEE.style.form.CIRCLE, class: 'g-cartografia-alerta', fontsize: 0.5, radius: 15, color: '#fff', fill: '#dc2626',
            },
          },
        }), { source: randomPoints(20), expected: 'canvas' }),
        styleAction('función JS', (IDEE) => new IDEE.style.Generic({
          polygon: { fill: { color: (feature) => (feature.getAttribute('valor') > 40 ? '#dc2626' : '#16a34a') } },
        }), { source: POLYGONS, expected: 'canvas' }),
      ],
    },
    {
      id: '2.5',
      text: 'IDEE.Feature con estilo propio en una capa WebGL: la capa cae a Canvas y el resto de features conserva el estilo de capa.',
      expected: 'Un polígono pasa a negro; el resto mantiene el verde de la capa. La capa queda en Canvas con aviso.',
      actions: [{
        label: 'Asignar estilo a un objeto',
        run: async (ctx) => {
          const { IDEE } = ctx;
          const layer = await replaceLayer(ctx, fresh(ctx, POLYGONS), new IDEE.style.Generic({
            polygon: { fill: { color: '#16a34a', opacity: 1 } },
          }));
          layer.getFeatures()[0].setStyle(new IDEE.style.Generic({ polygon: { fill: { color: '#000', opacity: 1 } } }));
          await ctx.rendered();
          return ctx.all(ctx.expectRenderer(layer, 'canvas'), ctx.expectFallbackWarning(true));
        },
      }],
    },
    {
      id: '2.6',
      text: 'Category: valores texto y numéricos en WebGL; \'other\' para valores no listados; setCategories repinta.',
      expected: 'a rojo, b azul, resto gris. Por valor: 5 rojo, 12 azul, resto gris. Tras setCategories, a pasa a amarillo.',
      actions: [
        styleAction('Category texto (tipo)', (IDEE) => new IDEE.style.Category('tipo', categories(IDEE)), { source: MIXED }),
        styleAction('Category numérica (valor)', (IDEE) => {
          const c = categories(IDEE);
          return new IDEE.style.Category('valor', { 5: c.a, 12: c.b, other: c.other });
        }, { source: POLYGONS }),
        {
          label: 'setCategories (a amarillo)',
          run: async (ctx) => {
            const { IDEE } = ctx;
            const style = new IDEE.style.Category('tipo', categories(IDEE));
            const layer = await replaceLayer(ctx, fresh(ctx, POLYGONS), style);
            await ctx.wait(800);
            style.setCategories({ ...categories(IDEE), a: new IDEE.style.Generic({ polygon: { fill: { color: '#facc15', opacity: 1 } } }) });
            await ctx.rendered();
            return ctx.all(ctx.expectRenderer(layer), ctx.noErrors());
          },
        },
      ],
    },
    {
      id: '2.7',
      text: 'Choropleth: atributo numérico en WebGL (cortes = leyenda); atributo de texto cae a Canvas.',
      expected: 'Rampa de color por "valor" en WebGL; con "tipo" (texto) la capa cae a Canvas con aviso.',
      actions: [
        styleAction('Choropleth valor', (IDEE) => new IDEE.style.Choropleth('valor', undefined, IDEE.style.quantification.JENKS(4)), { source: POLYGONS }),
        {
          label: 'Ver cortes',
          run: (ctx) => {
            const style = ctx.store.layer?.getStyle();
            // eslint-disable-next-line no-underscore-dangle
            return style?.breakPoints_ ? `breakPoints: ${JSON.stringify(style.breakPoints_)} (compáralos con la leyenda)` : 'crea antes el Choropleth';
          },
        },
        styleAction('Choropleth texto (tipo)', (IDEE) => new IDEE.style.Choropleth('tipo'), { source: POLYGONS, expected: 'canvas' }),
      ],
    },
    {
      id: '2.8',
      text: 'Proportional: cae a Canvas y funciona como antes.',
      expected: 'Círculos proporcionales a "valor"; la capa en Canvas con aviso.',
      actions: [
        styleAction('Proportional', (IDEE) => new IDEE.style.Proportional('valor', 4, 20), { source: randomPoints(40), expected: 'canvas' }),
      ],
    },
    {
      id: '2.9',
      text: 'Category + Proportional (estilo compuesto): cae a Canvas y funciona como antes.',
      expected: 'Colores por tipo y tamaño por valor; la capa en Canvas.',
      actions: [{
        label: 'Category + Proportional',
        run: async (ctx) => {
          const { IDEE } = ctx;
          const style = new IDEE.style.Category('tipo', categories(IDEE));
          style.add(new IDEE.style.Proportional('valor', 4, 20));
          const layer = await replaceLayer(ctx, fresh(ctx, randomPoints(40)), style);
          return ctx.all(ctx.expectRenderer(layer, 'canvas'), ctx.noErrors());
        },
      }],
    },
    {
      id: '2.10',
      text: 'Cluster y Heatmap: aplicar y quitar. Al quitar, la capa vuelve a WebGL con su estilo.',
      expected: 'Se ven clústeres / mapa de calor; al quitarlos la capa vuelve a WebGL con puntos naranjas.',
      actions: [
        {
          label: 'Aplicar Cluster',
          run: async (ctx) => {
            const { IDEE } = ctx;
            const orange = new IDEE.style.Generic({ point: { radius: 5, fill: { color: '#f97316' } } });
            const layer = await replaceLayer(ctx, fresh(ctx, randomPoints(300)), orange);
            ctx.store.baseStyle = layer.getStyle();
            layer.setStyle(new IDEE.style.Cluster({ distance: 40 }));
            await ctx.rendered();
            return `renderer con cluster: ${ctx.renderer(layer)}`;
          },
        },
        {
          label: 'Aplicar Heatmap',
          run: async (ctx) => {
            const { IDEE } = ctx;
            const orange = new IDEE.style.Generic({ point: { radius: 5, fill: { color: '#f97316' } } });
            const layer = await replaceLayer(ctx, fresh(ctx, randomPoints(300)), orange);
            ctx.store.baseStyle = layer.getStyle();
            layer.setStyle(new IDEE.style.Heatmap('valor'));
            await ctx.rendered();
            return `renderer con heatmap: ${ctx.renderer(layer)}`;
          },
        },
        {
          label: 'Quitar (volver al Generic)',
          run: async (ctx) => {
            const layer = ctx.store.layer;
            layer.setStyle(ctx.store.baseStyle);
            await ctx.rendered();
            return ctx.all(ctx.expectRenderer(layer), ctx.noErrors());
          },
        },
      ],
    },
    {
      id: '2.11',
      text: 'Leyenda del estilo en el layerswitcher: igual que antes.',
      how: 'Crea una capa con Category y abre el layerswitcher (cargado en esta sección).',
      expected: 'La leyenda muestra las categorías igual que en modo Canvas.',
      actions: [
        styleAction('Capa con Category', (IDEE) => new IDEE.style.Category('tipo', categories(IDEE)), { source: POLYGONS }),
      ],
    },
  ],
  plugins: ['layerswitcher'],
  afterSetup: (ctx) => ctx.map.addPlugin(new ctx.IDEE.plugin.Layerswitcher({ collapsed: true, position: 'TL' })),
};
