/**
 * Types centraux de l'application.
 */

export interface ICD10Code {
  code: string;
  label: string;
  synonyms?: string[];
}

export interface AnalysisResult {
  id: string;
  code: string;
  label: string;
  matchedTerm: string;
  score: number;
  confidence: number;
  source?: 'local' | 'api';
  /**
   * Le passage du compte-rendu qui a répondu, tel qu'écrit (accents, casse) :
   * c'est lui qu'on montre et qu'on surligne. `matchedTerm` est le terme du
   * référentiel, normalisé — introuvable tel quel dans « Diabète ».
   */
  extrait?: string;
  /**
   * La mention n'est pas actuelle : antécédent du patient, ou maladie d'un
   * proche. Absent = affirmée au présent. Une mention NIÉE ne devient pas une
   * suggestion du tout.
   */
  contexte?: 'antecedent' | 'familial';
}

/**
 * Rôle d'un diagnostic dans le résumé d'hospitalisation (PMSI) : diagnostic
 * principal, relié, ou associé significatif. Un seul DP et un seul DR par
 * résumé ; les autres sont des DAS.
 */
export type RolePmsi = 'dp' | 'dr' | 'das';

export interface ValidatedDiagnostic {
  id: string;
  code: string;
  label: string;
  note?: string;
  validatedAt: number;
  /** Référentiel d'origine : 'local' = CIM-10 embarqué, 'api' = OMS CIM-11. */
  source?: 'local' | 'api';
  /** Rôle PMSI ; absent = DAS (cf. `lib/pmsi.ts`). */
  role?: RolePmsi;
}

/**
 * Un code mis en favori. Le libellé est gardé avec lui : c'est ce qui permet de
 * l'ajouter aux diagnostics retenus en un geste, sans aller le rechercher — et
 * un code CIM-11 n'a de toute façon pas de référentiel embarqué où le relire.
 */
export interface FavoriteCode {
  code: string;
  label: string;
  /** Référentiel d'origine, comme pour un diagnostic retenu. */
  source: 'local' | 'api';
  /** Horodatage de la mise en favori (ms). */
  addedAt: number;
}

/**
 * Un dossier enregistré sous un nom : le compte-rendu et les diagnostics
 * retenus, figés au moment de l'enregistrement. Rouvrir une session remplace
 * le plan de travail courant — elle n'est pas un journal d'actions.
 */
export interface SavedSession {
  id: string;
  name: string;
  /** Horodatage de l'enregistrement (ms). */
  savedAt: number;
  crText: string;
  validated: ValidatedDiagnostic[];
}

export interface WhoSettings {
  clientId: string;
  clientSecret: string;
  proxyUrl: string;
  releaseId: string;
  lang: string;
}

/**
 * Référentiel affiché en tête des suggestions. Les deux restent interrogés ;
 * seul l'ordre change. Défaut produit : `'api'` (CIM-11 OMS, puis CIM-10 local).
 */
export type SourcePriority = 'api' | 'local';

export type AppRoute = 'home' | 'parametres' | 'aide';
