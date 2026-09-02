import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UpdateButton } from '@mister-guiiug/dev-wpa-config/react/update-button';
import { swStub } from '@mister-guiiug/dev-wpa-config/testing/pwa-register';
import { I18nProvider, LOCALE_STORAGE_KEY } from '../i18n';
import { SocleLabelsBridge } from './SocleLabelsBridge';
import { PwaUpdates } from './PwaUpdates';

/**
 * CE QUE CE FICHIER TIENT. `src/register-sw.ts` fabriquait son bandeau en DOM
 * natif et n'était couvert par aucun test : personne n'aurait vu qu'il ne
 * pouvait pas s'afficher. Il ne le pouvait pas — `registerType: 'autoUpdate'`
 * fait que le module engendré par vite-plugin-pwa n'appelle JAMAIS
 * `onNeedRefresh`. Monté, traduit, livré dans le bundle, et muet.
 *
 * Ici, c'est le CÂBLAGE RÉEL de `main.tsx` qui est monté, pas le composant du
 * socle dans un décor allégé : `I18nProvider` → `SocleLabelsBridge` →
 * `PwaUpdates`. `swStub.needRefresh()` LÈVE si personne n'a injecté
 * `registerSW`, ce qui transforme le silence en échec de test.
 */

// Le setup partagé du socle pose un `vi.mock('virtual:pwa-register')` MUET (un
// `registerSW` qui n'annonce jamais rien). Il suffit à faire compiler un import,
// pas à éprouver un bandeau : on lui rend la main au profit du double pilotable
// désigné par le `resolve.alias` de `vitest.config.ts`.
vi.unmock('virtual:pwa-register');

function renderApp(children?: React.ReactNode) {
  return render(
    <I18nProvider>
      <SocleLabelsBridge>
        <PwaUpdates>{children}</PwaUpdates>
      </SocleLabelsBridge>
    </I18nProvider>
  );
}

const banner = () => document.querySelector('[data-dwc="update-banner"]');

describe('PwaUpdates', () => {
  beforeEach(() => {
    // `reset()` renouvelle l'IDENTITÉ de `registerSW` : `useUpdatePrompt`
    // mémorise sa connexion par WeakMap, un double unique garderait
    // `needRefresh` d'un test au suivant.
    swStub.reset();
    localStorage.setItem(LOCALE_STORAGE_KEY, 'fr');
  });

  it('enregistre le service worker une seule fois', () => {
    renderApp();
    expect(swStub.registered).toBe(true);
    expect(swStub.calls).toBe(1);
    // `immediate` : l'enregistrement ne doit pas attendre l'évènement `load`.
    expect(swStub.options?.immediate).toBe(true);
  });

  it('affiche le bandeau quand une version attend, avec les libellés de l’app', () => {
    renderApp();
    expect(banner()).toBeNull();

    act(() => {
      swStub.needRefresh();
    });

    expect(banner()).not.toBeNull();
    expect(
      screen.getByText('🎨 Nouveau logo ! Une mise à jour est disponible.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Mettre à jour' })
    ).toBeInTheDocument();
    // Et une sortie : un bandeau sans échappatoire est un piège. L'ancienne
    // barre n'en offrait aucune.
    expect(
      screen.getByRole('button', { name: 'Plus tard' })
    ).toBeInTheDocument();
  });

  it('laisse écarter le bandeau', () => {
    renderApp();
    act(() => {
      swStub.needRefresh();
    });

    act(() => {
      screen.getByRole('button', { name: 'Plus tard' }).click();
    });

    expect(banner()).toBeNull();
  });

  it('relaie les rappels d’enregistrement que portait register-sw.ts', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderApp();

    // `onRegisteredSW` et non `onRegistered` : vite-plugin-pwa n'appelle le
    // second que si le premier est absent, et le socle passe toujours le
    // premier. Un `onRegistered` câblé ici ne se déclencherait jamais.
    act(() => {
      swStub.registeredSW('/sw.js');
    });
    expect(log).toHaveBeenCalledWith(
      '[PWA] Service worker registered',
      '/sw.js',
      undefined
    );

    const boom = new Error('sw injoignable');
    act(() => {
      swStub.registerError(boom);
    });
    // Par le journal du socle (`createLogger('pwa')`) : préfixe du logger,
    // erreur portée dans les données.
    expect(error).toHaveBeenCalledWith(
      '[pwa] Service worker registration error',
      { error: boom }
    );

    log.mockRestore();
    error.mockRestore();
  });

  it('partage son état avec le bouton des Paramètres, sans second enregistrement', () => {
    renderApp(<UpdateButton label="Recharger l’application" />);

    expect(
      screen.getByRole('button', { name: 'Recharger l’application' })
    ).toHaveAttribute('data-dwc', 'update-button');
    // Le fournisseur est le SEUL à monter le hook : le bouton posé sous lui ne
    // réenregistre rien.
    expect(swStub.calls).toBe(1);
  });
});
