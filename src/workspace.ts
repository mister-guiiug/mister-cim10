import { suggestFromText } from './analyzer.js';
import { icdEntries } from './icd10-data.js';
import { randomId } from './random-id.js';
import { createSpeechRecognizer, isSpeechRecognitionSupported } from './speech.js';
import { escapeHtml } from './html-utils.js';
import { showConfirm, showAlert } from './dialog-ui.js';
// UI Enhancements
import * as UI from './ui-helpers.js';
import { buildAppHeaderHtml } from './header-html.js';
import { wireThemeToggle } from './theme.js';
import { wireNavDrawer } from './nav-drawer.js';
import {
  getStoredAnalyzeMode,
  isSettingsReadyForDailyUse,
  MODE_SUMMARY_LABEL,
  readAnalyzeSettings,
} from './app-settings.js';
import { refreshWorkspaceChrome } from './header-chrome.js';
import {
  exportCsv,
  exportJson,
  exportTextFile,
  exportViaEmail,
  shareExport,
} from './export-report.js';
import { buildHomeWorkspaceHtml } from './home-html.js';
import {
  loadCrHistory,
  saveCrHistory,
  clearCrHistory,
  saveValidatedSession as saveValidatedSessionToStorage,
  loadValidatedSession,
  clearValidatedSession,
  loadNamedSessions,
  saveNamedSession,
  loadNamedSession,
  deleteNamedSession,
  loadFavorites,
  toggleFavorite,
  LS_CR_HISTORY,
} from './storage.js';

/** Sauvegarde l'état `validated` courant dans localStorage. */
function saveValidatedSession() {
  saveValidatedSessionToStorage(validated);
}

/** @type {{ id: string; code: string; label: string; statut: 'validé' | 'modifié'; matchedTerm?: string }[]} */
let validated = [];
/** @type {Map<string, 'pending' | 'accepted' | 'rejected'>} */
const suggestionState = new Map();
let suggestions = [];
let dictationPrefix = '';
let recognizer = null;
let listening = false;
let lastAnalyze = { ran: false, hadText: false, count: 0 };

/** @type {Array<{validated: any[], compteRendu: string}>} */
let undoStack = [];

function pushUndo(cr) {
  undoStack.push({ validated: JSON.parse(JSON.stringify(validated)), compteRendu: cr });
  if (undoStack.length > 20) undoStack.shift();
}

function popUndo() {
  return undoStack.pop() || null;
}
function renderCrHistory() {
  const ta = /** @type {HTMLTextAreaElement} */ (document.getElementById('cr-text'));
  const root = document.getElementById('cr-history-root');
  if (!root || !ta) return;
  const history = loadCrHistory();
  if (!history.length) {
    root.hidden = true;
    root.innerHTML = '';
    return;
  }
  root.hidden = false;
  root.innerHTML = `
    <details class="cr-history-details">
      <summary class="cr-history-summary">Historique (${history.length})
        <button type="button" class="cr-history-clear ghost" title="Effacer tout l'historique">Effacer</button>
      </summary>
      <ul class="cr-history-list">
        ${history
          .map(
            (t, i) => `
          <li class="cr-history-item">
            <button type="button" class="cr-history-btn ghost" data-idx="${i}" title="${escapeHtml(t)}">
              ${escapeHtml(t.length > 80 ? t.slice(0, 80) + '\u2026' : t)}
            </button>
            <button type="button" class="cr-history-del ghost" data-del="${i}" aria-label="Supprimer cette entrée">\u00d7</button>
          </li>`
          )
          .join('')}
      </ul>
    </details>`;
  root.querySelectorAll('.cr-history-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = Number(btn.getAttribute('data-idx'));
      const h = loadCrHistory();
      if (h[idx] !== undefined) {
        ta.value = h[idx];
        window.__savedCrText = h[idx];
        ta.focus();
      }
    });
  });
  root.querySelectorAll('.cr-history-del').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = Number(btn.getAttribute('data-del'));
      const h = loadCrHistory();
      h.splice(idx, 1);
      localStorage.setItem(LS_CR_HISTORY, JSON.stringify(h));
      renderCrHistory();
    });
  });
  root.querySelector('.cr-history-clear')?.addEventListener('click', (e) => {
    e.stopPropagation();
    clearCrHistory();
    renderCrHistory();
  });
}

const app = () => document.getElementById('app');

function hideAnalyzeError() {
  const el = document.getElementById('analyze-error');
  if (el) {
    el.hidden = true;
    el.textContent = '';
  }
}

function showAnalyzeError(msg) {
  const el = document.getElementById('analyze-error');
  if (el) {
    el.textContent = msg;
    el.hidden = false;
  }
}

async function runAnalyze() {
  hideAnalyzeError();
  const ta = /** @type {HTMLTextAreaElement} */ (document.getElementById('cr-text'));
  const btn = /** @type {HTMLButtonElement} */ (document.getElementById('btn-analyze'));
  if (!ta) return;

  const text = ta.value.trim();
  if (btn) btn.disabled = true;
  if (text) saveCrHistory(text);

  try {
    const cfg = readAnalyzeSettings();
    const useLocal = cfg.mode === 'local' || cfg.mode === 'both';
    const useApi = cfg.mode === 'api' || cfg.mode === 'both';

    let localList = [];
    if (useLocal) {
      try {
        localList = text ? suggestFromText(text) : [];
      } catch (err) {
        console.error(err);
        showAnalyzeError(
          'Les suggestions intégrées n’ont pas pu être calculées. Réessayez avec un texte plus court ou un navigateur à jour.'
        );
        localList = [];
      }
    }

    let whoList = [];
    if (text && useApi) {
      if (!cfg.clientId || !cfg.clientSecret) {
        showAnalyzeError(
          'Indiquez l’identifiant client et le mot secret fournis par l’OMS (compte sur icd.who.int/icdapi).'
        );
      } else if (!cfg.proxyUrl) {
        showAnalyzeError(
          'Indiquez l’adresse de la passerelle : sans elle, cette page ne peut en général pas joindre le service de l’OMS.'
        );
      } else {
        try {
          const { fetchWhoIcd11AutocodeSuggestions } = await import('./who-icd-api.js');
          whoList = await fetchWhoIcd11AutocodeSuggestions(cfg.clientId, cfg.clientSecret, text, {
            releaseId: cfg.releaseId,
            lang: cfg.lang,
            matchThreshold: 0.32,
            maxPhrases: 10,
            proxyBase: cfg.proxyUrl,
          });
        } catch (err) {
          console.error(err);
          const msg = err instanceof Error ? err.message : String(err);
          showAnalyzeError(
            `Connexion OMS : ${msg} Vérifiez l’adresse de la passerelle, les autorisations d’accès pour ce site et vos identifiants.`
          );
        }
      }
    }

    const seen = new Set();
    suggestions = [];
    for (const s of [...whoList, ...localList]) {
      if (seen.has(s.code)) continue;
      seen.add(s.code);
      suggestions.push(s);
    }
    suggestions.sort((a, b) => {
      const srcA = a.source === 'who11' ? 0 : 1;
      const srcB = b.source === 'who11' ? 0 : 1;
      if (srcA !== srcB) return srcA - srcB;
      return b.confidence - a.confidence;
    });
    if (suggestions.length > 35) suggestions = suggestions.slice(0, 35);

    suggestionState.clear();
    for (const s of suggestions) suggestionState.set(s.id, 'pending');

    lastAnalyze = {
      ran: true,
      hadText: text.length > 0,
      count: suggestions.length,
    };

    renderSuggestions();
    renderCrHistory();
  } finally {
    if (btn) btn.disabled = false;
  }
}

const ICD10_CODE_RE = /^[A-Z]\d{2}(\.\d{1,4})?$/;

function validateIcd10Code(code) {
  return ICD10_CODE_RE.test(code.trim().toUpperCase());
}

function findParentEntry(code) {
  const dot = code.indexOf('.');
  if (dot <= 0) return null;
  const parentCode = code.slice(0, dot);
  return icdEntries.find((e) => e.code === parentCode) || null;
}

function confidenceLabel(confidence) {
  if (confidence >= 0.7) return { text: 'Élevée', cls: 'conf-high' };
  if (confidence >= 0.4) return { text: 'Moyenne', cls: 'conf-med' };
  return { text: 'Faible', cls: 'conf-low' };
}

function renderSuggestions() {
  const root = document.getElementById('suggestions-root');
  if (!root) return;

  const favs = loadFavorites();
  const visible = suggestions.filter((s) => suggestionState.get(s.id) === 'pending');
  const sugTitle = document.getElementById('sug-label');
  if (sugTitle) {
    sugTitle.textContent = visible.length
      ? `Suggestions (${visible.length} en attente)`
      : 'Suggestions';
  }
  if (!visible.length) {
    let msg =
      '<p class="empty">Lancez <strong>Analyser</strong> pour obtenir des propositions de codes à partir du texte saisi.</p>';
    if (suggestions.length) {
      msg =
        '<p class="empty">Toutes les suggestions ont été traitées. Relancez une analyse ou saisissez un autre texte.</p>';
    } else if (lastAnalyze.ran && lastAnalyze.hadText) {
      msg =
        '<p class="empty">Aucune suggestion pour ce texte. Reformulez ou précisez les diagnostics (ex. diabète type 2, hypertension, asthme).</p>';
    } else if (lastAnalyze.ran && !lastAnalyze.hadText) {
      msg = '<p class="empty">Saisissez d’abord un compte-rendu ou des diagnostics, puis lancez l’analyse.</p>';
    }
    root.innerHTML = msg;
    return;
  }

  root.innerHTML = `<div class="cards">${visible
    .map((s) => {
      const isWho = s.source === 'who11';
      const conf = confidenceLabel(s.confidence);
      const parent = findParentEntry(s.code);
      const parentHtml = parent ? `<span class="parent-code" title="Rubrique parent"> — ${escapeHtml(parent.code)} ${escapeHtml(parent.label)}</span>` : '';
      const notInLocal = isWho && !icdEntries.some((e) => e.code === s.code);
      const cim11WarnBadge = notInLocal ? '<span class="badge cim11-warn" title="Code ICD-11 sans équivalent direct dans le dictionnaire CIM-10 intégré">ICD-11</span>' : '';
      const meta = isWho
        ? `Proposition OMS à partir de « ${escapeHtml(s.matchedTerm)} »${parentHtml}`
        : `Repéré à partir de « ${escapeHtml(s.matchedTerm)} »${parentHtml}`;
      const srcBadge = isWho
        ? '<span class="badge who11" title="Suggestion issue du service de classification de l’OMS">OMS</span>'
        : '<span class="badge local" title="Suggestion issue du dictionnaire de l’application">Intégré</span>';
      const isFav = favs.some((f) => f.code === s.code);
      const confBadge = `<span class="badge conf ${conf.cls}" title="Pertinence estimée">${conf.text}</span>`;
      return `
      <article class="card" data-id="${escapeHtml(s.id)}">
        <div class="card-header">
          <button type="button" class="fav-toggle ${isFav ? 'is-fav' : ''}" data-fav-code="${escapeHtml(s.code)}" data-fav-label="${escapeHtml(s.label)}" title="${isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
            ${isFav ? '★' : '☆'}
          </button>
          <span class="code">${escapeHtml(s.code)}</span>
          <span class="label">${escapeHtml(s.label)}</span>
          ${srcBadge}
          ${cim11WarnBadge}
          ${confBadge}
        </div>
        <p class="meta">${meta}</p>
        <div class="actions">
          <button type="button" class="accept" data-action="accept">Valider</button>
          <button type="button" class="edit" data-action="edit">Modifier</button>
          <button type="button" class="reject" data-action="reject">Rejeter</button>
        </div>
        <div class="edit-form" id="edit-${escapeHtml(s.id)}">
          <label>Code diagnostic <input type="text" class="inp-code" value="${escapeHtml(s.code)}" /></label>
          <p class="code-format-warn hint error" hidden></p>
          <label>Libellé <input type="text" class="inp-label" value="${escapeHtml(s.label)}" /></label>
          <div class="toolbar">
            <button type="button" class="primary" data-action="save-edit">Enregistrer</button>
            <button type="button" class="ghost" data-action="cancel-edit">Annuler</button>
          </div>
        </div>
      </article>`;
    })
    .join('')}</div>`;

  root.querySelectorAll('.card').forEach((card) => {
    const id = card.getAttribute('data-id');
    card.querySelector('[data-action="accept"]')?.addEventListener('click', () => acceptSuggestion(id, false));
    card.querySelector('[data-action="reject"]')?.addEventListener('click', () => rejectSuggestion(id));
    card.querySelector('[data-action="edit"]')?.addEventListener('click', () => openEdit(id, true));
    card.querySelector('[data-action="save-edit"]')?.addEventListener('click', () => saveEdit(id));
    card.querySelector('[data-action="cancel-edit"]')?.addEventListener('click', () => openEdit(id, false));
    card.querySelector('.fav-toggle')?.addEventListener('click', (e) => {
      const btn = e.currentTarget;
      const code = btn.getAttribute('data-fav-code');
      const label = btn.getAttribute('data-fav-label');
      toggleFavorite(code, label);
      renderSuggestions();
      renderFavorites();
    });
  });
}

function findSuggestion(id) {
  return suggestions.find((x) => x.id === id);
}

function acceptSuggestion(id, modified, code, label) {
  const s = findSuggestion(id);
  if (!s) return;
  const ta = document.getElementById('cr-text');
  pushUndo(ta?.value || '');
  suggestionState.set(id, 'accepted');
  validated.push({
    id: randomId(),
    code: modified ? code : s.code,
    label: modified ? label : s.label,
    statut: modified ? 'modifié' : 'validé',
    matchedTerm: s.matchedTerm,
  });
  saveValidatedSession();
  renderSuggestions();
  renderValidated();
  flashValidated();
}

function flashValidated() {
  const section = document.querySelector('[aria-labelledby="val-label"]');
  if (!section) return;
  section.classList.remove('flash-ok');
  void section.offsetWidth;
  section.classList.add('flash-ok');
  section.addEventListener('animationend', () => section.classList.remove('flash-ok'), { once: true });
}

function rejectSuggestion(id) {
  suggestionState.set(id, 'rejected');
  renderSuggestions();
}

function openEdit(id, open) {
  const el = document.getElementById(`edit-${id}`);
  if (el) el.classList.toggle('open', open);
}

async function saveEdit(id) {
  const card = document.querySelector(`.card[data-id="${id.replace(/"/g, '\\"')}"]`);
  if (!card) return;
  const code = card.querySelector('.inp-code')?.value?.trim() || '';
  const label = card.querySelector('.inp-label')?.value?.trim() || '';
  if (!code || !label) {
    await showAlert('Renseignez le code et le libellé.');
    return;
  }
  if (!validateIcd10Code(code)) {
    const warn = card.querySelector('.code-format-warn');
    if (warn) { warn.hidden = false; warn.textContent = `Format inattendu : « ${code} ». Attendu : lettre + 2 chiffres (+ sous-code optionnel, ex. I10, E11.9).`; }
    return;
  }
  acceptSuggestion(id, true, code.toUpperCase(), label);
}

function renderValidated() {
  const list = document.getElementById('validated-root');
  const empty = document.getElementById('validated-empty');
  const ej = document.getElementById('export-txt');
  const ec = document.getElementById('export-csv');
  const em = document.getElementById('export-email');
  const es = document.getElementById('export-share');
  const ep = document.getElementById('btn-print');
  if (!list || !empty) return;

  list.innerHTML = validated
    .map(
      (v, i) => `
    <li class="validated-item">
      <div class="validated-reorder">
        <button type="button" class="ghost icon-btn" data-up="${escapeHtml(v.id)}" aria-label="Monter" ${i === 0 ? 'disabled' : ''}>↑</button>
        <button type="button" class="ghost icon-btn" data-down="${escapeHtml(v.id)}" aria-label="Descendre" ${i === validated.length - 1 ? 'disabled' : ''}>↓</button>
      </div>
      <span class="code">${escapeHtml(v.code)}</span>
      <span class="validated-label">${escapeHtml(v.label)}</span>
      <span class="badge ${v.statut === 'modifié' ? 'modified' : ''}">${escapeHtml(v.statut)}</span>
      <button type="button" class="ghost icon-btn" data-annotate="${escapeHtml(v.id)}" title="Ajouter une note">&#128221;</button>
      <button type="button" class="ghost" data-rid="${escapeHtml(v.id)}">Retirer</button>
      ${v.note ? `<p class="validated-note">${escapeHtml(v.note)}</p>` : ''}
      <div class="validated-note-form" id="note-form-${escapeHtml(v.id)}" hidden>
        <textarea class="validated-note-inp" rows="2" placeholder="Note clinique (praticien, date, précision)…">${escapeHtml(v.note || '')}</textarea>
        <div class="toolbar">
          <button type="button" class="primary" style="font-size:0.8rem;padding:0.3rem 0.7rem" data-save-note="${escapeHtml(v.id)}">Enregistrer</button>
          <button type="button" class="ghost" style="font-size:0.8rem" data-cancel-note="${escapeHtml(v.id)}">Annuler</button>
        </div>
      </div>
    </li>`
    )
    .join('');

  list.querySelectorAll('[data-up]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-up');
      const idx = validated.findIndex((x) => x.id === id);
      if (idx > 0) {
        [validated[idx - 1], validated[idx]] = [validated[idx], validated[idx - 1]];
        saveValidatedSession();
        renderValidated();
      }
    });
  });

  list.querySelectorAll('[data-down]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-down');
      const idx = validated.findIndex((x) => x.id === id);
      if (idx !== -1 && idx < validated.length - 1) {
        [validated[idx], validated[idx + 1]] = [validated[idx + 1], validated[idx]];
        saveValidatedSession();
        renderValidated();
      }
    });
  });

  list.querySelectorAll('[data-rid]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const rid = btn.getAttribute('data-rid');
      const ta2 = document.getElementById('cr-text');
      pushUndo(ta2?.value || '');
      validated = validated.filter((x) => x.id !== rid);
      saveValidatedSession();
      renderValidated();
    });
  });

  list.querySelectorAll('[data-annotate]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-annotate');
      const form = document.getElementById(`note-form-${id}`);
      if (form) form.hidden = !form.hidden;
    });
  });

  list.querySelectorAll('[data-save-note]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-save-note');
      const form = document.getElementById(`note-form-${id}`);
      const ta3 = form?.querySelector('.validated-note-inp');
      const note = ta3?.value?.trim() || '';
      const item = validated.find((x) => x.id === id);
      if (item) { item.note = note; saveValidatedSession(); }
      renderValidated();
    });
  });

  list.querySelectorAll('[data-cancel-note]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-cancel-note');
      const form = document.getElementById(`note-form-${id}`);
      if (form) form.hidden = true;
    });
  });

  empty.hidden = validated.length > 0;
  const has = validated.length > 0;
  if (ej) ej.disabled = !has;
  if (ec) ec.disabled = !has;
  if (em) em.disabled = !has;
  if (es) es.disabled = !has;
  if (ep) ep.disabled = !has;

  const titleEl = document.getElementById('val-label');
  if (titleEl) {
    titleEl.textContent = validated.length
      ? `Diagnostics retenus (${validated.length})`
      : 'Diagnostics retenus';
  }
}

function toggleDictation(ta, micBtn) {
  if (listening) {
    listening = false;
    recognizer?.stop();
    recognizer = null;
    micBtn.classList.remove('listening');
    micBtn.setAttribute('aria-pressed', 'false');
    dictationPrefix = ta.value;
    return;
  }

  recognizer = createSpeechRecognizer({
    onResult: (text) => {
      ta.value = dictationPrefix + (dictationPrefix && !dictationPrefix.endsWith(' ') ? ' ' : '') + text;
      window.__savedCrText = ta.value;
    },
    onError: () => {
      listening = false;
      micBtn.classList.remove('listening');
      micBtn.setAttribute('aria-pressed', 'false');
    },
  });

  if (!recognizer) return;

  dictationPrefix = ta.value.trimEnd() ? ta.value.trimEnd() + ' ' : '';
  listening = true;
  micBtn.classList.add('listening');
  micBtn.setAttribute('aria-pressed', 'true');
  try {
    recognizer.start();
  } catch {
    listening = false;
    micBtn.classList.remove('listening');
  }
}

function renderSessionsPanel() {
  const root = document.getElementById('sessions-root');
  if (!root) return;
  const sessions = loadNamedSessions();
  const names = Object.keys(sessions);
  if (!names.length) {
    root.innerHTML = '<p class="sessions-empty">Aucune session enregistrée.</p>';
    return;
  }
  root.innerHTML = names.map((n) => {
    const s = sessions[n];
    const date = s.savedAt ? new Date(s.savedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : '';
    return `<div class="session-item">
      <div class="session-info">
        <span class="session-name">${escapeHtml(n)}</span>
        <span class="session-meta">${s.validated?.length ?? 0} diag. — ${escapeHtml(date)}</span>
      </div>
      <div class="session-actions">
        <button type="button" class="ghost" data-load="${escapeHtml(n)}">Charger</button>
        <button type="button" class="ghost" data-del-session="${escapeHtml(n)}" aria-label="Supprimer">×</button>
      </div>
    </div>`;
  }).join('');
  root.querySelectorAll('[data-load]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const name = btn.getAttribute('data-load');
      const sess = loadNamedSession(name);
      if (!sess) return;
      if (!await showConfirm(`Charger la session « ${name} » ? La session en cours sera remplacée.`)) return;
      validated = sess.validated || [];
      const ta = document.getElementById('cr-text');
      if (ta) { ta.value = sess.compteRendu || ''; window.__savedCrText = ta.value; }
      saveValidatedSession();
      renderValidated();
      renderSessionsPanel();
    });
  });
  root.querySelectorAll('[data-del-session]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-del-session');
      deleteNamedSession(name);
      renderSessionsPanel();
    });
  });
}

function renderManualHits(hits, results, inp) {
  if (!hits.length) {
    results.innerHTML = '<p class="manual-search-empty">Aucun résultat trouvé.</p>';
    return;
  }
  const favs = loadFavorites();
  results.innerHTML = hits.map((h) => {
    const parent = findParentEntry(h.code);
    const parentHtml = parent ? `<span class="manual-search-parent">${escapeHtml(parent.code)} — ${escapeHtml(parent.label)}</span>` : '';
    const isFav = favs.some((f) => f.code === h.code);
    return `<div class="manual-search-hit-row">
      <button type="button" class="manual-search-hit" data-code="${escapeHtml(h.code)}" data-label="${escapeHtml(h.label)}">
        <span class="code">${escapeHtml(h.code)}</span>
        <span class="manual-search-hit-label">${escapeHtml(h.label)}</span>
        ${parentHtml}
      </button>
      <button type="button" class="fav-toggle ${isFav ? 'is-fav' : ''}" data-fav-code="${escapeHtml(h.code)}" data-fav-label="${escapeHtml(h.label)}" title="${isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">
        ${isFav ? '★' : '☆'}
      </button>
    </div>`;
  }).join('');
  results.querySelectorAll('.manual-search-hit').forEach((btn) => {
    btn.addEventListener('click', () => {
      const code = btn.getAttribute('data-code') || '';
      const label = btn.getAttribute('data-label') || '';
      validated.push({ id: randomId(), code, label, statut: 'validé' });
      saveValidatedSession();
      renderValidated();
      inp.value = '';
      results.innerHTML = '';
      inp.focus();
    });
  });
  results.querySelectorAll('.fav-toggle').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const code = btn.getAttribute('data-fav-code');
      const label = btn.getAttribute('data-fav-label');
      toggleFavorite(code, label);
      doSearch(); // rafraichir la recherche manuelle
      renderFavorites();
      renderSuggestions();
    });
  });
}

function renderFavorites() {
  const root = document.getElementById('favorites-root');
  if (!root) return;
  const favorites = loadFavorites();
  if (!favorites.length) {
    root.innerHTML = '<p class="empty">Aucun favori enregistré. Utilisez l’étoile sur un code pour l’ajouter.</p>';
    return;
  }
  root.innerHTML = `<div class="fav-list">${favorites.map((f) => `
    <div class="fav-item">
      <button type="button" class="fav-item-btn" data-code="${escapeHtml(f.code)}" data-label="${escapeHtml(f.label)}">
        <span class="code">${escapeHtml(f.code)}</span>
        <span class="fav-label">${escapeHtml(f.label)}</span>
      </button>
      <button type="button" class="fav-del ghost" data-del-code="${escapeHtml(f.code)}" title="Retirer des favoris">×</button>
    </div>
  `).join('')}</div>`;

  root.querySelectorAll('.fav-item-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const code = btn.getAttribute('data-code');
      const label = btn.getAttribute('data-label');
      validated.push({ id: randomId(), code, label, statut: 'validé' });
      saveValidatedSession();
      renderValidated();
    });
  });
  root.querySelectorAll('.fav-del').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const code = btn.getAttribute('data-del-code');
      const favs = loadFavorites();
      saveFavorites(favs.filter((f) => f.code !== code));
      renderFavorites();
      renderSuggestions();
    });
  });
}

function wireManualSearch() {
  const form = document.getElementById('manual-search-form');
  const inp = /** @type {HTMLInputElement} */ (document.getElementById('manual-search-inp'));
  const results = document.getElementById('manual-search-results');
  if (!form || !inp || !results) return;

  let debounceTimer = null;

  async function doSearch() {
    const q = inp.value.trim();
    if (q.length < 2) { results.innerHTML = ''; return; }

    const localHits = suggestFromText(q).slice(0, 8);
    const cfg = readAnalyzeSettings();
    const useApi = (cfg.mode === 'api' || cfg.mode === 'both') && cfg.clientId && cfg.clientSecret && cfg.proxyUrl;

    if (!useApi) {
      renderManualHits(localHits, results, inp);
      return;
    }

    results.innerHTML = '<p class="manual-search-empty">Recherche OMS…</p>';
    try {
      const { fetchWhoIcd11AutocodeSuggestions } = await import('./who-icd-api.js');
      const whoHits = await fetchWhoIcd11AutocodeSuggestions(cfg.clientId, cfg.clientSecret, q, {
        releaseId: cfg.releaseId,
        lang: cfg.lang,
        matchThreshold: 0.25,
        maxPhrases: 1,
        proxyBase: cfg.proxyUrl,
      });
      const seen = new Set();
      const merged = [...whoHits, ...localHits].filter((h) => {
        if (seen.has(h.code)) return false;
        seen.add(h.code);
        return true;
      }).slice(0, 10);
      renderManualHits(merged, results, inp);
    } catch {
      renderManualHits(localHits, results, inp);
    }
  }

  inp.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => void doSearch(), 350);
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); void doSearch(); });
}

export function mountHomePage() {
  const root = app();
  if (!root) return;

  const micSupported = isSpeechRecognitionSupported();
  const mode = getStoredAnalyzeMode();
  const settingsReady = isSettingsReadyForDailyUse();
  const modeLabel = MODE_SUMMARY_LABEL[mode] || '';
  const shareSupported = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  validated = loadValidatedSession();

  root.innerHTML =
    buildAppHeaderHtml(escapeHtml, {
      route: 'home',
      settingsReady,
      modeLabel,
    }) + buildHomeWorkspaceHtml(micSupported, shareSupported, validated.length > 0);

  const ta = /** @type {HTMLTextAreaElement} */ (document.getElementById('cr-text'));
  if (!ta) return;
  ta.value = window.__savedCrText || '';

  const form = /** @type {HTMLFormElement} */ (document.getElementById('cr-form'));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    void runAnalyze().catch((err) => console.error(err));
  });

  document.getElementById('btn-clear')?.addEventListener('click', () => {
    ta.value = '';
    window.__savedCrText = '';
    suggestions = [];
    suggestionState.clear();
    lastAnalyze = { ran: false, hadText: false, count: 0 };
    hideAnalyzeError();
    renderSuggestions();
  });

  const micBtn = document.getElementById('btn-mic');
  if (micBtn) {
    micBtn.addEventListener('click', () => toggleDictation(ta, micBtn));
  }

  ta.addEventListener('input', () => {
    window.__savedCrText = ta.value;
  });

  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      void runAnalyze().catch((err) => console.error(err));
    }
  });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
      if (e.key === 'z') {
        const prev = popUndo();
        if (!prev) return;
        e.preventDefault();
        validated = prev.validated;
        const el = document.getElementById('cr-text');
        if (el) {
          el.value = prev.compteRendu;
          window.__savedCrText = prev.compteRendu;
        }
        saveValidatedSession();
        renderValidated();
        renderSuggestions();
        return;
      }
    }

    // Nouveaux raccourcis Alt
    if (e.altKey) {
      if (e.key === 'v') {
        // Valider la première suggestion en attente
        const first = suggestions.find((s) => suggestionState.get(s.id) === 'pending');
        if (first) {
          e.preventDefault();
          acceptSuggestion(first.id, false);
        }
      } else if (e.key === 'r') {
        // Rejeter la première suggestion en attente
        const first = suggestions.find((s) => suggestionState.get(s.id) === 'pending');
        if (first) {
          e.preventDefault();
          rejectSuggestion(first.id);
        }
      } else if (e.key === 't') {
        // Focus sur le compte-rendu
        const el = document.getElementById('cr-text');
        if (el) {
          e.preventDefault();
          el.focus();
        }
      } else if (e.key === 's') {
        // Focus sur la recherche manuelle
        const el = document.getElementById('manual-search-inp');
        if (el) {
          e.preventDefault();
          el.focus();
        }
      }
    }
  });

  // Offline mode
  function updateOfflineBanner() {
    const ob = document.getElementById('offline-banner');
    if (ob) ob.hidden = navigator.onLine;
    // Disable WHO search when offline
    const ms = document.getElementById('manual-search');
    if (ms) ms.placeholder = navigator.onLine ? 'Recherche manuelle…' : 'Recherche OMS indisponible hors-ligne';
  }
  window.addEventListener('online', () => { updateOfflineBanner(); renderSuggestions(); });
  window.addEventListener('offline', () => { updateOfflineBanner(); renderSuggestions(); });
  updateOfflineBanner();

  document.getElementById('export-txt')?.addEventListener('click', () => exportTextFile(validated, ta.value));
  document.getElementById('export-csv')?.addEventListener('click', () => exportCsv(validated, ta.value));
  document.getElementById('export-email')?.addEventListener('click', () => exportViaEmail(validated, ta.value));
  document.getElementById('export-share')?.addEventListener('click', () => {
    void shareExport(validated, ta.value).catch((err) => {
      if (err instanceof Error && err.name === 'AbortError') return;
      console.error(err);
      exportViaEmail(validated, ta.value);
    });
  });

  document.getElementById('btn-new-session')?.addEventListener('click', async () => {
    if (!await showConfirm('Réinitialiser la session ? Le compte-rendu et les diagnostics validés seront effacés.')) return;
    ta.value = '';
    window.__savedCrText = '';
    validated = [];
    suggestions = [];
    suggestionState.clear();
    lastAnalyze = { ran: false, hadText: false, count: 0 };
    clearValidatedSession();
    hideAnalyzeError();
    renderSuggestions();
    renderValidated();
    renderCrHistory();
  });

  document.getElementById('btn-print')?.addEventListener('click', () => window.print());

  document.getElementById('export-json')?.addEventListener('click', () => exportJson(validated, ta.value));

  document.getElementById('btn-save-session')?.addEventListener('click', () => {
    const inp = document.getElementById('session-name-input');
    const name = (inp?.value || '').trim();
    if (!name) { inp?.focus(); return; }
    saveNamedSession(name, { compteRendu: ta.value, validated });
    if (inp) inp.value = '';
    renderSessionsPanel();
  });

  renderSessionsPanel();

  wireNavDrawer();
  wireThemeToggle();
  refreshWorkspaceChrome();
  renderSuggestions();
  renderValidated();
  renderCrHistory();
  wireManualSearch();
  renderFavorites();
}
