import { create } from 'zustand';
import type { WhoSettings } from '../types/index';
import {
  readMinConfidenceThreshold,
  readWhoSettings,
  writeMinConfidenceThreshold,
  writeWhoSettings,
} from '../lib/settings';
import { resetOmsToken } from '../lib/oms';
import { readSnapshot, updateSnapshot } from '../lib/app-store';

interface SettingsState {
  minConfidence: number;
  who: WhoSettings;
  disclaimerDismissed: boolean;
  setMinConfidence: (value: number) => void;
  setWho: (patch: Partial<WhoSettings>) => void;
  forgetSecret: () => void;
  dismissDisclaimer: () => void;
  resetDisclaimer: () => void;
}

/**
 * LE MODE D'ANALYSE A DISPARU, ET `isReady` AVEC LUI.
 *
 * Il y avait un sélecteur à trois valeurs — dictionnaire local, OMS, les deux —
 * et un `isReady()` qui bloquait « Analyser » tant que l'OMS n'était pas
 * configurée. Trois choix pour une question que l'utilisateur n'a pas à se
 * poser : il veut des codes, pas arbitrer entre deux référentiels.
 *
 * L'analyse interroge maintenant les deux, systématiquement, et le dictionnaire
 * embarqué porte seul le résultat quand le réseau manque (`HomePage`). Il n'y a
 * donc plus d'état « pas prêt » : le dictionnaire répond toujours.
 */
export const useSettingsStore = create<SettingsState>((set, get) => ({
  minConfidence: readMinConfidenceThreshold(),
  who: readWhoSettings(),
  disclaimerDismissed: readSnapshot().disclaimerDismissed,

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
}));
