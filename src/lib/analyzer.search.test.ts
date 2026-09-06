import { describe, expect, it } from 'vitest';
import { searchIcdCodes, suggestFromText } from './analyzer';

/**
 * CE QUE CE FICHIER TIENT. `suggestFromText` part du compte-rendu : elle ne
 * peut proposer que ce que le texte contient. `searchIcdCodes` répond à
 * l'autre besoin — coter un terme ABSENT du compte-rendu — et c'est la
 * différence, plus que la mécanique, qu'il faut figer : les deux partagent le
 * même moteur de trigrammes, elles ne doivent pas partager le même résultat.
 */

const codes = (query: string) => searchIcdCodes(query).map(h => h.code);

describe('chercher un code par son libellé', () => {
  it('trouve les diabètes sur « diabete », que `suggestFromText` ne sort pas', () => {
    // Le besoin, en une ligne : le mot n'est pas dans un compte-rendu, c'est
    // la requête ELLE-MÊME. L'analyse du compte-rendu, elle, exige que tous
    // les mots du terme soient présents dans le texte — « diabete » seul ne
    // contient ni « sucre », ni « type ».
    expect(suggestFromText('diabete')).toHaveLength(0);

    const trouves = codes('diabete');
    expect(trouves).toEqual(
      expect.arrayContaining(['E10.9', 'E11.9', 'E11.65'])
    );
  });

  it('accepte l’absence d’accent et une frappe approximative', () => {
    expect(codes('hypertension')).toContain('I10');
    // Sans accent…
    expect(codes('hyperglycemie')).toContain('E11.65');
    // …et mal orthographié : c'est la correspondance par trigrammes, celle de
    // `suggestFromText`, appelée dans l'autre sens.
    expect(codes('hypertention')).toContain('I10');
  });

  it('trouve par le code, exact puis par préfixe', () => {
    expect(codes('E11.9')[0]).toBe('E11.9');
    const famille = codes('E11');
    expect(famille).toEqual(expect.arrayContaining(['E11.9', 'E11.65']));
    // Le plus court d'abord : « E11 » avant « E11.65 ».
    expect(famille[0]?.length).toBeLessThanOrEqual(famille[1]?.length ?? 99);
  });

  it('dit par quel terme un code répond', () => {
    const hit = searchIcdCodes('dt2').find(h => h.code === 'E11.9');
    expect(hit?.matchedTerm).toBe('dt2');
    expect(hit?.fuzzy).toBe(false);
  });

  it('classe le terme le plus spécifique en tête', () => {
    // « angor » est un synonyme entier d'I20.9 ; il ne doit pas se faire
    // doubler par un libellé de douze mots qui le contiendrait.
    expect(codes('angor')[0]).toBe('I20.9');
  });

  it('ne rend rien sur une requête trop courte ou inconnue', () => {
    expect(searchIcdCodes('')).toEqual([]);
    expect(searchIcdCodes('d')).toEqual([]);
    expect(searchIcdCodes('zzzzqqqq')).toEqual([]);
  });

  it('ne rend jamais deux fois le même code, et respecte la limite', () => {
    // « diabete » touche le libellé ET plusieurs synonymes du même code.
    const hits = searchIcdCodes('diabete');
    expect(new Set(hits.map(h => h.code)).size).toBe(hits.length);
    expect(searchIcdCodes('a', 3)).toHaveLength(0);
    expect(searchIcdCodes('de', 3).length).toBeLessThanOrEqual(3);
  });
});
