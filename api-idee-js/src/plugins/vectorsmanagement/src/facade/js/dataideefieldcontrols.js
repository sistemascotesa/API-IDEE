/**
 * Controls of the DataIDEE attribute form.
 *
 * Each strategy knows how one kind of attribute is shown and read back. Supporting a new
 * kind means adding a strategy: the form and the validation rules stay untouched. This
 * module holds no validation rules; those belong to the editing session.
 */
const isStored = (value) => value !== undefined && value !== null;

const valueTypes = (schema) => (Array.isArray(schema.type) ? schema.type : [schema.type])
  .filter((type) => type && type !== 'null');

const isNullable = (schema) => schema.nullable === true
  || (Array.isArray(schema.type) && schema.type.includes('null'));

const displayText = (value) => (typeof value === 'object' ? JSON.stringify(value) : String(value));

function createInput(type) {
  const input = document.createElement('input');
  input.type = type;
  return input;
}

/** Native pickers blank whatever they cannot represent, so such values are shown as text. */
function pickerOrText(type, display, value) {
  const input = createInput(type);
  input.value = display;
  if (input.value !== '' || display === '') return input;
  const text = createInput('text');
  text.value = displayText(value);
  return text;
}

function rangeHints(strings, min, max) {
  const { format } = strings;
  if (min !== undefined && max !== undefined) return [format(strings.hintRange, { min, max })];
  if (min !== undefined) return [format(strings.hintMinimum, { min })];
  return max !== undefined ? [format(strings.hintMaximum, { max })] : [];
}

function applyTemporalLimits(control, schema, toDisplay) {
  const lower = schema.formatMinimum ?? schema.formatExclusiveMinimum;
  const upper = schema.formatMaximum ?? schema.formatExclusiveMaximum;
  // Assigned on the element itself: "min" and "max" only constrain the native picker.
  if (lower !== undefined) control.setAttribute('min', toDisplay(lower));
  if (upper !== undefined) control.setAttribute('max', toDisplay(upper));
}

const temporalHints = (schema, strings) => rangeHints(
  strings,
  schema.formatMinimum ?? schema.formatExclusiveMinimum,
  schema.formatMaximum ?? schema.formatExclusiveMaximum,
);

const utcDisplay = (value) => new Date(value).toISOString().slice(0, 16);

function dateTimeDisplay(value) {
  // Without an offset the instant is ambiguous: showing it as UTC would misstate it.
  if (typeof value !== 'string' || !/(Z|[+-]\d{2}:\d{2})$/.test(value)) return displayText(value);
  const instant = new Date(value);
  return Number.isNaN(instant.getTime()) ? value : instant.toISOString().slice(0, -1);
}

function choiceList(schema) {
  if (schema.const !== undefined) return [{ const: schema.const, title: String(schema.const) }];
  if (Array.isArray(schema.enum)) {
    return schema.enum.map((item) => ({ const: item, title: String(item) }));
  }
  return schema.oneOf.map((item) => ({
    const: item.const, title: item.title || String(item.const),
  }));
}

function addOption(select, value, text) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = text;
  select.appendChild(option);
}

/** Whether the digits typed survive the conversion to a JavaScript number. */
function keepsPrecision(text, parsed) {
  if (/e/i.test(text)) return true;
  const digits = (raw) => raw.replace(/^[+-]/, '').replace('.', '').replace(/^0+/, '').replace(/0+$/, '');
  const printed = String(parsed);
  // Very large or small numbers print in exponent form; 17 digits is what a double holds.
  return /e/.test(printed) ? digits(text).length <= 17 : digits(text) === digits(printed);
}

function numberHints(schema, strings) {
  const { format } = strings;
  const hints = rangeHints(strings, schema.minimum, schema.maximum);
  if (schema.exclusiveMinimum !== undefined) {
    hints.push(format(strings.hintGreaterThan, { min: schema.exclusiveMinimum }));
  }
  if (schema.exclusiveMaximum !== undefined) {
    hints.push(format(strings.hintLessThan, { max: schema.exclusiveMaximum }));
  }
  if (schema.multipleOf !== undefined) {
    hints.push(format(strings.hintStep, { step: schema.multipleOf }));
  }
  if (schema['x-ogc-unit']) hints.push(schema['x-ogc-unit']);
  return hints;
}

function lowerBound(schema, integer) {
  if (schema.minimum !== undefined) return schema.minimum;
  if (schema.exclusiveMinimum === undefined) return undefined;
  return schema.exclusiveMinimum + (integer ? 1 : 0);
}

function applyNumberLimits(control, schema, integer) {
  const step = schema.multipleOf ?? (integer ? 1 : undefined);
  control.setAttribute('step', step === undefined ? 'any' : String(step));
  const lower = lowerBound(schema, integer);
  // The spinner counts from "min", so it must itself be a valid step.
  if (lower !== undefined) {
    control.setAttribute('min', String(step === undefined ? lower : Math.ceil(lower / step) * step));
  }
  const upper = schema.maximum ?? schema.exclusiveMaximum;
  if (upper !== undefined) control.setAttribute('max', String(upper));
}

function counterFor(schema, strings) {
  const { maxLength: max, minLength: min } = schema;
  if (max === undefined && !min) return null;
  return (control) => {
    const count = [...control.value].length;
    return max === undefined
      ? strings.format(strings.counterMin, { count, min })
      : strings.format(strings.counter, { count, max });
  };
}

function textRows(text, compact) {
  const lines = text.split('\n').reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / 60)), 0);
  return Math.min(8, Math.max(compact ? 1 : 2, lines));
}

const booleanLabel = (control, strings) => {
  if (control.indeterminate) return strings.unsetValue;
  return control.checked ? strings.trueValue : strings.falseValue;
};

const STRATEGIES = [
  {
    id: 'choice',
    matches: (schema) => schema.const !== undefined
      || Array.isArray(schema.enum) || Array.isArray(schema.oneOf),
    create({ schema, value, strings }) {
      const control = document.createElement('select');
      const choices = choiceList(schema);
      addOption(control, '', strings.unsetValue);
      choices.filter((item) => item.const !== null)
        .forEach((item) => addOption(control, JSON.stringify(item.const), item.title));
      const known = choices.some((item) => JSON.stringify(item.const) === JSON.stringify(value));
      // A stored value outside the domain stays selectable instead of being lost.
      if (isStored(value) && value !== '' && !known) {
        addOption(control, JSON.stringify(value), strings.format(strings.outOfDomain, {
          value: displayText(value),
        }));
      }
      control.value = isStored(value) && (known || value !== '') ? JSON.stringify(value) : '';
      return { control };
    },
    read: (control) => (control.value === '' ? { unset: true } : { value: JSON.parse(control.value) }),
  },
  {
    id: 'date',
    badInputCode: 'badDate',
    matches: (schema) => schema.format === 'date',
    create({ schema, value, strings }) {
      const control = pickerOrText('date', isStored(value) ? displayText(value) : '', value);
      applyTemporalLimits(control, schema, String);
      return { control, hints: temporalHints(schema, strings) };
    },
    read: (control) => (control.value === '' ? { unset: true } : { value: control.value }),
  },
  {
    id: 'dateTime',
    badInputCode: 'badDateTime',
    matches: (schema) => schema.format === 'date-time',
    create({ schema, value, strings }) {
      const control = pickerOrText('datetime-local', isStored(value) ? dateTimeDisplay(value) : '', value);
      control.setAttribute('step', 'any');
      applyTemporalLimits(control, schema, utcDisplay);
      return { control, hints: [strings.dateTimeHint, ...temporalHints(schema, strings)] };
    },
    read(control) {
      if (control.value === '') return { unset: true };
      if (control.type !== 'datetime-local') return { value: control.value };
      const seconds = control.value.length === 16 ? ':00' : '';
      return { value: `${control.value}${seconds}Z` };
    },
  },
  {
    id: 'boolean',
    // A checkbox "value" never changes, so the checked state is what gets compared.
    comparesDisplay: false,
    matches: (schema) => valueTypes(schema).includes('boolean'),
    create({
      schema, value, strings, required,
    }) {
      const control = createInput('checkbox');
      control.checked = value === true;
      control.indeterminate = typeof value !== 'boolean';
      if (isStored(value) && typeof value !== 'boolean') control.dataset.legacyValue = 'true';
      const state = document.createElement('span');
      state.className = 'm-vectorsmanagement-dataidee-boolean-state';
      const label = document.createElement('label');
      label.className = 'm-vectorsmanagement-dataidee-boolean-toggle';
      label.append(control, state);
      const element = document.createElement('div');
      element.className = 'm-vectorsmanagement-dataidee-boolean';
      element.appendChild(label);
      let clear = null;
      const sync = () => {
        state.textContent = booleanLabel(control, strings);
        if (clear) clear.disabled = control.indeterminate;
      };
      if (!required || isNullable(schema)) {
        clear = document.createElement('button');
        clear.type = 'button';
        clear.className = 'm-vectorsmanagement-dataidee-boolean-clear';
        clear.textContent = strings.unsetValue;
        clear.addEventListener('click', () => {
          control.checked = false;
          control.indeterminate = true;
          delete control.dataset.legacyValue;
          control.focus();
          control.dispatchEvent(new Event('change', { bubbles: true }));
        });
        element.appendChild(clear);
      }
      control.addEventListener('change', () => {
        delete control.dataset.legacyValue;
        sync();
      });
      sync();
      return { control, element };
    },
    read(control, { initialValue }) {
      if (!control.indeterminate) return { value: control.checked };
      return control.dataset.legacyValue ? { value: initialValue } : { unset: true };
    },
  },
  {
    id: 'number',
    badInputCode: 'badNumber',
    matches: (schema) => valueTypes(schema).some((type) => type === 'integer' || type === 'number'),
    create({ schema, value, strings }) {
      const types = valueTypes(schema);
      const integer = types.includes('integer') && !types.includes('number');
      const control = pickerOrText('number', isStored(value) ? displayText(value) : '', value);
      if (control.type === 'number') applyNumberLimits(control, schema, integer);
      control.inputMode = integer ? 'numeric' : 'decimal';
      return { control, hints: numberHints(schema, strings) };
    },
    read(control) {
      const text = control.value.trim();
      if (text === '') return { unset: true };
      const parsed = Number(text);
      if (!Number.isFinite(parsed)) return { inputIssue: 'badNumber' };
      return keepsPrecision(text, parsed) ? { value: parsed } : { inputIssue: 'precision' };
    },
  },
  {
    id: 'text',
    matches: () => true,
    create({ schema, value, strings }) {
      const text = isStored(value) ? displayText(value) : '';
      // A pattern describes a single token; anything else may need several lines.
      if (schema.pattern) {
        const control = createInput('text');
        control.value = text;
        return { control, counter: counterFor(schema, strings) };
      }
      const compact = schema.maxLength !== undefined && schema.maxLength <= 120;
      const control = document.createElement('textarea');
      control.rows = textRows(text, compact);
      control.value = text;
      return { control, counter: counterFor(schema, strings), wide: !compact };
    },
    read: (control) => (control.value === '' ? { unset: true } : { value: control.value }),
  },
];

const strategyFor = (schema) => STRATEGIES.find((strategy) => strategy.matches(schema));

/**
 * Creates the control of a primitive attribute.
 *
 * @param {Object} context schema, value, strings and required flag of the attribute.
 * @returns {Object} control, element to insert, hints, optional counter and wide flag.
 */
export function createFieldControl(context) {
  const strategy = strategyFor(context.schema);
  const field = strategy.create(context);
  // Remembers what was shown, so an untouched value is written back exactly as stored.
  if (strategy.comparesDisplay !== false && isStored(context.value)) {
    field.control.dataset.storedDisplay = field.control.value;
  }
  return {
    element: field.control, hints: [], counter: null, wide: false, ...field,
  };
}

/**
 * Reads a control back.
 *
 * @param {HTMLElement} control Control created by createFieldControl.
 * @param {Object} context schema and initialValue of the attribute.
 * @returns {Object} One of { value }, { unset: true } or { inputIssue: code }.
 */
export function readFieldControl(control, context) {
  const strategy = strategyFor(context.schema);
  if (control.validity?.badInput) return { inputIssue: strategy.badInputCode };
  if (control.dataset.storedDisplay === control.value && context.initialValue !== undefined) {
    return { value: JSON.parse(JSON.stringify(context.initialValue)) };
  }
  return strategy.read(control, context);
}
