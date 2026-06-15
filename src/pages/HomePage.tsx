import { AppHeader } from '../components/AppHeader';
import { AppFooter } from '../components/AppFooter';
import { CrPanel } from '../features/workspace/CrPanel';
import { SuggestionsPanel } from '../features/workspace/SuggestionsPanel';
import { ValidatedPanel } from '../features/workspace/ValidatedPanel';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useSettingsStore } from '../store/settingsStore';
import { suggestFromText } from '../lib/analyzer';
import { OmsError, suggestFromOms } from '../lib/oms';
import type { AnalysisResult } from '../types/index';

export function HomePage() {
  const setSuggestions = useWorkspaceStore(s => s.setSuggestions);
  const setIsAnalyzing = useWorkspaceStore(s => s.setIsAnalyzing);
  const setAnalyzeError = useWorkspaceStore(s => s.setAnalyzeError);
  const crText = useWorkspaceStore(s => s.crText);
  const mode = useSettingsStore(s => s.mode);
  const who = useSettingsStore(s => s.who);
  const isReady = useSettingsStore(s => s.isReady());

  const handleAnalyze = async () => {
    if (!isReady) {
      setAnalyzeError(
        'Configurez d’abord la source des suggestions dans les Paramètres.'
      );
      return;
    }
    if (!crText.trim()) {
      setAnalyzeError('Saisissez un compte-rendu avant de lancer l’analyse.');
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
      // OMS CIM-11 via la passerelle (réseau).
      if (mode === 'api' || mode === 'both') {
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
          ? err.message
          : err instanceof Error
            ? err.message
            : String(err)
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <AppHeader />
      <main id="main-content" className="workspace" tabIndex={-1}>
        <CrPanel onAnalyze={handleAnalyze} />
        <SuggestionsPanel />
        <ValidatedPanel />
      </main>
      <AppFooter />
    </>
  );
}
