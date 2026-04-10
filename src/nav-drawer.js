/** @type {((e: KeyboardEvent) => void) | null} */
let escapeKeyHandler = null;

export function wireNavDrawer() {
  const toggle = document.getElementById('nav-menu-toggle');
  const shell = document.getElementById('nav-shell');
  const backdrop = document.getElementById('nav-backdrop');
  const closeBtn = document.getElementById('nav-drawer-close');
  const panel = document.getElementById('site-nav-drawer');

  if (escapeKeyHandler) {
    document.removeEventListener('keydown', escapeKeyHandler);
    escapeKeyHandler = null;
  }

  if (!toggle || !shell) return;

  function isOpen() {
    return !shell.hidden;
  }

  function open() {
    shell.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    toggle.classList.add('nav-menu-toggle--open');
    document.body.classList.add('nav-drawer-open');
    closeBtn?.focus();
  }

  function close() {
    shell.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.classList.remove('nav-menu-toggle--open');
    document.body.classList.remove('nav-drawer-open');
    toggle.focus();
  }

  toggle.addEventListener('click', () => {
    if (isOpen()) close();
    else open();
  });

  backdrop?.addEventListener('click', () => close());
  closeBtn?.addEventListener('click', () => close());

  panel?.querySelectorAll('a[href^="#"]').forEach((el) => {
    el.addEventListener('click', () => close());
  });

  escapeKeyHandler = (e) => {
    if (e.key === 'Escape' && isOpen()) {
      e.preventDefault();
      close();
    }
  };
  document.addEventListener('keydown', escapeKeyHandler);
}
