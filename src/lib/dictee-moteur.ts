/**
 * Ce que la dictée fait une fois lancée : savoir où la parole sera traitée,
 * traduire les erreurs de l'API, écrire le texte au curseur.
 *
 * UN MODULE À PART DE `./dictee.ts`, ET C'EST POUR LE POIDS. Celui-là est lu
 * par l'accueil avant même que la dictée soit demandée — il faut savoir si le
 * bouton a lieu d'être — et par les Réglages, pour l'accord. Celui-ci n'est
 * importé que par la dictée chargée à la demande (`Dictation.tsx`) : il ne
 * pèse pas sur le premier affichage.
 */
import type { EnvironnementDictee } from './dictee';

/* ── Où la parole sera traitée ───────────────────────────────────────────── */

/** `appareil` : rien ne sort. `en-ligne` : l'audio part chez l'éditeur. */
export type ModeDictee = 'appareil' | 'en-ligne';

/**
 * `a-installer` : le navigateur sait faire sur l'appareil, mais doit d'abord
 * télécharger le modèle de la langue — ce que `install()` déclenche.
 */
export type EtatReconnaissanceLocale =
  'disponible' | 'a-installer' | 'indisponible';

/**
 * Le navigateur sait-il reconnaître cette langue SUR L'APPAREIL ? Ne démarre
 * rien et ne télécharge rien.
 *
 * Il faut les DEUX moitiés de l'API : `available()` pour poser la question, et
 * `processLocally` pour l'exiger ensuite. Un navigateur qui n'offre que la
 * première ne pourrait pas tenir la promesse qu'on ferait à l'utilisateur ; il
 * est traité comme un navigateur qui n'offre rien — c'est-à-dire en ligne,
 * accord compris.
 */
export async function etatReconnaissanceLocale(
  env: EnvironnementDictee,
  langue: string
): Promise<EtatReconnaissanceLocale> {
  const C = env.Reconnaissance;
  if (
    C === null ||
    typeof C.available !== 'function' ||
    !('processLocally' in C.prototype)
  ) {
    return 'indisponible';
  }
  try {
    const etat = await C.available({ langs: [langue], processLocally: true });
    if (etat === 'available') return 'disponible';
    if (
      (etat === 'downloadable' || etat === 'downloading') &&
      typeof C.install === 'function'
    ) {
      return 'a-installer';
    }
    return 'indisponible';
  } catch {
    return 'indisponible';
  }
}

/** Télécharge le modèle local de la langue. `false` sur tout échec. */
export async function installerReconnaissanceLocale(
  env: EnvironnementDictee,
  langue: string
): Promise<boolean> {
  try {
    const installe = await env.Reconnaissance?.install?.({
      langs: [langue],
      processLocally: true,
    });
    return installe === true;
  } catch {
    return false;
  }
}

/* ── Les erreurs, dites dans la langue de l'utilisateur ──────────────────── */

export type ErreurDictee =
  | 'micro-refuse'
  | 'service-refuse'
  | 'rien-entendu'
  | 'pas-de-micro'
  | 'reseau'
  | 'hors-ligne'
  | 'langue'
  | 'inconnue';

/**
 * L'erreur de l'API, traduite en cas que l'IHM sait expliquer. `aborted` rend
 * `null` : c'est l'application qui a coupé, il n'y a rien à dire.
 */
export function traduireErreurDictee(code: string): ErreurDictee | null {
  switch (code) {
    case 'aborted':
      return null;
    case 'not-allowed':
      return 'micro-refuse';
    case 'service-not-allowed':
      return 'service-refuse';
    case 'no-speech':
      return 'rien-entendu';
    case 'audio-capture':
      return 'pas-de-micro';
    case 'network':
      return 'reseau';
    case 'language-not-supported':
      return 'langue';
    default:
      return 'inconnue';
  }
}

/* ── Le texte dicté, là où est le curseur ──────────────────────────────── */

/**
 * Insère `fragment` entre `debut` et `fin` (la sélection éventuelle est
 * remplacée), avec une espace de part et d'autre quand il en manque, et rend
 * la position du curseur juste après le fragment.
 *
 * Les bornes sont RAMENÉES dans le texte : entre deux segments, l'utilisateur
 * a pu effacer ce qu'il y avait après le curseur.
 */
export function insererAuCurseur(
  texte: string,
  debut: number,
  fin: number,
  fragment: string
): { texte: string; curseur: number } {
  const borne = (n: number) => Math.min(Math.max(0, n), texte.length);
  const a = borne(Math.min(debut, fin));
  const b = borne(Math.max(debut, fin));
  const propre = fragment.trim();
  if (propre === '') return { texte, curseur: b };
  const avant = texte.slice(0, a);
  const apres = texte.slice(b);
  const espaceAvant = avant !== '' && !/\s$/u.test(avant) ? ' ' : '';
  // Pas d'espace devant une ponctuation qui suit : « diabète, » et non
  // « diabète , ».
  const espaceApres = apres !== '' && !/^[\s.,;:!?)\]]/u.test(apres) ? ' ' : '';
  const insere = `${avant}${espaceAvant}${propre}`;
  return {
    texte: `${insere}${espaceApres}${apres}`,
    curseur: insere.length,
  };
}
