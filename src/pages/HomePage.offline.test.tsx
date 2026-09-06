import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider, LOCALE_STORAGE_KEY } from '../i18n';
import { SocleLabelsBridge } from '../components/SocleLabelsBridge';
import { DialogProvider } from '../components/DialogProvider';
import { useSettingsStore } from '../store/settingsStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { resetOmsToken } from '../lib/oms';
import type { WhoSettings } from '../types/index';
import { HomePage } from './HomePage';

/**
 * CE QUE CE FICHIER TIENT. L'OMS est le SEUL appel réseau de mister-cim10 ; le
 * dictionnaire CIM-10, lui, est embarqué. Hors connexion, l'app doit donc dire
 * l'indisponibilité de l'OMS À CET ENDROIT — et nulle part ailleurs.
 *
 * Ce que ces tests éprouvent, c'est l'USAGE, pas le câblage : le bouton
 * porte-t-il son motif ? le mode mixte rend-il quand même ses codes locaux ?
 * l'app se tait-elle quand rien ne dépend du réseau ?
 */

const WHO: WhoSettings = {
  clientId: 'id',
  clientSecret: 'secret',
  proxyUrl: 'https://passerelle.test',
  releaseId: '2024-01',
  lang: 'fr',
};

/**
 * Bascule la connectivité — et la fait PARVENIR au composant avant de rendre
 * la main.
 *
 * `dispatchEvent` seul ne suffit pas. `useOnline` du socle réagit dans un
 * écouteur d'événement, donc hors de React : la mise à jour d'état part au
 * planificateur, qui ne la rend qu'à la macrotâche suivante. Entre les deux, le
 * composant garde un `isOnline` PÉRIMÉ — et un test qui clique dans cet
 * intervalle analyse comme s'il était en ligne : l'OMS est interrogée, le
 * `fetch` doublé échoue, `setSuggestions` n'est jamais atteint, et les
 * suggestions restent à zéro POUR TOUJOURS.
 *
 * C'est ce qui a fait échouer « mode mixte » le 04/09/2026 sur la PR #43 : les
 * 1081 ms du test étaient 1000 ms d'attente morte (le défaut de `waitFor`) plus
 * ~80 ms de travail réel, pas une analyse lente — le dictionnaire CIM-10 répond
 * en 2 ms. Le socle n'y était pour rien : son `useOnline` est identique en
 * 3.33.0 et 3.34.0. La PR n'a fait que perdre le tirage au sort.
 *
 * `act` vide la file de React avant de rendre : à la ligne suivante, la bascule
 * EST rendue. Plus de course — et plus d'avertissement « An update to HomePage
 * inside a test was not wrapped in act(...) ».
 */
function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', {
    value,
    configurable: true,
    writable: true,
  });
  act(() => {
    window.dispatchEvent(new Event(value ? 'online' : 'offline'));
  });
}

function renderHome() {
  return render(
    <MemoryRouter>
      <I18nProvider>
        <SocleLabelsBridge>
          <DialogProvider>
            <HomePage />
          </DialogProvider>
        </SocleLabelsBridge>
      </I18nProvider>
    </MemoryRouter>
  );
}

const analyzeButton = () => screen.getByRole('button', { name: 'Analyser' });

beforeEach(() => {
  // Le harnais jsdom annonce `en-US` : on fixe la langue, les messages
  // attendus ci-dessous sont ceux du catalogue français.
  localStorage.setItem(LOCALE_STORAGE_KEY, 'fr');
  resetOmsToken();
  useWorkspaceStore.getState().resetSession();
  useWorkspaceStore.getState().setCrText('Hypertension artérielle sévère.');
  useSettingsStore.setState({ mode: 'local', who: WHO });
  setOnline(true);
});

afterEach(() => {
  vi.unstubAllGlobals();
  setOnline(true);
});

/**
 * Les appels réseau de l'ÉCRAN, et eux seuls. Depuis le socle 4.4.1, le pied
 * de page (`AppFooter version`) sonde `version.json` une fois au montage pour
 * dire si une version attend en ligne : ce n'est ni l'OMS, ni le sujet de ces
 * tests, et l'ignorer ici est plus juste que l'interdire.
 */
const appelsMetier = (spy: ReturnType<typeof vi.fn>) =>
  spy.mock.calls.filter(([entree]) => !String(entree).endsWith('version.json'));

describe('HomePage hors connexion', () => {
  it('mode OMS seul : le bouton est bloqué ET dit pourquoi, sans appel réseau', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    useSettingsStore.setState({ mode: 'api' });
    renderHome();

    setOnline(false);
    expect(analyzeButton()).toHaveAttribute('aria-disabled', 'true');
    // Le motif est AFFICHÉ : un bouton grisé muet n'apprend rien.
    expect(screen.getByText('Indisponible hors ligne')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(analyzeButton());
    });
    expect(appelsMetier(fetchSpy)).toHaveLength(0);
    expect(useWorkspaceStore.getState().suggestions).toHaveLength(0);
  });

  it('mode mixte : le bouton reste actif, les codes locaux sortent, l’OMS s’annonce ignorée', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    useSettingsStore.setState({ mode: 'both' });
    renderHome();

    setOnline(false);
    expect(analyzeButton()).not.toHaveAttribute('aria-disabled');
    // AVANT DE CLIQUER, exiger le témoin que la bascule est rendue. Ici se
    // cachait la course : un `waitFor` sur l'absence d'`aria-disabled` passait
    // au premier essai — en mode mixte le bouton ne la porte JAMAIS — et
    // n'attendait donc rien du tout. L'échec, lui, tombait mille millisecondes
    // plus loin sur des suggestions vides, à l'autre bout du test.
    expect(
      screen.getByText(/la recherche OMS a été ignorée/)
    ).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(analyzeButton());
    });
    // `waitFor` parce que `handleAnalyze` est une fonction ASYNCHRONE, pas
    // parce que le dictionnaire serait lent : il rend ses codes en ~2 ms. Le
    // défaut de 1 s est donc large — l'allonger ne rendrait pas ce test plus
    // sûr, il rendrait seulement ses échecs plus lents à venir.
    await waitFor(() =>
      expect(
        useWorkspaceStore.getState().suggestions.length
      ).toBeGreaterThanOrEqual(1)
    );
    // Le dictionnaire local a répondu (I10 = hypertension essentielle)…
    expect(
      useWorkspaceStore.getState().suggestions.some(s => s.code === 'I10')
    ).toBe(true);
    // …et l'app dit ce qui manque, au lieu de faire comme si de rien n'était.
    expect(
      screen.getByText(/la recherche OMS a été ignorée/)
    ).toBeInTheDocument();
    expect(appelsMetier(fetchSpy)).toHaveLength(0);
    expect(useWorkspaceStore.getState().analyzeError).toBeNull();
  });

  it('mode local : pas un mot — rien ne dépend du réseau', async () => {
    renderHome();
    setOnline(false);
    await act(async () => {
      fireEvent.click(analyzeButton());
    });

    expect(analyzeButton()).not.toHaveAttribute('aria-disabled');
    expect(screen.queryByText('Indisponible hors ligne')).toBeNull();
    expect(screen.queryByText(/recherche OMS/)).toBeNull();
    expect(
      useWorkspaceStore.getState().suggestions.some(s => s.code === 'I10')
    ).toBe(true);
  });

  it('en ligne, le mode OMS interroge la passerelle comme avant', async () => {
    const fetchSpy = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/token')) {
        return new Response(
          JSON.stringify({ access_token: 'jeton', expires_in: 3600 }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({
          theCode: 'BA00',
          matchingText: 'Hypertension essentielle',
          matchScore: 0.9,
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      );
    });
    vi.stubGlobal('fetch', fetchSpy);
    useSettingsStore.setState({ mode: 'api' });
    renderHome();

    expect(analyzeButton()).not.toHaveAttribute('aria-disabled');
    await act(async () => {
      fireEvent.click(analyzeButton());
    });

    await waitFor(() =>
      expect(
        useWorkspaceStore.getState().suggestions.some(s => s.code === 'BA00')
      ).toBe(true)
    );
    expect(fetchSpy).toHaveBeenCalled();
    expect(screen.queryByText('Indisponible hors ligne')).toBeNull();
  });
});
