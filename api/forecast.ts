/**
 * met.no LocationForecast-proxy (Vercel edge function).
 *
 * Hvorfor: nettleseren kan ikke kalle api.met.no direkte — api.met.no sender
 * ikke CORS-headere, og `User-Agent` (som met.no-vilkårene krever) er en
 * forbudt header i browser-fetch. Resultat: forespørselen feiler i nettleseren,
 * og appen faller tilbake på mock/feiltilstand. Denne funksjonen kaller met.no
 * server-side (der UA KAN settes) og åpner CORS, så både web (samme origin) og
 * native-appen (cross-origin) kan bruke den.
 *
 * Klienten kaller `/api/forecast?lat=..&lon=..` (web) eller den absolutte
 * URL-en via VITE_FORECAST_PROXY (native). Svar caches på Vercels edge i
 * 15 min for å avlaste met.no.
 */
export const config = { runtime: 'edge' };

const MET_BASE = 'https://api.met.no/weatherapi/locationforecast/2.0/compact';
// met.no-vilkår: identifiser app + kontakt. Bytt e-post ved behov.
const USER_AGENT = 'Babyora/1.0 (https://wool-app.vercel.app; sivertskotvold@gmail.com)';
const MEMORY_ONLY_RATE_LIMIT = 30;
const MEMORY_ONLY_RATE_WINDOW_MS = 60_000;
const MEMORY_ONLY_RATE_MAX_CLIENTS = 2_048;

interface RateLimitEntry {
  count: number;
  windowStartedAt: number;
}

// Best-effort protection per warm edge isolate. Vercel's platform protection
// remains the outer layer; this keeps a single client from repeatedly bypassing
// the shared weather cache through the privacy-preserving memory-only mode.
const memoryOnlyRateLimits = new Map<string, RateLimitEntry>();

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function cacheHeaders(memoryOnly: boolean): Record<string, string> {
  return memoryOnly
    ? {
      'Cache-Control': 'private, no-store, max-age=0',
      'CDN-Cache-Control': 'no-store',
      'Vercel-CDN-Cache-Control': 'no-store',
    }
    : { 'Cache-Control': 's-maxage=900, stale-while-revalidate=600' };
}

function json(
  body: unknown,
  status: number,
  memoryOnly = false,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS,
      'Content-Type': 'application/json',
      ...(memoryOnly ? cacheHeaders(true) : {}),
      ...extraHeaders,
    },
  });
}

function clientAddress(req: Request): string | null {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const address = forwarded || req.headers.get('x-real-ip')?.trim();
  return address ? address.slice(0, 128) : null;
}

function exceedsMemoryOnlyRateLimit(req: Request, now = Date.now()): boolean {
  const address = clientAddress(req);
  if (!address) return false;

  const existing = memoryOnlyRateLimits.get(address);
  if (existing && now - existing.windowStartedAt < MEMORY_ONLY_RATE_WINDOW_MS) {
    if (existing.count >= MEMORY_ONLY_RATE_LIMIT) return true;
    existing.count += 1;
    return false;
  }

  if (memoryOnlyRateLimits.size >= MEMORY_ONLY_RATE_MAX_CLIENTS) {
    for (const [key, entry] of memoryOnlyRateLimits) {
      if (now - entry.windowStartedAt >= MEMORY_ONLY_RATE_WINDOW_MS) {
        memoryOnlyRateLimits.delete(key);
      }
    }
    if (memoryOnlyRateLimits.size >= MEMORY_ONLY_RATE_MAX_CLIENTS) {
      const oldestKey = memoryOnlyRateLimits.keys().next().value;
      if (oldestKey !== undefined) memoryOnlyRateLimits.delete(oldestKey);
    }
  }

  memoryOnlyRateLimits.set(address, { count: 1, windowStartedAt: now });
  return false;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== 'GET') {
    return json(
      { error: 'Kun GET er tillatt' },
      405,
      true,
      { Allow: 'GET, OPTIONS' },
    );
  }

  const { searchParams } = new URL(req.url);
  const memoryOnly = searchParams.get('cacheScope') === 'memory-only';
  const lat = Number(searchParams.get('lat'));
  const lon = Number(searchParams.get('lon'));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return json({ error: 'Ugyldig lat/lon' }, 400, memoryOnly);
  }
  if (memoryOnly && exceedsMemoryOnlyRateLimit(req)) {
    return json(
      { error: 'For mange forespørsler. Prøv igjen om litt.' },
      429,
      true,
      { 'Retry-After': '60' },
    );
  }

  const url = `${MET_BASE}?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`;
  let upstream: Response;
  try {
    upstream = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      ...(memoryOnly ? { cache: 'no-store' as const } : {}),
    });
  } catch {
    return json({ error: 'met.no utilgjengelig' }, 502, memoryOnly);
  }

  if (!upstream.ok) {
    return json({ error: `met.no HTTP ${upstream.status}` }, upstream.status, memoryOnly);
  }

  let body: string;
  try {
    body = await upstream.text();
  } catch {
    return json({ error: 'met.no utilgjengelig' }, 502, memoryOnly);
  }
  return new Response(body, {
    status: 200,
    headers: {
      ...CORS,
      'Content-Type': 'application/json',
      ...cacheHeaders(memoryOnly),
    },
  });
}
