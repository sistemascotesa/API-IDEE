import { test, expect } from '@playwright/test';
import normalizeTiles3DOptions from '../../../src/impl/common/Tiles3DOptions';
import composeTiles3DOpacityStyle from '../../../src/impl/cesium/js/scene/tiles3d/Tiles3DOpacityStyle';
import { getValue } from '../../../src/facade/js/i18n/language';

const URL = 'https://tiles3d.test/tileset.json';
const SECRET = 'super-secreto';

const typeError = (fn) => {
  try {
    fn();
  } catch (error) {
    return error;
  }
  return null;
};

test('normalizeTiles3DOptions admite una única fuente: url o ionAssetId', () => {
  expect(normalizeTiles3DOptions({ url: URL })).toEqual({
    type: 'url',
    url: URL,
    ionAssetId: undefined,
    ionAccessToken: undefined,
    ionServer: undefined,
    headers: {},
    queryParameters: {},
  });
  const ion = normalizeTiles3DOptions({ ionAssetId: 96188 }, {
    ionAccessToken: SECRET, ionServer: 'https://ion.test/',
  });
  expect([ion.type, ion.url, ion.ionAssetId, ion.ionAccessToken, ion.ionServer])
    .toEqual(['ion', undefined, 96188, SECRET, 'https://ion.test/']);
  expect(normalizeTiles3DOptions({ ionAssetId: ' 42 ' }).ionAssetId).toBe(42);

  [{}, { url: '' }, { url: URL, ionAssetId: 1 }, undefined, 'texto'].forEach((parameters) => {
    const error = typeError(() => normalizeTiles3DOptions(parameters));
    expect(error).toBeInstanceOf(TypeError);
    expect(error.message).toBe(getValue('exception').tiles3d_source);
  });
  expect(typeError(() => normalizeTiles3DOptions({ url: 5 })).message)
    .toBe(getValue('exception').tiles3d_url);
  [0, -1, 1.5, 'abc', '1e3', true, Number.MAX_SAFE_INTEGER + 1].forEach((ionAssetId) => {
    const error = typeError(() => normalizeTiles3DOptions({ ionAssetId }));
    expect(error).toBeInstanceOf(TypeError);
    expect(error.message).toBe(getValue('exception').tiles3d_ion_asset_id);
  });
});

test('normalizeTiles3DOptions valida las opciones de acceso sin mostrar sus valores', () => {
  const headers = { Authorization: `Bearer ${SECRET}` };
  const queryParameters = { key: SECRET };
  const normalized = normalizeTiles3DOptions({ url: URL }, { headers, queryParameters });
  expect(normalized.headers).toEqual(headers);
  expect(normalized.headers).not.toBe(headers);
  expect(normalized.queryParameters).toEqual(queryParameters);
  expect(normalized.queryParameters).not.toBe(queryParameters);

  const invalid = [
    [{ ionAccessToken: 7 }, 'tiles3d_option_string', 'ionAccessToken'],
    [{ ionAccessToken: '  ' }, 'tiles3d_option_string', 'ionAccessToken'],
    [{ ionServer: { url: SECRET } }, 'tiles3d_option_string', 'ionServer'],
    [{ headers: { Authorization: 1 } }, 'tiles3d_option_string_map', 'headers'],
    [{ headers: [SECRET] }, 'tiles3d_option_string_map', 'headers'],
    [{ queryParameters: SECRET }, 'tiles3d_option_string_map', 'queryParameters'],
    [{ queryParameters: { key: null } }, 'tiles3d_option_string_map', 'queryParameters'],
  ];
  invalid.forEach(([options, key, option]) => {
    const error = typeError(() => normalizeTiles3DOptions({ url: URL }, options));
    expect(error).toBeInstanceOf(TypeError);
    expect(error.message).toBe(getValue('exception')[key].replace('{key}', option));
    expect(error.message).not.toContain(SECRET);
  });
  expect(normalizeTiles3DOptions({ url: URL }, { headers: null, ionAccessToken: '' }))
    .toMatchObject({ headers: {}, ionAccessToken: undefined });
});

test('composeTiles3DOpacityStyle aplica la opacidad como alfa del color', () => {
  const ternary = "${Height} > 10 ? color('red') : color('#00ff00')";
  const style = {
    color: ternary,
    show: '${Height} > 0',
    defines: { Height: '${height} * 2' },
    meta: { description: "'Altura: ' + ${Height}" },
  };
  const original = JSON.parse(JSON.stringify(style));

  expect(composeTiles3DOpacityStyle(style, 1)).toBe(style);
  expect(composeTiles3DOpacityStyle(undefined, 1)).toBeUndefined();
  expect(composeTiles3DOpacityStyle(style, Number.NaN)).toBe(style);

  const composed = composeTiles3DOpacityStyle(style, 0.5);
  expect(composed).toEqual({ ...style, color: `(${ternary}) * color('white', 0.5)` });
  expect(style).toEqual(original);

  expect(composeTiles3DOpacityStyle(undefined, 0.25)).toEqual({ color: "color('white', 0.25)" });
  expect(composeTiles3DOpacityStyle({ show: true }, 0)).toEqual({ show: true, color: "color('white', 0)" });
  expect(composeTiles3DOpacityStyle({ color: "color('blue')" }, 1 / 3).color)
    .toBe("(color('blue')) * color('white', 0.333333)");
  expect(composeTiles3DOpacityStyle({ color: "color('blue')" }, -2).color)
    .toBe("(color('blue')) * color('white', 0)");

  const conditions = {
    color: {
      conditions: [['${height} > 2', "color('cyan')"], ['true', "color('blue', 0.5)"], 'otra'],
    },
  };
  expect(composeTiles3DOpacityStyle(conditions, 0.4)).toEqual({
    color: {
      conditions: [
        ['${height} > 2', "(color('cyan')) * color('white', 0.4)"],
        ['true', "(color('blue', 0.5)) * color('white', 0.4)"],
        'otra',
      ],
    },
  });
  expect(conditions.color.conditions[0][1]).toBe("color('cyan')");
});
