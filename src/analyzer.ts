import { icdEntries } from './icd10-data.js';
import { randomId } from './random-id.js';
import type { ICD10Code, AnalysisResult } from './types/index.js';

function normalize(s: string): string {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/** Texte allégé pour recherche (ponctuation → espaces, évite les listes séparées par virgules). */
function normalizeForMatch(s: string): string {
  return normalize(s)
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Détecte des correspondances texte → entrées CIM-10 (aide à la cotation, pas un substitut à l’expertise).
 */

// --- Correspondance floue par trigrammes (robuste aux fautes de frappe et erreurs STT) ---

/** Construit l'ensemble des trigrammes d'un mot (avec padding). */
function trigrams(s: string): Set<string> {
  const padded = `  ${s}  `;
  const set = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) set.add(padded.slice(i, i + 3));
  return set;
}

/** Similarité de Jaccard sur trigrammes entre deux mots (0 → 1). */
function trigramSim(ta: Set<string>, tb: Set<string>): number {
  let n = 0;
  for (const g of ta) if (tb.has(g)) n++;
  return (2 * n) / (ta.size + tb.size);
}

/**
 * Seuil de similarité trigramme pour qu'un mot soit considéré comme "reconnu".
 * 0.78 ≈ tolère 1–2 caractères substitués/supprimés/insérés sur un mot de 8 lettres.
 */
const FUZZY_THRESHOLD = 0.78;

/**
 * Vérifie si tous les mots significatifs (≥ 4 lettres) d'un terme du référentiel
 * ont un correspondant approximatif dans les mots du texte saisi.
 * Retourne null si aucun match, ou { avgSim } si match trouvé.
 */
function fuzzyTermMatch(termWords, inputWordTrigs) {
  const significant = termWords.filter((w) => w.length >= 4);
  if (significant.length === 0) return null;
  let totalSim = 0;
  for (const tw of significant) {
    const twTg = trigrams(tw);
    let best = 0;
    for (const { tg } of inputWordTrigs) {
      const sim = trigramSim(twTg, tg);
      if (sim > best) best = sim;
    }
    if (best < FUZZY_THRESHOLD) return null;
    totalSim += best;
  }
  return { avgSim: totalSim / significant.length };
}

/**
 * Détecte des correspondances texte → entrées CIM-10 (aide à la cotation, pas un substitut à l'expertise).
 */
export function suggestFromText(rawText) {
  const text = normalizeForMatch(rawText);
  if (text.length < 2) return [];

  // Pré-calcul des trigrammes des mots du texte (réutilisé pour chaque entrée du référentiel)
  const inputWords = text.split(' ').filter((w) => w.length >= 3);
  const inputWordTrigs = inputWords.map((w) => ({ w, tg: trigrams(w) }));

  // Correspondance directe par code (ex. "I10", "E11.9")
  const upperRaw = rawText.trim().toUpperCase();
  const exactCodeEntry = icdEntries.find((e) => e.code === upperRaw);
  const exactCodeHits = exactCodeEntry
    ? [{ id: randomId(), code: exactCodeEntry.code, label: exactCodeEntry.label, matchedTerm: exactCodeEntry.code, score: 999, confidence: 0.99 }]
    : [];
  const exactCodes = new Set(exactCodeHits.map((h) => h.code));
  const hits = [];

  for (const e of icdEntries) {
    const terms = [e.label, ...(e.synonyms || [])]
      .map((x) => normalizeForMatch(x))
      .filter((t) => t.length >= 2);
    let bestScore = 0;
    let matchedTerm = '';
    let bestFuzzy = null;

    for (const t of terms) {
      if (text.includes(t)) {
        // Correspondance exacte (comportement original)
        const isWholeWord = new RegExp(`(^|[^a-z0-9])${escapeRegExp(t)}([^a-z0-9]|$)`, 'i').test(text);
        const bonus = isWholeWord ? 15 : 0;
        const score = t.length * 8 + bonus + (t.length >= 12 ? 20 : 0);
        if (score > bestScore) {
          bestScore = score;
          matchedTerm = t;
        }
      } else if (bestScore === 0) {
        // Correspondance floue : tentée seulement si aucune correspondance exacte pour cette entrée
        const termWords = t.split(' ').filter((w) => w.length >= 3);
        const result = fuzzyTermMatch(termWords, inputWordTrigs);
        if (result && result.avgSim > (bestFuzzy?.avgSim ?? 0)) {
          bestFuzzy = { term: t, avgSim: result.avgSim };
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
    } else if (bestFuzzy) {
      // Hit flou : confiance réduite pour signaler l'incertitude (s'affiche "Moyenne" ou "Faible")
      const score = bestFuzzy.term.length * 6 * bestFuzzy.avgSim;
      const confidence = Math.min(0.62, 0.22 + score / 180);
      hits.push({
        id: randomId(),
        code: e.code,
        label: e.label,
        matchedTerm: bestFuzzy.term,
        score,
        confidence,
      });
    }
  }

  hits.sort((a, b) => b.score - a.score);

  const seen = new Set(exactCodes);
  const out = [...exactCodeHits];
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
