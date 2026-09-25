import { describe, expect, it } from 'vitest';
import { deplacer, remplacer } from './diagnostics';

const liste = [
  { id: 'a', code: 'A00.0' },
  { id: 'b', code: 'B01.9' },
  { id: 'c', code: 'C34.9' },
];

const codes = (l: { code: string }[] | null) => l?.map(e => e.code) ?? null;

describe('déplacer un diagnostic retenu', () => {
  it('monte et descend d’une place', () => {
    expect(codes(deplacer(liste, 'b', -1))).toEqual([
      'B01.9',
      'A00.0',
      'C34.9',
    ]);
    expect(codes(deplacer(liste, 'b', 1))).toEqual(['A00.0', 'C34.9', 'B01.9']);
  });

  it('refuse au bord : ni au-dessus du premier, ni sous le dernier', () => {
    expect(deplacer(liste, 'a', -1)).toBeNull();
    expect(deplacer(liste, 'c', 1)).toBeNull();
  });

  it('refuse un identifiant inconnu et un déplacement nul', () => {
    expect(deplacer(liste, 'z', 1)).toBeNull();
    expect(deplacer(liste, 'a', 0)).toBeNull();
  });

  it('ne touche pas à la liste reçue', () => {
    deplacer(liste, 'a', 1);
    expect(codes(liste)).toEqual(['A00.0', 'B01.9', 'C34.9']);
  });
});

describe('modifier un diagnostic retenu', () => {
  it('garde la position', () => {
    const suite = remplacer(liste, 'b', { code: 'B02.9' });
    expect(codes(suite)).toEqual(['A00.0', 'B02.9', 'C34.9']);
    expect(suite?.[1]?.id).toBe('b');
  });

  it('rend `null` quand rien ne change, ou que l’élément manque', () => {
    expect(remplacer(liste, 'b', { code: 'B01.9' })).toBeNull();
    expect(remplacer(liste, 'z', { code: 'Z00.0' })).toBeNull();
  });
});
