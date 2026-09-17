import { describe, expect, it } from 'vitest';
import { suggestFromText } from './analyzer';

/**
 * CE QUE CE FICHIER TIENT : la forme sous laquelle un clinicien ÉCRIT.
 *
 * Relevé en production le 17/09/2026 sur la version déployée :
 *
 *   « Diabète de type 2 »            → E11.9
 *   « Diabete type 2 » (sans accent) → E11.9
 *   « DT2 »                          → E11.9
 *   « Patient DIABÉTIQUE de type 2 » → RIEN
 *
 * Les accents et l'abréviation passaient, l'adjectif non — alors que c'est
 * l'écriture la plus courante, et que l'exemple affiché par l'application dit
 * lui-même « Ex. : Patient diabétique type 2 ». Elle proposait un exemple sur
 * lequel elle échouait.
 */

const codes = (texte: string) =>
  suggestFromText(texte)
    .sort((a, b) => b.confidence - a.confidence)
    .map(r => r.code);

describe('les formes dérivées sont reconnues', () => {
  it.each([
    ['Patient diabétique de type 2 mal équilibré.', 'E11.9'],
    ['Patiente asthmatique depuis l’enfance.', 'J45.9'],
    ['Syndrome dépressif majeur.', 'F32.9'],
    ['Anémique, ferritine basse.', 'D64.9'],
    ['Patient insuffisant cardiaque.', 'I50.0'],
  ])('%s → %s', (texte, attendu) => {
    expect(codes(texte)).toContain(attendu);
  });

  it('la forme nominale continue de marcher', () => {
    expect(codes('Diabète de type 2.')).toContain('E11.9');
    expect(codes('Asthme allergique.')).toContain('J45.9');
    expect(codes('Dépression sévère.')).toContain('F32.9');
  });

  it('un code dérivé reste SOUS une correspondance littérale', () => {
    // « gastrite » est littéral pour K29.7 ; « gastro » n'en est qu'une
    // dérivation. L'ordre doit le dire.
    const r = suggestFromText('Gastrite chronique à Helicobacter.').sort(
      (a, b) => b.confidence - a.confidence
    );
    expect(r[0]?.code).toBe('K29.7');
    const litteral = r.find(x => x.code === 'K29.7')!;
    const derive = r.find(x => x.code === 'A09.9');
    if (derive) expect(derive.confidence).toBeLessThan(litteral.confidence);
  });
});

describe('ce que la dérivation NE doit PAS confondre', () => {
  it.each([
    // Racine courte, suffixes qui divergent tôt : ce ne sont pas des
    // dérivations l'une de l'autre, et les trigrammes les notaient pourtant
    // aussi haut que « asthme / asthmatique ».
    ['Hépatite virale B.', 'K29.7'],
    ['Gastrite chronique.', 'K75.9'],
  ])('%s ne propose pas %s', (texte, interdit) => {
    expect(codes(texte)).not.toContain(interdit);
  });

  it('un fragment de moins de six lettres ne dérive de rien', () => {
    // `lymph` existe dans le référentiel : sans le garde-fou, il reconnaîtrait
    // aussi bien `lymphœdème` que `lymphoblastique`, qui n'ont rien à voir.
    const r = codes('Patient sous anticoagulant.');
    expect(r.length).toBeLessThan(6);
  });
});
