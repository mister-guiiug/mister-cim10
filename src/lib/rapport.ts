import { toCsv } from '@mister-guiiug/dev-pwa-config/csv';
import type { ValidatedDiagnostic } from '../types/index';
import { estResumePmsi, roleEffectif, SIGLE_ROLE } from './pmsi';

/**
 * LES EXPORTS DES DIAGNOSTICS RETENUS — texte, CSV, JSON, presse-papiers.
 *
 * Sortis de `ExportBar` le 21/11/2026, avec l'arrivée des rôles PMSI : quatre
 * formats devaient dire la même chose (le rôle, quand la liste est un résumé
 * PMSI) et aucun n'était testé. Ce sont des fonctions pures : elles ne lisent
 * ni l'état ni les réglages.
 *
 * LES RÔLES NE PARAISSENT QUE DANS UN RÉSUMÉ PMSI, c'est-à-dire dès qu'un DP
 * ou un DR est désigné (cf. `estResumePmsi`). Sans cela, les exports restent
 * octet pour octet ceux d'avant : un médecin qui liste des codes n'a pas à
 * recevoir une colonne « DAS » sur chaque ligne.
 */

/** Libellés localisés du rapport texte (le corps — codes/notes — reste des données). */
export interface TextReportStrings {
  title: string;
  validatedHeading: string;
  sourceHeading: string;
  empty: string;
}

/** Une ligne de diagnostic : « I10 — Hypertension [note] », préfixée du rôle en PMSI. */
function ligne(v: ValidatedDiagnostic, pmsi: boolean): string {
  const role = pmsi ? `${SIGLE_ROLE[roleEffectif(v)].padEnd(4)}` : '';
  const note = v.note ? ` [${v.note}]` : '';
  return `${role}${v.code} — ${v.label}${note}`;
}

export function buildTextReport(
  crText: string,
  validated: readonly ValidatedDiagnostic[],
  s: TextReportStrings
): string {
  const pmsi = estResumePmsi(validated);
  const lines: string[] = [
    s.title,
    '',
    s.validatedHeading,
    ...validated.map(v => `  ${ligne(v, pmsi)}`),
    '',
    s.sourceHeading,
    crText || s.empty,
  ];
  return lines.join('\n');
}

/** La liste copiée dans le presse-papiers : une ligne par diagnostic. */
export function buildClipboardList(
  validated: readonly ValidatedDiagnostic[]
): string {
  const pmsi = estResumePmsi(validated);
  return validated.map(v => ligne(v, pmsi)).join('\n');
}

/**
 * CSV via le socle, dialecte `unix` (virgule + LF, sans BOM) : celui que
 * produisait l'échappement maison. Les libellés de colonnes restent i18n
 * (clé `export.csvHeader`, quatre segments séparés par des virgules).
 *
 * Le rôle PMSI vient EN DERNIÈRE colonne : un tableur ou un script qui lit
 * les colonnes par leur rang continue de trouver le code en première.
 */
export function buildCsvReport(
  validated: readonly ValidatedDiagnostic[],
  header: string,
  roleHeader: string
): string {
  const [codeH, labelH, noteH, dateH] = header.split(',');
  const pmsi = estResumePmsi(validated);
  return toCsv([...validated], {
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
      ...(pmsi
        ? [
            {
              key: 'role' as const,
              header: roleHeader,
              map: (_value: unknown, row: ValidatedDiagnostic) =>
                SIGLE_ROLE[roleEffectif(row)],
            },
          ]
        : []),
    ],
  });
}

export function buildJsonReport(
  crText: string,
  validated: readonly ValidatedDiagnostic[]
): string {
  const pmsi = estResumePmsi(validated);
  return JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      compteRendu: crText,
      // En PMSI, chaque diagnostic porte son rôle EXPLICITE : un DAS par
      // défaut n'a pas de champ `role` en mémoire, et un lecteur du fichier
      // n'a pas à connaître cette convention.
      validated: pmsi
        ? validated.map(v => ({ ...v, role: roleEffectif(v) }))
        : validated,
    },
    null,
    2
  );
}
