import { create } from 'zustand';
import type { SourcePriority, WhoSettings } from '../types/index';
import {
  readMinConfidenceThreshold,
  readSourcePriority,
  readWhoSettings,
  writeMinConfidenceThreshold,
  writeSourcePriority,
  writeWhoSettings,
} from '../lib/settings';
import { resetOmsToken } from '../lib/oms';
import { defautsWho } from '../lib/who-defaults';
import { readSnapshot, updateSnapshot } from '../lib/app-store';

interface SettingsState {
  minConfidence: number;
  /** Référentiel affiché en tête — les deux restent interrogés. */
  sourcePriority: SourcePriority;
  who: WhoSettings;
  disclaimerDismissed: boolean;
  setMinConfidence: (value: number) => void;
  setSourcePriority: (value: SourcePriority) => void;
  setWho: (patch: Partial<WhoSettings>) => void;
  /**
   * Revient à la configuration du build : efface le compte saisi, son mot
   * secret, la version et la langue surchargées, et le jeton en cache.
   */
  resetWho: () => void;
  dismissDisclaimer: () => void;
  resetDisclaimer: () => void;
}

/**
 * L'ANALYSE INTERROGE LES DEUX RÉFÉRENTIELS. Ce qui se règle, c'est l'ordre
 * d'affichage (`sourcePriority`, défaut OMS) et le seuil — pas un mode qui
 * couperait l'un ou l'autre. Hors connexion, le dictionnaire porte seul le
 * résultat (`HomePage`).
 */
export const useSettingsStore = create<SettingsState>((set, get) => ({
  minConfidence: readMinConfidenceThreshold(),
  sourcePriority: readSourcePriority(),
  who: readWhoSettings(),
  disclaimerDismissed: readSnapshot().disclaimerDismissed,

  setMinConfidence: value => {
    writeMinConfidenceThreshold(value);
    set({ minConfidence: value });
  },
  setSourcePriority: value => {
    writeSourcePriority(value);
    set({ sourcePriority: value });
  },
  setWho: patch => {
    const next = { ...get().who, ...patch };
    writeWhoSettings(next);
    resetOmsToken(); // identifiants/passerelle changés → jeton caché obsolète
    set({ who: next });
  },
  resetWho: () => {
    const defauts = defautsWho();
    const next = {
      ...get().who,
      clientId: '',
      clientSecret: '',
      releaseId: defauts.releaseId,
      lang: defauts.lang,
    };
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
