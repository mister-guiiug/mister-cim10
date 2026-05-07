/**
 * Types centraux de l'application.
 */

export type AnalyzeMode = 'local' | 'api' | 'both';

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
}

export interface WhoSettings {
  clientId: string;
  clientSecret: string;
  proxyUrl: string;
  releaseId: string;
  lang: string;
}

export interface AnalyzeSettings extends WhoSettings {
  mode: AnalyzeMode;
  minConfidence: number;
}

export type AppRoute = 'home' | 'parametres' | 'aide';
