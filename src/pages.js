import { escapeHtml } from './html-utils.js';
import { buildAppHeaderHtml } from './header-html.js';
import { buildSettingsFormHtml } from './settings-form-html.js';
import { buildHelpPageMainHtml } from './help-page-html.js';
import { wireThemeToggle } from './theme.js';
import { wireNavDrawer } from './nav-drawer.js';
import { FOOTER_NOTE } from './app-constants.js';
import {
  getStoredAnalyzeMode,
  isSettingsReadyForDailyUse,
  MODE_SUMMARY_LABEL,
  initAnalyzeModeUi,
  initWhoSettingsUi,
} from './app-settings.js';
import { refreshWorkspaceChrome } from './header-chrome.js';
import { tryImportSettingsFromHash, wireSettingsShare } from './settings-share.js';

const app = () => document.getElementById('app');

export function mountParametresPage() {
  const root = app();
  if (!root) return;

  const mode = getStoredAnalyzeMode();
  const settingsReady = isSettingsReadyForDailyUse();
  const modeLabel = MODE_SUMMARY_LABEL[mode] || '';

  root.innerHTML =
    buildAppHeaderHtml(escapeHtml, {
      route: 'parametres',
      settingsReady,
      modeLabel,
      subTagline: 'Source des suggestions et connexion OMS',
    }) +
    `
    <main id="main-content" class="page-main settings-page" tabindex="-1">
      <header class="page-hero">
        <p class="page-kicker">Configuration</p>
        <h1 class="page-title-h1">Paramètres</h1>
        <p class="page-lead">Choisissez comment les codes sont proposés, puis renseignez la connexion à l’OMS si vous l’activez. Pour obtenir un compte et des identifiants API, suivez le guide sur la page <a href="#/aide" class="inline-link">Aide</a> (section compte OMS).</p>
        <p class="settings-page-badge-line" aria-live="polite">
          <span class="settings-page-badge-label">Mode enregistré</span>
          <span class="settings-summary-badge settings-summary-badge--inline" id="settings-mode-badge"></span>
        </p>
        <p class="settings-import-banner" id="settings-import-banner" hidden role="status">
          Configuration importée à partir du lien — vérifiez les champs puis enregistrez si vous modifiez quelque chose.
        </p>
      </header>
      <div class="panel panel--settings-page">
        ${buildSettingsFormHtml()}
      </div>
    </main>
    <footer class="app-footer">${FOOTER_NOTE}</footer>
    `;

  const chrome = () => refreshWorkspaceChrome();
  const importedFromLink = tryImportSettingsFromHash();
  initAnalyzeModeUi(chrome);
  initWhoSettingsUi(chrome);
  wireSettingsShare();
  wireNavDrawer();
  wireThemeToggle();
  refreshWorkspaceChrome();
  const importBanner = document.getElementById('settings-import-banner');
  if (importBanner) importBanner.hidden = !importedFromLink;

  const btnResetDisclaimer = document.getElementById('btn-reset-disclaimer');
  if (btnResetDisclaimer) {
    btnResetDisclaimer.addEventListener('click', () => {
      localStorage.removeItem('disclaimer_dismissed');
      const disc = document.getElementById('app-disclaimer');
      if (disc) disc.hidden = false;
      btnResetDisclaimer.textContent = 'Avertissement réaffiché ✓';
      btnResetDisclaimer.disabled = true;
      setTimeout(() => {
        btnResetDisclaimer.textContent = 'Réafficher l\u2019avertissement';
        btnResetDisclaimer.disabled = false;
      }, 2000);
    });
  }
}

export function mountAidePage() {
  const root = app();
  if (!root) return;

  const settingsReady = isSettingsReadyForDailyUse();
  const mode = getStoredAnalyzeMode();
  const modeLabel = MODE_SUMMARY_LABEL[mode] || '';

  root.innerHTML =
    buildAppHeaderHtml(escapeHtml, {
      route: 'aide',
      settingsReady,
      modeLabel,
      subTagline: 'Guide d’utilisation et compte API OMS',
    }) +
    buildHelpPageMainHtml(escapeHtml) +
    `<footer class="app-footer">${FOOTER_NOTE}</footer>`;

  wireNavDrawer();
  wireThemeToggle();
  refreshWorkspaceChrome();
}
