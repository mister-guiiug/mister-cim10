import { beforeEach, describe, expect, it } from 'vitest';
import { useWorkspaceStore } from './workspaceStore';
import { readSnapshot, refreshSnapshot } from '../lib/app-store';
import { historiqueVide } from '../lib/historique';
import { MAX_FAVORIS } from '../lib/favoris';
import type { AnalysisResult } from '../types/index';

/**
 * CE QUE CE FICHIER TIENT. Les cinq gestes sur les diagnostics retenus —
 * ajout, retrait, modification, déplacement, vidage — s'annulent et se
 * rétablissent, et CE QUI S'AFFICHE EST CE QUI EST ENREGISTRÉ : un « Annuler »
 * qui ne toucherait que l'écran rendrait l'ancienne liste au rechargement.
 * Changer de dossier, en revanche, ferme l'historique.
 */

const state = () => useWorkspaceStore.getState();
const codes = () => state().validated.map(v => v.code);
const codesEnregistres = () => {
  refreshSnapshot();
  return readSnapshot().validated.map(v => v.code);
};

function suggestion(code: string): AnalysisResult {
  return {
    id: `s-${code}`,
    code,
    label: `libellé de ${code}`,
    matchedTerm: code,
    score: 1,
    confidence: 0.9,
    source: 'local',
  };
}

beforeEach(() => {
  localStorage.clear();
  refreshSnapshot();
  useWorkspaceStore.setState({
    crText: '',
    validated: [],
    sessions: [],
    favorites: [],
    historique: historiqueVide(),
    suggestions: [],
    rejectedIds: new Set(),
    filterText: '',
    analyzeError: null,
  });
});

/** Trois codes retenus, dans cet ordre à l'écran : C, B, A. */
function troisCodes(): void {
  state().addManualDiagnostic('A00.0', 'libellé A');
  state().addManualDiagnostic('B01.9', 'libellé B');
  state().addManualDiagnostic('C34.9', 'libellé C');
}

describe('annuler / rétablir les gestes sur les retenus', () => {
  it('un ajout s’annule, se rétablit — et l’enregistrement suit', () => {
    state().validateSuggestion(suggestion('I10'));
    expect(codes()).toEqual(['I10']);

    expect(state().undo()?.operation).toEqual({
      type: 'ajout',
      codes: ['I10'],
    });
    expect(codes()).toEqual([]);
    expect(codesEnregistres()).toEqual([]);

    expect(state().redo()?.operation.type).toBe('ajout');
    expect(codes()).toEqual(['I10']);
    expect(codesEnregistres()).toEqual(['I10']);
  });

  it('un retrait s’annule À SA PLACE', () => {
    troisCodes();
    const b = state().validated.find(v => v.code === 'B01.9')!;

    state().removeValidated(b.id);
    expect(codes()).toEqual(['C34.9', 'A00.0']);

    state().undo();
    expect(codes()).toEqual(['C34.9', 'B01.9', 'A00.0']);
  });

  it('une modification garde la position, et s’annule', () => {
    troisCodes();
    const b = state().validated.find(v => v.code === 'B01.9')!;

    expect(
      state().editValidated(b.id, { code: 'b02.9', label: ' Varicelle ' })
    ).toBe(true);
    expect(codes()).toEqual(['C34.9', 'B02.9', 'A00.0']);
    expect(state().validated[1]).toMatchObject({
      id: b.id,
      label: 'Varicelle',
    });

    expect(state().undo()?.operation).toEqual({
      type: 'modification',
      ancien: 'B01.9',
      nouveau: 'B02.9',
    });
    expect(codes()).toEqual(['C34.9', 'B01.9', 'A00.0']);
    expect(codesEnregistres()).toEqual(['C34.9', 'B01.9', 'A00.0']);
  });

  it('une modification vers un code déjà retenu est refusée', () => {
    troisCodes();
    const b = state().validated.find(v => v.code === 'B01.9')!;

    expect(state().editValidated(b.id, { code: 'A00.0', label: 'x' })).toBe(
      false
    );
    expect(codes()).toEqual(['C34.9', 'B01.9', 'A00.0']);
  });

  it('un déplacement rend la nouvelle position, et s’annule', () => {
    troisCodes();
    const a = state().validated.find(v => v.code === 'A00.0')!;

    expect(state().moveValidated(a.id, -1)).toBe(2);
    expect(codes()).toEqual(['C34.9', 'A00.0', 'B01.9']);
    expect(codesEnregistres()).toEqual(['C34.9', 'A00.0', 'B01.9']);

    // Au bord, rien ne bouge et rien n'est empilé.
    const c = state().validated.find(v => v.code === 'C34.9')!;
    const profondeur = state().historique.passe.length;
    expect(state().moveValidated(c.id, -1)).toBeNull();
    expect(state().historique.passe).toHaveLength(profondeur);

    state().undo();
    expect(codes()).toEqual(['C34.9', 'B01.9', 'A00.0']);
  });

  it('le vidage s’annule d’un coup', () => {
    troisCodes();

    expect(state().clearValidated()).toBe(3);
    expect(codes()).toEqual([]);

    expect(state().undo()?.operation).toEqual({ type: 'vidage', nombre: 3 });
    expect(codes()).toEqual(['C34.9', 'B01.9', 'A00.0']);
  });

  it('une note s’annule — mais quitter le champ sans rien changer n’empile rien', () => {
    troisCodes();
    const a = state().validated.find(v => v.code === 'A00.0')!;
    const profondeur = state().historique.passe.length;

    state().updateValidatedNote(a.id, '');
    expect(state().historique.passe).toHaveLength(profondeur);

    state().updateValidatedNote(a.id, 'motif principal');
    expect(state().validated.find(v => v.id === a.id)?.note).toBe(
      'motif principal'
    );

    state().undo();
    expect(state().validated.find(v => v.id === a.id)?.note).toBeUndefined();
  });

  it('« Valider filtrées » s’annule en un geste', () => {
    state().validateAll([suggestion('I10'), suggestion('E11.9')]);
    expect(codes()).toHaveLength(2);

    state().undo();
    expect(codes()).toEqual([]);
    expect(state().undo()).toBeNull();
  });

  it('un geste neuf ferme la porte au rétablissement', () => {
    state().addManualDiagnostic('I10', 'HTA');
    state().undo();

    state().addManualDiagnostic('E11.9', 'Diabète');

    expect(state().redo()).toBeNull();
    expect(codes()).toEqual(['E11.9']);
  });
});

describe('changer de dossier ferme l’historique', () => {
  it('« Nouvelle session » : plus rien à annuler', () => {
    troisCodes();

    state().resetSession();

    expect(state().undo()).toBeNull();
    expect(codes()).toEqual([]);
  });

  it('rouvrir un dossier : un Ctrl+Z ne ramène pas l’autre patient', () => {
    state().addManualDiagnostic('I10', 'HTA');
    state().saveSession('dossier A');
    state().resetSession();
    state().addManualDiagnostic('J44.9', 'BPCO');

    state().openSession(state().sessions[0]!.id);

    expect(state().undo()).toBeNull();
    expect(codes()).toEqual(['I10']);
  });
});

describe('favoris', () => {
  it('se basculent, et s’enregistrent', () => {
    expect(
      state().toggleFavorite({ code: 'I10', label: 'HTA', source: 'local' })
    ).toBe('ajoute');
    expect(state().favorites.map(f => f.code)).toEqual(['I10']);
    refreshSnapshot();
    expect(readSnapshot().favorites.map(f => f.code)).toEqual(['I10']);

    expect(
      state().toggleFavorite({ code: 'I10', label: 'HTA', source: 'local' })
    ).toBe('retire');
    expect(state().favorites).toEqual([]);
  });

  it('survivent à « Nouvelle session » : ce ne sont pas des données du dossier', () => {
    state().toggleFavorite({ code: 'I10', label: 'HTA', source: 'local' });

    state().resetSession();

    expect(state().favorites.map(f => f.code)).toEqual(['I10']);
  });

  it(`pleins à ${MAX_FAVORIS}, ils refusent sans rien écrire`, () => {
    for (let i = 0; i < MAX_FAVORIS; i++) {
      state().toggleFavorite({
        code: `A${String(i).padStart(2, '0')}`,
        label: 'x',
        source: 'local',
      });
    }
    expect(
      state().toggleFavorite({ code: 'Z99.9', label: 'x', source: 'local' })
    ).toBe('plein');
    expect(state().favorites).toHaveLength(MAX_FAVORIS);
  });

  it('un favori CIM-11 s’ajoute aux retenus avec son référentiel', () => {
    state().addManualDiagnostic('BA00', 'Hypertension', 'api');
    expect(state().validated[0]).toMatchObject({ code: 'BA00', source: 'api' });
  });
});
