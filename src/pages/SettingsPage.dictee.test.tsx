import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { AnnouncerProvider } from '@mister-guiiug/dev-pwa-config/react/a11y';
import { I18nProvider, LOCALE_STORAGE_KEY } from '../i18n';
import { SocleLabelsBridge } from '../components/SocleLabelsBridge';
import { DialogProvider } from '../components/DialogProvider';
import { refreshSnapshot } from '../lib/app-store';
import { enregistrerAccordDictee, lireAccordDictee } from '../lib/dictee';
import { SettingsPage } from './SettingsPage';

/**
 * Un accord donné en un clic doit se reprendre en un clic, et dire ce qu'il
 * en est — sans vider les données du site.
 */

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

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(LOCALE_STORAGE_KEY, 'fr');
  refreshSnapshot();
});

describe('Réglages — l’accord pour la dictée en ligne', () => {
  it('sans accord, le dit, et n’offre rien à retirer', () => {
    monter();
    expect(
      screen.getByText(/Aucun accord enregistré : la dictée en ligne/u)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Retirer mon accord' })
    ).toBeNull();
  });

  it('un accord donné se lit avec sa date, et se retire', () => {
    enregistrerAccordDictee(new Date(2026, 8, 25).getTime());
    monter();
    expect(
      screen.getByText(/Accord donné le 25\/09\/2026 pour la dictée en ligne/u)
    ).toBeInTheDocument();

    const bouton = screen.getByRole('button', { name: 'Retirer mon accord' });
    fireEvent.click(bouton);

    expect(lireAccordDictee()).toBeNull();
    // Le bouton reste là, focalisable, et dit ce qui vient d'arriver.
    const apres = screen.getByRole('button', { name: /Accord retiré/u });
    expect(apres).toHaveAttribute('aria-disabled', 'true');
    expect(apres).not.toBeDisabled();
    expect(screen.getByText(/Aucun accord enregistré/u)).toBeInTheDocument();
  });
});
