import { describe, expect, it } from 'vitest';
import {
  HISTORIQUE_MAX,
  annuler,
  enregistrer,
  historiqueVide,
  retablir,
  type Historique,
} from './historique';

/**
 * CE QUE CE FICHIER TIENT : annuler remet l'état d'avant, rétablir celui
 * d'après, un geste neuf ferme la porte au rétablissement, et la pile ne
 * grossit pas sans fin.
 */

type H = Historique<string[], string>;

function geste(h: H, avant: string[], apres: string[], operation: string): H {
  return enregistrer(h, { avant, apres, operation });
}

describe('annuler / rétablir', () => {
  it('annuler rend l’état d’avant, rétablir celui d’après', () => {
    let h: H = historiqueVide();
    h = geste(h, [], ['A'], 'ajout A');
    h = geste(h, ['A'], ['A', 'B'], 'ajout B');

    const annule = annuler(h);
    expect(annule?.entree.avant).toEqual(['A']);
    expect(annule?.entree.operation).toBe('ajout B');

    const retabli = retablir(annule!.historique);
    expect(retabli?.entree.apres).toEqual(['A', 'B']);
    expect(retabli?.historique.passe).toHaveLength(2);
    expect(retabli?.historique.futur).toHaveLength(0);
  });

  it('rien à annuler, rien à rétablir : `null`, pas une exception', () => {
    const h: H = historiqueVide();
    expect(annuler(h)).toBeNull();
    expect(retablir(h)).toBeNull();
  });

  it('annule dans l’ordre inverse, rétablit dans l’ordre', () => {
    let h: H = historiqueVide();
    h = geste(h, [], ['A'], '1');
    h = geste(h, ['A'], ['A', 'B'], '2');
    h = geste(h, ['A', 'B'], ['B'], '3');

    const ordre: string[] = [];
    let courant = annuler(h);
    while (courant) {
      ordre.push(courant.entree.operation);
      h = courant.historique;
      courant = annuler(h);
    }
    expect(ordre).toEqual(['3', '2', '1']);

    const rejoue: string[] = [];
    let suivant = retablir(h);
    while (suivant) {
      rejoue.push(suivant.entree.operation);
      h = suivant.historique;
      suivant = retablir(h);
    }
    expect(rejoue).toEqual(['1', '2', '3']);
  });

  it('un geste neuf vide la pile « rétablir »', () => {
    let h: H = historiqueVide();
    h = geste(h, [], ['A'], 'ajout A');
    h = annuler(h)!.historique;
    expect(h.futur).toHaveLength(1);

    h = geste(h, [], ['C'], 'ajout C');

    expect(h.futur).toHaveLength(0);
    expect(retablir(h)).toBeNull();
  });

  it(`borne la pile à ${HISTORIQUE_MAX} : les gestes les plus anciens sortent`, () => {
    let h: H = historiqueVide();
    for (let i = 1; i <= HISTORIQUE_MAX + 5; i++) {
      h = geste(h, [], [String(i)], `geste ${i}`);
    }

    expect(h.passe).toHaveLength(HISTORIQUE_MAX);
    expect(h.passe[0]?.operation).toBe('geste 6');
    expect(h.passe.at(-1)?.operation).toBe(`geste ${HISTORIQUE_MAX + 5}`);
  });

  it('ne modifie jamais l’historique reçu', () => {
    const h: H = geste(historiqueVide(), [], ['A'], 'ajout A');
    const gele = JSON.stringify(h);

    annuler(h);
    geste(h, ['A'], [], 'retrait A');

    expect(JSON.stringify(h)).toBe(gele);
  });
});
