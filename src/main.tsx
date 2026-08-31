import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import {
  ErrorBoundary,
  ThemeProvider,
} from '@mister-guiiug/dev-wpa-config/react';
import {
  installErrorReporter,
  initSentry,
  recordError,
} from '@mister-guiiug/dev-wpa-config/react/observability';
import { App } from './App';
import { I18nProvider } from './i18n';
import { DialogProvider } from './components/DialogProvider';
import { SocleLabelsBridge } from './components/SocleLabelsBridge';
import { PwaUpdates } from './components/PwaUpdates';
import { initWebVitals } from './monitoring/web-vitals';
import './tailwind.css';
import './style.css';

installErrorReporter();
void initSentry({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
});
initWebVitals();

const rootEl = document.getElementById('react-root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <ErrorBoundary
        onError={error => {
          recordError(error, { source: 'error-boundary' });
        }}
      >
        {/* Avant React, le thème est posé par le script anti-FOUC injecté au
            build (pwaSeoPlugin themeBoot) ; ThemeProvider prend ensuite le
            relais : état partagé, écoute du thème système, persistance et
            <meta name="theme-color"> alignée sur le schéma affiché. Pas
            d'appId : aucune palette --dwc-* n'est peinte, le contrat est
            câblé sur les jetons de style.css dans tailwind.css. */}
        <ThemeProvider
          legacyKeys={['app_theme']}
          themeColor={{ light: '#eef2f7', dark: '#0c1222' }}
        >
          <I18nProvider>
            <SocleLabelsBridge>
              {/* L'enregistrement du service worker vit désormais DANS l'arbre
                  React : le bandeau de mise à jour est un composant, donc rendu
                  sous I18nProvider (langue du contexte) et sous
                  SocleLabelsBridge (libellés secondaires du socle). */}
              <PwaUpdates>
                <HashRouter>
                  <DialogProvider>
                    <App />
                  </DialogProvider>
                </HashRouter>
              </PwaUpdates>
            </SocleLabelsBridge>
          </I18nProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}
