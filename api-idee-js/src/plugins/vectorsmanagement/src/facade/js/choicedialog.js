/**
 * API dialog that asks the user to choose an action or cancel, used instead of
 * window.confirm and window.prompt. Cancel is the default choice: it has the
 * focus, and Escape selects it.
 */

const FOCUSABLE = 'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])';

/**
 * Keeps the Tab focus cycle inside a container.
 *
 * @param {KeyboardEvent} event Tab key event.
 * @param {HTMLElement} container Element whose focusable descendants form the cycle.
 */
export function keepTabInside(event, container) {
  const focusable = [...container.querySelectorAll(FOCUSABLE)];
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

/**
 * Opens the dialog and resolves with the chosen action.
 *
 * @param {Object} options
 * - id: Dialog identifier. While it is open, another request with the same id is
 *   ignored (it resolves with null). Each action button gets the id `${id}-${value}`.
 * - title: Dialog title, also its accessible name.
 * - message: Question shown to the user.
 * - choices: Actions, in order, as [{ value, label }].
 * - cancelLabel: Label of the button that cancels.
 * @returns {Promise<String|null>} Value of the chosen action, or null when cancelled.
 */
export default function askChoice({
  id, title, message, choices, cancelLabel,
}) {
  if (document.querySelector(`.m-dialog[data-choice="${id}"]`)) return Promise.resolve(null);
  const returnFocus = document.activeElement;
  return new Promise((resolve) => {
    const restoreFocus = () => {
      if (returnFocus?.isConnected) returnFocus.focus();
    };
    const dialog = IDEE.dialog.info(message, title, undefined, {
      actions: choices.map(({ value, label }) => ({
        id: `${id}-${value}`,
        label,
        onClick: (event, element) => {
          IDEE.dialog.removeElement(element);
          restoreFocus();
          resolve(value);
        },
      })),
    });
    dialog.dataset.choice = id;
    dialog.setAttribute('role', 'alertdialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', title);
    const cancel = IDEE.dialog.getCloseButton(dialog);
    cancel.textContent = cancelLabel;
    // The close button already removes the dialog.
    cancel.addEventListener('click', () => {
      restoreFocus();
      resolve(null);
    });
    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        cancel.click();
      } else if (event.key === 'Tab') keepTabInside(event, dialog);
    });
    cancel.focus();
  });
}
