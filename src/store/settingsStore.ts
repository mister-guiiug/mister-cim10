import { create } from 'zustand';
import type { AnalyzeMode, WhoSettings } from '../types/index';
import {
  readAnalyzeMode,
  readMinConfidenceThreshold,
  readWhoSettings,
  writeAnalyzeMode,
  writeMinConfidenceThreshold,
  writeWhoSettings,
} from '../lib/settings';
import { resetOmsToken } from '../lib/oms';
import { readSnapshot, updateSnapshot } from '../lib/app-store';

interface SettingsState {
  mode: AnalyzeMode;
  minConfidence: number;
  who: WhoSettings;
  disclaimerDismissed: boolean;
  setMode: (mode: AnalyzeMode) => void;
  setMinConfidence: (value: number) => void;
  setWho: (patch: Partial<WhoSettings>) => void;
  forgetSecret: () => void;
  dismissDisclaimer: () => void;
  resetDisclaimer: () => void;
  isReady: () => boolean;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  mode: readAnalyzeMode(),
  minConfidence: readMinConfidenceThreshold(),
  who: readWhoSettings(),
  disclaimerDismissed: readSnapshot().disclaimerDismissed,

  setMode: mode => {
    writeAnalyzeMode(mode);
    set({ mode });
  },
  setMinConfidence: value => {
    writeMinConfidenceThreshold(value);
    set({ minConfidence: value });
  },
  setWho: patch => {
    const next = { ...get().who, ...patch };
    writeWhoSettings(next);
    resetOmsToken(); // identifiants/passerelle changés → jeton caché obsolète
    set({ who: next });
  },
  forgetSecret: () => {
    const next = { ...get().who, clientSecret: '' };
    writeWhoSettings(next);
    resetOmsToken();
    set({ who: next });
  },
  dismissDisclaimer: () => {
    updateSnapshot({ disclaimerDismissed: true });
    set({ disclaimerDismissed: true });
  },
  resetDisclaimer: () => {
    updateSnapshot({ disclaimerDismissed: false });
    set({ disclaimerDismissed: false });
  },

  isReady: () => {
    const { mode, who } = get();
    if (mode === 'local') return true;
    return Boolean(who.clientId && who.clientSecret && who.proxyUrl);
  },
}));
