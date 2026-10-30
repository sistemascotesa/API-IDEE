const pointerPart = (value) => String(value).replace(/~/g, '~0').replace(/\//g, '~1');
const missingValue = Symbol('missing');
const isGeometry = (schema) => schema['x-ogc-role'] === 'primary-geometry'
  || schema.format?.startsWith('geometry-');

function emptyValue(schema) {
  if (schema.default !== undefined) return JSON.parse(JSON.stringify(schema.default));
  if (schema.const !== undefined) return JSON.parse(JSON.stringify(schema.const));
  if (schema.type === 'object' || schema.properties) return {};
  if (schema.type === 'array' || schema.items) return [];
  return '';
}

function findByPath(container, dataAttribute, path) {
  return [...container.querySelectorAll(`[${dataAttribute}]`)]
    .find((element) => element.dataset[dataAttribute.replace('data-', '').replace(/-([a-z])/g, (m, c) => c.toUpperCase())] === path);
}

function makePrimitive(path, schema, initialValue, strings) {
  const value = initialValue;
  const types = Array.isArray(schema.type)
    ? schema.type.filter((type) => type !== 'null') : [schema.type];
  const selectChoices = Array.isArray(schema.enum) || Array.isArray(schema.oneOf);
  const control = document.createElement(selectChoices || types.includes('boolean') ? 'select' : 'input');
  control.dataset.valuePath = path;
  if (control.tagName === 'INPUT') {
    control.type = types.includes('integer') || types.includes('number') ? 'number' : 'text';
    if (types.includes('integer')) control.step = '1';
    if (types.includes('number')) control.step = 'any';
    if (schema.format === 'date') control.type = 'date';
    if (schema.format === 'date-time') {
      control.type = 'datetime-local';
      control.step = 'any';
    }
    if (schema.minimum !== undefined) control.min = String(schema.minimum);
    if (schema.maximum !== undefined) control.max = String(schema.maximum);
    if (schema.minLength !== undefined) control.minLength = schema.minLength;
    if (schema.maxLength !== undefined) control.maxLength = schema.maxLength;
    if (schema.pattern) control.pattern = schema.pattern;
    control.value = value === null || value === undefined ? '' : String(value);
    if (schema.format === 'date-time' && value) {
      const instant = new Date(value);
      if (!Number.isNaN(instant.getTime())) {
        // Display UTC explicitly; preserve the original offset and precision if unedited.
        control.value = instant.toISOString().slice(0, -1);
        control.dataset.originalDateTime = value;
        control.dataset.originalDisplay = control.value;
      }
    }
  } else {
    const choices = types.includes('boolean')
      ? [{ const: true, title: strings.trueValue }, { const: false, title: strings.falseValue }]
      : schema.enum?.map((item) => ({ const: item, title: String(item) }))
        || schema.oneOf?.map((item) => ({
          const: item.const, title: item.title || String(item.const),
        })) || [];
    const unset = document.createElement('option');
    unset.value = '';
    unset.textContent = strings.unsetValue;
    control.appendChild(unset);
    choices.filter((item) => item.const !== null && item.const !== '').forEach((item) => {
      const option = document.createElement('option');
      option.value = JSON.stringify(item.const);
      option.textContent = item.title;
      control.appendChild(option);
    });
    control.value = value === undefined || value === null || value === '' ? '' : JSON.stringify(value);
  }
  return control;
}

function renderNode(name, schema, path, value, required, strings, fieldModel = null) {
  const isObject = schema.type === 'object' || schema.properties;
  const isArray = schema.type === 'array' || schema.items;
  const node = document.createElement(isObject ? 'fieldset' : 'div');
  node.className = 'm-vectorsmanagement-dataidee-field';
  node.dataset.fieldPath = path;
  if (isObject) node.classList.add('is-object');
  const label = document.createElement(isObject ? 'legend' : 'label');
  label.textContent = schema.title || name;
  if (!isObject) label.htmlFor = `dataidee-field-${encodeURIComponent(path)}`;
  if (required) {
    const requiredMark = document.createElement('span');
    requiredMark.textContent = ' *';
    requiredMark.setAttribute('aria-label', strings.required);
    label.appendChild(requiredMark);
  }
  node.appendChild(label);
  if (schema.description) {
    const description = document.createElement('p');
    description.className = 'm-vectorsmanagement-dataidee-description';
    description.textContent = schema.description;
    node.appendChild(description);
  }
  if (fieldModel?.supported === false) {
    const notice = document.createElement('p');
    notice.className = 'm-vectorsmanagement-dataidee-description';
    notice.textContent = schema.format?.startsWith('geometry-')
      ? strings.secondaryGeometry : strings.unsupported;
    node.appendChild(notice);
    if (value !== undefined) {
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = value?.type || strings.storedValue;
      const display = document.createElement('pre');
      display.className = 'm-vectorsmanagement-dataidee-stored-value';
      display.textContent = JSON.stringify(value, null, 2);
      details.append(summary, display);
      node.appendChild(details);
    }
    return node;
  }
  const valueContainer = document.createElement('div');
  valueContainer.className = 'm-vectorsmanagement-dataidee-value';
  const current = value === undefined || value === null ? emptyValue(schema) : value;
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
    items.forEach((item, index) => valueContainer.appendChild(renderNode(
      `${schema.items.title || strings.item} ${index + 1}`,
      schema.items,
      `${path}/${index}`,
      item,
      false,
      strings,
      fieldModel?.items || null,
    )));
    const add = document.createElement('button');
    add.type = 'button';
    add.textContent = strings.addItem;
    add.dataset.arrayAction = 'add';
    add.dataset.arrayPath = path;
    add.dataset.itemSchema = JSON.stringify(schema.items);
    add.setAttribute('aria-label', `${strings.addItem} ${schema.title || name}`);
    valueContainer.appendChild(add);
    items.forEach((item, index) => {
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = strings.removeItem;
      remove.dataset.arrayAction = 'remove';
      remove.dataset.arrayPath = path;
      remove.dataset.arrayIndex = String(index);
      remove.setAttribute('aria-label', `${strings.removeItem} ${index + 1}`);
      const row = [...valueContainer.querySelectorAll('[data-field-path]')]
        .find((element) => element.dataset.fieldPath === `${path}/${index}`);
      if (row) row.appendChild(remove);
    });
  } else {
    const control = makePrimitive(path, schema, value, strings);
    control.id = `dataidee-field-${encodeURIComponent(path)}`;
    valueContainer.appendChild(control);
    if (schema.format === 'date-time') {
      const hint = document.createElement('p');
      hint.className = 'm-vectorsmanagement-dataidee-description';
      hint.id = `${control.id}-timezone`;
      hint.textContent = strings.dateTimeHint;
      control.setAttribute('aria-describedby', hint.id);
      valueContainer.appendChild(hint);
    }
  }
  if (schema.readOnly === true || schema['x-ogc-role'] === 'id' || fieldModel?.supported === false) {
    valueContainer.querySelectorAll('input,select,button')
      .forEach((control) => control.setAttribute('disabled', ''));
  }
  if (fieldModel?.supported === false) {
    const notice = document.createElement('p');
    notice.className = 'm-vectorsmanagement-dataidee-description';
    notice.textContent = fieldModel.unsupported || strings.unsupported;
    node.appendChild(notice);
  }
  node.appendChild(valueContainer);
  return node;
}

function collectValue(container, schema, path, initialValue, required = false) {
  const unset = () => {
    const nullable = schema.nullable === true
      || (Array.isArray(schema.type) && schema.type.includes('null'));
    return initialValue === null || (required && nullable) ? null : missingValue;
  };
  if (schema.readOnly || isGeometry(schema)) {
    return initialValue === undefined ? missingValue : JSON.parse(JSON.stringify(initialValue));
  }
  if (schema.type === 'object' || schema.properties) {
    const value = {};
    Object.entries(schema.properties || {}).forEach(([name, child]) => {
      const childValue = collectValue(
        container,
        child,
        `${path}/${pointerPart(name)}`,
        initialValue?.[name],
        (schema.required || []).includes(name),
      );
      if (childValue !== missingValue) value[name] = childValue;
    });
    return Object.keys(value).length || initialValue != null ? value : unset();
  }
  if (schema.type === 'array' || schema.items) {
    const depth = path.split('/').length + 1;
    const rows = [...container.querySelectorAll('[data-field-path]')].filter((element) => (
      element.dataset.fieldPath.startsWith(`${path}/`)
      && element.dataset.fieldPath.split('/').length === depth
    ));
    const values = rows.map((row, index) => (
      collectValue(container, schema.items, row.dataset.fieldPath, initialValue?.[index])
    )).filter((value) => value !== missingValue);
    return values.length || initialValue != null ? values : unset();
  }
  const control = findByPath(container, 'data-value-path', path);
  if (!control) {
    return initialValue === undefined ? missingValue : JSON.parse(JSON.stringify(initialValue));
  }
  if (control.value === '') return unset();
  const types = Array.isArray(schema.type) ? schema.type : [schema.type];
  if (control.tagName === 'SELECT') return JSON.parse(control.value);
  if (schema.format === 'date-time') {
    if (control.value === control.dataset.originalDisplay) return control.dataset.originalDateTime;
    const seconds = control.value.length === 16 ? ':00' : '';
    return `${control.value}${seconds}Z`;
  }
  if (types.includes('number') || types.includes('integer')) {
    return Number(control.value);
  }
  return control.value;
}

export default function renderDataIDEEAttributeForm(container, definition, initialValues, strings) {
  let currentValues = JSON.parse(JSON.stringify(initialValues || {}));
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
  const collect = () => {
    const result = {};
    definition.fields.forEach((field) => {
      if (isGeometry(field.schema) || field.supported === false || field.readOnly) {
        if (Object.hasOwn(currentValues, field.name)) {
          result[field.name] = JSON.parse(JSON.stringify(currentValues[field.name]));
        }
        return;
      }
      const value = collectValue(
        container,
        field.schema,
        `/${pointerPart(field.name)}`,
        currentValues[field.name],
        field.required,
      );
      if (value !== missingValue) result[field.name] = value;
    });
    return result;
  };
  render();
  container.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-array-action]');
    if (!button) return;
    currentValues = collect();
    const parts = button.dataset.arrayPath.split('/').slice(1)
      .map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'));
    let array = currentValues;
    parts.forEach((part) => { array = array?.[part]; });
    if (!Array.isArray(array)) {
      let parent = currentValues;
      parts.slice(0, -1).forEach((part) => { parent = parent?.[part]; });
      if (parent) {
        array = [];
        parent[parts.at(-1)] = array;
      }
    }
    if (button.dataset.arrayAction === 'add') {
      array.push(emptyValue(JSON.parse(button.dataset.itemSchema)));
    } else array.splice(Number(button.dataset.arrayIndex), 1);
    render();
  });
  return {
    collect,
    render,
    setIssues(issues) {
      container.querySelectorAll('.m-vectorsmanagement-dataidee-error')
        .forEach((node) => node.remove());
      issues.forEach((issue) => {
        const field = findByPath(container, 'data-field-path', issue.path);
        if (!field) return;
        const error = document.createElement('p');
        error.className = 'm-vectorsmanagement-dataidee-error';
        error.id = `dataidee-error-${encodeURIComponent(issue.path)}`;
        error.textContent = issue.message;
        field.appendChild(error);
        const control = field.querySelector('input,select');
        if (control) {
          control.setAttribute('aria-invalid', 'true');
          control.setAttribute('aria-describedby', error.id);
        }
      });
    },
  };
}
