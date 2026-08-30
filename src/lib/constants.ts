export const FOOTER_NOTE =
  'Outil expérimental sans valeur officielle. Vérifiez chaque code avant utilisation.';

export const LS_KEYS = {
  ANALYZE_MODE: 'analyze_mode',
  WHO_CLIENT_ID: 'who_icd_client_id',
  WHO_CLIENT_SECRET: 'who_icd_client_secret',
  WHO_RELEASE: 'who_icd_release',
  WHO_LANG: 'who_icd_lang',
  WHO_PROXY: 'who_icd_proxy_url',
  MIN_CONFIDENCE: 'min_confidence_threshold',
  /** Clé famille du socle (theme-boot/ThemeProvider) ; ex-`app_theme`, migrée
   *  via `legacyKeys`. */
  THEME: 'dwc_theme',
  DISCLAIMER_DISMISSED: 'disclaimer_dismissed',
  VALIDATED: 'validated_diagnostics',
  CR_TEXT: 'cr_text',
  SESSIONS: 'saved_sessions',
  FAVORITES: 'favorites',
} as const;
