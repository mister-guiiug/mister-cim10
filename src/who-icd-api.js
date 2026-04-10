import { randomId } from './random-id.js';

/** @see https://icd.who.int/icdapi — https://icd.who.int/docs/icd-api/APIDoc-Version2/ */
const TOKEN_URL = 'https://icdaccessmanagement.who.int/connect/token';
const API_BASE = 'https://id.who.int';

let cachedToken = '';
let cachedTokenUntil = 0;
/** Dernier mode proxy utilisé pour le cache (chaîne normalisée ou ''). */
let cachedForProxy = '';

export function normalizeProxyBase(url) {
  const s = String(url || '').trim();
  if (!s) return '';
  try {
    const u = new URL(s);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return '';
    return `${u.origin}${u.pathname.replace(/\/$/, '')}`;
  } catch {
    return '';
  }
}

/**
 * @param {string} clientId
 * @param {string} clientSecret
 * @param {string} [proxyBase] URL du proxy (ex. Worker), sans slash final
 */
export async function fetchWhoAccessToken(clientId, clientSecret, proxyBase = '') {
  const proxy = normalizeProxyBase(proxyBase);

  if (proxy) {
    const res = await fetch(`${proxy}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret }),
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`La passerelle a refusé la connexion (${res.status}). ${t.slice(0, 160)}`);
    }
    const data = await res.json();
    const expiresIn = Number(data.expires_in) || 3600;
    return { accessToken: data.access_token, expiresIn };
  }

  const body = new URLSearchParams({
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
    body: body.toString(),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`L’OMS a refusé la connexion (${res.status}). Vérifiez l’identifiant et le mot secret. ${t.slice(0, 120)}`);
  }
  const data = await res.json();
  const expiresIn = Number(data.expires_in) || 3600;
  return { accessToken: data.access_token, expiresIn };
}

/**
 * @param {string} clientId
 * @param {string} clientSecret
 * @param {string} [proxyBase]
 */
export async function getWhoAccessTokenCached(clientId, clientSecret, proxyBase = '') {
  const proxy = normalizeProxyBase(proxyBase);
  const proxyKey = proxy || '';
  const now = Date.now();
  if (cachedToken && cachedTokenUntil > now + 60_000 && cachedForProxy === proxyKey) {
    return cachedToken;
  }
  const { accessToken, expiresIn } = await fetchWhoAccessToken(clientId, clientSecret, proxyBase);
  cachedToken = accessToken;
  cachedTokenUntil = now + Math.max(120, expiresIn - 300) * 1000;
  cachedForProxy = proxyKey;
  return accessToken;
}

export function clearWhoTokenCache() {
  cachedToken = '';
  cachedTokenUntil = 0;
  cachedForProxy = '';
}

/** Retire les balises de surbrillance éventuelles dans les réponses OMS. */
function stripTags(s) {
  return String(s || '').replace(/<[^>]*>/g, '').trim();
}

/**
 * Segments du texte pour plusieurs appels « autocode » (l’API renvoie une meilleure correspondance par requête).
 * @param {string} text
 * @param {number} maxPhrases
 */
export function splitTextForWhoAutocode(text, maxPhrases = 10) {
  const raw = text
    .split(/[;\n]+/)
    .flatMap((chunk) => chunk.split(/\s*,\s*/))
    .map((s) => s.trim())
    .filter((s) => s.length >= 4);
  const out = [];
  for (const s of raw) {
    if (out.length >= maxPhrases) break;
    out.push(s.slice(0, 480));
  }
  if (!out.length && text.trim().length >= 4) {
    out.push(text.trim().slice(0, 480));
  }
  return out;
}

/**
 * @param {string} accessToken
 * @param {string} searchText
 * @param {{ releaseId?: string; lang?: string; matchThreshold?: number; proxyBase?: string }} opts
 */
export async function whoIcd11MmsAutocode(accessToken, searchText, opts = {}) {
  const releaseId = opts.releaseId || '2025-01';
  const lang = opts.lang || 'fr';
  const proxy = normalizeProxyBase(opts.proxyBase || '');

  if (proxy) {
    const u = new URL(`${proxy}/autocode`);
    u.searchParams.set('releaseId', releaseId);
    u.searchParams.set('searchText', searchText);
    u.searchParams.set('lang', lang);
    if (opts.matchThreshold != null) {
      u.searchParams.set('matchThreshold', String(opts.matchThreshold));
    }
    const res = await fetch(u.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });
    if (res.status === 401) {
      clearWhoTokenCache();
      throw new Error('Session OMS expirée ou invalide. Relancez l’analyse.');
    }
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Le service OMS a répondu une erreur (${res.status}) : ${t.slice(0, 160)}`);
    }
    return res.json();
  }

  const url = new URL(`${API_BASE}/icd/release/11/${releaseId}/mms/autocode`);
  url.searchParams.set('searchText', searchText);
  if (opts.matchThreshold != null) {
    url.searchParams.set('matchThreshold', String(opts.matchThreshold));
  }
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'API-Version': 'v2',
      'Accept-Language': lang,
      Accept: 'application/json',
    },
  });
  if (res.status === 401) {
    clearWhoTokenCache();
    throw new Error('Session OMS expirée ou invalide. Relancez l’analyse.');
  }
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Le service OMS a répondu une erreur (${res.status}) : ${t.slice(0, 160)}`);
  }
  return res.json();
}

/**
 * @param {string} clientId
 * @param {string} clientSecret
 * @param {string} rawText
 * @param {{ releaseId?: string; lang?: string; matchThreshold?: number; maxPhrases?: number; proxyBase?: string }} options
 */
export async function fetchWhoIcd11AutocodeSuggestions(clientId, clientSecret, rawText, options = {}) {
  const proxyBase = options.proxyBase || '';
  const token = await getWhoAccessTokenCached(clientId, clientSecret, proxyBase);
  const phrases = splitTextForWhoAutocode(rawText, options.maxPhrases ?? 10);
  const byCode = new Map();

  for (const phrase of phrases) {
    const data = await whoIcd11MmsAutocode(token, phrase, { ...options, proxyBase });
    if (!data?.theCode) continue;
    const score = typeof data.matchScore === 'number' ? data.matchScore : 0;
    const prev = byCode.get(data.theCode);
    if (prev && prev.whoMatchScore >= score) continue;
    const label = stripTags(data.matchingText || data.searchText || phrase);
    byCode.set(data.theCode, {
      id: randomId(),
      code: data.theCode,
      label: label || data.theCode,
      matchedTerm: phrase,
      score: Math.round(40 + score * 160),
      confidence: Math.min(0.93, 0.38 + score * 0.55),
      source: /** @type {const} */ ('who11'),
      whoMatchScore: score,
    });
    await new Promise((r) => setTimeout(r, 100));
  }

  return [...byCode.values()].sort((a, b) => b.whoMatchScore - a.whoMatchScore);
}
