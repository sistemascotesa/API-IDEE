import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import path from 'path';

test.beforeEach(async ({ page }) => {
  await page.goto('/test/playwright/ol/basic-ol.html');
  await page.addScriptTag({ url: '/src/plugins/sharemap/dist/sharemap.ol.min.js' });
  await page.addScriptTag({ url: '/src/plugins/backimglayer/dist/backimglayer.ol.min.js' });
  await page.evaluate(() => {
    IDEE.config.MAP_VIEWER_LAYERS = [];
    IDEE.config.terrain.default = [];
    window.base = (name, isBase = true) => new IDEE.layer.XYZ({
      name, url: `/tiles/${name}/{z}/{x}/{y}.png`, isBase,
    });
    window.createMap = (options = {}) => {
      const div = document.createElement('div');
      div.id = `map-${document.querySelectorAll('.test-map').length}`;
      div.className = 'test-map';
      div.style.cssText = 'width:600px;height:300px';
      document.body.appendChild(div);
      return IDEE.map({ container: div.id, layers: [], controls: [], ...options });
    };
    window.catalog = () => [
      { id: 'street', title: 'Callejero', layers: [base('street')] },
      { id: 'image', title: 'Imagen', layers: [base('image')] },
      { id: 'hybrid', title: 'Híbrido', layers: [new IDEE.layer.LayerGroup({
        name: 'hybrid', isBase: true, layers: [base('image'), base('labels', false)],
      })] },
    ];
    IDEE.config.backgroundlayers = catalog();
    IDEE.config.baseLayer = base('default').getRestLayer();
  });
});

test('Sin baseLayer se mantiene el fondo por defecto y no se propaga a otro mapa', async ({ page }) => {
  const result = await page.evaluate(() => {
    IDEE.config.MAP_VIEWER_BASE_LAYER = base('url-only').getRestLayer();
    const old = createMap({ layers: undefined });
    const explicit = createMap({ baseLayer: IDEE.config.MAP_VIEWER_BASE_LAYER });
    const empty = createMap();
    return [old, explicit, empty].map((map) => map.getActiveBaseLayers().map((layer) => layer.name));
  });
  expect(result).toEqual([['default'], ['url-only'], []]);
});

test('Sin baseLayer explícito el selector conserva su opción inicial configurada', async ({ page }) => {
  await page.evaluate(() => {
    window.mapjs = createMap();
    mapjs.addControls(new IDEE.control.BackgroundLayers({ layerIndex: 1 }));
  });
  await expect(page.locator('.test-map #m-baselayerselector-image')).toHaveClass(/activeBaseLayerButton/);
  expect(await page.evaluate(() => mapjs.getActiveBaseLayers().map((layer) => layer.name))).toEqual(['image']);
  expect(await page.evaluate(() => mapjs.getControls().find((c) => c.name === 'backgroundlayers').layers.length)).toBe(3);
});

test('baseLayer permite iniciar Imagen directamente con una capa rápida sin ShareMap', async ({ page }) => {
  await page.evaluate(() => {
    IDEE.config.backgroundlayers = [
      { id: 'street', title: 'Callejero', layers: [IDEE.getQuickLayers('Base_IGNBaseTodo_TMS')] },
      { id: 'image', title: 'Imagen', layers: [IDEE.getQuickLayers('BASE_PNOA_MA_TMS')] },
    ];
    window.mapjs = createMap({
      baseLayer: IDEE.getQuickLayers('BASE_PNOA_MA_TMS').getRestLayer(),
      controls: ['backgroundlayers'],
    });
  });
  await expect(page.locator('.test-map #m-baselayerselector-image')).toHaveClass(/activeBaseLayerButton/);
  expect(await page.evaluate(() => mapjs.getActiveBaseLayers().map((layer) => layer.name))).toEqual(['PNOA_MA']);
});

test('Un fondo externo se añade con su leyenda y es base sin crear ShareMap', async ({ page }) => {
  await page.evaluate(() => {
    const external = new IDEE.layer.XYZ({ name: 'relieve', legend: 'Relieve del proyecto',
      url: '/external/{z}/{x}/{y}.png', isBase: false });
    window.mapjs = createMap({ baseLayer: external.getRestLayer(), controls: ['backgroundlayers'] });
  });
  const button = page.locator('.test-map #m-baselayerselector-rest-shared-base');
  await expect(button).toHaveClass(/activeBaseLayerButton/);
  await expect(button).toHaveText('Relieve del proyecto');
  await expect(button).toHaveAttribute('title', 'Relieve del proyecto');
  expect(await page.evaluate(() => ({
    names: mapjs.getBaseLayers().map((layer) => layer.name),
    catalogSize: mapjs.getControls().find((c) => c.name === 'backgroundlayers').layers.length,
    originalSize: IDEE.config.backgroundlayers.length,
    plugins: mapjs.getPlugins().length,
  }))).toEqual({ names: ['relieve'], catalogSize: 4, originalSize: 3, plugins: 0 });
});

test('BackImgLayer conserva título y previsualización si el recurso ya está en el catálogo', async ({ page }) => {
  await page.evaluate(() => {
    window.mapjs = createMap({ baseLayer: base('image').getRestLayer() });
    mapjs.addPlugin(new IDEE.plugin.BackImgLayer({ collapsed: false, layerOpts: [
      { id: 'image', title: 'Imagen del proyecto', preview: '/project-preview.png', layers: [base('image')] },
    ] }));
  });
  const entry = page.locator('#backimglayer-layer-image');
  await expect(entry).toHaveClass(/m-backimglayer-active/);
  await expect(entry).toHaveAttribute('title', 'Imagen del proyecto');
  await expect(entry.locator('img')).toHaveAttribute('src', '/project-preview.png');
});

test('BackImgLayer usa el nombre de un fondo externo y los componentes de un grupo compartido', async ({ page }) => {
  await page.evaluate(() => {
    window.original = createMap();
    const first = base('imagen-propia');
    const labels = base('etiquetas-propias', false);
    original.addPlugin(new IDEE.plugin.BackImgLayer({ collapsed: false, layerOpts: [
      { id: 'composite', title: 'Composición', preview: '', layers: [first, labels] },
    ] }));
    window.mapjs = createMap({ baseLayer: base('fondo-externo').getRestLayer() });
    mapjs.addPlugin(new IDEE.plugin.BackImgLayer({ collapsed: false, layerOpts: catalog() }));
  });
  await expect(page.locator('#map-0 #backimglayer-layer-composite')).toHaveClass(/m-backimglayer-active/);
  await page.evaluate(() => {
    window.copy = createMap({ baseLayer: original.getRestBaseLayer(), controls: ['backgroundlayers'] });
  });
  await expect(page.locator('#backimglayer-layer-rest-shared-base')).toHaveAttribute('title', 'fondo-externo');
  await expect(page.locator('#map-2 #m-baselayerselector-rest-shared-base')).toHaveText('imagen-propia + etiquetas-propias');
});

for (const index of [0, 1, 2]) {
  test(`BackgroundLayers restaura la entrada ${index} y mantiene sus componentes`, async ({ page }) => {
    await page.evaluate((selected) => {
      const original = createMap({ layers: IDEE.config.backgroundlayers[selected].layers });
      window.mapjs = createMap({ baseLayer: original.getRestBaseLayer(),
        controls: ['backgroundlayers'] });
    }, index);
    await expect.poll(() => page.evaluate(() => mapjs.getControls().find((c) => c.name === 'backgroundlayers')?.html
      ?.querySelector('.activeBaseLayerButton')?.id)).toBe(`m-baselayerselector-${['street', 'image', 'hybrid'][index]}`);
    const result = await page.evaluate(() => {
      const control = mapjs.getControls().find((c) => c.name === 'backgroundlayers');
      const selected = mapjs.getActiveBaseLayers();
      return { index: control.activeLayer, size: control.layers.length,
        names: selected.flatMap((layer) => layer.type === 'LayerGroup'
          ? layer.getLayers().map((child) => child.name) : [layer.name]),
        visible: selected.every((layer) => layer.isVisible()) };
    });
    expect(result.index).toBe(index);
    expect(result.size).toBe(3);
    expect(result.visible).toBe(true);
    expect(result.names).toEqual([['street'], ['image'], ['image', 'labels']][index]);
  });
}

test('Se puede desactivar el fondo desde el control y elegir otro después', async ({ page }) => {
  await page.evaluate(() => {
    window.mapjs = createMap({ baseLayer: base('image').getRestLayer(), controls: ['backgroundlayers'] });
  });
  await expect(page.locator('.test-map #m-baselayerselector-image')).toHaveClass(/activeBaseLayerButton/);
  await page.locator('.test-map #m-baselayerselector-image').click();
  expect(await page.evaluate(() => mapjs.getRestBaseLayer())).toBeUndefined();
  await page.locator('.test-map #m-baselayerselector-street').click();
  expect(await page.evaluate(() => mapjs.getActiveBaseLayers().map((layer) => layer.name))).toEqual(['street']);
});

test('baseLayer rechaza valores que no describen una capa, incluido none', async ({ page }) => {
  await expect(page.evaluate(() => createMap({ baseLayer: 'none' }))).rejects.toThrow();
});

test('baseLayer vacío usa el fondo habitual y rechaza objetos, arrays y números', async ({ page }) => {
  const result = await page.evaluate(() => {
    const defaults = [undefined, null, '', '   '].map((baseLayer) => createMap({
      layers: undefined, baseLayer,
    }).getActiveBaseLayers().map((layer) => layer.name));
    const rejected = [{}, [], 0, false].map((baseLayer) => {
      try {
        createMap({ baseLayer });
        return false;
      } catch (error) {
        return String(error.message || error).includes('baseLayer');
      }
    });
    return { defaults, rejected };
  });
  expect(result.defaults).toEqual([['default'], ['default'], ['default'], ['default']]);
  expect(result.rejected).toEqual([true, true, true, true]);
});

test('Los eventos actualizan el botón sin recargar capas y se retiran al destruir el selector', async ({ page }) => {
  await page.evaluate(() => {
    window.mapjs = createMap({ baseLayer: base('image').getRestLayer() });
    window.selector = new IDEE.control.BackgroundLayers();
    window.updates = 0;
    const update = selector.updateBaseLayerSelection;
    selector.updateBaseLayerSelection = function (...args) {
      window.updates += 1;
      return update.apply(this, args);
    };
    mapjs.addControls(selector);
  });
  await expect(page.locator('.test-map #m-baselayerselector-image')).toHaveClass(/activeBaseLayerButton/);
  await page.evaluate(() => { window.received = mapjs.getActiveBaseLayers(); mapjs.removeLayers(received); });
  await expect(page.locator('.test-map .activeBaseLayerButton')).toHaveCount(0);
  await page.evaluate(() => mapjs.addLayers(received));
  await expect(page.locator('.test-map #m-baselayerselector-image')).toHaveClass(/activeBaseLayerButton/);
  const result = await page.evaluate(() => {
    mapjs.removeControls(selector);
    const before = updates;
    mapjs.fire(IDEE.evt.ADDED_LAYER, [[]]);
    mapjs.fire(IDEE.evt.REMOVED_LAYER, [[]]);
    return { before, after: updates, count: mapjs.getActiveBaseLayers().length };
  });
  expect(result.before).toBeGreaterThan(1);
  expect(result.after).toBe(result.before);
  expect(result.count).toBe(1);
});

for (const explicit of [false, true]) {
  test(`BackImgLayer se retira sin listeners ni controles residuales, baseLayer REST=${explicit}`, async ({ page }) => {
    await page.evaluate((withRest) => {
      window.mapjs = createMap({ baseLayer: withRest ? base('image').getRestLayer() : undefined });
      window.back = new IDEE.plugin.BackImgLayer({ collapsed: false, layerOpts: catalog() });
      mapjs.addPlugin(back);
    }, explicit);
    await expect(page.locator(`#backimglayer-layer-${explicit ? 'image' : 'street'}`)).toHaveClass(/m-backimglayer-active/);
    const updates = await page.evaluate(() => {
      const selector = back.getControls()[0];
      let writes = 0;
      Object.defineProperty(selector, 'visible', { get: () => true, set: () => { writes += 1; } });
      mapjs.removePlugins(back);
      mapjs.fire(IDEE.evt.ADDED_LAYER, [[]]);
      mapjs.fire(IDEE.evt.REMOVED_LAYER, [[]]);
      return { writes, controls: mapjs.getControls().filter((control) => control.name === 'BackImgLayer').length };
    });
    expect(updates).toEqual({ writes: 0, controls: 0 });
  });
}

test('Un fondo externo con el mismo nombre no se confunde con el recurso del catálogo', async ({ page }) => {
  await page.evaluate(() => {
    const external = new IDEE.layer.XYZ({ name: 'street', url: '/different/{z}/{x}/{y}.png', isBase: true });
    window.mapjs = createMap({ baseLayer: external.getRestLayer(), controls: ['backgroundlayers'] });
  });
  await expect(page.locator('.test-map #m-baselayerselector-rest-shared-base')).toHaveClass(/activeBaseLayerButton/);
  await page.locator('.test-map #m-baselayerselector-image').click();
  expect(await page.evaluate(() => mapjs.getActiveBaseLayers().map((layer) => layer.name))).toEqual(['image']);
  expect(await page.evaluate(() => mapjs.getLayers().some((layer) => layer.url?.includes('/different/')))).toBe(false);
});

test('BackImgLayer comparte una composición y excluye solo sus instancias de las capas informativas', async ({ page }) => {
  await page.evaluate(() => {
    window.mapjs = createMap();
    window.back = new IDEE.plugin.BackImgLayer({ collapsed: false, layerOpts: [
      { id: 'combined', title: 'Composición', preview: '', layers: [base('image'), base('labels', false)] },
    ] });
    mapjs.addPlugin(back);
    mapjs.addLayers(base('labels', false));
  });
  await expect(page.locator('#backimglayer-layer-combined')).toHaveClass(/m-backimglayer-active/);
  const result = await page.evaluate(() => {
    const rest = mapjs.getRestBaseLayer();
    const shared = new IDEE.plugin.ShareMap({ shareLayer: true, urlAPI: true });
    mapjs.addPlugin(shared);
    const overlays = shared.getControls()[0].getLayers();
    window.copy = createMap({ baseLayer: rest });
    copy.addPlugin(new IDEE.plugin.BackImgLayer({ collapsed: false, layerOpts: [
      { id: 'combined', title: 'Composición', preview: '', layers: [base('image'), base('labels', false)] },
    ] }));
    return { rest, overlays, children: copy.getActiveBaseLayers()[0].getLayers().map((layer) => layer.name) };
  });
  expect(result.rest).toMatch(/^LayerGroup\*/);
  expect(result.overlays).toHaveLength(1);
  expect(result.overlays[0]).toContain('name=labels;');
  expect(result.children).toEqual(['image', 'labels']);
  await expect(page.locator('#backimglayer-layer-combined.m-backimglayer-active')).toHaveCount(2);
});

test('Un selector tardío respeta la última elección y se puede destruir y recrear', async ({ page }) => {
  await page.evaluate(() => { window.mapjs = createMap({ baseLayer: base('street').getRestLayer(), controls: ['backgroundlayers'] }); });
  await page.locator('.test-map #m-baselayerselector-image').click();
  await page.evaluate(() => {
    window.back = new IDEE.plugin.BackImgLayer({ collapsed: false, layerOpts: catalog() });
    mapjs.addPlugin(back);
  });
  await expect(page.locator('#backimglayer-layer-image')).toHaveClass(/m-backimglayer-active/);
  await page.locator('#backimglayer-layer-street').click();
  expect(await page.evaluate(() => mapjs.getActiveBaseLayers().map((layer) => layer.name))).toEqual(['street']);
  await expect(page.locator('.test-map .activeBaseLayerButton')).toHaveCount(0);
  await page.evaluate(() => {
    mapjs.removePlugins(back);
    window.back = new IDEE.plugin.BackImgLayer({ collapsed: false, layerOpts: catalog() });
    mapjs.addPlugin(back);
  });
  await expect(page.locator('#backimglayer-layer-street')).toHaveClass(/m-backimglayer-active/);
});

test('El manejador móvil cambia un fondo restaurado sin volver al valor inicial', async ({ page }) => {
  await page.setViewportSize({ width: 600, height: 800 });
  await page.evaluate(() => { window.mapjs = createMap({ baseLayer: base('image').getRestLayer(), controls: ['backgroundlayers'] }); });
  await expect(page.locator('.test-map #m-baselayerselector-image')).toHaveClass(/activeBaseLayerButton/);
  await page.evaluate(() => mapjs.getControls().find((c) => c.name === 'backgroundlayers')
    .handlerClickMobile({ target: document.querySelector('.test-map .m-background-group-btn') }));
  expect(await page.evaluate(() => mapjs.getActiveBaseLayers()[0].name)).toBe('hybrid');
});

for (const urlAPI of [false, true]) {
  test(`URL e iframe comparten el fondo actual con urlAPI=${urlAPI} y sin overlays`, async ({ page }) => {
    await page.evaluate(() => { window.mapjs = createMap({ baseLayer: base('street').getRestLayer(), controls: ['backgroundlayers'] }); });
    await expect(page.locator('.test-map #m-baselayerselector-street')).toHaveClass(/activeBaseLayerButton/);
    const first = await page.evaluate(async (api) => {
      window.requestCount = 0;
      IDEE.remote.get = (url) => {
        if (url.includes('/api/actions/controls')) window.requestCount += 1;
        return Promise.resolve({ text: url.includes('/api/actions/controls') ? '["backgroundlayers"]' : 'http://example.test/short' });
      };
      const plugin = new IDEE.plugin.ShareMap({ urlAPI: api, shareLayer: false, shareBaseLayer: true, filterLayers: [] });
      mapjs.addPlugin(plugin);
      window.control = plugin.getControls()[0];
      window.share = async () => {
        const dialog = document.createElement('div');
        dialog.innerHTML = '<input><button id="twitter"></button><button id="facebook"></button><button id="pinterest"></button>'
          + '<div id="m-plugin-sharemap-html"><input></div>';
        await control.buildURL(dialog);
        await control.buildHtml(dialog);
        const url = new URL(dialog.querySelector('input').value);
        const iframe = document.createElement('div');
        iframe.innerHTML = dialog.querySelector('#m-plugin-sharemap-html input').value;
        return { base: url.searchParams.get('baselayer'), layers: url.searchParams.get('layers'),
          controls: url.searchParams.get('controls'), same: iframe.firstChild.getAttribute('src') === url.href };
      };
      return share();
    }, urlAPI);
    expect(first.base).toContain('name=street;');
    expect(first.layers).toBeNull();
    expect(first.same).toBe(true);
    await page.locator('.test-map #m-baselayerselector-image').click();
    const second = await page.evaluate(() => share());
    expect(second.base).toContain('name=image;');
    expect(second.same).toBe(true);
    if (urlAPI) expect(second.controls).toContain('backgroundlayers*1*true');
    expect(await page.evaluate(() => requestCount)).toBe(1);
  });
}

test('configuration.js lee baselayer sin aplicar su valor a mapas auxiliares', async ({ page }) => {
  const source = readFileSync(path.resolve(__dirname, '../../../../../configuration.js'), 'utf8');
  const start = source.indexOf('  const params =');
  const script = source.slice(start, source.indexOf('  /**', start));
  const result = await page.evaluate((code) => {
    const read = new Function('window', `${code}; return baseLayer;`);
    const rest = base('image').getRestLayer();
    return { absent: read({ location: { search: '?zoom=5' } }),
      parsed: read({ location: { search: `?baselayer=${encodeURIComponent(rest)}` } }), rest };
  }, script);
  expect(result.absent).toBeUndefined();
  expect(result.parsed).toBe(result.rest);
});

test('La respuesta de capabilities no convierte el mismo WMTS en un fondo distinto', async ({ page }) => {
  await page.evaluate(() => {
    const params = { name: 'imagery', url: `${window.location.origin}/wmts`, matrixSet: 'GoogleMapsCompatible',
      isBase: true, useCapabilities: false };
    IDEE.config.backgroundlayers = [{ id: 'wmts', title: 'Imagen',
      layers: [new IDEE.layer.WMTS(params, { format: 'image/png', queryable: false })] }];
    const rest = new IDEE.layer.WMTS(params, { format: 'image/png', queryable: true }).getRestLayer();
    window.mapjs = createMap({ baseLayer: rest, controls: ['backgroundlayers'] });
  });
  await expect(page.locator('.test-map #m-baselayerselector-wmts')).toHaveClass(/activeBaseLayerButton/);
  expect(await page.evaluate(() => mapjs.getControls().find((c) => c.name === 'backgroundlayers').layers.length)).toBe(1);
  expect(await page.evaluate(() => mapjs.getActiveBaseLayers()[0].getRestLayer())).toContain('queryable=true');
});
