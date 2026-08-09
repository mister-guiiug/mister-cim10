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

export function AppHeader({ subTagline }: AppHeaderProps) {
  const location = useLocation();
  const route = pathToRoute(location.pathname);
  const isHome = route === 'home';
  const settingsReady = useSettingsStore(s => s.isReady());
  const disclaimerDismissed = useSettingsStore(s => s.disclaimerDismissed);
  const dismissDisclaimer = useSettingsStore(s => s.dismissDisclaimer);
  const { t } = useI18n();

  const defaultTagline = settingsReady
    ? t('home.taglineReady')
    : t('home.taglineSetup');
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
              {!settingsReady && <SetupGuide />}
              {settingsReady && <DailyGuide />}
              {!disclaimerDismissed && (
                <p
                  className={`disclaimer${settingsReady ? ' disclaimer--compact' : ''}`}
                >
                  <span>
                    {settingsReady
                      ? t('home.disclaimerReady')
                      : t('home.disclaimerSetup')}
                  </span>
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

function SetupGuide() {
  const { t } = useI18n();
  return (
    <div className="header-guide">
      <p className="setup-lead">{t('home.setupLead')}</p>
      <ol className="quick-steps" aria-label={t('home.setupStepsLabel')}>
        <li className="quick-step">
          <span className="step-num" aria-hidden="true">
            1
          </span>
          <span className="step-body">
            <strong>{t('nav.settings')}</strong> {t('home.setupStep1')}
          </span>
        </li>
        <li className="quick-step">
          <span className="step-num" aria-hidden="true">
            2
          </span>
          <span className="step-body">
            <strong>{t('report.title')}</strong> {t('home.setupStep2')}
          </span>
        </li>
        <li className="quick-step">
          <span className="step-num" aria-hidden="true">
            3
          </span>
          <span className="step-body">
            <strong>{t('home.validationLabel')}</strong> {t('home.setupStep3')}
          </span>
        </li>
      </ol>
    </div>
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
