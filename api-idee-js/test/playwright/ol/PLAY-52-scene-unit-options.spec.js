import { test, expect } from '@playwright/test';
import {
  ZoomRangePolicy, ExtentClipPolicy, ElevationPolicy, HeightConverter, LabelMarkerBuilder,
} from '../../../src/facade/js/scene/contracts';
import {
  normalizeElevation, mergeElevation, isZoomInRange, zoomForHeight, DEFAULT_ELEVATION,
} from '../../../src/facade/js/scene/options';
import { getValue } from '../../../src/facade/js/i18n/language';
import ViewZoomRangePolicy from '../../../src/impl/common/scene/ViewZoomRangePolicy';
import ItemExtentClipPolicy, { toExtentArray, intersectsExtent } from '../../../src/impl/common/scene/ItemExtentClipPolicy';
import {
  gradientStop, weightRange, heatmapAsPoints, chartAsLabeledPoints, flowLineAsLines,
  createOnceWarner,
} from '../../../src/impl/common/scene/degradedStyles';
import { createElevationPolicy, isDefaultElevation } from '../../../src/impl/common/scene/elevationPolicies';
import GeoidHeightConverter, { interpolateGrid } from '../../../src/impl/common/scene/GeoidHeightConverter';

const thrown = (fn) => {
  try {
    fn();
  } catch (error) {
    return error;
  }
  return undefined;
};

const CONTRACTS = {
  ZoomRangePolicy: [ZoomRangePolicy, ['setRange', 'isInRange']],
  ExtentClipPolicy: [ExtentClipPolicy, ['setExtent', 'apply']],
  ElevationPolicy: [ElevationPolicy, ['resolve']],
  HeightConverter: [HeightConverter, ['ready', 'toEllipsoidal']],
  LabelMarkerBuilder: [LabelMarkerBuilder, ['buildLabel']],
};

test('contratos de escena: no se instancian y sus métodos abstractos fallan', () => {
  Object.entries(CONTRACTS).forEach(([name, [Contract, methods]]) => {
    expect(() => new Contract(), name).toThrow(`${name}: clase abstracta`);
    const Concrete = class extends Contract {};
    const instance = new Concrete();
    methods.forEach((method) => {
      expect(() => instance[method](), `${name}.${method}`).toThrow('método abstracto no implementado');
    });
  });
});

test('elevación: valores por defecto, modo abreviado, combinación capa/estilo y errores', () => {
  expect(normalizeElevation()).toEqual(DEFAULT_ELEVATION);
  expect(normalizeElevation('clamp')).toEqual({ ...DEFAULT_ELEVATION, mode: 'clamp' });
  expect(normalizeElevation({ mode: 'relative', offset: 2.5, heightSystem: 'geoid' }))
    .toEqual({ mode: 'relative', offset: 2.5, heightSystem: 'geoid' });
  expect(mergeElevation({ mode: 'absolute', heightSystem: 'geoid' }, { offset: 10 }))
    .toEqual({ mode: 'absolute', offset: 10, heightSystem: 'geoid' });
  expect(mergeElevation('relative', 'clamp')).toEqual({ ...DEFAULT_ELEVATION, mode: 'clamp' });
  expect(mergeElevation({ mode: 'absolute' }, { mode: undefined })).toEqual({ ...DEFAULT_ELEVATION, mode: 'absolute' });

  const messages = getValue('exception');
  expect(thrown(() => normalizeElevation({ mode: 'top' }))).toBe(messages.elevation_mode);
  expect(thrown(() => normalizeElevation({ offset: '3' }))).toBe(messages.elevation_offset);
  expect(thrown(() => normalizeElevation({ heightSystem: 'msl' }))).toBe(messages.elevation_height_system);
  expect(thrown(() => normalizeElevation([1]))).toBe(messages.elevation_options);
  expect(thrown(() => mergeElevation(undefined, 5))).toBe(messages.elevation_options);
});

test('rango de zoom: misma regla que OpenLayers (zoom > min y zoom <= max)', () => {
  expect(isZoomInRange(5, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY)).toBe(true);
  expect(isZoomInRange(5, 5, 10)).toBe(false);
  expect(isZoomInRange(5.1, 5, 10)).toBe(true);
  expect(isZoomInRange(10, 5, 10)).toBe(true);
  expect(isZoomInRange(10.5, 5, 10)).toBe(false);
  expect(isZoomInRange(3, undefined, '4')).toBe(true);
  expect(isZoomInRange(Number.NaN, 5, 10)).toBe(true);
});

test('zoom equivalente a una altura de cámara con la tabla del mapa', () => {
  const table = {
    0: 1000, 1: 500, 2: 250, 3: 125,
  };
  expect(zoomForHeight(5000, table)).toBe(0);
  expect(zoomForHeight(1000, table)).toBe(0);
  expect(zoomForHeight(999, table)).toBe(1);
  expect(zoomForHeight(250, table)).toBe(2);
  expect(zoomForHeight(10, table)).toBe(3);
});

test('política de rango de zoom: avisa solo al cambiar y se desuscribe', () => {
  let zoom = 3;
  let listener;
  let unsubscribed = false;
  const applied = [];
  const policy = new ViewZoomRangePolicy({
    getZoom: () => zoom,
    onChange: (callback) => {
      listener = callback;
      return () => { unsubscribed = true; };
    },
  }, (inRange) => applied.push(inRange));

  policy.setRange(4, 8);
  expect(applied).toEqual([false]);
  listener();
  expect(applied).toEqual([false]);
  zoom = 5;
  listener();
  zoom = 8;
  listener();
  zoom = 9;
  listener();
  expect(applied).toEqual([false, true, false]);
  expect(policy.isInRange()).toBe(false);
  policy.setRange(Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY);
  expect(applied).toEqual([false, true, false, true]);
  policy.dispose();
  expect(unsubscribed).toBe(true);
});

test('política de recorte por extensión: oculta lo que queda fuera y lo restaura', () => {
  const items = [
    { id: 'dentro', coords: [[1, 1]], shown: true },
    { id: 'fuera', coords: [[20, 20]], shown: true },
    { id: 'cruza', coords: [[-5, 2], [5, 2]], shown: true },
    { id: 'sin coordenadas', coords: [], shown: true },
  ];
  const policy = new ItemExtentClipPolicy({
    list: () => items,
    coordinates: (item) => item.coords,
    setShown: (item, shown) => { Object.assign(item, { shown }); },
  });
  const shown = () => items.filter((item) => item.shown).map((item) => item.id);

  policy.setExtent([0, 0, 10, 10]);
  expect(shown()).toEqual(['dentro', 'cruza', 'sin coordenadas']);
  items.push({ id: 'nuevo', coords: [[30, 30]], shown: true });
  policy.apply();
  expect(shown()).toEqual(['dentro', 'cruza', 'sin coordenadas']);
  policy.setExtent({ x: { min: 15, max: 40 }, y: { min: 15, max: 40 } });
  expect(shown()).toEqual(['fuera', 'sin coordenadas', 'nuevo']);
  policy.setExtent(null);
  expect(shown()).toEqual(['dentro', 'fuera', 'cruza', 'sin coordenadas', 'nuevo']);

  expect(toExtentArray([0, 0, 1])).toBeNull();
  expect(toExtentArray({ x: { min: 0, max: 1 }, y: { min: 2, max: 3 } })).toEqual([0, 2, 1, 3]);
  expect(intersectsExtent([[11, 0]], [0, 0, 10, 10])).toBe(false);
});

test('estilos simplificados: mapa de calor, gráfico y línea de flujo como estilos genéricos', () => {
  const feature = (attributes) => ({ getAttribute: (name) => attributes[name] });
  const gradient = ['#00f', '#0f0', '#f00'];
  expect([0, 0.5, 1, 7].map((ratio) => gradientStop(gradient, ratio)))
    .toEqual(['#00f', '#0f0', '#f00', '#f00']);
  const features = [feature({ peso: 2 }), feature({ peso: 8 }), feature({ peso: null })];
  expect(weightRange(features, 'peso')).toEqual({ min: 2, max: 8 });

  const heat = heatmapAsPoints({
    attribute: 'peso', gradient, radius: 10, opacity: 0.5, maxWeight: 8,
  }).point;
  expect(heat.radius).toBe(10);
  expect([heat.fill.color(features[0]), heat.fill.opacity(features[0])]).toEqual(['#0f0', 0.125]);
  expect([heat.fill.color(features[1]), heat.fill.opacity(features[1])]).toEqual(['#f00', 0.5]);
  expect(heat.fill.opacity(features[2])).toBe(0.5);
  const byFunction = heatmapAsPoints({ attribute: () => 0, gradient, radius: 4 }).point;
  expect([byFunction.fill.color(features[0]), byFunction.fill.opacity(features[0])])
    .toEqual(['#00f', 0]);

  const chart = chartAsLabeledPoints({
    variables: ['a', { attribute: 'b' }, 'c'], scheme: ['', '#123456'], radius: 20,
  }).point;
  expect(chart.fill.color).toBe('#123456');
  expect(chart.label.text(feature({ a: 1, b: 2 }))).toBe('1 / 2');
  expect(chart.label.offset).toEqual([0, -28]);

  expect(flowLineAsLines({ color: '#f00', width: 2, width2: 6 }).line.stroke)
    .toEqual({ color: '#f00', width: 4 });
  const dynamic = flowLineAsLines({ color: '{{c}}', width: (f) => f.getAttribute('w') }).line.stroke;
  expect([dynamic.color(feature({ c: '#0f0', w: 3 })), dynamic.width(feature({ w: 3 }))])
    .toEqual(['#0f0', 3]);

  const messages = [];
  const warnOnce = createOnceWarner((message) => messages.push(message));
  warnOnce('a', 'uno');
  warnOnce('a', 'otra vez');
  warnOnce('b', 'dos');
  expect(messages).toEqual(['uno', 'dos']);
});

test('elevación: una estrategia por modo; auto equivale al comportamiento anterior', () => {
  const resolve = (elevation, hasZ) => createElevationPolicy(elevation).resolve('Polygon', hasZ);
  expect(resolve(undefined, false)).toMatchObject({
    mode: 'clamp', clampToGround: true, heightReference: 'CLAMP_TO_GROUND', perPositionHeight: false,
  });
  expect(resolve('auto', true)).toMatchObject({
    mode: 'absolute', clampToGround: false, heightReference: 'NONE', perPositionHeight: true,
  });
  expect(resolve({ mode: 'clamp', offset: 50 }, true)).toMatchObject({ mode: 'clamp', offset: 0 });
  expect(resolve({ mode: 'absolute', offset: 5 }, false))
    .toMatchObject({ perPositionHeight: false, offset: 5 });
  expect(resolve({ mode: 'relative', offset: 2 }, true)).toMatchObject({
    heightReference: 'RELATIVE_TO_GROUND', perPositionHeight: false, offset: 2,
  });
  expect([undefined, 'auto', { mode: 'auto', offset: 1 }, { heightSystem: 'geoid' }]
    .map(isDefaultElevation)).toEqual([true, true, false, false]);
});

test('geoide: interpolación bilineal de la rejilla y aviso sin rejilla', async () => {
  const grid = {
    width: 3,
    height: 2,
    x0: -4,
    y0: 41,
    dx: 1,
    dy: -1,
    values: [50, 52, 54, 48, 50, -9999],
    noData: -9999,
  };
  expect(interpolateGrid(grid, -4, 41)).toBe(50);
  expect(interpolateGrid(grid, -3.5, 40.5)).toBeCloseTo(50, 9);
  expect(interpolateGrid(grid, -2.5, 40.5)).toBeUndefined();
  expect(interpolateGrid(grid, -5, 41)).toBeUndefined();
  expect(interpolateGrid({ ...grid, x0: 356 }, -3.5, 41)).toBe(51);

  const loads = [];
  const converter = new GeoidHeightConverter({
    url: 'rejilla.tif',
    loadGrid: async (url) => {
      loads.push(url);
      return grid;
    },
  });
  expect(converter.toEllipsoidal(-4, 41, 100)).toBe(100);
  expect(await Promise.all([converter.ready(), converter.ready()])).toEqual([true, true]);
  expect(loads).toEqual(['rejilla.tif']);
  expect(converter.toEllipsoidal(-3, 41, 100)).toBe(152);
  expect(converter.toEllipsoidal(-2, 41, 100)).toBe(154);
  expect(converter.toEllipsoidal(10, 10, 100)).toBe(100);

  const warnings = [];
  const missing = new GeoidHeightConverter({ url: '', warn: (m) => warnings.push(m), missingMessage: 'sin rejilla' });
  expect(await missing.ready()).toBe(false);
  expect(await missing.ready()).toBe(false);
  expect(warnings).toEqual(['sin rejilla']);
  expect(missing.toEllipsoidal(-4, 41, 7)).toBe(7);
});
