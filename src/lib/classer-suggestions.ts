/**
 * Classement des suggestions après une analyse.
 *
 * Dédup par code (CIM-10 et CIM-11 ne se chevauchent pas), puis ordre : d'abord
 * le référentiel privilégié dans les Réglages, ensuite la confiance. Le défaut
 * du produit est l'OMS (CIM-11) en tête quand elle a répondu — le dictionnaire
 * local suit.
 */
import type { AnalysisResult, SourcePriority } from '../types/index';

function rangSource(
  source: AnalysisResult['source'],
  priorite: SourcePriority
): number {
  const s = source ?? 'local';
  if (priorite === 'api') return s === 'api' ? 0 : 1;
  return s === 'local' ? 0 : 1;
}

export function classerSuggestions(
  results: AnalysisResult[],
  priorite: SourcePriority
): AnalysisResult[] {
  const byCode = new Map<string, AnalysisResult>();
  for (const r of results) if (!byCode.has(r.code)) byCode.set(r.code, r);
  return [...byCode.values()].sort((a, b) => {
    const ra = rangSource(a.source, priorite);
    const rb = rangSource(b.source, priorite);
    if (ra !== rb) return ra - rb;
    return b.confidence - a.confidence;
  });
}
