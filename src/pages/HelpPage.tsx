import { Link } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { AppFooter } from '../components/AppFooter';
import { useI18n } from '../i18n';

const PORTAL_URL = 'https://icd.who.int/icdapi';
const DOC_API_URL = 'https://icd.who.int/docs/icd-api/APIDoc-Version2/';

export function HelpPage() {
  const { t } = useI18n();
  return (
    <>
      <AppHeader subTagline={t('help.subTagline')} />
      <main id="main-content" className="page-main help-page" tabIndex={-1}>
        <header className="page-hero">
          <h1 className="page-title">{t('help.title')}</h1>
          <p className="page-lead">
            {t('help.leadBefore')}
            <strong>{t('help.leadStrong')}</strong>
            {t('help.leadAfter')}
          </p>
        </header>

        <nav className="help-toc" aria-label={t('help.tocLabel')}>
          <span className="help-toc-label">{t('help.tocLabel')}</span>
          <ul className="help-toc-list">
            <li>
              <a href="#aide-utilisation">{t('help.tocUse')}</a>
            </li>
            <li>
              <a href="#aide-compte-oms">{t('help.tocAccount')}</a>
            </li>
            <li>
              <a href="#aide-passerelle">{t('help.tocGateway')}</a>
            </li>
            <li>
              <a href="#aide-liens">{t('help.tocLinks')}</a>
            </li>
          </ul>
        </nav>

        <article className="help-article" id="aide-utilisation">
          <h2 className="help-h2">{t('help.tocUse')}</h2>
          <ol className="help-steps">
            <li>
              <strong>{t('help.use1Strong')}</strong> {t('help.use1Mid')}
              <Link to="/parametres">{t('nav.settings')}</Link>
              {t('help.use1After')}
            </li>
            <li>
              <strong>{t('help.use2Strong')}</strong> {t('help.use2Mid')}
              <Link to="/">{t('help.use2Link')}</Link>
              {t('help.use2After')}
            </li>
            <li>{t('help.use3')}</li>
            <li>{t('help.use4')}</li>
          </ol>
          <p className="help-note">{t('help.useNote')}</p>
        </article>

        <article className="help-article" id="aide-compte-oms">
          <h2 className="help-h2">{t('help.accountTitle')}</h2>
          <p>{t('help.accountIntro')}</p>

          <details className="help-details">
            <summary className="help-details-summary">
              {t('help.accountDetailsSummary')}
            </summary>

            <h3 className="help-h3">{t('help.accountStep1Title')}</h3>
            <ul className="help-list">
              <li>
                {t('help.openPortal')}
                <a href={PORTAL_URL} target="_blank" rel="noopener noreferrer">
                  {PORTAL_URL}
                </a>
                .
              </li>
              <li>{t('help.accountStep1b')}</li>
              <li>{t('help.accountStep1c')}</li>
            </ul>

            <h3 className="help-h3">{t('help.accountStep2Title')}</h3>
            <p>{t('help.accountStep2Intro')}</p>
            <ul className="help-list">
              <li>{t('help.accountStep2a')}</li>
              <li>{t('help.accountStep2b')}</li>
              <li>{t('help.accountStep2c')}</li>
            </ul>

            <h3 className="help-h3">{t('help.accountStep3Title')}</h3>
            <ul className="help-list">
              <li>
                {t('help.goTo')}
                <Link to="/parametres">{t('nav.settings')}</Link>
                {t('help.accountStep3aAfter')}
              </li>
              <li>{t('help.accountStep3b')}</li>
            </ul>
          </details>

          <p className="help-note">
            {t('help.accountNoteBefore')}
            <a href={DOC_API_URL} target="_blank" rel="noopener noreferrer">
              {t('help.accountNoteLink')}
            </a>
            {t('help.accountNoteAfter')}
          </p>
        </article>

        <article className="help-article" id="aide-passerelle">
          <h2 className="help-h2">{t('help.gatewayTitle')}</h2>
          <p>{t('help.gatewayP1')}</p>
          <p>
            {t('help.gatewayP2a')}
            <code className="help-code">workers/</code>
            {t('help.gatewayP2b')}
            <code className="help-code">README</code>
            {t('help.gatewayP2c')}
          </p>
          <p className="help-note">{t('help.gatewayNote')}</p>
        </article>

        <article className="help-article" id="aide-liens">
          <h2 className="help-h2">{t('help.tocLinks')}</h2>
          <ul className="help-list help-list--links">
            <li>
              <a href={PORTAL_URL} target="_blank" rel="noopener noreferrer">
                {t('help.linkPortal')}
              </a>
            </li>
            <li>
              <a href={DOC_API_URL} target="_blank" rel="noopener noreferrer">
                {t('help.linkApiDoc')}
              </a>
            </li>
            <li>
              <Link to="/">{t('help.backHome')}</Link> ·{' '}
              <Link to="/parametres">{t('nav.settings')}</Link>
            </li>
          </ul>
        </article>
      </main>
      <AppFooter />
    </>
  );
}
