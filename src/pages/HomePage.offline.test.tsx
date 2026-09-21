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
 * dictionnaire CIM-10, lui, est embarqué. L'analyse interroge les deux, et le
 * dictionnaire porte seul le résultat quand la passerelle est hors d'atteinte —
 * hors connexion, ou pas configurée. Ces tests éprouvent que le repli SE FAIT
 * et SE DIT.
 *
 * LE SÉLECTEUR DE MODE A DISPARU, et avec lui les trois cas d'hier (`local`,
 * `api`, `both`) et le garde qui désactivait « Analyser ». L'invariant neuf, et
 * c'est le plus important : **« Analyser » n'est JAMAIS désactivé**. Il y a
 * toujours un référentiel pour répondre.
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
  useSettingsStore.setState({ who: WHO });
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

/** La passerelle qui répond : un jeton, puis un code CIM-11. */
const passerelleQuiRepond = () =>
  vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    const corps = url.endsWith('/token')
      ? { access_token: 'jeton', expires_in: 3600 }
      : {
          theCode: 'BA00',
          matchingText: 'Hypertension essentielle',
          matchScore: 0.9,
        };
    return new Response(JSON.stringify(corps), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });

describe('HomePage — repli sur le dictionnaire', () => {
  it('« Analyser » n’est JAMAIS désactivé, même hors connexion', async () => {
    renderHome();
    setOnline(false);
    expect(analyzeButton()).not.toHaveAttribute('aria-disabled');
    expect(analyzeButton()).not.toBeDisabled();
  });

  it('hors connexion : les codes locaux sortent, l’OMS s’annonce ignorée, zéro appel', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    renderHome();
    setOnline(false);

    await act(async () => {
      fireEvent.click(analyzeButton());
    });
    // `waitFor` parce que `handleAnalyze` est une fonction ASYNCHRONE, pas
    // parce que le dictionnaire serait lent : il rend ses codes en ~2 ms.
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
    // UN REPLI N'EST PAS UNE ERREUR : le canal `analyzeError` (role="alert")
    // doit rester vide, sinon un lecteur d'écran crie sur un cas normal.
    expect(useWorkspaceStore.getState().analyzeError).toBeNull();
  });

  it('sans passerelle configurée : même repli, et il dit comment le corriger', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    useSettingsStore.setState({ who: { ...WHO, proxyUrl: '' } });
    renderHome();

    await act(async () => {
      fireEvent.click(analyzeButton());
    });
    await waitFor(() =>
      expect(
        useWorkspaceStore.getState().suggestions.some(s => s.code === 'I10')
      ).toBe(true)
    );
    expect(
      screen.getByText(/Aucune passerelle OMS configurée/)
    ).toBeInTheDocument();
    // En ligne, mais rien à appeler : la passerelle n'a pas d'adresse.
    expect(appelsMetier(fetchSpy)).toHaveLength(0);
    expect(useWorkspaceStore.getState().analyzeError).toBeNull();
  });

  it('en ligne : les DEUX référentiels répondent dans la même liste', async () => {
    const fetchSpy = passerelleQuiRepond();
    vi.stubGlobal('fetch', fetchSpy);
    renderHome();

    await act(async () => {
      fireEvent.click(analyzeButton());
    });
    await waitFor(() =>
      expect(
        useWorkspaceStore.getState().suggestions.some(s => s.code === 'BA00')
      ).toBe(true)
    );

    const codes = useWorkspaceStore.getState().suggestions;
    // C'EST LE CŒUR DU CHANGEMENT : plus de choix à faire, les deux arrivent.
    expect(codes.some(s => s.code === 'I10' && s.source === 'local')).toBe(
      true
    );
    expect(codes.some(s => s.code === 'BA00' && s.source === 'api')).toBe(true);
    // Aucun message : tout a fonctionné.
    expect(useWorkspaceStore.getState().analyzeNotice).toBeNull();
    expect(useWorkspaceStore.getState().analyzeError).toBeNull();
  });

  it('le message de repli disparaît quand la passerelle redevient joignable', async () => {
    vi.stubGlobal('fetch', vi.fn());
    renderHome();
    setOnline(false);
    await act(async () => {
      fireEvent.click(analyzeButton());
    });
    await waitFor(() =>
      expect(
        screen.getByText(/la recherche OMS a été ignorée/)
      ).toBeInTheDocument()
    );

    // Un message de repli qui SURVIT à la reprise ferait croire à une panne.
    vi.stubGlobal('fetch', passerelleQuiRepond());
    setOnline(true);
    await act(async () => {
      fireEvent.click(analyzeButton());
    });
    await waitFor(() =>
      expect(useWorkspaceStore.getState().analyzeNotice).toBeNull()
    );
    expect(screen.queryByText(/la recherche OMS a été ignorée/)).toBeNull();
  });
});
