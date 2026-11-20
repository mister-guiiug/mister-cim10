import type { AnalysisResult } from '../../types/index';

/**
 * LES SUGGESTIONS QUI RESTENT À TRANCHER : ni rejetées, ni déjà retenues, et
 * au-dessus du seuil de confiance. Le panneau les filtre ensuite par sa
 * recherche ; l'onglet « Suggestions » en affiche le nombre. Une seule
 * définition, pour que les deux ne divergent pas.
 */
export function suggestionsATrancher(
  suggestions: readonly AnalysisResult[],
  rejectedIds: ReadonlySet<string>,
  validatedCodes: ReadonlySet<string>,
  minConfidence: number
): AnalysisResult[] {
  return suggestions.filter(
    s =>
      !rejectedIds.has(s.id) &&
      !validatedCodes.has(s.code) &&
      s.confidence >= minConfidence
  );
}
