/**
 * Sauvegarde et restauration des données de l'app, sur le module partagé
 * `@mister-guiiug/dev-pwa-config/backup`.
 *
 * CE QUE LA VERSION PRÉCÉDENTE FAISAIT, ET POURQUOI IL FALLAIT L'ARRÊTER.
 * L'export énumérait une LISTE BLANCHE de seize noms de clés tenue à la main ;
 * l'import, lui, ne lisait aucune liste :
 *
 *   for (const [k, v] of Object.entries(data)) {
 *     if (typeof v === 'string') localStorage.setItem(k, v);
 *   }
 *
 * Aucun marqueur de format, aucune identité d'app, aucun filtre : n'importe
 * quel objet JSON à valeurs chaînes était accepté, et CHACUNE de ses entrées
 * écrite dans le `localStorage` — celui que les dix-sept applications de la
 * famille partagent, puisqu'elles sont servies depuis la même origine. Un
 * fichier fabriqué offrait donc, derrière un sélecteur de fichier, une écriture
 * arbitraire dans les données des seize autres apps. `{"a":"b"}` était par
 * ailleurs importé « avec succès ».
 *
 * La liste blanche d'export avait en outre DÉRIVÉ : cinq de ses seize entrées
 * — `favorites`, `saved_sessions`, `cr_history`, `validated_session`,
 * `app_theme` — n'avaient plus aucun lecteur dans `src/`. C'est le défaut
 * structurel d'une liste tenue à la main : elle ment dans les deux sens, et
 * personne ne s'en aperçoit.
 *
 * CE QUE LE PRÉFIXE CHANGE. Depuis `./storage-migration.ts`, les clés de l'app
 * vivent sous `cim10_`. `createStore('cim10_').keys()` les énumère donc TOUTES
 * et RIEN D'AUTRE, sans liste à maintenir, et `restoreBackup` écrit par
 * `store.setRaw`, qui préfixe : quel que soit le contenu du fichier, une
 * restauration ne peut PLUS écrire hors de `cim10_`. Le garde-fou n'est plus
 * une vérification qu'on peut oublier, c'est une propriété de la structure.
 *
 * LE MOT SECRET OMS N'EST PLUS SAUVEGARDÉ. `who_icd_client_secret` partait en
 * clair dans le fichier — alors même que le partage par lien prend soin de ne
 * jamais le mettre dans une URL. Il est retiré de l'enveloppe avant écriture.
 * La restauration est en FUSION (jamais `replace`), donc restaurer une
 * sauvegarde ne détruit pas le mot secret déjà saisi sur l'appareil.
 */
import {
  createBackup,
  restoreBackup,
  BACKUP_FORMAT,
  BACKUP_VERSION,
} from '@mister-guiiug/dev-pwa-config/backup';
import { dateSlug, downloadJson } from '@mister-guiiug/dev-pwa-config/download';
import { APP_PREFIX, LEGACY_KEY_MAP } from './storage-migration';
import { appStore, refreshSnapshot } from './app-store';

/** Identité de l'app dans le fichier de sauvegarde. */
const APP_ID = 'mister-cim10';

/** Nom court (sous le préfixe) du mot secret OMS, exclu des sauvegardes. */
const SECRET_KEY = 'who_icd_client_secret';

/**
 * Le magasin de l'app : tout `cim10_`, rien d'autre. Défini dans
 * `./app-store.ts`, réexporté ici parce que c'est cette façade que la
 * sauvegarde a toujours exposée.
 */
export { appStore };

type BackupFile = ReturnType<typeof createBackup>;

/** L'enveloppe famille, mot secret OMS retiré. */
export function buildAppBackup(): BackupFile {
  const backup = createBackup(appStore, { app: APP_ID });
  delete backup.data[SECRET_KEY];
  backup.entries = Object.keys(backup.data).length;
  return backup;
}

/** Télécharge la sauvegarde. `false` si le téléchargement n'a pas pu partir. */
export function downloadAppBackup(): boolean {
  return downloadJson(
    buildAppBackup(),
    `${APP_ID}-sauvegarde-${dateSlug()}.json`
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Convertit une sauvegarde produite AVANT le préfixe — un objet plat de clés
 * non préfixées — en enveloppe famille. Rend `null` si le fichier n'a pas
 * cette forme.
 *
 * C'est ici, et seulement ici, qu'une liste de clés reste justifiée : elle
 * décrit un format de fichier FIGÉ, dont le contenu possible est clos. Les
 * entrées mortes de l'ancienne liste blanche (`favorites`, `cr_history`…) n'en
 * font pas partie : rien ne les relit, les reprendre ne restaurerait rien.
 */
function adaptLegacyBackup(parsed: unknown): BackupFile | null {
  if (!isRecord(parsed) || 'format' in parsed) return null;
  const data: Record<string, string> = {};
  for (const [legacy, short] of Object.entries(LEGACY_KEY_MAP)) {
    const value = parsed[legacy];
    if (typeof value === 'string') data[short] = value;
  }
  if (Object.keys(data).length === 0) return null;
  delete data[SECRET_KEY];
  return {
    format: BACKUP_FORMAT,
    v: BACKUP_VERSION,
    app: APP_ID,
    prefix: APP_PREFIX,
    appVersion: undefined,
    exportedAt: new Date().toISOString(),
    entries: Object.keys(data).length,
    data,
  };
}

export type RestoreResult =
  | { ok: true; restored: number }
  | { ok: false; problems: string[] };

/**
 * Restaure une sauvegarde depuis le texte d'un fichier.
 *
 * VALIDE d'abord, écrit ensuite : un fichier tronqué, retouché ou venu d'une
 * autre app est refusé AVANT la première écriture, et les motifs sont rendus
 * pour être affichés — pas journalisés dans une console.
 */
export function restoreAppBackup(json: string): RestoreResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, problems: ['le fichier n’est pas du JSON lisible'] };
  }
  const backup = adaptLegacyBackup(parsed) ?? parsed;
  // Fusion volontaire (pas de `replace`) : les clés absentes du fichier
  // survivent, à commencer par le mot secret OMS que l'export ne contient plus.
  const result = restoreBackup(appStore, backup);
  // L'instantané est gardé en mémoire (`./app-store.ts`) : sans cette purge,
  // la lecture suivante rendrait l'état d'AVANT la restauration. L'écran de
  // réglages recharge la page dans la foulée, mais un appelant qui ne le ferait
  // pas ne doit pas hériter d'un état périmé.
  if (result.ok) refreshSnapshot();
  return result;
}
