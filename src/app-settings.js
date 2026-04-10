/** @typedef {'local' | 'api' | 'both'} AnalyzeMode */

function clearWhoCaches() {
  void import('./who-icd-api.js')
    .then((m) => m.clearWhoTokenCache())
    .catch(() => {});
}

export const LS_ANALYZE_MODE = 'analyze_mode';
export const LS_WHO_CLIENT_ID = 'who_icd_client_id';
export const LS_WHO_CLIENT_SECRET = 'who_icd_client_secret';
export const LS_WHO_RELEASE = 'who_icd_release';
export const LS_WHO_LANG = 'who_icd_lang';
export const LS_WHO_PROXY = 'who_icd_proxy_url';

export const MODE_SUMMARY_LABEL = {
  local: 'Intégré',
  api: 'OMS',
  both: 'Intégré + OMS',
};

/** @returns {AnalyzeMode} */
export function getStoredAnalyzeMode() {
  const v = localStorage.getItem(LS_ANALYZE_MODE);
  if (v === 'local' || v === 'api' || v === 'both') return v;
  if (localStorage.getItem('who_icd_enabled') === '1') {
    localStorage.setItem(LS_ANALYZE_MODE, 'both');
    localStorage.removeItem('who_icd_enabled');
    return 'both';
  }
  return 'local';
}

export function readWhoSettings() {
  const clientId = (localStorage.getItem(LS_WHO_CLIENT_ID) || '').trim();
  const clientSecret = localStorage.getItem(LS_WHO_CLIENT_SECRET) || '';
  const proxyUrl = (localStorage.getItem(LS_WHO_PROXY) || '').trim();
  const releaseId = localStorage.getItem(LS_WHO_RELEASE) || '2025-01';
  const lang = localStorage.getItem(LS_WHO_LANG) || 'fr';
  return { clientId, clientSecret, proxyUrl, releaseId, lang };
}

export function readAnalyzeSettings() {
  return { mode: getStoredAnalyzeMode(), ...readWhoSettings() };
}

export function isSettingsReadyForDailyUse() {
  const mode = getStoredAnalyzeMode();
  if (mode === 'local') return true;
  const { clientId, clientSecret, proxyUrl } = readWhoSettings();
  return Boolean(clientId && clientSecret && proxyUrl);
}

/**
 * @param {() => void} [refreshChrome]
 */
export function initAnalyzeModeUi(refreshChrome) {
  const mode = getStoredAnalyzeMode();
  const sel = document.getElementById('analyze-mode-select');
  if (!(sel instanceof HTMLSelectElement)) return;
  if (mode === 'local' || mode === 'api' || mode === 'both') {
    sel.value = mode;
  }
  updateSettingsPanelForMode(mode);

  sel.addEventListener('change', () => {
    const m = sel.value;
    if (m !== 'local' && m !== 'api' && m !== 'both') return;
    localStorage.setItem(LS_ANALYZE_MODE, m);
    clearWhoCaches();
    updateSettingsPanelForMode(m);
    refreshChrome?.();
  });
}

/**
 * @param {() => void} [refreshChrome]
 */
export function initWhoSettingsUi(refreshChrome) {
  const cid = document.getElementById('who-client-id');
  const sec = document.getElementById('who-client-secret');
  const proxyEl = document.getElementById('who-proxy-url');
  const rel = document.getElementById('who-release');
  const lang = document.getElementById('who-lang');
  const clr = document.getElementById('who-clear-creds');
  if (!cid || !sec || !rel || !lang) return;

  cid.value = localStorage.getItem(LS_WHO_CLIENT_ID) || '';
  sec.value = localStorage.getItem(LS_WHO_CLIENT_SECRET) || '';
  if (proxyEl) proxyEl.value = localStorage.getItem(LS_WHO_PROXY) || '';
  rel.value = localStorage.getItem(LS_WHO_RELEASE) || '2025-01';
  lang.value = localStorage.getItem(LS_WHO_LANG) || 'fr';

  rel.addEventListener('change', () => {
    localStorage.setItem(LS_WHO_RELEASE, rel.value);
    clearWhoCaches();
  });
  lang.addEventListener('change', () => localStorage.setItem(LS_WHO_LANG, lang.value));
  cid.addEventListener('change', () => {
    localStorage.setItem(LS_WHO_CLIENT_ID, cid.value.trim());
    clearWhoCaches();
    refreshChrome?.();
  });
  sec.addEventListener('change', () => {
    if (sec.value) localStorage.setItem(LS_WHO_CLIENT_SECRET, sec.value);
    else localStorage.removeItem(LS_WHO_CLIENT_SECRET);
    clearWhoCaches();
    refreshChrome?.();
  });
  proxyEl?.addEventListener('change', () => {
    localStorage.setItem(LS_WHO_PROXY, (proxyEl.value || '').trim());
    clearWhoCaches();
    refreshChrome?.();
  });
  clr?.addEventListener('click', () => {
    sec.value = '';
    localStorage.removeItem(LS_WHO_CLIENT_SECRET);
    clearWhoCaches();
    refreshChrome?.();
  });
}

/** @param {AnalyzeMode} mode */
export function updateSettingsPanelForMode(mode) {
  const api = document.getElementById('who-api-section');
  const badge = document.getElementById('settings-mode-badge');
  if (api) api.hidden = mode === 'local';
  if (badge) {
    badge.textContent = MODE_SUMMARY_LABEL[mode] || '';
  }
}
