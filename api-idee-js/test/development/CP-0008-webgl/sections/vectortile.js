/**
 * Sección 3 del guion: teseladas vectoriales (MVT, MBTilesVector).
 */
import { URLS, MBTILES_VECTOR_URL } from './data';

const mvt = (IDEE, mode) => new IDEE.layer.MVT({
  url: URLS.mvt,
  name: `sendero_gr_${mode}`,
  legend: `MVT senderos (${mode})`,
  mode,
  extract: true,
});

const replace = async (ctx, layer) => {
  if (ctx.store.layer) ctx.map.removeLayers(ctx.store.layer);
  ctx.store.layer = layer;
  ctx.map.addLayers(layer);
  await ctx.rendered();
  await ctx.wait(1500);
  return layer;
};

export default {
  id: 'vectortile',
  title: '3. Teseladas vectoriales',
  map: { center: [-420000, 4920000], zoom: 7 },
  steps: [
    {
      id: '3.1',
      text: 'Se pintan en WebGL en modo render y en modo feature.',
      expected: 'Se ven los senderos en ambos modos y getRenderer() = webgl. El MBTilesVector de prueba es una rejilla de puntos a zoom 2 (uno por tesela).',
      actions: ['render', 'feature'].map((mode) => ({
        label: `MVT modo ${mode}`,
        run: async (ctx) => {
          const layer = await replace(ctx, mvt(ctx.IDEE, mode));
          return ctx.all(ctx.expectRenderer(layer), ctx.noErrors());
        },
      })).concat([{
        label: 'MBTilesVector',
        run: async (ctx) => {
          // Los datos de prueba solo tienen teselas hasta el zoom 3.
          ctx.map.setZoom(2);
          const response = await window.fetch(MBTILES_VECTOR_URL);
          const layer = await replace(ctx, new ctx.IDEE.layer.MBTilesVector({
            name: 'mbtiles_vector', legend: 'MBTilesVector', source: response, extract: true,
          }));
          return ctx.all(ctx.expectRenderer(layer), ctx.noErrors());
        },
      }]),
    },
    {
      id: '3.2',
      text: 'Estilo Generic, getFeatures() e información de features al pasar el ratón.',
      how: 'Aplica el estilo y haz clic/pasa el ratón sobre un sendero (modo feature).',
      expected: 'Senderos en rojo grueso, getFeatures() devuelve objetos y el popup muestra atributos.',
      actions: [{
        label: 'MVT feature + Generic',
        run: async (ctx) => {
          const layer = await replace(ctx, mvt(ctx.IDEE, 'feature'));
          layer.setStyle(new ctx.IDEE.style.Generic({ line: { stroke: { color: '#dc2626', width: 4 } } }));
          await ctx.rendered();
          await ctx.wait(1000);
          const count = layer.getFeatures().length;
          return ctx.all(
            ctx.expectRenderer(layer),
            { pass: count > 0, detail: `getFeatures()=${count}` },
            ctx.expectFallbackWarning(false),
          );
        },
      }],
    },
    {
      id: '3.3',
      text: 'Zoom rápido entre niveles: no faltan teselas ni hay errores de WebGL en consola.',
      expected: 'Las teselas siguen apareciendo y no hay errores.',
      actions: [{
        label: 'Zoom 7 → 14 → 7',
        run: async (ctx) => {
          if (!ctx.store.layer) await replace(ctx, mvt(ctx.IDEE, 'render'));
          for (let z = 7; z <= 14; z += 1) {
            ctx.map.setZoom(z);
            // eslint-disable-next-line no-await-in-loop
            await ctx.wait(250);
          }
          for (let z = 14; z >= 7; z -= 1) {
            ctx.map.setZoom(z);
            // eslint-disable-next-line no-await-in-loop
            await ctx.wait(250);
          }
          await ctx.rendered();
          return ctx.all(ctx.expectRenderer(ctx.store.layer), ctx.noErrors());
        },
      }],
    },
  ],
};
