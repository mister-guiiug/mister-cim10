/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Identifiant de mesure GA4 (`G-…`), propre à CETTE application. Absent, le
   * bandeau de consentement ne rend rien et rien n'est mesuré : c'est le seul
   * interrupteur, et une propriété par site est ce qui rend le suivi
   * indépendant.
   */
  readonly VITE_GA_MEASUREMENT_ID?: string;
  /**
   * Conteneur GTM (`GTM-…`). Si les DEUX sont posés, le socle ne charge que
   * GTM — GA4 se configure dedans, et fournir les deux au tag compterait
   * chaque évènement deux fois. C'est exactement ce que faisait l'injection au
   * build, retirée le 15/09/2026.
   */
  readonly VITE_GTM_CONTAINER_ID?: string;
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Constantes injectées au build par Vite (cf. vite.config.ts `define`).
declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;
