import { FOOTER_NOTE } from './app-constants.js';

/** @param {boolean} micSupported
 *  @param {boolean} shareSupported
 *  @param {boolean} hasValidated */
export function buildHomeWorkspaceHtml(micSupported, shareSupported, hasValidated) {
  const dis = hasValidated ? '' : 'disabled';
  return `
    <main id="main-content" class="workspace" tabindex="-1">
    <div id="offline-banner" class="offline-banner" hidden role="alert">
      &#x26A0;&#xFE0F; Vous êtes hors-ligne. Les suggestions OMS ne sont pas disponibles.
    </div>
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
          <button type="button" class="ghost" id="btn-new-session">Nouvelle session</button>
        </div>
      </form>
      <p class="hint">Vous pouvez dicter : micro du clavier sur mobile ou bouton Dictée si proposé.</p>
      <div id="cr-history-root" hidden></div>
      <p class="hint error" id="analyze-error" hidden role="alert"></p>
    </section>

    <section class="panel" aria-labelledby="sug-label">
      <div class="panel-head">
        <h2 id="sug-label" class="panel-title">Suggestions</h2>
        <div id="analyze-timer-root"></div>
      </div>
      <div id="suggestions-root"></div>
    </section>

    <section class="panel" aria-labelledby="val-label">
      <div class="panel-head">
        <h2 id="val-label" class="panel-title">Diagnostics retenus</h2>
      </div>
      <details class="favorites-details">
        <summary class="favorites-summary">⭐ Favoris</summary>
        <div id="favorites-root" class="favorites-root"></div>
      </details>
      <form id="manual-search-form" class="manual-search-form" action="#" method="get" autocomplete="off">
        <label for="manual-search-inp" class="manual-search-label">Ajouter un code manuellement</label>
        <div class="manual-search-row">
          <input id="manual-search-inp" type="search" class="manual-search-inp" placeholder="Code ou libellé (ex. I10, diabète…)" aria-label="Recherche de code CIM-10" />
        </div>
        <div id="manual-search-results" class="manual-search-results" role="listbox" aria-label="Résultats de recherche"></div>
      </form>
      <ul class="validated-list" id="validated-root" role="list"></ul>
      <p class="empty" id="validated-empty" hidden>Aucun diagnostic validé pour l’instant.</p>
      <div class="export-blocks">
        <div class="export-block">
          <span class="export-block-label" id="export-label-files">Télécharger</span>
          <div class="toolbar export-row export-row--panel">
            <button type="button" class="secondary" id="export-txt" ${dis}>Texte (.txt)</button>
            <button type="button" class="secondary" id="export-csv" ${dis}>Tableur (.csv)</button>
            <button type="button" class="secondary" id="export-json" ${dis}>JSON</button>
            <button type="button" class="secondary" id="btn-print" ${dis}>Imprimer / PDF</button>
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
          <strong>JSON</strong> : données structurées avec annotations.
          <strong>E-mail / Partager</strong> : même contenu sous forme de texte simple.
        </p>
      </div>
    </section>

    <section class="panel" aria-labelledby="sessions-label">
      <div class="panel-head">
        <h2 id="sessions-label" class="panel-title">Sessions sauvegardées</h2>
      </div>
      <div class="sessions-save-row">
        <input id="session-name-input" type="text" class="session-name-inp" placeholder="Nom de la session (ex. Dr Dupont 12/06)" aria-label="Nom de la session à sauvegarder" />
        <button type="button" class="secondary" id="btn-save-session">Sauvegarder</button>
      </div>
      <div id="sessions-root"></div>
    </section>
    </main>

    <footer class="app-footer">${FOOTER_NOTE}</footer>
  `;
}
