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

function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', {
    value,
    configurable: true,
    writable: true,
  });
  window.dispatchEvent(new Event(value ? 'online' : 'offline'));
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

describe('HomePage hors connexion', () => {
  it('mode OMS seul : le bouton est bloqué ET dit pourquoi, sans appel réseau', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    useSettingsStore.setState({ mode: 'api' });
    renderHome();

    setOnline(false);
    await waitFor(() =>
      expect(analyzeButton()).toHaveAttribute('aria-disabled', 'true')
    );
    // Le motif est AFFICHÉ : un bouton grisé muet n'apprend rien.
    expect(screen.getByText('Indisponible hors ligne')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(analyzeButton());
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(useWorkspaceStore.getState().suggestions).toHaveLength(0);
  });

  it('mode mixte : le bouton reste actif, les codes locaux sortent, l’OMS s’annonce ignorée', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    useSettingsStore.setState({ mode: 'both' });
    renderHome();

    setOnline(false);
    await waitFor(() =>
      expect(analyzeButton()).not.toHaveAttribute('aria-disabled')
    );

    await act(async () => {
      fireEvent.click(analyzeButton());
    });
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
    expect(fetchSpy).not.toHaveBeenCalled();
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
