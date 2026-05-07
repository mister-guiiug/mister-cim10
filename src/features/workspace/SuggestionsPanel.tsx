import { useMemo } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useSettingsStore } from '../../store/settingsStore';
import type { AnalysisResult } from '../../types/index';

function confidenceLabel(c: number): string {
  if (c >= 0.8) return 'Élevée';
  if (c >= 0.5) return 'Moyenne';
  return 'Faible';
}

function confidenceClass(c: number): string {
  if (c >= 0.8) return 'is-high';
  if (c >= 0.5) return 'is-medium';
  return 'is-low';
}

export function SuggestionsPanel() {
  const suggestions = useWorkspaceStore(s => s.suggestions);
  const validated = useWorkspaceStore(s => s.validated);
  const rejectedIds = useWorkspaceStore(s => s.rejectedIds);
  const filterText = useWorkspaceStore(s => s.filterText);
  const setFilterText = useWorkspaceStore(s => s.setFilterText);
  const validate = useWorkspaceStore(s => s.validateSuggestion);
  const reject = useWorkspaceStore(s => s.rejectSuggestion);
  const validateAll = useWorkspaceStore(s => s.validateAll);
  const rejectAll = useWorkspaceStore(s => s.rejectAll);
  const minConfidence = useSettingsStore(s => s.minConfidence);

  const validatedCodes = useMemo(
    () => new Set(validated.map(v => v.code)),
    [validated]
  );

  const visible = useMemo(() => {
    const f = filterText.trim().toLowerCase();
    return suggestions.filter(s => {
      if (rejectedIds.has(s.id)) return false;
      if (validatedCodes.has(s.code)) return false;
      if (s.confidence < minConfidence) return false;
      if (!f) return true;
      return (
        s.code.toLowerCase().includes(f) ||
        s.label.toLowerCase().includes(f) ||
        s.matchedTerm.toLowerCase().includes(f)
      );
    });
  }, [suggestions, rejectedIds, validatedCodes, filterText, minConfidence]);

  return (
    <section className="panel panel--suggestions" aria-labelledby="sug-label">
      <div className="panel-head">
        <h2 id="sug-label" className="panel-title">
          <svg
            aria-hidden="true"
            width={12}
            height={12}
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M8 1a5 5 0 0 0-2.5 9.33V12h5v-1.67A5 5 0 0 0 8 1zM6.5 13v1.5h3V13h-3z" />
          </svg>
          <span className="panel-title-text">Suggestions</span>
        </h2>
      </div>
      <div className="suggestion-filter-row">
        <input
          type="search"
          className="suggestion-filter-inp"
          placeholder="Filtrer (code, libellé, terme repéré)"
          aria-label="Filtrer les suggestions"
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
        />
        <button
          type="button"
          className="ghost"
          onClick={() => setFilterText('')}
          disabled={!filterText}
        >
          Effacer filtre
        </button>
      </div>
      <div className="toolbar suggestion-bulk-toolbar">
        <button
          type="button"
          className="secondary"
          onClick={() => validateAll(visible)}
          disabled={visible.length === 0}
        >
          Valider filtrées
        </button>
        <button
          type="button"
          className="secondary"
          onClick={() => rejectAll(visible.map(v => v.id))}
          disabled={visible.length === 0}
        >
          Rejeter filtrées
        </button>
        <span className="hint suggestion-filter-count">
          {visible.length} affichée{visible.length > 1 ? 's' : ''}
        </span>
      </div>
      <div className="suggestions-root">
        {visible.length === 0 ? (
          <p className="empty">
            {suggestions.length === 0
              ? 'Saisissez un compte-rendu et cliquez sur Analyser pour obtenir des suggestions.'
              : 'Aucune suggestion ne correspond aux filtres actuels.'}
          </p>
        ) : (
          <ul className="suggestion-list" role="list">
            {visible.map(s => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                onValidate={() => validate(s)}
                onReject={() => reject(s.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

interface SuggestionCardProps {
  suggestion: AnalysisResult;
  onValidate: () => void;
  onReject: () => void;
}

function SuggestionCard({
  suggestion,
  onValidate,
  onReject,
}: SuggestionCardProps) {
  return (
    <li className="suggestion-card" role="listitem">
      <div className="suggestion-card-head">
        <strong className="suggestion-code">{suggestion.code}</strong>
        <span
          className={`suggestion-confidence ${confidenceClass(suggestion.confidence)}`}
        >
          {confidenceLabel(suggestion.confidence)} ·{' '}
          {Math.round(suggestion.confidence * 100)}%
        </span>
      </div>
      <p className="suggestion-label">{suggestion.label}</p>
      {suggestion.matchedTerm && (
        <p className="suggestion-term">
          Terme repéré : <em>{suggestion.matchedTerm}</em>
        </p>
      )}
      <div className="toolbar">
        <button type="button" className="primary" onClick={onValidate}>
          Valider
        </button>
        <button type="button" className="ghost" onClick={onReject}>
          Rejeter
        </button>
      </div>
    </li>
  );
}
