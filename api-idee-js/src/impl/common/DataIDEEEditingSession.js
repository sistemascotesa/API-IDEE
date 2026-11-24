import {
  containsExplicitNullChange,
  createDataIDEEIssue,
  createMergePatch,
  readDataIDEEPointer,
  validateDataIDEEValues,
} from './DataIDEEFormSchema';
import exceptionMessage from './exceptionMessage';

const sameJson = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const blockingIssues = (issues) => issues.filter((issue) => !issue.preexisting);

function mergeFormDefaults(base, override) {
  const result = { ...base };
  Object.entries(override || {}).forEach(([name, value]) => {
    if (value === undefined) return;
    const previous = result[name];
    const plainObject = (entry) => entry && typeof entry === 'object' && !Array.isArray(entry);
    result[name] = plainObject(previous) && plainObject(value)
      ? mergeFormDefaults(previous, value) : JSON.parse(JSON.stringify(value));
  });
  return result;
}

/** Local transaction journal for one bounded DataIDEE edit session. */
export default class DataIDEEEditingSession {
  constructor(layer, {
    features, capabilities, format, projection, limits, layerImpl, schema,
  }) {
    this.layer_ = layer;
    this.layerImpl_ = layerImpl;
    this.schema_ = schema;
    this.preparedFeatures_ = new WeakSet();
    this.source_ = layerImpl.olLayer.getSource();
    this.capabilities_ = capabilities;
    this.format_ = format;
    this.projection_ = projection;
    this.limits_ = limits;
    this.original_ = new Map();
    this.pending_ = new Map();
    this.currentCosts_ = new Map();
    this.saving_ = false;
    this.uncertain_ = false;
    this.localIds_ = new WeakMap();
    this.nextLocalId_ = 1;
    this.replaying_ = false;
    features.forEach((feature) => {
      const id = feature.getId();
      if (id === undefined || id === null) throw new Error(exceptionMessage('dataidee_missing_identifier'));
      this.original_.set(String(id), this.serialize_(feature));
      this.currentCosts_.set(String(id), this.cost_(this.original_.get(String(id))));
    });
    this.listeners_ = new Set();
    this.onAdd_ = (event) => {
      try {
        this.record(event.feature, true);
      } catch (error) {
        this.replaying_ = true;
        this.source_.removeFeature(event.feature);
        this.replaying_ = false;
        this.notify_(error);
      }
    };
    this.onChange_ = (event) => {
      try {
        this.record(event.feature);
      } catch (error) {
        this.notify_(error);
      }
    };
    this.onRemove_ = (event) => this.remove(event.feature);
    this.onClear_ = (event) => (event.features || []).forEach((feature) => this.remove(feature));
    this.source_.on('addfeature', this.onAdd_);
    this.source_.on('changefeature', this.onChange_);
    this.source_.on('removefeature', this.onRemove_);
    this.source_.on('clear', this.onClear_);
  }

  serialize_(feature) {
    const native = feature?.getImpl?.().getFeature?.() || feature;
    return this.format_.getImpl().writeFeatureObject(native, {
      featureProjection: this.projection_, defaultDataProjection: 'EPSG:4326',
    });
  }

  stable_(value) {
    if (Array.isArray(value)) return value.map((item) => this.stable_(item));
    if (value && typeof value === 'object') {
      const sorted = {};
      Object.keys(value).sort().forEach((key) => {
        sorted[key] = this.stable_(value[key]);
      });
      return sorted;
    }
    return value;
  }

  equivalent_(left, right) {
    const geometryEquals = (leftGeometry, rightGeometry) => {
      if (typeof leftGeometry === 'number' && typeof rightGeometry === 'number') {
        return Math.abs(leftGeometry - rightGeometry) <= 1e-9;
      }
      if (Array.isArray(leftGeometry) && Array.isArray(rightGeometry)) {
        return leftGeometry.length === rightGeometry.length
          && leftGeometry.every((value, index) => geometryEquals(value, rightGeometry[index]));
      }
      if (leftGeometry && rightGeometry && typeof leftGeometry === 'object'
        && typeof rightGeometry === 'object') {
        const leftKeys = Object.keys(leftGeometry).sort();
        const rightKeys = Object.keys(rightGeometry).sort();
        return JSON.stringify(leftKeys) === JSON.stringify(rightKeys)
          && leftKeys.every((key) => geometryEquals(leftGeometry[key], rightGeometry[key]));
      }
      return leftGeometry === rightGeometry;
    };
    return geometryEquals(left.geometry, right.geometry)
      && JSON.stringify(this.stable_(left.properties || {}))
        === JSON.stringify(this.stable_(right.properties || {}));
  }

  cost_(feature) {
    const coordinates = (value) => {
      if (!Array.isArray(value)) return 0;
      if (typeof value[0] === 'number') return 1;
      return value.reduce((sum, part) => sum + coordinates(part), 0);
    };
    const text = JSON.stringify(feature);
    return {
      coordinates: coordinates(feature.geometry?.coordinates),
      bytes: new Blob([text]).size,
    };
  }

  validateCost_(key, feature) {
    const nextCost = this.cost_(feature);
    const previous = this.currentCosts_.get(key) || { coordinates: 0, bytes: 0 };
    let coordinates = nextCost.coordinates;
    let bytes = nextCost.bytes;
    this.currentCosts_.forEach((cost, currentKey) => {
      if (currentKey !== key) {
        coordinates += cost.coordinates;
        bytes += cost.bytes;
      }
    });
    const featureCount = this.currentCosts_.size + (previous.bytes === 0 ? 1 : 0);
    if (featureCount > this.limits_.maxFeatures
      || coordinates > this.limits_.maxCoordinates || bytes > this.limits_.maxBytes) {
      throw new Error(exceptionMessage('dataidee_session_limits'));
    }
    return nextCost;
  }

  restoreFeature_(feature, serialized) {
    const restored = this.format_.getImpl().readFeature(JSON.stringify(serialized), {
      featureProjection: this.projection_, dataProjection: 'EPSG:4326',
    });
    const native = feature?.getImpl?.().getFeature?.() || feature;
    const original = restored?.getImpl?.().getFeature?.() || restored;
    if (!native || !original) return;
    Object.keys(native.getProperties()).forEach((name) => {
      if (name !== native.getGeometryName()
        && !Object.hasOwn(original.getProperties(), name)) native.unset(name);
    });
    const properties = original.getProperties();
    delete properties[original.getGeometryName()];
    native.setProperties(properties);
    native.setGeometry(original.getGeometry());
  }

  isSupportedForm() {
    return Boolean(this.capabilities_.form?.available);
  }

  getAttributeForm(feature, { mode = 'update' } = {}) {
    if (!this.isSupportedForm()) {
      throw new Error(this.capabilities_.form?.reason
        || exceptionMessage('dataidee_schema_unavailable'));
    }
    const native = feature?.getImpl?.().getFeature?.();
    if (!native || (mode === 'update' && !this.source_.hasFeature(native))) {
      throw new TypeError(exceptionMessage('dataidee_select_feature'));
    }
    const values = mode === 'create' ? {} : JSON.parse(JSON.stringify(feature.getAttributes?.() || {}));
    const idField = this.capabilities_.form.idField;
    if (mode === 'update') delete values[idField?.name || ''];
    else if (idField && !idField.readOnly && this.capabilities_.clientAssignedId) values[idField.name] = '';
    const fields = mode === 'create' && idField && this.capabilities_.clientAssignedId
      ? [...this.capabilities_.form.properties, idField] : this.capabilities_.form.properties;
    const defaults = mode === 'create' ? mergeFormDefaults(
      this.capabilities_.form.defaults,
      this.layerImpl_?.options?.dataideeDefaultProperties || {},
    ) : {};
    return {
      mode,
      title: this.capabilities_.form.title,
      collection: this.capabilities_.collection?.id || this.capabilities_.collection?.name || '',
      fields,
      identifier: mode === 'update' ? feature.getId() : undefined,
      values: { ...defaults, ...values },
    };
  }

  validateAttributes(feature, values, { mode = 'update' } = {}) {
    if (!this.isSupportedForm()) {
      return [createDataIDEEIssue('', 'schemaUnavailable', { reason: this.capabilities_.form?.reason })];
    }
    const native = feature?.getImpl?.().getFeature?.();
    if (!native || (mode === 'update' && !this.source_.hasFeature(native))) {
      return [createDataIDEEIssue('', 'noFeature')];
    }
    const unsupported = this.capabilities_.form.unsupportedPaths || [];
    if (mode === 'create') {
      const requiredUnsupported = (this.capabilities_.form.schema.required || []).find((name) => (
        unsupported.includes(`/${name}`)
      ));
      if (requiredUnsupported) {
        return [createDataIDEEIssue(`/${requiredUnsupported}`, 'unsupportedRequired')];
      }
    }
    const { schema } = this.capabilities_.form;
    const issues = this.validateSchemaValues_(values, mode);
    const idField = mode === 'create' ? this.capabilities_.form.idField : null;
    if (idField && this.capabilities_.clientAssignedId) {
      const idValue = values[idField.name];
      if (idValue === undefined || idValue === '') {
        issues.push(createDataIDEEIssue(`/${idField.name}`, 'identifierRequired'));
      } else {
        const idIssues = validateDataIDEEValues({ [idField.name]: idValue }, {
          type: 'object', properties: { [idField.name]: idField.schema }, required: [],
        }, 'create');
        issues.push(...idIssues);
      }
    }
    if (mode === 'update') {
      const baseline = this.original_.get(this.getFeatureKey_(feature))?.properties;
      const readOnlyIssues = this.validateReadOnly_(
        values,
        baseline || this.serialize_(feature).properties || {},
        schema,
        '',
      );
      return this.markPreexisting_(issues.concat(readOnlyIssues), values, baseline);
    }
    return issues;
  }

  /** Validates values against the schema. The identifier has its own rules on creation. */
  validateSchemaValues_(values, mode) {
    const { schema, idField, unsupportedPaths = [] } = this.capabilities_.form;
    if (mode !== 'create' || !idField) {
      return validateDataIDEEValues(values, schema, mode, unsupportedPaths);
    }
    const withoutId = (entries) => Object.fromEntries(Object.entries(entries || {})
      .filter(([name]) => name !== idField.name));
    return validateDataIDEEValues(withoutId(values), {
      ...schema,
      required: (schema.required || []).filter((name) => name !== idField.name),
      properties: withoutId(schema.properties),
    }, mode, unsupportedPaths);
  }

  /** Flags issues on stored values this edit has not changed, which must not block it. */
  markPreexisting_(issues, values, baseline) {
    if (!baseline) return issues;
    return issues.map((issue) => {
      const stored = readDataIDEEPointer(baseline, issue.path);
      return stored !== undefined && sameJson(stored, readDataIDEEPointer(values, issue.path))
        ? { ...issue, preexisting: true } : issue;
    });
  }

  validateReadOnly_(values, previous, schema, path) {
    const issues = [];
    if (schema.readOnly && JSON.stringify(values) !== JSON.stringify(previous)) {
      issues.push(createDataIDEEIssue(path, 'readOnly'));
      return issues;
    }
    Object.entries(schema.properties || {}).forEach(([name, child]) => {
      const pointer = `${path}/${name.replace(/~/g, '~0').replace(/\//g, '~1')}`;
      if (Object.hasOwn(values || {}, name)) {
        issues.push(...this.validateReadOnly_(values[name], previous?.[name], child, pointer));
      }
    });
    if (schema.items && Array.isArray(values)) {
      values.forEach((value, index) => (
        issues.push(...this.validateReadOnly_(value, previous?.[index], schema.items, `${path}/${index}`))
      ));
    }
    return issues;
  }

  applyAttributes(feature, values) {
    if (this.saving_ || this.uncertain_) {
      throw new Error(exceptionMessage('dataidee_session_locked'));
    }
    const issues = blockingIssues(this.validateAttributes(feature, values));
    if (issues.length) throw Object.assign(new Error(issues[0].message), { issues });
    const native = feature.getImpl().getFeature();
    const current = this.serialize_(feature);
    const currentProperties = current.properties || {};
    const properties = { ...currentProperties };
    this.capabilities_.form.properties.forEach((field) => {
      if (field.supported) {
        if (Object.hasOwn(values, field.name)) {
          properties[field.name] = this.mergeFormValue_(
            currentProperties[field.name],
            values[field.name],
            field.schema,
            field,
          );
        } else if (!field.readOnly) delete properties[field.name];
      }
    });
    const candidate = { ...current, properties };
    const key = this.getFeatureKey_(feature);
    const cost = this.validateCost_(key, candidate);
    Object.keys(currentProperties).forEach((name) => {
      if (!Object.hasOwn(properties, name)) native.unset(name);
    });
    feature.setAttributes(properties);
    this.currentCosts_.set(key, cost);
    this.record(feature);
    return feature;
  }

  mergeFormValue_(previous, next, schema, field) {
    if (field?.readOnly || field?.supported === false) return previous;
    if (Array.isArray(next)) {
      return next.map((item, index) => (
        this.mergeFormValue_(previous?.[index], item, schema.items || {}, field?.items)
      ));
    }
    if (next && typeof next === 'object') {
      const merged = previous && typeof previous === 'object' && !Array.isArray(previous)
        ? JSON.parse(JSON.stringify(previous)) : {};
      Object.entries(schema.properties || {}).forEach(([name, child]) => {
        const childModel = field?.properties?.find((item) => item.name === name);
        if (Object.hasOwn(next, name)) {
          if (childModel?.supported === false) return;
          merged[name] = this.mergeFormValue_(previous?.[name], next[name], child, childModel);
        } else if (!child.readOnly && Object.hasOwn(merged, name)) delete merged[name];
      });
      Object.keys(next).filter((name) => !Object.hasOwn(schema.properties || {}, name))
        .forEach((name) => { merged[name] = JSON.parse(JSON.stringify(next[name])); });
      return merged;
    }
    return next;
  }

  createPutFeature_(feature) {
    const candidate = JSON.parse(JSON.stringify(feature));
    const removeReadOnly = (value, schema = {}) => {
      if (!value || typeof value !== 'object') return;
      if (Array.isArray(value)) {
        value.forEach((item) => removeReadOnly(item, schema.items));
        return;
      }
      Object.entries(schema.properties || {}).forEach(([name, property]) => {
        if (property.readOnly || property['x-ogc-role'] === 'id') {
          // eslint-disable-next-line no-param-reassign
          delete value[name];
        } else removeReadOnly(value[name], property);
      });
    };
    removeReadOnly(candidate.properties || {}, this.capabilities_.form?.schema);
    return candidate;
  }

  findFeature_(key) {
    return this.source_.getFeatureById(key);
  }

  getFeatureKey_(feature) {
    // Local keys are stored by native feature; the facade wrapper is a different object.
    const native = feature?.getImpl?.().getFeature?.() || feature;
    const localKey = this.localIds_.get(native);
    if (localKey) return localKey;
    const id = native.getId();
    return id === undefined || id === null ? null : String(id);
  }

  record(target) {
    if (this.replaying_) return this.pending_.size;
    const feature = target?.getImpl?.().getFeature?.() || target;
    let key = this.getFeatureKey_(feature);
    if (!key) {
      key = `new:${this.nextLocalId_}`;
      this.nextLocalId_ += 1;
      this.localIds_.set(feature, key);
    }
    if (this.saving_) {
      const fallback = this.pending_.get(key)?.current || this.original_.get(key);
      if (fallback) {
        this.restoreFeature_(feature, fallback);
      } else {
        this.replaying_ = true;
        this.source_.removeFeature(feature);
        this.replaying_ = false;
      }
      return this.pending_.size;
    }
    const original = this.original_.get(key);
    const current = this.serialize_(feature);
    let cost;
    try {
      cost = this.validateCost_(key, current);
    } catch (error) {
      const previous = this.pending_.get(key)?.current || this.original_.get(key);
      if (previous) this.restoreFeature_(feature, previous);
      throw error;
    }
    this.currentCosts_.set(key, cost);
    if (original && this.equivalent_(original, current)) this.pending_.delete(key);
    else this.pending_.set(key, { type: original ? 'update' : 'create', feature, current });
    this.notify_();
    return this.pending_.size;
  }

  remove(feature) {
    if (this.replaying_) return this.pending_.size;
    if (this.saving_) {
      this.replaying_ = true;
      this.source_.addFeature(feature);
      this.replaying_ = false;
      return this.pending_.size;
    }
    const key = this.getFeatureKey_(feature);
    if (!key) return this.pending_.size;
    if (this.pending_.get(key)?.type === 'create') this.pending_.delete(key);
    else if (this.original_.has(key)) this.pending_.set(key, { type: 'delete', feature });
    this.currentCosts_.delete(key);
    this.notify_();
    return this.pending_.size;
  }

  get count() { return this.pending_.size; }

  get saving() { return this.saving_; }

  get requiresReview() { return this.uncertain_; }

  get state() {
    return { count: this.count, saving: this.saving_, requiresReview: this.uncertain_ };
  }

  subscribe(listener) {
    this.listeners_.add(listener);
    return () => this.listeners_.delete(listener);
  }

  notify_(error = null) {
    const state = { ...this.state, error };
    this.listeners_.forEach((listener) => listener(state));
  }

  prepareFeature(feature, values = {}, { applyDefaults = true } = {}) {
    const nativeFeature = feature?.getImpl?.().getFeature?.();
    if (!nativeFeature) throw new TypeError(exceptionMessage('dataidee_vector_feature_required'));
    if (!this.isSupportedForm()) {
      throw new Error(this.capabilities_.form?.reason
        || exceptionMessage('dataidee_schema_unavailable'));
    }
    const defaults = mergeFormDefaults(
      this.capabilities_.form.defaults,
      this.layerImpl_?.options?.dataideeDefaultProperties || {},
    );
    // The form already supplied defaults and may have deliberately cleared them.
    const properties = applyDefaults
      ? mergeFormDefaults(defaults, values) : JSON.parse(JSON.stringify(values));
    this.capabilities_.form.properties.forEach((field) => {
      if (field.readOnly || field.writeOnly) delete properties[field.name];
    });
    const issues = this.validateAttributes(feature, properties, { mode: 'create' });
    if (issues.length) throw Object.assign(new Error(issues[0].message), { issues });
    delete properties[this.capabilities_.form.idField?.name || ''];
    const geometry = nativeFeature.getGeometry()?.getType()?.toLowerCase();
    if (this.capabilities_.geometryTypes?.length
      && !this.capabilities_.geometryTypes.includes(geometry)) {
      throw new Error(exceptionMessage('dataidee_geometry_unsupported', { geometry }));
    }
    if (this.capabilities_.clientAssignedId) {
      const idName = this.capabilities_.form.idField?.name || 'id';
      const idValue = values[idName];
      const duplicateId = this.original_.has(String(idValue))
        || [...this.pending_.values()].some((item) => (
          String(item.feature.getId()) === String(idValue)
        ));
      if (idValue !== undefined && idValue !== '' && duplicateId) {
        throw new Error(exceptionMessage('dataidee_duplicate_identifier'));
      }
      let normalizedId = idValue;
      if (idValue === '') normalizedId = undefined;
      else if (this.capabilities_.idType === 'integer') normalizedId = Number(idValue);
      nativeFeature.setId(normalizedId);
    } else nativeFeature.setId(undefined);
    feature.setAttributes(properties);
    this.preparedFeatures_.add(nativeFeature);
    return feature;
  }

  discard() {
    this.replaying_ = true;
    try {
      this.pending_.forEach((change, key) => {
        const source = this.source_;
        if (change.type === 'create') source.removeFeature(change.feature);
        else if (change.type === 'delete') {
          this.restoreFeature_(change.feature, this.original_.get(key));
          source.addFeature(change.feature);
        } else {
          const target = change.feature || this.findFeature_(key);
          if (target) this.restoreFeature_(target, this.original_.get(key));
        }
      });
      this.pending_.clear();
      this.currentCosts_.clear();
      this.original_.forEach((feature, key) => this.currentCosts_.set(key, this.cost_(feature)));
      return 0;
    } finally {
      this.replaying_ = false;
      this.notify_();
    }
  }

  /** Issues introduced by a pending change, whichever path produced that change. */
  validatePendingChange_(key, change) {
    const properties = change.current.properties || {};
    if (change.type === 'create') {
      // Unprepared creations receive these defaults in the write itself.
      const defaults = this.preparedFeatures_.has(change.feature)
        ? {} : this.layerImpl_?.options?.dataideeDefaultProperties;
      return this.validateSchemaValues_({ ...defaults, ...properties }, 'create');
    }
    const baseline = this.original_.get(key)?.properties || {};
    return this.validateSchemaValues_(properties, 'update')
      .concat(this.validateReadOnly_(properties, baseline, this.capabilities_.form.schema, ''))
      .filter((issue) => !sameJson(
        readDataIDEEPointer(baseline, issue.path),
        readDataIDEEPointer(properties, issue.path),
      ));
  }

  /** Rejects the whole save before its first write, so no partial state is produced. */
  assertPendingChangesValid_() {
    if (!this.isSupportedForm()) return;
    this.pending_.forEach((change, key) => {
      if (change.type === 'delete') return;
      const issues = this.validatePendingChange_(key, change);
      if (issues.length) {
        throw Object.assign(new Error(exceptionMessage('dataidee_invalid_attributes', {
          feature: key, message: issues[0].message,
        })), {
          code: 'VALIDATION', issues, featureKey: key,
        });
      }
    });
  }

  async save() {
    if (this.uncertain_) {
      throw new Error(exceptionMessage('dataidee_uncertain_write'));
    }
    if (this.saving_) throw new Error(exceptionMessage('dataidee_save_in_progress'));
    this.assertPendingChangesValid_();
    this.saving_ = true;
    const completed = [];
    try {
      // Sequential writes preserve a clear partial-success boundary on the first failure.
      // eslint-disable-next-line no-restricted-syntax
      for (const [key, change] of this.pending_) {
        let committedKey = key;
        let committedFeature = change.current;
        if (change.type === 'create') {
          let result;
          try {
            // eslint-disable-next-line no-await-in-loop
            result = await this.layer_.createFeature(change.current, {
              applyDefaults: !this.preparedFeatures_.has(change.feature),
            });
          } catch (error) {
            if (!Number.isInteger(error.status) || error.status >= 500) this.uncertain_ = true;
            throw error;
          }
          this.layer_.clearCache();
          const saved = result.feature;
          const serverId = saved?.id ?? (saved?.properties?.id);
          if (serverId !== undefined && serverId !== null) {
            this.replaying_ = true;
            change.feature.setId(serverId);
            if (saved.properties) change.feature.setProperties(saved.properties);
            this.replaying_ = false;
            committedKey = String(serverId);
            this.localIds_.set(change.feature, committedKey);
            committedFeature = saved;
            const cost = this.currentCosts_.get(key);
            this.currentCosts_.delete(key);
            if (cost) this.currentCosts_.set(committedKey, cost);
          } else {
            this.uncertain_ = true;
            throw new Error(exceptionMessage('dataidee_create_without_id'));
          }
        } else {
          const id = change.feature.getId();
          // eslint-disable-next-line no-await-in-loop
          const { feature: remote, etag } = await this.layer_.getEditingFeature(id);
          const original = this.original_.get(key);
          if (!this.equivalent_(remote, original)) {
            const error = new Error(exceptionMessage('dataidee_feature_changed', { id }));
            error.code = 'CONFLICT';
            throw error;
          }
          if (change.type === 'delete') {
            try {
              // eslint-disable-next-line no-await-in-loop
              await this.layer_.deleteFeature(id, etag);
            } catch (error) {
              if (!Number.isInteger(error.status) || error.status >= 500) this.uncertain_ = true;
              throw error;
            }
            this.layer_.clearCache();
          } else {
            // eslint-disable-next-line no-await-in-loop
            const update = this.layer_.updateFeature;
            const baseline = this.original_.get(key);
            const geometryChanged = JSON.stringify(this.stable_(baseline.geometry))
              !== JSON.stringify(this.stable_(change.current.geometry));
            const propertyPatch = createMergePatch(
              baseline.properties || {},
              change.current.properties || {},
            );
            const hasNull = containsExplicitNullChange(
              baseline.properties || {},
              change.current.properties || {},
            );
            const canMergePatch = this.capabilities_.updateMethods?.patchAvailable !== false
              && (this.capabilities_.updateMethods?.patch?.includes('application/merge-patch+json')
              || this.capabilities_.updateMethods?.patch?.length === 0);
            const canPut = this.capabilities_.updateMethods?.put?.includes('application/geo+json');
            if (hasNull && !canPut) throw new Error(exceptionMessage('dataidee_explicit_null'));
            let method = this.capabilities_.updateMethod;
            if (canMergePatch) method = 'PATCH';
            // Replace the complete editable feature when GeoJSON PUT is advertised.
            if (canPut) method = 'PUT';
            try {
              // eslint-disable-next-line no-await-in-loop
              const saved = await update.call(this.layer_, id, change.current, method, etag, {
                geometryChanged,
                propertiesPatch: method === 'PATCH' ? propertyPatch : undefined,
                putFeature: method === 'PUT' ? this.createPutFeature_(change.current) : undefined,
              });
              if (saved) committedFeature = saved;
              else {
                // eslint-disable-next-line no-await-in-loop
                committedFeature = (await this.layer_.getEditingFeature(id)).feature;
              }
              this.replaying_ = true;
              this.restoreFeature_(change.feature, committedFeature);
              this.replaying_ = false;
            } catch (error) {
              if (!Number.isInteger(error.status) || error.status >= 500) this.uncertain_ = true;
              throw error;
            }
            this.layer_.clearCache();
          }
        }
        completed.push(key);
        this.pending_.delete(key);
        if (change.type === 'delete') this.original_.delete(key);
        else this.original_.set(committedKey, committedFeature);
      }
      return { completed, pending: this.pending_.size };
    } finally {
      this.saving_ = false;
      this.notify_();
    }
  }

  destroy() {
    this.source_.un('addfeature', this.onAdd_);
    this.source_.un('changefeature', this.onChange_);
    this.source_.un('removefeature', this.onRemove_);
    this.source_.un('clear', this.onClear_);
    this.listeners_.clear();
  }
}
