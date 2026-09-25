/**
 * La FORME d'un code saisi à la main : normalisation, puis contrôle.
 *
 * CE QUI MANQUAIT. La saisie manuelle ne vérifiait que deux choses : que le
 * champ n'était pas vide, et que le code n'était pas déjà retenu. « e11 9 »,
 * « E11,9 » ou « diabète » partaient tels quels dans les diagnostics retenus,
 * puis dans l'export — là où le logiciel qui les reçoit les refusera, ou pire,
 * les prendra pour autre chose.
 *
 * DEUX TEMPS, QUI NE SE CONFONDENT PAS.
 *  1. La NORMALISATION rattrape ce qui est une façon d'écrire, pas une erreur :
 *     espaces, casse, virgule décimale, point oublié (`a000` → `A00.0`).
 *  2. Le CONTRÔLE refuse ce qui n'a pas la forme d'un code. Il ne refuse PAS
 *     un code bien formé que le référentiel embarqué ignore : ce référentiel
 *     est un échantillon — 147 codes aujourd'hui —, et le prendre pour la
 *     CIM-10 entière bloquerait des milliers de codes légitimes. Celui-là est
 *     signalé — avec ses voisins de catégorie quand il y en a —, pas bloqué.
 *
 * LES EXTENSIONS FRANÇAISES. La CIM-10 à usage PMSI (ATIH) va jusqu'à six
 * caractères, et le signe « + » y tient la place d'un caractère absent quand
 * l'extension est plus loin (`R53.+0`). Le référentiel embarqué n'en contient
 * aucune — on n'y trouve que `I10`, `E11.9` et `E11.65` comme formes — mais les
 * refuser reviendrait à refuser des codes que le PMSI exige.
 */
import { icdEntries } from '../icd10-data.js';
import { getCategoryPrefix } from './icd-hierarchy';
import type { ICD10Code } from '../types/index';

/**
 * La classification d'un code. La saisie manuelle est en CIM-10 ; un code venu
 * de l'OMS est en CIM-11 et se corrige dans SA classification.
 */
export type Classification = 'cim10' | 'cim11';

export type VerdictCode =
  /** Rien de saisi. */
  | { statut: 'vide' }
  /** Pas la forme d'un code de cette classification. */
  | { statut: 'invalide'; normalise: string }
  /**
   * Un code bien formé, sous sa forme normalisée. `reference` est l'entrée du
   * référentiel embarqué qui le porte, ou `null` ; `proches` ne se remplit que
   * dans ce second cas.
   */
  | {
      statut: 'valide';
      code: string;
      reference: ICD10Code | null;
      proches: ICD10Code[];
    };

/**
 * Lettre, deux chiffres, puis une sous-catégorie facultative de un à trois
 * caractères : des chiffres, ou un « + » de remplissage suivi de chiffres.
 */
const FORME_CIM10 = /^[A-Z]\d{2}(?:\.(?:\d{1,3}|\d\+\d|\+\d{1,2}))?$/;

/** La même chose sans le point : `A000`, `E1165`, `R53+0`. */
const SANS_POINT_CIM10 = /^[A-Z]\d{2}[\d+]{1,3}$/;

/*
 * CIM-11 : quatre caractères — le DEUXIÈME TOUJOURS UNE LETTRE, c'est ce qui la
 * distingue de la CIM-10 au premier coup d'œil —, une précision facultative
 * après le point, et des codes d'extension (`X…`) qu'on peut lier par `&` ou
 * `/`. Ni `I` ni `O` : l'OMS les a retirés pour qu'on ne les confonde pas avec
 * `1` et `0`.
 */
const SEGMENT_CIM11 =
  '(?:[1-9A-HJ-NP-Z][A-HJ-NP-Z]\\d[0-9A-HJ-NP-Z](?:\\.[0-9A-HJ-NP-Z]{1,3})?|X[0-9A-HJ-NP-Z]{3,5})';
const FORME_CIM11 = new RegExp(`^${SEGMENT_CIM11}(?:[&/]${SEGMENT_CIM11})*$`);

/** Au-delà, la liste des voisins devient une page à parcourir. */
const PROCHES_MAX = 6;

/**
 * Ce qui est une façon d'écrire, pas une erreur : espaces (y compris au
 * milieu), casse, virgule décimale, point final, et la dague ou l'astérisque du
 * double codage (`A17.0†`, `G01*`) recopiés depuis le volume — ils marquent
 * l'étiologie et la manifestation, ils ne font pas partie du code.
 */
function nettoyer(saisie: string): string {
  return saisie
    .replace(/\s+/g, '')
    .toUpperCase()
    .replace(/,/g, '.')
    .replace(/[*†]+$/u, '')
    .replace(/\.$/, '');
}

/**
 * La forme normalisée d'une saisie. Ne JUGE rien : une saisie impossible à
 * normaliser ressort nettoyée, et `verifierCode` dira qu'elle n'a pas la forme.
 */
export function normaliserCode(
  saisie: string,
  classification: Classification = 'cim10'
): string {
  const propre = nettoyer(saisie);
  if (classification === 'cim10' && SANS_POINT_CIM10.test(propre)) {
    return `${propre.slice(0, 3)}.${propre.slice(3)}`;
  }
  return propre;
}

/** Les codes du référentiel qui partagent la catégorie de `code`. */
function voisinsDeCategorie(
  code: string,
  referentiel: readonly ICD10Code[]
): ICD10Code[] {
  const categorie = getCategoryPrefix(code);
  return (
    referentiel
      .filter(e => e.code !== code && getCategoryPrefix(e.code) === categorie)
      // Ordre de la classification, pas ordre numérique : `E11.65` est une
      // précision de `E11.6`, il vient donc avant `E11.9`.
      .sort((a, b) => a.code.localeCompare(b.code))
      .slice(0, PROCHES_MAX)
  );
}

/**
 * Normalise puis contrôle une saisie.
 *
 * @param saisie ce que l'utilisateur a tapé, tel quel.
 * @param classification CIM-10 par défaut ; CIM-11 pour corriger un code OMS.
 * @param referentiel injectable pour les tests — le dictionnaire embarqué sinon.
 */
export function verifierCode(
  saisie: string,
  classification: Classification = 'cim10',
  referentiel: readonly ICD10Code[] = icdEntries as ICD10Code[]
): VerdictCode {
  const normalise = normaliserCode(saisie, classification);
  if (normalise === '') return { statut: 'vide' };
  const forme = classification === 'cim10' ? FORME_CIM10 : FORME_CIM11;
  if (!forme.test(normalise)) return { statut: 'invalide', normalise };
  // Le référentiel embarqué est de la CIM-10 : il n'a rien à dire d'un code
  // CIM-11, ni pour le reconnaître, ni pour lui trouver des voisins.
  if (classification === 'cim11') {
    return { statut: 'valide', code: normalise, reference: null, proches: [] };
  }
  const reference = referentiel.find(e => e.code === normalise) ?? null;
  return {
    statut: 'valide',
    code: normalise,
    reference,
    proches: reference ? [] : voisinsDeCategorie(normalise, referentiel),
  };
}
