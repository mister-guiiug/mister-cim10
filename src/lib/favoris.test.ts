import { describe, expect, it } from 'vitest';
import type { FavoriteCode } from '../types/index';
import { MAX_FAVORIS, basculerFavori, favorisValides } from './favoris';

const favori = (code: string, source: 'local' | 'api' = 'local') => ({
  code,
  label: `libellé de ${code}`,
  source,
});

describe('mettre en favori, retirer', () => {
  it('ajoute, dans l’ordre de la classification', () => {
    let liste: FavoriteCode[] = [];
    for (const code of ['I10', 'E11.9', 'E11.65']) {
      liste = basculerFavori(liste, favori(code), 1).favoris;
    }
    expect(liste.map(f => f.code)).toEqual(['E11.65', 'E11.9', 'I10']);
  });

  it('un second geste retire', () => {
    const { favoris } = basculerFavori([], favori('I10'));
    const retrait = basculerFavori(favoris, favori('I10'));
    expect(retrait.resultat).toBe('retire');
    expect(retrait.favoris).toEqual([]);
  });

  it('garde le référentiel d’origine et l’heure de l’ajout', () => {
    const { favoris, resultat } = basculerFavori([], favori('BA00', 'api'), 42);
    expect(resultat).toBe('ajoute');
    expect(favoris).toEqual([
      { code: 'BA00', label: 'libellé de BA00', source: 'api', addedAt: 42 },
    ]);
  });

  it(`pleine à ${MAX_FAVORIS}, la liste REFUSE au lieu de faire sortir un favori`, () => {
    let liste: FavoriteCode[] = [];
    for (let i = 0; i < MAX_FAVORIS; i++) {
      liste = basculerFavori(
        liste,
        favori(`A${String(i).padStart(2, '0')}`)
      ).favoris;
    }
    const refus = basculerFavori(liste, favori('Z99.9'));
    expect(refus.resultat).toBe('plein');
    expect(refus.favoris).toHaveLength(MAX_FAVORIS);
    expect(refus.favoris.some(f => f.code === 'Z99.9')).toBe(false);
    // Retirer reste possible quand la liste est pleine.
    expect(basculerFavori(liste, favori('A00')).resultat).toBe('retire');
  });
});

describe('relecture défensive (stockage, sauvegarde)', () => {
  it('rend [] pour tout ce qui n’est pas une liste — un champ absent compris', () => {
    expect(favorisValides(undefined)).toEqual([]);
    expect(favorisValides('["I10"]')).toEqual([]);
    expect(favorisValides({ code: 'I10' })).toEqual([]);
  });

  it('écarte l’illisible, dédoublonne, répare le reste', () => {
    const lus = favorisValides([
      { code: 'I10', label: 'HTA', source: 'local', addedAt: 1 },
      { code: 'I10', label: 'doublon', source: 'local', addedAt: 2 },
      { code: 'E11.9', label: 'Diabète' },
      { code: 42, label: 'pas un code' },
      { code: '', label: 'vide' },
      null,
      'I10',
    ]);
    expect(lus).toEqual([
      { code: 'E11.9', label: 'Diabète', source: 'local', addedAt: 0 },
      { code: 'I10', label: 'HTA', source: 'local', addedAt: 1 },
    ]);
  });

  it(`borne à ${MAX_FAVORIS}`, () => {
    const beaucoup = Array.from({ length: MAX_FAVORIS + 20 }, (_, i) =>
      favori(`B${String(i).padStart(3, '0')}`)
    );
    expect(favorisValides(beaucoup)).toHaveLength(MAX_FAVORIS);
  });
});
