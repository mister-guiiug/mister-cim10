import {
  LS_ANALYZE_MODE,
  LS_WHO_CLIENT_ID,
  LS_WHO_CLIENT_SECRET,
  LS_WHO_RELEASE,
  LS_WHO_LANG,
  LS_WHO_PROXY,
  getStoredAnalyzeMode,
} from './app-settings.js';

const CFG_PARAM = 'cfg';
const SCHEMA_VERSION = 1;
/** Longueur max prudente pour les URL (messagerie, barre d’adresse). */
const URL_SAFE_MAX = 1800;

/**
 * @typedef {{ v: number; mode: string; clientId: string; clientSecret: string; proxyUrl: string; releaseId: string; lang: string }} SettingsSnapshot
 */

function getHashSearchParams() {
  const h = typeof location !== 'undefined' ? location.hash || '' : '';
  const i = h.indexOf('?');
  if (i < 0) return new URLSearchParams();
  return new URLSearchParams(h.slice(i + 1));
}

/** @returns {SettingsSnapshot} */
export function readSettingsSnapshotFromForm() {
  const sel = document.getElementById('analyze-mode-select');
  const m = sel instanceof HTMLSelectElement ? sel.value : getStoredAnalyzeMode();
  const mode = m === 'local' || m === 'api' || m === 'both' ? m : 'local';
  const cid = document.getElementById('who-client-id');
  const sec = document.getElementById('who-client-secret');
  const proxy = document.getElementById('who-proxy-url');
  const rel = document.getElementById('who-release');
  const lang = document.getElementById('who-lang');
  return {
    v: SCHEMA_VERSION,
    mode,
    clientId: cid && 'value' in cid ? String(/** @type {HTMLInputElement} */ (cid).value).trim() : '',
    clientSecret: sec && 'value' in sec ? String(/** @type {HTMLInputElement} */ (sec).value) : '',
    proxyUrl: proxy && 'value' in proxy ? String(/** @type {HTMLInputElement} */ (proxy).value).trim() : '',
    releaseId: rel instanceof HTMLSelectElement ? rel.value : '2025-01',
    lang: lang instanceof HTMLSelectElement && lang.value === 'en' ? 'en' : 'fr',
  };
}

/** @param {SettingsSnapshot} snap */
export function applySnapshotToStorage(snap) {
  if (snap.v !== SCHEMA_VERSION) return false;
  const mode = snap.mode;
  if (mode !== 'local' && mode !== 'api' && mode !== 'both') return false;
  localStorage.setItem(LS_ANALYZE_MODE, mode);
  localStorage.setItem(LS_WHO_CLIENT_ID, snap.clientId || '');
  if (snap.clientSecret) localStorage.setItem(LS_WHO_CLIENT_SECRET, snap.clientSecret);
  else localStorage.removeItem(LS_WHO_CLIENT_SECRET);
  localStorage.setItem(LS_WHO_PROXY, snap.proxyUrl || '');
  localStorage.setItem(LS_WHO_RELEASE, snap.releaseId || '2025-01');
  localStorage.setItem(LS_WHO_LANG, snap.lang === 'en' ? 'en' : 'fr');
  return true;
}

/** @param {SettingsSnapshot} snap */
export function encodeSnapshot(snap) {
  const json = JSON.stringify(snap);
  const b64 = btoa(unescape(encodeURIComponent(json)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** @param {string} encoded */
export function decodeSnapshot(encoded) {
  try {
    const pad = (4 - (encoded.length % 4)) % 4;
    const b64 = encoded.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad);
    const json = decodeURIComponent(escape(atob(b64)));
    return /** @type {SettingsSnapshot} */ (JSON.parse(json));
  } catch {
    return null;
  }
}

/** @param {string} encodedCfg */
export function buildParametresShareUrl(encodedCfg) {
  const base = import.meta.env.BASE_URL || '/';
  const normalized = base.endsWith('/') ? base.slice(0, -1) : base;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const root = normalized ? `${origin}${normalized}` : origin;
  return `${root}/#/parametres?${CFG_PARAM}=${encodeURIComponent(encodedCfg)}`;
}

function stripCfgFromHash() {
  const h = location.hash || '';
  const pathPart = h.split('?')[0] || '#/parametres';
  const clean = pathPart.startsWith('#') ? pathPart : `#${pathPart}`;
  history.replaceState(null, '', location.pathname + location.search + clean);
}

/**
 * Si l’URL contient ?cfg=…, applique le paramétrage puis nettoie le hash.
 * @returns {boolean} true si un import a été appliqué
 */
export function tryImportSettingsFromHash() {
  const params = getHashSearchParams();
  const raw = params.get(CFG_PARAM);
  if (!raw) return false;

  const snap = decodeSnapshot(raw.trim());
  const ok = snap && applySnapshotToStorage(snap);

  stripCfgFromHash();

  if (ok) {
    void import('./who-icd-api.js')
      .then((m) => m.clearWhoTokenCache())
      .catch(() => {});
  }

  return Boolean(ok);
}

/**
 * @returns {Promise<{ ok: boolean; method?: 'share' | 'clipboard'; message: string; tooLong?: boolean }>}
 */
export async function shareOrCopySettingsLink() {
  const snap = readSettingsSnapshotFromForm();
  const enc = encodeSnapshot(snap);
  const url = buildParametresShareUrl(enc);

  if (url.length > URL_SAFE_MAX) {
    try {
      await navigator.clipboard.writeText(url);
      return {
        ok: true,
        method: 'clipboard',
        message:
          'Lien très long : il a été copié dans le presse-papiers. Collez-le dans un message ou un fichier plutôt que dans certains champs limités.',
        tooLong: true,
      };
    } catch {
      return {
        ok: false,
        message: 'Impossible de copier : le lien dépasse la taille recommandée. Réduisez les champs ou exportez les valeurs autrement.',
        tooLong: true,
      };
    }
  }

  const title = 'Paramètres — Cotation CIM-10';
  const text = 'Ouvrez ce lien pour appliquer la configuration dans l’application (navigateur).';

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return { ok: true, method: 'share', message: 'Partage lancé.' };
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        return { ok: false, message: 'Partage annulé.' };
      }
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return {
      ok: true,
      method: 'clipboard',
      message: 'Lien copié dans le presse-papiers. Vous pouvez le coller où vous voulez.',
    };
  } catch {
    return {
      ok: false,
      message:
        'Copie impossible : autorisez le presse-papiers pour ce site ou copiez l’URL depuis la barre d’adresse après génération.',
    };
  }
}

export function wireSettingsShare() {
  const btn = document.getElementById('btn-share-settings');
  const feedback = document.getElementById('settings-share-feedback');
  if (!btn || !feedback) return;

  btn.addEventListener('click', () => {
    feedback.hidden = true;
    void shareOrCopySettingsLink().then((r) => {
      feedback.textContent = r.message;
      feedback.hidden = false;
      feedback.classList.toggle('settings-share-feedback--ok', r.ok);
      feedback.classList.toggle('settings-share-feedback--warn', !r.ok);
    });
  });
}
