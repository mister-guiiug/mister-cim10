import { getStoredAnalyzeMode, isSettingsReadyForDailyUse, MODE_SUMMARY_LABEL } from './app-settings.js';

export function refreshWorkspaceChrome() {
  const ready = isSettingsReadyForDailyUse();
  const mode = getStoredAnalyzeMode();
  const inner = document.querySelector('.app-header-inner');
  const setup = document.getElementById('header-guide-setup');
  const daily = document.getElementById('header-guide-daily');
  const status = document.getElementById('header-workspace-status');
  const tagline = document.getElementById('app-tagline');

  if (inner && setup && daily) {
    inner.classList.toggle('app-header-inner--daily', ready);
  }
  if (setup) setup.hidden = ready;
  if (daily) daily.hidden = !ready;
  if (status) {
    status.hidden = !ready;
    const tx = status.querySelector('.header-status-text');
    if (tx && ready) {
      tx.textContent = `Prêt · ${MODE_SUMMARY_LABEL[mode] || ''}`;
    }
  }
  const statusHint = document.getElementById('header-status-hint');
  if (statusHint) {
    statusHint.hidden = ready;
  }
  if (tagline && setup && daily) {
    tagline.textContent = ready
      ? 'Saisir · analyser · valider · exporter'
      : 'Du texte clinique aux codes — à valider et exporter';
  }
  const disc = document.getElementById('app-disclaimer');
  if (disc) {
    disc.classList.toggle('disclaimer--compact', ready);
    disc.textContent = ready
      ? 'Suggestions indicatives — vous restez responsable des codes retenus et des règles en vigueur.'
      : 'Outil d’aide : les suggestions sont indicatives. Vous restez responsable du choix final des codes et du respect des règles de cotation en vigueur.';
  }
}
