import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { AppFooter } from '../components/AppFooter';
import { useDialog } from '../hooks/useDialog';
import { useSettingsStore } from '../store/settingsStore';
import { MODE_SUMMARY_LABEL } from '../lib/constants';
import {
  dateSlug,
  downloadBlob,
  exportAppData,
  importAppData,
} from '../lib/storage';
import type { AnalyzeMode } from '../types/index';

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

  const showWhoSection = mode !== 'local';

  const handleExportAll = () => {
    const json = exportAppData();
    const blob = new Blob([json], { type: 'application/json' });
    downloadBlob(blob, `mister-cim10-backup-${dateSlug()}.json`);
  };

  const handleImportAll = async (file: File) => {
    const text = await file.text();
    if (
      await dialog.confirm(
        'Restaurer les données ? Les paramètres et données actuels seront écrasés. L’application va redémarrer.'
      )
    ) {
      if (importAppData(text)) {
        window.location.reload();
      } else {
        await dialog.alert('Erreur lors de l’import. Fichier invalide.');
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleShareSettings = async () => {
    const url = new URL(window.location.href);
    const params = new URLSearchParams();
    params.set('mode', mode);
    if (who.clientId) params.set('clientId', who.clientId);
    if (who.clientSecret) params.set('clientSecret', who.clientSecret);
    if (who.proxyUrl) params.set('proxyUrl', who.proxyUrl);
    params.set('release', who.releaseId);
    params.set('lang', who.lang);
    url.hash = `#/parametres?${params.toString()}`;
    const link = url.toString();
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Mister CIM-10 — paramétrage',
          url: link,
        });
        setShareFeedback('Lien partagé.');
      } else {
        await navigator.clipboard.writeText(link);
        setShareFeedback('Lien copié dans le presse-papiers.');
      }
    } catch {
      setShareFeedback('Partage annulé.');
    }
  };

  return (
    <>
      <AppHeader subTagline="Source des suggestions et connexion OMS" />
      <main id="main-content" className="page-main settings-page" tabIndex={-1}>
        <header className="page-hero">
          <p className="page-kicker">Configuration</p>
          <h1 className="page-title-h1">Paramètres</h1>
          <p className="page-lead">
            Choisissez comment les codes sont proposés, puis renseignez la
            connexion à l’OMS si vous l’activez. Pour obtenir un compte et des
            identifiants API, suivez le guide sur la page{' '}
            <Link to="/aide" className="inline-link">
              Aide
            </Link>{' '}
            (section compte OMS).
          </p>
          <p className="settings-page-badge-line" aria-live="polite">
            <span className="settings-page-badge-label">Mode enregistré</span>
            <span className="settings-summary-badge settings-summary-badge--inline">
              {MODE_SUMMARY_LABEL[mode]}
            </span>
          </p>
        </header>

        <div className="panel panel--settings-page">
          <div className="settings-body settings-body--compact settings-body--page">
            <div className="settings-mode-line">
              <label
                className="settings-mode-label"
                htmlFor="analyze-mode-select"
              >
                Source des suggestions
              </label>
              <select
                id="analyze-mode-select"
                className="settings-select"
                aria-describedby="analyze-mode-hint"
                value={mode}
                onChange={e => setMode(e.target.value as AnalyzeMode)}
              >
                <option value="local">Intégré uniquement (sans OMS)</option>
                <option value="api">OMS uniquement</option>
                <option value="both">Intégré et OMS</option>
              </select>
            </div>
            <p className="settings-hint" id="analyze-mode-hint">
              Par défaut, tout se fait dans la page. Si vous choisissez une
              option avec OMS, les champs de connexion s’affichent : compte OMS
              et adresse de passerelle requis.
            </p>

            <div className="settings-block">
              <p className="settings-block-title">Seuil de confiance minimal</p>
              <p className="settings-hint">
                Les suggestions avec une confiance inférieure à ce seuil restent
                ignorées par défaut dans la liste.
              </p>
              <div className="settings-threshold-row">
                <label className="who-field" htmlFor="min-confidence-threshold">
                  <span className="who-field-label">Afficher à partir de</span>
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
                <span className="api-compact-heading">Connexion OMS</span>
                <nav className="api-links" aria-label="Ressources OMS">
                  <a
                    href="https://icd.who.int/icdapi"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Portail ICD API
                  </a>
                  <span className="api-links-sep" aria-hidden="true">
                    ·
                  </span>
                  <a
                    href="https://icd.who.int/docs/icd-api/APIDoc-Version2/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Documentation API
                  </a>
                </nav>
              </div>

              <div className="api-fields-grid" role="group">
                <label className="who-field">
                  <span className="who-field-label">Identifiant</span>
                  <input
                    type="text"
                    autoComplete="username"
                    spellCheck={false}
                    value={who.clientId}
                    onChange={e => setWho({ clientId: e.target.value })}
                  />
                </label>
                <label className="who-field">
                  <span className="who-field-label">Mot secret</span>
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={who.clientSecret}
                    onChange={e => setWho({ clientSecret: e.target.value })}
                  />
                </label>
                <label className="who-field api-field-span2">
                  <span className="who-field-label">
                    Adresse de la passerelle
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
                  Version de la classification et langue
                </summary>
                <div className="api-row2 settings-sub-inner">
                  <label className="who-field who-field-inline">
                    <span className="who-field-label">Version</span>
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
                    <span className="who-field-label">Langue des libellés</span>
                    <select
                      value={who.lang}
                      onChange={e => setWho({ lang: e.target.value })}
                    >
                      <option value="fr">Français</option>
                      <option value="en">English</option>
                    </select>
                  </label>
                </div>
              </details>

              <p className="hint hint--compact who-risk">
                Identifiants enregistrés dans ce navigateur (éviter sur poste
                partagé). La passerelle doit autoriser ce site.
              </p>
              <button
                type="button"
                className="ghost who-clear-btn"
                onClick={forgetSecret}
              >
                Oublier mot secret et session OMS
              </button>
            </div>

            <div className="settings-share-block">
              <p className="settings-share-title">Partager le paramétrage</p>
              <p className="settings-share-hint hint">
                Génère un <strong>lien</strong> reprenant le mode d’analyse et
                les champs ci-dessus (y compris le{' '}
                <strong>mot secret OMS</strong> s’il est renseigné). Ne
                l’envoyez qu’à des personnes de confiance ; évitez les canaux
                non chiffrés.
              </p>
              <div className="toolbar settings-share-toolbar">
                <button
                  type="button"
                  className="secondary"
                  onClick={handleShareSettings}
                >
                  Partager ou copier le lien
                </button>
              </div>
              {shareFeedback && (
                <p className="settings-share-feedback" role="status">
                  {shareFeedback}
                </p>
              )}
            </div>

            <div className="settings-block">
              <p className="settings-block-title">Sauvegarde et Restauration</p>
              <p className="settings-hint">
                Téléchargez toutes vos données (favoris, historique, sessions,
                paramètres) dans un fichier pour les sauvegarder ou les
                transférer.
              </p>
              <div className="toolbar">
                <button
                  type="button"
                  className="secondary"
                  onClick={handleExportAll}
                >
                  Sauvegarder tout (.json)
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Restaurer tout…
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

            <div className="settings-block settings-display-block">
              <p className="settings-block-title">
                Préférences d&apos;affichage
              </p>
              <p className="settings-hint">
                Éléments masqués manuellement que vous pouvez réafficher.
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
                    ? 'Avertissement réaffiché ✓'
                    : 'Réafficher l’avertissement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <AppFooter />
    </>
  );
}
