import { create } from 'zustand';
import type {
  AnalysisResult,
  FavoriteCode,
  SavedSession,
  ValidatedDiagnostic,
} from '../types/index';
import { MAX_SESSIONS, readSnapshot, updateSnapshot } from '../lib/app-store';
import { deplacer, remplacer } from '../lib/diagnostics';
import { basculerFavori, type ResultatBascule } from '../lib/favoris';
import {
  annuler,
  enregistrer,
  historiqueVide,
  retablir,
  type EntreeHistorique,
  type Historique,
} from '../lib/historique';

/**
 * Le plan de travail : compte-rendu en cours, suggestions, diagnostics
 * retenus, et les dossiers enregistrés sous un nom.
 *
 * CE QUI EST PERSISTÉ, ET OÙ. Le compte-rendu, les diagnostics retenus, les
 * sessions et les favoris vivent dans l'instantané versionné
 * (`lib/app-store.ts`) — plus de `localStorage.setItem` à la main, plus de
 * `JSON.parse` défensif recopié. Les suggestions et les rejets, eux, sont
 * VOLONTAIREMENT éphémères : une analyse se relance en une seconde, et rien ne
 * justifie de faire survivre à un rechargement une liste calculée à partir
 * d'un texte qui, lui, a pu changer. L'historique d'annulation aussi : il
 * décrit des gestes de la séance, pas des données.
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

/** Ce qui s'est passé sur la liste des retenus — de quoi l'annoncer. */
export type OperationRetenus =
  | { type: 'ajout'; codes: string[] }
  | { type: 'retrait'; code: string }
  | { type: 'modification'; ancien: string; nouveau: string }
  | { type: 'note'; code: string }
  | { type: 'deplacement'; code: string; position: number }
  | { type: 'vidage'; nombre: number };

export type EntreeRetenus = EntreeHistorique<
  ValidatedDiagnostic[],
  OperationRetenus
>;

/** Ce qu'on corrige d'un diagnostic retenu avec « Modifier ». */
export interface CorrectionDiagnostic {
  code: string;
  label: string;
}

interface WorkspaceState {
  crText: string;
  suggestions: AnalysisResult[];
  validated: ValidatedDiagnostic[];
  sessions: SavedSession[];
  favorites: FavoriteCode[];
  /**
   * Annuler / rétablir, sur les diagnostics retenus SEULEMENT. Le compte-rendu
   * n'y est pas : il a l'annulation native de sa zone de texte, et un
   * « Annuler » qui remettrait du texte écraserait ce qui a été tapé depuis.
   */
  historique: Historique<ValidatedDiagnostic[], OperationRetenus>;
  filterText: string;
  rejectedIds: Set<string>;
  isAnalyzing: boolean;
  analyzeError: string | null;
  /**
   * Ce que l'analyse a d'AUTRE à dire qu'une erreur : le dictionnaire local a
   * répondu seul, et pourquoi. Canal distinct parce que ce n'en est PAS une :
   * l'IHM le rend en `role="status"`, là où `analyzeError` est une `role="alert"`.
   * Confondre les deux ferait crier un lecteur d'écran sur un repli normal.
   */
  analyzeNotice: string | null;
  setCrText: (text: string) => void;
  appendCrText: (text: string) => void;
  setSuggestions: (results: AnalysisResult[]) => void;
  setIsAnalyzing: (value: boolean) => void;
  setAnalyzeError: (msg: string | null) => void;
  setAnalyzeNotice: (msg: string | null) => void;
  setFilterText: (text: string) => void;
  validateSuggestion: (s: AnalysisResult) => void;
  rejectSuggestion: (id: string) => void;
  removeValidated: (id: string) => void;
  updateValidatedNote: (id: string, note: string) => void;
  /**
   * Corrige le code et le libellé d'un diagnostic retenu, À SA PLACE. `false`
   * si la correction est refusée (vide, ou code déjà retenu ailleurs).
   */
  editValidated: (id: string, correction: CorrectionDiagnostic) => boolean;
  /** Déplace d'une place ; rend la nouvelle position (1 = en tête) ou `null`. */
  moveValidated: (id: string, delta: -1 | 1) => number | null;
  /** Vide la liste des retenus — annulable. Rend le nombre de codes retirés. */
  clearValidated: () => number;
  /** Annule le dernier geste sur les retenus ; `null` s'il n'y en a pas. */
  undo: () => EntreeRetenus | null;
  /** Rétablit le dernier geste annulé ; `null` s'il n'y en a pas. */
  redo: () => EntreeRetenus | null;
  toggleFavorite: (favori: Omit<FavoriteCode, 'addedAt'>) => ResultatBascule;
  resetSession: () => void;
  validateAll: (results: AnalysisResult[]) => void;
  rejectAll: (ids: string[]) => void;
  addManualDiagnostic: (
    code: string,
    label: string,
    source?: 'local' | 'api'
  ) => void;
  saveSession: (name: string) => SaveSessionResult;
  openSession: (id: string) => boolean;
  deleteSession: (id: string) => void;
  highlightedMatchedTerm: string | null;
  setHighlightedMatchedTerm: (term: string | null) => void;
}

const initial = readSnapshot();

export const useWorkspaceStore = create<WorkspaceState>((set, get) => {
  /**
   * LE SEUL CHEMIN PAR LEQUEL LA LISTE DES RETENUS CHANGE — hors changement de
   * dossier. L'historique garde des instantanés et « Annuler » remet l'état
   * d'avant en bloc : une modification qui passerait à côté serait effacée au
   * premier « Annuler » venu.
   */
  const appliquer = (
    items: ValidatedDiagnostic[],
    operation: OperationRetenus
  ): void => {
    const avant = get().validated;
    updateSnapshot({ validated: items });
    set({
      validated: items,
      historique: enregistrer(get().historique, {
        avant,
        apres: items,
        operation,
      }),
    });
  };

  return {
    crText: initial.crText,
    suggestions: [],
    validated: initial.validated,
    sessions: initial.sessions,
    favorites: initial.favorites,
    historique: historiqueVide(),
    filterText: '',
    rejectedIds: new Set(),
    isAnalyzing: false,
    analyzeError: null,
    analyzeNotice: null,

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
    setAnalyzeNotice: msg => set({ analyzeNotice: msg }),
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
      appliquer([next, ...validated], { type: 'ajout', codes: [s.code] });
    },
    rejectSuggestion: id => {
      const next = new Set(get().rejectedIds);
      next.add(id);
      set({ rejectedIds: next });
    },
    removeValidated: id => {
      const retire = get().validated.find(v => v.id === id);
      if (!retire) return;
      appliquer(
        get().validated.filter(v => v.id !== id),
        { type: 'retrait', code: retire.code }
      );
    },
    updateValidatedNote: (id, note) => {
      const cible = get().validated.find(v => v.id === id);
      // Quitter le champ sans rien changer n'est pas un geste : sans cette
      // garde, chaque passage du focus empilerait une « modification » que
      // « Annuler » devrait défaire pour rien.
      if (!cible || (cible.note ?? '') === note) return;
      const items = remplacer(get().validated, id, { note });
      if (items) appliquer(items, { type: 'note', code: cible.code });
    },
    editValidated: (id, correction) => {
      const code = correction.code.trim().toUpperCase();
      const label = correction.label.trim();
      const cible = get().validated.find(v => v.id === id);
      if (!cible || !code || !label) return false;
      if (get().validated.some(v => v.id !== id && v.code === code)) {
        return false;
      }
      const items = remplacer(get().validated, id, { code, label });
      // Rien de changé : la correction est acceptée, il n'y a juste rien à
      // retenir dans l'historique.
      if (items) {
        appliquer(items, {
          type: 'modification',
          ancien: cible.code,
          nouveau: code,
        });
      }
      return true;
    },
    moveValidated: (id, delta) => {
      const items = deplacer(get().validated, id, delta);
      if (!items) return null;
      const position = items.findIndex(v => v.id === id) + 1;
      const code = items[position - 1]?.code ?? '';
      appliquer(items, { type: 'deplacement', code, position });
      return position;
    },
    clearValidated: () => {
      const nombre = get().validated.length;
      if (nombre > 0) appliquer([], { type: 'vidage', nombre });
      return nombre;
    },
    undo: () => {
      const resultat = annuler(get().historique);
      if (!resultat) return null;
      updateSnapshot({ validated: resultat.entree.avant });
      set({
        validated: resultat.entree.avant,
        historique: resultat.historique,
      });
      return resultat.entree;
    },
    redo: () => {
      const resultat = retablir(get().historique);
      if (!resultat) return null;
      updateSnapshot({ validated: resultat.entree.apres });
      set({
        validated: resultat.entree.apres,
        historique: resultat.historique,
      });
      return resultat.entree;
    },
    toggleFavorite: favori => {
      const { favoris, resultat } = basculerFavori(get().favorites, favori);
      if (resultat !== 'plein') {
        updateSnapshot({ favorites: favoris });
        set({ favorites: favoris });
      }
      return resultat;
    },
    resetSession: () => {
      // Les sessions ENREGISTRÉES survivent : « Nouvelle session » vide le plan
      // de travail, il ne jette pas les dossiers mis de côté.
      //
      // L'HISTORIQUE, LUI, EST VIDÉ. « Nouvelle session », c'est passer au
      // patient suivant : un Ctrl+Z tapé une heure plus tard ramènerait les
      // diagnostics du précédent dans le dossier de celui-ci. La confirmation
      // qui précède ce geste en tient lieu d'annulation.
      updateSnapshot({ crText: '', validated: [] });
      set({
        crText: '',
        suggestions: [],
        validated: [],
        historique: historiqueVide(),
        rejectedIds: new Set(),
        filterText: '',
        analyzeError: null,
        analyzeNotice: null,
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
      if (additions.length === 0) return;
      // UN GESTE, UNE ENTRÉE : « Valider filtrées » s'annule d'un coup, comme
      // il s'est fait.
      appliquer([...additions, ...validated], {
        type: 'ajout',
        codes: additions.map(a => a.code),
      });
    },
    rejectAll: ids => {
      const next = new Set(get().rejectedIds);
      for (const id of ids) next.add(id);
      set({ rejectedIds: next });
    },
    highlightedMatchedTerm: null,
    setHighlightedMatchedTerm: term => set({ highlightedMatchedTerm: term }),
    addManualDiagnostic: (code, label, source = 'local') => {
      const trimCode = code.trim().toUpperCase();
      const trimLabel = label.trim();
      if (!trimCode || !trimLabel) return;
      const validated = get().validated;
      if (validated.some(v => v.code === trimCode)) return;
      const next: ValidatedDiagnostic = {
        id: nouvelIdentifiant(),
        code: trimCode,
        label: trimLabel,
        source,
        validatedAt: Date.now(),
      };
      appliquer([next, ...validated], { type: 'ajout', codes: [trimCode] });
    },

    /**
     * Enregistre le plan de travail courant sous un nom.
     *
     * Un nom déjà pris REMPLACE l'entrée existante au lieu d'en créer une
     * seconde : sur cinq places, deux « Mme Martin » à des heures différentes
     * coûteraient deux cinquièmes de l'historique pour un seul dossier.
     * L'appelant reçoit `replaced` pour pouvoir le dire.
     */
    saveSession: name => {
      const trimmed = name.trim();
      if (!trimmed) return { ok: false, replaced: false };
      const { crText, validated, sessions } = get();
      const lower = trimmed.toLocaleLowerCase();
      const existante = sessions.find(
        s => s.name.toLocaleLowerCase() === lower
      );
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
     * Rouvre un dossier : le compte-rendu et les diagnostics retenus
     * REMPLACENT le plan de travail. Les suggestions sont vidées — elles ont
     * été calculées sur l'autre texte, les garder afficherait des codes venus
     * d'un autre patient. L'historique aussi, pour la même raison que dans
     * `resetSession`.
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
        historique: historiqueVide(),
        suggestions: [],
        rejectedIds: new Set(),
        filterText: '',
        analyzeError: null,
        analyzeNotice: null,
      });
      return true;
    },

    deleteSession: id => {
      const next = get().sessions.filter(s => s.id !== id);
      updateSnapshot({ sessions: next });
      set({ sessions: next });
    },
  };
});
