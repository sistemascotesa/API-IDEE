/** Helpers for the JSON Schema subset used by DataIDEE attribute forms. */
const UNSUPPORTED_KEYWORDS = new Set([
  'anyOf', 'allOf', 'not', 'if', 'then', 'else', 'patternProperties',
  'unevaluatedProperties', 'unevaluatedItems', 'prefixItems', 'contains',
  'multipleOf', 'exclusiveMinimum', 'exclusiveMaximum', 'minProperties',
  'maxProperties', 'dependentRequired', 'dependentSchemas', 'propertyNames',
  'contentEncoding', 'contentMediaType', 'contentSchema',
]);

const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));
const escapePointer = (value) => String(value).replace(/~/g, '~0').replace(/\//g, '~1');

function resolveSchema(schema, root, stack = new Set()) {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return schema;
  if (typeof schema.$ref === 'string') {
    const unsupportedRef = (reason) => ({ ...schema, formUnsupported: reason });
    if (!schema.$ref.startsWith('#/')) {
      return unsupportedRef(`External schema reference '${schema.$ref}' is not supported.`);
    }
    if (stack.has(schema.$ref)) {
      return unsupportedRef(`Recursive schema reference '${schema.$ref}' is not supported.`);
    }
    const target = schema.$ref.slice(2).split('/').map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'))
      .reduce((value, key) => value?.[key], root);
    if (!target) return unsupportedRef(`Unresolved schema reference '${schema.$ref}'.`);
    const next = new Set(stack);
    next.add(schema.$ref);
    return resolveSchema({ ...target, ...Object.fromEntries(Object.entries(schema).filter(([key]) => key !== '$ref')) }, root, next);
  }
  return {
    ...schema,
    ...(schema.properties ? {
      properties: Object.fromEntries(Object.entries(schema.properties)
        .map(([key, value]) => [key, resolveSchema(value, root, stack)])),
    } : {}),
    ...(schema.items ? { items: resolveSchema(schema.items, root, stack) } : {}),
  };
}

function fieldFor(name, schema, required = false, path = '') {
  const pointer = `${path}/${escapePointer(name)}`;
  const types = Array.isArray(schema.type) ? schema.type : [schema.type].filter(Boolean);
  const isObject = types.includes('object') || schema.properties;
  const isArray = types.includes('array') || schema.items;
  const children = isObject ? Object.entries(schema.properties || {}).map(([childName, child]) => (
    fieldFor(childName, child, (schema.required || []).includes(childName), pointer)
  )) : [];
  const item = isArray && schema.items ? fieldFor('item', schema.items, false, pointer) : null;
  const supportedChoices = Array.isArray(schema.oneOf)
    && schema.oneOf.every((choice) => Object.hasOwn(choice, 'const'));
  const unsupported = [...UNSUPPORTED_KEYWORDS].filter((key) => (
    Object.hasOwn(schema, key) && !(key === 'oneOf' && supportedChoices)
  ));
  const validTypes = new Set(['null', 'object', 'array', 'integer', 'number', 'string', 'boolean']);
  if (types.some((type) => !validTypes.has(type))) unsupported.push('invalid type');
  if (schema.pattern) {
    try {
      RegExp(schema.pattern);
    } catch (error) { unsupported.push('invalid pattern'); }
  }
  if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
    unsupported.push('additionalProperties schema');
  }
  if (schema.format && !['date', 'date-time'].includes(schema.format)) {
    unsupported.push(`format '${schema.format}'`);
  }
  if (schema.formUnsupported) unsupported.push(schema.formUnsupported);
  return {
    name,
    path: pointer,
    title: schema.title || name,
    description: schema.description || '',
    type: types,
    format: schema.format || '',
    required,
    readOnly: schema.readOnly === true || schema['x-ogc-role'] === 'primary-geometry',
    writeOnly: schema.writeOnly === true,
    nullable: types.includes('null') || schema.nullable === true,
    enum: Array.isArray(schema.enum) ? clone(schema.enum) : null,
    choices: supportedChoices
      ? schema.oneOf.map((choice) => ({
        value: clone(choice.const), title: choice.title || String(choice.const),
      })) : null,
    default: clone(schema.default),
    propertySeq: Number.isInteger(schema['x-ogc-propertySeq']) ? schema['x-ogc-propertySeq'] : null,
    minimum: schema.minimum,
    maximum: schema.maximum,
    minLength: schema.minLength,
    maxLength: schema.maxLength,
    pattern: schema.pattern,
    minItems: schema.minItems,
    maxItems: schema.maxItems,
    uniqueItems: schema.uniqueItems === true,
    object: Boolean(isObject),
    array: Boolean(isArray),
    properties: children,
    items: item,
    supported: unsupported.length === 0
      && (!isArray || Boolean(item))
      && !(Array.isArray(schema.oneOf) && !supportedChoices),
    unsupported: unsupported.length ? `Unsupported schema keywords or values: ${unsupported.join(', ')}` : null,
    schema,
  };
}

export function normalizeDataIDEESchema(schema) {
  if (!schema || schema.type !== 'object' || !schema.properties) {
    throw new TypeError('The collection schema must be a JSON Schema object with properties.');
  }
  const resolved = resolveSchema(schema, schema);
  const fields = Object.entries(resolved.properties).map(([name, property]) => (
    fieldFor(name, property, (resolved.required || []).includes(name))
  )).sort((left, right) => (
    (left.propertySeq ?? Number.MAX_SAFE_INTEGER) - (right.propertySeq ?? Number.MAX_SAFE_INTEGER)
  ));
  const idField = fields.find((field) => field.schema['x-ogc-role'] === 'id');
  const geometryField = fields.find((field) => field.schema['x-ogc-role'] === 'primary-geometry');
  const properties = fields.filter((field) => field !== idField && field !== geometryField);
  const unsupportedPaths = [];
  const collectUnsupported = (field) => {
    if (!field.supported) unsupportedPaths.push(field.path);
    field.properties.forEach(collectUnsupported);
    if (field.items) collectUnsupported(field.items);
  };
  fields.forEach(collectUnsupported);
  return {
    title: resolved.title || '',
    fields,
    properties,
    idField: idField || null,
    geometryField: geometryField || null,
    required: resolved.required || [],
    unsupportedPaths,
    schema: resolved,
  };
}

function typeMatches(value, types) {
  return types.some((type) => (
    (type === 'null' && value === null)
    || (type === 'object' && value !== null && typeof value === 'object' && !Array.isArray(value))
    || (type === 'array' && Array.isArray(value))
    || (type === 'integer' && Number.isInteger(value))
    || (type === 'number' && typeof value === 'number' && Number.isFinite(value))
    || (type === 'string' && typeof value === 'string')
    || (type === 'boolean' && typeof value === 'boolean')
  ));
}

function validateValue(value, schema, path, issues, present = true, mode = 'update') {
  if (!present) return;
  const types = Array.isArray(schema.type) ? schema.type : [schema.type].filter(Boolean);
  if (types.length && !typeMatches(value, types)) {
    issues.push({ path, message: `Expected ${types.join(' or ')}.` });
    return;
  }
  if (schema.const !== undefined && JSON.stringify(value) !== JSON.stringify(schema.const)) {
    issues.push({ path, message: 'Value does not match the required value.' });
  }
  if (Array.isArray(schema.enum) && !schema.enum.some((item) => (
    JSON.stringify(item) === JSON.stringify(value)
  ))) {
    issues.push({ path, message: 'Choose one of the available values.' });
  }
  if (Array.isArray(schema.oneOf) && schema.oneOf.every((choice) => Object.hasOwn(choice, 'const'))
    && !schema.oneOf.some((choice) => JSON.stringify(choice.const) === JSON.stringify(value))) {
    issues.push({ path, message: 'Choose one of the available values.' });
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) issues.push({ path, message: `Must be at least ${schema.minimum}.` });
    if (schema.maximum !== undefined && value > schema.maximum) issues.push({ path, message: `Must be at most ${schema.maximum}.` });
  }
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) issues.push({ path, message: `Enter at least ${schema.minLength} characters.` });
    if (schema.maxLength !== undefined && value.length > schema.maxLength) issues.push({ path, message: `Enter no more than ${schema.maxLength} characters.` });
    if (schema.pattern) {
      try {
        if (!new RegExp(schema.pattern).test(value)) issues.push({ path, message: 'Value does not match the expected format.' });
      } catch (error) {
        issues.push({ path, message: 'The schema pattern cannot be validated safely.' });
      }
    }
    if (schema.format === 'date' && value && (!/^\d{4}-\d{2}-\d{2}$/.test(value)
      || Number.isNaN(Date.parse(`${value}T00:00:00Z`)))) issues.push({ path, message: 'Enter a valid date.' });
    if (schema.format === 'date-time' && value && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
      || Number.isNaN(Date.parse(value)))) issues.push({ path, message: 'Enter a valid date and time with a timezone.' });
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) issues.push({ path, message: `Add at least ${schema.minItems} items.` });
    if (schema.maxItems !== undefined && value.length > schema.maxItems) issues.push({ path, message: `Use no more than ${schema.maxItems} items.` });
    if (schema.uniqueItems && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) issues.push({ path, message: 'Items must be unique.' });
    value.forEach((item, index) => validateValue(item, schema.items || {}, `${path}/${index}`, issues, true, mode));
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const required = schema.required || [];
    required.forEach((name) => {
      if (!Object.hasOwn(value, name) && !schema.properties?.[name]?.readOnly) issues.push({ path: `${path}/${escapePointer(name)}`, message: 'This field is required.' });
    });
    Object.entries(schema.properties || {}).forEach(([name, child]) => {
      validateValue(value[name], child, `${path}/${escapePointer(name)}`, issues, Object.hasOwn(value, name), mode);
    });
    if (mode === 'create' && schema.additionalProperties === false) {
      Object.keys(value).filter((name) => !Object.hasOwn(schema.properties || {}, name))
        .forEach((name) => issues.push({ path: `${path}/${escapePointer(name)}`, message: 'This field is not allowed.' }));
    }
  }
}

export function validateDataIDEEValues(values, schema, mode = 'update', unsupportedPaths = []) {
  const unsupported = (path) => unsupportedPaths.some((entry) => path === entry || path.startsWith(`${entry}/`));
  const issues = [];
  (schema.required || []).forEach((name) => {
    const property = schema.properties?.[name];
    const path = `/${escapePointer(name)}`;
    if (property?.readOnly || property?.['x-ogc-role'] === 'primary-geometry'
      || (mode === 'update' && property?.writeOnly) || unsupported(path)) return;
    if (!Object.hasOwn(values, name)) {
      issues.push({ path, message: 'This field is required.' });
    }
  });
  Object.entries(schema.properties || {}).forEach(([name, property]) => {
    if (property['x-ogc-role'] === 'primary-geometry') return;
    const path = `/${escapePointer(name)}`;
    if (unsupported(path)) return;
    if (Object.hasOwn(values, name)) {
      validateValue(values[name], property, path, issues, true, mode);
    }
  });
  return issues.filter((issue) => !unsupported(issue.path));
}

export function createMergePatch(before, after) {
  if (JSON.stringify(before) === JSON.stringify(after)) return undefined;
  if (!before || !after || typeof before !== 'object' || typeof after !== 'object'
    || Array.isArray(before) || Array.isArray(after)) return clone(after);
  const patch = {};
  Object.keys(before).forEach((key) => {
    if (!Object.hasOwn(after, key)) patch[key] = null;
    else {
      const child = createMergePatch(before[key], after[key]);
      if (child !== undefined) patch[key] = child;
    }
  });
  Object.keys(after).filter((key) => !Object.hasOwn(before, key))
    .forEach((key) => { patch[key] = clone(after[key]); });
  return Object.keys(patch).length ? patch : undefined;
}

export function containsExplicitNullChange(before, after) {
  if (Array.isArray(after)) return false;
  if (after === null) return before !== null;
  if (!after || typeof after !== 'object') return false;
  return Object.keys(after).some((key) => (
    Object.hasOwn(after, key) && containsExplicitNullChange(before?.[key], after[key])
  ));
}
