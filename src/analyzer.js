import { icdEntries } from './icd10-data.js';
import { randomId } from './random-id.js';

function normalize(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Texte allégé pour recherche (ponctuation → espaces, évite les listes séparées par virgules). */
function normalizeForMatch(s) {
  return normalize(s)
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Détecte des correspondances texte → entrées CIM-10 (aide à la cotation, pas un substitut à l’expertise).
 */
export function suggestFromText(rawText) {
  const text = normalizeForMatch(rawText);
  if (text.length < 2) return [];

  const hits = [];

  for (const e of icdEntries) {
    const terms = [e.label, ...(e.synonyms || [])]
      .map((x) => normalizeForMatch(x))
      .filter((t) => t.length >= 2);
    let bestScore = 0;
    let matchedTerm = '';

    for (const t of terms) {
      if (text.includes(t)) {
        const isWholeWord = new RegExp(`(^|[^a-z0-9])${escapeRegExp(t)}([^a-z0-9]|$)`, 'i').test(text);
        const bonus = isWholeWord ? 15 : 0;
        const score = t.length * 8 + bonus + (t.length >= 12 ? 20 : 0);
        if (score > bestScore) {
          bestScore = score;
          matchedTerm = t;
        }
      }
    }

    if (bestScore > 0) {
      const confidence = Math.min(0.94, 0.35 + bestScore / 180);
      hits.push({
        id: randomId(),
        code: e.code,
        label: e.label,
        matchedTerm,
        score: bestScore,
        confidence,
      });
    }
  }

  hits.sort((a, b) => b.score - a.score);

  const seen = new Set();
  const out = [];
  for (const h of hits) {
    if (seen.has(h.code)) continue;
    seen.add(h.code);
    out.push(h);
    if (out.length >= 30) break;
  }
  return out;
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
