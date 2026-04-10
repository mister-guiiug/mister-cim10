/**
 * Proxy CORS pour l’ICD API OMS (jeton + autocode ICD-11 MMS).
 * Déployer sur Cloudflare Workers (ou adapter pour Deno Deploy / autre).
 *
 * Variables d’environnement (recommandé) :
 * - ALLOWED_ORIGINS : origines autorisées, séparées par des virgules
 *   ex. https://votrecompte.github.io,http://localhost:5173
 *   Si vide, Access-Control-Allow-Origin: * (déconseillé en production).
 */
const TOKEN_URL = 'https://icdaccessmanagement.who.int/connect/token';
const API_BASE = 'https://id.who.int';

/** @param {Request} request @param {{ ALLOWED_ORIGINS?: string }} env */
function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const raw = (env.ALLOWED_ORIGINS || '').trim();
  const allowed = raw
    ? raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  let allowOrigin = '*';
  if (allowed.length) {
    if (!origin || !allowed.includes(origin)) {
      return null;
    }
    allowOrigin = origin;
  }
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  /** @param {Request} request @param {{ ALLOWED_ORIGINS?: string }} env */
  async fetch(request, env) {
    const ch = corsHeaders(request, env);
    if (!ch) {
      return new Response(JSON.stringify({ error: 'Origin non autorisée pour ce proxy.' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: ch });
    }

    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/+|\/+$/g, '') || '';

    try {
      if (path === 'token' && request.method === 'POST') {
        const body = await request.json();
        const clientId = body?.clientId;
        const clientSecret = body?.clientSecret;
        if (!clientId || !clientSecret) {
          return new Response(JSON.stringify({ error: 'clientId et clientSecret requis' }), {
            status: 400,
            headers: { ...ch, 'Content-Type': 'application/json' },
          });
        }
        const params = new URLSearchParams({
          grant_type: 'client_credentials',
          scope: 'icdapi_access',
        });
        const basic = btoa(`${clientId}:${clientSecret}`);
        const res = await fetch(TOKEN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${basic}`,
          },
          body: params.toString(),
        });
        const text = await res.text();
        return new Response(text, {
          status: res.status,
          headers: { ...ch, 'Content-Type': 'application/json; charset=utf-8' },
        });
      }

      if (path === 'autocode' && request.method === 'GET') {
        const auth = request.headers.get('Authorization');
        if (!auth || !auth.startsWith('Bearer ')) {
          return new Response(JSON.stringify({ error: 'Authorization Bearer requis' }), {
            status: 401,
            headers: { ...ch, 'Content-Type': 'application/json' },
          });
        }
        const releaseId = url.searchParams.get('releaseId') || '2025-01';
        const searchText = url.searchParams.get('searchText') || '';
        const lang = url.searchParams.get('lang') || 'fr';
        const matchThreshold = url.searchParams.get('matchThreshold');

        const target = new URL(`${API_BASE}/icd/release/11/${releaseId}/mms/autocode`);
        target.searchParams.set('searchText', searchText);
        if (matchThreshold != null && matchThreshold !== '') {
          target.searchParams.set('matchThreshold', matchThreshold);
        }

        const res = await fetch(target.toString(), {
          headers: {
            Authorization: auth,
            'API-Version': 'v2',
            'Accept-Language': lang,
            Accept: 'application/json',
          },
        });
        const text = await res.text();
        return new Response(text, {
          status: res.status,
          headers: { ...ch, 'Content-Type': res.headers.get('Content-Type') || 'application/json; charset=utf-8' },
        });
      }

      return new Response(
        JSON.stringify({
          error: 'Route inconnue. Utilisez POST /token et GET /autocode.',
        }),
        { status: 404, headers: { ...ch, 'Content-Type': 'application/json' } }
      );
    } catch (e) {
      return new Response(JSON.stringify({ error: String(e) }), {
        status: 502,
        headers: { ...ch, 'Content-Type': 'application/json' },
      });
    }
  },
};
