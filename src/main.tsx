import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ErrorBoundary } from '@mister-guiiug/dev-wpa-config/react';
import {
  installErrorReporter,
  initSentry,
  recordError,
} from '@mister-guiiug/dev-wpa-config/react/observability';
import { App } from './App';
import { DialogProvider } from './components/DialogProvider';
import { applyResolvedTheme } from './lib/theme';
import { registerServiceWorker } from './register-sw.js';
import { initWebVitals } from './monitoring/web-vitals';
import './tailwind.css';
import './style.css';

installErrorReporter();
void initSentry({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
});
applyResolvedTheme();
registerServiceWorker();
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
        <HashRouter>
          <DialogProvider>
            <App />
          </DialogProvider>
        </HashRouter>
      </ErrorBoundary>
    </StrictMode>
  );
}
