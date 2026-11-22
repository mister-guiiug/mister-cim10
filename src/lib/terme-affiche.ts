/**
 * Libellé montré sous une suggestion pour le passage du compte-rendu.
 *
 * L'OMS renvoie souvent le SEGMENT entier (parfois tout le CR) comme
 * `matchedTerm`. L'afficher en vert donne l'illusion d'un terme clinique
 * précis. Au-delà d'un seuil, on dit honnêtement « passage analysé ».
 */
import type { AnalysisResult } from '../types/index';

/** Au-delà : trop long pour un « terme » — seuil mesuré sur des CR courts. */
const SEUIL_MOTS = 8;
const SEUIL_CARACTERES = 60;

export function passageOmsTropLarge(suggestion: AnalysisResult): boolean {
  if (suggestion.source !== 'api') return false;
  const texte = (suggestion.extrait ?? suggestion.matchedTerm).trim();
  if (texte.length >= SEUIL_CARACTERES) return true;
  return texte.split(/\s+/).filter(Boolean).length >= SEUIL_MOTS;
}
