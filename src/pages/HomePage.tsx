import { AppHeader } from '../components/AppHeader';
import { AppFooter } from '../components/AppFooter';
import { CrPanel } from '../features/workspace/CrPanel';
import { SuggestionsPanel } from '../features/workspace/SuggestionsPanel';
import { ValidatedPanel } from '../features/workspace/ValidatedPanel';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useSettingsStore } from '../store/settingsStore';
import { suggestFromText } from '../lib/analyzer';

export function HomePage() {
  const setSuggestions = useWorkspaceStore(s => s.setSuggestions);
  const setIsAnalyzing = useWorkspaceStore(s => s.setIsAnalyzing);
  const setAnalyzeError = useWorkspaceStore(s => s.setAnalyzeError);
  const crText = useWorkspaceStore(s => s.crText);
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
      // Analyse locale immédiate (pure logic).
      const local = suggestFromText(crText);
      setSuggestions(local);
      // TODO : combiner avec l'appel OMS quand mode === 'api' ou 'both'.
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : String(err));
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
