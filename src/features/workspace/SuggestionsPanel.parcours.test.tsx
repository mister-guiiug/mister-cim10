import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { I18nProvider, LOCALE_STORAGE_KEY } from '../../i18n';
import { SocleLabelsBridge } from '../../components/SocleLabelsBridge';
import { useWorkspaceStore } from '../../store/workspaceStore';
import type { AnalysisResult } from '../../types/index';
import { SuggestionsPanel } from './SuggestionsPanel';

/**
 * CE QUE CE FICHIER TIENT : le PARCOURS, pas le rendu.
 *
 * Relevé en production le 17/09/2026 sur la version déployée, deux défauts que
 * ni les tests ni la CI ne voyaient parce qu'ils ne portent pas sur ce qui est
 * affiché mais sur ce qui se passe APRÈS un clic :
 *
 *  - après un « Valider », le focus retombait sur `BODY`. Douze tabulations
 *    étaient alors nécessaires pour revenir au « Valider » suivant, parmi
 *    soixante éléments focusables — neuf codes à trancher rendaient l'outil
 *    inutilisable sans souris ;
 *  - `J44.1` et `J44.9` sortaient en deux cartes, MÊME terme repéré (`bpco`),
 *    MÊME confiance (61 %) : un choix présenté sans critère pour le trancher.
 */

function suggestion(
  code: string,
  label: string,
  matchedTerm: string,
  confidence: number
): AnalysisResult {
  return {
    id: `${code}-${matchedTerm}`,
    code,
    label,
    matchedTerm,
    score: confidence,
    confidence,
  };
}

const SUGGESTIONS = [
  suggestion('I10', 'Hypertension essentielle', 'hypertension', 0.94),
  suggestion('J44.1', 'BPCO avec exacerbation aiguë', 'bpco', 0.61),
  suggestion('J44.9', 'BPCO, sans précision', 'bpco', 0.61),
  suggestion('E66.9', 'Obésité, sans précision', 'obesite', 0.74),
];

function monter() {
  return render(
    <I18nProvider>
      <SocleLabelsBridge>
        <SuggestionsPanel />
      </SocleLabelsBridge>
    </I18nProvider>
  );
}

beforeEach(() => {
  // Les assertions portent sur des libellés FRANÇAIS : sans ce réglage,
  // `I18nProvider` suit la locale du navigateur de test — anglaise — et les
  // six tests échouent en cherchant « Valider » dans une interface qui dit
  // « Validate ».
  localStorage.setItem(LOCALE_STORAGE_KEY, 'fr');
  useWorkspaceStore.setState({
    suggestions: SUGGESTIONS,
    validated: [],
    rejectedIds: new Set(),
    filterText: '',
    isAnalyzing: false,
  });
});

describe('un terme repéré, une carte', () => {
  it('réunit les codes qui partagent le même terme', () => {
    const { container } = monter();
    // Les cartes de PREMIER niveau : les précisions sont elles aussi des
    // `listitem`, et les compter ferait dire n'importe quoi à ce test.
    const cartes = [
      ...container.querySelectorAll<HTMLElement>('.suggestion-list > li'),
    ];
    // Trois cartes pour quatre suggestions : les deux BPCO n'en font qu'une.
    expect(cartes.length).toBe(3);

    const carteBpco = cartes.find(c => within(c).queryByText('J44.1'));
    expect(carteBpco).toBeTruthy();
    // Le mieux classé porte la carte, l'autre est sa précision.
    expect(within(carteBpco!).getByText(/Autres précisions/u)).toBeTruthy();
    expect(within(carteBpco!).getByText('J44.9')).toBeTruthy();
  });

  it('une précision se valide pour elle-même', async () => {
    monter();
    const { container } = { container: document.body };
    const carteBpco = [
      ...container.querySelectorAll<HTMLElement>('.suggestion-list > li'),
    ].find(c => within(c).queryByText('J44.1'))!;
    const precisions = within(carteBpco).getByRole('list');
    fireEvent.click(
      within(precisions).getByRole('button', { name: /Valider/u })
    );

    await waitFor(() => {
      const retenus = useWorkspaceStore.getState().validated.map(v => v.code);
      expect(retenus).toEqual(['J44.9']);
    });
  });
});

describe('enchaîner au clavier', () => {
  it('le focus passe au « Valider » suivant, il ne retombe pas sur le corps', async () => {
    monter();
    const boutons = () =>
      screen
        .getAllByRole('button', { name: 'Valider' })
        .filter(b => b.dataset.role === 'valider-principal');

    boutons()[0]!.focus();
    // Entrée sur un bouton focalisé déclenche un clic : c'est ce que le
    // navigateur fait, et c'est le geste qu'on veut éprouver.
    fireEvent.click(document.activeElement!);

    await waitFor(() => {
      // Ni le corps, ni un endroit au hasard : le bouton principal suivant.
      expect(document.activeElement).not.toBe(document.body);
      expect((document.activeElement as HTMLElement | null)?.dataset.role).toBe(
        'valider-principal'
      );
    });
  });

  it('la dernière validation ne laisse pas le focus nulle part', async () => {
    useWorkspaceStore.setState({ suggestions: [SUGGESTIONS[0]!] });
    monter();

    const bouton = screen
      .getAllByRole('button', { name: 'Valider' })
      .find(b => b.dataset.role === 'valider-principal')!;
    bouton.focus();
    fireEvent.click(bouton);

    await waitFor(() => {
      expect(document.activeElement).not.toBe(document.body);
    });
  });

  it('l’action est annoncée aux lecteurs d’écran', async () => {
    monter();
    const bouton = screen
      .getAllByRole('button', { name: 'Valider' })
      .find(b => b.dataset.role === 'valider-principal')!;
    fireEvent.click(bouton);

    await waitFor(() => {
      expect(screen.getByRole('status').textContent).toMatch(/retenu/u);
    });
  });
});

describe('le rappel des retenus', () => {
  it('n’apparaît qu’une fois un code retenu, et mène au panneau', async () => {
    monter();
    expect(screen.queryByText(/diagnostic retenu/u)).toBeNull();

    const bouton = screen
      .getAllByRole('button', { name: 'Valider' })
      .find(b => b.dataset.role === 'valider-principal')!;
    fireEvent.click(bouton);

    await waitFor(() => {
      expect(screen.getByText(/1 diagnostic retenu/u)).toBeTruthy();
    });
  });
});

describe('trier au clavier, sans tabuler', () => {
  const principal = () =>
    screen
      .getAllByRole('button', { name: 'Valider' })
      .filter(b => b.dataset.role === 'valider-principal');

  it('↓ et ↑ passent d’un « Valider » à l’autre, Fin et Début aux bords', () => {
    monter();
    const boutons = principal();
    boutons[0]!.focus();

    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(boutons[1]);
    fireEvent.keyDown(document.activeElement!, { key: 'End' });
    expect(document.activeElement).toBe(boutons.at(-1));
    // Au bord, la flèche ne sort pas de la liste.
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(boutons.at(-1));
    fireEvent.keyDown(document.activeElement!, { key: 'ArrowUp' });
    expect(document.activeElement).toBe(boutons.at(-2));
    fireEvent.keyDown(document.activeElement!, { key: 'Home' });
    expect(document.activeElement).toBe(boutons[0]);
  });

  it('V valide la carte qui a le focus, R la rejette — même depuis un autre de ses boutons', async () => {
    monter();
    const carte = (code: string) =>
      [...document.querySelectorAll<HTMLElement>('.suggestion-list > li')].find(
        c => within(c).queryByText(code)
      )!;

    within(carte('I10'))
      .getAllByRole('button')
      .find(b => b.dataset.role === 'valider-principal')!
      .focus();
    fireEvent.keyDown(document.activeElement!, { key: 'v' });
    await waitFor(() =>
      expect(useWorkspaceStore.getState().validated.map(v => v.code)).toEqual([
        'I10',
      ])
    );

    within(carte('E66.9')).getByRole('button', { name: 'Rejeter' }).focus();
    fireEvent.keyDown(document.activeElement!, { key: 'R' });
    await waitFor(() =>
      expect(useWorkspaceStore.getState().rejectedIds.size).toBe(1)
    );
    expect(screen.queryByText('E66.9')).toBeNull();
  });

  it('avec un modificateur, la touche n’est pas à nous (Ctrl+R recharge)', () => {
    monter();
    principal()[0]!.focus();
    fireEvent.keyDown(document.activeElement!, { key: 'r', ctrlKey: true });
    fireEvent.keyDown(document.activeElement!, { key: 'v', metaKey: true });
    expect(useWorkspaceStore.getState().rejectedIds.size).toBe(0);
    expect(useWorkspaceStore.getState().validated).toEqual([]);
  });

  it('hors des cartes, rien ne se passe', () => {
    monter();
    fireEvent.keyDown(document.body, { key: 'v' });
    expect(useWorkspaceStore.getState().validated).toEqual([]);
  });

  it('les boutons annoncent leur raccourci', () => {
    monter();
    expect(principal()[0]!.getAttribute('aria-keyshortcuts')).toBe('V');
  });
});
