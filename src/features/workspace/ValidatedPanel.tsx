import { useState, type FormEvent } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { ExportBar } from './ExportBar';
import { useI18n } from '../../i18n';
import type { ValidatedDiagnostic } from '../../types/index';

export function ValidatedPanel() {
  const validated = useWorkspaceStore(s => s.validated);
  const removeValidated = useWorkspaceStore(s => s.removeValidated);
  const updateValidatedNote = useWorkspaceStore(s => s.updateValidatedNote);
  const addManualDiagnostic = useWorkspaceStore(s => s.addManualDiagnostic);
  const { t } = useI18n();
  const validatedCodes = new Set(validated.map(v => v.code));
  const hasValidated = validated.length > 0;

  return (
    <section
      className={`panel panel--validated ${hasValidated ? 'is-active' : 'is-pristine'}`}
      aria-labelledby="val-label"
    >
      <div className="panel-head">
        <h2 id="val-label" className="panel-title">
          <svg
            aria-hidden="true"
            width={12}
            height={12}
            viewBox="0 0 16 16"
            fill="currentColor"
          >
            <path d="M13.854 3.146a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 9.793l6.646-6.647a.5.5 0 0 1 .708 0z" />
          </svg>
          <span className="panel-title-text">{t('validated.title')}</span>
          {hasValidated && (
            <span className="panel-count" aria-hidden="true">
              {validated.length}
            </span>
          )}
        </h2>
      </div>
      {!hasValidated ? (
        <p className="empty">{t('validated.empty')}</p>
      ) : (
        <ul className="validated-list" role="list">
          {validated.map(v => (
            <ValidatedItem
              key={v.id}
              item={v}
              onRemove={() => removeValidated(v.id)}
              onNote={note => updateValidatedNote(v.id, note)}
            />
          ))}
        </ul>
      )}
      <ManualEntryForm
        onAdd={addManualDiagnostic}
        existingCodes={validatedCodes}
      />
      <ExportBar disabled={validated.length === 0} />
    </section>
  );
}

interface ValidatedItemProps {
  item: ValidatedDiagnostic;
  onRemove: () => void;
  onNote: (note: string) => void;
}

function ValidatedItem({ item, onRemove, onNote }: ValidatedItemProps) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(item.note ?? '');

  return (
    <li className="validated-item" role="listitem">
      <div className="validated-row">
        <strong className="validated-code">{item.code}</strong>
        <span
          className={`source-badge source-badge--${item.source ?? 'local'}`}
          title={
            item.source === 'api'
              ? t('results.sourceApiTitle')
              : t('results.sourceLocalTitle')
          }
        >
          {item.source === 'api'
            ? t('results.badgeIcd11')
            : t('results.badgeIcd10')}
        </span>
        <span className="validated-label">{item.label}</span>
        <div className="toolbar">
          <button
            type="button"
            className="ghost"
            onClick={() => setEditing(v => !v)}
            aria-pressed={editing}
          >
            {editing ? t('common.close') : t('validated.note')}
          </button>
          <button type="button" className="ghost" onClick={onRemove}>
            {t('common.remove')}
          </button>
        </div>
      </div>
      {editing && (
        <div className="validated-note-row">
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            onBlur={() => onNote(note)}
            placeholder={t('validated.notePlaceholder')}
            rows={2}
          />
        </div>
      )}
      {!editing && item.note && (
        <p className="validated-note-display">
          <em>{item.note}</em>
        </p>
      )}
    </li>
  );
}

interface ManualEntryFormProps {
  onAdd: (code: string, label: string) => void;
  existingCodes: Set<string>;
}

function ManualEntryForm({ onAdd, existingCodes }: ManualEntryFormProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');

  const trimCode = code.trim().toUpperCase();
  const trimLabel = label.trim();
  const duplicate = trimCode !== '' && existingCodes.has(trimCode);
  const canSubmit = trimCode !== '' && trimLabel !== '' && !duplicate;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onAdd(code, label);
    setCode('');
    setLabel('');
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        className="ghost manual-add-toggle"
        onClick={() => setOpen(true)}
      >
        {t('validated.addManual')}
      </button>
    );
  }

  return (
    <form className="manual-entry-form" onSubmit={handleSubmit} noValidate>
      <div className="manual-entry-row">
        <input
          type="text"
          className="manual-entry-code"
          placeholder={t('validated.codePlaceholder')}
          aria-label={t('validated.codeAria')}
          value={code}
          onChange={e => setCode(e.target.value)}
          autoFocus
          spellCheck={false}
        />
        <input
          type="text"
          className="manual-entry-label"
          placeholder={t('validated.labelPlaceholder')}
          aria-label={t('validated.labelAria')}
          value={label}
          onChange={e => setLabel(e.target.value)}
        />
      </div>
      {duplicate && (
        <p className="hint error" role="alert">
          {t('validated.duplicate')}
        </p>
      )}
      <div className="toolbar">
        <button type="submit" className="primary" disabled={!canSubmit}>
          {t('common.add')}
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setOpen(false);
            setCode('');
            setLabel('');
          }}
        >
          {t('common.cancel')}
        </button>
      </div>
    </form>
  );
}
