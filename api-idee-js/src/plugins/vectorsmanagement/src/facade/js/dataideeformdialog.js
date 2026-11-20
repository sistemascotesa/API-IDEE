/**
 * Dialog of the DataIDEE attribute form: live feedback, error summary, focus and
 * the Apply and Cancel actions. Every rule comes from the injected editing session.
 * The form of a read-only collection, which has no session, only shows the attributes.
 */
import askChoice, { keepTabInside } from './choicedialog';
import renderDataIDEEAttributeForm from './dataideeattributeform';
import { createFormStrings, formatErrorCount, formatIssue } from './dataideeformmessages';
import { getValue } from './i18n/language';

const FIELD_CONTROL = 'input:not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled])';

const isBlocking = (issue) => !issue.preexisting;
const noop = () => {};

function loadDefinition(session, unavailableReason, feature, mode) {
  if (!session?.isSupportedForm()) {
    IDEE.dialog.info(unavailableReason || 'The DataIDEE collection schema is unavailable.');
    return null;
  }
  try {
    return session.getAttributeForm(feature, { mode });
  } catch (error) {
    IDEE.dialog.info(error.message);
    return null;
  }
}

/**
 * Form of a feature of a read-only collection, which has no editing session. Its fields
 * and values come from the capabilities of the layer, as in the "update" mode of the
 * session: without the identifier field, which the title already shows.
 *
 * @param {Object} capabilities Editing capabilities of the layer.
 * @param {String} unavailableReason Text shown when the collection has no usable schema.
 * @param {IDEE.Feature} feature Feature to consult.
 * @returns {Object|null} Form definition, or null when there is none.
 */
function loadReadOnlyDefinition(capabilities, unavailableReason, feature) {
  const form = capabilities?.form;
  if (!form?.available) {
    IDEE.dialog.info(unavailableReason || 'The DataIDEE collection schema is unavailable.');
    return null;
  }
  const values = JSON.parse(JSON.stringify(feature.getAttributes?.() || {}));
  delete values[form.idField?.name || ''];
  return {
    mode: 'update',
    title: form.title,
    collection: capabilities.collection?.id || capabilities.collection?.name || '',
    fields: form.properties,
    identifier: feature.getId(),
    values,
  };
}

function createSkeleton() {
  return '<div class="m-vectorsmanagement-dataidee-form">'
    + '<p class="m-vectorsmanagement-dataidee-identity"></p>'
    + '<p class="m-vectorsmanagement-dataidee-legend"></p>'
    + '<div class="m-vectorsmanagement-dataidee-errors" role="alert"></div>'
    + '<form class="m-vectorsmanagement-dataidee-fields" novalidate></form>'
    + '<p class="m-vectorsmanagement-dataidee-status" role="status"></p>'
    + '</div>';
}

function renderIssueSummary(container, issues, form) {
  if (!issues.length) {
    container.replaceChildren();
    return;
  }
  const details = document.createElement('details');
  details.open = true;
  const heading = document.createElement('summary');
  heading.textContent = getValue('dataidee_form.invalid_title');
  const list = document.createElement('ul');
  issues.forEach((issue) => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.issuePath = issue.path;
    const label = form.getFieldLabel(issue.path);
    const message = formatIssue(issue);
    button.textContent = label ? `${label}: ${message}` : message;
    item.appendChild(button);
    list.appendChild(item);
  });
  details.append(heading, list);
  container.replaceChildren(details);
}

function focusIssue(modal, path) {
  const field = [...modal.querySelectorAll('[data-field-path]')]
    .find((element) => element.dataset.fieldPath === path);
  (field?.querySelector(FIELD_CONTROL) || modal.querySelector('#m-vectorsmanagement-dataidee-apply'))
    ?.focus();
}

/**
 * Asks before discarding unapplied changes. "Keep editing" is the default choice.
 *
 * @param {Function} onDiscard Called when the changes are discarded.
 */
function confirmDiscard(onDiscard) {
  askChoice({
    id: 'm-vectorsmanagement-dataidee',
    title: getValue('dataidee_form.discard_title'),
    message: getValue('dataidee_form.confirm_close'),
    choices: [{ value: 'discard', label: getValue('dataidee_form.discard') }],
    cancelLabel: getValue('dataidee_form.keep_editing'),
  }).then((choice) => {
    if (choice === 'discard') onDiscard();
  });
}

/**
 * Opens the attribute form of a feature.
 *
 * @param {Object} options
 * - session: Active editing session.
 * - readOnly: Only shows the attributes of a feature of a read-only collection, which has
 *   no session: the form comes from capabilities, its fields are read-only and the only
 *   action is "Close".
 * - capabilities: Editing capabilities of the layer, for the read-only form.
 * - unavailableReason: Text shown when the session cannot provide a form.
 * - feature: Feature being edited or created.
 * - mode: "update" (default) or "create".
 * - onApplied: Called once the values have been accepted by the session.
 * - onCancelled: Called when the form is abandoned.
 * - onClosed: Called whenever the dialog closes.
 * - onDelete: In "update" mode, adds a "Delete" button that closes the form, drops its
 *   unapplied values and calls it with the feature, which the caller removes from the
 *   session (the deletion is sent when the session is saved).
 * @returns {boolean} Whether the dialog has been opened.
 */
export default function openDataIDEEFormDialog({
  session,
  readOnly = false,
  capabilities,
  unavailableReason,
  feature,
  mode = 'update',
  onApplied = noop,
  onCancelled = noop,
  onClosed = noop,
  onDelete,
}) {
  const definition = readOnly
    ? loadReadOnlyDefinition(capabilities, unavailableReason, feature)
    : loadDefinition(session, unavailableReason, feature, mode);
  if (!definition) return false;
  const title = mode === 'create'
    ? getValue('dataidee_form.create_title')
    : `${getValue('dataidee_form.title')} · ${definition.identifier}`;
  const previousFocus = document.activeElement;
  const modal = IDEE.dialog.info(createSkeleton(), title);
  const formContainer = modal.querySelector('.m-vectorsmanagement-dataidee-fields');
  const errorSummary = modal.querySelector('.m-vectorsmanagement-dataidee-errors');
  const status = modal.querySelector('.m-vectorsmanagement-dataidee-status');
  modal.querySelector('.m-vectorsmanagement-dataidee-identity').textContent = mode === 'create'
    ? definition.collection : `${definition.collection} · ${definition.identifier}`;
  modal.querySelector('.m-vectorsmanagement-dataidee-legend').textContent = getValue(readOnly
    ? 'dataidee_form.readonly_legend' : 'dataidee_form.legend');
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', title);

  let attempted = false;
  let summaryKey = '';
  let form = null;

  const showIssues = (issues) => {
    status.textContent = formatErrorCount(form.setIssues(issues, { all: attempted }));
    if (!attempted) return;
    const blocking = issues.filter(isBlocking);
    const key = blocking.map((issue) => `${issue.path}:${issue.code || issue.message}`).join('|');
    // The summary is an alert: repeating identical content would be announced again.
    if (key !== summaryKey) {
      summaryKey = key;
      renderIssueSummary(errorSummary, blocking, form);
    }
  };
  const evaluate = () => {
    const { values, inputIssues } = form.read();
    const unreadable = new Set(inputIssues.map((issue) => issue.path));
    // A control that cannot be read also looks empty: its own error is the useful one.
    const issues = session.validateAttributes(feature, values, { mode })
      .filter((issue) => !unreadable.has(issue.path));
    return { values, issues: [...inputIssues, ...issues] };
  };

  form = renderDataIDEEAttributeForm(
    formContainer,
    definition,
    definition.values,
    createFormStrings(),
    {
      formatIssue,
      onInteraction: readOnly ? noop : () => showIssues(evaluate().issues),
      readOnly,
    },
  );
  const initialFormValues = JSON.stringify(form.collect());
  const isDirty = () => JSON.stringify(form.collect()) !== initialFormValues;
  // Stored values that break the schema are reported as soon as the form opens.
  if (!readOnly) showIssues(evaluate().issues);

  errorSummary.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-issue-path]');
    if (button) focusIssue(modal, button.dataset.issuePath);
  });

  const closeButton = modal.querySelector('.m-button > button');
  let isApplied = false;
  const closeModal = () => {
    IDEE.dialog.removeElement(modal);
    onClosed();
    if (previousFocus?.isConnected) previousFocus.focus();
  };
  const reportFailure = (issues) => {
    showIssues(issues);
    focusIssue(modal, issues.find(isBlocking)?.path);
  };
  const cancel = () => {
    if (!isApplied) onCancelled(feature);
    closeModal();
  };
  // Cancel and Escape share this path: unapplied changes are confirmed first.
  const requestClose = () => (isDirty() ? confirmDiscard(cancel) : cancel());
  if (!readOnly && mode === 'update' && typeof onDelete === 'function') {
    IDEE.dialog.addAction({
      id: 'm-vectorsmanagement-dataidee-delete',
      label: getValue('dataidee_form.delete'),
      onClick: () => {
        closeModal();
        onDelete(feature);
      },
    }, modal);
  }
  IDEE.dialog.addAction({
    id: 'm-vectorsmanagement-dataidee-cancel',
    label: getValue(readOnly ? 'close' : 'dataidee_form.cancel'),
    onClick: requestClose,
  }, modal);
  if (!readOnly) {
    IDEE.dialog.addAction({
      id: 'm-vectorsmanagement-dataidee-apply',
      label: getValue('dataidee_form.apply'),
      onClick: () => {
        attempted = true;
        const { values, issues } = evaluate();
        if (issues.some(isBlocking)) {
          reportFailure(issues);
          return;
        }
        try {
          if (mode === 'create') {
            session.prepareFeature(feature, values, { applyDefaults: false });
          } else session.applyAttributes(feature, values);
          isApplied = true;
          onApplied(feature);
          closeModal();
        } catch (error) {
          reportFailure(error.issues || [{ path: '', message: error.message }]);
        }
      },
    }, modal);
  }
  closeButton.remove();
  formContainer.addEventListener('submit', (event) => event.preventDefault());
  modal.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      requestClose();
      return;
    }
    if (event.key === 'Tab') keepTabInside(event, modal);
  });
  modal.querySelector(FIELD_CONTROL)?.focus();
  return true;
}
