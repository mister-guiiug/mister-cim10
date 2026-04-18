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
 * Create a spinner element
 * @param {string} size - 'sm' | 'lg' | ''
 */
export function createSpinner(size = '') {
  const spinner = document.createElement('div');
  spinner.className = `spinner${size ? ' spinner--' + size : ''}`;
  return spinner;
}

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

/**
 * Create a progress bar
 * @param {number} value - 0-100
 * @param {boolean} indeterminate - Show indeterminate animation
 */
export function createProgressBar(value = 0, indeterminate = false) {
  const container = document.createElement('div');
  container.className = 'progress-bar';
  if (indeterminate) container.classList.add('progress-bar--indeterminate');

  const fill = document.createElement('div');
  fill.className = 'progress-bar-fill';
  fill.style.width = indeterminate ? '30%' : `${value}%`;

  container.appendChild(fill);
  return { container, fill };
}

/* ── EMPTY STATES ──────────────────────────────────────────────────────────── */

/**
 * Create an empty state element
 * @param {string} icon - SVG icon string
 * @param {string} title - Empty state title
 * @param {string} message - Empty state message
 * @param {string} actionText - Action button text
 * @param {Function} onAction - Action button click handler
 */
export function createEmptyState(icon, title, message, actionText, onAction) {
  const container = document.createElement('div');
  container.className = 'empty-state';

  const iconEl = document.createElement('div');
  iconEl.className = 'empty-state-icon';
  iconEl.innerHTML = icon;

  const titleEl = document.createElement('h3');
  titleEl.className = 'empty-state-title';
  titleEl.textContent = title;

  const messageEl = document.createElement('p');
  messageEl.className = 'empty-state-message';
  messageEl.textContent = message;

  container.appendChild(iconEl);
  container.appendChild(titleEl);
  container.appendChild(messageEl);

  if (actionText && onAction) {
    const actionBtn = document.createElement('button');
    actionBtn.className = 'empty-state-action';
    actionBtn.textContent = actionText;
    actionBtn.addEventListener('click', onAction);
    container.appendChild(actionBtn);
  }

  return container;
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
 * Add ripple effect to button
 */
export function addRippleEffect(button) {
  button.classList.add('ripple');

  button.addEventListener('click', function(e) {
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';

    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
}

/**
 * Highlight copied text briefly
 */
export function highlightCopied(element) {
  element.classList.add('copied-highlight');
  setTimeout(() => element.classList.remove('copied-highlight'), 500);
}

/* ── CONFIDENCE GAUGE ──────────────────────────────────────────────────────── */

/**
 * Create a circular confidence gauge
 * @param {number} confidence - 0-100
 */
export function createConfidenceGauge(confidence) {
  const container = document.createElement('div');
  container.className = `confidence-gauge confidence-gauge--${confidence >= 75 ? 'high' : confidence >= 50 ? 'medium' : 'low'}`;

  const size = 32;
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (confidence / 100) * circumference;

  container.innerHTML = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle class="confidence-gauge-bg" cx="${size/2}" cy="${size/2}" r="${radius}"/>
      <circle class="confidence-gauge-fill" cx="${size/2}" cy="${size/2}" r="${radius}"
        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
    </svg>
    <div class="confidence-gauge-text">${Math.round(confidence)}</div>
  `;

  return container;
}

/* ── CATEGORY ICONS ─────────────────────────────────────────────────────────── */

export function getCategoryIcon(category) {
  const icons = {
    infectious: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a5 5 0 0 0-5 5v2a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z"/><path d="M16 11.37A4 4 0 0 1 12.63 8 4 4 0 0 0 9 8c-1.86 0-3 2-3 4v1a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5v-1a6 6 0 0 0-6-6z"/></svg>',
    neoplasms: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="2"/></svg>',
    endocrine: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 12c.44-3.88 3.44-7 7.5-7s7.06 3.12 7.5 7"/><path d="M6.5 12c.44 3.88 3.44 7 7.5 7s7.06-3.12 7.5-7"/></svg>',
    blood: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L8 6h3v6h2V6h3L12 2z"/><path d="M12 22l-4-4h3v-6h2v6h3l-4 4z"/></svg>',
    nervous: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>',
    circulatory: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.42 4.58a5.4 5.4 0 0 0-7.65 0l-.77.78-.77-.78a5.4 5.4 0 0 0-7.65 7.65l.77.78 7.65 7.65.77-.78 7.65-7.65a5.4 5.4 0 0 0 0-7.65z"/></svg>',
    respiratory: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a5 5 0 0 1 5 5v3a3 3 0 0 1-3 3h-4a3 3 0 0 1-3-3V7a5 5 0 0 1 5-5z"/><path d="M8 13a5 5 0 0 0 5 5v4a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2"/></svg>',
    digestive: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9Z"/><path d="M11.38 12a2.4 2.4 0 0 1-.4-4.77 2.4 2.4 0 0 1 3.2-2.77 2.4 2.4 0 0 1 3.47-.63 2.4 2.4 0 0 1 3.37 3.37 2.4 2.4 0 0 1-1.1 3.7 2.51 2.51 0 0 1 .03 1.1"/></svg>',
    genitourinary: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 10a2 2 0 0 0-2 2v6a2 2 0 0 0 4 0v-6a2 2 0 0 0-2-2z"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>',
    pregnancy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    skin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 16v-4"/><path d="M12 8h.01"/><path d="M9 9l1 1"/><path d="M14 14l1 1"/><path d="M15 9l-1 1"/><path d="M10 14l-1 1"/></svg>',
    musculoskeletal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M8 8l4 4 4-4"/><path d="M8 16l4-4 4 4"/></svg>',
    congenital: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
    perinatal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="6"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>',
    symptoms: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
    injury: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/><line x1="12" y1="7" x2="12" y2="17"/></svg>',
    external: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/><path d="M9 9l6 6"/><path d="M15 9l-6 6"/></svg>'
  };
  return icons[category] || icons.symptoms;
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

/* ── PAGE TRANSITIONS ───────────────────────────────────────────────────────── */

/**
 * Apply page transition to an element
 */
export function pageTransitionIn(element) {
  element.classList.add('page-transition-enter');
  setTimeout(() => element.classList.remove('page-transition-enter'), 300);
}

export function pageTransitionOut(element, callback) {
  element.classList.add('page-transition-exit');
  setTimeout(() => {
    element.classList.remove('page-transition-exit');
    if (callback) callback();
  }, 250);
}

/**
 * Apply stagger animation to list items
 */
export function staggerIn(container, selector = ':scope > *') {
  container.classList.add('stagger-in');
  const items = container.querySelectorAll(selector);
  items.forEach((item, index) => {
    item.style.animationDelay = `${index * 50}ms`;
  });
  setTimeout(() => container.classList.remove('stagger-in'), items.length * 50 + 300);
}

/* ── TUTORIAL / TOOLTIPS ────────────────────────────────────────────────────── */

let currentTutorial = null;

export class Tutorial {
  constructor(steps) {
    this.steps = steps;
    this.currentStep = 0;
    this.tooltip = null;
    this.highlightElement = null;
  }

  start() {
    if (this.steps.length === 0) return;
    this.currentStep = 0;
    this.showStep();
  }

  showStep() {
    this.hide();

    const step = this.steps[this.currentStep];
    const target = typeof step.target === 'string'
      ? document.querySelector(step.target)
      : step.target;

    if (!target) {
      console.warn('Tutorial target not found:', step.target);
      return;
    }

    // Highlight target
    target.classList.add('tour-highlight');
    this.highlightElement = target;

    // Create tooltip
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'tutorial-tooltip';

    // Position tooltip
    const rect = target.getBoundingClientRect();
    const tooltipWidth = 280;
    let top, left, arrowPos;

    if (rect.top > window.innerHeight / 2) {
      top = rect.top - tooltipWidth - 10;
      arrowPos = 'bottom';
    } else {
      top = rect.bottom + 10;
      arrowPos = 'top';
    }

    left = Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 20);
    left = Math.max(left, 10);

    this.tooltip.style.top = `${top}px`;
    this.tooltip.style.left = `${left}px`;
    this.tooltip.style.maxWidth = `${tooltipWidth}px`;

    this.tooltip.innerHTML = `
      <div class="tutorial-tooltip-arrow ${arrowPos}"></div>
      <div class="tutorial-title">${step.title}</div>
      <div class="tutorial-message">${step.message}</div>
      <div class="tutorial-steps">
        <span class="tutorial-step">Étape ${this.currentStep + 1} / ${this.steps.length}</span>
        <div class="tutorial-nav">
          <button class="secondary" id="tutorial-skip">Passer</button>
          ${this.currentStep < this.steps.length - 1
            ? '<button class="primary" id="tutorial-next">Suivant</button>'
            : '<button class="primary" id="tutorial-finish">Terminer</button>'
          }
        </div>
      </div>
    `;

    document.body.appendChild(this.tooltip);

    // Event listeners
    this.tooltip.querySelector('#tutorial-skip').addEventListener('click', () => this.end());
    this.tooltip.querySelector('#tutorial-next')?.addEventListener('click', () => this.next());
    this.tooltip.querySelector('#tutorial-finish')?.addEventListener('click', () => this.end());

    currentTutorial = this;
  }

  next() {
    if (this.currentStep < this.steps.length - 1) {
      this.currentStep++;
      this.showStep();
    }
  }

  hide() {
    if (this.highlightElement) {
      this.highlightElement.classList.remove('tour-highlight');
      this.highlightElement = null;
    }
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
  }

  end() {
    this.hide();
    currentTutorial = null;
    localStorage.setItem('mister-cim10-tutorial-completed', 'true');
  }
}

export function hasCompletedTutorial() {
  return localStorage.getItem('mister-cim10-tutorial-completed') === 'true';
}

export function resetTutorial() {
  localStorage.removeItem('mister-cim10-tutorial-completed');
}

/* ── UTILITY ───────────────────────────────────────────────────────────────── */

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ── THEME ACCENTS ─────────────────────────────────────────────────────────── */

export function setAccentColor(color) {
  document.documentElement.setAttribute('data-accent', color);
  localStorage.setItem('mister-cim10-accent', color);
}

export function getAccentColor() {
  return localStorage.getItem('mister-cim10-accent') || 'blue';
}

export function setHighContrast(enabled) {
  if (enabled) {
    document.documentElement.setAttribute('data-contrast', 'high');
    localStorage.setItem('mister-cim10-contrast', 'high');
  } else {
    document.documentElement.removeAttribute('data-contrast');
    localStorage.removeItem('mister-cim10-contrast');
  }
}

export function isHighContrast() {
  return localStorage.getItem('mister-cim10-contrast') === 'high';
}

// Initialize accent color from storage
const savedAccent = getAccentColor();
if (savedAccent) {
  document.documentElement.setAttribute('data-accent', savedAccent);
}

if (isHighContrast()) {
  document.documentElement.setAttribute('data-contrast', 'high');
}
