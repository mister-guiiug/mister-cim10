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
 * UNE DÉRIVATION N'EST PAS UNE FAUTE DE FRAPPE, et les trigrammes ne savent
 * pas faire la différence.
 *
 * Mesuré en production le 17/09/2026 : « Diabète de type 2 » rendait `E11.9`,
 * « Patient DIABÉTIQUE de type 2 » ne rendait RIEN — alors que les accents et
 * l'abréviation « DT2 » passaient. L'exemple affiché par l'application dit
 * pourtant « Ex. : Patient diabétique type 2 » : elle proposait un exemple sur
 * lequel elle échouait.
 *
 * BAISSER LE SEUIL NE MARCHE PAS, et c'est la mesure qui le dit :
 *
 *   diabete / diabetique    0,667     ← à reconnaître
 *   asthme  / asthmatique   0,571     ← à reconnaître
 *   hepatite / hepatique    0,667     ← à NE PAS reconnaître
 *   gastrite / gastrique    0,667     ← à NE PAS reconnaître
 *
 * Les mauvaises paires scorent AUSSI HAUT que les bonnes. Ce qui les sépare
 * est ailleurs : une dérivation partage un long préfixe (« diabet »), une
 * confusion partage une racine courte suivie de suffixes qui divergent tôt.
 *
 * D'où la règle : préfixe commun d'au moins 5 caractères ET couvrant au moins
 * 80 % du plus court des deux mots, les deux mots faisant au moins 6
 * caractères. Éprouvée sur le référentiel entier (438 mots significatifs) avant
 * d'être écrite ici, puis de bout en bout sur des comptes-rendus réalistes.
 */
const PREFIXE_MIN = 5;
const COUVERTURE_MIN = 0.8;
const MOT_MIN = 6;

/**
 * Ce que vaut une dérivation reconnue.
 *
 * Au plancher (0,78), un terme court tombait à 38 % de confiance — sous le
 * seuil d'affichage par défaut (40 %) : « Patiente asthmatique » reconnaissait
 * `J45.9` sans jamais le montrer. Une dérivation est pourtant un signal SÛR,
 * plus sûr qu'une ressemblance de trigrammes limite ; 0,9 la place au-dessus du
 * plancher et en dessous d'une correspondance littérale, qui reste la seule à
 * dépasser 62 %.
 *
 * CE QUE ÇA LAISSE PASSER, et il faut le savoir : « gastro » est un synonyme
 * DÉLIBÉRÉ du référentiel (on dit « j'ai la gastro »), et « gastrite » en
 * dérive au sens de cette règle. Un compte-rendu de gastrite propose donc aussi
 * `A09.9`, à ~40 % — sous `K29.7` à 79 %. Aucune formulation ne sépare cette
 * paire de `asthme`/`asthmatique` : elles sont structurellement identiques,
 * seul le lexique les distingue. On préfère une suggestion de trop, classée
 * dernière et rejetable d'un clic, à cinq diagnostics courants jamais
 * reconnus.
 */
const DERIVATION_SIM = 0.9;

function estDerive(a: string, b: string): boolean {
  const court = Math.min(a.length, b.length);
  // Sous six lettres, on n'a plus affaire à un mot mais à un fragment
  // (`lymph`, `septic`) : tout lui ressemble.
  if (court < MOT_MIN) return false;
  let p = 0;
  while (p < a.length && p < b.length && a[p] === b[p]) p++;
  return p >= PREFIXE_MIN && p / court >= COUVERTURE_MIN;
}

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
    for (const { w, tg } of haystack) {
      const sim = trigramSim(twTg, tg);
      if (sim > best) best = sim;
      // Une dérivation compte comme une reconnaissance sûre, sans jamais
      // égaler une correspondance littérale.
      if (best < DERIVATION_SIM && estDerive(tw, w)) best = DERIVATION_SIM;
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
