import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { AppFooter } from '../components/AppFooter';
import { useDialog } from '../hooks/useDialog';
import { useSettingsStore } from '../store/settingsStore';
import { dateSlug, downloadBlob } from '@mister-guiiug/dev-wpa-config/download';
import { exportAppData, importAppData } from '../lib/storage';
import type { AnalyzeMode, WhoSettings } from '../types/index';
import { reloadApp } from '../register-sw';
import { ThemeToggle } from '../components/ThemeToggle';
import { useI18n } from '../i18n';
import { FamilyApps } from '@mister-guiiug/dev-wpa-config/react';

export function SettingsPage() {
  const mode = useSettingsStore(s => s.mode);
  const minConfidence = useSettingsStore(s => s.minConfidence);
  const who = useSettingsStore(s => s.who);
  const setMode = useSettingsStore(s => s.setMode);
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

  // Import d'un lien « Partager le paramétrage » : applique mode / identifiant /
  // passerelle depuis l'URL (le mot secret n'y figure jamais), puis nettoie
  // l'URL pour ne pas le réappliquer ni le laisser dans l'historique.
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if ([...searchParams.keys()].length === 0) return;
    const m = searchParams.get('mode');
    if (m === 'local' || m === 'api' || m === 'both') setMode(m);
    const patch: Partial<WhoSettings> = {};
    const cid = searchParams.get('clientId');
    const proxy = searchParams.get('proxyUrl');
    const rel = searchParams.get('release');
    const lang = searchParams.get('lang');
    if (cid) patch.clientId = cid;
    if (proxy) patch.proxyUrl = proxy;
    if (rel) patch.releaseId = rel;
    if (lang) patch.lang = lang;
    if (Object.keys(patch).length > 0) setWho(patch);
    setSearchParams({}, { replace: true });
    setShareFeedback(t('settings.importedFromLink'));
  }, [searchParams, setSearchParams, setMode, setWho, t]);

  const showWhoSection = mode !== 'local';

  const handleExportAll = () => {
    const json = exportAppData();
    const blob = new Blob([json], { type: 'application/json' });
    downloadBlob(blob, `mister-cim10-backup-${dateSlug()}.json`);
  };

  const handleImportAll = async (file: File) => {
    const text = await file.text();
    if (await dialog.confirm(t('settings.restoreConfirm'))) {
      if (importAppData(text)) {
        window.location.reload();
      } else {
        await dialog.alert(t('settings.importError'));
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleShareSettings = async () => {
    const url = new URL(window.location.href);
    const params = new URLSearchParams();
    params.set('mode', mode);
    if (who.clientId) params.set('clientId', who.clientId);
    // Le mot secret n'est JAMAIS mis dans l'URL (sécurité) : le destinataire
    // saisit le sien.
    if (who.proxyUrl) params.set('proxyUrl', who.proxyUrl);
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
          <p className="settings-page-badge-line" aria-live="polite">
            <span className="settings-page-badge-label">
              {t('settings.modeSavedLabel')}
            </span>
            <span className="settings-summary-badge settings-summary-badge--inline">
              {t(`settings.modeSummary.${mode}`)}
            </span>
          </p>
        </header>

        <div className="panel panel--settings-page">
          <div className="settings-body settings-body--compact settings-body--page">
            {/* ── Source des suggestions ── */}
            <section className="settings-section" aria-labelledby="sec-source">
              <h2 className="settings-section-title" id="sec-source">
                {t('settings.sourceTitle')}
              </h2>
              <div className="settings-mode-line">
                <label
                  className="settings-mode-label"
                  htmlFor="analyze-mode-select"
                >
                  {t('settings.modeLabel')}
                </label>
                <select
                  id="analyze-mode-select"
                  className="settings-select"
                  aria-describedby="analyze-mode-hint"
                  value={mode}
                  onChange={e => setMode(e.target.value as AnalyzeMode)}
                >
                  <option value="local">{t('settings.modeLocal')}</option>
                  <option value="api">{t('settings.modeApi')}</option>
                  <option value="both">{t('settings.modeBoth')}</option>
                </select>
              </div>
              <p className="settings-hint" id="analyze-mode-hint">
                {t('settings.modeHint')}
              </p>

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

              <div
                className="settings-block api-section api-section--compact"
                hidden={!showWhoSection}
              >
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
                  <label className="who-field api-field-span2">
                    <span className="who-field-label">
                      {t('settings.proxyUrl')}
                    </span>
                    <input
                      type="url"
                      inputMode="url"
                      autoComplete="off"
                      placeholder="https://…"
                      spellCheck={false}
                      value={who.proxyUrl}
                      onChange={e => setWho({ proxyUrl: e.target.value })}
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
                <button type="button" className="secondary" onClick={reloadApp}>
                  {t('settings.appReload')}
                </button>
              </div>
              <p className="settings-app-version">
                {t('settings.appVersion', {
                  version: __APP_VERSION__,
                  build: __BUILD_TIME__,
                })}
              </p>
            </section>

            {/* ── Nos autres applications (catalogue famille) ── */}
            <section className="settings-section" aria-labelledby="sec-famille">
              <h2 className="settings-section-title" id="sec-famille">
                {t('settings.familyTitle')}
              </h2>
              <p className="settings-hint">{t('settings.familyHint')}</p>
              <div className="cim-family">
                <FamilyApps
                  currentAppId="mister-cim10"
                  showSource={false}
                  showSponsor={false}
                />
              </div>
            </section>
          </div>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
