/**
 * Enhancements Integration
 * Monkey-patch existing functions to add UI enhancements
 */

import * as UI from './ui-helpers.js';

// Store original functions
let originalRunAnalyze = null;
let originalAcceptSuggestion = null;
let originalRenderSuggestions = null;
let originalToggleFavorite = null;
let originalSaveEdit = null;
let originalMountHomePage = null;

// Timer for analysis
let analyzeTimer = new UI.Timer(null);

/**
 * Patch runAnalyze to add loading states, timer and toasts
 */
function patchRunAnalyze() {
  if (originalRunAnalyze) return; // Already patched

  // Find the runAnalyze function in window context (it's exposed by workspace.ts)
  // We'll intercept it by adding event listeners to the analyze button

  const analyzeBtn = document.getElementById('btn-analyze');
  if (!analyzeBtn) return;

  analyzeBtn.addEventListener('click', function(e) {
    const suggestionsRoot = document.getElementById('suggestions-root');
    const timerRoot = document.getElementById('analyze-timer-root');

    // Show loading skeleton
    if (suggestionsRoot) {
      suggestionsRoot.innerHTML = `
        <div class="cards stagger-in">
          ${createSkeletonCard()}
          ${createSkeletonCard()}
        </div>
      `;
    }

    // Start timer
    analyzeTimer.reset();
    analyzeTimer.start();
    if (timerRoot && !timerRoot.querySelector('.timer-badge')) {
      const badge = analyzeTimer.createBadge();
      timerRoot.appendChild(badge);
    }
  }, { capture: true });

  // Listen for analysis completion
  document.addEventListener('analyze-complete', (e) => {
    const { count, elapsed } = e.detail;
    analyzeTimer.stop();

    if (count > 0) {
      UI.toastSuccess(
        'Analyse terminée',
        `${count} suggestion${count > 1 ? 's' : ''} trouvée${count > 1 ? 's' : ''} (${elapsed.toFixed(1)}s)`
      );
    } else {
      UI.toastInfo('Analyse terminée', 'Aucune suggestion trouvée. Essayez de reformuler le texte.');
    }
  });
}

/**
 * Add confetti when all suggestions are accepted
 */
function patchValidatedItems() {
  const observer = new MutationObserver((mutations) => {
    const validatedRoot = document.getElementById('validated-root');
    const suggestionsRoot = document.getElementById('suggestions-root');

    if (!validatedRoot || !suggestionsRoot) return;

    const validatedCount = validatedRoot.querySelectorAll('.validated-item').length;
    const emptyMessage = suggestionsRoot.querySelector('.empty');

    // Check if all suggestions were processed
    if (emptyMessage && validatedCount > 0 && !sessionStorage.getItem('confetti-shown')) {
      sessionStorage.setItem('confetti-shown', 'true');
      setTimeout(() => {
        UI.triggerConfetti(30);
        UI.toastSuccess('Bravo !', 'Tous les diagnostics ont été traités.');
      }, 300);
    }
  });

  const app = document.getElementById('app');
  if (app) {
    observer.observe(app, { childList: true, subtree: true });
  }
}

/**
 * Add ripple effect to all buttons
 */
function addRippleEffects() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement('span');
    ripple.className = 'ripple-effect';
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';

    if (btn.classList.contains('ripple') || btn.classList.contains('primary') || btn.classList.contains('secondary')) {
      btn.style.position = 'relative';
      btn.style.overflow = 'hidden';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    }
  }, { capture: true });
}

/**
 * Add heartburst animation to favorite toggles
 */
function enhanceFavoriteToggles() {
  document.addEventListener('click', (e) => {
    const favBtn = e.target.closest('.fav-toggle');
    if (!favBtn) return;

    UI.animateFavoriteHeart(favBtn);

    const isFav = favBtn.classList.contains('is-fav');
    const code = favBtn.getAttribute('data-fav-code');

    if (isFav && code) {
      UI.toastSuccess('Favori ajouté', `Le code ${code} a été ajouté à vos favoris.`);
    }
  }, { capture: true });
}

/**
 * Add shake effect to edit errors
 */
function enhanceEditErrors() {
  document.addEventListener('click', (e) => {
    const saveBtn = e.target.closest('[data-action="save-edit"]');
    if (!saveBtn) return;

    const card = saveBtn.closest('.card');
    if (!card) return;

    const codeInput = card.querySelector('.inp-code');
    const labelInput = card.querySelector('.inp-label');

    if ((!codeInput?.value || !labelInput?.value)) {
      UI.shakeElement(card);
      UI.toastError('Erreur', 'Veuillez remplir le code et le libellé.');
    }
  }, { capture: true });
}

/**
 * Enhance validated list with drag handles
 */
function enhanceValidatedList() {
  const validatedRoot = document.getElementById('validated-root');
  if (!validatedRoot) return;

  validatedRoot.addEventListener('dragstart', (e) => {
    const item = e.target.closest('.validated-item');
    if (!item) return;
    item.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  });

  validatedRoot.addEventListener('dragend', (e) => {
    const item = e.target.closest('.validated-item');
    if (!item) return;
    item.classList.remove('dragging');
  });

  validatedRoot.addEventListener('dragover', (e) => {
    e.preventDefault();
    const item = e.target.closest('.validated-item');
    if (!item) return;
    item.classList.add('drag-over');
  });

  validatedRoot.addEventListener('dragleave', (e) => {
    const item = e.target.closest('.validated-item');
    if (!item) return;
    item.classList.remove('drag-over');
  });
}

/**
 * Add copy-to-clipboard functionality with highlight
 */
function enhanceCopyCode() {
  document.addEventListener('click', (e) => {
    const codeEl = e.target.closest('.code');
    if (!codeEl) return;

    const code = codeEl.textContent;
    navigator.clipboard.writeText(code).then(() => {
      UI.highlightCopied(codeEl);
      UI.toastSuccess('Copié', `Le code ${code} a été copié dans le presse-papier.`);
    });
  });
}

/**
 * Initialize theme accent selector in settings
 */
function initThemeAccentSelector() {
  const settingsBody = document.querySelector('.settings-body');
  if (!settingsBody) return;

  // Check if accent selector already exists
  if (settingsBody.querySelector('.accent-selector')) return;

  const accentSection = document.createElement('div');
  accentSection.className = 'settings-block accent-selector';
  accentSection.innerHTML = `
    <h4 class="settings-block-title">Couleur d\'accent</h4>
    <div class="accent-options">
      <button type="button" class="accent-btn" data-accent="blue" style="background: #38bdf8" title="Bleu"></button>
      <button type="button" class="accent-btn" data-accent="purple" style="background: #a78bfa" title="Violet"></button>
      <button type="button" class="accent-btn" data-accent="pink" style="background: #f472b6" title="Rose"></button>
      <button type="button" class="accent-btn" data-accent="green" style="background: #34d399" title="Vert"></button>
      <button type="button" class="accent-btn" data-accent="orange" style="background: #fb923c" title="Orange"></button>
    </div>
  `;

  // Find position to insert (before or after API section)
  const apiSection = settingsBody.querySelector('.api-section--compact, .api-fields-grid');
  if (apiSection) {
    apiSection.after(accentSection);
  } else {
    settingsBody.appendChild(accentSection);
  }

  // Add event listeners
  accentSection.querySelectorAll('.accent-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const accent = btn.getAttribute('data-accent');
      UI.setAccentColor(accent);

      // Update active state
      accentSection.querySelectorAll('.accent-btn').forEach(b => {
        b.style.outline = 'none';
        b.style.outlineOffset = '0';
      });
      btn.style.outline = '2px solid var(--text)';
      btn.style.outlineOffset = '2px';
    });
  });

  // Set current accent as active
  const currentAccent = UI.getAccentColor();
  const currentBtn = accentSection.querySelector(`[data-accent="${currentAccent}"]`);
  if (currentBtn) {
    currentBtn.style.outline = '2px solid var(--text)';
    currentBtn.style.outlineOffset = '2px';
  }
}

/**
 * Add high contrast toggle
 */
function initHighContrastToggle() {
  const settingsBody = document.querySelector('.settings-body');
  if (!settingsBody) return;

  if (settingsBody.querySelector('.contrast-toggle')) return;

  const contrastSection = document.createElement('div');
  contrastSection.className = 'settings-block contrast-toggle';
  contrastSection.innerHTML = `
    <h4 class="settings-block-title">Accessibilité</h4>
    <label class="settings-mode-line" style="flex-direction: row; align-items: center; gap: 0.75rem;">
      <span class="settings-mode-label">Contraste élevé</span>
      <input type="checkbox" id="high-contrast-check" style="width: 1.2rem; height: 1.2rem; cursor: pointer;">
    </label>
    <p class="settings-hint">Augmente le contraste pour une meilleure lisibilité.</p>
  `;

  const accentSelector = settingsBody.querySelector('.accent-selector');
  if (accentSelector) {
    accentSelector.after(contrastSection);
  } else {
    settingsBody.appendChild(contrastSection);
  }

  const checkbox = contrastSection.querySelector('#high-contrast-check');
  checkbox.checked = UI.isHighContrast();
  checkbox.addEventListener('change', () => {
    UI.setHighContrast(checkbox.checked);
  });
}

/**
 * Show tutorial tooltip for first-time users
 */
function initTutorial() {
  if (UI.hasCompletedTutorial()) return;

  // Wait for app to be fully mounted
  setTimeout(() => {
    const steps = [
      {
        target: '#cr-text',
        title: 'Commencez ici',
        message: 'Saisissez ou collez votre compte-rendu médical dans cette zone de texte.'
      },
      {
        target: '#btn-analyze',
        title: 'Analysez le texte',
        message: 'Cliquez sur ce bouton pour extraire les codes CIM-10 pertinents de votre texte.'
      },
      {
        target: '#suggestions-root',
        title: 'Suggestions de codes',
        message: 'Les codes suggérés apparaissent ici. Validez, modifiez ou rejetez chaque proposition.'
      },
      {
        target: '#validated-root',
        title: 'Diagnostics retenus',
        message: 'Vos codes validés sont affichés ici. Réordonnez-les, ajoutez des notes ou exportez-les.'
      }
    ];

    const tutorial = new UI.Tutorial(steps);
    tutorial.start();
  }, 1000);
}

/**
 * Initialize all enhancements
 */
export function initEnhancements() {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
}

function initAll() {
  patchRunAnalyze();
  patchValidatedItems();
  addRippleEffects();
  enhanceFavoriteToggles();
  enhanceEditErrors();
  enhanceValidatedList();
  enhanceCopyCode();

  // Initialize theme options when settings page is opened
  const observer = new MutationObserver(() => {
    if (document.querySelector('.settings-body')) {
      initThemeAccentSelector();
      initHighContrastToggle();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Show tutorial for new users
  initTutorial();
}

// Auto-initialize
initEnhancements();
