/**
 * Couche de persistance localStorage : sauvegarde/restauration de toutes les données
 * de l'application en JSON.
 */

import { LS_KEYS } from './constants';

const ALL_KEYS = [
  LS_KEYS.ANALYZE_MODE,
  LS_KEYS.WHO_CLIENT_ID,
  LS_KEYS.WHO_CLIENT_SECRET,
  LS_KEYS.WHO_RELEASE,
  LS_KEYS.WHO_LANG,
  LS_KEYS.WHO_PROXY,
  LS_KEYS.MIN_CONFIDENCE,
  LS_KEYS.THEME,
  LS_KEYS.DISCLAIMER_DISMISSED,
  LS_KEYS.VALIDATED,
  LS_KEYS.CR_TEXT,
  LS_KEYS.SESSIONS,
  LS_KEYS.FAVORITES,
  // Clés legacy historiques
  'cr_history',
  'validated_session',
];

export function exportAppData(): string {
  const data: Record<string, string> = {};
  for (const k of ALL_KEYS) {
    const v = localStorage.getItem(k);
    if (v !== null) data[k] = v;
  }
  return JSON.stringify(data, null, 2);
}

export function importAppData(json: string): boolean {
  try {
    const data: unknown = JSON.parse(json);
    if (typeof data !== 'object' || data === null) {
      throw new Error('Format invalide');
    }
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      if (typeof v === 'string') {
        localStorage.setItem(k, v);
      }
    }
    return true;
  } catch (err) {
    console.error('Import failed', err);
    return false;
  }
}

export function dateSlug(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
