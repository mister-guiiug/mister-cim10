import { Link, useLocation } from 'react-router-dom';
import { BrandMark } from './BrandMark';
import { TrustBar } from './TrustBar';
import { useSettingsStore } from '../store/settingsStore';
import { useI18n } from '../i18n';
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

/**
 * Chrome Clinical Console : marque + nav desktop + trust bar (accueil).
 * La barre basse du socle reste pour le mobile ; ici, les liens métier.
 */
export function AppHeader({ subTagline }: AppHeaderProps) {
  const location = useLocation();
  const route = pathToRoute(location.pathname);
  const isHome = route === 'home';
  const disclaimerDismissed = useSettingsStore(s => s.disclaimerDismissed);
  const dismissDisclaimer = useSettingsStore(s => s.dismissDisclaimer);
  const { t } = useI18n();

  const taglineText = isHome
    ? t('home.taglineReady')
    : (subTagline ?? t('home.taglineReady'));

  return (
    <header className="app-header">
      <div
        className={[
          'app-header-inner',
          isHome ? 'app-header-inner--daily' : 'app-header-inner--subpage',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="app-header-body">
          <div className="app-header-top">
            <Link
              to="/"
              className="brand-block brand-link"
              aria-label={t('nav.brandHome')}
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
            <nav className="app-top-nav" aria-label={t('nav.primary')}>
              <Link
                to="/"
                className={
                  route === 'home'
                    ? 'app-top-nav-link is-current'
                    : 'app-top-nav-link'
                }
                aria-current={route === 'home' ? 'page' : undefined}
              >
                {t('nav.home')}
              </Link>
              <Link
                to="/parametres"
                className={
                  route === 'parametres'
                    ? 'app-top-nav-link is-current'
                    : 'app-top-nav-link'
                }
                aria-current={route === 'parametres' ? 'page' : undefined}
              >
                {t('nav.settings')}
              </Link>
              <Link
                to="/aide"
                className={
                  route === 'aide'
                    ? 'app-top-nav-link is-current'
                    : 'app-top-nav-link'
                }
                aria-current={route === 'aide' ? 'page' : undefined}
              >
                {t('nav.help')}
              </Link>
            </nav>
          </div>
          {isHome && (
            <>
              <DailyGuide />
              {!disclaimerDismissed && (
                <p className="disclaimer disclaimer--compact">
                  <span>{t('home.disclaimerReady')}</span>
                  <button
                    type="button"
                    className="disclaimer-dismiss"
                    aria-label={t('home.disclaimerHide')}
                    onClick={dismissDisclaimer}
                  >
                    ×
                  </button>
                </p>
              )}
            </>
          )}
        </div>
        {isHome && <TrustBar />}
      </div>
    </header>
  );
}

function DailyGuide() {
  const { t } = useI18n();
  return (
    <div className="header-guide header-guide--daily">
      <ul className="workflow-strip" aria-label={t('home.dailyLabel')}>
        <li className="workflow-strip-item">
          <span className="workflow-num">1</span> {t('home.dailyText')}
        </li>
        <li className="workflow-strip-sep" aria-hidden="true" />
        <li className="workflow-strip-item">
          <span className="workflow-num">2</span> {t('common.analyze')}
        </li>
        <li className="workflow-strip-sep" aria-hidden="true" />
        <li className="workflow-strip-item">
          <span className="workflow-num">3</span>{' '}
          {t('home.dailyValidateExport')}
        </li>
      </ul>
    </div>
  );
}
