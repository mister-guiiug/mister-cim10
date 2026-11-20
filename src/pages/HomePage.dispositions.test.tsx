import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider, LOCALE_STORAGE_KEY } from '../i18n';
import { SocleLabelsBridge } from '../components/SocleLabelsBridge';
import { DialogProvider } from '../components/DialogProvider';
import { useSettingsStore } from '../store/settingsStore';
import { useVueStore } from '../store/vueStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { HomePage } from './HomePage';

/**
 * L'ORDRE DES ÉCRANS AU TÉLÉPHONE (refonte Astryx, 20/11/2026).
 *
 * Avant, le téléphone empilait le compte-rendu, neuf suggestions de 166 px et
 * les retenus : 4 239 px, et « Copier pour DPI » à cinq écrans du texte. Les
 * trois régions sont maintenant trois onglets ; l'analyse ouvre les
 * suggestions, chaque onglet porte son compte, et les retenus mènent à
 * l'export. Au bureau, les trois colonnes se voient, sans onglets.
 */
function disposition(largeur: number) {
  vi.stubGlobal('matchMedia', (query: string) => {
    const min = /min-width:\s*(\d+)/.exec(query);
    const maxH = /max-height/.test(query);
    return {
      matches: maxH ? false : min ? largeur >= Number(min[1]) : false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    };
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

beforeEach(() => {
  localStorage.setItem(LOCALE_STORAGE_KEY, 'fr');
  useVueStore.setState({ vue: 'cr' });
  useWorkspaceStore.getState().resetSession();
  useWorkspaceStore
    .getState()
    .setCrText(
      'Hypertension artérielle essentielle. Fibrillation auriculaire.'
    );
  // Sans passerelle : seul le dictionnaire répond, aucun appel réseau.
  useSettingsStore.setState({
    who: {
      proxyUrl: '',
      clientId: '',
      clientSecret: '',
      releaseId: '2024-01',
      lang: 'fr',
    },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('au téléphone : trois onglets, dans l’ordre du travail', () => {
  it('Texte, Suggestions, Retenus — le texte d’abord', () => {
    disposition(390);
    renderHome();
    const onglets = within(
      screen.getByRole('tablist', { name: 'Étapes de la cotation' })
    ).getAllByRole('tab');
    expect(onglets.map(o => o.textContent)).toEqual([
      '1Texte',
      '2Suggestions',
      '3Retenus',
    ]);
    expect(onglets[0]).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: /texte/i })).toBeVisible();
  });

  it('l’analyse ouvre les suggestions, et l’onglet en dit le nombre', async () => {
    disposition(390);
    renderHome();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Analyser' }));
    });

    const suggestions = screen.getByRole('tab', { name: /suggestions/i });
    expect(suggestions).toHaveAttribute('aria-selected', 'true');
    expect(suggestions.textContent).toMatch(/Suggestions\d+$/);
    expect(
      screen.queryByRole('button', { name: 'Analyser' })
    ).not.toBeInTheDocument();
  });

  it('valider compte dans l’onglet Retenus, qui mène à « Copier pour DPI »', async () => {
    disposition(390);
    renderHome();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Analyser' }));
    });
    await waitFor(() =>
      expect(
        screen.getAllByRole('button', { name: 'Valider' }).length
      ).toBeGreaterThan(0)
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Valider' })[0]!);

    const retenus = screen.getByRole('tab', { name: /retenus/i });
    expect(retenus.textContent).toBe('3Retenus1');
    fireEvent.click(retenus);
    expect(
      screen.getByRole('button', { name: 'Copier pour DPI' })
    ).toBeVisible();
  });

  it('les flèches passent d’un onglet à l’autre (motif ARIA)', async () => {
    disposition(390);
    renderHome();
    const touche = (key: string) =>
      fireEvent.keyDown(document.activeElement!, { key });
    screen.getByRole('tab', { name: /texte/i }).focus();
    touche('ArrowRight');
    expect(screen.getByRole('tab', { name: /suggestions/i })).toHaveFocus();
    touche('End');
    expect(screen.getByRole('tab', { name: /retenus/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    touche('Home');
    expect(screen.getByRole('tab', { name: /texte/i })).toHaveFocus();
  });
});

describe('à la tablette et au bureau', () => {
  it('dès 768 px : deux onglets à gauche, les retenus toujours visibles', () => {
    disposition(820);
    renderHome();
    expect(
      within(screen.getByRole('tablist')).getAllByRole('tab')
    ).toHaveLength(2);
    expect(
      screen.getByRole('heading', { name: /diagnostics retenus/i })
    ).toBeVisible();
  });

  it('dès 1 024 px : les trois colonnes, sans onglets', async () => {
    disposition(1440);
    renderHome();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Analyser' }));
    });
    // Le compte-rendu reste là : rien n'est caché au bureau.
    expect(screen.getByRole('button', { name: 'Analyser' })).toBeVisible();
  });
});
