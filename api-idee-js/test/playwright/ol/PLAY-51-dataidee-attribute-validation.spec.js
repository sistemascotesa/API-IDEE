import { test, expect } from '@playwright/test';
import {
  createMergePatch,
  normalizeDataIDEESchema,
  validateDataIDEEValues,
} from '../../../src/impl/common/DataIDEEFormSchema';

/*
 * Reglas de validación compartidas por el formulario, la aplicación de cambios y el
 * guardado de DataIDEE. Son lógica pura: no necesitan navegador ni servicio.
 */
const codesFor = (schema, value) => validateDataIDEEValues(
  { field: value },
  { type: 'object', properties: { field: schema } },
).map((issue) => issue.code);

const isSupported = (schema) => normalizeDataIDEESchema({
  type: 'object', properties: { field: schema },
}).fields[0].supported;

test.describe('fechas', () => {
  const date = { type: 'string', format: 'date' };

  test('acepta fechas reales y bisiestos', () => {
    expect(codesFor(date, '2024-02-29')).toEqual([]);
    expect(codesFor(date, '2000-02-29')).toEqual([]);
  });

  test('rechaza formatos inválidos y fechas imposibles', () => {
    ['2024/01/15', '15-01-2024', '2024-13-01', '2024-02-31', '2023-02-29', '1900-02-29', '']
      .forEach((value) => expect(codesFor(date, value)).toEqual(['date']));
  });

  test('distingue fecha y fecha-hora', () => {
    expect(codesFor(date, '2024-01-15T10:00:00Z')).toEqual(['date']);
    const dateTime = { type: 'string', format: 'date-time' };
    expect(codesFor(dateTime, '2024-01-15')).toEqual(['dateTime']);
    expect(codesFor(dateTime, '2024-01-15T10:00:00')).toEqual(['dateTime']);
    expect(codesFor(dateTime, '2024-02-31T10:00:00Z')).toEqual(['dateTime']);
    expect(codesFor(dateTime, '2024-01-15T24:00:00Z')).toEqual(['dateTime']);
    expect(codesFor(dateTime, '2024-01-15T10:00:00.123456+05:30')).toEqual([]);
  });

  test('aplica los límites temporales', () => {
    const limited = {
      type: 'string', format: 'date', formatMinimum: '2020-01-01', formatExclusiveMaximum: '2021-01-01',
    };
    expect(codesFor(limited, '2020-01-01')).toEqual([]);
    expect(codesFor(limited, '2019-12-31')).toEqual(['dateMinimum']);
    expect(codesFor(limited, '2021-01-01')).toEqual(['dateExclusiveMaximum']);
    const instants = { type: 'string', format: 'date-time', formatMaximum: '2020-01-01T00:00:00Z' };
    expect(codesFor(instants, '2020-01-01T01:00:00+02:00')).toEqual([]);
    expect(codesFor(instants, '2020-01-01T00:00:01Z')).toEqual(['dateMaximum']);
  });

  test('bloquea un límite que no se puede interpretar', () => {
    expect(isSupported({ type: 'string', format: 'date', formatMinimum: 'ayer' })).toBe(false);
    expect(isSupported({ type: 'string', formatMinimum: '2020-01-01' })).toBe(false);
    expect(isSupported({ type: 'string', format: 'date', formatMinimum: '2020-01-01' })).toBe(true);
  });
});

test.describe('booleanos', () => {
  test('exige booleanos reales y no confunde false con null', () => {
    expect(codesFor({ type: 'boolean' }, true)).toEqual([]);
    expect(codesFor({ type: 'boolean' }, false)).toEqual([]);
    expect(codesFor({ type: 'boolean' }, 'false')).toEqual(['type']);
    expect(codesFor({ type: 'boolean' }, null)).toEqual(['type']);
    expect(codesFor({ type: ['boolean', 'null'] }, null)).toEqual([]);
  });
});

test.describe('dominios', () => {
  test('conserva el tipo y rechaza valores ajenos', () => {
    const domain = { type: 'integer', enum: [0, 1, 2] };
    expect(codesFor(domain, 0)).toEqual([]);
    expect(codesFor(domain, '1')).toEqual(['type']);
    expect(codesFor(domain, 9)).toEqual(['choice']);
    const choices = { type: 'string', oneOf: [{ const: 'a', title: 'A' }, { const: '', title: 'Vacío' }] };
    expect(codesFor(choices, '')).toEqual([]);
    expect(codesFor(choices, 'b')).toEqual(['choice']);
  });

  test('admite null cuando el tipo lo permite', () => {
    expect(codesFor({ type: ['string', 'null'], enum: ['a'] }, null)).toEqual([]);
    expect(codesFor({ type: 'string', nullable: true, enum: ['a'] }, null)).toEqual([]);
    expect(codesFor({ type: 'string', enum: ['a'] }, null)).toEqual(['type']);
  });
});

test.describe('números', () => {
  test('distingue enteros y decimales', () => {
    expect(codesFor({ type: 'integer' }, 5)).toEqual([]);
    expect(codesFor({ type: 'integer' }, 1.5)).toEqual(['type']);
    expect(codesFor({ type: 'number' }, 1.5)).toEqual([]);
    expect(codesFor({ type: 'number' }, '1.5')).toEqual(['type']);
  });

  test('aplica mínimos y máximos y conserva cero y negativos', () => {
    const range = { type: 'integer', minimum: -5, maximum: 5 };
    expect(codesFor(range, 0)).toEqual([]);
    expect(codesFor(range, -5)).toEqual([]);
    expect(codesFor(range, -6)).toEqual(['minimum']);
    expect(codesFor(range, 6)).toEqual(['maximum']);
  });

  test('aplica límites exclusivos y múltiplos sin error de coma flotante', () => {
    const exclusive = { type: 'number', exclusiveMinimum: 0, exclusiveMaximum: 1 };
    expect(codesFor(exclusive, 0)).toEqual(['exclusiveMinimum']);
    expect(codesFor(exclusive, 1)).toEqual(['exclusiveMaximum']);
    expect(codesFor(exclusive, 0.5)).toEqual([]);
    expect(codesFor({ type: 'number', multipleOf: 0.1 }, 0.3)).toEqual([]);
    expect(codesFor({ type: 'number', multipleOf: 0.1 }, 0.35)).toEqual(['multipleOf']);
  });

  test('rechaza enteros que no se pueden guardar con exactitud', () => {
    expect(codesFor({ type: 'integer' }, 2 ** 53)).toEqual(['unsafeInteger']);
  });

  test('bloquea las restricciones numéricas con valores no admitidos', () => {
    expect(isSupported({ type: 'number', multipleOf: 0.5 })).toBe(true);
    expect(isSupported({ type: 'number', exclusiveMinimum: 0 })).toBe(true);
    expect(isSupported({ type: 'number', minimum: 0, exclusiveMinimum: true })).toBe(false);
    expect(isSupported({ type: 'number', multipleOf: 0 })).toBe(false);
  });
});

test.describe('textos', () => {
  test('aplica las longitudes contando caracteres', () => {
    const limited = { type: 'string', minLength: 2, maxLength: 3 };
    expect(codesFor(limited, 'a')).toEqual(['minLength']);
    expect(codesFor(limited, 'abc')).toEqual([]);
    expect(codesFor(limited, 'abcd')).toEqual(['maxLength']);
    expect(codesFor(limited, '😀😀😀')).toEqual([]);
  });

  test('aplica el patrón', () => {
    expect(codesFor({ type: 'string', pattern: '^[0-9]{5}$' }, '06083')).toEqual([]);
    expect(codesFor({ type: 'string', pattern: '^[0-9]{5}$' }, '6083')).toEqual(['pattern']);
  });
});

test.describe('contrato', () => {
  test('cada incidencia conserva ruta y mensaje e incorpora código y parámetros', () => {
    const [issue] = validateDataIDEEValues({ name: 'x' }, {
      type: 'object', properties: { name: { type: 'string', minLength: 2 } },
    });
    expect(issue).toEqual({
      path: '/name',
      code: 'minLength',
      params: { limit: 2, length: 1 },
      message: 'Enter at least 2 characters.',
    });
  });

  test('valida objetos anidados y arrays con su ruta', () => {
    const schema = {
      type: 'object',
      required: ['address'],
      properties: {
        address: { type: 'object', required: ['street'], properties: { street: { type: 'string' } } },
        scores: { type: 'array', uniqueItems: true, items: { type: 'integer', minimum: 1 } },
      },
    };
    const issues = validateDataIDEEValues({ address: {}, scores: [0, 2, 2] }, schema);
    expect(issues.map(({ path, code }) => [path, code])).toEqual([
      ['/address/street', 'required'],
      ['/scores', 'uniqueItems'],
      ['/scores/0', 'minimum'],
    ]);
  });

  test('distingue ausencia, null, cero y false en los cambios', () => {
    expect(createMergePatch({ a: 1, b: true }, { a: 0, b: false })).toEqual({ a: 0, b: false });
    expect(createMergePatch({ a: 1 }, {})).toEqual({ a: null });
    expect(createMergePatch({ a: 0 }, { a: 0 })).toBeUndefined();
  });
});
