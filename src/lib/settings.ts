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
import { defautsWho, passerelleAutorisee } from './who-defaults';
import type { WhoSettings } from '../types/index';

/**
 * Les réglages OMS, l'enregistré d'abord, le défaut du build pour combler.
 *
 * LE COMBLEMENT SE FAIT À LA LECTURE, pas à l'initialisation de l'instantané :
 * l'application est déjà déployée et les appareils en service ont un instantané
 * écrit avant que ces variables existent. Comblé à l'initialisation seulement,
 * le nouveau défaut ne serait jamais arrivé chez eux.
 *
 * ⚠️ UNE PASSERELLE QUE LA CSP N'AUTORISE PAS EST ÉCARTÉE. La règle était
 * « une valeur enregistrée l'emporte toujours », et elle se tenait tant qu'une
 * passerelle saisie à la main pouvait répondre. Depuis que `connect-src` ne
 * porte que l'origine du build et `*.who.int`, une autre adresse est coupée
 * par le navigateur : l'appareil n'obtient plus rien de l'OMS, sans un mot
 * d'explication. La garder par respect d'une règle, ce serait préférer la
 * règle à l'utilisateur — on reprend donc celle du build, qui, elle, répond.
 */
export function readWhoSettings(): WhoSettings {
  const enregistre = readSnapshot().who;
  const defauts = defautsWho();
  // On ne REMPLACE que si l'on a de quoi remplacer : un build sans passerelle
  // (un fork, le développement) n'a rien de mieux à proposer, et effacer la
  // seule adresse que l'appareil possède ne réparerait rien.
  const stocke = enregistre.proxyUrl || defauts.proxyUrl;
  const remplacable = defauts.proxyUrl !== '' && !passerelleAutorisee(stocke);
  return {
    clientId: enregistre.clientId,
    clientSecret: localStorage.getItem(LS_KEYS.WHO_CLIENT_SECRET) || '',
    proxyUrl: remplacable ? defauts.proxyUrl : stocke,
    releaseId: enregistre.releaseId || defauts.releaseId,
    lang: enregistre.lang || defauts.lang,
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
