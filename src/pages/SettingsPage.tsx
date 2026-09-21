import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { AppFooter } from '../components/AppFooter';
import { useDialog } from '../hooks/useDialog';
import { useSettingsStore } from '../store/settingsStore';
import { downloadAppBackup, restoreAppBackup } from '../lib/storage';
import { passerelleFournie } from '../lib/who-defaults';
import type { WhoSettings } from '../types/index';
import { UpdateButton } from '@mister-guiiug/dev-pwa-config/react/update-button';
import { ThemeToggle } from '@mister-guiiug/dev-pwa-config/react/theme-toggle';
import { useI18n } from '../i18n';
import { FamilyApps } from '@mister-guiiug/dev-pwa-config/react';

export function SettingsPage() {
  const minConfidence = useSettingsStore(s => s.minConfidence);
  const who = useSettingsStore(s => s.who);
  const setMinConfidence = useSettingsStore(s => s.setMinConfidence);
  const setWho = useSettingsStore(s => s.setWho);
  const forgetSecret = useSettingsStore(s => s.forgetSecret);
  const resetDisclaimer = useSettingsStore(s => s.resetDisclaimer);

  const dialog = useDialog();
  const { t, locale, setLocale, locales } = useI18n();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [resetFeedback, setResetFeedback] = useState(false);

  // Auto-clear feedback messages
  useEffect(() => {
    if (!shareFeedback) return;
    const id = setTimeout(() => setShareFeedback(null), 3000);
    return () => clearTimeout(id);
  }, [shareFeedback]);

  useEffect(() => {
    if (!resetFeedback) return;
    const id = setTimeout(() => setResetFeedback(false), 2000);
    return () => clearTimeout(id);
  }, [resetFeedback]);

  // Import d'un lien « Partager le paramétrage » : applique identifiant et
  // passerelle depuis l'URL (le mot secret n'y figure jamais), puis nettoie
  // l'URL pour ne pas le réappliquer ni le laisser dans l'historique.
  //
  // Les paramètres `mode` et `proxyUrl` des anciens liens sont IGNORÉS en
  // silence, et c'est le bon comportement : le premier ne désigne plus rien, le
  // second imposerait une adresse que la CSP du destinataire refuse. Rejeter le
  // lien entier pour un champ périmé ferait perdre ce qu'il porte encore.
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if ([...searchParams.keys()].length === 0) return;
    const patch: Partial<WhoSettings> = {};
    const cid = searchParams.get('clientId');
    const rel = searchParams.get('release');
    const lang = searchParams.get('lang');
    if (cid) patch.clientId = cid;
    if (rel) patch.releaseId = rel;
    if (lang) patch.lang = lang;
    if (Object.keys(patch).length > 0) setWho(patch);
    setSearchParams({}, { replace: true });
    // L'URL est une source EXTÉRIEURE, et un lien ouvert n'est pas un
    // événement qu'on puisse écouter : il n'existe pas de `onLinkOpened`. La
    // seule place où s'en saisir est l'effet, et dire ce qu'on vient
    // d'appliquer fait partie du travail — un réglage changé en silence est un
    // réglage qu'on croit ne pas avoir reçu.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShareFeedback(t('settings.importedFromLink'));
  }, [searchParams, setSearchParams, setWho, t]);

  // La passerelle du build s'authentifie seule : les champs de compte deviennent
  // des champs de REMPLACEMENT, plus des champs à remplir.
  const preconfigure = passerelleFournie();

  const handleExportAll = () => {
    downloadAppBackup();
  };

  const handleImportAll = async (file: File) => {
    const text = await file.text();
    if (await dialog.confirm(t('settings.restoreConfirm'))) {
      const result = restoreAppBackup(text);
      if (result.ok) {
        window.location.reload();
      } else {
        // Les motifs de refus sont AFFICHÉS, pas journalisés : l'utilisateur
        // doit savoir si son fichier est illisible ou vient d'une autre app.
        await dialog.alert(
          `${t('settings.importError')}\n\n${result.problems
            .map(p => `• ${p}`)
            .join('\n')}`
        );
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleShareSettings = async () => {
    const url = new URL(window.location.href);
    const params = new URLSearchParams();
    if (who.clientId) params.set('clientId', who.clientId);
    // Le mot secret n'est JAMAIS mis dans l'URL (sécurité) : le destinataire
    // saisit le sien.
    //
    // LA PASSERELLE NON PLUS, et pour une autre raison : le destinataire a
    // déjà celle de son build, et la CSP de son site refuserait la nôtre.
    // L'envoyer, c'était lui transmettre une adresse qui ne pouvait que le
    // priver de l'OMS.
    params.set('release', who.releaseId);
    params.set('lang', who.lang);
    url.hash = `#/parametres?${params.toString()}`;
    const link = url.toString();
    try {
      if (navigator.share) {
        await navigator.share({
          title: t('settings.shareDocTitle'),
          url: link,
        });
        setShareFeedback(t('settings.linkShared'));
      } else {
        await navigator.clipboard.writeText(link);
        setShareFeedback(t('settings.linkCopied'));
      }
    } catch {
      setShareFeedback(t('settings.shareCancelled'));
    }
  };

  return (
    <>
      <AppHeader subTagline={t('settings.subTagline')} />
      <main id="main-content" className="page-main settings-page" tabIndex={-1}>
        <header className="page-hero">
          <p className="page-kicker">{t('settings.kicker')}</p>
          <h1 className="page-title-h1">{t('settings.title')}</h1>
          <p className="page-lead">
            {t('settings.leadBefore')}
            <Link to="/aide" className="inline-link">
              {t('nav.help')}
            </Link>
            {t('settings.leadAfter')}
          </p>
        </header>

        <div className="panel panel--settings-page">
          <div className="settings-body settings-body--compact settings-body--page">
            {/* ── Suggestions ──
                LE SÉLECTEUR À TROIS MODES A DISPARU. Il demandait d'arbitrer
                entre deux classifications avant d'obtenir le moindre code, et
                son défaut (`local`) faisait que l'OMS, pourtant livrée, ne
                servait à personne. L'analyse interroge les deux ; reste ici ce
                qui se règle vraiment — la finesse, et le compte OMS. */}
            <section className="settings-section" aria-labelledby="sec-source">
              <h2 className="settings-section-title" id="sec-source">
                {t('settings.sourceTitle')}
              </h2>
              <p className="settings-hint">{t('settings.sourceHint')}</p>

              <div className="settings-block">
                <p className="settings-block-title">
                  {t('settings.thresholdTitle')}
                </p>
                <p className="settings-hint">{t('settings.thresholdHint')}</p>
                <div className="settings-threshold-row">
                  <label
                    className="who-field"
                    htmlFor="min-confidence-threshold"
                  >
                    <span className="who-field-label">
                      {t('settings.thresholdFrom')}
                    </span>
                    <input
                      type="range"
                      id="min-confidence-threshold"
                      min={0.1}
                      max={1}
                      step={0.05}
                      value={minConfidence}
                      onChange={e =>
                        setMinConfidence(Number.parseFloat(e.target.value))
                      }
                    />
                  </label>
                  <output
                    className="settings-threshold-value"
                    htmlFor="min-confidence-threshold"
                  >
                    {Math.round(minConfidence * 100)}%
                  </output>
                </div>
              </div>

              {/* DEUX CHAMPS, ET PLUS TROIS. L'adresse de la passerelle a
                  disparu : la CSP ne laisse joindre que celle du build et
                  `*.who.int`, donc toute autre valeur saisie ici ne produisait
                  qu'un silence — l'OMS ne répondait plus, sans un mot. Elle
                  reste dans le modèle, servie par le build. */}
              <div className="settings-block api-section api-section--compact">
                <div className="api-compact-bar">
                  <span className="api-compact-heading">
                    {t('settings.omsTitle')}
                  </span>
                  <nav
                    className="api-links"
                    aria-label={t('settings.omsResources')}
                  >
                    <a
                      href="https://icd.who.int/icdapi"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('settings.omsPortal')}
                    </a>
                    <span className="api-links-sep" aria-hidden="true">
                      ·
                    </span>
                    <a
                      href="https://icd.who.int/docs/icd-api/APIDoc-Version2/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('settings.omsApiDoc')}
                    </a>
                  </nav>
                </div>

                {/* LE COMPTE EST FACULTATIF QUAND LA PASSERELLE PORTE LE SIEN.
                    Sans cette phrase, deux champs vides sur une page de
                    réglages se lisent comme une configuration inachevée : on
                    cherche des identifiants qu'on n'a pas, et on renonce. */}
                {preconfigure && (
                  <p className="hint hint--compact">
                    {t('settings.omsPreconfigured')}
                  </p>
                )}

                <div className="api-fields-grid" role="group">
                  <label className="who-field">
                    <span className="who-field-label">
                      {t('settings.clientId')}
                    </span>
                    <input
                      type="text"
                      autoComplete="username"
                      spellCheck={false}
                      value={who.clientId}
                      onChange={e => setWho({ clientId: e.target.value })}
                    />
                  </label>
                  <label className="who-field">
                    <span className="who-field-label">
                      {t('settings.clientSecret')}
                    </span>
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={who.clientSecret}
                      onChange={e => setWho({ clientSecret: e.target.value })}
                    />
                  </label>
                </div>

                <details className="settings-sub">
                  <summary className="settings-sub-summary">
                    {t('settings.versionLangSummary')}
                  </summary>
                  <div className="api-row2 settings-sub-inner">
                    <label className="who-field who-field-inline">
                      <span className="who-field-label">
                        {t('settings.version')}
                      </span>
                      <select
                        value={who.releaseId}
                        onChange={e => setWho({ releaseId: e.target.value })}
                      >
                        <option value="2025-01">2025-01</option>
                        <option value="2024-01">2024-01</option>
                        <option value="2023-01">2023-01</option>
                      </select>
                    </label>
                    <label className="who-field who-field-inline">
                      <span className="who-field-label">
                        {t('settings.labelLang')}
                      </span>
                      <select
                        value={who.lang}
                        onChange={e => setWho({ lang: e.target.value })}
                      >
                        <option value="fr">{t('language.fr')}</option>
                        <option value="en">{t('language.en')}</option>
                      </select>
                    </label>
                  </div>
                </details>

                <p className="hint hint--compact who-risk">
                  {t('settings.omsRisk')}
                </p>
                <button
                  type="button"
                  className="ghost who-clear-btn"
                  onClick={forgetSecret}
                >
                  {t('settings.forgetSecret')}
                </button>
              </div>
            </section>

            {/* ── Apparence ── */}
            <section
              className="settings-section"
              aria-labelledby="sec-apparence"
            >
              <h2 className="settings-section-title" id="sec-apparence">
                {t('settings.appearanceTitle')}
              </h2>
              <div className="settings-theme-row">
                <span className="settings-theme-label">
                  {t('settings.themeLabel')}
                </span>
                <ThemeToggle />
              </div>
              <div className="settings-theme-row">
                <span className="settings-theme-label" id="lang-switch-label">
                  {t('settings.languageLabel')}
                </span>
                <div
                  className="toolbar"
                  role="group"
                  aria-labelledby="lang-switch-label"
                >
                  {locales.map(loc => (
                    <button
                      key={loc}
                      type="button"
                      className={locale === loc ? 'primary' : 'ghost'}
                      aria-pressed={locale === loc}
                      onClick={() => setLocale(loc)}
                    >
                      {loc === 'fr' ? t('language.fr') : t('language.en')}
                    </button>
                  ))}
                </div>
              </div>
              <div className="settings-block">
                <p className="settings-block-title">
                  {t('settings.disclaimerHiddenTitle')}
                </p>
                <p className="settings-hint">
                  {t('settings.disclaimerHiddenHint')}
                </p>
                <div className="toolbar">
                  <button
                    type="button"
                    className="ghost"
                    disabled={resetFeedback}
                    onClick={() => {
                      resetDisclaimer();
                      setResetFeedback(true);
                    }}
                  >
                    {resetFeedback
                      ? t('settings.disclaimerShown')
                      : t('settings.disclaimerReshow')}
                  </button>
                </div>
              </div>
            </section>

            {/* ── Données (repliable) ── */}
            <details className="settings-section settings-section--collapsible">
              <summary className="settings-section-summary">
                <span className="settings-section-title">
                  {t('settings.dataTitle')}
                </span>
                <span className="settings-section-summary-hint">
                  {t('settings.dataSummaryHint')}
                </span>
              </summary>
              <div className="settings-section-body">
                <div className="settings-share-block">
                  <p className="settings-share-title">
                    {t('settings.shareTitle')}
                  </p>
                  <p className="settings-share-hint hint">
                    {t('settings.shareHint')}
                  </p>
                  <div className="toolbar settings-share-toolbar">
                    <button
                      type="button"
                      className="secondary"
                      onClick={handleShareSettings}
                    >
                      {t('settings.shareButton')}
                    </button>
                  </div>
                  {shareFeedback && (
                    <p className="settings-share-feedback" role="status">
                      {shareFeedback}
                    </p>
                  )}
                </div>

                <div className="settings-block">
                  <p className="settings-block-title">
                    {t('settings.backupTitle')}
                  </p>
                  <p className="settings-hint">{t('settings.backupHint')}</p>
                  <div className="toolbar">
                    <button
                      type="button"
                      className="secondary"
                      onClick={handleExportAll}
                    >
                      {t('settings.backupExport')}
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {t('settings.backupImport')}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      hidden
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) void handleImportAll(file);
                      }}
                    />
                  </div>
                </div>
              </div>
            </details>

            {/* ── Application ── */}
            <section className="settings-section" aria-labelledby="sec-app">
              <h2 className="settings-section-title" id="sec-app">
                {t('settings.appTitle')}
              </h2>
              <p className="settings-hint">{t('settings.appHint')}</p>
              <div className="toolbar">
                {/* Le bouton du socle, sous le fournisseur `AppUpdates` monté
                    dans `main.tsx` : il partage l'état du bandeau (« Mise à
                    jour… » pendant l'opération) et n'a donc rien à recevoir.
                    L'ancien `reloadApp()` postait `SKIP_WAITING` puis
                    rechargeait au bout de 600 ms — un pari sur une activation
                    asynchrone, et un no-op complet en `registerType:
                    'autoUpdate'`. `forceUpdate()` purge le Cache Storage et
                    navigue vers une URL anti-cache ; `localStorage` (compte
                    rendu, diagnostics validés, réglages) n'est jamais touché. */}
                <UpdateButton
                  className="secondary"
                  label={t('settings.appReload')}
                />
              </div>
            </section>

            {/* ── Nos autres applications (catalogue famille) ──
                REPLIÉ, et ce n'est pas une mise au placard. Mesuré le
                17/09/2026 : la page faisait 3 272 px et ce bloc en occupait
                1 866 — 57 % d'une page de RÉGLAGES consacrés à dix-neuf
                applications qui n'en sont pas. Les réglages de l'outil
                méritent la page ; le catalogue reste à un clic. */}
            <details className="settings-section settings-section--collapsible">
              <summary className="settings-section-summary">
                <span className="settings-section-title">
                  {t('settings.familyTitle')}
                </span>
                <span className="settings-section-summary-hint">
                  {t('settings.familySummaryHint')}
                </span>
              </summary>
              <div className="settings-section-body">
                <p className="settings-hint">{t('settings.familyHint')}</p>
                <div className="cim-family">
                  <FamilyApps
                    currentAppId="mister-cim10"
                    showSource={false}
                    showSponsor={false}
                    // Les deux réglages que `style.css` posait en CSS : le
                    // <summary> ci-dessus annonce déjà la section, et l'app
                    // refaisait la grille en une colonne.
                    showTitle={false}
                    layout="list"
                    // UN REPLI DANS UN REPLI, ET C'EST VOULU. Le <details>
                    // ci-dessus décide si le catalogue paraît ; celui-ci
                    // décide de quelle catégorie. Ouvrir la section montre
                    // donc sept lignes au lieu des dix-neuf cartes qui
                    // occupaient 1 866 px — la mesure qui a justifié le
                    // premier repli vaut encore pour le second.
                    groupBy="category"
                  />
                </div>
              </div>
            </details>
          </div>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
