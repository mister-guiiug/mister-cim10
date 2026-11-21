import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnnouncerProvider } from '@mister-guiiug/dev-pwa-config/react/a11y';
import { I18nProvider, LOCALE_STORAGE_KEY } from '../i18n';
import { SocleLabelsBridge } from '../components/SocleLabelsBridge';
import { DialogProvider } from '../components/DialogProvider';
import { readSnapshot, refreshSnapshot } from '../lib/app-store';
import { readWhoSettings } from '../lib/settings';
import { useSettingsStore } from '../store/settingsStore';
import { SettingsPage } from './SettingsPage';

/**
 * LA CONFIGURATION OMS EST FIXÉE, L'APPAREIL NE FAIT QUE LA SURCHARGER
 * (21/11/2026).
 *
 * Avant, les Réglages ouvraient des champs « Identifiant » et « Mot secret »
 * à remplir, alors que la passerelle du build porte déjà le compte : deux
 * champs vides se lisaient comme une configuration inachevée. La configuration
 * en vigueur s'affiche désormais en lecture ; les champs vivent dans un volet
 * « Surcharger la configuration », replié tant que rien n'est surchargé.
 */
const PASSERELLE = 'https://mister-cim10.mister-guiiug.workers.dev';

function monter() {
  render(
    <MemoryRouter>
      <I18nProvider>
        <SocleLabelsBridge>
          <AnnouncerProvider>
            <DialogProvider>
              <SettingsPage />
            </DialogProvider>
          </AnnouncerProvider>
        </SocleLabelsBridge>
      </I18nProvider>
    </MemoryRouter>
  );
}

/** Le store relit le build et l'appareil, comme au démarrage. */
function demarrer() {
  refreshSnapshot();
  useSettingsStore.setState({ who: readWhoSettings() });
}

const volet = () =>
  screen.getByText('Surcharger la configuration').closest('details')!;

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(LOCALE_STORAGE_KEY, 'fr');
});

afterEach(() => {
  vi.unstubAllEnvs();
  localStorage.clear();
});

describe('avec la passerelle du build', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_WHO_PROXY_URL', PASSERELLE);
    demarrer();
  });

  it('affiche la configuration en vigueur, et replie la surcharge', () => {
    monter();
    expect(screen.getByText('celle du site')).toBeInTheDocument();
    expect(screen.getByText('celui de la passerelle')).toBeInTheDocument();
    expect(screen.getByText('2025-01')).toBeInTheDocument();
    expect(volet().open).toBe(false);
    expect(
      screen.getByRole('button', { name: 'Revenir à la configuration du site' })
    ).toBeDisabled();
  });

  it('une surcharge se dit dans la configuration, et rouvre son volet', () => {
    useSettingsStore.getState().setWho({ releaseId: '2024-01' });
    monter();
    // « 2024-01 » est aussi une option de la liste : on vise la définition.
    const ligne = screen.getByText('2024-01', { selector: 'dd' });
    expect(within(ligne).getByText('surchargée')).toBeInTheDocument();
    expect(volet().open).toBe(true);
  });

  it('« Revenir à la configuration du site » efface toutes les surcharges', () => {
    useSettingsStore
      .getState()
      .setWho({ clientId: 'a-moi', clientSecret: 'sec', lang: 'en' });
    monter();
    expect(screen.getByText('le vôtre (a-moi), en surcharge')).toBeVisible();

    fireEvent.click(
      screen.getByRole('button', { name: 'Revenir à la configuration du site' })
    );

    expect(screen.getByText('celui de la passerelle')).toBeInTheDocument();
    const who = useSettingsStore.getState().who;
    expect(who.clientId).toBe('');
    expect(who.clientSecret).toBe('');
    expect(who.lang).toBe('fr');
    // Rien de surchargé ne reste dans le navigateur.
    expect(readSnapshot().who).toEqual({
      clientId: '',
      releaseId: '',
      lang: '',
    });
  });

  it('le lien « Partager le paramétrage » a disparu', () => {
    monter();
    expect(
      screen.queryByRole('button', { name: /partager ou copier le lien/i })
    ).toBeNull();
  });
});

describe('sans passerelle au build', () => {
  it('le dit, et n’offre rien à surcharger', () => {
    demarrer();
    monter();
    expect(
      screen.getByText(/n’est pas reliée à l’OMS : seul le dictionnaire/u)
    ).toBeInTheDocument();
    expect(screen.queryByText('Surcharger la configuration')).toBeNull();
    expect(screen.queryByLabelText('Identifiant')).toBeNull();
  });
});
