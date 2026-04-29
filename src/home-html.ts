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
        <h2 id="cr-label" class="panel-title">
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M4 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H4zm0 1h8a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm1 2v1h6V4H5zm0 2.5v1h6v-1H5zm0 2.5v1h4v-1H5z"/></svg>
          <span class="panel-title-text">Compte-rendu</span>
        </h2>
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
      <div id="cr-highlight-root" class="cr-highlight-root" hidden></div>
      <div id="cr-history-root" hidden></div>
      <p class="hint error" id="analyze-error" hidden role="alert"></p>
    </section>

    <section class="panel panel--suggestions" aria-labelledby="sug-label">
      <div class="panel-head">
        <h2 id="sug-label" class="panel-title">
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1a5 5 0 0 0-2.5 9.33V12h5v-1.67A5 5 0 0 0 8 1zM6.5 13v1.5h3V13h-3z"/></svg>
          <span class="panel-title-text">Suggestions</span>
        </h2>
        <div id="analyze-timer-root"></div>
      </div>
      <p class="hint">Raccourcis: ↑/↓ pour naviguer, 1 valider, 2 rejeter, 3 modifier.</p>
      <div class="suggestion-filter-row">
        <input
          id="suggestion-filter-inp"
          type="search"
          class="suggestion-filter-inp"
          placeholder="Filtrer (code, libellé, terme repéré)"
          aria-label="Filtrer les suggestions"
        />
        <button type="button" class="ghost" id="btn-clear-suggestion-filter">Effacer filtre</button>
      </div>
      <div class="toolbar suggestion-bulk-toolbar">
        <button type="button" class="secondary" id="btn-accept-filtered">Valider filtrées</button>
        <button type="button" class="secondary" id="btn-reject-filtered">Rejeter filtrées</button>
        <span class="hint suggestion-filter-count" id="suggestion-filter-count"></span>
      </div>
      <div id="suggestions-root"></div>
    </section>

    <section class="panel panel--validated" aria-labelledby="val-label">
      <div class="panel-head">
        <h2 id="val-label" class="panel-title">
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M13.854 3.146a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 9.793l6.646-6.647a.5.5 0 0 1 .708 0z"/></svg>
          <span class="panel-title-text">Diagnostics retenus</span>
        </h2>
        <div class="panel-head-actions">
          <button type="button" class="ghost" id="btn-undo" title="Annuler la dernière action (Ctrl/Cmd+Z)">Annuler</button>
          <button type="button" class="ghost" id="btn-redo" title="Rétablir (Ctrl+Y ou Ctrl/Cmd+Shift+Z)">Rétablir</button>
        </div>
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
