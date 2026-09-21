/**
 * Ce que le BUILD fournit, et ce que l'appareil garde.
 *
 * Deux règles se croisent ici, et chacune a déjà cassé une application du parc
 * quand elle manquait : un réglage enregistré l'emporte toujours sur un défaut
 * (sinon on écrase le choix de l'utilisateur à la mise à jour), et un défaut
 * doit atteindre les appareils DÉJÀ en service (sinon la configuration
 * n'arrive jamais là où elle est utile).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { refreshSnapshot, updateSnapshot } from './app-store';
import { LS_KEYS } from './constants';
import { readWhoSettings, writeWhoSettings } from './settings';

const PASSERELLE = 'https://mister-cim10.mister-guiiug.workers.dev';

beforeEach(() => {
  localStorage.clear();
  refreshSnapshot();
});

afterEach(() => {
  vi.unstubAllEnvs();
  localStorage.clear();
  refreshSnapshot();
});

describe('readWhoSettings', () => {
  it('appareil vierge sans build : tout est vide, la version et la langue exceptées', () => {
    const who = readWhoSettings();
    expect(who.proxyUrl).toBe('');
    expect(who.clientId).toBe('');
    expect(who.clientSecret).toBe('');
    expect(who.releaseId).toBe('2025-01');
  });

  it('le build pose la passerelle sur un appareil vierge', () => {
    vi.stubEnv('VITE_WHO_PROXY_URL', PASSERELLE);
    expect(readWhoSettings().proxyUrl).toBe(PASSERELLE);
  });

  // LE CAS QUI COMPTE : l'application est déjà déployée. Ces appareils ont un
  // instantané écrit avant que la variable existe, avec `proxyUrl: ''`. Comblé
  // à l'initialisation seulement, le défaut ne leur serait jamais parvenu.
  it('le build comble un instantané DÉJÀ écrit avec une passerelle vide', () => {
    updateSnapshot({
      who: { clientId: '', proxyUrl: '', releaseId: '2025-01', lang: 'fr' },
    });
    vi.stubEnv('VITE_WHO_PROXY_URL', PASSERELLE);
    expect(readWhoSettings().proxyUrl).toBe(PASSERELLE);
  });

  it('une passerelle saisie l’emporte sur celle du build', () => {
    updateSnapshot({
      who: {
        clientId: 'a-moi',
        proxyUrl: 'https://passerelle-a-moi.test',
        releaseId: '2023-01',
        lang: 'en',
      },
    });
    vi.stubEnv('VITE_WHO_PROXY_URL', PASSERELLE);
    vi.stubEnv('VITE_WHO_RELEASE_ID', '2025-01');
    vi.stubEnv('VITE_WHO_LANG', 'fr');
    const who = readWhoSettings();
    expect(who.proxyUrl).toBe('https://passerelle-a-moi.test');
    expect(who.releaseId).toBe('2023-01');
    expect(who.lang).toBe('en');
    expect(who.clientId).toBe('a-moi');
  });

  it('le mot secret reste hors de l’instantané, et le build n’en fournit aucun', () => {
    vi.stubEnv('VITE_WHO_PROXY_URL', PASSERELLE);
    writeWhoSettings({
      clientId: 'cid',
      clientSecret: 'sec',
      proxyUrl: PASSERELLE,
      releaseId: '2025-01',
      lang: 'fr',
    });
    expect(localStorage.getItem(LS_KEYS.WHO_CLIENT_SECRET)).toBe('sec');
    expect(JSON.stringify(readWhoSettings())).toContain('sec');
    // L'instantané, lui, ne doit pas le porter.
    const brut = localStorage.getItem('cim10_data') ?? '';
    expect(brut).not.toContain('sec');
  });
});

describe('isReady', () => {
  /** Le magasin lit son état au chargement : il faut le réimporter par test. */
  async function magasin() {
    vi.resetModules();
    const { useSettingsStore } = await import('../store/settingsStore');
    return useSettingsStore;
  }

  it('mode local : prêt, sans rien', async () => {
    const store = await magasin();
    expect(store.getState().isReady()).toBe(true);
  });

  it('mode OMS sans passerelle : pas prêt', async () => {
    const store = await magasin();
    store.getState().setMode('api');
    expect(store.getState().isReady()).toBe(false);
  });

  // LE CŒUR DU CHANGEMENT. La passerelle du parc porte le compte OMS en secrets,
  // côté serveur : exiger des identifiants ici rendait l'application
  // inutilisable alors que tout était en place.
  it('mode OMS sur la passerelle du build, sans identifiants : PRÊT', async () => {
    vi.stubEnv('VITE_WHO_PROXY_URL', PASSERELLE);
    const store = await magasin();
    store.getState().setMode('api');
    expect(store.getState().who.proxyUrl).toBe(PASSERELLE);
    expect(store.getState().who.clientSecret).toBe('');
    expect(store.getState().isReady()).toBe(true);
  });

  it('mode OMS sur une passerelle saisie à la main : il faut un compte', async () => {
    vi.stubEnv('VITE_WHO_PROXY_URL', PASSERELLE);
    const store = await magasin();
    store.getState().setMode('both');
    store.getState().setWho({ proxyUrl: 'https://passerelle-a-moi.test' });
    expect(store.getState().isReady()).toBe(false);

    store.getState().setWho({ clientId: 'cid', clientSecret: 'sec' });
    expect(store.getState().isReady()).toBe(true);
  });
});
