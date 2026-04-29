/**
 * Enhancements Integration
 * Monkey-patch existing functions to add UI enhancements
 */

import * as UI from './ui-helpers.js';

// Timer for analysis
let analyzeTimer = new UI.Timer(null);

/**
 * Patch runAnalyze to add loading states, timer and toasts
 */
function patchRunAnalyze() {
  const analyzeBtn = document.getElementById('btn-analyze');
  if (!analyzeBtn || analyzeBtn.dataset.enhanced) return; // Already patched
  analyzeBtn.dataset.enhanced = '1';

  analyzeBtn.addEventListener('click', function(e) {
    const suggestionsRoot = document.getElementById('suggestions-root');
    const timerRoot = document.getElementById('analyze-timer-root');

    // Show loading skeleton
    if (suggestionsRoot) {
      suggestionsRoot.innerHTML = `
        <div class="cards stagger-in">
          ${UI.createSkeletonCard()}
          ${UI.createSkeletonCard()}
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
  enhanceCopyCode();
}

// Auto-initialize
initEnhancements();
