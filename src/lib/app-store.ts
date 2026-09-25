/**
 * L'état de l'application dans UN instantané versionné.
 *
 * CE QUI EXISTAIT, ET CE QUI CLOCHAIT. Toutes les données vivaient en clés
 * `localStorage` séparées sous `cim10_` — dix clés écrites et relues à la main
 * par `settings.ts`, `settingsStore.ts` et `workspaceStore.ts`. Ça marche tant
 * que le modèle ne bouge pas. Le jour où il bouge — un champ qui change de
 * forme, une liste qui gagne une propriété obligatoire — il n'y a AUCUN moyen
 * de savoir ce qu'on lit : pas de numéro de schéma, pas de chaîne de
 * migrations, donc pas de reprise possible. Le code de lecture se contente
 * alors de jeter ce qu'il ne comprend pas (`loadValidated` rendait `[]` sur
 * n'importe quelle surprise), et l'utilisateur retrouve une app vide après une
 * mise à jour, sans un mot.
 *
 * CE QUE LE MAGASIN VERSIONNÉ CHANGE. `createVersionedStore` du socle enveloppe
 * l'état (`{ v, data }`), applique une chaîne de migrations qui monte d'un cran
 * à la fois, valide, et — c'est le point — COPIE DE CÔTÉ avant toute perte
 * possible : version inconnue, JSON tronqué, migration qui lève. Rien n'est
 * jamais écrasé en silence.
 *
 * LA VERSION 0, C'EST L'ÉTAT D'AUJOURD'HUI. Le magasin lit UNE clé ; tant
 * qu'elle n'existe pas, il rend le seed et ne joue aucune migration — une
 * chaîne de migrations ne sait pas, à elle seule, aller chercher des données
 * ailleurs. `adopterClesEparses()` dépose donc les clés d'aujourd'hui telles
 * quelles sous `cim10_data`, SANS enveloppe : le socle compte toute valeur sans
 * `v` en version 0 (c'est le chemin d'adoption qu'il documente), et la
 * migration 0 → 1 ci-dessous les traduit au premier chargement.
 *
 * LA PASSERELLE N'EST PLUS UN RÉGLAGE D'APPAREIL — C'EST LA VERSION 2. Son
 * adresse venait du stockage, et un champ des Réglages la changeait. La CSP a
 * vidé ce choix de son sens : `connect-src` est figée au build, et toute autre
 * adresse est coupée par le navigateur avant que la requête parte. Elle vient
 * donc du build seul (`./who-defaults.ts`), et la migration 1 → 2 EFFACE celle
 * que les appareils en service ont gardée — la laisser, ce serait garder un
 * réglage qui fait semblant de régler quelque chose.
 *
 * LE MOT SECRET OMS N'ENTRE PAS DANS L'INSTANTANÉ. Il garde sa clé propre,
 * `cim10_who_icd_client_secret`. Ce n'est pas un oubli : `buildAppBackup()`
 * (voir `./storage.ts`) énumère TOUT le préfixe et retire le secret par son nom
 * de clé. Fondu dans le JSON de l'instantané — et dans sa copie de côté — il
 * repartirait en clair dans chaque fichier de sauvegarde, alors même que le
 * partage par lien prend soin de ne jamais le mettre dans une URL.
 *
 * `cim10_locale` reste également à part : elle appartient à l'i18n du socle,
 * qui la lit avant le premier rendu.
 *
 * LES FAVORIS SONT ENTRÉS SANS CRAN DE VERSION, et c'est voulu. Un champ
 * AJOUTÉ, que `valider()` comble quand il manque, se lit sur n'importe quel
 * instantané de version 2 : il n'y a rien à migrer. Le cran sert quand une
 * donnée déjà stockée doit changer de forme ou partir (cf. 1 → 2). Monter la
 * version aurait même un coût : une version antérieure de l'app, rouverte
 * après coup, mettrait l'instantané de côté et repartirait d'un écran vide —
 * là où elle se contente aujourd'hui d'ignorer un champ qu'elle ne connaît pas.
 */
import { createStore } from '@mister-guiiug/dev-pwa-config/storage';
import { createVersionedStore } from '@mister-guiiug/dev-pwa-config/versioned-store';
import { readRaw, removeKey } from '@mister-guiiug/dev-pwa-config/storage';
import { APP_PREFIX } from './storage-migration';
import { favorisValides } from './favoris';
import type {
  FavoriteCode,
  SavedSession,
  ValidatedDiagnostic,
  WhoSettings,
} from '../types/index';

/** Le magasin de l'app : tout `cim10_`, rien d'autre. */
export const appStore = createStore(APP_PREFIX);

/** Nom court (sous le préfixe) de l'instantané. */
export const SNAPSHOT_KEY = 'data';

/** Version du schéma de l'instantané. */
export const SCHEMA_VERSION = 2;

/** Nombre de sessions nommées conservées — au-delà, la plus ancienne sort. */
export const MAX_SESSIONS = 5;

/** Seuil de confiance par défaut, repris de l'ancien `settings.ts`. */
const DEFAULT_MIN_CONFIDENCE = 0.4;

/**
 * Connexion OMS telle que l'APPAREIL la garde : ni le mot secret, ni la
 * passerelle (cf. en-tête). `WhoSettings`, lui, porte les deux — c'est le
 * réglage EFFECTIF, recomposé à la lecture par `./settings.ts`.
 */
export type WhoPublicSettings = Omit<WhoSettings, 'clientSecret' | 'proxyUrl'>;

/** L'état complet de l'application sous une seule clé. */
export interface AppSnapshot {
  /** Compte-rendu en cours de saisie. */
  crText: string;
  /** Diagnostics retenus, le plus récent en tête. */
  validated: ValidatedDiagnostic[];
  /** Dossiers enregistrés sous un nom, le plus récent en tête. */
  sessions: SavedSession[];
  /** Codes mis en favori, dans l'ordre de la classification. */
  favorites: FavoriteCode[];
  /** Confiance minimale d'affichage d'une suggestion. */
  minConfidence: number;
  /** L'avertissement d'accueil a été masqué. */
  disclaimerDismissed: boolean;
  /** Connexion OMS, mot secret exclu. */
  who: WhoPublicSettings;
}

/** L'état d'un appareil vierge. */
function etatInitial(): AppSnapshot {
  return {
    crText: '',
    validated: [],
    sessions: [],
    favorites: [],
    minConfidence: DEFAULT_MIN_CONFIDENCE,
    disclaimerDismissed: false,
    who: {
      clientId: '',
      releaseId: '2025-01',
      lang: 'fr',
    },
  };
}

function estObjet(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function texte(value: unknown, defaut: string): string {
  return typeof value === 'string' ? value : defaut;
}

/** Le seuil, ramené dans [0,1 ; 1] au centième — comme l'ancien lecteur. */
export function borneSeuil(value: unknown): number {
  const parsed =
    typeof value === 'number' ? value : Number.parseFloat(String(value));
  if (!Number.isFinite(parsed)) return DEFAULT_MIN_CONFIDENCE;
  if (parsed < 0.1) return 0.1;
  if (parsed > 1) return 1;
  return Math.round(parsed * 100) / 100;
}

function diagnosticsValides(value: unknown): ValidatedDiagnostic[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is ValidatedDiagnostic =>
      estObjet(v) &&
      typeof v.id === 'string' &&
      typeof v.code === 'string' &&
      typeof v.label === 'string'
  );
}

function sessionsValides(value: unknown): SavedSession[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (s): s is SavedSession =>
        estObjet(s) && typeof s.id === 'string' && typeof s.name === 'string'
    )
    .map(s => ({
      id: s.id,
      name: s.name,
      savedAt: typeof s.savedAt === 'number' ? s.savedAt : 0,
      crText: texte(s.crText, ''),
      validated: diagnosticsValides(s.validated),
    }))
    .slice(0, MAX_SESSIONS);
}

/**
 * Validation injectée dans le magasin (le socle ne dépend d'aucun schéma).
 *
 * LÈVE sur ce qui n'est pas un objet — là, l'instantané entier est suspect et
 * le socle doit le mettre de côté. RÉPARE champ par champ sinon : les sept
 * champs sont indépendants, et perdre le compte-rendu parce qu'un seuil est
 * arrivé en chaîne serait une punition disproportionnée.
 */
function valider(data: unknown): AppSnapshot {
  if (!estObjet(data)) {
    throw new TypeError('instantané cim10 : objet attendu');
  }
  const initial = etatInitial();
  const who = estObjet(data.who) ? data.who : {};
  return {
    crText: texte(data.crText, initial.crText),
    validated: diagnosticsValides(data.validated),
    sessions: sessionsValides(data.sessions),
    favorites: favorisValides(data.favorites),
    minConfidence: borneSeuil(data.minConfidence),
    disclaimerDismissed: data.disclaimerDismissed === true,
    who: {
      clientId: texte(who.clientId, '').trim(),
      releaseId: texte(who.releaseId, initial.who.releaseId),
      lang: texte(who.lang, initial.who.lang),
    },
  };
}

/**
 * Les clés éparses reprises dans l'instantané. Le mot secret et la langue n'y
 * sont PAS (cf. en-tête).
 *
 * DEUX CLÉS Y RESTENT ALORS QU'ELLES NE SE TRADUISENT PLUS. `analyze_mode` :
 * le sélecteur à trois modes a disparu, l'analyse interroge les deux
 * référentiels. `who_icd_proxy_url` : la passerelle vient du build. Mais ces
 * clés existent encore sur les appareils en service — les garder dans cette
 * liste est ce qui les fait LIRE, donc EFFACER (`retirerClesEparses`). Retirées
 * d'ici, elles traîneraient indéfiniment dans le stockage et dans chaque
 * fichier de sauvegarde. Même raison pour `who_icd_enabled`, ancêtre booléen du
 * mode.
 */
const CLES_EPARSES = [
  'analyze_mode',
  'who_icd_client_id',
  'who_icd_release',
  'who_icd_lang',
  'who_icd_proxy_url',
  'min_confidence_threshold',
  'disclaimer_dismissed',
  'validated_diagnostics',
  'cr_text',
] as const;

function jsonOuNull(raw: string | null): unknown {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Traduit la carte plate des clés d'aujourd'hui en morceau d'instantané.
 *
 * Chaque valeur arrive telle que le `localStorage` la rend — une CHAÎNE, y
 * compris `'1'` pour un booléen et du JSON pour la liste des diagnostics. Une
 * clé ABSENTE ne produit rien : c'est ce qui permet d'utiliser la même
 * traduction pour la migration (par-dessus l'état initial) et pour une reprise
 * tardive (par-dessus l'état courant), sans jamais réinitialiser un champ que
 * le fichier ne portait pas.
 */
function traduireClesEparses(data: unknown): Partial<AppSnapshot> {
  const plat = estObjet(data) ? data : {};
  const patch: Partial<AppSnapshot> = {};
  if (typeof plat.cr_text === 'string') patch.crText = plat.cr_text;
  if (typeof plat.validated_diagnostics === 'string') {
    patch.validated = diagnosticsValides(
      jsonOuNull(plat.validated_diagnostics)
    );
  }
  // `analyze_mode` et `who_icd_proxy_url` sont LUES mais plus traduites : il n'y
  // a plus de mode, et la passerelle vient du build. Elles sont lues pour être
  // effacées (cf. l'en-tête de `CLES_EPARSES`).
  if (plat.min_confidence_threshold !== undefined) {
    patch.minConfidence = borneSeuil(plat.min_confidence_threshold);
  }
  if (plat.disclaimer_dismissed !== undefined) {
    patch.disclaimerDismissed = plat.disclaimer_dismissed === '1';
  }
  const who: Partial<WhoPublicSettings> = {};
  if (typeof plat.who_icd_client_id === 'string')
    who.clientId = plat.who_icd_client_id;
  if (typeof plat.who_icd_release === 'string')
    who.releaseId = plat.who_icd_release;
  if (typeof plat.who_icd_lang === 'string') who.lang = plat.who_icd_lang;
  if (Object.keys(who).length > 0) {
    patch.who = { ...etatInitial().who, ...who };
  }
  return patch;
}

/** Migration 0 → 1 : les clés d'aujourd'hui, par-dessus l'état initial. */
function migrerV0(data: unknown): unknown {
  return { ...etatInitial(), ...traduireClesEparses(data) };
}

/**
 * Migration 1 → 2 : la passerelle enregistrée est RETIRÉE, pas ignorée.
 *
 * `valider()` ne la lit plus — ça suffirait à ce que l'application ne la voie
 * plus. Mais le socle ne réécrit l'instantané que lorsqu'il MIGRE : sans ce
 * cran de version, l'adresse resterait dans le JSON stocké et repartirait dans
 * chaque fichier de sauvegarde jusqu'à la prochaine écriture — un réglage
 * fantôme qu'aucun écran ne montre plus et qu'aucun code ne lit.
 *
 * Rien n'est perdu pour autant : le socle copie de côté (`…data.backup-v1`)
 * avant de migrer.
 */
function migrerV1(data: unknown): unknown {
  if (!estObjet(data)) return data;
  const who = estObjet(data.who) ? { ...data.who } : {};
  delete who.proxyUrl;
  return { ...data, who };
}

const versionne = createVersionedStore<AppSnapshot>({
  store: appStore,
  key: SNAPSHOT_KEY,
  version: SCHEMA_VERSION,
  migrations: { 0: migrerV0, 1: migrerV1 },
  validate: valider,
  seed: etatInitial,
});

/** Les clés éparses présentes dans le stockage, ou `null` s'il n'y en a aucune. */
function lireClesEparses(): Record<string, string> | null {
  const plat: Record<string, string> = {};
  for (const court of CLES_EPARSES) {
    const valeur = appStore.getRaw(court);
    if (valeur !== null) plat[court] = valeur;
  }
  // Vestige d'avant le mode à trois valeurs : un booléen NON préfixé. Sa valeur
  // ne veut plus rien dire, mais sa PRÉSENCE doit encore déclencher le ménage —
  // sans cette ligne, un appareil qui ne porte QUE cette clé ne passerait jamais
  // par `retirerClesEparses` et la garderait pour toujours.
  if (plat.analyze_mode === undefined && readRaw('who_icd_enabled') === '1') {
    plat.analyze_mode = 'both';
  }
  return Object.keys(plat).length === 0 ? null : plat;
}

/**
 * Retire les clés éparses, une fois leur contenu dans l'instantané. Sans ça,
 * chaque sauvegarde JSON emporterait deux copies du même état, et une clé
 * oubliée ferait foi contre l'instantané au prochain démarrage. La copie de
 * côté `cim10_data.backup-v0` du socle reste le filet.
 */
function retirerClesEparses(): void {
  for (const court of CLES_EPARSES) appStore.remove(court);
  removeKey('who_icd_enabled');
}

let cache: AppSnapshot | null = null;

/**
 * L'instantané courant — reprise des clés d'hier, migration et validation
 * comprises. Le résultat est gardé en mémoire : `setCrText` est appelé à chaque
 * frappe, il ne va pas relire et revalider le JSON complet à chaque fois.
 *
 * DEUX CHEMINS DE REPRISE, et le second n'est pas théorique :
 *
 *  1. **Premier démarrage après la mise à jour** — l'instantané n'existe pas.
 *     Les clés d'hier sont déposées telles quelles (donc en version 0) et le
 *     socle les fait passer par `migrerV0`, copie de côté comprise.
 *  2. **Restauration d'une sauvegarde d'AVANT l'instantané** — l'instantané
 *     existe déjà, et `restoreAppBackup` vient d'écrire des clés éparses. Les
 *     ignorer rendrait la restauration muette : elle écrirait le fichier sans
 *     que rien ne change à l'écran. Leur traduction est donc appliquée
 *     PAR-DESSUS l'état courant, champ par champ.
 */
export function readSnapshot(): AppSnapshot {
  if (cache !== null) return cache;
  const eparses = lireClesEparses();
  const vierge = appStore.getRaw(SNAPSHOT_KEY) === null;
  if (eparses !== null && vierge) {
    appStore.setRaw(SNAPSHOT_KEY, JSON.stringify(eparses));
  }
  // `load()` migre ET persiste la version courante (contrat du socle) : à la
  // ligne suivante, l'instantané fait foi.
  cache = versionne.load();
  if (eparses !== null) {
    if (!vierge) {
      cache = valider({ ...cache, ...traduireClesEparses(eparses) });
      versionne.save(cache);
    }
    retirerClesEparses();
  }
  return cache;
}

/** Applique un correctif à l'instantané et l'écrit. Rend l'état résultant. */
export function updateSnapshot(patch: Partial<AppSnapshot>): AppSnapshot {
  const next = valider({ ...readSnapshot(), ...patch });
  versionne.save(next);
  cache = next;
  return next;
}

/**
 * Vide le cache mémoire : la prochaine lecture repart du stockage. Appelé
 * après une restauration de sauvegarde, et par les tests.
 */
export function refreshSnapshot(): void {
  cache = null;
}

/** Efface l'instantané ET ses copies de côté. Le reste du préfixe survit. */
export function clearSnapshot(): void {
  versionne.clear();
  cache = null;
}
