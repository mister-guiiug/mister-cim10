import { describe, expect, it } from 'vitest';
import type { ValidatedDiagnostic } from '../types/index';
import {
  buildClipboardList,
  buildCsvReport,
  buildJsonReport,
  buildTextReport,
} from './rapport';

const diag = (
  code: string,
  label: string,
  extra: Partial<ValidatedDiagnostic> = {}
): ValidatedDiagnostic => ({
  id: code,
  code,
  label,
  validatedAt: Date.UTC(2026, 10, 21, 9, 30),
  ...extra,
});

const simple = [
  diag('I10', 'Hypertension essentielle'),
  diag('E11.9', 'Diabète de type 2', { note: 'sous metformine' }),
];
const pmsi = [
  diag('I21.9', 'Infarctus aigu du myocarde', { role: 'dp' }),
  diag('E11.9', 'Diabète de type 2', { role: 'dr' }),
  diag('I10', 'Hypertension essentielle'),
];

const textes = {
  title: 'Rapport',
  validatedHeading: 'Diagnostics',
  sourceHeading: 'Compte-rendu',
  empty: '(vide)',
};

describe('sans DP ni DR, les exports sont ceux d’avant', () => {
  it('presse-papiers', () => {
    expect(buildClipboardList(simple)).toBe(
      'I10 — Hypertension essentielle\nE11.9 — Diabète de type 2 [sous metformine]'
    );
  });

  it('texte', () => {
    expect(buildTextReport('CR', simple, textes).split('\n')).toEqual([
      'Rapport',
      '',
      'Diagnostics',
      '  I10 — Hypertension essentielle',
      '  E11.9 — Diabète de type 2 [sous metformine]',
      '',
      'Compte-rendu',
      'CR',
    ]);
  });

  it('CSV : quatre colonnes, pas de rôle', () => {
    const csv = buildCsvReport(simple, 'code,libellé,note,validé_le', 'rôle');
    expect(csv.split('\n')[0]).toBe('code,libellé,note,validé_le');
  });

  it('JSON : pas de champ `role` inventé', () => {
    const json = JSON.parse(buildJsonReport('CR', simple));
    expect(json.validated[0]).not.toHaveProperty('role');
  });
});

describe('dans un résumé PMSI, chaque ligne porte son rôle', () => {
  it('presse-papiers et texte, sigle aligné', () => {
    expect(buildClipboardList(pmsi).split('\n')).toEqual([
      'DP  I21.9 — Infarctus aigu du myocarde',
      'DR  E11.9 — Diabète de type 2',
      'DAS I10 — Hypertension essentielle',
    ]);
    expect(buildTextReport('CR', pmsi, textes)).toContain(
      '  DAS I10 — Hypertension essentielle'
    );
  });

  it('CSV : le rôle en DERNIÈRE colonne, le code reste en première', () => {
    const lignes = buildCsvReport(
      pmsi,
      'code,libellé,note,validé_le',
      'rôle_pmsi'
    ).split('\n');
    expect(lignes[0]).toBe('code,libellé,note,validé_le,rôle_pmsi');
    expect(lignes[1]?.startsWith('I21.9,')).toBe(true);
    expect(lignes[1]?.endsWith(',DP')).toBe(true);
    expect(lignes[3]?.endsWith(',DAS')).toBe(true);
  });

  it('JSON : le rôle explicite, même pour un DAS par défaut', () => {
    const json = JSON.parse(buildJsonReport('CR', pmsi));
    expect(
      json.validated.map((v: ValidatedDiagnostic) => `${v.role}:${v.code}`)
    ).toEqual(['dp:I21.9', 'dr:E11.9', 'das:I10']);
  });
});
