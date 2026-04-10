import { suggestFromText } from './analyzer.js';
import { randomId } from './random-id.js';
import { createSpeechRecognizer, isSpeechRecognitionSupported } from './speech.js';
import { escapeHtml } from './html-utils.js';
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
  exportTextFile,
  exportViaEmail,
  shareExport,
} from './export-report.js';
import { buildHomeWorkspaceHtml } from './home-html.js';

/** @type {{ id: string; code: string; label: string; statut: 'validé' | 'modifié'; matchedTerm?: string }[]} */
let validated = [];
/** @type {Map<string, 'pending' | 'accepted' | 'rejected'>} */
const suggestionState = new Map();
let suggestions = [];
let dictationPrefix = '';
let recognizer = null;
let listening = false;
let lastAnalyze = { ran: false, hadText: false, count: 0 };

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
    for (const s of [...localList, ...whoList]) {
      const key = `${s.source || 'local'}:${s.code}`;
      if (seen.has(key)) continue;
      seen.add(key);
      suggestions.push(s);
    }
    suggestions.sort((a, b) => b.confidence - a.confidence);
    if (suggestions.length > 35) suggestions = suggestions.slice(0, 35);

    suggestionState.clear();
    for (const s of suggestions) suggestionState.set(s.id, 'pending');

    lastAnalyze = {
      ran: true,
      hadText: text.length > 0,
      count: suggestions.length,
    };

    renderSuggestions();
  } finally {
    if (btn) btn.disabled = false;
  }
}

function renderSuggestions() {
  const root = document.getElementById('suggestions-root');
  if (!root) return;

  const visible = suggestions.filter((s) => suggestionState.get(s.id) === 'pending');
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
      const pct = Math.round(s.confidence * 100);
      const isWho = s.source === 'who11';
      const whoPct =
        isWho && typeof s.whoMatchScore === 'number'
          ? Math.round(s.whoMatchScore * 100)
          : null;
      const meta = isWho
        ? `Proposition OMS à partir de « ${escapeHtml(s.matchedTerm)} » — pertinence estimée ${whoPct != null ? whoPct : pct} % (affichée ${pct} %)`
        : `Repéré à partir de « ${escapeHtml(s.matchedTerm)} » — pertinence indicative ${pct} %`;
      const srcBadge = isWho
        ? '<span class="badge who11" title="Suggestion issue du service de classification de l’OMS">OMS</span>'
        : '<span class="badge local" title="Suggestion issue du dictionnaire de l’application">Intégré</span>';
      return `
      <article class="card" data-id="${escapeHtml(s.id)}">
        <div class="card-header">
          <span class="code">${escapeHtml(s.code)}</span>
          <span class="label">${escapeHtml(s.label)}</span>
          ${srcBadge}
        </div>
        <p class="meta">${meta}</p>
        <div class="bar" role="presentation"><span style="width:${pct}%"></span></div>
        <div class="actions">
          <button type="button" class="accept" data-action="accept">Valider</button>
          <button type="button" class="edit" data-action="edit">Modifier</button>
          <button type="button" class="reject" data-action="reject">Rejeter</button>
        </div>
        <div class="edit-form" id="edit-${escapeHtml(s.id)}">
          <label>Code diagnostic <input type="text" class="inp-code" value="${escapeHtml(s.code)}" /></label>
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
  });
}

function findSuggestion(id) {
  return suggestions.find((x) => x.id === id);
}

function acceptSuggestion(id, modified, code, label) {
  const s = findSuggestion(id);
  if (!s) return;
  suggestionState.set(id, 'accepted');
  validated.push({
    id: randomId(),
    code: modified ? code : s.code,
    label: modified ? label : s.label,
    statut: modified ? 'modifié' : 'validé',
    matchedTerm: s.matchedTerm,
  });
  renderSuggestions();
  renderValidated();
}

function rejectSuggestion(id) {
  suggestionState.set(id, 'rejected');
  renderSuggestions();
}

function openEdit(id, open) {
  const el = document.getElementById(`edit-${id}`);
  if (el) el.classList.toggle('open', open);
}

function saveEdit(id) {
  const card = document.querySelector(`.card[data-id="${id.replace(/"/g, '\\"')}"]`);
  if (!card) return;
  const code = card.querySelector('.inp-code')?.value?.trim() || '';
  const label = card.querySelector('.inp-label')?.value?.trim() || '';
  if (!code || !label) {
    alert('Renseignez le code et le libellé.');
    return;
  }
  acceptSuggestion(id, true, code, label);
}

function renderValidated() {
  const list = document.getElementById('validated-root');
  const empty = document.getElementById('validated-empty');
  const ej = document.getElementById('export-txt');
  const ec = document.getElementById('export-csv');
  const em = document.getElementById('export-email');
  const es = document.getElementById('export-share');
  if (!list || !empty) return;

  list.innerHTML = validated
    .map(
      (v) => `
    <li>
      <span class="code">${escapeHtml(v.code)}</span>
      <span>${escapeHtml(v.label)}</span>
      <span class="badge ${v.statut === 'modifié' ? 'modified' : ''}">${escapeHtml(v.statut)}</span>
      <button type="button" class="ghost" data-rid="${escapeHtml(v.id)}">Retirer</button>
    </li>`
    )
    .join('');

  list.querySelectorAll('[data-rid]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const rid = btn.getAttribute('data-rid');
      validated = validated.filter((x) => x.id !== rid);
      renderValidated();
    });
  });

  empty.hidden = validated.length > 0;
  const has = validated.length > 0;
  if (ej) ej.disabled = !has;
  if (ec) ec.disabled = !has;
  if (em) em.disabled = !has;
  if (es) es.disabled = !has;
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

export function mountHomePage() {
  const root = app();
  if (!root) return;

  const micSupported = isSpeechRecognitionSupported();
  const mode = getStoredAnalyzeMode();
  const settingsReady = isSettingsReadyForDailyUse();
  const modeLabel = MODE_SUMMARY_LABEL[mode] || '';
  const shareSupported = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

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

  wireNavDrawer();
  wireThemeToggle();
  refreshWorkspaceChrome();
  renderSuggestions();
  renderValidated();
}
