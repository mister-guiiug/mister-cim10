/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SENTRY_DSN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Constantes injectées au build par Vite (cf. vite.config.ts `define`).
declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;
