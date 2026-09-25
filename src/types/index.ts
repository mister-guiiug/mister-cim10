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
}

export interface ValidatedDiagnostic {
  id: string;
  code: string;
  label: string;
  note?: string;
  validatedAt: number;
  /** Référentiel d'origine : 'local' = CIM-10 embarqué, 'api' = OMS CIM-11. */
  source?: 'local' | 'api';
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

export type AppRoute = 'home' | 'parametres' | 'aide';
