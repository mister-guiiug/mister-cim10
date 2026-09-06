/**
 * Lecture et écriture des réglages — la même façade qu'avant, désormais servie
 * par l'instantané versionné (`./app-store.ts`) et non plus par six clés
 * `localStorage` distinctes.
 *
 * SEUL LE MOT SECRET OMS GARDE SA CLÉ. Il ne peut pas entrer dans l'instantané
 * sans repartir en clair dans chaque fichier de sauvegarde, qui exclut le
 * secret PAR SON NOM DE CLÉ (`./storage.ts`). Il reste donc sous
 * `cim10_who_icd_client_secret`, et c'est ici, à la frontière, qu'on le
 * recolle aux réglages publics pour rendre le `WhoSettings` complet que le
 * reste de l'app attend.
 */
import { LS_KEYS } from './constants';
import { readSnapshot, updateSnapshot, borneSeuil } from './app-store';
import type { AnalyzeMode, WhoSettings } from '../types/index';

export function readAnalyzeMode(): AnalyzeMode {
  return readSnapshot().mode;
}

export function writeAnalyzeMode(mode: AnalyzeMode): void {
  updateSnapshot({ mode });
}

export function readWhoSettings(): WhoSettings {
  return {
    ...readSnapshot().who,
    clientSecret: localStorage.getItem(LS_KEYS.WHO_CLIENT_SECRET) || '',
  };
}

export function writeWhoSettings(s: WhoSettings): void {
  updateSnapshot({
    who: {
      clientId: s.clientId.trim(),
      proxyUrl: s.proxyUrl.trim(),
      releaseId: s.releaseId,
      lang: s.lang,
    },
  });
  if (s.clientSecret)
    localStorage.setItem(LS_KEYS.WHO_CLIENT_SECRET, s.clientSecret);
  else localStorage.removeItem(LS_KEYS.WHO_CLIENT_SECRET);
}

export function readMinConfidenceThreshold(): number {
  return readSnapshot().minConfidence;
}

export function writeMinConfidenceThreshold(value: number): void {
  updateSnapshot({ minConfidence: borneSeuil(value) });
}
