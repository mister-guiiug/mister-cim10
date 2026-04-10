import { FOOTER_NOTE } from './app-constants.js';

/** @param {boolean} micSupported
 *  @param {boolean} shareSupported
 *  @param {boolean} hasValidated */
export function buildHomeWorkspaceHtml(micSupported, shareSupported, hasValidated) {
  const dis = hasValidated ? '' : 'disabled';
  return `
    <main id="main-content" class="workspace" tabindex="-1">
    <section class="panel panel--cr" aria-labelledby="cr-label">
      <div class="panel-head">
        <h2 id="cr-label" class="panel-title">Compte-rendu</h2>
      </div>
      <form id="cr-form" action="#" method="get">
        <textarea class="cr" id="cr-text" name="cr" placeholder="Ex. : Patient diabétique type 2, HTA, suivi pour BPCO…" aria-label="Texte du compte-rendu"></textarea>
        <div class="toolbar">
          <button type="submit" class="primary" id="btn-analyze">Analyser</button>
          ${
            micSupported
              ? `<button type="button" class="mic" id="btn-mic" aria-pressed="false" title="Parler pour remplir le texte (selon le navigateur)">
              <svg class="mic-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z"/><path d="M19 10v1a7 7 0 01-14 0v-1M12 18v4M8 22h8" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Dictée
            </button>`
              : ''
          }
          <button type="button" class="secondary" id="btn-clear">Effacer le texte</button>
        </div>
      </form>
      <p class="hint">Vous pouvez dicter : micro du clavier sur mobile ou bouton Dictée si proposé.</p>
      <p class="hint error" id="analyze-error" hidden role="alert"></p>
    </section>

    <section class="panel" aria-labelledby="sug-label">
      <div class="panel-head">
        <h2 id="sug-label" class="panel-title">Suggestions</h2>
      </div>
      <div id="suggestions-root"></div>
    </section>

    <section class="panel" aria-labelledby="val-label">
      <div class="panel-head">
        <h2 id="val-label" class="panel-title">Diagnostics retenus</h2>
      </div>
      <ul class="validated-list" id="validated-root" role="list"></ul>
      <p class="empty" id="validated-empty" hidden>Aucun diagnostic validé pour l’instant.</p>
      <div class="export-blocks">
        <div class="export-block">
          <span class="export-block-label" id="export-label-files">Télécharger</span>
          <div class="toolbar export-row export-row--panel">
            <button type="button" class="secondary" id="export-txt" ${dis}>Texte (.txt)</button>
            <button type="button" class="secondary" id="export-csv" ${dis}>Tableur (.csv)</button>
          </div>
        </div>
        <div class="export-block">
          <span class="export-block-label" id="export-label-send">Envoyer / partager</span>
          <div class="toolbar export-row export-row--panel">
            <button type="button" class="secondary" id="export-email" ${dis} title="Ouvre votre messagerie avec un résumé texte du compte-rendu et des diagnostics (tronqué si très long)">E-mail</button>
            ${
              shareSupported
                ? `<button type="button" class="secondary" id="export-share" ${dis} title="Menu Partager : envoi d’un fichier texte ou du contenu">Partager</button>`
                : ''
            }
          </div>
        </div>
        <p class="hint export-hint" id="export-hint">
          <strong>Texte (.txt)</strong> : fichier lisible (date, diagnostics, compte-rendu).
          <strong>E-mail / Partager</strong> : même contenu sous forme de texte simple (fichier .txt ou corps de message).
        </p>
      </div>
    </section>
    </main>

    <footer class="app-footer">${FOOTER_NOTE}</footer>
  `;
}
