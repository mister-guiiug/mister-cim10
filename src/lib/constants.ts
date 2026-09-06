// La migration des clés historiques sous le préfixe `cim10_` doit avoir eu lieu
// AVANT la première lecture. Tout module qui lit une clé importe `LS_KEYS` d'ici
// et attend donc l'évaluation complète de ce fichier — cet import de tête est le
// point le plus tôt possible, et il ne dépend d'aucun ordre dans `main.tsx`.
import './storage-migration';
import { APP_PREFIX } from './storage-migration';

/**
 * Les clés `localStorage` que l'app lit ENCORE une par une.
 *
 * Il n'en reste qu'une. Depuis `./app-store.ts`, l'état de l'application — le
 * compte-rendu, les diagnostics retenus, les sessions, le mode, le seuil,
 * l'avertissement et la connexion OMS publique — tient dans un seul instantané
 * versionné (`cim10_data`). Les neuf noms qui figuraient ici ne désignaient plus
 * que des clés d'HIER : leur reprise appartient à la migration 0 → 1
 * (`CLES_EPARSES` dans `./app-store.ts`), pas à une liste que le code courant
 * consulterait. Une liste qu'on n'utilise plus mais qu'on garde finit toujours
 * par mentir — ce dépôt en a déjà fait les frais (voir l'en-tête de
 * `./storage.ts` sur l'ancienne liste blanche de sauvegarde).
 *
 * Deux clés restent hors de l'instantané, et chacune pour une raison précise :
 *   - `WHO_CLIENT_SECRET` : la sauvegarde JSON exclut le mot secret PAR SON NOM
 *     DE CLÉ ; fondu dans l'instantané, il repartirait en clair dans le fichier.
 *   - `THEME` : `dwc_theme` appartient au socle, qui la lit depuis le script
 *     anti-FOUC avant l'exécution du bundle.
 */
export const LS_KEYS = {
  WHO_CLIENT_SECRET: `${APP_PREFIX}who_icd_client_secret`,
  /** Clé FAMILLE du socle (theme-boot/ThemeProvider) : jamais préfixée. */
  THEME: 'dwc_theme',
} as const;
