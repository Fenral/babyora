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
import { isSafeMetForecastPayload } from '../src/lib/met-no/forecast-contract.js';

export const config = { runtime: 'edge' };

const MET_BASE = 'https://api.met.no/weatherapi/locationforecast/2.0/compact';
const DEFAULT_USER_AGENT = 'Snudly/1.0 (https://snudly.vercel.app; sivertskotvold@gmail.com)';
// MET krever en stabil appidentitet og kontakt. Servervariabelen lar eier endre
// kontakt uten ny klientbuild; fallbacken holder lokale/preview-bygg kompatible.
const USER_AGENT = process.env.METNO_USER_AGENT?.trim() || DEFAULT_USER_AGENT;
const UPSTREAM_TIMEOUT_MS = 8_000;
const MAX_UPSTREAM_ATTEMPTS = 2;
const RETRY_JITTER_MIN_MS = 25;
const RETRY_JITTER_SPAN_MS = 50;
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
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...CORS,
      'Content-Type': 'application/json',
      ...cacheHeaders(true),
      ...extraHeaders,
    },
  });
}

type ForecastProxyErrorCode =
  | 'invalid_coordinates'
  | 'invalid_payload'
  | 'method_not_allowed'
  | 'rate_limited'
  | 'timeout'
  | 'upstream_unavailable';

function errorResponse(
  code: ForecastProxyErrorCode,
  message: string,
  status: number,
  retryable: boolean,
  extraHeaders: Record<string, string> = {},
): Response {
  return json({ error: message, code, retryable }, status, extraHeaders);
}

function coordinate(searchParams: URLSearchParams, name: 'lat' | 'lon'): number | null {
  const raw = searchParams.get(name);
  if (raw === null || raw.trim() === '') return null;
  const value = Number(raw);
  const limit = name === 'lat' ? 90 : 180;
  return Number.isFinite(value) && Math.abs(value) <= limit ? value : null;
}

function retryAfterHeader(upstream: Response): Record<string, string> {
  const raw = upstream.headers.get('Retry-After')?.trim();
  if (!raw || !/^\d+$/.test(raw)) return {};
  const seconds = Number(raw);
  if (!Number.isSafeInteger(seconds) || seconds < 0 || seconds > 3_600) return {};
  return { 'Retry-After': String(seconds) };
}

function isTimeoutError(error: unknown): boolean {
  return error instanceof Error
    && (error.name === 'TimeoutError' || error.name === 'AbortError');
}

async function waitForRetry(): Promise<void> {
  const delay = RETRY_JITTER_MIN_MS + Math.floor(Math.random() * RETRY_JITTER_SPAN_MS);
  await new Promise<void>((resolve) => setTimeout(resolve, delay));
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
    return errorResponse(
      'method_not_allowed',
      'Kun GET er tillatt',
      405,
      false,
      { Allow: 'GET, OPTIONS' },
    );
  }

  const { searchParams } = new URL(req.url);
  const memoryOnly = searchParams.get('cacheScope') === 'memory-only';
  const lat = coordinate(searchParams, 'lat');
  const lon = coordinate(searchParams, 'lon');
  if (lat === null || lon === null) {
    return errorResponse(
      'invalid_coordinates',
      'Ugyldig posisjon. Velg stedet på nytt.',
      400,
      false,
    );
  }
  if (memoryOnly && exceedsMemoryOnlyRateLimit(req)) {
    return errorResponse(
      'rate_limited',
      'Værtjenesten har for mange forespørsler. Prøv igjen senere.',
      429,
      true,
      { 'Retry-After': '60' },
    );
  }

  const url = `${MET_BASE}?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`;
  let upstream: Response | null = null;
  let timedOut = false;
  for (let attempt = 0; attempt < MAX_UPSTREAM_ATTEMPTS; attempt += 1) {
    try {
      upstream = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        ...(memoryOnly ? { cache: 'no-store' as const } : {}),
      });
      if (upstream.status !== 502 && upstream.status !== 503) break;
      if (attempt + 1 < MAX_UPSTREAM_ATTEMPTS) await waitForRetry();
    } catch (error) {
      timedOut = isTimeoutError(error);
      upstream = null;
      if (attempt + 1 < MAX_UPSTREAM_ATTEMPTS) await waitForRetry();
    }
  }

  if (!upstream) {
    return timedOut
      ? errorResponse('timeout', 'Værtjenesten svarte ikke i tide.', 504, true)
      : errorResponse('upstream_unavailable', 'Værtjenesten er midlertidig utilgjengelig.', 502, true);
  }
  if (upstream.status === 429) {
    return errorResponse(
      'rate_limited',
      'Værtjenesten har for mange forespørsler. Prøv igjen senere.',
      429,
      true,
      retryAfterHeader(upstream),
    );
  }
  if (!upstream.ok) {
    return errorResponse(
      'upstream_unavailable',
      'Værtjenesten er midlertidig utilgjengelig.',
      502,
      true,
    );
  }

  let body: unknown;
  try {
    body = await upstream.json();
  } catch {
    return errorResponse('invalid_payload', 'Værtjenesten sendte et ugyldig svar.', 502, true);
  }
  if (!isSafeMetForecastPayload(body)) {
    return errorResponse('invalid_payload', 'Værtjenesten sendte et ugyldig svar.', 502, true);
  }

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      ...CORS,
      'Content-Type': 'application/json',
      ...cacheHeaders(memoryOnly),
    },
  });
}
