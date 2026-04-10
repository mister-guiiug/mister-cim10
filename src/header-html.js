/**
 * En-tête global : ne pas y injecter de chaînes non échappées ; utiliser `escapeHtml` pour tout contenu dynamique.
 * @param {import('./html-utils.js').escapeHtml} escapeHtml
 * @param {{ route: import('./router.js').AppRoute; settingsReady: boolean; modeLabel: string; subTagline?: string }} opts
 */
export function buildAppHeaderHtml(escapeHtml, opts) {
  const { route, settingsReady, modeLabel, subTagline } = opts;
  const isHome = route === 'home';

  const defaultTagline = settingsReady
    ? 'Saisir · analyser · valider · exporter'
    : 'Du texte clinique aux codes — à valider et exporter';

  const taglineText = isHome ? defaultTagline : subTagline || defaultTagline;

  const navDrawerLink = (r, label) => {
    const active = route === r;
    const href = r === 'home' ? '#/' : `#/${r}`;
    return `<li class="nav-drawer-item"><a href="${href}" class="nav-drawer-link${active ? ' is-active' : ''}"${active ? ' aria-current="page"' : ''}>${label}</a></li>`;
  };

  const guidesHtml = isHome
    ? `
        <div id="header-guide-setup" class="header-guide" ${settingsReady ? 'hidden' : ''}>
          <p class="setup-lead">Pour la première configuration, ouvrez <strong>Paramètres</strong> via le <strong>menu</strong> (icône en haut à droite).</p>
          <ol class="quick-steps" aria-label="Utilisation en trois étapes">
            <li class="quick-step">
              <span class="step-num" aria-hidden="true">1</span>
              <span class="step-body"><strong>Paramètres</strong> — source des suggestions (intégré, OMS ou les deux) et connexion OMS si besoin.</span>
            </li>
            <li class="quick-step">
              <span class="step-num" aria-hidden="true">2</span>
              <span class="step-body"><strong>Compte-rendu</strong> — saisie ou dictée, puis <strong>Analyser</strong>.</span>
            </li>
            <li class="quick-step">
              <span class="step-num" aria-hidden="true">3</span>
              <span class="step-body"><strong>Validation</strong> — retenir ou écarter les propositions, puis <strong>exporter</strong>.</span>
            </li>
          </ol>
        </div>

        <div id="header-guide-daily" class="header-guide header-guide--daily" ${settingsReady ? '' : 'hidden'}>
          <ul class="workflow-strip" aria-label="En pratique">
            <li class="workflow-strip-item"><span class="workflow-num">1</span> Texte</li>
            <li class="workflow-strip-sep" aria-hidden="true"></li>
            <li class="workflow-strip-item"><span class="workflow-num">2</span> Analyser</li>
            <li class="workflow-strip-sep" aria-hidden="true"></li>
            <li class="workflow-strip-item"><span class="workflow-num">3</span> Valider & exporter</li>
          </ul>
        </div>

        <p class="disclaimer ${settingsReady ? 'disclaimer--compact' : ''}" id="app-disclaimer">
          ${
            settingsReady
              ? 'Suggestions indicatives — vous restez responsable des codes retenus et des règles en vigueur.'
              : 'Outil d’aide : les suggestions sont indicatives. Vous restez responsable du choix final des codes et du respect des règles de cotation en vigueur.'
          }
        </p>`
    : '';

  return `
    <header class="app-header">
      <div class="app-header-inner${settingsReady && isHome ? ' app-header-inner--daily' : ''}${!isHome ? ' app-header-inner--subpage' : ''}">
        <div class="app-header-body">
          <div class="app-header-top">
            <a href="#/" class="brand-block brand-link" aria-label="Accueil — Cotation CIM-10">
              <div class="brand-mark" aria-hidden="true">
                <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" class="brand-mark-svg">
                  <rect x="6" y="4" width="20" height="24" rx="3" stroke="currentColor" stroke-width="2"/>
                  <path d="M10 10h12M10 15h12M10 20h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </div>
              <div class="brand-text">
                ${isHome ? '<h1 class="app-title">Cotation CIM-10</h1>' : '<p class="app-title">Cotation CIM-10</p>'}
                <p class="app-tagline" id="app-tagline">${escapeHtml(taglineText)}</p>
              </div>
            </a>
            <button
              type="button"
              class="nav-menu-toggle"
              id="nav-menu-toggle"
              aria-expanded="false"
              aria-controls="site-nav-drawer"
              aria-label="Ouvrir le menu : navigation, statut et thème"
            >
              <span class="nav-menu-toggle-bars" aria-hidden="true">
                <span class="nav-menu-toggle-bar"></span>
                <span class="nav-menu-toggle-bar"></span>
                <span class="nav-menu-toggle-bar"></span>
              </span>
            </button>
          </div>
          ${guidesHtml}
        </div>
      </div>

      <div id="nav-shell" class="nav-shell" hidden>
        <button type="button" class="nav-backdrop" id="nav-backdrop" tabindex="-1" aria-label="Fermer le menu"></button>
        <aside
          id="site-nav-drawer"
          class="nav-drawer-panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="nav-drawer-title"
        >
          <div class="nav-drawer-head">
            <h2 id="nav-drawer-title" class="nav-drawer-title">Menu</h2>
            <button type="button" class="nav-drawer-close" id="nav-drawer-close" aria-label="Fermer le menu">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <nav class="nav-drawer-nav" aria-label="Navigation principale">
            <ul class="nav-drawer-list">
              ${navDrawerLink('home', 'Accueil')}
              ${navDrawerLink('parametres', 'Paramètres')}
              ${navDrawerLink('aide', 'Aide')}
            </ul>
          </nav>
          <div class="nav-drawer-section">
            <p class="nav-drawer-section-label">État</p>
            <div class="header-status" id="header-workspace-status" role="status" ${settingsReady ? '' : 'hidden'}>
              <span class="header-status-dot" aria-hidden="true"></span>
              <span class="header-status-text">Prêt · ${escapeHtml(modeLabel)}</span>
            </div>
            <p class="nav-drawer-hint" id="header-status-hint" ${settingsReady ? 'hidden' : ''}>
              Complétez les <a href="#/parametres" class="inline-link">Paramètres</a> pour activer l’analyse selon votre configuration.
            </p>
          </div>
          <div class="nav-drawer-section nav-drawer-section--theme">
            <p class="nav-drawer-section-label">Affichage</p>
            <button type="button" class="theme-switch" id="theme-toggle" aria-pressed="false"></button>
          </div>
        </aside>
      </div>
    </header>
  `;
}
