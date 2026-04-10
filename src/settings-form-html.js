/** Contenu du formulaire de paramètres (sans enveloppe de page). Champs dynamiques : toujours échapper si un jour branchés sur des données externes. */
export function buildSettingsFormHtml() {
  return `
          <div class="settings-body settings-body--compact settings-body--page">
          <div class="settings-mode-line">
            <label class="settings-mode-label" for="analyze-mode-select">Source des suggestions</label>
            <select id="analyze-mode-select" class="settings-select" aria-describedby="analyze-mode-hint">
              <option value="local">Intégré uniquement (sans OMS)</option>
              <option value="api">OMS uniquement</option>
              <option value="both">Intégré et OMS</option>
            </select>
          </div>
          <p class="settings-hint" id="analyze-mode-hint">
            Par défaut, tout se fait dans la page. Si vous choisissez une option avec OMS, les champs de connexion s’affichent : compte OMS et adresse de passerelle requis.
          </p>

          <div class="settings-block api-section api-section--compact" id="who-api-section" hidden>
            <div class="api-compact-bar">
              <span class="api-compact-heading" id="who-api-heading">Connexion OMS</span>
              <nav class="api-links" aria-label="Ressources OMS">
                <a href="https://icd.who.int/icdapi" target="_blank" rel="noopener noreferrer">Portail ICD API</a>
                <span class="api-links-sep" aria-hidden="true">·</span>
                <a href="https://icd.who.int/docs/icd-api/APIDoc-Version2/" target="_blank" rel="noopener noreferrer">Documentation API</a>
              </nav>
            </div>

            <div class="api-fields-grid" role="group" aria-labelledby="who-api-heading">
              <label class="who-field">
                <span class="who-field-label">Identifiant</span>
                <input type="text" id="who-client-id" autocomplete="username" spellcheck="false" />
              </label>
              <label class="who-field">
                <span class="who-field-label">Mot secret</span>
                <input type="password" id="who-client-secret" autocomplete="current-password" />
              </label>
              <label class="who-field api-field-span2">
                <span class="who-field-label">Adresse de la passerelle</span>
                <input
                  type="url"
                  id="who-proxy-url"
                  inputmode="url"
                  autocomplete="off"
                  placeholder="https://…"
                  spellcheck="false"
                />
              </label>
            </div>

            <details class="settings-sub">
              <summary class="settings-sub-summary">Version de la classification et langue</summary>
              <div class="api-row2 settings-sub-inner">
                <label class="who-field who-field-inline">
                  <span class="who-field-label">Version</span>
                  <select id="who-release">
                    <option value="2025-01">2025-01</option>
                    <option value="2024-01">2024-01</option>
                    <option value="2023-01">2023-01</option>
                  </select>
                </label>
                <label class="who-field who-field-inline">
                  <span class="who-field-label">Langue des libellés</span>
                  <select id="who-lang">
                    <option value="fr">Français</option>
                    <option value="en">English</option>
                  </select>
                </label>
              </div>
            </details>

            <p class="hint hint--compact who-risk">
              Identifiants enregistrés dans ce navigateur (éviter sur poste partagé). La passerelle doit autoriser ce site.
            </p>
            <button type="button" class="ghost who-clear-btn" id="who-clear-creds">Oublier mot secret et session OMS</button>
          </div>

          <div class="settings-share-block">
            <p class="settings-share-title">Partager le paramétrage</p>
            <p class="settings-share-hint hint">
              Génère un <strong>lien</strong> reprenant le mode d’analyse et les champs ci-dessus (y compris le <strong>mot secret OMS</strong> s’il est renseigné). Ne l’envoyez qu’à des personnes de confiance ; évitez les canaux non chiffrés.
            </p>
            <div class="toolbar settings-share-toolbar">
              <button type="button" class="secondary" id="btn-share-settings">Partager ou copier le lien</button>
            </div>
            <p class="settings-share-feedback" id="settings-share-feedback" hidden role="status"></p>
          </div>
        </div>
  `;
}
