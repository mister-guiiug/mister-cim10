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
 * CE QUE CE FICHIER TIENT. L'app a deux référentiels — le dictionnaire CIM-10
 * embarqué, immédiat, et la passerelle OMS, qui passe par le réseau. Le
 * fichier voisin (`HomePage.offline.test.tsx`) éprouve l'absence de réseau ;
 * celui-ci éprouve le cas plus vicieux : le réseau est là, et c'est la
 * PASSERELLE qui tombe.
 *
 * L'enjeu est clinique, pas cosmétique. Le dictionnaire local a déjà rendu ses
 * codes quand l'OMS lève : les jeter renvoie l'utilisateur à un message
 * d'erreur pour un travail qui était fait.
 *
 * LE SÉLECTEUR DE MODE A DISPARU. Ces cas ne se distinguent donc plus par un
 * réglage mais par le CONTENU : un compte-rendu que le dictionnaire reconnaît,
 * ou un qu'il ne reconnaît pas. C'est plus proche de la réalité — personne ne
 * choisissait « OMS seul » pour se priver du dictionnaire.
 */

const WHO: WhoSettings = {
  clientId: 'id',
  clientSecret: 'secret',
  proxyUrl: 'https://passerelle.test',
  releaseId: '2024-01',
  lang: 'fr',
};

/**
 * Une passerelle injoignable — et rien d'autre. Le pied de page sonde
 * `version.json` au montage depuis le socle 4.4.1 : cette sonde-là doit
 * répondre, sinon on mesurerait l'échec de deux choses à la fois.
 */
function passerelleInjoignable() {
  const spy = vi.fn(async (input: RequestInfo | URL) => {
    if (String(input).endsWith('version.json')) {
      return new Response('{}', {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    throw new TypeError('Failed to fetch');
  });
  vi.stubGlobal('fetch', spy);
  return spy;
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

const analyser = async () => {
  await act(async () => {
    fireEvent.click(analyzeButton());
  });
  // `handleAnalyze` est asynchrone : le rendu de l'échec vient après le clic.
  await waitFor(() =>
    expect(useWorkspaceStore.getState().isAnalyzing).toBe(false)
  );
};

beforeEach(() => {
  // Le harnais jsdom annonce `en-US` : on fixe la langue, les messages
  // attendus ci-dessous sont ceux du catalogue français.
  localStorage.setItem(LOCALE_STORAGE_KEY, 'fr');
  resetOmsToken();
  useWorkspaceStore.getState().resetSession();
  useWorkspaceStore.getState().setCrText('Hypertension artérielle sévère.');
  useSettingsStore.setState({ who: WHO });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('HomePage quand la passerelle OMS tombe', () => {
  it('les codes locaux SORTENT quand même, et l’alerte le dit', async () => {
    passerelleInjoignable();
    renderHome();

    await analyser();

    // Le dictionnaire local a répondu (I10 = hypertension essentielle) et ses
    // codes ne partent PLUS à la poubelle avec l'échec réseau.
    expect(
      useWorkspaceStore.getState().suggestions.some(s => s.code === 'I10')
    ).toBe(true);
    // L'alerte porte les DEUX informations : la raison exacte de l'échec…
    const alerte = screen.getByRole('alert');
    expect(alerte).toHaveTextContent('Passerelle injoignable');
    // …et le fait que la moitié locale est là, sans quoi le message donnerait
    // à croire que toute l'analyse est perdue.
    expect(alerte).toHaveTextContent(
      'Les codes du dictionnaire CIM-10 local restent affichés.'
    );
  });

  it('aucune correspondance locale : l’alerte ne promet donc rien', async () => {
    passerelleInjoignable();
    act(() => {
      useWorkspaceStore.getState().setCrText('Xxxxxx yyyyyy zzzzzz.');
    });
    renderHome();

    await analyser();

    expect(useWorkspaceStore.getState().suggestions).toHaveLength(0);
    const alerte = screen.getByRole('alert');
    expect(alerte).toHaveTextContent('Passerelle injoignable');
    // Le suffixe « restent affichés » serait un mensonge : il n'y a rien.
    expect(alerte).not.toHaveTextContent('restent affichés');
  });

  it('sans correspondance locale : pas de codes PÉRIMÉS sur l’écran', async () => {
    renderHome();

    // Une première analyse, avec un texte que le dictionnaire reconnaît :
    // l'écran porte des codes. (La passerelle n'est pas encore doublée, elle
    // échoue donc toute seule — ce n'est pas le sujet de ce test.)
    await analyser();
    expect(
      useWorkspaceStore.getState().suggestions.length
    ).toBeGreaterThanOrEqual(1);

    // Puis un autre compte-rendu, sans correspondance, et l'OMS qui tombe.
    passerelleInjoignable();
    act(() => {
      useWorkspaceStore.getState().setCrText('Xxxxxx yyyyyy zzzzzz.');
    });
    await analyser();

    // Les codes du PREMIER texte ne doivent pas rester : ils ne décrivent plus
    // le compte-rendu affiché.
    expect(useWorkspaceStore.getState().suggestions).toHaveLength(0);
    expect(screen.getByRole('alert')).not.toHaveTextContent('restent affichés');
  });
});
