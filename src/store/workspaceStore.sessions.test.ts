import { beforeEach, describe, expect, it } from 'vitest';
import { useWorkspaceStore } from './workspaceStore';
import { MAX_SESSIONS, readSnapshot, refreshSnapshot } from '../lib/app-store';

/**
 * CE QUE CE FICHIER TIENT. « Retrouver le dossier d'hier » n'est pas une liste
 * à l'écran : c'est la promesse qu'un travail mis de côté revient ENTIER, et
 * que le mettre de côté n'a rien détruit au passage. Les quatre assertions qui
 * comptent sont donc l'aller-retour, la survie des dossiers à « Nouvelle
 * session », la borne à cinq, et la persistance.
 */

const state = () => useWorkspaceStore.getState();

beforeEach(() => {
  localStorage.clear();
  refreshSnapshot();
  useWorkspaceStore.setState({
    crText: '',
    validated: [],
    sessions: [],
    suggestions: [],
    rejectedIds: new Set(),
    filterText: '',
    analyzeError: null,
  });
});

function poserDuTravail(cr: string, code: string): void {
  state().setCrText(cr);
  state().addManualDiagnostic(code, `libellé de ${code}`);
}

describe('dossiers enregistrés', () => {
  it('fait l’aller-retour : enregistrer, repartir de zéro, rouvrir', () => {
    poserDuTravail('Patient diabétique de type 2.', 'E11.9');

    expect(state().saveSession('séjour du 12/05')).toEqual({
      ok: true,
      replaced: false,
    });

    // On repart sur un autre dossier : l'écran est vidé.
    state().resetSession();
    expect(state().crText).toBe('');
    expect(state().validated).toHaveLength(0);
    // …mais le dossier mis de côté, lui, est toujours là.
    expect(state().sessions).toHaveLength(1);

    const id = state().sessions[0]?.id as string;
    expect(state().openSession(id)).toBe(true);
    expect(state().crText).toBe('Patient diabétique de type 2.');
    expect(state().validated.map(v => v.code)).toEqual(['E11.9']);
  });

  it('survit à un rechargement de l’application', () => {
    poserDuTravail('Compte-rendu à retrouver.', 'I10');
    state().saveSession('hier');

    // Le magasin mémoire est vidé : la lecture suivante repart du stockage,
    // comme au démarrage de l'app.
    refreshSnapshot();

    const sessions = readSnapshot().sessions;
    expect(sessions).toHaveLength(1);
    expect(sessions[0]?.name).toBe('hier');
    expect(sessions[0]?.crText).toBe('Compte-rendu à retrouver.');
    expect(sessions[0]?.validated.map(v => v.code)).toEqual(['I10']);
  });

  it('vide les suggestions en rouvrant — elles venaient d’un autre texte', () => {
    poserDuTravail('Texte A.', 'I10');
    state().saveSession('dossier A');
    state().resetSession();
    state().setSuggestions([
      {
        id: 'x',
        code: 'J44.9',
        label: 'BPCO',
        matchedTerm: 'bpco',
        score: 10,
        confidence: 0.9,
      },
    ]);

    state().openSession(state().sessions[0]?.id as string);

    expect(state().suggestions).toHaveLength(0);
  });

  it('remplace le dossier de même nom au lieu d’en manger une seconde place', () => {
    poserDuTravail('première version', 'I10');
    state().saveSession('Séjour A');
    state().setCrText('seconde version');

    expect(state().saveSession('séjour a')).toEqual({
      ok: true,
      replaced: true,
    });
    expect(state().sessions).toHaveLength(1);
    expect(state().sessions[0]?.crText).toBe('seconde version');
    // Le nom retenu est celui de la dernière saisie.
    expect(state().sessions[0]?.name).toBe('séjour a');
  });

  it('borne l’historique à cinq, le plus ancien sort', () => {
    for (let i = 1; i <= MAX_SESSIONS + 2; i++) {
      state().setCrText(`dossier ${i}`);
      state().saveSession(`dossier ${i}`);
    }

    const noms = state().sessions.map(s => s.name);
    expect(noms).toHaveLength(MAX_SESSIONS);
    expect(noms[0]).toBe(`dossier ${MAX_SESSIONS + 2}`);
    expect(noms).not.toContain('dossier 1');
    expect(readSnapshot().sessions).toHaveLength(MAX_SESSIONS);
  });

  it('refuse un nom vide, et une suppression laisse les autres', () => {
    poserDuTravail('travail', 'I10');
    expect(state().saveSession('   ')).toEqual({ ok: false, replaced: false });
    expect(state().sessions).toHaveLength(0);

    state().saveSession('un');
    state().saveSession('deux');
    state().deleteSession(state().sessions[0]?.id as string);

    expect(state().sessions.map(s => s.name)).toEqual(['un']);
    expect(readSnapshot().sessions.map(s => s.name)).toEqual(['un']);
  });

  it('rouvrir un dossier inconnu ne touche à rien', () => {
    poserDuTravail('intact', 'I10');

    expect(state().openSession('identifiant-inexistant')).toBe(false);
    expect(state().crText).toBe('intact');
  });
});
