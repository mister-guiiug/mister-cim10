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

import { LS_KEYS } from '../lib/constants';

export const useSettingsStore = create<SettingsState>((set, get) => ({
  mode: readAnalyzeMode(),
  minConfidence: readMinConfidenceThreshold(),
  who: readWhoSettings(),
  disclaimerDismissed:
    localStorage.getItem(LS_KEYS.DISCLAIMER_DISMISSED) === '1',

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
    set({ who: next });
  },
  forgetSecret: () => {
    const next = { ...get().who, clientSecret: '' };
    writeWhoSettings(next);
    set({ who: next });
  },
  dismissDisclaimer: () => {
    localStorage.setItem(LS_KEYS.DISCLAIMER_DISMISSED, '1');
    set({ disclaimerDismissed: true });
  },
  resetDisclaimer: () => {
    localStorage.removeItem(LS_KEYS.DISCLAIMER_DISMISSED);
    set({ disclaimerDismissed: false });
  },

  isReady: () => {
    const { mode, who } = get();
    if (mode === 'local') return true;
    return Boolean(who.clientId && who.clientSecret && who.proxyUrl);
  },
}));
