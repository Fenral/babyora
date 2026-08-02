import { useEffect, useRef, useState } from 'react';
import {
  extractDaily,
  extractDailyAtHour,
  extractHourly,
  extractNow,
  fetchForecast,
  isMetForecast,
  usableForecastPoints,
} from '../lib/met-no/client';

/**
 * T9A — §5-cachematrisen (docs/design-notes/aapningskontrakt-2026-08-01.md)
 * som faktisk tilstandsmaskin i vær-LAGET (hooken; motor-mappen met-no er
 * urørt). De fire tilstandene eksponeres som `WeatherState.freshness`:
 *
 *  | §5-rad  | freshness.kind | Oppførsel                                        |
 *  |---------|----------------|--------------------------------------------------|
 *  | Fersk   | 'fresh'        | Vis umiddelbart (bootstrap-hydrering, ingen      |
 *  |         |                | spinner), stille revalidering i bakgrunnen.      |
 *  | Gammel  | 'stale'        | Vis sist-kjente umiddelbart + fetchedAt («Sist   |
 *  |         |                | oppdatert …»), revalider; nye data lander stille |
 *  |         |                | (reduceren wiper ALDRI samme fetchKey).          |
 *  | Ingen   | 'missing'      | Reservert geometri + «Henter vær …», CTA av.     |
 *  | Feil    | 'error'        | Strukturen beholdes; sist-kjente data + retry.   |
 *
 * VIKTIG MOTORVERN (uendret fra før): GAMMEL/FEIL-data blir ALDRI `now`/
 * motor-input — `lastKnownNow` er utelukkende visning («Sist kjente vær»).
 * Anbefalingsmotoren ser kun ferske data; outputen er dermed identisk.
 *
 * De fire friskhets-TEKSTENE (runde 4) er T2 (visuelt) — her leveres kun
 * tilstandene + minimal korrekt tekst der tekst allerede finnes.
 */

/** Fersk-vindu — speiler met-no-klientens CACHE_TTL_MS (1 t, met.no-anbefaling). */
export const WEATHER_FRESH_MS = 60 * 60 * 1000;
/** Gammel-men-brukbar-vindu — speiler met-no-klientens MAX_STALE_AGE_MS (6 t). */
export const WEATHER_STALE_MS = 6 * 60 * 60 * 1000;
/** Kilde-tidsstempel kan ikke ligge mer enn dette inn i fremtiden (klokkeskjevhet). */
const MAX_SOURCE_FUTURE_SKEW_MS = 5 * 60 * 1000;
/** Kilde-tidsstempel eldre enn dette regnes som ubrukelig (speiler klienten). */
const MAX_SOURCE_AGE_MS = 6 * 60 * 60 * 1000;
/**
 * localStorage-nøkkelformatet til met-no-klientens persistente cache
 * (`metno:{lat},{lon}` med 2 desimaler). Duplisert bevisst: klienten er
 * motor-mappe (kan ikke endres/eksportere nøkkelen), og et format-avvik
 * degraderer trygt (bootstrap finner ingenting → vanlig lasteforløp).
 */
const PERSISTENT_CACHE_KEY_PREFIX = 'metno:';

export type WeatherFreshness =
  | Readonly<{ kind: 'fresh'; fetchedAt: number; revalidating: boolean }>
  | Readonly<{ kind: 'stale'; fetchedAt: number; revalidating: boolean }>
  | Readonly<{ kind: 'missing'; revalidating: boolean }>
  | Readonly<{ kind: 'error'; lastFetchedAt: number | null; revalidating: boolean }>;
import {
  parseStrictIsoInstant,
  type ForecastFetchMetadata,
  type ForecastFetchResult,
  type MetForecast,
  type WeatherDaily,
  type WeatherDayAtHour,
  type WeatherHourly,
  type WeatherNow,
} from '../lib/met-no/types';
import {
  assessForecastCoverage,
  type ForecastCoverage,
} from '../lib/planning/coverage';
import type { LocationCacheScope } from '../lib/location/cache-scope';

type Status = 'idle' | 'loading' | 'ready' | 'offline' | 'error';

export type WeatherEvidence = Readonly<{
  metadata: ForecastFetchMetadata;
  coverage: ForecastCoverage;
}>;

export type WeatherLocationSource =
  | 'configured-place'
  | 'fixed-home'
  | 'manual'
  | 'automatic';

export type WeatherRequestOptions = Readonly<{
  cacheScope: LocationCacheScope;
  source: WeatherLocationSource;
}>;

export type WeatherFetchIdentity = Readonly<WeatherRequestOptions & {
  fetchKey: string;
}>;

const DEFAULT_WEATHER_REQUEST_OPTIONS: WeatherRequestOptions = Object.freeze({
  cacheScope: 'persistent',
  source: 'configured-place',
});

export function createWeatherFetchIdentity(
  lat: number,
  lon: number,
  refHour: number,
  options: WeatherRequestOptions = DEFAULT_WEATHER_REQUEST_OPTIONS,
): WeatherFetchIdentity {
  const { cacheScope, source } = options;
  return {
    fetchKey: `${source}:${cacheScope}:${lat},${lon},${refHour}`,
    cacheScope,
    source,
  };
}

export type WeatherState = {
  status: Status;
  now: WeatherNow | null;
  hourly: WeatherHourly[];
  daily: WeatherDaily[];
  dailyAtHour: WeatherDayAtHour[];
  /** Rå met.no-respons for avledninger som trenger full timeserie. */
  forecast: MetForecast | null;
  /** Stale data is retained only for explicit offline UI, never legacy recommendation inputs. */
  offlineForecast: MetForecast | null;
  evidence: WeatherEvidence | null;
  error: string | null;
  attribution: string;
  /** T9A: §5-cachematrisens tilstand (fersk/gammel/ingen/feil) + revalidering. */
  freshness: WeatherFreshness;
  /**
   * T9A: sist-kjente værmåling for VISNING (aldri motor-input) — satt både
   * for ferske data (== now) og for gammel/feil-tilstandene der `now` er
   * null av motorvern-grunner.
   */
  lastKnownNow: WeatherNow | null;
  /** Epoch ms for når `lastKnownNow`-dataene faktisk ble hentet. */
  lastKnownAt: number | null;
};

export type WeatherRequestState = Readonly<{
  activeRequestId: number;
  activeFetchKey: string;
  weather: WeatherState;
}>;

export type WeatherRequestEvent =
  | Readonly<{ type: 'started'; requestId: number; fetchKey: string }>
  | Readonly<{
    type: 'resolved';
    requestId: number;
    fetchKey: string;
    result: ForecastFetchResult;
    refHour: number;
  }>
  | Readonly<{ type: 'rejected'; requestId: number; fetchKey: string; error: unknown }>;

export type WeatherExtractors = Readonly<{
  now: typeof extractNow;
  hourly: typeof extractHourly;
  daily: typeof extractDaily;
  dailyAtHour: typeof extractDailyAtHour;
}>;

const DEFAULT_EXTRACTORS: WeatherExtractors = {
  now: extractNow,
  hourly: extractHourly,
  daily: extractDaily,
  dailyAtHour: extractDailyAtHour,
};

function emptyWeatherState(status: Status): WeatherState {
  return {
    status,
    now: null,
    hourly: [],
    daily: [],
    dailyAtHour: [],
    forecast: null,
    offlineForecast: null,
    evidence: null,
    error: null,
    attribution: 'V\u00e6r fra met.no',
    freshness: status === 'error'
      ? { kind: 'error', lastFetchedAt: null, revalidating: false }
      : { kind: 'missing', revalidating: status === 'loading' },
    lastKnownNow: null,
    lastKnownAt: null,
  };
}

export function weatherStateFromForecastResult(
  result: ForecastFetchResult,
  refHour: number,
  extractors: WeatherExtractors = DEFAULT_EXTRACTORS,
): WeatherState {
  const { forecast, metadata } = result;
  if (!isMetForecast(forecast)) {
    return {
      ...emptyWeatherState('error'),
      error: 'met.no: ugyldig prognose',
    };
  }
  const usablePoints = usableForecastPoints(forecast);
  const evidence = {
    metadata,
    coverage: assessForecastCoverage(
      usablePoints.map((point) => point.time),
      metadata,
    ),
  };
  if (metadata.stale || parseStrictIsoInstant(metadata.sourceUpdatedAt) === null) {
    // \u00a75 GAMMEL-men-brukbar: dataene eksponeres KUN for visning
    // (lastKnownNow + offlineForecast) \u2014 aldri som motor-input (`now`
    // forblir null, uendret motorvern).
    let lastKnownNow: WeatherNow | null = null;
    try {
      lastKnownNow = extractors.now(forecast, metadata.evaluatedAt);
    } catch {
      // Prognosen dekker ikke n\u00e5-punktet lenger \u2014 vis uten tallverdi.
    }
    return {
      ...emptyWeatherState('offline'),
      offlineForecast: forecast,
      evidence,
      freshness: { kind: 'stale', fetchedAt: metadata.fetchedAt, revalidating: false },
      lastKnownNow,
      lastKnownAt: metadata.fetchedAt,
    };
  }
  try {
    const now = extractors.now(forecast, metadata.evaluatedAt);
    const ageMs = metadata.evaluatedAt - metadata.fetchedAt;
    return {
      status: 'ready',
      now,
      hourly: extractors.hourly(forecast, 48),
      daily: extractors.daily(forecast, 10),
      dailyAtHour: extractors.dailyAtHour(forecast, refHour, 10),
      forecast,
      offlineForecast: null,
      evidence,
      error: null,
      attribution: 'V\u00e6r fra met.no',
      freshness: ageMs <= WEATHER_FRESH_MS
        ? { kind: 'fresh', fetchedAt: metadata.fetchedAt, revalidating: false }
        : { kind: 'stale', fetchedAt: metadata.fetchedAt, revalidating: false },
      lastKnownNow: now,
      lastKnownAt: metadata.fetchedAt,
    };
  } catch (error) {
    return {
      ...emptyWeatherState('error'),
      error: error instanceof Error ? error.message : 'met.no: ugyldig prognose',
    };
  }
}

export function selectWeatherForFetchKey(
  state: WeatherRequestState,
  currentFetchKey: string,
): WeatherState {
  return state.activeFetchKey === currentFetchKey ? state.weather : emptyWeatherState('loading');
}

type WeatherRequestLifecycleOptions = Readonly<{
  requestId: number;
  fetchKey: string;
  refHour: number;
  load: () => Promise<ForecastFetchResult>;
  dispatch: (event: WeatherRequestEvent) => void;
}>;

export function startWeatherRequest(options: WeatherRequestLifecycleOptions): Readonly<{
  cancel: () => void;
  settled: Promise<void>;
}> {
  const { requestId, fetchKey, refHour, load, dispatch } = options;
  let cancelled = false;
  dispatch({ type: 'started', requestId, fetchKey });
  const settled = load().then(
    (result) => {
      if (!cancelled) dispatch({ type: 'resolved', requestId, fetchKey, result, refHour });
    },
    (error: unknown) => {
      if (!cancelled) dispatch({ type: 'rejected', requestId, fetchKey, error });
    },
  );
  return { cancel: () => { cancelled = true; }, settled };
}

export function createInitialWeatherRequestState(fetchKey: string): WeatherRequestState {
  return { activeRequestId: 0, activeFetchKey: fetchKey, weather: emptyWeatherState('loading') };
}

/** Sann når tilstanden har noe brukeren allerede SER (data eller sist-kjente). */
function hasPresentableWeather(weather: WeatherState): boolean {
  return weather.now !== null || weather.lastKnownNow !== null || weather.offlineForecast !== null;
}

export function reduceWeatherRequestState(
  state: WeatherRequestState,
  event: WeatherRequestEvent,
  extractors: WeatherExtractors = DEFAULT_EXTRACTORS,
): WeatherRequestState {
  if (event.type === 'started') {
    if (event.requestId <= state.activeRequestId) return state;
    // T9A (§5 «Gammel: revalider i bakgrunnen» + §6 resume ≠ ny prosess):
    // en ny forespørsel for SAMME fetchKey (retry/revalidering/resume) wiper
    // ALDRI synlige data — den markerer kun `revalidating` og lar nye data
    // lande stille når de kommer (ingen tom-flash, ingen layout-shift).
    // Et NYTT fetchKey (annet sted/scope) wiper som før — feil steds vær
    // skal aldri stå én frame.
    if (
      event.fetchKey === state.activeFetchKey
      && hasPresentableWeather(state.weather)
    ) {
      return {
        activeRequestId: event.requestId,
        activeFetchKey: event.fetchKey,
        weather: {
          ...state.weather,
          freshness: { ...state.weather.freshness, revalidating: true },
        },
      };
    }
    return {
      activeRequestId: event.requestId,
      activeFetchKey: event.fetchKey,
      weather: emptyWeatherState('loading'),
    };
  }
  if (event.requestId !== state.activeRequestId || event.fetchKey !== state.activeFetchKey) return state;
  if (event.type === 'resolved') {
    return { ...state, weather: weatherStateFromForecastResult(event.result, event.refHour, extractors) };
  }
  // §5 FEIL: behold strukturen og sist-kjente data; eksponér feilen + at
  // revalideringen er over (retry-affordansen eies av UI-laget).
  const previous = state.weather;
  const lastFetchedAt = previous.freshness.kind === 'fresh' || previous.freshness.kind === 'stale'
    ? previous.freshness.fetchedAt
    : previous.lastKnownAt;
  return {
    ...state,
    weather: {
      ...previous,
      status: 'error',
      error: event.error instanceof Error ? event.error.message : 'Ukjent feil',
      freshness: { kind: 'error', lastFetchedAt, revalidating: false },
    },
  };
}

type PersistentCacheStorage = Pick<Storage, 'getItem'>;

function defaultCacheStorage(): PersistentCacheStorage | null {
  try {
    return localStorage;
  } catch {
    return null;
  }
}

export type PersistentForecastCacheHit = Readonly<{
  forecast: MetForecast;
  fetchedAt: number;
  ageMs: number;
}>;

/**
 * T9A: synkron lesing av met-no-klientens persistente cache — grunnlaget
 * for at FERSK cache kan vises på ALLER FØRSTE render (før effekter/fetch,
 * dvs. ingen «Henter vær»-frame ved varm/kald oppstart med cache). Kun
 * lesing; klienten eier fortsatt skrivingen. Returnerer null ved alt annet
 * enn en gyldig, validert cache innenfor WEATHER_STALE_MS.
 */
export function readPersistentForecastCache(
  lat: number,
  lon: number,
  evaluatedAt: number = Date.now(),
  storage: PersistentCacheStorage | null = defaultCacheStorage(),
): PersistentForecastCacheHit | null {
  if (storage === null) return null;
  try {
    const key = `${PERSISTENT_CACHE_KEY_PREFIX}${lat.toFixed(2)},${lon.toFixed(2)}`;
    const raw = storage.getItem(key);
    if (raw === null) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;
    const entry = parsed as { fetchedAt?: unknown; data?: unknown };
    if (typeof entry.fetchedAt !== 'number' || !Number.isFinite(entry.fetchedAt)) return null;
    if (!isMetForecast(entry.data)) return null;
    const ageMs = evaluatedAt - entry.fetchedAt;
    if (ageMs < 0 || ageMs > WEATHER_STALE_MS) return null;
    return { forecast: entry.data, fetchedAt: entry.fetchedAt, ageMs };
  } catch {
    return null;
  }
}

/** Speiler klientens sourceUpdatedAt-vakt (gyldig ISO, ikke fremtid, ikke > 6 t gammel). */
function bootstrapSourceUpdatedAt(forecast: MetForecast, evaluatedAt: number): string | null {
  const value: unknown = forecast.properties.meta.updated_at;
  const epoch = parseStrictIsoInstant(value);
  if (
    typeof value !== 'string'
    || epoch === null
    || epoch > evaluatedAt + MAX_SOURCE_FUTURE_SKEW_MS
    || evaluatedAt - epoch > MAX_SOURCE_AGE_MS
  ) return null;
  return value;
}

/**
 * T9A: første-render-tilstand. Persistent scope forsøker synkron
 * cache-hydrering (fersk → 'ready' umiddelbart; gammel → 'offline' med
 * sist-kjente for visning); memory-only scope (automatisk posisjon,
 * personvern) og cache-miss gir det vanlige 'loading'/'missing'-forløpet.
 * Effekten revaliderer uansett — reduceren beholder synlige data for samme
 * fetchKey (stille oppdatering).
 */
export function bootstrapWeatherRequestState(
  fetchKey: string,
  lat: number,
  lon: number,
  refHour: number,
  cacheScope: LocationCacheScope,
  evaluatedAt: number = Date.now(),
  storage: PersistentCacheStorage | null = defaultCacheStorage(),
): WeatherRequestState {
  if (cacheScope !== 'persistent') return createInitialWeatherRequestState(fetchKey);
  const hit = readPersistentForecastCache(lat, lon, evaluatedAt, storage);
  if (hit === null) return createInitialWeatherRequestState(fetchKey);
  const stale = hit.ageMs > WEATHER_FRESH_MS;
  const metadata: ForecastFetchMetadata = {
    source: 'cache',
    sourceUpdatedAt: bootstrapSourceUpdatedAt(hit.forecast, evaluatedAt),
    fetchedAt: hit.fetchedAt,
    evaluatedAt,
    cacheStatus: stale ? 'stale' : 'fresh',
    stale,
  };
  return {
    activeRequestId: 0,
    activeFetchKey: fetchKey,
    weather: weatherStateFromForecastResult({ forecast: hit.forecast, metadata }, refHour),
  };
}

export function useWeather(
  lat: number,
  lon: number,
  refHour: number = 12,
  refreshKey: number = 0,
  options: WeatherRequestOptions = DEFAULT_WEATHER_REQUEST_OPTIONS,
  enabled: boolean = true,
): WeatherState {
  const identity = createWeatherFetchIdentity(lat, lon, refHour, options);
  const { fetchKey } = identity;
  const requestIdRef = useRef(0);
  const [requestState, setRequestState] = useState<WeatherRequestState>(
    // T9A: synkron cache-hydrering ved mount — fersk cache vises på første
    // frame uten spinner (§5 FERSK + §6 «ny prosess: cachet Hjem»).
    () => bootstrapWeatherRequestState(fetchKey, lat, lon, refHour, identity.cacheScope),
  );

  useEffect(() => {
    if (!enabled) return;
    const requestId = ++requestIdRef.current;
    const lifecycle = startWeatherRequest({
      requestId,
      fetchKey,
      refHour,
      load: () => fetchForecast(lat, lon, { cacheScope: identity.cacheScope }),
      dispatch: (event) => {
        setRequestState((current) => reduceWeatherRequestState(current, event));
      },
    });
    return lifecycle.cancel;
  }, [enabled, fetchKey, identity.cacheScope, lat, lon, refHour, refreshKey]);

  return selectWeatherForFetchKey(requestState, fetchKey);
}
