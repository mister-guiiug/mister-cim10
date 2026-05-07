import { icdEntries } from '../icd10-data.js';
import type { AnalysisResult } from '../types/index';

const randomId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 12);

function normalize(s: string): string {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[''']/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeForMatch(s: string): string {
  return normalize(s)
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function trigrams(s: string): Set<string> {
  const padded = `  ${s}  `;
  const set = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) set.add(padded.slice(i, i + 3));
  return set;
}

function trigramSim(ta: Set<string>, tb: Set<string>): number {
  let n = 0;
  for (const g of ta) if (tb.has(g)) n++;
  return (2 * n) / (ta.size + tb.size);
}

const FUZZY_THRESHOLD = 0.78;

function fuzzyTermMatch(
  termWords: string[],
  inputWordTrigs: { w: string; tg: Set<string> }[]
): { avgSim: number } | null {
  const significant = termWords.filter(w => w.length >= 4);
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

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

interface IcdEntry {
  code: string;
  label: string;
  synonyms?: string[];
}

export function suggestFromText(rawText: string): AnalysisResult[] {
  const text = normalizeForMatch(rawText);
  if (text.length < 2) return [];

  const inputWords = text.split(' ').filter(w => w.length >= 3);
  const inputWordTrigs = inputWords.map(w => ({ w, tg: trigrams(w) }));

  const upperRaw = rawText.trim().toUpperCase();
  const entries = icdEntries as IcdEntry[];
  const exactCodeEntry = entries.find(e => e.code === upperRaw);
  const exactCodeHits: AnalysisResult[] = exactCodeEntry
    ? [
        {
          id: randomId(),
          code: exactCodeEntry.code,
          label: exactCodeEntry.label,
          matchedTerm: exactCodeEntry.code,
          score: 999,
          confidence: 0.99,
          source: 'local',
        },
      ]
    : [];
  const exactCodes = new Set(exactCodeHits.map(h => h.code));
  const hits: AnalysisResult[] = [];

  for (const e of entries) {
    const terms = [e.label, ...(e.synonyms ?? [])]
      .map(x => normalizeForMatch(x))
      .filter(t => t.length >= 2);
    let bestScore = 0;
    let matchedTerm = '';
    let bestFuzzy: { term: string; avgSim: number } | null = null;

    for (const t of terms) {
      if (text.includes(t)) {
        const isWholeWord = new RegExp(
          `(^|[^a-z0-9])${escapeRegExp(t)}([^a-z0-9]|$)`,
          'i'
        ).test(text);
        const bonus = isWholeWord ? 15 : 0;
        const score = t.length * 8 + bonus + (t.length >= 12 ? 20 : 0);
        if (score > bestScore) {
          bestScore = score;
          matchedTerm = t;
        }
      } else if (bestScore === 0) {
        const termWords = t.split(' ').filter(w => w.length >= 3);
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
        source: 'local',
      });
    } else if (bestFuzzy) {
      const score = bestFuzzy.term.length * 6 * bestFuzzy.avgSim;
      const confidence = Math.min(0.62, 0.22 + score / 180);
      hits.push({
        id: randomId(),
        code: e.code,
        label: e.label,
        matchedTerm: bestFuzzy.term,
        score,
        confidence,
        source: 'local',
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
