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
import { defautsWho } from './who-defaults';
import type { WhoSettings } from '../types/index';

/**
 * Les réglages OMS : l'enregistré d'abord, le défaut du build pour combler —
 * SAUF LA PASSERELLE, QUI NE VIENT QUE DU BUILD.
 *
 * LE COMBLEMENT SE FAIT À LA LECTURE, pas à l'initialisation de l'instantané :
 * l'application est déjà déployée et les appareils en service ont un instantané
 * écrit avant que ces variables existent. Comblé à l'initialisation seulement,
 * le nouveau défaut ne serait jamais arrivé chez eux.
 *
 * ⚠️ LA PASSERELLE ÉCHAPPE À LA RÈGLE « L'ENREGISTRÉ L'EMPORTE », et il le
 * faut. Cette règle se tenait tant qu'une adresse saisie à la main pouvait
 * répondre. Depuis que `connect-src` est figée au build, une autre adresse est
 * coupée par le navigateur : l'appareil n'obtient plus rien de l'OMS, sans un
 * mot d'explication. Une valeur enregistrée ne peut donc plus QUE nuire — le
 * champ qui la posait a disparu, et la migration 1 → 2 (`./app-store.ts`)
 * efface celle que les appareils avaient gardée. Ici, on lit le build, point.
 */
export function readWhoSettings(): WhoSettings {
  const enregistre = readSnapshot().who;
  const defauts = defautsWho();
  return {
    clientId: enregistre.clientId,
    clientSecret: localStorage.getItem(LS_KEYS.WHO_CLIENT_SECRET) || '',
    proxyUrl: defauts.proxyUrl,
    releaseId: enregistre.releaseId || defauts.releaseId,
    lang: enregistre.lang || defauts.lang,
  };
}

/**
 * Écrit les réglages OMS. `proxyUrl` ARRIVE — l'appelant tient un `WhoSettings`
 * complet — mais N'EST PAS ÉCRIT : le persister le ferait rentrer par la
 * fenêtre à la première sauvegarde, alors que la migration 1 → 2 vient de le
 * faire sortir par la porte.
 */
export function writeWhoSettings(s: WhoSettings): void {
  updateSnapshot({
    who: {
      clientId: s.clientId.trim(),
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
