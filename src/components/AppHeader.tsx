import { Link, useLocation } from 'react-router-dom';
import { BrandMark } from './BrandMark';
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
 * IL N'Y A PLUS D'ÉTAT « À CONFIGURER », donc plus de guide de démarrage.
 *
 * L'en-tête montrait un `SetupGuide` en trois étapes tant que `isReady()` était
 * faux, et sa première étape était « choisir la source des suggestions ». Le
 * sélecteur de mode a disparu, la passerelle OMS vient du build et le
 * dictionnaire embarqué répond toujours : « pas prêt » est devenu inatteignable.
 * Garder une branche qui ne peut plus être vraie, c'est promettre une
 * configuration qui n'existe pas.
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
