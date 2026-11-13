import { createFieldControl, readFieldControl } from './dataideefieldcontrols';

const pointerPart = (value) => String(value).replace(/~/g, '~0').replace(/\//g, '~1');
const decodePointerPart = (value) => value.replace(/~1/g, '/').replace(/~0/g, '~');
const missingValue = Symbol('missing');
const clone = (value) => JSON.parse(JSON.stringify(value));
const keepValue = (value) => (value === undefined ? missingValue : clone(value));
const isGeometry = (schema) => schema['x-ogc-role'] === 'primary-geometry'
  || schema.format?.startsWith('geometry-');
const isObjectSchema = (schema) => schema.type === 'object' || schema.properties;
const isArraySchema = (schema) => schema.type === 'array' || schema.items;

const FOCUSABLE_CONTROL = 'input:not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled])';

function isNullable(schema) {
  return schema.nullable === true
    || (Array.isArray(schema.type) && schema.type.includes('null'))
    || (Array.isArray(schema.enum) && schema.enum.includes(null));
}

function emptyValue(schema) {
  if (schema.default !== undefined) return clone(schema.default);
  if (schema.const !== undefined) return clone(schema.const);
  if (isObjectSchema(schema)) return {};
  if (isArraySchema(schema)) return [];
  return '';
}

function findByPath(container, dataAttribute, path) {
  const datasetKey = dataAttribute.replace('data-', '').replace(/-([a-z])/g, (m, c) => c.toUpperCase());
  return [...container.querySelectorAll(`[${dataAttribute}]`)]
    .find((element) => element.dataset[datasetKey] === path);
}

function createLabel(schema, name, id, required, grouped, strings) {
  const label = document.createElement(grouped ? 'legend' : 'label');
  label.textContent = schema.title || name;
  if (!grouped) label.htmlFor = id;
  if (required) {
    const mark = document.createElement('span');
    mark.className = 'm-vectorsmanagement-dataidee-required';
    mark.textContent = ' *';
    mark.setAttribute('aria-hidden', 'true');
    label.appendChild(mark);
  }
  if (schema.readOnly === true) {
    const tag = document.createElement('span');
    tag.className = 'm-vectorsmanagement-dataidee-tag';
    tag.textContent = strings.readOnly;
    label.appendChild(tag);
  }
  return label;
}

function createFeedback() {
  const feedback = document.createElement('div');
  feedback.className = 'm-vectorsmanagement-dataidee-feedback';
  return feedback;
}

function appendUnsupportedValue(node, value, strings) {
  if (value === undefined) return;
  const details = document.createElement('details');
  const summary = document.createElement('summary');
  summary.textContent = value?.type || strings.storedValue;
  const display = document.createElement('pre');
  display.className = 'm-vectorsmanagement-dataidee-stored-value';
  display.textContent = JSON.stringify(value, null, 2);
  details.append(summary, display);
  node.appendChild(details);
}

function createArrayButton(action, path, text, ariaLabel) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `m-vectorsmanagement-dataidee-array-${action}`;
  button.textContent = text;
  button.dataset.arrayAction = action;
  button.dataset.arrayPath = path;
  button.setAttribute('aria-label', ariaLabel);
  return button;
}

function renderPrimitive(node, valueContainer, {
  id, path, schema, value, required, strings,
}) {
  const field = createFieldControl({
    schema, value, strings, required,
  });
  const { control, element, hints } = field;
  control.id = id;
  control.dataset.valuePath = path;
  if (required) control.setAttribute('aria-required', 'true');
  valueContainer.appendChild(element);
  if (field.wide) node.classList.add('is-wide');
  const feedback = createFeedback();
  if (hints.length) {
    const hint = document.createElement('p');
    hint.className = 'm-vectorsmanagement-dataidee-hint';
    hint.id = `${id}-hint`;
    hint.textContent = hints.join(' · ');
    feedback.appendChild(hint);
  }
  if (field.counter) {
    const counter = document.createElement('span');
    counter.className = 'm-vectorsmanagement-dataidee-counter';
    counter.id = `${id}-counter`;
    const refresh = () => { counter.textContent = field.counter(control); };
    control.addEventListener('input', refresh);
    refresh();
    feedback.appendChild(counter);
  }
  return feedback;
}

function renderNode(name, schema, path, value, required, strings, fieldModel = null) {
  const isObject = isObjectSchema(schema);
  const isArray = isArraySchema(schema);
  const grouped = Boolean(isObject || isArray);
  const id = `dataidee-field-${encodeURIComponent(path)}`;
  const node = document.createElement(grouped ? 'fieldset' : 'div');
  node.className = 'm-vectorsmanagement-dataidee-field';
  node.dataset.fieldPath = path;
  node.dataset.fieldTitle = schema.title || name;
  if (isObject) node.classList.add('is-object');
  if (isArray) node.classList.add('is-array');
  node.appendChild(createLabel(schema, name, id, required, grouped, strings));
  if (schema.description) {
    const description = document.createElement('p');
    description.className = 'm-vectorsmanagement-dataidee-description';
    description.id = `${id}-description`;
    description.textContent = schema.description;
    node.appendChild(description);
  }
  if (fieldModel?.supported === false) {
    const notice = document.createElement('p');
    notice.className = 'm-vectorsmanagement-dataidee-description';
    notice.textContent = schema.format?.startsWith('geometry-')
      ? strings.secondaryGeometry : strings.unsupported;
    node.appendChild(notice);
    appendUnsupportedValue(node, value, strings);
    return node;
  }
  const valueContainer = document.createElement('div');
  valueContainer.className = 'm-vectorsmanagement-dataidee-value';
  const current = value === undefined || value === null ? emptyValue(schema) : value;
  let feedback = null;
  if (isObject) {
    Object.entries(schema.properties || {}).forEach(([childName, childSchema]) => {
      const childModel = fieldModel?.properties?.find((field) => field.name === childName) || null;
      valueContainer.appendChild(renderNode(
        childName,
        childSchema,
        `${path}/${pointerPart(childName)}`,
        current[childName],
        (schema.required || []).includes(childName),
        strings,
        childModel,
      ));
    });
  } else if (isArray) {
    const items = Array.isArray(current) ? current : [];
    items.forEach((item, index) => {
      const row = renderNode(
        `${schema.items.title || strings.item} ${index + 1}`,
        schema.items,
        `${path}/${index}`,
        item,
        false,
        strings,
        fieldModel?.items || null,
      );
      row.appendChild(createArrayButton('remove', path, strings.removeItem, `${strings.removeItem} ${index + 1}`));
      row.lastChild.dataset.arrayIndex = String(index);
      valueContainer.appendChild(row);
    });
    const add = createArrayButton('add', path, strings.addItem, `${strings.addItem} ${schema.title || name}`);
    add.dataset.itemSchema = JSON.stringify(schema.items);
    valueContainer.appendChild(add);
  } else {
    feedback = renderPrimitive(node, valueContainer, {
      id, path, schema, value, required, strings,
    });
  }
  if (schema.readOnly === true) {
    node.classList.add('is-readonly');
    valueContainer.querySelectorAll('input,select,textarea,button')
      .forEach((control) => control.setAttribute('disabled', ''));
  }
  node.appendChild(valueContainer);
  if (feedback) node.appendChild(feedback);
  return node;
}

function unsetValue(schema, initialValue, required) {
  return initialValue === null || (required && isNullable(schema)) ? null : missingValue;
}

function collectValue(state, schema, path, initialValue, required = false) {
  if (schema.readOnly || isGeometry(schema)) return keepValue(initialValue);
  if (isObjectSchema(schema)) {
    const value = {};
    Object.entries(schema.properties || {}).forEach(([name, child]) => {
      const childValue = collectValue(
        state,
        child,
        `${path}/${pointerPart(name)}`,
        initialValue?.[name],
        (schema.required || []).includes(name),
      );
      if (childValue !== missingValue) value[name] = childValue;
    });
    return Object.keys(value).length || initialValue != null
      ? value : unsetValue(schema, initialValue, required);
  }
  if (isArraySchema(schema)) {
    const depth = path.split('/').length + 1;
    const rows = [...state.container.querySelectorAll('[data-field-path]')].filter((element) => (
      element.dataset.fieldPath.startsWith(`${path}/`)
      && element.dataset.fieldPath.split('/').length === depth
    ));
    const values = rows.map((row, index) => (
      collectValue(state, schema.items, row.dataset.fieldPath, initialValue?.[index])
    )).filter((value) => value !== missingValue);
    return values.length || initialValue != null
      ? values : unsetValue(schema, initialValue, required);
  }
  const control = findByPath(state.container, 'data-value-path', path);
  if (!control) return keepValue(initialValue);
  const result = readFieldControl(control, { schema, initialValue });
  if (result.inputIssue) {
    state.inputIssues.push({ path, code: result.inputIssue, params: {} });
    return unsetValue(schema, initialValue, required);
  }
  return result.unset ? unsetValue(schema, initialValue, required) : result.value;
}

function arrayAt(root, parts) {
  let parent = root;
  parts.slice(0, -1).forEach((part) => {
    if (parent[part] === undefined || parent[part] === null) parent[part] = {};
    parent = parent[part];
  });
  const key = parts.at(-1);
  if (!Array.isArray(parent[key])) parent[key] = [];
  return parent[key];
}

function clearFeedback(container) {
  container.querySelectorAll('.m-vectorsmanagement-dataidee-error,.m-vectorsmanagement-dataidee-warning')
    .forEach((node) => node.remove());
  container.querySelectorAll('[aria-invalid]')
    .forEach((control) => control.removeAttribute('aria-invalid'));
  container.querySelectorAll('.is-invalid,.is-warning,.is-valid')
    .forEach((field) => field.classList.remove('is-invalid', 'is-warning', 'is-valid'));
}

function describedTarget(field) {
  return field.matches('fieldset') ? field : field.querySelector('[data-value-path]');
}

/** Rebuilds the description of a field from the help and messages it currently shows. */
function syncDescription(field) {
  const target = describedTarget(field);
  if (!target) return;
  const ids = [...field.querySelectorAll(
    ':scope > .m-vectorsmanagement-dataidee-description[id], :scope > .m-vectorsmanagement-dataidee-feedback > [id]',
  )].map((node) => node.id);
  if (ids.length) target.setAttribute('aria-describedby', ids.join(' '));
  else target.removeAttribute('aria-describedby');
}

function showIssue(field, issue, text) {
  let feedback = field.querySelector(':scope > .m-vectorsmanagement-dataidee-feedback');
  if (!feedback) {
    feedback = createFeedback();
    field.appendChild(feedback);
  }
  const message = document.createElement('p');
  message.className = `m-vectorsmanagement-dataidee-${issue.preexisting ? 'warning' : 'error'}`;
  message.id = `dataidee-error-${encodeURIComponent(issue.path)}`;
  message.textContent = text;
  feedback.prepend(message);
  field.classList.add(issue.preexisting ? 'is-warning' : 'is-invalid');
  if (!issue.preexisting && !field.matches('fieldset')) {
    field.querySelector('[data-value-path]')?.setAttribute('aria-invalid', 'true');
  }
}

function controlHasValue(control) {
  return control.type === 'checkbox' ? !control.indeterminate : control.value !== '';
}

/**
 * Renders the attribute form of a DataIDEE feature.
 *
 * @param {HTMLElement} container Form element.
 * @param {Object} definition Definition returned by the editing session.
 * @param {Object} initialValues Current values of the feature.
 * @param {Object} strings Translated texts.
 * @param {Object} options formatIssue(issue) and onInteraction() callbacks.
 * @returns {Object} Form operations.
 */
export default function renderDataIDEEAttributeForm(
  container,
  definition,
  initialValues,
  strings,
  { formatIssue = (issue) => issue.message, onInteraction = () => {} } = {},
) {
  let currentValues = clone(initialValues || {});
  const touched = new Set();
  const isTouched = (path) => touched.has(path)
    || [...touched].some((entry) => entry.startsWith(`${path}/`));
  const render = () => {
    container.replaceChildren();
    definition.fields.forEach((field) => {
      // Geometry belongs to the map editor, including secondary geometries.
      if (isGeometry(field.schema)) return;
      container.appendChild(renderNode(
        field.name,
        field.schema,
        `/${pointerPart(field.name)}`,
        currentValues[field.name],
        field.required,
        strings,
        field,
      ));
    });
  };
  const read = () => {
    const state = { container, inputIssues: [] };
    const values = {};
    definition.fields.forEach((field) => {
      if (isGeometry(field.schema) || field.supported === false || field.readOnly) {
        if (Object.hasOwn(currentValues, field.name)) {
          values[field.name] = clone(currentValues[field.name]);
        }
        return;
      }
      const value = collectValue(
        state,
        field.schema,
        `/${pointerPart(field.name)}`,
        currentValues[field.name],
        field.required,
      );
      if (value !== missingValue) values[field.name] = value;
    });
    return { values, inputIssues: state.inputIssues };
  };
  const collect = () => read().values;
  const focusAfterArrayChange = (action, path, index) => {
    const row = action === 'add' ? findByPath(container, 'data-field-path', `${path}/${index}`) : null;
    const target = row?.querySelector(FOCUSABLE_CONTROL)
      || [...container.querySelectorAll('button[data-array-action="add"]')]
        .find((button) => button.dataset.arrayPath === path);
    target?.focus();
  };
  const onArrayAction = (button) => {
    const { arrayAction, arrayPath, arrayIndex } = button.dataset;
    currentValues = collect();
    const array = arrayAt(currentValues, arrayPath.split('/').slice(1).map(decodePointerPart));
    if (arrayAction === 'add') {
      array.push(emptyValue(JSON.parse(button.dataset.itemSchema)));
    } else {
      array.splice(Number(arrayIndex), 1);
      // Row indexes have shifted, so their interaction state no longer applies.
      [...touched].filter((entry) => entry.startsWith(`${arrayPath}/`))
        .forEach((entry) => touched.delete(entry));
    }
    touched.add(arrayPath);
    render();
    focusAfterArrayChange(arrayAction, arrayPath, array.length - 1);
    onInteraction();
  };
  const onControlEvent = (event) => {
    const path = event.target.dataset?.valuePath;
    if (path === undefined) return;
    touched.add(path);
    onInteraction();
  };
  render();
  container.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-array-action]');
    if (button) onArrayAction(button);
  });
  ['input', 'change', 'focusout'].forEach((type) => container.addEventListener(type, onControlEvent));
  return {
    collect,
    read,
    render,
    /** Title of a field, including the groups that contain it. */
    getFieldLabel(path) {
      const labels = [];
      let field = findByPath(container, 'data-field-path', path);
      while (field) {
        labels.unshift(field.dataset.fieldTitle);
        field = field.parentElement.closest('[data-field-path]');
      }
      return labels.join(' › ');
    },
    /**
     * Shows the issues next to their fields. Calling it again replaces the previous state.
     *
     * @param {Array<Object>} issues Validation issues.
     * @param {Object} options all: also shows issues of fields the user has not touched.
     * @returns {number} Blocking issues currently on display.
     */
    setIssues(issues, { all = false } = {}) {
      clearFeedback(container);
      const shown = new Map();
      issues.forEach((issue) => {
        if (!all && !issue.preexisting && !isTouched(issue.path)) return;
        const previous = shown.get(issue.path);
        if (!previous || (previous.preexisting && !issue.preexisting)) shown.set(issue.path, issue);
      });
      shown.forEach((issue, path) => {
        const field = findByPath(container, 'data-field-path', path);
        if (field) showIssue(field, issue, formatIssue(issue));
      });
      touched.forEach((path) => {
        const field = findByPath(container, 'data-field-path', path);
        const control = field && findByPath(field, 'data-value-path', path);
        if (control && controlHasValue(control)
          && !field.classList.contains('is-invalid') && !field.classList.contains('is-warning')) {
          field.classList.add('is-valid');
        }
      });
      container.querySelectorAll('[data-field-path]').forEach(syncDescription);
      return [...shown.values()].filter((issue) => !issue.preexisting).length;
    },
  };
}
