/**
 * Couche de persistance : toutes les opérations localStorage de l'espace de travail.
 * Permet de tester et de remplacer la persistance indépendamment de l'UI.
 */

export const LS_CR_HISTORY = 'cr_history';
export const LS_VALIDATED = 'validated_session';
export const LS_SESSIONS = 'named_sessions';

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
