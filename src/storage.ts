/**
 * Couche de persistance : toutes les opérations localStorage de l'espace de travail.
 * Permet de tester et de remplacer la persistance indépendamment de l'UI.
 */

export const LS_CR_HISTORY = 'cr_history';
export const LS_VALIDATED = 'validated_session';
export const LS_SESSIONS = 'named_sessions';
export const LS_FAVORITES = 'favorites';

export const HISTORY_MAX = 5;

/** @returns {string[]} */
export function loadCrHistory() {
  try {
    return JSON.parse(localStorage.getItem(LS_CR_HISTORY) || '[]');
  } catch {
    return [];
  }
}

/** @param {string} text */
export function saveCrHistory(text) {
  const h = loadCrHistory().filter((t) => t !== text);
  h.unshift(text);
  localStorage.setItem(LS_CR_HISTORY, JSON.stringify(h.slice(0, HISTORY_MAX)));
}

export function clearCrHistory() {
  localStorage.removeItem(LS_CR_HISTORY);
}

/** @param {any[]} data */
export function saveValidatedSession(data) {
  try {
    localStorage.setItem(LS_VALIDATED, JSON.stringify(data));
  } catch {
    // quota dépassé — on ignore silencieusement
  }
}

export function loadValidatedSession() {
  try {
    const raw = localStorage.getItem(LS_VALIDATED);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearValidatedSession() {
  localStorage.removeItem(LS_VALIDATED);
}

/** @returns {Record<string, { validated: any[]; compteRendu: string; savedAt: string }>} */
export function loadNamedSessions() {
  try {
    return JSON.parse(localStorage.getItem(LS_SESSIONS) || '{}');
  } catch {
    return {};
  }
}

/**
 * @param {string} name
 * @param {{ compteRendu: string; validated: any[] }} entry
 */
export function saveNamedSession(name, entry) {
  const sessions = loadNamedSessions();
  sessions[name] = {
    validated: JSON.parse(JSON.stringify(entry.validated)),
    compteRendu: entry.compteRendu,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(LS_SESSIONS, JSON.stringify(sessions));
}

/**
 * @param {string} name
 * @returns {{ validated: any[]; compteRendu: string; savedAt: string } | null}
 */
export function loadNamedSession(name) {
  const sessions = loadNamedSessions();
  return sessions[name] || null;
}

/** @param {string} name */
export function deleteNamedSession(name) {
  const sessions = loadNamedSessions();
  delete sessions[name];
  localStorage.setItem(LS_SESSIONS, JSON.stringify(sessions));
}

/** @returns {{code: string, label: string}[]} */
export function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(LS_FAVORITES) || '[]');
  } catch {
    return [];
  }
}

/** @param {{code: string, label: string}[]} favorites */
export function saveFavorites(favorites) {
  try {
    localStorage.setItem(LS_FAVORITES, JSON.stringify(favorites));
  } catch {
    // quota
  }
}

/**
 * @param {string} code
 * @param {string} label
 */
export function toggleFavorite(code, label) {
  const favorites = loadFavorites();
  const idx = favorites.findIndex((f) => f.code === code);
  if (idx === -1) {
    favorites.push({ code, label });
  } else {
    favorites.splice(idx, 1);
  }
  saveFavorites(favorites);
}

/** @returns {string} JSON de toutes les données de l'application */
export function exportAppData() {
  const data = {};
  const keys = [
    LS_CR_HISTORY,
    LS_VALIDATED,
    LS_SESSIONS,
    LS_FAVORITES,
    'analyze_mode',
    'who_icd_client_id',
    'who_icd_client_secret',
    'who_icd_release',
    'who_icd_lang',
    'who_icd_proxy_url',
    'app_theme',
    'disclaimer_dismissed',
  ];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v !== null) data[k] = v;
  }
  return JSON.stringify(data, null, 2);
}

/** @param {string} json */
export function importAppData(json) {
  try {
    const data = JSON.parse(json);
    if (typeof data !== 'object' || data === null) throw new Error('Format invalide');
    for (const [k, v] of Object.entries(data)) {
      localStorage.setItem(k, v);
    }
    return true;
  } catch (err) {
    console.error('Import failed', err);
    return false;
  }
}
