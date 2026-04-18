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

  describe('correspondance floue (fautes de frappe et erreurs STT)', () => {
    it('tolère une faute de frappe sur un mot long (hypertension → hipertension)', () => {
      const res = suggestFromText('patient hipertension arterialle');
      expect(res.some((h) => h.code === 'I10')).toBe(true);
    });

    it("tolère une faute de frappe STT (fibrillation → fibrilation)", () => {
      const res = suggestFromText('contrôle fibrilation auriculaire');
      expect(res.some((h) => h.code === 'I48.0')).toBe(true);
    });

    it("tolère une faute de frappe STT (insuffisance → insuffisanse)", () => {
      const res = suggestFromText('insuffisanse cardiaque décompensée');
      expect(res.some((h) => h.code === 'I50.0')).toBe(true);
    });

    it("tolère une faute de frappe (diabète → diabete sans accent, type2 collé)", () => {
      // Le normalizeForMatch gère déjà les accents — le fuzzy gère des erreurs de lettres
      const res = suggestFromText('suivi diabette type 2');
      expect(res.some((h) => h.code.startsWith('E11'))).toBe(true);
    });

    it('les hits flous ont une confiance inférieure à 0.63', () => {
      // Un hit flou ne doit jamais apparaître en "Élevée" (seuil 0.7)
      const res = suggestFromText('patient hipertension arterialle');
      const hit = res.find((h) => h.code === 'I10');
      expect(hit).toBeDefined();
      expect(hit.confidence).toBeLessThan(0.63);
    });

    it("ne produit pas de faux positifs sur un texte sans lien médical", () => {
      const res = suggestFromText('réunion de travail lundi matin bureau');
      expect(res.length).toBe(0);
    });
  });
});
