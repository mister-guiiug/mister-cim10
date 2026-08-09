import { useMemo, useState } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useSettingsStore } from '../../store/settingsStore';
import { getFamily } from '../../lib/icd-hierarchy';
import { useI18n } from '../../i18n';
import type { AnalysisResult, ICD10Code } from '../../types/index';

type ConfidenceLevel = 'high' | 'medium' | 'low';

function confidenceLevel(c: number): ConfidenceLevel {
  if (c >= 0.8) return 'high';
  if (c >= 0.5) return 'medium';
  return 'low';
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
  const setHighlightedMatchedTerm = useWorkspaceStore(
    s => s.setHighlightedMatchedTerm
  );
  const addManualDiagnostic = useWorkspaceStore(s => s.addManualDiagnostic);
  const isAnalyzing = useWorkspaceStore(s => s.isAnalyzing);
  const minConfidence = useSettingsStore(s => s.minConfidence);
  const { t } = useI18n();

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

  const hasSuggestions = suggestions.length > 0;
  const pristine = !hasSuggestions && !isAnalyzing;

  return (
    <section
      className={`panel panel--suggestions ${pristine ? 'is-pristine' : 'is-active'}`}
      aria-labelledby="sug-label"
    >
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
          <span className="panel-title-text">{t('results.title')}</span>
          {hasSuggestions && (
            <span className="panel-count" aria-hidden="true">
              {visible.length}
            </span>
          )}
        </h2>
      </div>
      {hasSuggestions && (
        <>
          <div className="suggestion-filter-row">
            <input
              type="search"
              className="suggestion-filter-inp"
              placeholder={t('results.filterPlaceholder')}
              aria-label={t('results.filterAria')}
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
            />
            <button
              type="button"
              className="ghost"
              onClick={() => setFilterText('')}
              disabled={!filterText}
            >
              {t('results.clearFilter')}
            </button>
          </div>
          <div className="toolbar suggestion-bulk-toolbar">
            <button
              type="button"
              className="secondary"
              onClick={() => validateAll(visible)}
              disabled={visible.length === 0}
            >
              {t('results.validateFiltered')}
            </button>
            <button
              type="button"
              className="secondary"
              onClick={() => rejectAll(visible.map(v => v.id))}
              disabled={visible.length === 0}
            >
              {t('results.rejectFiltered')}
            </button>
            <span className="hint suggestion-filter-count">
              {visible.length > 1
                ? t('results.shownMany', { count: visible.length })
                : t('results.shownOne', { count: visible.length })}
            </span>
          </div>
        </>
      )}
      <div className="suggestions-root">
        {visible.length === 0 ? (
          isAnalyzing ? (
            <p className="empty empty--analyzing">
              <span className="analyzing-spinner" aria-hidden="true" />
              {t('results.analyzing')}
            </p>
          ) : (
            <p className="empty">
              {suggestions.length === 0
                ? t('results.emptyPristine')
                : t('results.emptyFiltered')}
            </p>
          )
        ) : (
          <ul className="suggestion-list" role="list">
            {visible.map(s => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                validatedCodes={validatedCodes}
                onValidate={() => validate(s)}
                onReject={() => reject(s.id)}
                onHighlight={() => setHighlightedMatchedTerm(s.matchedTerm)}
                onValidateRelated={(code, label) =>
                  addManualDiagnostic(code, label)
                }
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
  validatedCodes: Set<string>;
  onValidate: () => void;
  onReject: () => void;
  onHighlight: () => void;
  onValidateRelated: (code: string, label: string) => void;
}

function SuggestionCard({
  suggestion,
  validatedCodes,
  onValidate,
  onReject,
  onHighlight,
  onValidateRelated,
}: SuggestionCardProps) {
  const { t } = useI18n();
  const [comparing, setComparing] = useState(false);
  const family = useMemo(
    () => (comparing ? getFamily(suggestion.code) : null),
    [comparing, suggestion.code]
  );
  const hasFamily =
    family !== null && (family.parent !== null || family.siblings.length > 0);
  const pct = Math.round(suggestion.confidence * 100);
  const level = confidenceLevel(suggestion.confidence);
  const levelLabel = t(`results.confidence.${level}`);

  return (
    <li className="suggestion-card" role="listitem">
      <div className="suggestion-card-head">
        <strong className="suggestion-code">{suggestion.code}</strong>
        <span
          className={`source-badge source-badge--${suggestion.source ?? 'local'}`}
          title={
            suggestion.source === 'api'
              ? t('results.sourceApiTitle')
              : t('results.sourceLocalTitle')
          }
        >
          {suggestion.source === 'api'
            ? t('results.badgeIcd11')
            : t('results.badgeIcd10')}
        </span>
      </div>
      <p className="suggestion-label">{suggestion.label}</p>
      <div className={`confidence-meter is-${level}`}>
        <span
          className="confidence-meter-track"
          role="img"
          aria-label={t('results.confidenceAria', {
            level: levelLabel.toLowerCase(),
            pct,
          })}
        >
          <span
            className="confidence-meter-fill"
            style={{ width: `${pct}%` }}
          />
        </span>
        <span className="confidence-meter-readout">
          <span className="confidence-meter-level">{levelLabel}</span>
          <span className="confidence-meter-pct">{pct} %</span>
        </span>
      </div>
      {suggestion.matchedTerm && (
        <p className="suggestion-term">
          {t('results.matchedTerm')}{' '}
          <button
            type="button"
            className="suggestion-term-link"
            onClick={onHighlight}
            title={t('results.matchedTermTitle')}
          >
            {suggestion.matchedTerm}
          </button>
        </p>
      )}
      <div className="toolbar">
        <button type="button" className="primary" onClick={onValidate}>
          {t('common.validate')}
        </button>
        <button type="button" className="ghost" onClick={onReject}>
          {t('common.reject')}
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => setComparing(v => !v)}
          aria-expanded={comparing}
          aria-controls={`compare-${suggestion.id}`}
          title={t('results.compareTitle')}
        >
          {comparing ? t('common.close') : t('results.compare')}
        </button>
      </div>
      {comparing && family && (
        <CompareFamily
          id={`compare-${suggestion.id}`}
          family={family}
          validatedCodes={validatedCodes}
          hasFamily={hasFamily}
          onValidate={onValidateRelated}
        />
      )}
    </li>
  );
}

interface CompareFamilyProps {
  id: string;
  family: { parent: ICD10Code | null; siblings: ICD10Code[] };
  validatedCodes: Set<string>;
  hasFamily: boolean;
  onValidate: (code: string, label: string) => void;
}

function CompareFamily({
  id,
  family,
  validatedCodes,
  hasFamily,
  onValidate,
}: CompareFamilyProps) {
  const { t } = useI18n();
  if (!hasFamily) {
    return (
      <div id={id} className="suggestion-compare-panel">
        <p className="suggestion-compare-empty">{t('results.compareEmpty')}</p>
      </div>
    );
  }
  return (
    <div id={id} className="suggestion-compare-panel">
      {family.parent && (
        <CompareRow
          entry={family.parent}
          variant="parent"
          alreadyValidated={validatedCodes.has(family.parent.code)}
          onValidate={onValidate}
        />
      )}
      {family.siblings.length > 0 && (
        <ul className="suggestion-compare-siblings" role="list">
          {family.siblings.map(sib => (
            <li key={sib.code}>
              <CompareRow
                entry={sib}
                variant="sibling"
                alreadyValidated={validatedCodes.has(sib.code)}
                onValidate={onValidate}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface CompareRowProps {
  entry: ICD10Code;
  variant: 'parent' | 'sibling';
  alreadyValidated: boolean;
  onValidate: (code: string, label: string) => void;
}

function CompareRow({
  entry,
  variant,
  alreadyValidated,
  onValidate,
}: CompareRowProps) {
  const { t } = useI18n();
  return (
    <div
      className={`suggestion-compare-row suggestion-compare-row--${variant}`}
    >
      <span className="suggestion-compare-tag">
        {variant === 'parent' ? t('results.parent') : t('results.related')}
      </span>
      <strong className="suggestion-compare-code">{entry.code}</strong>
      <span className="suggestion-compare-label">{entry.label}</span>
      <button
        type="button"
        className="ghost"
        onClick={() => onValidate(entry.code, entry.label)}
        disabled={alreadyValidated}
        title={
          alreadyValidated
            ? t('results.alreadyValidatedTitle')
            : t('results.validateCodeTitle')
        }
      >
        {alreadyValidated ? t('common.validated') : t('common.validate')}
      </button>
    </div>
  );
}
