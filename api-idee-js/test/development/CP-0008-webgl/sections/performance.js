/**
 * Sección 6 del guion: rendimiento y límites.
 */
import {
  URLS, geojson, randomPoints, POLYGONS,
} from './data';

/** Anima la vista (desplazamiento + zoom) y mide los fotogramas por segundo. */
const measureFps = (ctx) => new Promise((resolve) => {
  const view = ctx.map.getMapImpl().getView();
  const center = view.getCenter();
  const zoom = view.getZoom();
  let frames = 0;
  let running = true;
  const count = () => {
    frames += 1;
    if (running) window.requestAnimationFrame(count);
  };
  const start = performance.now();
  window.requestAnimationFrame(count);
  view.animate(
    { center: [center[0] + 300000, center[1] + 150000], zoom: zoom + 2, duration: 2500 },
    { center, zoom, duration: 2500 },
    () => {
      running = false;
      const seconds = (performance.now() - start) / 1000;
      resolve(Math.round(frames / seconds));
    },
  );
});

export default {
  id: 'performance',
  title: '6. Rendimiento y límites',
  intro: 'Ejecuta cada medida en modo WebGL y en modo Canvas y compara los resultados exportados.',
  map: { center: [-420000, 4920000], zoom: 6 },
  steps: [
    {
      id: '6.1',
      text: 'GeoJSON con 50 000 o más puntos: comparar fluidez de desplazamiento y zoom en Canvas y WebGL.',
      expected: 'WebGL debe dar más FPS que Canvas (anota ambos valores).',
      actions: [50000, 100000].map((n) => ({
        label: `${n / 1000}k puntos + medir FPS`,
        run: async (ctx) => {
          if (ctx.store.big) ctx.map.removeLayers(ctx.store.big);
          const t0 = performance.now();
          ctx.store.big = geojson(ctx.IDEE, `puntos_${n}`, randomPoints(n, 3));
          ctx.map.addLayers(ctx.store.big);
          ctx.store.big.setStyle(new ctx.IDEE.style.Generic({ point: { radius: 3, fill: { color: '{{color}}' } } }));
          await ctx.rendered(30000);
          const loadMs = Math.round(performance.now() - t0);
          const fps = await measureFps(ctx);
          return {
            pass: true,
            detail: `${ctx.renderer(ctx.store.big)}: carga+primer render ${loadMs} ms, ${fps} FPS durante la animación`,
          };
        },
      })),
    },
    {
      id: '6.2',
      text: 'Más de 16 capas WebGL a la vez: el navegador limita los contextos WebGL. Comprobar qué pasa.',
      how: 'Crea 20 capas (10 vectoriales y 10 ráster). Revisa también la consola del navegador (F12) por "Too many active WebGL contexts".',
      expected: 'Anota si alguna capa queda en blanco o se pierde el contexto (el botón cuenta eventos webglcontextlost).',
      actions: [{
        label: 'Crear 20 capas',
        run: async (ctx) => {
          const { IDEE } = ctx;
          let lost = 0;
          const layers = [];
          for (let i = 0; i < 10; i += 1) {
            layers.push(geojson(IDEE, `vector_${i}`, POLYGONS));
            layers.push(new IDEE.layer.XYZ({
              url: URLS.xyzPnoa, name: `xyz_${i}`, legend: `XYZ ${i}`,
            }, { opacity: 0.1 }));
          }
          ctx.map.addLayers(layers);
          ctx.store.many = layers;
          await ctx.wait(500);
          document.querySelectorAll('canvas').forEach((c) => c.addEventListener('webglcontextlost', () => { lost += 1; }));
          await ctx.rendered(15000);
          await ctx.wait(3000);
          const webgl = layers.filter((l) => ctx.renderer(l) === 'webgl').length;
          return {
            pass: lost === 0,
            detail: `${webgl}/20 capas WebGL, ${document.querySelectorAll('canvas.ol-layer').length} canvas WebGL, ${lost} contextos perdidos`,
          };
        },
      }, {
        label: 'Quitar las 20 capas',
        run: (ctx) => {
          ctx.map.removeLayers(ctx.store.many || []);
          return ctx.noErrors();
        },
      }],
    },
    {
      id: '6.3',
      text: 'Navegador con WebGL desactivado: todo cae a Canvas con aviso "no soporta WebGL".',
      how: 'Abre esta sección con el enlace "simular sin WebGL" (añade &nowebgl=1, que anula getContext(\'webgl\')) y pulsa el botón.',
      expected: 'La capa es canvas y aparece el aviso de que el navegador no soporta WebGL.',
      actions: [{
        label: 'Crear capa',
        run: async (ctx) => {
          const layer = geojson(ctx.IDEE, 'sin_webgl', POLYGONS);
          ctx.map.addLayers(layer);
          await ctx.rendered();
          const simulated = new URLSearchParams(window.location.search).get('nowebgl') === '1';
          return ctx.all(
            { pass: simulated, detail: simulated ? 'simulación activa' : 'abre la página con &nowebgl=1' },
            ctx.expectRenderer(layer, 'canvas'),
            ctx.expectFallbackWarning(true),
          );
        },
      }],
    },
  ],
};
