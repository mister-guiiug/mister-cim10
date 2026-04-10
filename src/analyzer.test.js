import { describe, it, expect } from 'vitest';
import { suggestFromText } from './analyzer.js';

describe('suggestFromText', () => {
  it('retourne vide pour texte trop court', () => {
    expect(suggestFromText('a')).toEqual([]);
    expect(suggestFromText('')).toEqual([]);
  });

  it('propose des codes pour des termes du référentiel', () => {
    const hypertension = suggestFromText('patient avec hypertension artérielle');
    expect(hypertension.length).toBeGreaterThan(0);
    expect(hypertension.some((h) => h.code === 'I10')).toBe(true);

    const diab = suggestFromText('suivi diabète type 2');
    expect(diab.some((h) => h.code.startsWith('E11'))).toBe(true);
  });
});
