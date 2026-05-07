import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';
import { useSettingsStore } from '../store/settingsStore';
import { MODE_SUMMARY_LABEL } from '../lib/constants';
import type { AppRoute } from '../types/index';

interface NavDrawerProps {
  open: boolean;
  onClose: () => void;
}

const ROUTE_LINKS: { route: AppRoute; href: string; label: string }[] = [
  { route: 'home', href: '/', label: 'Accueil' },
  { route: 'parametres', href: '/parametres', label: 'Paramètres' },
  { route: 'aide', href: '/aide', label: 'Aide' },
];

function pathToRoute(pathname: string): AppRoute {
  const segment = pathname.replace(/^\//, '').split('/')[0] ?? '';
  if (segment === 'parametres') return 'parametres';
  if (segment === 'aide') return 'aide';
  return 'home';
}

export function NavDrawer({ open, onClose }: NavDrawerProps) {
  const location = useLocation();
  const currentRoute = pathToRoute(location.pathname);
  const mode = useSettingsStore(s => s.mode);
  const isReady = useSettingsStore(s => s.isReady());

  // ESC close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('nav-drawer-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('nav-drawer-open');
    };
  }, [open, onClose]);

  return (
    <div id="nav-shell" className="nav-shell" hidden={!open}>
      <button
        type="button"
        className="nav-backdrop"
        tabIndex={-1}
        aria-label="Fermer le menu"
        onClick={onClose}
      />
      <aside
        id="site-nav-drawer"
        className="nav-drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nav-drawer-title"
      >
        <div className="nav-drawer-head">
          <h2 id="nav-drawer-title" className="nav-drawer-title">
            Menu
          </h2>
          <button
            type="button"
            className="nav-drawer-close"
            aria-label="Fermer le menu"
            onClick={onClose}
          >
            <svg
              width={24}
              height={24}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <nav className="nav-drawer-nav" aria-label="Navigation principale">
          <ul className="nav-drawer-list">
            {ROUTE_LINKS.map(l => {
              const active = l.route === currentRoute;
              return (
                <li key={l.route} className="nav-drawer-item">
                  <Link
                    to={l.href}
                    className={`nav-drawer-link${active ? ' is-active' : ''}`}
                    aria-current={active ? 'page' : undefined}
                    onClick={onClose}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="nav-drawer-section">
          <p className="nav-drawer-section-label">État</p>
          {isReady ? (
            <div className="header-status" role="status">
              <span className="header-status-dot" aria-hidden="true" />
              <span className="header-status-text">
                Prêt · {MODE_SUMMARY_LABEL[mode]}
              </span>
            </div>
          ) : (
            <p className="nav-drawer-hint">
              Complétez les{' '}
              <Link to="/parametres" className="inline-link" onClick={onClose}>
                Paramètres
              </Link>{' '}
              pour activer l’analyse selon votre configuration.
            </p>
          )}
        </div>
        <div className="nav-drawer-section nav-drawer-section--theme">
          <p className="nav-drawer-section-label">Affichage</p>
          <ThemeToggle />
        </div>
      </aside>
    </div>
  );
}
