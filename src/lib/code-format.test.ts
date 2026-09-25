import { describe, expect, it } from 'vitest';
import { icdEntries } from '../icd10-data.js';
import type { ICD10Code } from '../types/index';
import { normaliserCode, verifierCode, type VerdictCode } from './code-format';

/**
 * CE QUE CE FICHIER TIENT. Deux promesses de sens opposé, et il faut les deux :
 * ne RIEN laisser passer qui n'ait pas la forme d'un code — c'est ce qui part à
 * l'export —, et ne RIEN refuser de légitime — le référentiel embarqué est un
 * échantillon, pas la CIM-10.
 */

const REFERENTIEL = icdEntries as ICD10Code[];

function codeValide(verdict: VerdictCode): string | null {
  return verdict.statut === 'valide' ? verdict.code : null;
}

describe('normalisation : une façon d’écrire n’est pas une erreur', () => {
  it.each([
    ['e11.9', 'E11.9'],
    ['  E11.9  ', 'E11.9'],
    ['E 11 . 9', 'E11.9'],
    ['E11,9', 'E11.9'],
    ['a000', 'A00.0'],
    ['e1165', 'E11.65'],
    ['k8020', 'K80.20'],
    ['I10', 'I10'],
    ['I10.', 'I10'],
    ['r53+0', 'R53.+0'],
    ['g838+0', 'G83.8+0'],
    ['A17.0†', 'A17.0'],
    ['G01*', 'G01'],
  ])('« %s » → %s', (saisie, attendu) => {
    expect(normaliserCode(saisie)).toBe(attendu);
    expect(codeValide(verifierCode(saisie))).toBe(attendu);
  });
});

describe('ne rien refuser de légitime', () => {
  it('accepte CHAQUE code du référentiel embarqué, et le reconnaît', () => {
    for (const entree of REFERENTIEL) {
      const verdict = verifierCode(entree.code);
      expect(verdict, entree.code).toMatchObject({
        statut: 'valide',
        code: entree.code,
      });
      if (verdict.statut === 'valide') {
        expect(verdict.reference?.code).toBe(entree.code);
      }
    }
  });

  it('accepte les formes des extensions ATIH, « + » de remplissage compris', () => {
    for (const code of ['R53.+0', 'G83.8+0', 'U07.14', 'E66.00', 'Z75.800']) {
      expect(verifierCode(code).statut, code).toBe('valide');
    }
  });

  it('un code bien formé mais inconnu n’est pas bloqué : il est signalé', () => {
    const verdict = verifierCode('E11.8');
    expect(verdict).toMatchObject({
      statut: 'valide',
      code: 'E11.8',
      reference: null,
    });
    // Ses voisins de catégorie sont proposés — et pas lui-même.
    if (verdict.statut === 'valide') {
      const proches = verdict.proches.map(p => p.code);
      expect(proches).toEqual(['E11.65', 'E11.9']);
    }
  });

  it('propose les codes de la catégorie même quand on n’a tapé qu’elle', () => {
    const verdict = verifierCode('J44');
    expect(verdict.statut === 'valide' && verdict.reference).toBeNull();
    expect(
      verdict.statut === 'valide' ? verdict.proches.map(p => p.code) : []
    ).toEqual(['J44.1', 'J44.9']);
  });

  it('ne propose rien quand la catégorie est absente du référentiel', () => {
    const verdict = verifierCode('Q99.9');
    expect(verdict).toMatchObject({ statut: 'valide', proches: [] });
  });
});

describe('ne rien laisser passer qui n’ait pas la forme d’un code', () => {
  it.each([
    'E1',
    '11.9',
    'EE11',
    'E11.-',
    'E11.9A',
    'E11.1234',
    'I1O',
    'diabète',
    'E11.9 diabète',
    'A00-B99',
    'E11..9',
    'E11.9+',
    'E11.++0',
  ])('refuse « %s »', saisie => {
    expect(verifierCode(saisie).statut).toBe('invalide');
  });

  it('rend « vide » pour une saisie blanche, pas « invalide »', () => {
    expect(verifierCode('   ').statut).toBe('vide');
    expect(verifierCode('').statut).toBe('vide');
  });
});

describe('CIM-11 : un code OMS se corrige dans SA classification', () => {
  it.each([
    'BA00',
    '5A11',
    'CA40.Z',
    'NA02.1',
    'XN6D',
    'BA00&XN6D',
    '2C6Z/XH0N',
  ])('accepte « %s »', code => {
    expect(verifierCode(code, 'cim11')).toEqual({
      statut: 'valide',
      code,
      reference: null,
      proches: [],
    });
  });

  it('normalise sans inventer de point', () => {
    expect(codeValide(verifierCode(' ba00 ', 'cim11'))).toBe('BA00');
    expect(codeValide(verifierCode('ca40,z', 'cim11'))).toBe('CA40.Z');
  });

  it('refuse une forme CIM-10, et une lettre I ou O', () => {
    expect(verifierCode('E11.9', 'cim11').statut).toBe('invalide');
    expect(verifierCode('BA0O', 'cim11').statut).toBe('invalide');
    expect(verifierCode('1I00', 'cim11').statut).toBe('invalide');
  });

  it('et la CIM-10 refuse une forme CIM-11', () => {
    expect(verifierCode('BA00').statut).toBe('invalide');
  });
});
