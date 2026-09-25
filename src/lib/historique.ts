/**
 * Annuler / rétablir, sur une pile bornée.
 *
 * DES INSTANTANÉS, PAS DES OPÉRATIONS INVERSES. Chaque entrée garde l'état
 * AVANT et APRÈS l'opération. Écrire l'inverse de chaque geste (un retrait
 * pour un ajout, un déplacement contraire pour un déplacement…) multiplie les
 * chances de se tromper sur un cas ; recopier une liste de quelques
 * diagnostics ne coûte rien, et annuler redevient une affectation.
 *
 * LA CONDITION, EN RETOUR : TOUT ce qui modifie l'état suivi doit passer par
 * ici. Une modification qui y échapperait serait écrasée au premier
 * « Annuler », puisque celui-ci remet l'état d'AVANT en bloc.
 *
 * Générique et pur : aucune idée de ce qu'est un diagnostic, testé seul.
 */

/** Au-delà, les gestes les plus anciens sortent de la pile. */
export const HISTORIQUE_MAX = 50;

export interface EntreeHistorique<E, O> {
  /** L'état avant l'opération : ce qu'« Annuler » remet. */
  avant: E;
  /** L'état après : ce que « Rétablir » remet. */
  apres: E;
  /** Ce qui s'est passé, pour pouvoir le dire. */
  operation: O;
}

export interface Historique<E, O> {
  /** Les opérations qu'on peut annuler, la plus récente en DERNIER. */
  passe: readonly EntreeHistorique<E, O>[];
  /** Celles qu'on peut rétablir, la prochaine en DERNIER. */
  futur: readonly EntreeHistorique<E, O>[];
}

export function historiqueVide<E, O>(): Historique<E, O> {
  return { passe: [], futur: [] };
}

/**
 * Empile une opération. La pile « rétablir » est VIDÉE : après un geste neuf,
 * rétablir ce qu'on avait annulé rejouerait un état qui ne suit plus le geste
 * qu'on vient de faire.
 */
export function enregistrer<E, O>(
  historique: Historique<E, O>,
  entree: EntreeHistorique<E, O>,
  max: number = HISTORIQUE_MAX
): Historique<E, O> {
  const passe = [...historique.passe, entree];
  return {
    passe: passe.length > max ? passe.slice(passe.length - max) : passe,
    futur: [],
  };
}

/** Dépile la dernière opération, ou `null` s'il n'y a rien à annuler. */
export function annuler<E, O>(
  historique: Historique<E, O>
): { historique: Historique<E, O>; entree: EntreeHistorique<E, O> } | null {
  const entree = historique.passe.at(-1);
  if (entree === undefined) return null;
  return {
    historique: {
      passe: historique.passe.slice(0, -1),
      futur: [...historique.futur, entree],
    },
    entree,
  };
}

/** Rejoue la dernière opération annulée, ou `null` s'il n'y en a pas. */
export function retablir<E, O>(
  historique: Historique<E, O>
): { historique: Historique<E, O>; entree: EntreeHistorique<E, O> } | null {
  const entree = historique.futur.at(-1);
  if (entree === undefined) return null;
  return {
    historique: {
      passe: [...historique.passe, entree],
      futur: historique.futur.slice(0, -1),
    },
    entree,
  };
}
