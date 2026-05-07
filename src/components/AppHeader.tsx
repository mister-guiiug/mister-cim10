import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BrandMark } from './BrandMark';
import { NavDrawer } from './NavDrawer';
import { useSettingsStore } from '../store/settingsStore';
import type { AppRoute } from '../types/index';

interface AppHeaderProps {
  subTagline?: string;
}

function pathToRoute(pathname: string): AppRoute {
  const segment = pathname.replace(/^\//, '').split('/')[0] ?? '';
  if (segment === 'parametres') return 'parametres';
  if (segment === 'aide') return 'aide';
  return 'home';
}

export function AppHeader({ subTagline }: AppHeaderProps) {
  const location = useLocation();
  const route = pathToRoute(location.pathname);
  const isHome = route === 'home';
  const settingsReady = useSettingsStore(s => s.isReady());
  const disclaimerDismissed = useSettingsStore(s => s.disclaimerDismissed);
  const dismissDisclaimer = useSettingsStore(s => s.dismissDisclaimer);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const defaultTagline = settingsReady
    ? 'Saisir · analyser · valider · exporter'
    : 'Du texte clinique aux codes — à valider et exporter';
  const taglineText = isHome ? defaultTagline : (subTagline ?? defaultTagline);

  return (
    <header className="app-header">
      <div
        className={[
          'app-header-inner',
          settingsReady && isHome ? 'app-header-inner--daily' : '',
          !isHome ? 'app-header-inner--subpage' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="app-header-body">
          <div className="app-header-top">
            <Link
              to="/"
              className="brand-block brand-link"
              aria-label="Accueil — Mister CIM-10"
            >
              <BrandMark />
              <div className="brand-text">
                {isHome ? (
                  <h1 className="app-title">Mister CIM-10</h1>
                ) : (
                  <p className="app-title">Mister CIM-10</p>
                )}
                <p className="app-tagline">{taglineText}</p>
              </div>
            </Link>
            <button
              type="button"
              className={`nav-menu-toggle${drawerOpen ? ' nav-menu-toggle--open' : ''}`}
              aria-expanded={drawerOpen}
              aria-controls="site-nav-drawer"
              aria-label="Ouvrir le menu : navigation, statut et thème"
              onClick={() => setDrawerOpen(v => !v)}
            >
              <span className="nav-menu-toggle-bars" aria-hidden="true">
                <span className="nav-menu-toggle-bar" />
                <span className="nav-menu-toggle-bar" />
                <span className="nav-menu-toggle-bar" />
              </span>
            </button>
          </div>
          {isHome && (
            <>
              {!settingsReady && <SetupGuide />}
              {settingsReady && <DailyGuide />}
              {!disclaimerDismissed && (
                <p
                  className={`disclaimer${settingsReady ? ' disclaimer--compact' : ''}`}
                >
                  <span>
                    {settingsReady
                      ? 'Suggestions indicatives — vous restez responsable des codes retenus et des règles en vigueur.'
                      : 'Outil d’aide : les suggestions sont indicatives. Vous restez responsable du choix final des codes et du respect des règles de cotation en vigueur.'}
                  </span>
                  <button
                    type="button"
                    className="disclaimer-dismiss"
                    aria-label="Masquer cet avertissement"
                    onClick={dismissDisclaimer}
                  >
                    ×
                  </button>
                </p>
              )}
            </>
          )}
        </div>
      </div>
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </header>
  );
}

function SetupGuide() {
  return (
    <div className="header-guide">
      <p className="setup-lead">
        Pour la première configuration, ouvrez <strong>Paramètres</strong> via
        le <strong>menu</strong> (icône en haut à droite).
      </p>
      <ol className="quick-steps" aria-label="Utilisation en trois étapes">
        <li className="quick-step">
          <span className="step-num" aria-hidden="true">
            1
          </span>
          <span className="step-body">
            <strong>Paramètres</strong> — source des suggestions (intégré, OMS
            ou les deux) et connexion OMS si besoin.
          </span>
        </li>
        <li className="quick-step">
          <span className="step-num" aria-hidden="true">
            2
          </span>
          <span className="step-body">
            <strong>Compte-rendu</strong> — saisie ou dictée, puis{' '}
            <strong>Analyser</strong>.
          </span>
        </li>
        <li className="quick-step">
          <span className="step-num" aria-hidden="true">
            3
          </span>
          <span className="step-body">
            <strong>Validation</strong> — retenir ou écarter les propositions,
            puis <strong>exporter</strong>.
          </span>
        </li>
      </ol>
    </div>
  );
}

function DailyGuide() {
  return (
    <div className="header-guide header-guide--daily">
      <ul className="workflow-strip" aria-label="En pratique">
        <li className="workflow-strip-item">
          <span className="workflow-num">1</span> Texte
        </li>
        <li className="workflow-strip-sep" aria-hidden="true" />
        <li className="workflow-strip-item">
          <span className="workflow-num">2</span> Analyser
        </li>
        <li className="workflow-strip-sep" aria-hidden="true" />
        <li className="workflow-strip-item">
          <span className="workflow-num">3</span> Valider & exporter
        </li>
      </ul>
    </div>
  );
}
