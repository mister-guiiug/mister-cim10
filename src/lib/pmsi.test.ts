import { describe, expect, it } from 'vitest';
import type { ValidatedDiagnostic } from '../types/index';
import { attribuerRole, estResumePmsi, roleEffectif } from './pmsi';

const diag = (
  code: string,
  role?: ValidatedDiagnostic['role']
): ValidatedDiagnostic => ({
  id: code,
  code,
  label: code,
  validatedAt: 0,
  ...(role ? { role } : {}),
});

const resume = (liste: ValidatedDiagnostic[] | null) =>
  liste?.map(v => `${roleEffectif(v)}:${v.code}`).join(' ');

describe('le rôle par défaut', () => {
  it('un diagnostic sans rôle est un DAS — jamais un DP d’office', () => {
    expect(roleEffectif(diag('I10'))).toBe('das');
    expect(estResumePmsi([diag('I10'), diag('E11.9')])).toBe(false);
  });

  it('une valeur illisible (stockage ancien ou trafiqué) vaut DAS', () => {
    const v = {
      ...diag('I10'),
      role: 'chef',
    } as unknown as ValidatedDiagnostic;
    expect(roleEffectif(v)).toBe('das');
  });

  it('désigner un DP fait de la liste un résumé PMSI', () => {
    expect(estResumePmsi([diag('I10'), diag('E11.9', 'dp')])).toBe(true);
  });
});

describe('attribuerRole', () => {
  const liste = [diag('R07.4'), diag('I10'), diag('I21.9'), diag('E11.9')];

  it('le DP passe en tête', () => {
    expect(resume(attribuerRole(liste, 'I21.9', 'dp'))).toBe(
      'dp:I21.9 das:R07.4 das:I10 das:E11.9'
    );
  });

  it('un seul DP : en désigner un autre rétrograde l’ancien en DAS', () => {
    const un = attribuerRole(liste, 'I21.9', 'dp')!;
    expect(resume(attribuerRole(un, 'E11.9', 'dp'))).toBe(
      'dp:E11.9 das:I21.9 das:R07.4 das:I10'
    );
  });

  it('le DR se place juste après le DP, ou en tête sans DP', () => {
    const avecDp = attribuerRole(liste, 'I21.9', 'dp')!;
    expect(resume(attribuerRole(avecDp, 'E11.9', 'dr'))).toBe(
      'dp:I21.9 dr:E11.9 das:R07.4 das:I10'
    );
    expect(resume(attribuerRole(liste, 'E11.9', 'dr'))).toBe(
      'dr:E11.9 das:R07.4 das:I10 das:I21.9'
    );
  });

  it('un seul DR ; l’ancien, rétrogradé, garde sa place', () => {
    let l = attribuerRole(liste, 'I21.9', 'dp')!;
    l = attribuerRole(l, 'I10', 'dr')!;
    expect(resume(l)).toBe('dp:I21.9 dr:I10 das:R07.4 das:E11.9');
    expect(resume(attribuerRole(l, 'E11.9', 'dr'))).toBe(
      'dp:I21.9 dr:E11.9 das:I10 das:R07.4'
    );
  });

  it('repasser en DAS ne déplace rien', () => {
    const l = attribuerRole(liste, 'I21.9', 'dp')!;
    expect(resume(attribuerRole(l, 'I21.9', 'das'))).toBe(
      'das:I21.9 das:R07.4 das:I10 das:E11.9'
    );
  });

  it('un geste qui ne change rien rend null — rien à mettre dans l’historique', () => {
    expect(attribuerRole(liste, 'I10', 'das')).toBeNull();
    expect(attribuerRole(liste, 'inconnu', 'dp')).toBeNull();
    const l = attribuerRole(liste, 'I10', 'dp')!;
    expect(attribuerRole(l, 'I10', 'dp')).toBeNull();
  });

  it('ne modifie pas la liste reçue', () => {
    const copie = structuredClone(liste);
    attribuerRole(liste, 'I21.9', 'dp');
    expect(liste).toEqual(copie);
  });
});
