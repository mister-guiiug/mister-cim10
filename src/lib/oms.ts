/**
 * Client de l'API OMS (ICD-11 MMS) via la passerelle CORS (cf. workers/).
 *
 * Contrat de la passerelle (`workers/who-icd-proxy.js`) :
 *   - POST {proxyUrl}/token   body { clientId, clientSecret }  → { access_token, expires_in }
 *   - GET  {proxyUrl}/autocode?searchText&releaseId&lang  + en-tête Authorization: Bearer
 *           → résultat « autocode » OMS (un seul meilleur code par texte).
 *
 * L'OMS renvoie de la **CIM-11** (pas CIM-10) : les suggestions sont marquées
 * `source: 'api'` pour être distinguées du dictionnaire local (CIM-10).
 */
import type { AnalysisResult, WhoSettings } from '../types/index';

/** Erreur OMS porteuse d'un message lisible pour l'IHM. */
export class OmsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OmsError';
  }
}

const randomId = (): string =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 12);

const base = (who: WhoSettings): string => who.proxyUrl.replace(/\/+$/, '');

/** Jeton d'accès en cache mémoire (l'OMS le donne pour ~1 h). */
let tokenCache: { token: string; expiresAt: number } | null = null;

/** Invalide le jeton (changement d'identifiants, 401…). */
export function resetOmsToken(): void {
  tokenCache = null;
}

async function getToken(who: WhoSettings): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 30_000)
    return tokenCache.token;

  let res: Response;
  try {
    res = await fetch(`${base(who)}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: who.clientId,
        clientSecret: who.clientSecret,
      }),
    });
  } catch {
    throw new OmsError('Passerelle injoignable — vérifiez l’URL du proxy.');
  }
  if (!res.ok) {
    if (res.status === 400 || res.status === 401) {
      throw new OmsError('Identifiants OMS refusés (Client ID / mot secret).');
    }
    if (res.status === 403) {
      throw new OmsError('Origine non autorisée par la passerelle (CORS).');
    }
    throw new OmsError(`Authentification OMS impossible (HTTP ${res.status}).`);
  }
  const data = (await res.json()) as {
    access_token?: string;
    expires_in?: number;
  };
  if (!data.access_token) {
    throw new OmsError('Réponse d’authentification OMS invalide.');
  }
  tokenCache = {
    token: data.access_token,
    expiresAt: now + (data.expires_in ?? 3600) * 1000,
  };
  return tokenCache.token;
}

interface AutocodeResponse {
  theCode?: string;
  matchingText?: string;
  matchScore?: number;
}

async function autocode(
  who: WhoSettings,
  token: string,
  searchText: string
): Promise<AutocodeResponse | null> {
  const u = new URL(`${base(who)}/autocode`);
  u.searchParams.set('searchText', searchText);
  u.searchParams.set('releaseId', who.releaseId);
  u.searchParams.set('lang', who.lang);

  let res: Response;
  try {
    res = await fetch(u.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new OmsError('Passerelle injoignable pendant l’analyse OMS.');
  }
  if (res.status === 401) {
    resetOmsToken();
    throw new OmsError('Session OMS expirée — relancez l’analyse.');
  }
  if (!res.ok) {
    throw new OmsError(`Erreur OMS pendant l’analyse (HTTP ${res.status}).`);
  }
  const data = (await res.json()) as AutocodeResponse | null;
  if (!data || !data.theCode) return null;
  return data;
}

/**
 * Découpe un compte-rendu en segments analysables (phrases / lignes). `autocode`
 * ne renvoie qu'un code par texte : on l'appelle donc par segment pour extraire
 * plusieurs diagnostics. Plafonné pour ménager la passerelle.
 */
export function segmentReport(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of text.split(/[\n;.•·]+/)) {
    const seg = raw.trim();
    if (seg.length < 4) continue;
    const key = seg.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(seg);
    if (out.length >= 15) break;
  }
  return out;
}

/**
 * Analyse OMS (CIM-11) : autocode par segment, en parallèle, dédupliqué par
 * code et trié par confiance. L'échec d'AUTHENTIFICATION remonte (config) ;
 * l'échec d'un segment isolé est ignoré (best-effort).
 */
export async function suggestFromOms(
  rawText: string,
  who: WhoSettings
): Promise<AnalysisResult[]> {
  const token = await getToken(who);
  const segs = segmentReport(rawText);

  const settled = await Promise.all(
    segs.map(seg =>
      autocode(who, token, seg)
        .then(r => ({ seg, r }))
        .catch(() => ({ seg, r: null as AutocodeResponse | null }))
    )
  );

  const seen = new Set<string>();
  const out: AnalysisResult[] = [];
  for (const { seg, r } of settled) {
    if (!r?.theCode || seen.has(r.theCode)) continue;
    seen.add(r.theCode);
    const confidence = Math.max(
      0,
      Math.min(1, typeof r.matchScore === 'number' ? r.matchScore : 0.5)
    );
    out.push({
      id: randomId(),
      code: r.theCode,
      label: r.matchingText ?? r.theCode,
      matchedTerm: seg,
      score: confidence * 1000,
      confidence,
      source: 'api',
    });
  }
  return out.sort((a, b) => b.confidence - a.confidence);
}
