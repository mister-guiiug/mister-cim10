// La migration des clés historiques sous le préfixe `cim10_` doit avoir eu lieu
// AVANT la première lecture. Tout module qui lit une clé importe `LS_KEYS` d'ici
// et attend donc l'évaluation complète de ce fichier — cet import de tête est le
// point le plus tôt possible, et il ne dépend d'aucun ordre dans `main.tsx`.
import './storage-migration';
import { APP_PREFIX } from './storage-migration';

export const FOOTER_NOTE =
  'Outil expérimental sans valeur officielle. Vérifiez chaque code avant utilisation.';

/**
 * Clés `localStorage` de l'app.
 *
 * Toutes portent le préfixe `cim10_` — l'identité de l'app dans le stockage
 * partagé par les dix-sept PWA de la famille (voir `./storage-migration.ts`).
 * Seule exception, `THEME` : `dwc_theme` appartient au socle, qui la lit depuis
 * le script anti-FOUC avant l'exécution du bundle.
 */
export const LS_KEYS = {
  ANALYZE_MODE: `${APP_PREFIX}analyze_mode`,
  WHO_CLIENT_ID: `${APP_PREFIX}who_icd_client_id`,
  WHO_CLIENT_SECRET: `${APP_PREFIX}who_icd_client_secret`,
  WHO_RELEASE: `${APP_PREFIX}who_icd_release`,
  WHO_LANG: `${APP_PREFIX}who_icd_lang`,
  WHO_PROXY: `${APP_PREFIX}who_icd_proxy_url`,
  MIN_CONFIDENCE: `${APP_PREFIX}min_confidence_threshold`,
  DISCLAIMER_DISMISSED: `${APP_PREFIX}disclaimer_dismissed`,
  VALIDATED: `${APP_PREFIX}validated_diagnostics`,
  CR_TEXT: `${APP_PREFIX}cr_text`,
  /** Clé FAMILLE du socle (theme-boot/ThemeProvider) : jamais préfixée. */
  THEME: 'dwc_theme',
} as const;
