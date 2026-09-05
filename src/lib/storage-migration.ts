/**
 * Les clés de l'app passent sous le préfixe `cim10_`, une fois, au démarrage.
 *
 * POURQUOI. Les dix-sept applications de la famille sont servies depuis la même
 * origine — `mister-guiiug.github.io` — et partagent donc UN seul
 * `localStorage`. mister-CIM-10 y écrivait `favorites`, `cr_text`,
 * `analyze_mode`, `settings`-like : des noms assez génériques pour qu'une autre
 * app de la famille les revendique. Ce n'est pas théorique — mister-family-map
 * a eu besoin de `favorites` aussi, et n'a été sauvé que par son préfixe `mfm_`.
 *
 * CE QUE LE PRÉFIXE DÉBLOQUE, au-delà de la collision : `createStore('cim10_')`
 * sait ÉNUMÉRER les données de l'app, ce qu'une liste blanche écrite à la main
 * ne sait pas faire de façon fiable (voir `./storage.ts`). C'est la condition
 * d'entrée du module `@mister-guiiug/dev-pwa-config/backup`.
 *
 * CE QUI NE PASSE PAS SOUS LE PRÉFIXE. `dwc_theme` appartient à la FAMILLE, pas
 * à l'app : c'est le `DEFAULT_STORAGE_KEY` du socle, lu par le script anti-FOUC
 * injecté dans `index.html` avant même que le bundle ne s'exécute. La préfixer
 * casserait le thème. Elle reste donc en place, et sort du périmètre de
 * sauvegarde — une préférence d'appareil, pas une donnée de travail.
 *
 * CE QUI N'EST PAS REPRIS. Cinq clés de l'ancienne liste blanche n'ont AUCUN
 * lecteur dans `src/` : `favorites`, `saved_sessions`, `cr_history`,
 * `validated_session`, `app_theme`. Elles ne sont ni migrées ni effacées : ce
 * qui existe chez un utilisateur reste où il est, simplement plus personne ne
 * le recopie.
 *
 * QUAND CE MODULE S'EXÉCUTE. À l'import, et il est importé en tête de
 * `./constants.ts` — donc AVANT le corps de tout module qui lit une clé, car
 * ces modules importent tous `LS_KEYS`. L'ordre d'évaluation des modules ES
 * suffit à le garantir ; il n'y a rien à ordonner à la main dans `main.tsx`.
 */
import {
  readRaw,
  writeRaw,
  removeKey,
} from '@mister-guiiug/dev-pwa-config/storage';

/** Préfixe d'identité de l'app dans le `localStorage` partagé de la famille. */
export const APP_PREFIX = 'cim10_';

/**
 * Ancien nom (sans préfixe) → nom court sous le préfixe.
 *
 * Sert DEUX fois : à la migration ci-dessous, et au décodage des fichiers de
 * sauvegarde produits par les versions antérieures (`./storage.ts`). C'est le
 * seul endroit où une liste de clés reste légitime — elle décrit un format de
 * fichier figé, pas le contenu vivant du magasin.
 */
export const LEGACY_KEY_MAP: Readonly<Record<string, string>> = {
  analyze_mode: 'analyze_mode',
  who_icd_client_id: 'who_icd_client_id',
  who_icd_client_secret: 'who_icd_client_secret',
  who_icd_release: 'who_icd_release',
  who_icd_lang: 'who_icd_lang',
  who_icd_proxy_url: 'who_icd_proxy_url',
  min_confidence_threshold: 'min_confidence_threshold',
  disclaimer_dismissed: 'disclaimer_dismissed',
  validated_diagnostics: 'validated_diagnostics',
  cr_text: 'cr_text',
};

/**
 * Déplace les clés historiques sous le préfixe. Idempotent, et sans perte : la
 * clé d'origine n'est retirée qu'APRÈS relecture de la valeur écrite. Si le
 * stockage refuse l'écriture — navigation privée, quota, données de site
 * bloquées — l'ancienne clé reste en place et l'app continue de fonctionner
 * dessus au prochain essai.
 *
 * @returns les clés effectivement déplacées (utile aux tests).
 */
export function migrateLegacyStorageKeys(): string[] {
  const moved: string[] = [];
  for (const [legacy, short] of Object.entries(LEGACY_KEY_MAP)) {
    const target = `${APP_PREFIX}${short}`;
    const value = readRaw(legacy);
    // Rien à reprendre, ou la version préfixée fait déjà foi : ne pas écraser
    // une donnée récente avec un reliquat d'un onglet resté ouvert.
    if (value === null || readRaw(target) !== null) continue;
    if (!writeRaw(target, value)) continue;
    if (readRaw(target) !== value) continue;
    removeKey(legacy);
    moved.push(short);
  }
  return moved;
}

migrateLegacyStorageKeys();
