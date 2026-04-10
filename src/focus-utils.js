/** Met le focus sur la zone principale après navigation (lecteurs d’écran, clavier). */
export function focusMainContent() {
  const el = document.getElementById('main-content');
  if (el && typeof el.focus === 'function') {
    el.focus({ preventScroll: true });
  }
}
