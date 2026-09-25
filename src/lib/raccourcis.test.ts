import { describe, expect, it } from 'vitest';
import {
  actionHistorique,
  estApple,
  estChampEditable,
  estRaccourciAnalyse,
  type ToucheLike,
} from './raccourcis';

function touche(key: string, mods: Partial<ToucheLike> = {}): ToucheLike {
  return {
    key,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    ...mods,
  };
}

describe('plateforme', () => {
  it('reconnaît Mac, iPhone et iPad, par l’une ou l’autre API', () => {
    expect(estApple({ platform: 'MacIntel' })).toBe(true);
    expect(estApple({ platform: 'iPhone' })).toBe(true);
    expect(estApple({ userAgentData: { platform: 'macOS' } })).toBe(true);
    expect(estApple({ platform: 'Win32' })).toBe(false);
    expect(estApple({ userAgentData: { platform: 'Windows' } })).toBe(false);
    expect(estApple({})).toBe(false);
  });
});

describe('Ctrl+Entrée lance l’analyse', () => {
  it('avec Ctrl, et avec ⌘', () => {
    expect(estRaccourciAnalyse(touche('Enter', { ctrlKey: true }))).toBe(true);
    expect(estRaccourciAnalyse(touche('Enter', { metaKey: true }))).toBe(true);
  });

  it('pas Entrée seule, ni avec Maj ou Alt, ni pendant une composition', () => {
    expect(estRaccourciAnalyse(touche('Enter'))).toBe(false);
    expect(
      estRaccourciAnalyse(touche('Enter', { ctrlKey: true, shiftKey: true }))
    ).toBe(false);
    expect(
      estRaccourciAnalyse(touche('Enter', { ctrlKey: true, altKey: true }))
    ).toBe(false);
    expect(
      estRaccourciAnalyse(touche('Enter', { ctrlKey: true, isComposing: true }))
    ).toBe(false);
  });
});

describe('annuler / rétablir au clavier', () => {
  it('PC : Ctrl+Z, Ctrl+Maj+Z, Ctrl+Y', () => {
    expect(actionHistorique(touche('z', { ctrlKey: true }), false)).toBe(
      'annuler'
    );
    expect(
      actionHistorique(touche('Z', { ctrlKey: true, shiftKey: true }), false)
    ).toBe('retablir');
    expect(actionHistorique(touche('y', { ctrlKey: true }), false)).toBe(
      'retablir'
    );
  });

  it('Mac : ⌘Z et ⌘⇧Z — mais pas ⌘Y, qui ouvre l’historique du navigateur', () => {
    expect(actionHistorique(touche('z', { metaKey: true }), true)).toBe(
      'annuler'
    );
    expect(
      actionHistorique(touche('z', { metaKey: true, shiftKey: true }), true)
    ).toBe('retablir');
    expect(actionHistorique(touche('y', { metaKey: true }), true)).toBeNull();
    // Ctrl n'est pas le modificateur de l'édition sur Mac.
    expect(actionHistorique(touche('z', { ctrlKey: true }), true)).toBeNull();
  });

  it('ni sans modificateur, ni avec AltGr (Ctrl+Alt)', () => {
    expect(actionHistorique(touche('z'), false)).toBeNull();
    expect(
      actionHistorique(touche('z', { ctrlKey: true, altKey: true }), false)
    ).toBeNull();
  });
});

describe('où les raccourcis se taisent', () => {
  it('dans une zone de texte ou un champ de saisie', () => {
    expect(estChampEditable(document.createElement('textarea'))).toBe(true);
    const texte = document.createElement('input');
    expect(estChampEditable(texte)).toBe(true);
    const recherche = document.createElement('input');
    recherche.type = 'search';
    expect(estChampEditable(recherche)).toBe(true);
  });

  it('dans un contenu éditable, jusque dans ses descendants', () => {
    const editeur = document.createElement('div');
    editeur.setAttribute('contenteditable', 'true');
    const enfant = document.createElement('span');
    editeur.append(enfant);
    expect(estChampEditable(enfant)).toBe(true);
  });

  it('PAS sur un bouton, une case, un curseur, ni le corps de la page', () => {
    expect(estChampEditable(document.createElement('button'))).toBe(false);
    const caseACocher = document.createElement('input');
    caseACocher.type = 'checkbox';
    expect(estChampEditable(caseACocher)).toBe(false);
    const curseur = document.createElement('input');
    curseur.type = 'range';
    expect(estChampEditable(curseur)).toBe(false);
    expect(estChampEditable(document.body)).toBe(false);
    expect(estChampEditable(null)).toBe(false);
  });

  it('pas sur un champ en lecture seule, où Ctrl+Z ne fait rien', () => {
    const zone = document.createElement('textarea');
    zone.readOnly = true;
    expect(estChampEditable(zone)).toBe(false);
  });
});
