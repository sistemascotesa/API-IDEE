import { test, expect } from '@playwright/test';
import {
  CONTEXT_TOKEN_PARAMETER, applyContextToken, createContextTokenSource, createUrlDecorator,
} from '../../../src/impl/common/DataIDEEContextToken';
import { getValue } from '../../../src/facade/js/i18n/language';

const ORIGIN = 'https://dataidee.test';
const ITEMS = `${ORIGIN}/ogc/collections/places/items`;

const contextTokens = (url) => new URL(url).searchParams.getAll(CONTEXT_TOKEN_PARAMETER);

test('applyContextToken deja un único contextToken solo en el origen del servicio', () => {
  expect(CONTEXT_TOKEN_PARAMETER).toBe('contextToken');
  const added = applyContextToken(`${ITEMS}?bbox=1,2,3,4&token=auth&ticket=t`, 'ctx', ORIGIN);
  expect(contextTokens(added)).toEqual(['ctx']);
  const params = new URL(added).searchParams;
  expect([params.get('bbox'), params.get('token'), params.get('ticket')]).toEqual(['1,2,3,4', 'auth', 't']);

  const replaced = applyContextToken(`${ITEMS}?contextToken=a&offset=1&contextToken=b`, 'ctx', ORIGIN);
  expect(contextTokens(replaced)).toEqual(['ctx']);
  expect(new URL(replaced).searchParams.get('offset')).toBe('1');

  const external = 'https://otro.test/ogc/collections/places/items?offset=1';
  expect(applyContextToken(external, 'ctx', ORIGIN)).toBe(external);
  expect(applyContextToken(`${ITEMS}?limit=5`, '', ORIGIN)).toBe(`${ITEMS}?limit=5`);
  expect(applyContextToken(`${ITEMS}?limit=5`, undefined, ORIGIN)).toBe(`${ITEMS}?limit=5`);

  const input = new URL(`${ITEMS}?limit=5`);
  expect(contextTokens(applyContextToken(input, 'ctx', ORIGIN))).toEqual(['ctx']);
  expect(input.href).toBe(`${ITEMS}?limit=5`);
});

test('la fuente del contextToken admite cadenas y funciones, y se resuelve en cada petición', async () => {
  expect(createContextTokenSource(undefined).isConfigured()).toBe(false);
  expect(createContextTokenSource('').isConfigured()).toBe(false);
  expect(createContextTokenSource('ctx').isConfigured()).toBe(true);
  expect(createContextTokenSource(() => undefined).isConfigured()).toBe(true);

  expect(await createContextTokenSource('ctx').resolve()).toBe('ctx');
  expect(await createContextTokenSource(undefined).resolve()).toBeUndefined();
  expect(await createContextTokenSource(() => 'sync').resolve()).toBe('sync');
  expect(await createContextTokenSource(async () => 'async').resolve()).toBe('async');
  const ignored = await Promise.all([() => '', () => undefined, () => null, () => 5]
    .map((provider) => createContextTokenSource(provider).resolve()));
  expect(ignored).toEqual([undefined, undefined, undefined, undefined]);

  let calls = 0;
  const rotating = createContextTokenSource(() => {
    calls += 1;
    return `ctx-${calls}`;
  });
  expect([await rotating.resolve(), await rotating.resolve()]).toEqual(['ctx-1', 'ctx-2']);
});

test('un proveedor que falla rechaza con un mensaje genérico sin su detalle', async () => {
  const expected = getValue('exception').dataidee_context_token_failed;
  const failures = [
    () => Promise.reject(new Error('detalle-secreto')),
    () => { throw new Error('detalle-secreto'); },
  ];
  // eslint-disable-next-line no-restricted-syntax
  for (const provider of failures) {
    // eslint-disable-next-line no-await-in-loop
    const error = await createContextTokenSource(provider).resolve().catch((reason) => reason);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe(expected);
    expect(error.message).not.toContain('detalle-secreto');
    expect(error.cause).toBeUndefined();
  }
});

test('el decorador es la identidad sin token y resuelve el proveedor en cada URL', async () => {
  let calls = 0;
  const identity = createUrlDecorator(createContextTokenSource(undefined), ORIGIN);
  expect(await identity(`${ITEMS}?limit=5`)).toBe(`${ITEMS}?limit=5`);

  const decorate = createUrlDecorator(createContextTokenSource(() => {
    calls += 1;
    return `ctx-${calls}`;
  }), ORIGIN);
  expect(contextTokens(await decorate(ITEMS))).toEqual(['ctx-1']);
  expect(contextTokens(await decorate(`${ITEMS}?contextToken=stale`))).toEqual(['ctx-2']);
  expect(await decorate('https://otro.test/items')).toBe('https://otro.test/items');

  const empty = createUrlDecorator(createContextTokenSource(() => ''), ORIGIN);
  expect(await empty(ITEMS)).toBe(ITEMS);
});
