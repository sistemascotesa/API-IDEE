/**
 * Sección 7 del guion: Cesium y navegadores. Carga la API Cesium desde dist.
 */
import { POLYGONS, geojson } from './data';

const categories = (IDEE) => ({
  a: new IDEE.style.Generic({ polygon: { fill: { color: '#e11d48', opacity: 1 } } }),
  b: new IDEE.style.Generic({ polygon: { fill: { color: '#2563eb', opacity: 1 } } }),
  other: new IDEE.style.Generic({ polygon: { fill: { color: '#9ca3af', opacity: 1 } } }),
});

export default {
  id: 'cesium',
  title: '7. Cesium y navegadores',
  impl: 'cesium',
  map: { center: [-4, 40], zoom: 5 },
  steps: [
    {
      id: '7.1',
      text: 'Cesium: Category y Choropleth siguen funcionando; la opción renderer se ignora sin errores.',
      expected: 'Polígonos coloreados por tipo y luego por valor; getRenderer() indefinido y sin errores.',
      actions: [
        {
          label: 'Category (renderer: webgl)',
          run: async (ctx) => {
            const { IDEE } = ctx;
            if (ctx.store.layer) ctx.map.removeLayers(ctx.store.layer);
            ctx.store.layer = geojson(IDEE, 'cesium_category', POLYGONS, { renderer: 'webgl' });
            ctx.map.addLayers(ctx.store.layer);
            ctx.store.layer.setStyle(new IDEE.style.Category('tipo', categories(IDEE)));
            await ctx.wait(2000);
            const renderer = ctx.renderer(ctx.store.layer);
            return ctx.all({ pass: renderer === undefined, detail: `getRenderer()=${renderer}` }, ctx.noErrors());
          },
        },
        {
          label: 'Choropleth',
          run: async (ctx) => {
            const { IDEE } = ctx;
            if (ctx.store.layer) ctx.map.removeLayers(ctx.store.layer);
            ctx.store.layer = geojson(IDEE, 'cesium_choropleth', POLYGONS);
            ctx.map.addLayers(ctx.store.layer);
            ctx.store.layer.setStyle(new IDEE.style.Choropleth('valor'));
            await ctx.wait(2000);
            return ctx.noErrors();
          },
        },
      ],
    },
    {
      id: '7.2',
      text: 'Navegadores: Chrome, Firefox, Edge, Safari y un móvil, cubriendo al menos los bloques 1, 2 y 5.',
      how: 'Repite las secciones 1, 2 y 5 en cada navegador, exporta y anota aquí cuáles has cubierto.',
      expected: 'Mismo resultado en todos los navegadores.',
    },
  ],
};
