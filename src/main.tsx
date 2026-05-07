import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { App } from './App';
import { DialogProvider } from './components/DialogProvider';
import { applyResolvedTheme } from './lib/theme';
import { registerServiceWorker } from './register-sw.js';
import { initWebVitals } from './monitoring/web-vitals';
import './tailwind.css';
import './style.css';

applyResolvedTheme();
registerServiceWorker();
initWebVitals();

const rootEl = document.getElementById('react-root');
if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <HashRouter>
        <DialogProvider>
          <App />
        </DialogProvider>
      </HashRouter>
    </StrictMode>
  );
}
