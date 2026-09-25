import { Link } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { PrivacyNotice } from '../components/PrivacyNotice';
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
            {/* UNE SEULE ENTRÉE, VERS LE BLOC LUI-MÊME. Les deux ancres
                d'avant (`#aide-compte-oms`, `#aide-passerelle`) vivent
                maintenant dans un `<details>` replié : tous les navigateurs ne
                le déplient pas pour rejoindre un fragment, et un sommaire qui
                mène à du vide est pire que pas de sommaire. */}
            <li>
              <a href="#aide-avance">{t('help.advancedTitle')}</a>
            </li>
            <li>
              <a href="#aide-liens">{t('help.tocLinks')}</a>
            </li>
          </ul>
        </nav>

        {/* ── Utiliser l'application ──
            L'ÉTAPE 1 ÉTAIT « CONFIGURER LA SOURCE ». Or activer la source OMS
            demande un compte développeur, un OAuth2 avec secret et le
            DÉPLOIEMENT D'UNE PASSERELLE Cloudflare : une tâche d'intégrateur
            placée en tête du mode d'emploi d'un outil de cotation. Le
            dictionnaire embarqué, lui, ne demande rien. On commence donc par
            ce qui marche tout de suite, et l'OMS devient « aller plus loin ». */}
        <article className="help-article" id="aide-utilisation">
          <h2 className="help-h2">{t('help.tocUse')}</h2>
          <p className="help-lead">{t('help.useLead')}</p>
          <ol className="help-steps">
            <li>
              <strong>{t('help.use2Strong')}</strong> {t('help.use2Mid')}
              <Link to="/">{t('help.use2Link')}</Link>
              {t('help.use2After')}
            </li>
            <li>{t('help.use3')}</li>
            <li>{t('help.use4')}</li>
            <li>{t('help.use5')}</li>
            <li>{t('help.use6')}</li>
          </ol>
          <p className="help-note">{t('help.shortcuts')}</p>
          <p className="help-note">{t('help.useNote')}</p>
          <p className="help-note">
            {t('help.useSourceNoteBefore')}
            <Link to="/parametres">{t('nav.settings')}</Link>
            {t('help.useSourceNoteAfter')}
          </p>
        </article>

        {/* ── Aller plus loin : votre propre compte OMS ──
            REPLIÉ, et plus encore qu'avant : l'application arrive reliée à un
            compte, la passerelle est déployée avec le projet, et il n'y a donc
            plus rien à faire pour coter. Ce qui reste ici ne sert qu'à qui veut
            substituer SES identifiants. Déplié d'office, ça donnerait à croire
            qu'il faut en passer par là. Le sommaire y mène toujours. */}
        <details className="help-avance" id="aide-avance">
          <summary className="help-avance-summary">
            <span className="help-h2">{t('help.advancedTitle')}</span>
            <span className="help-avance-hint">{t('help.advancedHint')}</span>
          </summary>
          <article className="help-article" id="aide-compte-oms">
            <h3 className="help-h2">{t('help.accountTitle')}</h3>
            <p>{t('help.accountIntro')}</p>

            <details className="help-details">
              <summary className="help-details-summary">
                {t('help.accountDetailsSummary')}
              </summary>

              <h4 className="help-h3">{t('help.accountStep1Title')}</h4>
              <ul className="help-list">
                <li>
                  {t('help.openPortal')}
                  <a
                    href={PORTAL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {PORTAL_URL}
                  </a>
                  .
                </li>
                <li>{t('help.accountStep1b')}</li>
                <li>{t('help.accountStep1c')}</li>
              </ul>

              <h4 className="help-h3">{t('help.accountStep2Title')}</h4>
              <p>{t('help.accountStep2Intro')}</p>
              <ul className="help-list">
                <li>{t('help.accountStep2a')}</li>
                <li>{t('help.accountStep2b')}</li>
                <li>{t('help.accountStep2c')}</li>
              </ul>

              <h4 className="help-h3">{t('help.accountStep3Title')}</h4>
              <ul className="help-list">
                <li>
                  {t('help.goTo')}
                  <Link to="/parametres">{t('nav.settings')}</Link>
                  {t('help.accountStep3aAfter')}
                </li>
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
            <h3 className="help-h2">{t('help.gatewayTitle')}</h3>
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
        </details>

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
      {/* La mention de confidentialité, SANS les liens de la famille : la
          règle du 06/09/2026 les réserve à l'accueil et aux Réglages. */}
      <div className="app-footer">
        <PrivacyNotice />
      </div>
    </>
  );
}
