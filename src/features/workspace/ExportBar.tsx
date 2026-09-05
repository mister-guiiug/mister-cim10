import { useState } from 'react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { dateSlug, downloadBlob } from '@mister-guiiug/dev-pwa-config/download';
import { toCsv } from '@mister-guiiug/dev-pwa-config/csv';
import { useI18n } from '../../i18n';
import type { ValidatedDiagnostic } from '../../types/index';

interface ExportBarProps {
  disabled: boolean;
}

/** Libellés localisés du rapport texte (le corps — codes/notes — reste des données). */
interface TextReportStrings {
  title: string;
  validatedHeading: string;
  sourceHeading: string;
  empty: string;
}

function buildTextReport(
  crText: string,
  validated: ValidatedDiagnostic[],
  s: TextReportStrings
): string {
  const lines: string[] = [
    s.title,
    '',
    s.validatedHeading,
    ...validated.map(v =>
      v.note
        ? `  ${v.code} — ${v.label} [${v.note}]`
        : `  ${v.code} — ${v.label}`
    ),
    '',
    s.sourceHeading,
    crText || s.empty,
  ];
  return lines.join('\n');
}

/**
 * CSV via le socle, dialecte `unix` (virgule + LF, sans BOM) : celui que
 * produisait l'échappement maison. Les libellés de colonnes restent i18n
 * (clé `export.csvHeader`, quatre segments séparés par des virgules).
 */
function buildCsvReport(
  validated: ValidatedDiagnostic[],
  header: string
): string {
  const [codeH, labelH, noteH, dateH] = header.split(',');
  return toCsv(validated, {
    dialect: 'unix',
    columns: [
      { key: 'code', header: codeH },
      { key: 'label', header: labelH },
      { key: 'note', header: noteH },
      {
        key: 'validatedAt',
        header: dateH,
        // `Date` : sérialisée en ISO 8601 par le socle, comme avant.
        map: (_value, row) => new Date(row.validatedAt),
      },
    ],
  });
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
  const { t, locale } = useI18n();
  const [copied, setCopied] = useState(false);

  const textReportStrings = (): TextReportStrings => ({
    title: t('export.reportTitle', {
      date: new Date().toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-GB'),
    }),
    validatedHeading: t('export.reportValidatedHeading'),
    sourceHeading: t('export.reportSourceHeading'),
    empty: t('export.reportEmpty'),
  });

  const copyList = async () => {
    const text = validated
      .map(v => `${v.code} — ${v.label}${v.note ? ` [${v.note}]` : ''}`)
      .join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  };

  const exportTxt = () => {
    const blob = new Blob(
      [buildTextReport(crText, validated, textReportStrings())],
      { type: 'text/plain;charset=utf-8' }
    );
    downloadBlob(blob, `cim10-${dateSlug()}.txt`);
  };

  const exportCsv = () => {
    const blob = new Blob([buildCsvReport(validated, t('export.csvHeader'))], {
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
    const subject = encodeURIComponent(t('export.emailSubject'));
    const body = encodeURIComponent(
      buildTextReport(crText, validated, textReportStrings())
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const exportShare = async () => {
    if (!navigator.share) {
      exportEmail();
      return;
    }
    try {
      await navigator.share({
        title: t('export.shareDocTitle'),
        text: buildTextReport(crText, validated, textReportStrings()),
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
        <span className="export-block-label">{t('export.clipboard')}</span>
        <div className="toolbar export-row export-row--panel">
          <button
            type="button"
            className={copied ? 'primary' : 'secondary'}
            onClick={copyList}
            disabled={disabled}
            aria-live="polite"
          >
            {copied ? t('export.copied') : t('export.copyList')}
          </button>
        </div>
      </div>
      <div className="export-block">
        <span className="export-block-label">{t('export.download')}</span>
        <div className="toolbar export-row export-row--panel">
          <button
            type="button"
            className="secondary"
            onClick={exportTxt}
            disabled={disabled}
          >
            {t('export.txt')}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={exportCsv}
            disabled={disabled}
          >
            {t('export.csv')}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={exportJson}
            disabled={disabled}
          >
            {t('export.json')}
          </button>
          <button
            type="button"
            className="secondary"
            onClick={print}
            disabled={disabled}
          >
            {t('export.printPdf')}
          </button>
        </div>
      </div>
      <div className="export-block">
        <span className="export-block-label">{t('export.sendShare')}</span>
        <div className="toolbar export-row export-row--panel">
          <button
            type="button"
            className="secondary"
            onClick={exportEmail}
            disabled={disabled}
            title={t('export.emailTitle')}
          >
            {t('common.email')}
          </button>
          {shareSupported && (
            <button
              type="button"
              className="secondary"
              onClick={exportShare}
              disabled={disabled}
              title={t('export.shareTitle')}
            >
              {t('common.share')}
            </button>
          )}
        </div>
      </div>
      <p className="hint export-hint">{t('export.hint')}</p>
    </div>
  );
}
