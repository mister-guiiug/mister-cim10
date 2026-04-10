import './style.css';
import { applyResolvedTheme, wireSystemThemeListener } from './theme.js';
import { getRoute, startRouter, getDocumentTitle } from './router.js';
import { mountHomePage } from './workspace.js';
import { mountParametresPage, mountAidePage } from './pages.js';
import { registerServiceWorker } from './register-sw.js';
import { focusMainContent } from './focus-utils.js';

const app = document.getElementById('app');

function mountApp() {
  if (!app) return;
  const route = getRoute();
  document.title = getDocumentTitle(route);
  if (route === 'parametres') mountParametresPage();
  else if (route === 'aide') mountAidePage();
  else mountHomePage();
  requestAnimationFrame(() => focusMainContent());
}

window.__savedCrText = window.__savedCrText || '';
applyResolvedTheme();
wireSystemThemeListener();
registerServiceWorker();
startRouter(() => mountApp());
mountApp();
