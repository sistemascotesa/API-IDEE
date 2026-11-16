/**
 * Translated texts of the DataIDEE attribute form. Validation issues arrive as
 * language-neutral codes from the editing session and are worded only here.
 */
import { getValue } from './i18n/language';

const fillTemplate = (template, params = {}) => template.replace(
  /\{(\w+)\}/g,
  (match, key) => (params[key] === undefined ? match : String(params[key])),
);

const text = (key) => getValue(`dataidee_form.${key}`);

/**
 * Words a validation issue, falling back to its default text for unknown codes.
 *
 * @param {Object} issue Issue with code, params and message.
 * @returns {string} Message for the user.
 */
export function formatIssue(issue) {
  const key = issue.code === 'type' ? `type_${issue.params?.types?.[0]}` : issue.code;
  const template = key ? getValue(`dataidee_form.validation.${key}`) : undefined;
  return template ? fillTemplate(template, issue.params) : issue.message;
}

/**
 * Texts used by the form and its controls.
 *
 * @returns {Object} Translated strings and the "format" helper to fill their placeholders.
 */
export function createFormStrings() {
  return {
    format: fillTemplate,
    readOnly: text('read_only'),
    addItem: text('add_item'),
    removeItem: text('remove_item'),
    item: text('item'),
    trueValue: text('true_value'),
    falseValue: text('false_value'),
    unsupported: text('unsupported'),
    unsetValue: text('unset_value'),
    outOfDomain: text('out_of_domain'),
    dateTimeHint: text('datetime_hint'),
    storedValue: text('stored_value'),
    secondaryGeometry: text('secondary_geometry'),
    hintRange: text('hint_range'),
    hintMinimum: text('hint_minimum'),
    hintMaximum: text('hint_maximum'),
    hintGreaterThan: text('hint_greater_than'),
    hintLessThan: text('hint_less_than'),
    hintStep: text('hint_step'),
    counter: text('counter'),
    counterMin: text('counter_min'),
  };
}

/**
 * Announcement of how many fields still need attention.
 *
 * @param {number} count Fields with errors.
 * @returns {string} Announcement, empty when there are no errors.
 */
export function formatErrorCount(count) {
  if (count === 0) return '';
  return count === 1 ? text('error_count_one') : fillTemplate(text('error_count'), { count });
}

/**
 * Explains why the session refused to save.
 *
 * @param {Error} error Error with code VALIDATION raised by the editing session.
 * @param {Array<Object>} fields Fields of the collection form.
 * @returns {string} Message for the user.
 */
export function formatSaveValidationError(error, fields = []) {
  const [issue] = error.issues;
  const name = (issue.path.split('/')[1] || '').replace(/~1/g, '/').replace(/~0/g, '~');
  return fillTemplate(text('save_invalid'), {
    feature: error.featureKey.startsWith('new:') ? text('new_feature') : error.featureKey,
    field: fields.find((field) => field.name === name)?.title || name,
    message: formatIssue(issue),
  });
}
