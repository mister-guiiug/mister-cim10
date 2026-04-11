import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadCrHistory,
  saveCrHistory,
  clearCrHistory,
  saveValidatedSession,
  loadValidatedSession,
  clearValidatedSession,
  loadNamedSessions,
  saveNamedSession,
  loadNamedSession,
  deleteNamedSession,
} from './storage.js';

beforeEach(() => {
  localStorage.clear();
});

// ─── Historique CR ─────────────────────────────────────────────────────────

describe('loadCrHistory', () => {
  it('retourne [] si rien en localStorage', () => {
    expect(loadCrHistory()).toEqual([]);
  });

  it('retourne [] si JSON invalide', () => {
    localStorage.setItem('cr_history', '{invalid}');
    expect(loadCrHistory()).toEqual([]);
  });
});

describe('saveCrHistory', () => {
  it('enregistre une entrée et la relit', () => {
    saveCrHistory('texte A');
    expect(loadCrHistory()[0]).toBe('texte A');
  });

  it('déplace en tête si déjà présent (pas de doublon)', () => {
    saveCrHistory('A');
    saveCrHistory('B');
    saveCrHistory('A');
    const h = loadCrHistory();
    expect(h[0]).toBe('A');
    expect(h.filter((x) => x === 'A')).toHaveLength(1);
  });

  it('respecte la limite de 5 entrées', () => {
    for (let i = 1; i <= 7; i++) saveCrHistory(`texte ${i}`);
    expect(loadCrHistory()).toHaveLength(5);
  });
});

describe('clearCrHistory', () => {
  it('vide l\'historique', () => {
    saveCrHistory('A');
    clearCrHistory();
    expect(loadCrHistory()).toEqual([]);
  });
});

// ─── Session validée ────────────────────────────────────────────────────────

describe('saveValidatedSession / loadValidatedSession', () => {
  it('persiste et relit les diagnostics', () => {
    const data = [{ id: '1', code: 'I10', label: 'Hypertension', statut: 'validé' }];
    saveValidatedSession(data);
    expect(loadValidatedSession()).toEqual(data);
  });

  it('retourne [] si rien stocké', () => {
    expect(loadValidatedSession()).toEqual([]);
  });

  it('retourne [] si JSON invalide', () => {
    localStorage.setItem('validated_session', 'bad');
    expect(loadValidatedSession()).toEqual([]);
  });
});

describe('clearValidatedSession', () => {
  it('supprime la session', () => {
    saveValidatedSession([{ id: '1', code: 'E11', label: 'Diabète', statut: 'validé' }]);
    clearValidatedSession();
    expect(loadValidatedSession()).toEqual([]);
  });
});

// ─── Sessions nommées ───────────────────────────────────────────────────────

describe('saveNamedSession / loadNamedSession', () => {
  it('persiste et relit une session nommée', () => {
    const entry = { compteRendu: 'cr test', validated: [{ code: 'I10' }] };
    saveNamedSession('lundi', entry);
    const loaded = loadNamedSession('lundi');
    expect(loaded).not.toBeNull();
    expect(loaded.compteRendu).toBe('cr test');
    expect(loaded.validated[0].code).toBe('I10');
  });

  it('retourne null pour un nom inexistant', () => {
    expect(loadNamedSession('inconnu')).toBeNull();
  });

  it('ajoute une date savedAt automatiquement', () => {
    saveNamedSession('test', { compteRendu: '', validated: [] });
    expect(loadNamedSession('test')?.savedAt).toBeDefined();
  });

  it('ne mutate pas l\'original (deep copy)', () => {
    const validated = [{ code: 'I10' }];
    saveNamedSession('s', { compteRendu: '', validated });
    validated[0].code = 'MUTATED';
    expect(loadNamedSession('s')?.validated[0].code).toBe('I10');
  });
});

describe('loadNamedSessions', () => {
  it('retourne {} si rien stocké', () => {
    expect(loadNamedSessions()).toEqual({});
  });
});

describe('deleteNamedSession', () => {
  it('supprime la session ciblée', () => {
    saveNamedSession('a', { compteRendu: '', validated: [] });
    saveNamedSession('b', { compteRendu: '', validated: [] });
    deleteNamedSession('a');
    expect(loadNamedSession('a')).toBeNull();
    expect(loadNamedSession('b')).not.toBeNull();
  });
});
