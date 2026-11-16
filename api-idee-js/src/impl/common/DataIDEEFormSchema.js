import exceptionMessage from './exceptionMessage';

/** Helpers for the JSON Schema subset used by DataIDEE attribute forms. */
const UNSUPPORTED_KEYWORDS = new Set([
  'anyOf', 'allOf', 'not', 'if', 'then', 'else', 'patternProperties',
  'unevaluatedProperties', 'unevaluatedItems', 'prefixItems', 'contains',
  'minProperties', 'maxProperties', 'dependentRequired', 'dependentSchemas', 'propertyNames',
  'contentEncoding', 'contentMediaType', 'contentSchema',
]);

const TEMPORAL_FORMATS = ['date', 'date-time'];

/** Temporal keyword, accepted order against its limit and issue code. */
const TEMPORAL_LIMITS = [
  ['formatMinimum', (order) => order >= 0, 'dateMinimum'],
  ['formatMaximum', (order) => order <= 0, 'dateMaximum'],
  ['formatExclusiveMinimum', (order) => order > 0, 'dateExclusiveMinimum'],
  ['formatExclusiveMaximum', (order) => order < 0, 'dateExclusiveMaximum'],
];

/** Default English text of each issue code. Presentation layers translate by code. */
const ISSUE_MESSAGES = {
  required: () => 'This field is required.',
  type: ({ types }) => `Expected ${types.join(' or ')}.`,
  const: () => 'Value does not match the required value.',
  choice: () => 'Choose one of the available values.',
  minimum: ({ limit }) => `Must be at least ${limit}.`,
  maximum: ({ limit }) => `Must be at most ${limit}.`,
  exclusiveMinimum: ({ limit }) => `Must be greater than ${limit}.`,
  exclusiveMaximum: ({ limit }) => `Must be less than ${limit}.`,
  multipleOf: ({ step }) => `Must be a multiple of ${step}.`,
  unsafeInteger: () => 'The integer is too large to be stored exactly.',
  minLength: ({ limit }) => `Enter at least ${limit} characters.`,
  maxLength: ({ limit }) => `Enter no more than ${limit} characters.`,
  pattern: () => 'Value does not match the expected format.',
  patternInvalid: () => 'The schema pattern cannot be validated safely.',
  date: () => 'Enter a valid date.',
  dateTime: () => 'Enter a valid date and time with a timezone.',
  dateMinimum: ({ limit }) => `Must not be earlier than ${limit}.`,
  dateMaximum: ({ limit }) => `Must not be later than ${limit}.`,
  dateExclusiveMinimum: ({ limit }) => `Must be later than ${limit}.`,
  dateExclusiveMaximum: ({ limit }) => `Must be earlier than ${limit}.`,
  minItems: ({ limit }) => `Add at least ${limit} items.`,
  maxItems: ({ limit }) => `Use no more than ${limit} items.`,
  uniqueItems: () => 'Items must be unique.',
  notAllowed: () => 'This field is not allowed.',
  readOnly: () => 'Read-only values cannot be changed.',
  schemaUnavailable: ({ reason }) => reason || 'The collection schema is unavailable.',
  noFeature: () => 'Select a feature in the active DataIDEE editing area.',
  unsupportedRequired: () => 'A required field uses an unsupported schema.',
  identifierRequired: () => 'An identifier is required.',
};

const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)));
const escapePointer = (value) => String(value).replace(/~/g, '~0').replace(/\//g, '~1');
const unescapePointer = (value) => value.replace(/~1/g, '/').replace(/~0/g, '~');

/**
 * Builds a validation issue. "code" and "params" are the language-neutral contract;
 * "message" is an English default for consumers that do not translate.
 */
export function createDataIDEEIssue(path, code, params = {}) {
  return {
    path, code, params, message: ISSUE_MESSAGES[code](params),
  };
}

/** Reads the value at a JSON Pointer, or undefined when the path does not exist. */
export function readDataIDEEPointer(root, path) {
  return path.split('/').slice(1).map(unescapePointer)
    .reduce((value, key) => value?.[key], root);
}

function schemaTypes(schema) {
  const types = Array.isArray(schema.type) ? [...schema.type] : [schema.type].filter(Boolean);
  if (schema.nullable === true && types.length && !types.includes('null')) types.push('null');
  return types;
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

// Date.parse is not used here: V8 accepts impossible dates such as February 31.
function isCalendarDate(text) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return false;
  const [year, month, day] = match.slice(1).map(Number);
  if (month < 1 || month > 12 || day < 1) return false;
  const days = [31, isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= days[month - 1];
}

function isDateTime(text) {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?(?:Z|[+-](\d{2}):(\d{2}))$/.exec(text);
  if (!match || !isCalendarDate(match[1])) return false;
  const [hours, minutes, seconds, offsetHours, offsetMinutes] = match.slice(2)
    .map((part) => Number(part || 0));
  return hours <= 23 && minutes <= 59 && seconds <= 59 && offsetHours <= 23 && offsetMinutes <= 59;
}

const isTemporalValue = (format, value) => (
  typeof value === 'string' && (format === 'date' ? isCalendarDate(value) : isDateTime(value))
);

function temporalPosition(format, value) {
  return Date.parse(format === 'date' ? `${value}T00:00:00Z` : value);
}

function isMultipleOf(value, step) {
  const quotient = value / step;
  return Math.abs(quotient - Math.round(quotient))
    <= Number.EPSILON * Math.max(1, Math.abs(quotient)) * 4;
}

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
    const target = schema.$ref.slice(2).split('/').map(unescapePointer)
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
  if (schema.format && !TEMPORAL_FORMATS.includes(schema.format)) {
    unsupported.push(`format '${schema.format}'`);
  }
  ['exclusiveMinimum', 'exclusiveMaximum', 'multipleOf'].forEach((key) => {
    if (Object.hasOwn(schema, key) && !(Number.isFinite(schema[key])
      && (key !== 'multipleOf' || schema[key] > 0))) unsupported.push(`${key} value`);
  });
  TEMPORAL_LIMITS.forEach(([key]) => {
    if (Object.hasOwn(schema, key) && !(TEMPORAL_FORMATS.includes(schema.format)
      && isTemporalValue(schema.format, schema[key]))) unsupported.push(`${key} value`);
  });
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
    throw new TypeError(exceptionMessage('dataidee_schema_object'));
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

function validateNumber(value, schema, path, issues) {
  const limits = [
    ['minimum', value >= schema.minimum],
    ['maximum', value <= schema.maximum],
    ['exclusiveMinimum', value > schema.exclusiveMinimum],
    ['exclusiveMaximum', value < schema.exclusiveMaximum],
  ];
  limits.forEach(([keyword, accepted]) => {
    if (schema[keyword] !== undefined && !accepted) {
      issues.push(createDataIDEEIssue(path, keyword, { limit: schema[keyword] }));
    }
  });
  if (schema.multipleOf !== undefined && !isMultipleOf(value, schema.multipleOf)) {
    issues.push(createDataIDEEIssue(path, 'multipleOf', { step: schema.multipleOf }));
  }
}

function validateTemporal(value, schema, path, issues) {
  if (!isTemporalValue(schema.format, value)) {
    issues.push(createDataIDEEIssue(path, schema.format === 'date' ? 'date' : 'dateTime'));
    return;
  }
  TEMPORAL_LIMITS.forEach(([keyword, accepts, code]) => {
    if (schema[keyword] === undefined) return;
    const order = temporalPosition(schema.format, value)
      - temporalPosition(schema.format, schema[keyword]);
    if (!accepts(order)) issues.push(createDataIDEEIssue(path, code, { limit: schema[keyword] }));
  });
}

function validateString(value, schema, path, issues) {
  // JSON Schema counts characters, so an emoji is one and not two UTF-16 units.
  const length = [...value].length;
  if (schema.minLength !== undefined && length < schema.minLength) {
    issues.push(createDataIDEEIssue(path, 'minLength', { limit: schema.minLength, length }));
  }
  if (schema.maxLength !== undefined && length > schema.maxLength) {
    issues.push(createDataIDEEIssue(path, 'maxLength', { limit: schema.maxLength, length }));
  }
  if (schema.pattern) {
    try {
      if (!new RegExp(schema.pattern).test(value)) {
        issues.push(createDataIDEEIssue(path, 'pattern', { pattern: schema.pattern }));
      }
    } catch (error) {
      issues.push(createDataIDEEIssue(path, 'patternInvalid'));
    }
  }
  if (TEMPORAL_FORMATS.includes(schema.format)) validateTemporal(value, schema, path, issues);
}

function validateDomain(value, schema, path, issues) {
  const same = (candidate) => JSON.stringify(candidate) === JSON.stringify(value);
  if (schema.const !== undefined && !same(schema.const)) {
    issues.push(createDataIDEEIssue(path, 'const'));
  }
  if (Array.isArray(schema.enum) && !schema.enum.some(same)) {
    issues.push(createDataIDEEIssue(path, 'choice'));
  }
  if (Array.isArray(schema.oneOf) && schema.oneOf.every((choice) => Object.hasOwn(choice, 'const'))
    && !schema.oneOf.some((choice) => same(choice.const))) {
    issues.push(createDataIDEEIssue(path, 'choice'));
  }
}

function validateValue(value, schema, path, issues, mode = 'update') {
  const types = schemaTypes(schema);
  if (types.length && !typeMatches(value, types)) {
    issues.push(createDataIDEEIssue(path, 'type', { types: types.filter((type) => type !== 'null') }));
    return;
  }
  // A null admitted by the declared type means "no value", not a member of the domain.
  if (!(value === null && types.includes('null'))) validateDomain(value, schema, path, issues);
  if (typeof value === 'number') {
    if (types.includes('integer') && !types.includes('number') && !Number.isSafeInteger(value)) {
      issues.push(createDataIDEEIssue(path, 'unsafeInteger'));
    }
    validateNumber(value, schema, path, issues);
  }
  if (typeof value === 'string') validateString(value, schema, path, issues);
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      issues.push(createDataIDEEIssue(path, 'minItems', { limit: schema.minItems }));
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      issues.push(createDataIDEEIssue(path, 'maxItems', { limit: schema.maxItems }));
    }
    if (schema.uniqueItems
      && new Set(value.map((item) => JSON.stringify(item))).size !== value.length) {
      issues.push(createDataIDEEIssue(path, 'uniqueItems'));
    }
    value.forEach((item, index) => validateValue(item, schema.items || {}, `${path}/${index}`, issues, mode));
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    (schema.required || []).forEach((name) => {
      if (!Object.hasOwn(value, name) && !schema.properties?.[name]?.readOnly) {
        issues.push(createDataIDEEIssue(`${path}/${escapePointer(name)}`, 'required'));
      }
    });
    Object.entries(schema.properties || {}).forEach(([name, child]) => {
      if (Object.hasOwn(value, name)) {
        validateValue(value[name], child, `${path}/${escapePointer(name)}`, issues, mode);
      }
    });
    if (mode === 'create' && schema.additionalProperties === false) {
      Object.keys(value).filter((name) => !Object.hasOwn(schema.properties || {}, name))
        .forEach((name) => issues.push(createDataIDEEIssue(`${path}/${escapePointer(name)}`, 'notAllowed')));
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
      issues.push(createDataIDEEIssue(path, 'required'));
    }
  });
  Object.entries(schema.properties || {}).forEach(([name, property]) => {
    if (property['x-ogc-role'] === 'primary-geometry') return;
    const path = `/${escapePointer(name)}`;
    if (unsupported(path)) return;
    if (Object.hasOwn(values, name)) {
      validateValue(values[name], property, path, issues, mode);
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
