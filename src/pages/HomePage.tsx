import { useActionGuard } from '@mister-guiiug/dev-pwa-config/react/use-action-guard';
import { useOnline } from '@mister-guiiug/dev-pwa-config/react/use-online';
import { AppHeader } from '../components/AppHeader';
import { AppFooter } from '../components/AppFooter';
import { CrPanel } from '../features/workspace/CrPanel';
import { SuggestionsPanel } from '../features/workspace/SuggestionsPanel';
import { ValidatedPanel } from '../features/workspace/ValidatedPanel';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useSettingsStore } from '../store/settingsStore';
import { suggestFromText } from '../lib/analyzer';
import { OmsError, suggestFromOms } from '../lib/oms';
import { useI18n } from '../i18n';
import type { AnalysisResult } from '../types/index';

export function HomePage() {
  const setSuggestions = useWorkspaceStore(s => s.setSuggestions);
  const setIsAnalyzing = useWorkspaceStore(s => s.setIsAnalyzing);
  const setAnalyzeError = useWorkspaceStore(s => s.setAnalyzeError);
  const crText = useWorkspaceStore(s => s.crText);
  const mode = useSettingsStore(s => s.mode);
  const who = useSettingsStore(s => s.who);
  const isReady = useSettingsStore(s => s.isReady());
  const { t } = useI18n();

  /**
   * L'OMS est le SEUL appel réseau de l'app ; le dictionnaire CIM-10, lui, est
   * embarqué et répond hors connexion. D'où deux traitements distincts :
   *
   *   - mode « api » : l'OMS est l'unique source. Hors connexion le bouton n'a
   *     rien à produire, on le garde (motif `offline` du socle, message affiché).
   *   - mode « both » : le local suffit à répondre. Le bouton RESTE actif, et
   *     seule la moitié OMS s'annonce indisponible. Avant, l'échec de l'OMS
   *     levait avant `setSuggestions` : les résultats locaux déjà calculés
   *     partaient à la poubelle et l'utilisateur repartait les mains vides.
   *   - mode « local » (défaut) : rien ne change, aucun mot.
   */
  const isOnline = useOnline();
  const analyzeGuard = useActionGuard({ online: mode === 'api' });
  const omsSkipped = mode === 'both' && !isOnline;

  const handleAnalyze = async () => {
    if (!isReady) {
      setAnalyzeError(t('errors.configure'));
      return;
    }
    if (!crText.trim()) {
      setAnalyzeError(t('errors.emptyReport'));
      return;
    }
    setAnalyzeError(null);
    setIsAnalyzing(true);
    try {
      const results: AnalysisResult[] = [];
      // Dictionnaire local CIM-10 (immédiat).
      if (mode === 'local' || mode === 'both') {
        results.push(...suggestFromText(crText));
      }
      // OMS CIM-11 via la passerelle (réseau) — sautée hors connexion, où elle
      // ne peut qu'échouer : la partie locale, elle, a déjà répondu.
      if ((mode === 'api' || mode === 'both') && isOnline) {
        results.push(...(await suggestFromOms(crText, who)));
      }
      // Dédup par code (CIM-10 et CIM-11 ne se chevauchent pas), tri par confiance.
      const byCode = new Map<string, AnalysisResult>();
      for (const r of results) if (!byCode.has(r.code)) byCode.set(r.code, r);
      setSuggestions(
        [...byCode.values()].sort((a, b) => b.confidence - a.confidence)
      );
    } catch (err) {
      setAnalyzeError(
        err instanceof OmsError
          ? t(
              `errors.oms.${err.code}`,
              err.status === undefined ? undefined : { status: err.status }
            )
          : t('errors.oms.unknown')
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <AppHeader />
      <main id="main-content" className="workspace" tabIndex={-1}>
        <CrPanel
          // `wrap` neutralise le clic quand le garde bloque : `aria-disabled`
          // laisse le bouton focusable (donc son motif atteignable), il ne
          // l'empêche pas de se déclencher.
          onAnalyze={analyzeGuard.wrap(handleAnalyze)}
          analyzeGuard={analyzeGuard}
          omsOfflineNotice={omsSkipped ? t('errors.oms.offlineSkipped') : null}
        />
        <SuggestionsPanel />
        <ValidatedPanel />
      </main>
      <AppFooter />
    </>
  );
}
