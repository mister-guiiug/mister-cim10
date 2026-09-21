import { afterEach, describe, expect, it, vi } from 'vitest';
import { defautsWho, passerelleFournieParLeBuild } from './who-defaults';

/** L'adresse réelle de la passerelle du parc, celle que le build injecte. */
const PASSERELLE = 'https://mister-cim10.mister-guiiug.workers.dev';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('defautsWho', () => {
  it('sans variable de build : aucune passerelle, mais une version et une langue', () => {
    expect(defautsWho()).toEqual({
      proxyUrl: '',
      releaseId: '2025-01',
      lang: 'fr',
    });
  });

  it('lit les trois variables du build et coupe les espaces', () => {
    vi.stubEnv('VITE_WHO_PROXY_URL', `  ${PASSERELLE}  `);
    vi.stubEnv('VITE_WHO_RELEASE_ID', '2024-01');
    vi.stubEnv('VITE_WHO_LANG', 'en');
    expect(defautsWho()).toEqual({
      proxyUrl: PASSERELLE,
      releaseId: '2024-01',
      lang: 'en',
    });
  });

  // Le workflow réutilisable écrit `VITE_X=` quand la variable de dépôt n'existe
  // pas : le build reçoit une chaîne vide, pas une absence. Sans ce repli,
  // l'application demanderait la version « » à l'OMS.
  it('une variable vide vaut une variable absente', () => {
    vi.stubEnv('VITE_WHO_RELEASE_ID', '   ');
    vi.stubEnv('VITE_WHO_LANG', '');
    const d = defautsWho();
    expect(d.releaseId).toBe('2025-01');
    expect(d.lang).toBe('fr');
  });
});

describe('passerelleFournieParLeBuild', () => {
  it('faux sans variable de build, même pour une adresse plausible', () => {
    expect(passerelleFournieParLeBuild(PASSERELLE)).toBe(false);
  });

  it('vrai pour l’adresse du build, faux pour une autre', () => {
    vi.stubEnv('VITE_WHO_PROXY_URL', PASSERELLE);
    expect(passerelleFournieParLeBuild(PASSERELLE)).toBe(true);
    expect(passerelleFournieParLeBuild(`  ${PASSERELLE}  `)).toBe(true);
    expect(passerelleFournieParLeBuild('https://passerelle-a-moi.test')).toBe(
      false
    );
  });

  it('une adresse vide n’est jamais la passerelle du build', () => {
    vi.stubEnv('VITE_WHO_PROXY_URL', PASSERELLE);
    expect(passerelleFournieParLeBuild('')).toBe(false);
  });
});
