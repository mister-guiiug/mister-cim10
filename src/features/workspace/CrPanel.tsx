import { useRef, useEffect, type FormEvent } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useDialog } from '../../hooks/useDialog';
import { useI18n } from '../../i18n';

interface CrPanelProps {
  onAnalyze: () => void;
}

export function CrPanel({ onAnalyze }: CrPanelProps) {
  const crText = useWorkspaceStore(s => s.crText);
  const setCrText = useWorkspaceStore(s => s.setCrText);
  const isAnalyzing = useWorkspaceStore(s => s.isAnalyzing);
  const analyzeError = useWorkspaceStore(s => s.analyzeError);
  const resetSession = useWorkspaceStore(s => s.resetSession);
  const highlightedMatchedTerm = useWorkspaceStore(
    s => s.highlightedMatchedTerm
  );
  const dialog = useDialog();
  const { t } = useI18n();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!highlightedMatchedTerm || !textareaRef.current) return;
    const ta = textareaRef.current;
    const idx = ta.value
      .toLowerCase()
      .indexOf(highlightedMatchedTerm.toLowerCase());
    if (idx === -1) return;
    ta.focus();
    ta.setSelectionRange(idx, idx + highlightedMatchedTerm.length);
  }, [highlightedMatchedTerm]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onAnalyze();
  };

  const handleNewSession = async () => {
    if (await dialog.confirm(t('report.resetConfirm'))) {
      resetSession();
    }
  };

  return (
    <section className="panel panel--cr" aria-labelledby="cr-label">
      <div className="panel-head">
        <h2 id="cr-label" className="panel-title">
          <svg
            aria-hidden="true"
            width={12}
            height={12}
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M4 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H4zm0 1h8a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm1 2v1h6V4H5zm0 2.5v1h6v-1H5zm0 2.5v1h4v-1H5z" />
          </svg>
          <span className="panel-title-text">{t('report.title')}</span>
        </h2>
      </div>
      <form onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className="cr"
          name="cr"
          placeholder={t('report.placeholder')}
          aria-label={t('report.ariaLabel')}
          value={crText}
          onChange={e => setCrText(e.target.value)}
        />
        <div className="toolbar">
          <button
            type="submit"
            className="primary"
            disabled={isAnalyzing || !crText.trim()}
          >
            {isAnalyzing ? t('report.analyzing') : t('common.analyze')}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => setCrText('')}
            disabled={!crText}
          >
            {t('report.clear')}
          </button>
          <button type="button" className="ghost" onClick={handleNewSession}>
            {t('report.newSession')}
          </button>
        </div>
      </form>
      <p className="hint">{t('report.dictationHint')}</p>
      {analyzeError && (
        <p className="hint error" role="alert">
          {analyzeError}
        </p>
      )}
    </section>
  );
}
