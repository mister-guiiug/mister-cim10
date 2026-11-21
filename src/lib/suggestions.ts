import { icdEntries } from '../icd10-data.js';
import type { AnalysisResult } from '../types/index';
import {
  fuzzyTermMatch,
  getSearchIndex,
  normalizeForMatch,
  randomId,
  trigrams,
} from './analyzer';

/*
 * LE MOTEUR DE LECTURE D'UN COMPTE-RENDU, dans son propre module parce qu'il
 * n'est utile qu'au clic sur « Analyser ». Logé dans `analyzer.ts`, il
 * entrait dans le morceau d'entrée — que la recherche de codes charge
 * d'emblée — et faisait passer le préchargé à 187,5 kB pour un budget de
 * 188 (mesuré le 21/11/2026, 184,2 kB sur main). `HomePage` le charge à la
 * demande, et au repos avant ; hors ligne, il vient du précache comme le
 * reste. Les briques communes (normalisation, trigrammes, index) restent
 * dans `analyzer.ts`, partagées avec la recherche.
 */

interface IcdEntry {
  code: string;
  label: string;
  synonyms?: string[];
}

/* -------------------------------------------------------------------------
 * LIRE UN COMPTE-RENDU, PAS UNE CHAÎNE DE CARACTÈRES.
 *
 * Relevé le 21/11/2026 sur la version en ligne, phrase par phrase :
 *
 *   « Fibrillation auriculaire paroxystique. »  → I48.0, et C91.0 (leucémie)
 *   « Installation de la patiente en chambre. » → C91.0 (leucémie)
 *   « Diabète de type 2 sous metformine. »      → E11.9, et E10.9 (type 1)
 *   « Pas de fièvre. »                          → R50.9 (fièvre) à 70 %
 *   « Antécédent d'insuffisance cardiaque. »    → I50.0 à 94 %, comme actuelle
 *
 * Trois causes, une par famille d'erreurs :
 *
 *  1. LA CORRESPONDANCE ÉTAIT UNE SOUS-CHAÎNE. `text.includes('lla')` trouve
 *     le synonyme de C91.0 dans « fibri-lla-tion » et « insta-lla-tion » ; le
 *     bonus « mot entier » ne faisait que le classer un peu plus bas. Un terme
 *     se reconnaît désormais MOT À MOT, pluriel admis.
 *  2. L'APPROCHÉ JETAIT LES CHIFFRES. Les mots de moins de quatre lettres en
 *     sont écartés — « type 1 » devenait « type », que « type 2 » contient. Un
 *     chiffre (ou un numéral romain) d'un terme doit maintenant figurer TEL
 *     QUEL, à côté du mot qui le précède dans le terme.
 *  3. AUCUN CONTEXTE. La ponctuation était effacée avant toute lecture : ni la
 *     phrase, ni la négation, ni l'antécédent n'existaient plus. Le texte est
 *     maintenant découpé en phrases puis en propositions, et chaque mention
 *     porte son contexte — niée (elle disparaît), antécédent ou familiale
 *     (elle reste, signalée et classée plus bas).
 *
 * CE QUE ÇA NE FAIT PAS. Ce n'est pas un analyseur syntaxique : la négation
 * se lit dans une fenêtre de mots avant (« pas de », « sans », « absence
 * de »…) et après (« éliminée », « exclue »…) la mention, dans sa
 * proposition — la règle de NegEx, adaptée au français des comptes-rendus.
 * « Pas de fièvre et une toux » nie aussi la toux ; une virgule, un « mais »
 * ou un point arrêtent la portée. Le doute (« suspicion de ») n'est pas lu :
 * il se code autrement, et c'est au professionnel d'en décider.
 * ---------------------------------------------------------------------- */

/** Contexte d'une mention qui n'est pas affirmée au présent. */
export type ContexteMention = 'antecedent' | 'familial';

type Contexte = 'affirme' | ContexteMention;

const RANG_CONTEXTE: Record<Contexte, number> = {
  affirme: 0,
  antecedent: 1,
  familial: 2,
};

const plusFort = (a: Contexte, b: Contexte): Contexte =>
  RANG_CONTEXTE[a] >= RANG_CONTEXTE[b] ? a : b;

const plusActuel = (a: Contexte, b: Contexte): Contexte =>
  RANG_CONTEXTE[a] <= RANG_CONTEXTE[b] ? a : b;

/**
 * Ce que vaut une mention qui n'est pas actuelle. Un antécédent se code
 * encore (souvent en diagnostic associé) : il reste visible au seuil par
 * défaut. Une maladie de la mère n'est pas celle du patient : elle tombe
 * presque toujours sous le seuil, sans disparaître.
 */
const FACTEUR_CONTEXTE: Record<Contexte, number> = {
  affirme: 1,
  antecedent: 0.75,
  familial: 0.5,
};

/** Négation AVANT la mention : « pas de fièvre », « sans diabète »… */
const NEGATIONS_AVANT = new Set([
  'pas',
  'sans',
  'aucun',
  'aucune',
  'aucuns',
  'aucunes',
  'ni',
  'nie',
  'nient',
  'niant',
  'absence',
  'jamais',
  'non',
]);

/** Négation APRÈS la mention : « embolie pulmonaire éliminée »… */
const NEGATIONS_APRES = new Set([
  'elimine',
  'eliminee',
  'elimines',
  'eliminees',
  'exclu',
  'exclue',
  'exclus',
  'exclues',
  'ecarte',
  'ecartee',
  'ecartes',
  'ecartees',
  'absent',
  'absente',
  'absents',
  'absentes',
  'negatif',
  'negative',
  'negatifs',
  'negatives',
]);

/** « sans doute », « non seulement » : la forme d'une négation, pas le sens. */
const APRES_FAUSSE_NEGATION = new Set(['doute', 'seulement', 'uniquement']);

const FENETRE_AVANT = 6;
const FENETRE_APRES = 3;

/**
 * Ce qui coupe une proposition en deux : la négation de l'une ne passe pas à
 * l'autre (« pas de fièvre MAIS une toux »).
 */
const CONJONCTIONS = new Set([
  'mais',
  'cependant',
  'toutefois',
  'sauf',
  'excepte',
  'hormis',
  'neanmoins',
  'pourtant',
]);

/** Ouvre un antécédent jusqu'à la fin de la phrase. */
const ANTECEDENT_LONG = new Set(['antecedent', 'antecedents', 'atcd', 'atcds']);
/** Ouvre un antécédent jusqu'à la fin de la proposition : « ancien fumeur ». */
const ANTECEDENT_COURT = new Set([
  'ancien',
  'ancienne',
  'anciens',
  'anciennes',
]);
/** Ouvre une mention familiale jusqu'à la fin de la phrase. */
const FAMILIAL_LONG = new Set([
  'familial',
  'familiale',
  'familiaux',
  'familiales',
]);
/**
 * Rend familiale TOUTE la proposition, avant comme après : « mère
 * diabétique », « cancer du sein chez sa mère ». Ni « fils » ni « fille » :
 * « jeune fille de 16 ans, asthmatique » parle de la patiente.
 */
const FAMILIAL_PROPOSITION = new Set([
  'mere',
  'pere',
  'frere',
  'freres',
  'soeur',
  'soeurs',
  'parents',
  'fratrie',
  'oncle',
  'tante',
  'cousin',
  'cousine',
]);
/** Ce qui ramène au présent : « ATCD d'IDM, CONSULTE pour dyspnée ». */
const RETOUR_AU_PRESENT = new Set([
  'mais',
  'actuellement',
  'jour',
  'hui',
  'motif',
  'admis',
  'admise',
  'hospitalise',
  'hospitalisee',
  'consulte',
  'consultant',
  'adresse',
  'adressee',
  'presente',
  'presentant',
]);

/** Un mot du texte, avec ce qu'il faut pour le lire en contexte. */
interface Jeton {
  w: string;
  /** Trigrammes, pour l'approché (mots de trois lettres et plus). */
  tg: Set<string> | null;
  /** Proposition : la négation n'en sort pas. */
  proposition: number;
  contexte: Contexte;
  /** Position dans le texte d'origine, pour montrer l'extrait exact. */
  debut: number;
  fin: number;
}

/** Une ligne « Antécédents : » seule ouvre une section de plusieurs lignes. */
const EN_TETE = /^\s*(?![-*•·])([^:\n]{2,40}?)\s*:\s*(.*)$/;

function contexteEnTete(libelle: string): Contexte | null {
  const mots = normalizeForMatch(libelle).split(' ');
  if (mots.length > 5) return null;
  if (mots.some(m => FAMILIAL_LONG.has(m))) return 'familial';
  if (mots.some(m => ANTECEDENT_LONG.has(m))) return 'antecedent';
  return null;
}

/** Une phrase s'arrête sur . ! ? ; suivis d'un blanc — pas dans « I48.0 ». */
const FIN_DE_PHRASE = /[.!?;]+(?=\s|$)/;

/**
 * Découpe le texte en phrases de jetons, chaque jeton portant sa proposition
 * et son contexte.
 */
function lirePhrases(texte: string): Jeton[][] {
  const phrases: Jeton[][] = [];
  let section: Contexte = 'affirme';
  let decalage = 0;

  for (const ligne of texte.split('\n')) {
    const debutLigne = decalage;
    decalage += ligne.length + 1;
    if (ligne.trim() === '') {
      section = 'affirme';
      continue;
    }
    const enTete = EN_TETE.exec(ligne);
    if (enTete) {
      // Toute en-tête ferme la section précédente ; une en-tête SEULE sur sa
      // ligne (« Antécédents : ») en ouvre une sur les lignes qui suivent.
      const ctx = contexteEnTete(enTete[1] ?? '');
      section = (enTete[2] ?? '').trim() === '' && ctx ? ctx : 'affirme';
    }

    let reste = ligne;
    let origine = debutLigne;
    while (reste.length > 0) {
      const fin = FIN_DE_PHRASE.exec(reste);
      const longueur = fin ? fin.index + fin[0].length : reste.length;
      const phrase = lireJetons(reste.slice(0, longueur), origine, section);
      if (phrase.length > 0) phrases.push(phrase);
      reste = reste.slice(longueur);
      origine += longueur;
    }
  }
  return phrases;
}

function lireJetons(phrase: string, origine: number, base: Contexte): Jeton[] {
  const jetons: Jeton[] = [];
  let proposition = 0;
  let dernierSeparateur = -1;
  const mot = /[\p{L}\p{N}]+|[,()[\]]/gu;
  for (let m = mot.exec(phrase); m !== null; m = mot.exec(phrase)) {
    if (/^[,()[\]]$/.test(m[0])) {
      if (dernierSeparateur !== jetons.length) proposition++;
      dernierSeparateur = jetons.length;
      continue;
    }
    // Un mot brut peut donner plusieurs jetons (« aujourd'hui » n'en est pas
    // un : l'apostrophe sépare déjà) ; il les donne tous à la même position.
    for (const w of normalizeForMatch(m[0]).split(' ')) {
      if (w === '') continue;
      if (CONJONCTIONS.has(w)) proposition++;
      jetons.push({
        w,
        tg: w.length >= 3 ? trigrams(w) : null,
        proposition,
        contexte: base,
        debut: origine + m.index,
        fin: origine + m.index + m[0].length,
      });
    }
  }

  // Les mentions familiales « de proposition » valent dans les deux sens.
  const familiales = new Set(
    jetons.filter(j => FAMILIAL_PROPOSITION.has(j.w)).map(j => j.proposition)
  );
  let portee: Contexte = base;
  let courte = -1;
  for (const j of jetons) {
    if (RETOUR_AU_PRESENT.has(j.w)) portee = base;
    if (ANTECEDENT_LONG.has(j.w)) portee = plusFort(portee, 'antecedent');
    if (FAMILIAL_LONG.has(j.w)) portee = 'familial';
    if (ANTECEDENT_COURT.has(j.w)) courte = j.proposition;
    let ctx = portee;
    if (courte === j.proposition) ctx = plusFort(ctx, 'antecedent');
    if (familiales.has(j.proposition)) ctx = 'familial';
    j.contexte = ctx;
  }
  return jetons;
}

/** Le mot du texte est-il le mot du terme, au pluriel près ? */
function memeMot(texte: string, terme: string): boolean {
  if (texte === terme) return true;
  if (terme.length < 3 || /\d/.test(terme) || /\d/.test(texte)) return false;
  return (
    texte === `${terme}s` ||
    texte === `${terme}x` ||
    terme === `${texte}s` ||
    (terme.endsWith('al') && texte === `${terme.slice(0, -2)}aux`)
  );
}

/** Les mots d'un terme qui ne disent rien de la maladie. */
const MOTS_VIDES = new Set([
  'a',
  'au',
  'aux',
  'd',
  'de',
  'des',
  'du',
  'en',
  'et',
  'l',
  'la',
  'le',
  'les',
  'ou',
  'par',
  'sur',
  'un',
  'une',
]);

/**
 * Un mot du terme qui doit figurer TEL QUEL dans le texte : un chiffre, un
 * numéral romain, ou un mot court qui n'est pas vide — une abréviation
 * (« tb », « orl »), un « non ». Les trigrammes ne savent pas les comparer, et
 * les ignorer réduisait « tb pulmonaire » à « pulmonaire » : un œdème
 * pulmonaire proposait la tuberculose.
 */
function estMotExact(w: string): boolean {
  return /^(\d+|i|ii|iii|iv)$/.test(w) || (w.length <= 3 && !MOTS_VIDES.has(w));
}

interface Mention {
  positions: number[];
}

/** Le terme apparaît-il mot à mot dans la phrase ? Rend chaque occurrence. */
function mentionsLitterales(termes: string[], phrase: Jeton[]): Mention[] {
  const out: Mention[] = [];
  const n = termes.length;
  for (let i = 0; i + n <= phrase.length; i++) {
    let ok = true;
    for (let k = 0; k < n && ok; k++)
      ok = memeMot(phrase[i + k]!.w, termes[k]!);
    if (ok) out.push({ positions: Array.from({ length: n }, (_, k) => i + k) });
  }
  return out;
}

/**
 * Correspondance approchée d'un terme dans UNE phrase : chaque mot
 * significatif doit y trouver un répondant (cf. `fuzzyTermMatch`), et chaque
 * mot exact — chiffre, numéral — doit suivre de près le mot qui le précède
 * dans le terme : « type 1 » ne répond plus à « type 2 ».
 */
function mentionApprochee(
  termes: string[],
  phrase: Jeton[]
): (Mention & { avgSim: number }) | null {
  const haystack: { w: string; tg: Set<string>; i: number }[] = [];
  phrase.forEach((j, i) => {
    if (j.tg) haystack.push({ w: j.w, tg: j.tg, i });
  });
  const significatifs = termes
    .map((w, k) => ({ w, k }))
    .filter(x => x.w.length >= 4 && !estMotExact(x.w));
  if (significatifs.length === 0) return null;
  const r = fuzzyTermMatch(
    significatifs.map(x => x.w),
    haystack
  );
  if (r === null) return null;

  const position = new Map<number, number>();
  significatifs.forEach((x, idx) => position.set(x.k, r.positions[idx]!));
  const positions = [...r.positions];
  for (let k = 0; k < termes.length; k++) {
    if (!estMotExact(termes[k]!)) continue;
    const avant = [...position.keys()].filter(x => x < k).pop();
    const apres = [...position.keys()].find(x => x > k);
    const q =
      avant !== undefined
        ? position.get(avant)!
        : apres !== undefined
          ? position.get(apres)!
          : undefined;
    if (q === undefined) return null;
    const candidats = avant !== undefined ? [q + 1, q + 2] : [q - 1, q - 2];
    const trouve = candidats.find(
      p =>
        phrase[p]?.w === termes[k] &&
        phrase[p]?.proposition === phrase[q]?.proposition
    );
    if (trouve === undefined) return null;
    positions.push(trouve);
  }
  return { positions, avgSim: r.avgSim };
}

/** La mention est-elle niée, dans sa proposition ? */
function estNiee(m: Mention, phrase: Jeton[]): boolean {
  const dedans = new Set(m.positions);
  for (const q of m.positions) {
    const prop = phrase[q]!.proposition;
    for (let p = Math.max(0, q - FENETRE_AVANT); p < q; p++) {
      const j = phrase[p]!;
      if (dedans.has(p) || j.proposition !== prop) continue;
      if (!NEGATIONS_AVANT.has(j.w)) continue;
      if (APRES_FAUSSE_NEGATION.has(phrase[p + 1]?.w ?? '')) continue;
      return true;
    }
    for (let p = q + 1; p <= q + FENETRE_APRES && p < phrase.length; p++) {
      const j = phrase[p]!;
      if (dedans.has(p) || j.proposition !== prop) continue;
      if (NEGATIONS_APRES.has(j.w)) return true;
      // « Tabac : non. » — mais pas « HTA non contrôlée ».
      const dernier =
        p === phrase.length - 1 || phrase[p + 1]!.proposition !== prop;
      if (j.w === 'non' && dernier) return true;
    }
  }
  return false;
}

/** L'extrait du texte d'origine, pour le montrer et le surligner. */
function extraitDe(m: Mention, phrase: Jeton[], texte: string): string {
  const debut = Math.min(...m.positions.map(p => phrase[p]!.debut));
  const fin = Math.max(...m.positions.map(p => phrase[p]!.fin));
  return texte.slice(debut, fin);
}

interface MeilleureMention {
  terme: string;
  score: number;
  contexte: Contexte;
  extrait: string;
}

/**
 * Garde, pour un code, la mention la plus forte NON NIÉE, et le contexte le
 * plus actuel parmi toutes ses mentions : « pas de fièvre hier, fièvre à 39
 * ce jour » propose la fièvre, actuelle.
 */
function retenir(
  courante: MeilleureMention | null,
  candidate: MeilleureMention
): MeilleureMention {
  if (courante === null) return candidate;
  const meilleure = candidate.score > courante.score ? candidate : courante;
  return {
    ...meilleure,
    contexte: plusActuel(courante.contexte, candidate.contexte),
  };
}

export function suggestFromText(rawText: string): AnalysisResult[] {
  const text = normalizeForMatch(rawText);
  if (text.length < 2) return [];

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
  const phrases = lirePhrases(rawText);
  const hits: AnalysisResult[] = [];

  for (const entry of getSearchIndex()) {
    let litterale: MeilleureMention | null = null;
    let approchee: (MeilleureMention & { avgSim: number }) | null = null;

    for (const term of entry.terms) {
      for (const phrase of phrases) {
        const trouvees = mentionsLitterales(term.tokens, phrase);
        for (const m of trouvees) {
          if (estNiee(m, phrase)) continue;
          const t = term.text;
          litterale = retenir(litterale, {
            terme: t,
            score: t.length * 8 + 15 + (t.length >= 12 ? 20 : 0),
            contexte: phrase[m.positions[0]!]!.contexte,
            extrait: extraitDe(m, phrase, rawText),
          });
        }
        // L'approché ne sert qu'à défaut d'une correspondance mot à mot.
        if (trouvees.length > 0 || litterale !== null) continue;
        const m = mentionApprochee(term.tokens, phrase);
        if (m === null || estNiee(m, phrase)) continue;
        const candidate = {
          terme: term.text,
          score: term.text.length * 6 * m.avgSim,
          contexte: phrase[Math.min(...m.positions)]!.contexte,
          extrait: extraitDe(m, phrase, rawText),
          avgSim: m.avgSim,
        };
        approchee =
          approchee === null
            ? candidate
            : {
                ...(candidate.avgSim > approchee.avgSim
                  ? candidate
                  : approchee),
                contexte: plusActuel(approchee.contexte, candidate.contexte),
              };
      }
    }

    const retenue = litterale ?? approchee;
    if (retenue === null) continue;
    const facteur = FACTEUR_CONTEXTE[retenue.contexte];
    const confidence =
      litterale !== null
        ? Math.min(0.94, 0.35 + retenue.score / 180)
        : Math.min(0.62, 0.22 + retenue.score / 180);
    hits.push({
      id: randomId(),
      code: entry.code,
      label: entry.label,
      matchedTerm: retenue.terme,
      extrait: retenue.extrait,
      score: retenue.score * facteur,
      confidence: confidence * facteur,
      source: 'local',
      ...(retenue.contexte === 'affirme' ? {} : { contexte: retenue.contexte }),
    });
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
