/**
 * La dictée : ce que le navigateur sait faire, et ce que l'utilisateur accepte.
 *
 * DEUX RECONNAISSANCES, ET ELLES NE SE VALENT PAS SUR UN OUTIL MÉDICAL.
 * L'API Web Speech ne dit pas où la parole est traitée. Chrome, Edge et Safari
 * l'envoient par défaut au service de leur éditeur — Google, Microsoft, Apple :
 * un compte-rendu dicté y part en audio, hors de tout ce que l'application
 * contrôle, et la passerelle OMS n'y est pour rien. Chrome récent sait AUSSI
 * reconnaître sur l'appareil (`processLocally`) et le dit
 * (`SpeechRecognition.available`) : là, rien ne sort.
 *
 * D'où la règle : sur l'appareil dès que le navigateur le permet, sans rien
 * demander ; sinon, un accord explicite au premier usage, gardé sur CE
 * navigateur et révocable dans les Réglages.
 *
 * L'ENVIRONNEMENT EST INJECTÉ. `window.SpeechRecognition` n'existe pas dans
 * jsdom et n'a pas le même visage d'un navigateur à l'autre : chaque fonction
 * reçoit ce qu'elle interroge, et les tests lui passent un double.
 *
 * CE MODULE NE GARDE QUE CE QUI SERT AVANT LA DICTÉE : savoir si le bouton a
 * lieu d'être, et l'accord, que les Réglages lisent et retirent. Le reste —
 * sur l'appareil ou en ligne, erreurs, insertion au curseur — est dans
 * `./dictee-moteur.ts`, chargé avec la dictée.
 */
import { appStore } from './app-store';

/* ── Les types de l'API, au plus juste ─────────────────────────────────────
 * La bibliothèque DOM de TypeScript décrit les événements mais pas
 * `SpeechRecognition` lui-même, et encore moins `processLocally`,
 * `available()` ou `install()`, trop récents. On ne décrit ici que ce qui est
 * appelé — c'est aussi ce qu'un double de test doit fournir. */

export interface AlternativeReconnue {
  transcript: string;
}

export interface ResultatReconnu {
  readonly isFinal: boolean;
  readonly length: number;
  readonly [index: number]: AlternativeReconnue | undefined;
}

export interface EvenementResultat {
  readonly resultIndex: number;
  readonly results: {
    readonly length: number;
    readonly [index: number]: ResultatReconnu | undefined;
  };
}

export interface EvenementErreur {
  readonly error: string;
}

export interface ReconnaissanceVocale {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  /** Chrome récent : exige le traitement sur l'appareil. */
  processLocally?: boolean;
  onstart: (() => void) | null;
  onresult: ((evenement: EvenementResultat) => void) | null;
  onerror: ((evenement: EvenementErreur) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export interface OptionsLangues {
  langs: string[];
  processLocally?: boolean;
}

export interface ConstructeurReconnaissance {
  new (): ReconnaissanceVocale;
  readonly prototype: object;
  available?: (options: OptionsLangues) => Promise<string>;
  install?: (options: OptionsLangues) => Promise<boolean>;
}

/** Ce que la page sait de la reconnaissance vocale du navigateur. */
export interface EnvironnementDictee {
  /** Le constructeur exposé, préfixé ou non ; `null` s'il n'y en a pas. */
  Reconnaissance: ConstructeurReconnaissance | null;
  /** `false` quand le navigateur se sait hors connexion. */
  enLigne: () => boolean;
}

/** L'environnement du navigateur courant. */
export function environnementDuNavigateur(
  cible: object = globalThis
): EnvironnementDictee {
  const fenetre = cible as {
    SpeechRecognition?: unknown;
    webkitSpeechRecognition?: unknown;
    navigator?: { onLine?: boolean };
  };
  const constructeur =
    fenetre.SpeechRecognition ?? fenetre.webkitSpeechRecognition;
  return {
    Reconnaissance:
      typeof constructeur === 'function'
        ? (constructeur as ConstructeurReconnaissance)
        : null,
    enLigne: () => fenetre.navigator?.onLine !== false,
  };
}

/* ── L'accord pour la dictée en ligne ──────────────────────────────────────
 * Une CLÉ À PART, hors de l'instantané, et hors des sauvegardes. L'accord vaut
 * pour le service de CE navigateur — Google derrière Chrome, Apple derrière
 * Safari. Restauré sur un autre appareil, il y autoriserait un autre éditeur
 * sans que personne ait rien lu. `./storage.ts` le retire donc des fichiers
 * dans les deux sens, comme le mot secret OMS. */

/** Nom court (sous le préfixe `cim10_`) de l'accord. */
export const CLE_ACCORD_DICTEE = 'dictation_consent';

/** L'horodatage de l'accord (ms), ou `null` s'il n'a pas été donné. */
export function lireAccordDictee(): number | null {
  const brut = appStore.getRaw(CLE_ACCORD_DICTEE);
  if (brut === null) return null;
  const quand = Number(brut);
  return Number.isFinite(quand) && quand > 0 ? quand : null;
}

/** Enregistre l'accord. `false` si le stockage a refusé l'écriture. */
export function enregistrerAccordDictee(
  maintenant: number = Date.now()
): boolean {
  return appStore.setRaw(CLE_ACCORD_DICTEE, String(maintenant));
}

export function retirerAccordDictee(): void {
  appStore.remove(CLE_ACCORD_DICTEE);
}
