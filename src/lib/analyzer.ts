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

/**
 * Correspondance approchée : CHAQUE mot significatif de `needles` doit trouver,
 * dans `haystack`, un mot dont il est proche par trigrammes. Rend la similarité
 * moyenne, ou `null` dès qu'un mot n'a pas de répondant.
 *
 * LA DIRECTION N'EST PAS LA MÊME AUX DEUX APPELS, et c'est voulu.
 *  - `suggestFromText` cherche un TERME du référentiel dans un compte-rendu :
 *    tous les mots du terme doivent être présents dans le texte, sinon
 *    « diabète » ferait remonter « diabète gestationnel ».
 *  - `searchIcdCodes` fait l'inverse : tous les mots de la REQUÊTE doivent être
 *    présents dans le terme. C'est ce qu'attend un champ de recherche — on tape
 *    « diabete » et on veut les cinq codes de diabète, pas seulement celui dont
 *    le libellé tient en un mot.
 * D'où des paramètres nommés par leur rôle et non par leur origine : la
 * mécanique est la même, on ne l'écrit pas deux fois.
 */
function fuzzyTermMatch(
  needles: string[],
  haystack: { w: string; tg: Set<string> }[]
): { avgSim: number } | null {
  const significant = needles.filter(w => w.length >= 4);
  if (significant.length === 0) return null;
  let totalSim = 0;
  for (const tw of significant) {
    const twTg = trigrams(tw);
    let best = 0;
    for (const { tg } of haystack) {
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

/* -------------------------------------------------------------------------
 * Recherche manuelle d'un code — l'autre sens du même moteur.
 *
 * POURQUOI ELLE EXISTE. `suggestFromText` part du compte-rendu : elle ne sait
 * proposer que ce que le texte contient déjà. Un professionnel qui doit coter
 * un terme ABSENT du compte-rendu — une comorbidité connue, un antécédent
 * dicté autrement — n'avait aucun moyen de le trouver : le seul champ de
 * l'écran filtrait les suggestions déjà calculées. Il fallait connaître le
 * code par cœur et le saisir avec son libellé à la main.
 * ---------------------------------------------------------------------- */

/** Un résultat de recherche manuelle. */
export interface CodeSearchHit {
  code: string;
  label: string;
  /** Le libellé ou synonyme qui a répondu — dit POURQUOI le code sort. */
  matchedTerm: string;
  score: number;
  /** Correspondance approchée (frappe ou terminologie voisine). */
  fuzzy: boolean;
}

interface IndexedTerm {
  text: string;
  words: { w: string; tg: Set<string> }[];
}

interface IndexedEntry {
  code: string;
  label: string;
  terms: IndexedTerm[];
}

/**
 * Index des trigrammes, construit UNE fois à la première recherche.
 *
 * Sans lui, chaque frappe recalculerait les trigrammes des ~2 300 mots du
 * référentiel. Avec 147 codes, c'est quelques millisecondes — mais la
 * recherche se déclenche à chaque caractère, et le coût est exactement le même
 * à chaque fois alors que les données, elles, ne bougent jamais.
 */
let searchIndex: IndexedEntry[] | null = null;

function getSearchIndex(): IndexedEntry[] {
  if (searchIndex !== null) return searchIndex;
  searchIndex = (icdEntries as IcdEntry[]).map(e => ({
    code: e.code,
    label: e.label,
    terms: [e.label, ...(e.synonyms ?? [])]
      .map(x => normalizeForMatch(x))
      .filter(t => t.length >= 2)
      .map(text => ({
        text,
        words: text
          .split(' ')
          .filter(w => w.length >= 3)
          .map(w => ({ w, tg: trigrams(w) })),
      })),
  }));
  return searchIndex;
}

/** Une requête qui commence par une lettre puis un chiffre vise un code. */
const CODE_QUERY = /^[A-Z][0-9]/;

/**
 * Cherche un code par son libellé, un synonyme, ou le code lui-même.
 *
 * Trois façons de répondre, dans cet ordre de confiance :
 *  1. le code (exact, puis par préfixe : « E11 » sort E11, E11.9, E11.65…) ;
 *  2. le terme CONTIENT la requête — un préfixe de terme vaut mieux qu'un
 *     fragment au milieu, et un terme court vaut mieux qu'un terme long, qui
 *     dilue la requête ;
 *  3. la correspondance approchée par trigrammes, celle de `suggestFromText`,
 *     appelée dans l'autre sens (cf. `fuzzyTermMatch`) — « diabete » sans
 *     accent, « hypertention » mal orthographié.
 *
 * @param rawQuery ce que l'utilisateur a tapé, tel quel.
 * @param limit nombre maximal de résultats rendus.
 */
export function searchIcdCodes(rawQuery: string, limit = 20): CodeSearchHit[] {
  const q = normalizeForMatch(rawQuery);
  if (q.length < 2) return [];

  const codeQuery = rawQuery.trim().toUpperCase().replace(/\s+/g, '');
  const looksLikeCode = CODE_QUERY.test(codeQuery);
  const queryWords = q.split(' ').filter(w => w.length >= 3);

  const hits: CodeSearchHit[] = [];

  for (const entry of getSearchIndex()) {
    let best: CodeSearchHit | null = null;

    if (looksLikeCode && entry.code.startsWith(codeQuery)) {
      best = {
        code: entry.code,
        label: entry.label,
        matchedTerm: entry.code,
        score: entry.code === codeQuery ? 1000 : 900 - entry.code.length,
        fuzzy: false,
      };
    }

    for (const term of entry.terms) {
      const idx = term.text.indexOf(q);
      if (idx !== -1) {
        // Un terme court touché en tête est un meilleur candidat qu'un long
        // libellé où la requête n'est qu'un mot parmi douze.
        const score =
          200 +
          (idx === 0 ? 60 : 0) +
          Math.round((100 * q.length) / term.text.length);
        if (best === null || score > best.score) {
          best = {
            code: entry.code,
            label: entry.label,
            matchedTerm: term.text,
            score,
            fuzzy: false,
          };
        }
        continue;
      }
      if (best !== null && !best.fuzzy) continue;
      const approx = fuzzyTermMatch(queryWords, term.words);
      if (approx === null) continue;
      const score = Math.round(100 * approx.avgSim);
      if (best === null || score > best.score) {
        best = {
          code: entry.code,
          label: entry.label,
          matchedTerm: term.text,
          score,
          fuzzy: true,
        };
      }
    }

    if (best !== null) hits.push(best);
  }

  hits.sort((a, b) => b.score - a.score || a.code.localeCompare(b.code));
  return hits.slice(0, limit);
}
