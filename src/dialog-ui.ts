/**
 * Custom dialog utilities replacing native alert() / confirm().
 * Uses the native <dialog> element for accessibility (focus trap, ESC, backdrop).
 *
 * @module dialog-ui
 */

/**
 * @param {string} message
 * @param {{ type?: 'confirm' | 'alert', okLabel?: string, cancelLabel?: string }} [options]
 * @returns {HTMLDialogElement}
 */
function buildDialog(message, { type = 'confirm', okLabel = 'OK', cancelLabel = 'Annuler' } = {}) {
  const el = document.createElement('dialog');
  el.className = 'app-dialog';

  const body = document.createElement('div');
  body.className = 'app-dialog-body';

  const p = document.createElement('p');
  p.className = 'app-dialog-message';
  p.textContent = message;
  body.appendChild(p);

  const actions = document.createElement('div');
  actions.className = 'app-dialog-actions';

  if (type === 'confirm') {
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'secondary';
    cancelBtn.dataset.result = 'cancel';
    cancelBtn.textContent = cancelLabel;
    actions.appendChild(cancelBtn);
  }

  const okBtn = document.createElement('button');
  okBtn.className = 'primary';
  okBtn.dataset.result = 'ok';
  okBtn.textContent = okLabel;
  actions.appendChild(okBtn);

  body.appendChild(actions);
  el.appendChild(body);
  document.body.appendChild(el);
  return el;
}

/**
 * Shows a styled confirmation dialog. Resolves to `true` if the user clicks OK,
 * `false` if they click Cancel or press Escape.
 *
 * @param {string} message
 * @param {{ okLabel?: string, cancelLabel?: string }} [options]
 * @returns {Promise<boolean>}
 */
export function showConfirm(message, options = {}) {
  return new Promise((resolve) => {
    const el = buildDialog(message, { type: 'confirm', ...options });

    function cleanup(result) {
      el.close();
      el.remove();
      resolve(result);
    }

    el.addEventListener('click', (e) => {
      const btn = /** @type {HTMLElement|null} */ (e.target.closest('[data-result]'));
      if (btn) cleanup(btn.dataset.result === 'ok');
    });

    // ESC key triggers the 'cancel' event on <dialog>
    el.addEventListener('cancel', () => cleanup(false));

    el.showModal();
    el.querySelector('[data-result="ok"]')?.focus();
  });
}

/**
 * Shows a styled alert dialog. Resolves when the user dismisses it.
 *
 * @param {string} message
 * @param {{ okLabel?: string }} [options]
 * @returns {Promise<void>}
 */
export function showAlert(message, options = {}) {
  return new Promise((resolve) => {
    const el = buildDialog(message, { type: 'alert', ...options });

    function cleanup() {
      el.close();
      el.remove();
      resolve(undefined);
    }

    el.addEventListener('click', (e) => {
      const btn = /** @type {HTMLElement|null} */ (e.target.closest('[data-result]'));
      if (btn) cleanup();
    });

    el.addEventListener('cancel', () => cleanup());

    el.showModal();
    el.querySelector('[data-result="ok"]')?.focus();
  });
}
