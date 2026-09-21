/**
 * Ce que le BUILD fournit, et ce que l'appareil garde.
 *
 * Trois règles se croisent ici, et les deux premières ont déjà cassé une
 * application du parc quand elles manquaient : un réglage enregistré l'emporte
 * sur un défaut (sinon on écrase le choix de l'utilisateur à la mise à jour),
 * un défaut doit atteindre les appareils DÉJÀ en service (sinon la
 * configuration n'arrive jamais là où elle est utile) — et, depuis que la CSP
 * ne laisse joindre que la passerelle du build, une adresse enregistrée qu'elle
 * refuse est reprise : la garder ne respecterait qu'une règle, au prix d'un OMS
 * muet.
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

  it('une passerelle que la CSP refuse retombe sur celle du build', () => {
    // LA RÈGLE A CHANGÉ, ET C'EST VOULU. Elle était « une valeur enregistrée
    // l'emporte toujours », et elle tenait tant qu'une passerelle saisie
    // pouvait répondre. Depuis que `connect-src` ne porte que l'origine du
    // build et `*.who.int`, une autre adresse est coupée par le navigateur :
    // l'appareil n'obtient plus rien de l'OMS, sans un mot d'explication.
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
    expect(who.proxyUrl).toBe(PASSERELLE);
    // Le reste des réglages enregistrés, lui, l'emporte toujours : seule
    // l'adresse injoignable est reprise.
    expect(who.releaseId).toBe('2023-01');
    expect(who.lang).toBe('en');
    expect(who.clientId).toBe('a-moi');
  });

  it('une passerelle sur who.int est gardée : la CSP l’autorise', () => {
    updateSnapshot({
      who: {
        clientId: '',
        proxyUrl: 'https://id.who.int',
        releaseId: '',
        lang: '',
      },
    });
    vi.stubEnv('VITE_WHO_PROXY_URL', PASSERELLE);
    expect(readWhoSettings().proxyUrl).toBe('https://id.who.int');
  });

  it('sans passerelle au build, on n’efface pas la seule qu’on ait', () => {
    // Un fork, le développement : il n'y a rien de mieux à proposer, et
    // effacer l'adresse ne réparerait rien — ça priverait seulement.
    updateSnapshot({
      who: {
        clientId: '',
        proxyUrl: 'https://passerelle-a-moi.test',
        releaseId: '',
        lang: '',
      },
    });
    vi.stubEnv('VITE_WHO_PROXY_URL', '');
    expect(readWhoSettings().proxyUrl).toBe('https://passerelle-a-moi.test');
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

describe('le magasin de réglages', () => {
  /** Le magasin lit son état au chargement : il faut le réimporter par test. */
  async function magasin() {
    vi.resetModules();
    const { useSettingsStore } = await import('../store/settingsStore');
    return useSettingsStore;
  }

  // LE CŒUR DU CHANGEMENT : la passerelle du build arrive CONFIGURÉE, et sans
  // qu'on ait à saisir d'identifiants — elle porte le compte OMS en secrets,
  // côté serveur. L'application n'a plus qu'à s'en servir.
  it('la passerelle du build arrive posée, sans identifiants', async () => {
    vi.stubEnv('VITE_WHO_PROXY_URL', PASSERELLE);
    const store = await magasin();
    expect(store.getState().who.proxyUrl).toBe(PASSERELLE);
    expect(store.getState().who.clientId).toBe('');
    expect(store.getState().who.clientSecret).toBe('');
  });

  // `isReady()` A DISPARU AVEC LE MODE. Il bloquait « Analyser » tant que l'OMS
  // n'était pas configurée ; le dictionnaire embarqué répondant toujours, il n'y
  // a plus d'état « pas prêt » — et plus rien à désactiver. Ce test le fige :
  // le réintroduire serait revenir en arrière sans le vouloir.
  it('n’expose plus d’état « pas prêt »', async () => {
    const store = await magasin();
    expect('isReady' in store.getState()).toBe(false);
    expect('mode' in store.getState()).toBe(false);
    expect('setMode' in store.getState()).toBe(false);
  });

  // LA SURCHARGE, C'EST LE COMPTE — plus l'adresse. Les deux champs restants
  // substituent les identifiants de l'utilisateur à ceux que porte la
  // passerelle ; les vider ramène au compte fourni.
  it('un compte saisi substitue celui de la passerelle, et se vide', async () => {
    vi.stubEnv('VITE_WHO_PROXY_URL', PASSERELLE);
    const store = await magasin();
    store.getState().setWho({ clientId: 'cid', clientSecret: 'sec' });
    expect(store.getState().who.clientId).toBe('cid');
    expect(store.getState().who.clientSecret).toBe('sec');
    // La passerelle, elle, reste celle du build : rien ne la change plus.
    expect(store.getState().who.proxyUrl).toBe(PASSERELLE);

    store.getState().setWho({ clientId: '', clientSecret: '' });
    expect(store.getState().who.clientId).toBe('');
    expect(store.getState().who.clientSecret).toBe('');
  });
});
