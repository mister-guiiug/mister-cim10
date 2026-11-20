/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// LE FICHIER LU SUR LE DISQUE, depuis la racine du dépôt. Deux impasses
// essayées : `new URL(…, import.meta.url)` (sous jsdom, ce n'est pas une adresse
// `file:`) et `import … from './style.css?raw'` (Vitest rend une chaîne VIDE
// pour une feuille). Le premier test ci-dessous refuse une lecture vide.
const lire = (nom: string) =>
  readFileSync(join(process.cwd(), 'src', nom), 'utf8');
const feuilleStyle = lire('style.css');
const feuilleAstryx = lire('astryx.css');

/**
 * LA GRAMMAIRE D'ASTRYX NE SE CONTOURNE PAS (ce dépôt, 20/11/2026).
 *
 * L'audit avant la refonte comptait QUINZE tailles de texte sur l'écran de
 * cotation (de 9,9 à 21,6 px), six à huit rayons, et cent dix `font-size`
 * écrits en dur dans `style.css`. Chacun avait été choisi « juste pour cette
 * règle » ; ensemble, ils faisaient une interface qui ne se tenait pas.
 *
 * Toute valeur visuelle vit désormais dans `astryx.css`. Ce test lit
 * `style.css` et refuse une taille de texte, une couleur ou un rayon qui n'y
 * passerait pas par un nom. Deux exceptions, et seulement deux : l'impression
 * (`@media print`, qui parle en points et en noir sur blanc) et une taille
 * relative `em` (un code dans une phrase suit la phrase).
 */

/** Le CSS sans ses commentaires ni ses blocs `@media print`. */
function sansImpressionNiCommentaires(css: string): string {
  const sansCommentaires = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let sortie = '';
  let i = 0;
  while (i < sansCommentaires.length) {
    const debut = sansCommentaires.indexOf('@media print', i);
    if (debut === -1) {
      sortie += sansCommentaires.slice(i);
      break;
    }
    sortie += sansCommentaires.slice(i, debut);
    let j = sansCommentaires.indexOf('{', debut);
    let profondeur = 0;
    for (; j < sansCommentaires.length; j++) {
      if (sansCommentaires[j] === '{') profondeur++;
      else if (sansCommentaires[j] === '}' && --profondeur === 0) break;
    }
    i = j + 1;
  }
  return sortie;
}

const style = sansImpressionNiCommentaires(feuilleStyle);
const declarations = (propriete: string) =>
  [...style.matchAll(new RegExp(`${propriete}\\s*:\\s*([^;]+);`, 'g'))].map(m =>
    m[1]!.trim()
  );

describe('la grammaire d’Astryx', () => {
  it('lit vraiment la feuille (un test sur un fichier vide passerait)', () => {
    expect(declarations('font-size').length).toBeGreaterThan(80);
    expect(declarations('border-radius').length).toBeGreaterThan(30);
  });

  it('toute taille de texte est un style nommé', () => {
    const horsGrammaire = declarations('font-size').filter(
      v =>
        !/^var\(--(text-[a-z0-9-]+-size|font-size-[a-z0-9]+)\)$/.test(v) &&
        v !== 'inherit' &&
        !/^[0-9.]+em$/.test(v)
    );
    expect(horsGrammaire).toEqual([]);
  });

  it('aucune couleur n’est écrite en dur', () => {
    const couleurs = style.match(/#[0-9a-fA-F]{3,8}\b|\b(rgba?|hsla?)\(/g);
    expect(couleurs ?? []).toEqual([]);
  });

  it('tout rayon est un rayon nommé', () => {
    const rayons = declarations('border-radius').filter(
      v =>
        v !== '0' &&
        !v
          .split(/\s+/)
          .every(part => part === '0' || /^var\(--radius-[a-z]+\)$/.test(part))
    );
    expect(rayons).toEqual([]);
  });

  it('les anciens noms ne sont que des alias : aucune valeur derrière', () => {
    const astryx = feuilleAstryx.replace(/\/\*[\s\S]*?\*\//g, '');
    const blocAlias = astryx.slice(astryx.lastIndexOf('html {'));
    const valeurs = [...blocAlias.matchAll(/--[\w-]+\s*:\s*([^;]+);/g)].map(m =>
      m[1]!.trim()
    );
    expect(valeurs.length).toBeGreaterThan(20);
    expect(
      valeurs.filter(v => !v.startsWith('var(') && !v.startsWith('0 0 0 var('))
    ).toEqual([]);
  });
});
