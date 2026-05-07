import { create } from 'zustand';
import type { AnalysisResult, ValidatedDiagnostic } from '../types/index';
import { LS_KEYS } from '../lib/constants';

interface WorkspaceState {
  crText: string;
  suggestions: AnalysisResult[];
  validated: ValidatedDiagnostic[];
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
}

function loadValidated(): ValidatedDiagnostic[] {
  try {
    const raw = localStorage.getItem(LS_KEYS.VALIDATED);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v): v is ValidatedDiagnostic =>
        typeof v === 'object' &&
        v !== null &&
        'code' in v &&
        'label' in v &&
        'id' in v
    );
  } catch {
    return [];
  }
}

function persistValidated(items: ValidatedDiagnostic[]): void {
  try {
    localStorage.setItem(LS_KEYS.VALIDATED, JSON.stringify(items));
  } catch {
    /* quota exceeded */
  }
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  crText: localStorage.getItem(LS_KEYS.CR_TEXT) || '',
  suggestions: [],
  validated: loadValidated(),
  filterText: '',
  rejectedIds: new Set(),
  isAnalyzing: false,
  analyzeError: null,

  setCrText: text => {
    localStorage.setItem(LS_KEYS.CR_TEXT, text);
    set({ crText: text });
  },
  appendCrText: text => {
    const next = (get().crText + ' ' + text).trim();
    localStorage.setItem(LS_KEYS.CR_TEXT, next);
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
      validatedAt: Date.now(),
    };
    const items = [next, ...validated];
    persistValidated(items);
    set({ validated: items });
  },
  rejectSuggestion: id => {
    const next = new Set(get().rejectedIds);
    next.add(id);
    set({ rejectedIds: next });
  },
  removeValidated: id => {
    const items = get().validated.filter(v => v.id !== id);
    persistValidated(items);
    set({ validated: items });
  },
  updateValidatedNote: (id, note) => {
    const items = get().validated.map(v => (v.id === id ? { ...v, note } : v));
    persistValidated(items);
    set({ validated: items });
  },
  resetSession: () => {
    localStorage.removeItem(LS_KEYS.CR_TEXT);
    persistValidated([]);
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
        validatedAt: Date.now(),
      }));
    const items = [...additions, ...validated];
    persistValidated(items);
    set({ validated: items });
  },
  rejectAll: ids => {
    const next = new Set(get().rejectedIds);
    for (const id of ids) next.add(id);
    set({ rejectedIds: next });
  },
}));
