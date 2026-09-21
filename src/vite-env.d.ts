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

  /**
   * Adresse de la passerelle OMS (le Worker de `workers/`), sans slash final.
   * Posée, l'application arrive connectée : les champs de compte des Réglages
   * deviennent optionnels, parce que la passerelle porte le compte en secrets
   * côté serveur (cf. `src/lib/who-defaults.ts`).
   *
   * Publique par nature — elle figure dans chaque requête du navigateur. Donc
   * `vars`, jamais `secrets`.
   */
  readonly VITE_WHO_PROXY_URL?: string;
  /** Version de la classification CIM-11 demandée par défaut (ex. `2025-01`). */
  readonly VITE_WHO_RELEASE_ID?: string;
  /** Langue des libellés OMS par défaut (`fr` | `en`). */
  readonly VITE_WHO_LANG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Constantes injectées au build par Vite (cf. vite.config.ts `define`).
declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;
