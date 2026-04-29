/**
 * UI Helpers - Toast notifications, loading states, micro-interactions
 */

/* ── TOAST NOTIFICATIONS ───────────────────────────────────────────────────── */

const toastContainer = document.createElement('div');
toastContainer.className = 'toast-container';
document.body.appendChild(toastContainer);

const toastIcons = {
  success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
};

/**
 * Show a toast notification
 * @param {string} title - Toast title
 * @param {string} message - Toast message
 * @param {string} type - 'success' | 'error' | 'info' | 'warning'
 * @param {number} duration - Auto-dismiss duration in ms (0 for no auto-dismiss)
 */
export function toast(title, message, type = 'info', duration = 4000) {
  const toastEl = document.createElement('div');
  toastEl.className = `toast toast--${type}`;
  toastEl.innerHTML = `
    <div class="toast-icon">${toastIcons[type]}</div>
    <div class="toast-content">
      <div class="toast-title">${escapeHtml(title)}</div>
      ${message ? `<div class="toast-message">${escapeHtml(message)}</div>` : ''}
    </div>
    <button class="toast-close" aria-label="Fermer">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    ${duration > 0 ? '<div class="toast-progress" style="animation-duration: ' + duration + 'ms"></div>' : ''}
  `;

  toastContainer.appendChild(toastEl);

  // Close button handler
  const closeBtn = toastEl.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => dismissToast(toastEl));

  // Auto-dismiss
  if (duration > 0) {
    setTimeout(() => dismissToast(toastEl), duration);
  }

  return toastEl;
}

function dismissToast(toastEl) {
  if (!toastEl.parentElement) return;
  toastEl.classList.add('toast-out');
  setTimeout(() => toastEl.remove(), 300);
}

// Convenience methods
export const toastSuccess = (title, message, duration) => toast(title, message, 'success', duration);
export const toastError = (title, message, duration) => toast(title, message, 'error', duration);
export const toastInfo = (title, message, duration) => toast(title, message, 'info', duration);
export const toastWarning = (title, message, duration) => toast(title, message, 'warning', duration);

/* ── LOADING STATES ───────────────────────────────────────────────────────── */

/**
 * Create a skeleton card
 */
export function createSkeletonCard() {
  return `
    <div class="skeleton-card">
      <div class="skeleton-card-header">
        <div class="skeleton skeleton-badge"></div>
        <div class="skeleton skeleton-code"></div>
        <div class="skeleton skeleton-label"></div>
      </div>
      <div class="skeleton skeleton-meta"></div>
      <div class="skeleton skeleton-actions">
        <div class="skeleton skeleton-btn"></div>
        <div class="skeleton skeleton-btn"></div>
      </div>
    </div>
  `;
}

/* ── MICRO-INTERACTIONS ─────────────────────────────────────────────────────── */

/**
 * Trigger heartburst animation on favorite toggle
 */
export function animateFavoriteHeart(element) {
  element.classList.remove('burst');
  void element.offsetWidth; // Trigger reflow
  element.classList.add('burst');
  setTimeout(() => element.classList.remove('burst'), 500);
}

/**
 * Shake an element (for error feedback)
 */
export function shakeElement(element) {
  element.classList.remove('shake');
  void element.offsetWidth;
  element.classList.add('shake');
  setTimeout(() => element.classList.remove('shake'), 500);
}

/**
 * Confetti explosion
 */
export function triggerConfetti(count = 50) {
  const container = document.createElement('div');
  container.className = 'confetti-container';
  document.body.appendChild(container);

  const colors = ['#38bdf8', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#f472b6'];

  for (let i = 0; i < count; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + '%';
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    confetti.style.animation = `confetti-fall ${1.5 + Math.random()}s linear forwards`;
    confetti.style.animationDelay = Math.random() * 0.3 + 's';
    container.appendChild(confetti);
  }

  setTimeout(() => container.remove(), 2500);
}

/**
 * Highlight copied text briefly
 */
export function highlightCopied(element) {
  element.classList.add('copied-highlight');
  setTimeout(() => element.classList.remove('copied-highlight'), 500);
}

/* ── TIMER ──────────────────────────────────────────────────────────────────── */

export class Timer {
  constructor(displayElement) {
    this.display = displayElement;
    this.startTime = null;
    this.interval = null;
    this.running = false;
  }

  start() {
    if (this.running) return;
    this.startTime = Date.now();
    this.running = true;
    this.interval = setInterval(() => this.update(), 100);
  }

  stop() {
    this.running = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    return this.getElapsed();
  }

  reset() {
    this.stop();
    this.startTime = null;
    if (this.display) this.display.textContent = '0.0s';
  }

  update() {
    if (!this.running || !this.startTime) return;
    const elapsed = this.getElapsed();
    if (this.display) {
      this.display.textContent = elapsed.toFixed(1) + 's';
    }
  }

  getElapsed() {
    if (!this.startTime) return 0;
    return (Date.now() - this.startTime) / 1000;
  }

  createBadge() {
    const badge = document.createElement('div');
    badge.className = 'timer-badge';
    badge.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      <span class="timer-display">0.0s</span>
    `;
    this.display = badge.querySelector('.timer-display');
    return badge;
  }
}

/* ── UTILITY ───────────────────────────────────────────────────────────────── */

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
