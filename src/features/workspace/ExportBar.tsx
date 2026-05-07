import { useWorkspaceStore } from '../../store/workspaceStore';
import { dateSlug, downloadBlob } from '../../lib/storage';
import type { ValidatedDiagnostic } from '../../types/index';

interface ExportBarProps {
  disabled: boolean;
}

function buildTextReport(
  crText: string,
  validated: ValidatedDiagnostic[]
): string {
  const date = new Date().toLocaleString('fr-FR');
  const lines: string[] = [
    `Compte-rendu — Mister CIM-10 — ${date}`,
    '',
    'Diagnostics retenus :',
    ...validated.map(v =>
      v.note
        ? `  ${v.code} — ${v.label} [${v.note}]`
        : `  ${v.code} — ${v.label}`
    ),
    '',
    'Texte source :',
    crText || '(vide)',
  ];
  return lines.join('\n');
}

function buildCsvReport(validated: ValidatedDiagnostic[]): string {
  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const header = 'code,libellé,note,validé_le';
  const rows = validated.map(v =>
    [
      escape(v.code),
      escape(v.label),
      escape(v.note ?? ''),
      escape(new Date(v.validatedAt).toISOString()),
    ].join(',')
  );
  return [header, ...rows].join('\n');
}

function buildJsonReport(
  crText: string,
  validated: ValidatedDiagnostic[]
): string {
  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      compteRendu: crText,
      validated,
    },
    null,
    2
  );
}

export function ExportBar({ disabled }: ExportBarProps) {
  const crText = useWorkspaceStore(s => s.crText);
  const validated = useWorkspaceStore(s => s.validated);

  const exportTxt = () => {
    const blob = new Blob([buildTextReport(crText, validated)], {
      type: 'text/plain;charset=utf-8',
    });
    downloadBlob(blob, `cim10-${dateSlug()}.txt`);
  };

  const exportCsv = () => {
    const blob = new Blob([buildCsvReport(validated)], {
      type: 'text/csv;charset=utf-8',
    });
    downloadBlob(blob, `cim10-${dateSlug()}.csv`);
  };

  const exportJson = () => {
    const blob = new Blob([buildJsonReport(crText, validated)], {
      type: 'application/json',
    });
    downloadBlob(blob, `cim10-${dateSlug()}.json`);
  };

  const exportEmail = () => {
    const subject = encodeURIComponent('Mister CIM-10 — diagnostics');
    const body = encodeURIComponent(buildTextReport(crText, validated));
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const exportShare = async () => {
    if (!navigator.share) {
      exportEmail();
      return;
    }
    try {
      await navigator.share({
        title: 'Mister CIM-10 — diagnostics',
        text: buildTextReport(crText, validated),
      });
    } catch {
      /* user cancelled */
    }
  };

  const print = () => window.print();

  const shareSupported =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  return (
    <div className="export-blocks">
      <div className="export-block">
        <span className="export-block-label">Télécharger</span>
        <div className="toolbar export-row export-row--panel">
          <button
            type="button"
            className="secondary"
            onClick={exportTxt}
            disabled={disabled}
          >
            Texte (.txt)
          </button>
          <button
            type="button"
            className="secondary"
            onClick={exportCsv}
            disabled={disabled}
          >
            Tableur (.csv)
          </button>
          <button
            type="button"
            className="secondary"
            onClick={exportJson}
            disabled={disabled}
          >
            JSON
          </button>
          <button
            type="button"
            className="secondary"
            onClick={print}
            disabled={disabled}
          >
            Imprimer / PDF
          </button>
        </div>
      </div>
      <div className="export-block">
        <span className="export-block-label">Envoyer / partager</span>
        <div className="toolbar export-row export-row--panel">
          <button
            type="button"
            className="secondary"
            onClick={exportEmail}
            disabled={disabled}
            title="Ouvre votre messagerie avec un résumé texte"
          >
            E-mail
          </button>
          {shareSupported && (
            <button
              type="button"
              className="secondary"
              onClick={exportShare}
              disabled={disabled}
              title="Menu Partager : envoi d'un fichier texte ou du contenu"
            >
              Partager
            </button>
          )}
        </div>
      </div>
      <p className="hint export-hint">
        <strong>Texte (.txt)</strong> : fichier lisible (date, diagnostics,
        compte-rendu). <strong>JSON</strong> : données structurées avec
        annotations. <strong>E-mail / Partager</strong> : même contenu sous
        forme de texte simple.
      </p>
    </div>
  );
}
