import { test, expect } from '@playwright/test';

const POINTS = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', properties: { id: 1 }, geometry: { type: 'Point', coordinates: [-3.7, 40.4] } },
    { type: 'Feature', properties: { id: 2 }, geometry: { type: 'Point', coordinates: [-5.9, 37.4] } },
  ],
};

const WORLD_POLYGON = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    properties: { color: '#ff0000', tipo: 'a', valor: 10 },
    geometry: {
      type: 'Polygon',
      coordinates: [[[-170, -80], [170, -80], [170, 80], [-170, 80], [-170, -80]]],
    },
  }],
};

// Polígono que cubre el mapa (valor 10) y polígonos pequeños con otros valores.
const VALUED_POLYGONS = {
  type: 'FeatureCollection',
  features: [10, 1, 5, 20, 40].map((valor, i) => ({
    type: 'Feature',
    properties: { valor },
    geometry: {
      type: 'Polygon',
      coordinates: i === 0
        ? [[[-170, -80], [170, -80], [170, 80], [-170, 80], [-170, -80]]]
        : [[[i, 60], [i + 0.5, 60], [i + 0.5, 60.5], [i, 60.5], [i, 60]]],
    },
  })),
};

const RED_FILL = { polygon: { fill: { color: '#ff0000', opacity: 1 } } };

const OSM_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

test.describe('Renderer WebGL', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/playwright/ol/basic-ol.html');
    await page.evaluate(() => {
      // Los tests no dependen del valor de WEBGL de la configuración de pruebas.
      IDEE.config('WEBGL', false);
      window.map = IDEE.map({ container: 'map' });
    });
    await page.waitForFunction(() => window.map.isFinished());
  });

  // style: opciones de IDEE.style.Generic; styleCode: código que crea el estilo en la página.
  const addGeoJSON = (page, {
    source = POINTS, options = {}, style, styleCode, inGroup = false,
  } = {}) => page.evaluate(({
    src, opts, styleOpts, code, group,
  }) => new Promise((resolve) => {
    const layerOpts = { ...opts };
    if (styleOpts) {
      layerOpts.style = new IDEE.style.Generic(styleOpts);
    }
    if (code) {
      // eslint-disable-next-line no-new-func
      layerOpts.style = new Function(`return ${code}`)();
    }
    const layer = new IDEE.layer.GeoJSON({ name: 'webgl', source: src }, layerOpts);
    window.layer = layer;
    layer.on(IDEE.evt.LOAD, () => resolve());
    if (group) {
      window.group = new IDEE.layer.LayerGroup({ name: 'group', layers: [layer] });
      window.map.addLayers(window.group);
    } else {
      window.map.addLayers(layer);
    }
  }), {
    src: source, opts: options, styleOpts: style, code: styleCode, group: inGroup,
  });

  const layerState = (page) => page.evaluate(() => {
    const olLayer = window.layer.getImpl().getLayer();
    const { getLayerRenderer } = IDEE.impl.webgl.WebGLLayerProvider;
    const rootLayers = window.map.getMapImpl().getLayers().getArray();
    const allLayers = window.map.getMapImpl().getAllLayers();
    return {
      renderer: window.layer.getRenderer(),
      features: olLayer.getSource().getFeatures().length,
      inRoot: rootLayers.includes(olLayer),
      occurrences: allLayers.filter((l) => l === olLayer).length,
      webglLayers: allLayers.filter((l) => getLayerRenderer(l) === 'webgl').length,
      zIndex: olLayer.getZIndex(),
      implZIndex: window.layer.getImpl().getZIndex(),
    };
  });

  // Color del píxel central compuesto solo con los canvas WebGL (canvas.ol-layer).
  const webglCenterPixel = (page) => page.evaluate(() => new Promise((resolve) => {
    const olMap = window.map.getMapImpl();
    olMap.once('rendercomplete', () => {
      const out = document.createElement('canvas');
      [out.width, out.height] = olMap.getSize();
      const ctx = out.getContext('2d');
      document.querySelectorAll('canvas.ol-layer').forEach((c) => {
        if (c.width > 0) ctx.drawImage(c, 0, 0, out.width, out.height);
      });
      const x = Math.floor(out.width / 2);
      const y = Math.floor(out.height / 2);
      resolve([...ctx.getImageData(x, y, 1, 1).data]);
    });
    olMap.render();
  }));

  // Añade una capa ráster creada con el código indicado y devuelve su renderer real.
  const addRaster = (page, code) => page.evaluate(async (layerCode) => {
    // eslint-disable-next-line no-new-func
    const layer = new Function(`return ${layerCode}`)();
    window.raster = layer;
    window.map.addLayers(layer);
    for (let i = 0; i < 50 && !layer.getImpl().getLayer(); i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => { setTimeout(r, 100); });
    }
    const olLayer = layer.getImpl().getLayer();
    return olLayer ? IDEE.impl.webgl.WebGLLayerProvider.getLayerRenderer(olLayer) : null;
  }, code);

  test('Por defecto la capa se renderiza con Canvas', async ({ page }) => {
    await addGeoJSON(page);
    const state = await layerState(page);
    expect(state.renderer).toBe('canvas');
    expect(state.features).toBe(2);
  });

  test('IDEE.impl.webgl.RendererType está expuesto', async ({ page }) => {
    const values = await page.evaluate(() => {
      const { CANVAS, WEBGL } = IDEE.impl.webgl.RendererType;
      return [CANVAS, WEBGL];
    });
    expect(values).toEqual(['canvas', 'webgl']);
  });

  test('IDEE.config.WEBGL activa WebGL y la opción de capa canvas lo anula', async ({ page }) => {
    const resolved = await page.evaluate(() => {
      const { resolveRenderer } = IDEE.impl.webgl.RendererResolver;
      IDEE.config('WEBGL', true);
      const result = [
        resolveRenderer({}),
        resolveRenderer({ renderer: 'canvas' }),
        resolveRenderer({ renderer: 'webgl', crossOrigin: null }),
      ];
      IDEE.config('WEBGL', false);
      return result;
    });
    expect(resolved).toEqual(['webgl', 'canvas', 'canvas']);
  });

  test('Con el estilo por defecto la capa se mantiene en WebGL', async ({ page }) => {
    await addGeoJSON(page, { options: { renderer: 'webgl', opacity: 0.5 } });
    const state = await layerState(page);
    expect(state.renderer).toBe('webgl');
    expect(state.features).toBe(2);
    expect(state.occurrences).toBe(1);
    expect(await page.evaluate(() => window.layer.getOpacity())).toBe(0.5);
  });

  test('WebGL pinta el relleno del estilo Generic', async ({ page }) => {
    await addGeoJSON(page, { source: WORLD_POLYGON, options: { renderer: 'webgl' }, style: RED_FILL });
    expect((await layerState(page)).renderer).toBe('webgl');
    const [r, g, b, a] = await webglCenterPixel(page);
    expect(r).toBeGreaterThan(200);
    expect(g).toBeLessThan(50);
    expect(b).toBeLessThan(50);
    expect(a).toBeGreaterThan(200);
  });

  test('Cambiar el estilo en caliente actualiza el estilo WebGL', async ({ page }) => {
    await addGeoJSON(page, { source: WORLD_POLYGON, options: { renderer: 'webgl' }, style: RED_FILL });
    await page.evaluate(() => window.layer.getStyle().set('polygon.fill.color', '#0000ff'));
    expect((await layerState(page)).renderer).toBe('webgl');
    const [r, , b] = await webglCenterPixel(page);
    expect(r).toBeLessThan(50);
    expect(b).toBeGreaterThan(200);
  });

  test('Color desde atributo ({{attr}}) en WebGL', async ({ page }) => {
    await addGeoJSON(page, {
      source: WORLD_POLYGON,
      options: { renderer: 'webgl' },
      style: { polygon: { fill: { color: '{{color}}' } } },
    });
    expect((await layerState(page)).renderer).toBe('webgl');
    const [r, g] = await webglCenterPixel(page);
    expect(r).toBeGreaterThan(200);
    expect(g).toBeLessThan(50);
  });

  test('Category se aplica en WebGL', async ({ page }) => {
    await addGeoJSON(page, {
      source: WORLD_POLYGON,
      options: { renderer: 'webgl' },
      styleCode: `new IDEE.style.Category('tipo', {
        a: new IDEE.style.Generic({ polygon: { fill: { color: '#00ff00', opacity: 1 } } }),
        b: new IDEE.style.Generic({ polygon: { fill: { color: '#ff0000', opacity: 1 } } }),
      })`,
    });
    expect((await layerState(page)).renderer).toBe('webgl');
    const [r, g] = await webglCenterPixel(page);
    expect(r).toBeLessThan(50);
    expect(g).toBeGreaterThan(200);
    const canvasStyle = await page.evaluate(() => {
      const olFeature = window.layer.getImpl().getLayer().getSource().getFeatures()[0];
      const styles = window.layer.getImpl().getCanvasStyle()(olFeature, 1);
      return styles[0].getFill().getColor();
    });
    expect(canvasStyle).toContain('0,255,0');
  });

  test('Choropleth se aplica en WebGL con atributo numérico', async ({ page }) => {
    await addGeoJSON(page, {
      source: VALUED_POLYGONS,
      options: { renderer: 'webgl' },
      styleCode: 'new IDEE.style.Choropleth(\'valor\')',
    });
    expect((await layerState(page)).renderer).toBe('webgl');
    const [, , , a] = await webglCenterPixel(page);
    expect(a).toBeGreaterThan(200);
  });

  test('En Canvas, Category y Choropleth siguen asignando estilo por objeto geográfico', async ({ page }) => {
    await addGeoJSON(page, {
      source: VALUED_POLYGONS,
      styleCode: `new IDEE.style.Category('valor', {
        10: new IDEE.style.Generic({ polygon: { fill: { color: '#00ff00' } } }),
      })`,
    });
    const categoryStyled = await page.evaluate(() => window.layer.getFeatures()
      .filter((f) => f.getStyle() instanceof IDEE.style.Generic).length);
    expect(categoryStyled).toBe(1);
    await page.evaluate(() => window.layer.setStyle(new IDEE.style.Choropleth('valor')));
    const choroplethStyled = await page.evaluate(() => window.layer.getFeatures()
      .filter((f) => !!f.getStyle()).length);
    expect(choroplethStyled).toBe(5);
    expect((await layerState(page)).renderer).toBe('canvas');
  });

  test('Choropleth con atributo no numérico cae a Canvas', async ({ page }) => {
    await addGeoJSON(page, {
      source: WORLD_POLYGON,
      options: { renderer: 'webgl' },
      styleCode: 'new IDEE.style.Choropleth(\'color\')',
    });
    expect((await layerState(page)).renderer).toBe('canvas');
  });

  test('Estilo con etiqueta cae a Canvas conservando fuente y propiedades', async ({ page }) => {
    const warnings = [];
    page.on('console', (msg) => msg.type() === 'warning' && warnings.push(msg.text()));
    await addGeoJSON(page, {
      options: { renderer: 'webgl', opacity: 0.5 },
      style: { point: { radius: 5, fill: { color: 'red' }, label: { text: '{{id}}' } } },
    });
    const state = await layerState(page);
    expect(state.renderer).toBe('canvas');
    expect(state.features).toBe(2);
    expect(state.occurrences).toBe(1);
    expect(state.webglLayers).toBe(0);
    expect(state.zIndex).toBe(state.implZIndex);
    expect(await page.evaluate(() => window.layer.getOpacity())).toBe(0.5);
    expect(warnings.some((w) => w.includes('WebGL'))).toBe(true);
  });

  test('El cambio a Canvas dentro de un grupo mantiene la capa en el grupo', async ({ page }) => {
    await addGeoJSON(page, {
      options: { renderer: 'webgl' },
      style: { point: { radius: 5, fill: { color: 'red' }, label: { text: 'x' } } },
      inGroup: true,
    });
    const state = await layerState(page);
    const inGroup = await page.evaluate(() => window.group.getImpl().layersCollection
      .getArray().includes(window.layer.getImpl().getLayer()));
    expect(state.renderer).toBe('canvas');
    expect(state.inRoot).toBe(false);
    expect(inGroup).toBe(true);
    expect(state.occurrences).toBe(1);
  });

  test('Feature con estilo propio fuerza Canvas y el resto conserva el estilo de capa', async ({ page }) => {
    await addGeoJSON(page, { options: { renderer: 'webgl' }, style: { point: { radius: 7, fill: { color: 'red' } } } });
    const result = await page.evaluate(async () => {
      const before = window.layer.getRenderer();
      const [first, second] = window.layer.getFeatures();
      first.setStyle(new IDEE.style.Generic({ point: { radius: 8, fill: { color: 'blue' } } }));
      // El cambio a Canvas se aplica al terminar la tarea en curso.
      await Promise.resolve();
      const layerStyle = window.layer.getImpl().getLayer().getStyle();
      const styles = layerStyle(second.getImpl().getFeature(), 1);
      return {
        before,
        after: window.layer.getRenderer(),
        radius: styles[0].getImage().getRadius(),
      };
    });
    expect(result).toEqual({ before: 'webgl', after: 'canvas', radius: 7 });
  });

  test('Mapas secundarios reciben una copia Canvas de las capas WebGL', async ({ page }) => {
    await addGeoJSON(page, { options: { renderer: 'webgl' } });
    const result = await page.evaluate(() => {
      const impl = window.layer.getImpl();
      const copy = impl.getSecondaryMapLayer();
      return {
        distinct: copy !== impl.getLayer(),
        renderer: IDEE.impl.webgl.WebGLLayerProvider.getLayerRenderer(copy),
        sameSource: copy.getSource() === impl.getLayer().getSource(),
        hasStyle: typeof copy.getStyle() === 'function',
      };
    });
    expect(result).toEqual({
      distinct: true, renderer: 'canvas', sameSource: true, hasStyle: true,
    });
  });

  test('Capas ráster teseladas con renderer webgl', async ({ page }) => {
    expect(await addRaster(page, `new IDEE.layer.XYZ({ name: 'xyz', url: '${OSM_URL}' }, { renderer: 'webgl' })`)).toBe('webgl');
    expect(await addRaster(page, 'new IDEE.layer.OSM({ name: \'osm\' }, { renderer: \'webgl\' })')).toBe('webgl');
    expect(await addRaster(page, `new IDEE.layer.WMS({
      url: 'https://www.ign.es/wms-inspire/ign-base', name: 'IGNBaseTodo', useCapabilities: false,
    }, { renderer: 'webgl' })`)).toBe('webgl');
  });

  test('WMS de imagen única y orígenes sin CORS se mantienen en Canvas', async ({ page }) => {
    expect(await addRaster(page, `new IDEE.layer.WMS({
      url: 'https://www.ign.es/wms-inspire/ign-base', name: 'IGNBaseTodo', useCapabilities: false,
    }, { renderer: 'webgl', singleTile: true })`)).toBe('canvas');
    expect(await addRaster(page, `new IDEE.layer.XYZ({ name: 'xyz', url: '${OSM_URL}' }, { renderer: 'webgl', crossOrigin: false })`)).toBe('canvas');
  });

  test('Eliminar una capa WebGL libera su contexto', async ({ page }) => {
    await addRaster(page, `new IDEE.layer.XYZ({ name: 'xyz', url: '${OSM_URL}' }, { renderer: 'webgl' })`);
    const disposed = await page.evaluate(() => {
      const olLayer = window.raster.getImpl().getLayer();
      window.map.removeLayers(window.raster);
      return olLayer.disposed;
    });
    expect(disposed).toBe(true);
  });

  test('Quitar y volver a añadir una capa vectorial WebGL ya pintada no produce errores', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await addGeoJSON(page, { options: { renderer: 'webgl' }, style: RED_FILL });
    const result = await page.evaluate(async () => {
      const rendered = () => new Promise((resolve) => {
        window.map.getMapImpl().once('rendercomplete', resolve);
        window.map.getMapImpl().render();
      });
      await rendered();
      const olLayer = window.layer.getImpl().getLayer();
      window.map.removeLayers(window.layer);
      window.map.addLayers(window.layer);
      await rendered();
      return { disposed: olLayer.disposed, renderer: window.layer.getRenderer() };
    });
    expect(result).toEqual({ disposed: true, renderer: 'webgl' });
    expect(errors).toEqual([]);
  });

  test('KML con estilos propios cargado al renderizar cambia a Canvas sin errores', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const renderer = await page.evaluate(() => new Promise((resolve) => {
      const kml = new IDEE.layer.KML({ url: '/test/playwright/fixtures/kmz/basic.kml', name: 'kml' }, { renderer: 'webgl' });
      window.map.addLayers(kml);
      kml.on(IDEE.evt.LOAD, () => {
        const olMap = window.map.getMapImpl();
        olMap.once('rendercomplete', () => resolve(kml.getRenderer()));
        olMap.render();
      });
    }));
    expect(renderer).toBe('canvas');
    expect(errors).toEqual([]);
  });

  test('Traducción de opciones Generic a estilo plano', async ({ page }) => {
    const result = await page.evaluate(() => {
      const { toGenericFlatStyle } = IDEE.impl.style.FlatStyleTranslator;
      return {
        full: toGenericFlatStyle({
          point: {
            radius: '{{size}}', fill: { color: '#ff0000', opacity: 0.5 }, stroke: { color: '#000', width: 2 },
          },
          line: { stroke: { color: '#00ff00', linedash: [4, 2] }, fill: { color: '#0000ff', width: 5 } },
          polygon: { fill: { color: '#ffffff', opacity: '{{alpha}}' } },
        }),
        icon: toGenericFlatStyle({ point: { icon: { src: 'a.png', scale: 2 } } }),
        fn: toGenericFlatStyle({ point: { radius: () => 5, fill: { color: 'red' } } }),
        label: toGenericFlatStyle({ polygon: { fill: { color: 'red' }, label: { text: 'x' } } }),
        pattern: toGenericFlatStyle({ polygon: { fill: { color: 'red', pattern: { name: 'hatch' } } } }),
        form: toGenericFlatStyle({ point: { icon: { form: 'CIRCLE' } } }),
        templateColorOpacity: toGenericFlatStyle({ polygon: { fill: { color: '{{c}}', opacity: 0.5 } } }),
      };
    });
    expect(result.full).toEqual([
      {
        filter: ['==', ['geometry-type'], 'Point'],
        style: [{
          'circle-radius': ['get', 'size'],
          'circle-fill-color': [255, 0, 0, 0.5],
          'circle-stroke-color': [0, 0, 0, 1],
          'circle-stroke-width': 2,
        }],
      },
      {
        filter: ['==', ['geometry-type'], 'LineString'],
        style: [
          { 'stroke-color': [0, 255, 0, 1], 'stroke-width': 1, 'stroke-line-dash': [4, 2] },
          { 'stroke-color': [0, 0, 255, 1], 'stroke-width': 5 },
        ],
      },
      {
        filter: ['==', ['geometry-type'], 'Polygon'],
        style: [{ 'fill-color': ['color', 255, 255, 255, ['get', 'alpha']] }],
      },
    ]);
    expect(result.icon[0].style).toEqual([{ 'icon-src': 'a.png', 'icon-scale': 2 }]);
    expect(result.fn).toBeNull();
    expect(result.label).toBeNull();
    expect(result.pattern).toBeNull();
    expect(result.form).toBeNull();
    expect(result.templateColorOpacity).toBeNull();
  });

  test('Traducción de categorías e intervalos', async ({ page }) => {
    const result = await page.evaluate(() => {
      const { toCategoryFlatStyle, toRangesFlatStyle } = IDEE.impl.style.FlatStyleTranslator;
      const rules = [{ filter: ['==', ['geometry-type'], 'Polygon'], style: [{ 'fill-color': 'red' }] }];
      return {
        category: toCategoryFlatStyle('t', [{ value: 'a', rules }], rules),
        ranges: toRangesFlatStyle('v', [5, 10], [rules, rules]),
      };
    });
    const geom = ['==', ['geometry-type'], 'Polygon'];
    expect(result.category.map((r) => r.filter)).toEqual([
      ['all', ['==', ['get', 't'], 'a'], geom],
      ['all', ['all', ['!=', ['get', 't'], 'a']], geom],
    ]);
    expect(result.ranges.map((r) => r.filter)).toEqual([
      ['all', ['<=', ['get', 'v'], 5], geom],
      ['all', ['all', ['>', ['get', 'v'], 5], ['<=', ['get', 'v'], 10]], geom],
    ]);
  });
});
