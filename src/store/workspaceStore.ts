import { create } from 'zustand';
import type {
  AnalysisResult,
  SavedSession,
  ValidatedDiagnostic,
} from '../types/index';
import { MAX_SESSIONS, readSnapshot, updateSnapshot } from '../lib/app-store';

/**
 * Le plan de travail : compte-rendu en cours, suggestions, diagnostics
 * retenus, et les dossiers enregistrés sous un nom.
 *
 * CE QUI EST PERSISTÉ, ET OÙ. Le compte-rendu, les diagnostics retenus et les
 * sessions vivent dans l'instantané versionné (`lib/app-store.ts`) — plus de
 * `localStorage.setItem` à la main, plus de `JSON.parse` défensif recopié.
 * Les suggestions et les rejets, eux, sont VOLONTAIREMENT éphémères : une
 * analyse se relance en une seconde, et rien ne justifie de faire survivre à un
 * rechargement une liste calculée à partir d'un texte qui, lui, a pu changer.
 */

function nouvelIdentifiant(): string {
  return typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 12);
}

export interface SaveSessionResult {
  ok: boolean;
  /** `true` si une session du même nom a été remplacée. */
  replaced: boolean;
}

interface WorkspaceState {
  crText: string;
  suggestions: AnalysisResult[];
  validated: ValidatedDiagnostic[];
  sessions: SavedSession[];
  filterText: string;
  rejectedIds: Set<string>;
  isAnalyzing: boolean;
  analyzeError: string | null;
  setCrText: (text: string) => void;
  appendCrText: (text: string) => void;
  setSuggestions: (results: AnalysisResult[]) => void;
  setIsAnalyzing: (value: boolean) => void;
  setAnalyzeError: (msg: string | null) => void;
  setFilterText: (text: string) => void;
  validateSuggestion: (s: AnalysisResult) => void;
  rejectSuggestion: (id: string) => void;
  removeValidated: (id: string) => void;
  updateValidatedNote: (id: string, note: string) => void;
  resetSession: () => void;
  validateAll: (results: AnalysisResult[]) => void;
  rejectAll: (ids: string[]) => void;
  addManualDiagnostic: (code: string, label: string) => void;
  saveSession: (name: string) => SaveSessionResult;
  openSession: (id: string) => boolean;
  deleteSession: (id: string) => void;
  highlightedMatchedTerm: string | null;
  setHighlightedMatchedTerm: (term: string | null) => void;
}

const initial = readSnapshot();

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  crText: initial.crText,
  suggestions: [],
  validated: initial.validated,
  sessions: initial.sessions,
  filterText: '',
  rejectedIds: new Set(),
  isAnalyzing: false,
  analyzeError: null,

  setCrText: text => {
    updateSnapshot({ crText: text });
    set({ crText: text });
  },
  appendCrText: text => {
    const next = (get().crText + ' ' + text).trim();
    updateSnapshot({ crText: next });
    set({ crText: next });
  },
  setSuggestions: results =>
    set({ suggestions: results, rejectedIds: new Set() }),
  setIsAnalyzing: value => set({ isAnalyzing: value }),
  setAnalyzeError: msg => set({ analyzeError: msg }),
  setFilterText: text => set({ filterText: text }),

  validateSuggestion: s => {
    const validated = get().validated;
    if (validated.some(v => v.code === s.code)) return;
    const next: ValidatedDiagnostic = {
      id: s.id,
      code: s.code,
      label: s.label,
      source: s.source,
      validatedAt: Date.now(),
    };
    const items = [next, ...validated];
    updateSnapshot({ validated: items });
    set({ validated: items });
  },
  rejectSuggestion: id => {
    const next = new Set(get().rejectedIds);
    next.add(id);
    set({ rejectedIds: next });
  },
  removeValidated: id => {
    const items = get().validated.filter(v => v.id !== id);
    updateSnapshot({ validated: items });
    set({ validated: items });
  },
  updateValidatedNote: (id, note) => {
    const items = get().validated.map(v => (v.id === id ? { ...v, note } : v));
    updateSnapshot({ validated: items });
    set({ validated: items });
  },
  resetSession: () => {
    // Les sessions ENREGISTRÉES survivent : « Nouvelle session » vide le plan
    // de travail, il ne jette pas les dossiers mis de côté.
    updateSnapshot({ crText: '', validated: [] });
    set({
      crText: '',
      suggestions: [],
      validated: [],
      rejectedIds: new Set(),
      filterText: '',
      analyzeError: null,
    });
  },
  validateAll: results => {
    const validated = get().validated;
    const existing = new Set(validated.map(v => v.code));
    const additions = results
      .filter(r => !existing.has(r.code))
      .map<ValidatedDiagnostic>(r => ({
        id: r.id,
        code: r.code,
        label: r.label,
        source: r.source,
        validatedAt: Date.now(),
      }));
    const items = [...additions, ...validated];
    updateSnapshot({ validated: items });
    set({ validated: items });
  },
  rejectAll: ids => {
    const next = new Set(get().rejectedIds);
    for (const id of ids) next.add(id);
    set({ rejectedIds: next });
  },
  highlightedMatchedTerm: null,
  setHighlightedMatchedTerm: term => set({ highlightedMatchedTerm: term }),
  addManualDiagnostic: (code, label) => {
    const trimCode = code.trim().toUpperCase();
    const trimLabel = label.trim();
    if (!trimCode || !trimLabel) return;
    const validated = get().validated;
    if (validated.some(v => v.code === trimCode)) return;
    const next: ValidatedDiagnostic = {
      id: nouvelIdentifiant(),
      code: trimCode,
      label: trimLabel,
      source: 'local',
      validatedAt: Date.now(),
    };
    const items = [next, ...validated];
    updateSnapshot({ validated: items });
    set({ validated: items });
  },

  /**
   * Enregistre le plan de travail courant sous un nom.
   *
   * Un nom déjà pris REMPLACE l'entrée existante au lieu d'en créer une
   * seconde : sur cinq places, deux « Mme Martin » à des heures différentes
   * coûteraient deux cinquièmes de l'historique pour un seul dossier. L'appelant
   * reçoit `replaced` pour pouvoir le dire.
   */
  saveSession: name => {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, replaced: false };
    const { crText, validated, sessions } = get();
    const lower = trimmed.toLocaleLowerCase();
    const existante = sessions.find(s => s.name.toLocaleLowerCase() === lower);
    const entry: SavedSession = {
      id: existante?.id ?? nouvelIdentifiant(),
      name: trimmed,
      savedAt: Date.now(),
      crText,
      validated,
    };
    const next = [entry, ...sessions.filter(s => s.id !== entry.id)].slice(
      0,
      MAX_SESSIONS
    );
    updateSnapshot({ sessions: next });
    set({ sessions: next });
    return { ok: true, replaced: existante !== undefined };
  },

  /**
   * Rouvre un dossier : le compte-rendu et les diagnostics retenus REMPLACENT
   * le plan de travail. Les suggestions sont vidées — elles ont été calculées
   * sur l'autre texte, les garder afficherait des codes venus d'un autre
   * patient.
   */
  openSession: id => {
    const session = get().sessions.find(s => s.id === id);
    if (!session) return false;
    updateSnapshot({
      crText: session.crText,
      validated: session.validated,
    });
    set({
      crText: session.crText,
      validated: session.validated,
      suggestions: [],
      rejectedIds: new Set(),
      filterText: '',
      analyzeError: null,
    });
    return true;
  },

  deleteSession: id => {
    const next = get().sessions.filter(s => s.id !== id);
    updateSnapshot({ sessions: next });
    set({ sessions: next });
  },
}));
