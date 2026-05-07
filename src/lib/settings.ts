import { LS_KEYS } from './constants';
import type { AnalyzeMode, AnalyzeSettings, WhoSettings } from '../types/index';

export function readAnalyzeMode(): AnalyzeMode {
  const v = localStorage.getItem(LS_KEYS.ANALYZE_MODE);
  if (v === 'local' || v === 'api' || v === 'both') return v;
  if (localStorage.getItem('who_icd_enabled') === '1') {
    localStorage.setItem(LS_KEYS.ANALYZE_MODE, 'both');
    localStorage.removeItem('who_icd_enabled');
    return 'both';
  }
  return 'local';
}

export function writeAnalyzeMode(mode: AnalyzeMode): void {
  localStorage.setItem(LS_KEYS.ANALYZE_MODE, mode);
}

export function readWhoSettings(): WhoSettings {
  return {
    clientId: (localStorage.getItem(LS_KEYS.WHO_CLIENT_ID) || '').trim(),
    clientSecret: localStorage.getItem(LS_KEYS.WHO_CLIENT_SECRET) || '',
    proxyUrl: (localStorage.getItem(LS_KEYS.WHO_PROXY) || '').trim(),
    releaseId: localStorage.getItem(LS_KEYS.WHO_RELEASE) || '2025-01',
    lang: localStorage.getItem(LS_KEYS.WHO_LANG) || 'fr',
  };
}

export function writeWhoSettings(s: WhoSettings): void {
  localStorage.setItem(LS_KEYS.WHO_CLIENT_ID, s.clientId.trim());
  if (s.clientSecret)
    localStorage.setItem(LS_KEYS.WHO_CLIENT_SECRET, s.clientSecret);
  else localStorage.removeItem(LS_KEYS.WHO_CLIENT_SECRET);
  localStorage.setItem(LS_KEYS.WHO_PROXY, s.proxyUrl.trim());
  localStorage.setItem(LS_KEYS.WHO_RELEASE, s.releaseId);
  localStorage.setItem(LS_KEYS.WHO_LANG, s.lang);
}

export function readMinConfidenceThreshold(): number {
  const raw = localStorage.getItem(LS_KEYS.MIN_CONFIDENCE);
  const parsed = Number.parseFloat(raw || '');
  if (!Number.isFinite(parsed)) return 0.4;
  if (parsed < 0.1) return 0.1;
  if (parsed > 1) return 1;
  return Math.round(parsed * 100) / 100;
}

export function writeMinConfidenceThreshold(value: number): void {
  const safe = Number.isFinite(value) ? Math.max(0.1, Math.min(1, value)) : 0.4;
  localStorage.setItem(LS_KEYS.MIN_CONFIDENCE, safe.toFixed(2));
}

export function readAnalyzeSettings(): AnalyzeSettings {
  return {
    mode: readAnalyzeMode(),
    minConfidence: readMinConfidenceThreshold(),
    ...readWhoSettings(),
  };
}

export function isSettingsReadyForDailyUse(): boolean {
  const mode = readAnalyzeMode();
  if (mode === 'local') return true;
  const { clientId, clientSecret, proxyUrl } = readWhoSettings();
  return Boolean(clientId && clientSecret && proxyUrl);
}
