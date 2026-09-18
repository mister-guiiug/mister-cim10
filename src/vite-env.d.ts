/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Clé de projet PostHog (`phc_…`), nuage EUROPÉEN — ADR 0012. LA MÊME pour
   * tout le parc, et c'est délibéré : un seul projet, les applications
   * distinguées dedans par la super-propriété `app_name` que le socle déduit
   * du chemin de base. L'inverse — un projet par dépôt — rendait le total
   * illisible. Publique par conception (elle part dans le bundle), donc
   * `vars` et jamais `secrets`. Absente, le bandeau de consentement ne rend
   * rien et rien n'est mesuré : c'est le seul interrupteur.
   */
  readonly VITE_POSTHOG_KEY?: string;
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Constantes injectées au build par Vite (cf. vite.config.ts `define`).
declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;
