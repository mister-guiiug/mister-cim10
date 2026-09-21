/**
 * La passerelle elle-même (`workers/who-icd-proxy.js`), éprouvée depuis ici.
 *
 * Elle vit hors de `src/`, mais c'est le SEUL endroit où le mot secret OMS peut
 * exister : la moitié serveur du changement mérite donc une épreuve, pas
 * seulement un déploiement à l'aveugle. Le worker est un module ESM ordinaire
 * dont `fetch(request, env)` est une fonction pure de ses arguments — il suffit
 * de doubler le `fetch` global qu'il appelle.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import proxy from '../../workers/who-icd-proxy.js';

const ORIGINE = 'https://mister-guiiug.github.io';

/** L'environnement du worker — tout y est optionnel, comme sur Cloudflare. */
interface EnvPasserelle {
  ALLOWED_ORIGINS?: string;
  WHO_CLIENT_ID?: string;
  WHO_CLIENT_SECRET?: string;
}

const ENV_AVEC_COMPTE: EnvPasserelle = {
  ALLOWED_ORIGINS: ORIGINE,
  WHO_CLIENT_ID: 'compte-de-la-passerelle',
  WHO_CLIENT_SECRET: 'secret-de-la-passerelle',
};

/** Ce que l'OMS a reçu comme en-tête `Authorization`, décodé. */
let basicRecu: string | null = null;

function doublerOms(): void {
  basicRecu = null;
  vi.stubGlobal(
    'fetch',
    vi.fn((input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('icdaccessmanagement.who.int')) {
        const headers = (init?.headers ?? {}) as Record<string, string>;
        const brut = (headers.Authorization ?? '').replace(/^Basic /, '');
        basicRecu = brut ? atob(brut) : null;
        return Promise.resolve(
          new Response(
            JSON.stringify({ access_token: 'tok-oms', expires_in: 3600 }),
            { status: 200, headers: { 'content-type': 'application/json' } }
          )
        );
      }
      return Promise.resolve(new Response('{}', { status: 200 }));
    })
  );
}

const demanderJeton = (
  corps: string | null,
  env: EnvPasserelle = ENV_AVEC_COMPTE
) =>
  proxy.fetch(
    new Request('https://passerelle.test/token', {
      method: 'POST',
      headers: { Origin: ORIGINE, 'Content-Type': 'application/json' },
      ...(corps === null ? {} : { body: corps }),
    }),
    env
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('passerelle OMS — /token', () => {
  it('corps vide : la passerelle met SON compte', async () => {
    doublerOms();
    const res = await demanderJeton('{}');
    expect(res.status).toBe(200);
    expect(basicRecu).toBe('compte-de-la-passerelle:secret-de-la-passerelle');
  });

  // Sans le `catch` sur `request.json()`, un POST sans corps du tout levait et
  // ressortait en 502 : un défaut de configuration déguisé en panne de l'OMS.
  it('AUCUN corps : toléré, pas de 502', async () => {
    doublerOms();
    const res = await demanderJeton(null);
    expect(res.status).toBe(200);
    expect(basicRecu).toBe('compte-de-la-passerelle:secret-de-la-passerelle');
  });

  it('un compte apporté par l’appelant L’EMPORTE sur celui de la passerelle', async () => {
    doublerOms();
    const res = await demanderJeton(
      JSON.stringify({ clientId: 'a-moi', clientSecret: 'mon-secret' })
    );
    expect(res.status).toBe(200);
    expect(basicRecu).toBe('a-moi:mon-secret');
  });

  it('ni compte apporté ni secrets posés : 400, et l’OMS n’est pas appelée', async () => {
    doublerOms();
    const res = await demanderJeton('{}', { ALLOWED_ORIGINS: ORIGINE });
    expect(res.status).toBe(400);
    expect(basicRecu).toBeNull();
    expect(await res.json()).toMatchObject({
      error: expect.stringContaining('WHO_CLIENT_ID'),
    });
  });

  it('une origine non autorisée est refusée AVANT tout appel à l’OMS', async () => {
    doublerOms();
    const res = await proxy.fetch(
      new Request('https://passerelle.test/token', {
        method: 'POST',
        headers: { Origin: 'https://site-tiers.test' },
        body: '{}',
      }),
      ENV_AVEC_COMPTE
    );
    expect(res.status).toBe(403);
    expect(basicRecu).toBeNull();
  });
});
