import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import {
  ErrorBoundary,
  ThemeProvider,
} from '@mister-guiiug/dev-pwa-config/react';
import {
  installErrorReporter,
  initSentry,
  recordError,
} from '@mister-guiiug/dev-pwa-config/react/observability';
import { initWebVitals } from '@mister-guiiug/dev-pwa-config/web-vitals';
import { AnnouncerProvider } from '@mister-guiiug/dev-pwa-config/react/a11y';
import { App } from './App';
import { I18nProvider } from './i18n';
import { DialogProvider } from './components/DialogProvider';
import { SocleLabelsBridge } from './components/SocleLabelsBridge';
import { PwaUpdates } from './components/PwaUpdates';
import './tailwind.css';
import './style.css';

installErrorReporter();
void initSentry({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  // La version applicative, pour qu’une erreur soit rattachée à un build
  // précis : sans elle, toutes les traces se mélangent dans un seul tas.
  release: __APP_VERSION__,
  // `loader` REND L’IMPORT ANALYSABLE PAR VITE, et c’est ce qui permet au
  // `manualChunks` de le ranger dans son propre morceau. Sans lui, le socle
  // retombe sur un spécificateur volontairement non analysable — nécessaire
  // tant que la peer n’est pas installée, inutile maintenant qu’elle l’est.
  //
  // Rien ne part tant qu’aucun DSN n’est posé : `initSentry` rend `null`
  // AVANT l’import. Et le morceau est hors du précache du service worker,
  // sans quoi il serait téléchargé quand même (cf. vite.config.ts).
  loader: () => import('@sentry/react'),
});

/*
 * Web Vitals : le module du socle remplace `src/monitoring/web-vitals.ts`.
 *
 * MISE AU POINT SUR `onFID`. L'en-tête du module partagé annonce que les copies
 * sont cassées parce qu'`onFID` aurait été « RETIRÉ en v4.0 », d'où un
 * `TypeError` qui n'enregistrerait que CLS. VÉRIFIÉ ICI, ce n'est pas le cas :
 * le verrou résout `web-vitals@4.2.4`, qui exporte toujours `onFID` (déprécié
 * en v4, retiré en v5.0.0). Rejouées dans le navigateur, les cinq inscriptions
 * de l'ancien code passaient sans lever. Cette app relevait donc bien cinq
 * métriques.
 *
 * CE QUE LA MIGRATION CORRIGE VRAIMENT, et c'est ailleurs :
 *
 * 1. **La note était fausse pour quatre métriques sur cinq.** L'ancien
 *    `getRating` n'avait qu'un `case 'CLS'` et un `default: return 'good'` :
 *    un LCP à 10 s était journalisé `rating: 'good'`. Le socle applique les
 *    seuils web.dev aux cinq.
 * 2. **INP n'était jamais relevée.** L'app mesurait FID, sortie des Core Web
 *    Vitals en mars 2024 au profit d'INP.
 * 3. Chaque métrique est inscrite séparément, et la liste de celles réellement
 *    inscrites est rendue : une liste courte devient un signal.
 * 4. Les échecs partent dans `recordError` — l'observabilité déjà installée
 *    ci-dessus — au lieu d'un `console.warn` que personne ne lit.
 */
void initWebVitals({
  onMetric: metric => {
    if (import.meta.env.DEV) console.log('[Web Vitals]', metric);
  },
  onError: (name, error) => {
    recordError(error, { source: 'web-vitals', metric: name });
  },
}).then(registered => {
  if (import.meta.env.DEV) {
    console.log('[Web Vitals] métriques enregistrées :', registered);
  }
});

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
                {/* UNE région d'annonce pour toute l'app, montée avant le
                    premier message : une région insérée au moment où elle
                    parle n'est souvent pas lue. Déplacer un diagnostic,
                    annuler, mettre en favori ne changent rien de visible pour
                    un lecteur d'écran — c'est elle qui le dit. */}
                <AnnouncerProvider>
                  <HashRouter>
                    <DialogProvider>
                      <App />
                    </DialogProvider>
                  </HashRouter>
                </AnnouncerProvider>
              </PwaUpdates>
            </SocleLabelsBridge>
          </I18nProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </StrictMode>
  );
}
