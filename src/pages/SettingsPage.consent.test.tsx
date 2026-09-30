import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnnouncerProvider } from '@mister-guiiug/dev-pwa-config/react/a11y';
import {
  isAnalyticsLoaded,
  resetAnalytics,
} from '@mister-guiiug/dev-pwa-config/analytics';
import {
  readConsentChoice,
  writeConsentChoice,
} from '@mister-guiiug/dev-pwa-config/react/consent-banner';
import { CLE_DE_TEST } from '@mister-guiiug/dev-pwa-config/testing/posthog';
import { I18nProvider, LOCALE_STORAGE_KEY } from '../i18n';
import { SocleLabelsBridge } from '../components/SocleLabelsBridge';
import { DialogProvider } from '../components/DialogProvider';
import { refreshSnapshot } from '../lib/app-store';
import { SettingsPage } from './SettingsPage';

/**
 * La mesure d’audience s’accepte en un clic au bandeau : elle doit se retirer
 * aussi simplement depuis les réglages (RGPD, art. 7.3).
 */

// L’accord rejoué au montage charge la bibliothèque : la vraie partirait
// joindre PostHog depuis jsdom. Le double du socle se souvient d’un retrait.
vi.mock('posthog-js/dist/module.slim.js', async () => {
  const { fauxPosthog } =
    await import('@mister-guiiug/dev-pwa-config/testing/posthog');
  return { default: fauxPosthog() };
});

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
  vi.stubEnv('VITE_POSTHOG_KEY', CLE_DE_TEST);
  // L’état de la mesure est celui d’un module : il survivrait d’un test à
  // l’autre.
  resetAnalytics();
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe('Réglages — la mesure d’audience', () => {
  it('un accord donné se retire ici, en un clic', async () => {
    writeConsentChoice('granted');
    monter();

    const titre = await screen.findByRole('heading', {
      name: 'Mesure d’audience',
    });
    const section = titre.closest('section')!;
    expect(within(section).getByRole('status')).toHaveTextContent(
      'Vous avez accepté cette mesure.'
    );
    // L’accord rejoué a chargé la bibliothèque (le double).
    await waitFor(() => expect(isAnalyticsLoaded()).toBe(true));

    fireEvent.click(
      within(section).getByRole('button', {
        name: 'Retirer mon consentement',
      })
    );

    expect(readConsentChoice()).toBe('denied');
    const posthog = (await import('posthog-js/dist/module.slim.js')).default;
    expect(posthog.has_opted_out_capturing()).toBe(true);
    expect(within(section).getByRole('status')).toHaveTextContent(
      'Vous avez refusé cette mesure.'
    );
  });

  it('suit la langue de l’application', async () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'en');
    writeConsentChoice('granted');
    monter();

    const titre = await screen.findByRole('heading', {
      name: 'Audience measurement',
    });
    expect(
      within(titre.closest('section')!).getByRole('button', {
        name: 'Withdraw my consent',
      })
    ).toBeInTheDocument();
  });
});
