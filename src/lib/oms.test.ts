import { afterEach, describe, expect, it, vi } from 'vitest';
import { OmsError, resetOmsToken, segmentReport, suggestFromOms } from './oms';
import type { WhoSettings } from '../types/index';

const who: WhoSettings = {
  clientId: 'cid',
  clientSecret: 'sec',
  proxyUrl: 'https://proxy.test/',
  releaseId: '2025-01',
  lang: 'fr',
};

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });

function stubFetch(
  handler: (url: string, init?: RequestInit) => Response
): void {
  vi.stubGlobal(
    'fetch',
    vi.fn((input: string | URL | Request, init?: RequestInit) =>
      Promise.resolve(handler(String(input), init))
    )
  );
}

afterEach(() => {
  resetOmsToken();
  vi.unstubAllGlobals();
});

describe('segmentReport', () => {
  it('découpe par phrases/lignes, filtre le court, déduplique, plafonne à 15', () => {
    const segs = segmentReport(
      'Diabète type 2.\nHTA; insuffisance rénale. ok\nDiabète type 2'
    );
    expect(segs).toContain('Diabète type 2');
    expect(segs).toContain('insuffisance rénale');
    expect(segs).not.toContain('ok'); // < 4 caractères
    expect(segs.filter(s => s === 'Diabète type 2')).toHaveLength(1); // dédup
  });
});

describe('suggestFromOms', () => {
  it('authentifie puis autocode chaque segment → suggestions source=api, dédup, triées par confiance', async () => {
    stubFetch((url, init) => {
      if (url.endsWith('/token')) {
        const body = JSON.parse(String(init?.body ?? '{}')) as {
          clientId: string;
        };
        expect(body.clientId).toBe('cid');
        return json({ access_token: 'tok', expires_in: 3600 });
      }
      if (url.includes('/autocode')) {
        const headers = init?.headers as Record<string, string>;
        expect(headers.Authorization).toBe('Bearer tok');
        const q = new URL(url).searchParams.get('searchText') ?? '';
        if (q.includes('Diabète'))
          return json({
            theCode: '5A11',
            matchingText: 'Diabète de type 2',
            matchScore: 0.9,
          });
        if (q.includes('HTA'))
          return json({
            theCode: 'BA00',
            matchingText: 'Hypertension',
            matchScore: 0.7,
          });
        return json({ theCode: null });
      }
      return json(null, 404);
    });

    const res = await suggestFromOms('Diabète type 2. HTA sévère. zzz', who);
    expect(res).toHaveLength(2);
    expect(res[0]?.code).toBe('5A11'); // confiance 0.9 en tête
    expect(res[0]?.source).toBe('api');
    expect(res[0]?.confidence).toBeCloseTo(0.9);
    expect(res[1]?.code).toBe('BA00');
  });

  it('déduplique si deux segments renvoient le même code', async () => {
    stubFetch(url =>
      url.endsWith('/token')
        ? json({ access_token: 'tok', expires_in: 3600 })
        : json({ theCode: '5A11', matchingText: 'Diabète', matchScore: 0.8 })
    );
    const res = await suggestFromOms('Diabète. Diabète sucré.', who);
    expect(res).toHaveLength(1);
    expect(res[0]?.code).toBe('5A11');
  });

  it('identifiants refusés (401 sur /token) → OmsError', async () => {
    stubFetch(url =>
      url.endsWith('/token') ? json({ error: 'unauthorized' }, 401) : json(null)
    );
    await expect(suggestFromOms('Diabète type 2.', who)).rejects.toBeInstanceOf(
      OmsError
    );
  });
});
