import { useState, type FormEvent } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { ExportBar } from './ExportBar';
import type { ValidatedDiagnostic } from '../../types/index';

export function ValidatedPanel() {
  const validated = useWorkspaceStore(s => s.validated);
  const removeValidated = useWorkspaceStore(s => s.removeValidated);
  const updateValidatedNote = useWorkspaceStore(s => s.updateValidatedNote);
  const addManualDiagnostic = useWorkspaceStore(s => s.addManualDiagnostic);
  const validatedCodes = new Set(validated.map(v => v.code));

  return (
    <section className="panel panel--validated" aria-labelledby="val-label">
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
          <span className="panel-title-text">Diagnostics retenus</span>
        </h2>
      </div>
      {validated.length === 0 ? (
        <p className="empty">Aucun diagnostic validé pour l’instant.</p>
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
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(item.note ?? '');

  return (
    <li className="validated-item" role="listitem">
      <div className="validated-row">
        <strong className="validated-code">{item.code}</strong>
        <span className="validated-label">{item.label}</span>
        <div className="toolbar">
          <button
            type="button"
            className="ghost"
            onClick={() => setEditing(v => !v)}
            aria-pressed={editing}
          >
            {editing ? 'Fermer' : 'Note'}
          </button>
          <button type="button" className="ghost" onClick={onRemove}>
            Retirer
          </button>
        </div>
      </div>
      {editing && (
        <div className="validated-note-row">
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            onBlur={() => onNote(note)}
            placeholder="Note libre…"
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
        + Ajouter un code manuellement
      </button>
    );
  }

  return (
    <form className="manual-entry-form" onSubmit={handleSubmit} noValidate>
      <div className="manual-entry-row">
        <input
          type="text"
          className="manual-entry-code"
          placeholder="Code (ex. I10)"
          aria-label="Code CIM-10"
          value={code}
          onChange={e => setCode(e.target.value)}
          autoFocus
          spellCheck={false}
        />
        <input
          type="text"
          className="manual-entry-label"
          placeholder="Libellé libre"
          aria-label="Libellé du diagnostic"
          value={label}
          onChange={e => setLabel(e.target.value)}
        />
      </div>
      {duplicate && (
        <p className="hint error" role="alert">
          Ce code est déjà dans les diagnostics retenus.
        </p>
      )}
      <div className="toolbar">
        <button type="submit" className="primary" disabled={!canSubmit}>
          Ajouter
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
          Annuler
        </button>
      </div>
    </form>
  );
}
