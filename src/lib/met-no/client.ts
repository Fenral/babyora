import type {
  ForecastFetchMetadata,
  ForecastFetchResult,
  MetForecast,
  MetTimePoint,
  WeatherDaily,
  WeatherDayAtHour,
  WeatherHourly,
  WeatherNow,
} from './types.js';
import { parseStrictIsoInstant } from './types.js';
import { feelsLikeC } from './feels-like.js';
import {
  locationCacheScope,
  type LocationCacheScope,
  type LocationRequestOptions,
} from '../location/cache-scope.js';

/**
 * met.no LocationForecast-klient.
 *
 * Henter via vår egen proxy (`/api/forecast`, se api/forecast.ts) fordi
 * nettleseren ikke kan kalle api.met.no direkte (manglende CORS-headere +
 * User-Agent er forbudt browser-header). Proxyen kaller met.no server-side med
 * riktig UA. Native-bygg peker på absolutt URL via VITE_FORECAST_PROXY.
 * Kreditering "Vær fra met.no" vises i UI (lisenskrav).
 */

// Web: relativ sti til edge-funksjonen. Native (Capacitor): absolutt URL
// settes via VITE_FORECAST_PROXY i byggemiljøet (origin er capacitor://).
const PROXY =
  (import.meta.env as Record<string, string | undefined>).VITE_FORECAST_PROXY ?? '/api/forecast';

const CACHE_KEY_PREFIX = 'metno:';
/* Én time per met.no-anbefaling.
   Eksportert 2026-08-07: widgetens utløp må bruke SAMME tall. Et råd er
   gyldig nøyaktig så lenge værdataene det hviler på regnes som ferske —
   to konstanter ville drevet fra hverandre. Se
   src/lib/widget/use-widget-snapshot.ts. */
export const CACHE_TTL_MS = 60 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;
const MAX_STALE_AGE_MS = 6 * 60 * 60 * 1000;
const MAX_SOURCE_AGE_MS = 6 * 60 * 60 * 1000;
const MAX_SOURCE_FUTURE_SKEW_MS = 5 * 60 * 1000;
const MAX_MEMORY_ONLY_ENTRIES = 32;

const CONSUMED_UNIT_CONTRACT = {
  air_temperature: 'celsius',
  precipitation_amount: 'mm',
  wind_speed: 'm/s',
  wind_from_direction: 'degrees',
  relative_humidity: '%',
  cloud_area_fraction: '%',
} as const;

const KNOWN_SYMBOL_CODES = new Set([
  'clearsky_day',
  'clearsky_night',
  'clearsky_polartwilight',
  'fair_day',
  'fair_night',
  'fair_polartwilight',
  'lightssnowshowersandthunder_day',
  'lightssnowshowersandthunder_night',
  'lightssnowshowersandthunder_polartwilight',
  'lightsnowshowers_day',
  'lightsnowshowers_night',
  'lightsnowshowers_polartwilight',
  'heavyrainandthunder',
  'heavysnowandthunder',
  'rainandthunder',
  'heavysleetshowersandthunder_day',
  'heavysleetshowersandthunder_night',
  'heavysleetshowersandthunder_polartwilight',
  'heavysnow',
  'heavyrainshowers_day',
  'heavyrainshowers_night',
  'heavyrainshowers_polartwilight',
  'lightsleet',
  'heavyrain',
  'lightrainshowers_day',
  'lightrainshowers_night',
  'lightrainshowers_polartwilight',
  'heavysleetshowers_day',
  'heavysleetshowers_night',
  'heavysleetshowers_polartwilight',
  'lightsleetshowers_day',
  'lightsleetshowers_night',
  'lightsleetshowers_polartwilight',
  'snow',
  'heavyrainshowersandthunder_day',
  'heavyrainshowersandthunder_night',
  'heavyrainshowersandthunder_polartwilight',
  'snowshowers_day',
  'snowshowers_night',
  'snowshowers_polartwilight',
  'fog',
  'snowshowersandthunder_day',
  'snowshowersandthunder_night',
  'snowshowersandthunder_polartwilight',
  'lightsnowandthunder',
  'heavysleetandthunder',
  'lightrain',
  'rainshowersandthunder_day',
  'rainshowersandthunder_night',
  'rainshowersandthunder_polartwilight',
  'rain',
  'lightsnow',
  'lightrainshowersandthunder_day',
  'lightrainshowersandthunder_night',
  'lightrainshowersandthunder_polartwilight',
  'heavysleet',
  'sleetandthunder',
  'lightrainandthunder',
  'sleet',
  'lightssleetshowersandthunder_day',
  'lightssleetshowersandthunder_night',
  'lightssleetshowersandthunder_polartwilight',
  'lightsleetandthunder',
  'partlycloudy_day',
  'partlycloudy_night',
  'partlycloudy_polartwilight',
  'sleetshowersandthunder_day',
  'sleetshowersandthunder_night',
  'sleetshowersandthunder_polartwilight',
  'rainshowers_day',
  'rainshowers_night',
  'rainshowers_polartwilight',
  'snowandthunder',
  'sleetshowers_day',
  'sleetshowers_night',
  'sleetshowers_polartwilight',
  'cloudy',
  'heavysnowshowersandthunder_day',
  'heavysnowshowersandthunder_night',
  'heavysnowshowersandthunder_polartwilight',
  'heavysnowshowers_day',
  'heavysnowshowers_night',
  'heavysnowshowers_polartwilight',
]);

const latestStartedVersionByKey = new Map<string, bigint>();
const latestCommittedByKey = new Map<string, Readonly<{
  version: bigint;
  result: ForecastFetchResult;
}>>();
type ActiveMemoryRequest = { version: bigint; active: boolean };
const activeMemoryRequestByKey = new Map<string, ActiveMemoryRequest>();
const memoryOnlyKeyOrder = new Map<string, true>();
let requestVersionSequence = 0n;
let coordinatorStorage: Storage | null | undefined;

type CachedEntry = {
  version?: 1;
  fetchedAt: number;
  data: MetForecast;
};

type CacheCandidates = {
  fresh: CachedEntry | null;
  stale: CachedEntry | null;
  evaluatedAt: number;
};

function cacheKey(lat: number, lon: number): string {
  return `${CACHE_KEY_PREFIX}${lat.toFixed(2)},${lon.toFixed(2)}`;
}

function coordinatorKey(
  scope: LocationCacheScope,
  lat: number,
  lon: number,
): string {
  return `${scope}:${cacheKey(lat, lon)}`;
}

function clearPersistentCoordinator(): void {
  for (const key of latestStartedVersionByKey.keys()) {
    if (key.startsWith('persistent:')) latestStartedVersionByKey.delete(key);
  }
  for (const key of latestCommittedByKey.keys()) {
    if (key.startsWith('persistent:')) latestCommittedByKey.delete(key);
  }
}

function removeMemoryOnlyCoordinator(key: string): void {
  const activeRequest = activeMemoryRequestByKey.get(key);
  if (activeRequest) activeRequest.active = false;
  activeMemoryRequestByKey.delete(key);
  memoryOnlyKeyOrder.delete(key);
  latestStartedVersionByKey.delete(key);
  latestCommittedByKey.delete(key);
}

function touchMemoryOnlyCoordinator(key: string): void {
  memoryOnlyKeyOrder.delete(key);
  memoryOnlyKeyOrder.set(key, true);
  while (memoryOnlyKeyOrder.size > MAX_MEMORY_ONLY_ENTRIES) {
    const oldest = memoryOnlyKeyOrder.keys().next().value as string | undefined;
    if (!oldest) break;
    removeMemoryOnlyCoordinator(oldest);
  }
}

/** @internal Privacy diagnostic used by the cache-bound regression contract. */
export function memoryOnlyForecastCoordinatorSize(): number {
  const keys = new Set(memoryOnlyKeyOrder.keys());
  for (const key of latestStartedVersionByKey.keys()) {
    if (key.startsWith('memory-only:')) keys.add(key);
  }
  for (const key of latestCommittedByKey.keys()) {
    if (key.startsWith('memory-only:')) keys.add(key);
  }
  for (const key of activeMemoryRequestByKey.keys()) keys.add(key);
  return keys.size;
}

function releaseMemoryRequest(key: string, request: ActiveMemoryRequest): void {
  if (activeMemoryRequestByKey.get(key) === request) {
    activeMemoryRequestByKey.delete(key);
  }
  request.active = false;
}

function alignCoordinatorWithStorage(): void {
  let currentStorage: Storage | null = null;
  try {
    currentStorage = localStorage;
  } catch {
    // Memory coordination still works when persistent storage is unavailable.
  }
  if (currentStorage === coordinatorStorage) return;
  clearPersistentCoordinator();
  coordinatorStorage = currentStorage;
}

function commitMemoryResult(
  key: string,
  value: Readonly<{ version: bigint; result: ForecastFetchResult }>,
): void {
  if (key.startsWith('memory-only:')) touchMemoryOnlyCoordinator(key);
  latestCommittedByKey.delete(key);
  latestCommittedByKey.set(key, value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isInRange(value: unknown, min: number, max: number): value is number {
  return isFiniteNumber(value) && value >= min && value <= max;
}

function isKnownSymbolCode(value: unknown): value is string {
  return typeof value === 'string' && KNOWN_SYMBOL_CODES.has(value);
}

function hasExactConsumedUnits(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return Object.entries(CONSUMED_UNIT_CONTRACT)
    .every(([field, unit]) => value[field] === unit);
}

function isForecastPeriod(value: unknown): boolean {
  if (!isRecord(value) || !isRecord(value.summary) || !isRecord(value.details)) return false;
  return isKnownSymbolCode(value.summary.symbol_code)
    && isInRange(value.details.precipitation_amount, 0, 500);
}

function hasValidInstantPoint(value: unknown): boolean {
  if (!isRecord(value) || parseStrictIsoInstant(value.time) === null || !isRecord(value.data)) return false;
  const instant = value.data.instant;
  if (!isRecord(instant) || !isRecord(instant.details)) return false;
  const details = instant.details;
  if (
    !isInRange(details.air_temperature, -80, 60)
    || !isInRange(details.wind_speed, 0, 100)
    || !isInRange(details.wind_from_direction, 0, 360)
    || !isInRange(details.relative_humidity, 0, 100)
    || !isInRange(details.cloud_area_fraction, 0, 100)
  ) return false;

  return true;
}

function hasValidPeriodLayers(value: unknown): boolean {
  if (!isRecord(value) || !isRecord(value.data)) return false;
  const next1 = value.data.next_1_hours;
  const next6 = value.data.next_6_hours;
  return (next1 === undefined || isForecastPeriod(next1))
    && (next6 === undefined || isForecastPeriod(next6));
}

export function isMetForecast(value: unknown): value is MetForecast {
  if (!isRecord(value) || !isRecord(value.properties)) return false;
  const { meta, timeseries } = value.properties;
  if (!isRecord(meta) || !isRecord(meta.units) || !Array.isArray(timeseries) || timeseries.length === 0) {
    return false;
  }
  if (!hasExactConsumedUnits(meta.units)) return false;
  let previousEpoch = Number.NEGATIVE_INFINITY;
  for (const point of timeseries) {
    if (!hasValidInstantPoint(point) || !hasValidPeriodLayers(point)) return false;
    const epoch = parseStrictIsoInstant((point as Record<string, unknown>).time);
    if (epoch === null || epoch <= previousEpoch) return false;
    previousEpoch = epoch;
  }
  return true;
}

export function hasUsablePeriodEvidence(point: MetTimePoint): boolean {
  return (point.data.next_1_hours !== undefined && isForecastPeriod(point.data.next_1_hours))
    || (point.data.next_6_hours !== undefined && isForecastPeriod(point.data.next_6_hours));
}

export function usableForecastPoints(forecast: MetForecast): MetTimePoint[] {
  return forecast.properties.timeseries.filter(hasUsablePeriodEvidence);
}

function oneHourForecastPoints(forecast: MetForecast): MetTimePoint[] {
  return forecast.properties.timeseries.filter(
    (point) => point.data.next_1_hours !== undefined && isForecastPeriod(point.data.next_1_hours),
  );
}

function isCachedEntry(value: unknown): value is CachedEntry {
  if (!isRecord(value)) return false;
  if (value.version !== undefined && value.version !== 1) return false;
  return isFiniteNumber(value.fetchedAt)
    && isMetForecast(value.data);
}

function readCache(lat: number, lon: number): CacheCandidates {
  const key = cacheKey(lat, lon);
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return { fresh: null, stale: null, evaluatedAt: Date.now() };
    const parsed: unknown = JSON.parse(raw);
    if (!isCachedEntry(parsed)) {
      localStorage.removeItem(key);
      return { fresh: null, stale: null, evaluatedAt: Date.now() };
    }
    const evaluatedAt = Date.now();
    if (
      parsed.fetchedAt > evaluatedAt
      || evaluatedAt - parsed.fetchedAt > MAX_STALE_AGE_MS
    ) {
      localStorage.removeItem(key);
      return { fresh: null, stale: null, evaluatedAt };
    }
    if (evaluatedAt - parsed.fetchedAt <= CACHE_TTL_MS) {
      return { fresh: parsed, stale: null, evaluatedAt };
    }
    return { fresh: null, stale: parsed, evaluatedAt };
  } catch {
    try {
      localStorage.removeItem(key);
    } catch {
      // Storage is unavailable; there is nothing else to recover here.
    }
    return { fresh: null, stale: null, evaluatedAt: Date.now() };
  }
}

function writeCache(lat: number, lon: number, fetchedAt: number, data: MetForecast): void {
  try {
    const entry: CachedEntry = { version: 1, fetchedAt, data };
    localStorage.setItem(cacheKey(lat, lon), JSON.stringify(entry));
  } catch {
    // localStorage fullt eller blokkert — ignorer
  }
}

function sourceUpdatedAt(forecast: MetForecast, receivedAt: number): string | null {
  const value: unknown = forecast.properties.meta.updated_at;
  const epoch = parseStrictIsoInstant(value);
  if (
    typeof value !== 'string'
    || epoch === null
    || epoch > receivedAt + MAX_SOURCE_FUTURE_SKEW_MS
    || receivedAt - epoch > MAX_SOURCE_AGE_MS
  ) return null;
  return value;
}

function cacheResult(
  entry: CachedEntry,
  stale: boolean,
  evaluatedAt: number,
): ForecastFetchResult {
  const metadata: ForecastFetchMetadata = {
    source: 'cache',
    sourceUpdatedAt: sourceUpdatedAt(entry.data, evaluatedAt),
    fetchedAt: entry.fetchedAt,
    evaluatedAt,
    cacheStatus: stale ? 'stale' : 'fresh',
    stale,
  };
  return { forecast: entry.data, metadata };
}

function readMemoryCommit(key: string, asCacheHit = false): Readonly<{
  version: bigint;
  result: ForecastFetchResult;
}> | null {
  const committed = latestCommittedByKey.get(key);
  if (!committed) return null;
  if (!isMetForecast(committed.result.forecast)) {
    if (key.startsWith('memory-only:')) removeMemoryOnlyCoordinator(key);
    else latestCommittedByKey.delete(key);
    return null;
  }
  const evaluatedAt = Date.now();
  const age = evaluatedAt - committed.result.metadata.fetchedAt;
  if (
    age < 0
    || age > CACHE_TTL_MS
  ) {
    if (key.startsWith('memory-only:')) removeMemoryOnlyCoordinator(key);
    else latestCommittedByKey.delete(key);
    return null;
  }
  if (key.startsWith('memory-only:')) touchMemoryOnlyCoordinator(key);
  return {
    ...committed,
    result: {
      ...committed.result,
      metadata: {
        ...committed.result.metadata,
        ...(asCacheHit ? {
          source: 'cache' as const,
          cacheStatus: 'fresh' as const,
          stale: false,
        } : {}),
        sourceUpdatedAt: sourceUpdatedAt(committed.result.forecast, evaluatedAt),
        evaluatedAt,
      },
    },
  };
}

export async function fetchForecast(
  lat: number,
  lon: number,
  options?: LocationRequestOptions,
): Promise<ForecastFetchResult> {
  const scope = locationCacheScope(options);
  if (scope === 'persistent') {
    alignCoordinatorWithStorage();
    const cached = readCache(lat, lon);
    if (cached.fresh) return cacheResult(cached.fresh, false, cached.evaluatedAt);
  }

  const key = coordinatorKey(scope, lat, lon);
  if (scope === 'memory-only') {
    const memory = readMemoryCommit(key, true);
    if (memory) return memory.result;
  }
  requestVersionSequence += 1n;
  const requestVersion = requestVersionSequence;
  let memoryRequest: ActiveMemoryRequest | null = null;
  if (scope === 'memory-only') {
    const previous = activeMemoryRequestByKey.get(key);
    if (previous) previous.active = false;
    touchMemoryOnlyCoordinator(key);
    memoryRequest = { version: requestVersion, active: true };
    activeMemoryRequestByKey.set(key, memoryRequest);
  }
  latestStartedVersionByKey.set(key, requestVersion);

  // Via proxy — den setter User-Agent server-side (met.no-krav).
  const scopeQuery = scope === 'memory-only' ? '&cacheScope=memory-only' : '';
  const url = `${PROXY}?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}${scopeQuery}`;
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      ...(scope === 'memory-only'
        ? { cache: 'no-store' as const }
        : {}),
    });
    if (!res.ok) {
      throw new Error(`met.no HTTP ${res.status}`);
    }
    const data: unknown = await res.json();
    if (!isMetForecast(data)) throw new Error('met.no: ugyldig prognose');
    const acceptedAt = Date.now();

    const committed = readMemoryCommit(key);
    if (committed && committed.version > requestVersion) {
      if (memoryRequest) releaseMemoryRequest(key, memoryRequest);
      return committed.result;
    }
    if (memoryRequest && !memoryRequest.active) {
      throw new Error('automatic request superseded');
    }

    const result: ForecastFetchResult = {
      forecast: data,
      metadata: {
        source: 'network',
        sourceUpdatedAt: sourceUpdatedAt(data, acceptedAt),
        fetchedAt: acceptedAt,
        evaluatedAt: acceptedAt,
        cacheStatus: 'miss',
        stale: false,
      },
    };
    commitMemoryResult(key, { version: requestVersion, result });
    if (memoryRequest) releaseMemoryRequest(key, memoryRequest);
    if (scope === 'persistent') writeCache(lat, lon, acceptedAt, data);
    return result;
  } catch (error) {
    const committed = readMemoryCommit(key);
    if (committed) return committed.result;
    if (scope === 'memory-only') {
      if (latestStartedVersionByKey.get(key) === requestVersion) {
        removeMemoryOnlyCoordinator(key);
      } else if (memoryRequest) {
        releaseMemoryRequest(key, memoryRequest);
      }
      throw error;
    }
    const current = readCache(lat, lon);
    if (current.fresh) return cacheResult(current.fresh, false, current.evaluatedAt);
    if (current.stale) return cacheResult(current.stale, true, current.evaluatedAt);
    throw error;
  }
}

type PeriodEvidence = Readonly<{
  symbolCode: string;
  precipitationAmountMm: number;
  durationHours: 1 | 6;
}>;

function oneHourEvidence(point: MetTimePoint): PeriodEvidence {
  const period = point.data.next_1_hours;
  if (!period || !isForecastPeriod(period)) throw new Error('met.no: mangler en-timesbevis');
  return {
    symbolCode: period.summary.symbol_code,
    precipitationAmountMm: period.details.precipitation_amount,
    durationHours: 1,
  };
}

function periodEvidence(point: MetTimePoint): PeriodEvidence {
  if (point.data.next_1_hours) return oneHourEvidence(point);
  const period = point.data.next_6_hours;
  if (!period) throw new Error('met.no: mangler periodebevis');
  return {
    symbolCode: period.summary.symbol_code,
    precipitationAmountMm: period.details.precipitation_amount,
    durationHours: 6,
  };
}

export function extractNow(forecast: MetForecast, evaluatedAt: number): WeatherNow {
  if (!Number.isFinite(evaluatedAt)) {
    throw new Error('met.no: ugyldig evalueringstid');
  }
  const coveringPoints = forecast.properties.timeseries.filter((point) => {
    const pointAt = parseStrictIsoInstant(point.time);
    return pointAt !== null
      && pointAt <= evaluatedAt
      && evaluatedAt < pointAt + ONE_HOUR_MS;
  });
  if (coveringPoints.length !== 1) {
    throw new Error('met.no: mangler gjeldende en-timesintervall');
  }
  const first = coveringPoints[0]!;
  const d = first.data.instant.details;
  const period = oneHourEvidence(first);
  const precipMmH = period.precipitationAmountMm;
  const symbolCode = period.symbolCode;
  return {
    tempC: d.air_temperature,
    feelsLikeC: feelsLikeC(d.air_temperature, d.wind_speed, d.relative_humidity),
    windMs: d.wind_speed,
    windDir: d.wind_from_direction,
    precipMmH,
    symbolCode,
    observedAt: new Date(first.time),
  };
}

export function extractHourly(forecast: MetForecast, hours = 12): WeatherHourly[] {
  return oneHourForecastPoints(forecast).slice(0, hours).map((point) => {
    const d = point.data.instant.details;
    const period = oneHourEvidence(point);
    return {
      time: new Date(point.time),
      tempC: d.air_temperature,
      feelsLikeC: feelsLikeC(d.air_temperature, d.wind_speed, d.relative_humidity),
      windMs: d.wind_speed,
      precipMmH: period.precipitationAmountMm,
      symbolCode: period.symbolCode,
    };
  });
}

/**
 * Én rad per dag, med det EKTE været på timen nærmest `refHour` (standard 12).
 * Brukes av Uke → "10 dager" så hver dag viser vær + klær på valgt klokkeslett
 * (ikke et hi/lo-gjennomsnitt). met.no compact gir timesoppløsning de første
 * ~2-3 dagene og 6-timers utover — nærmeste-punkt-logikken dekker begge.
 */
export function extractDailyAtHour(
  forecast: MetForecast,
  refHour: number,
  days = 10,
): WeatherDayAtHour[] {
  const byDate = new Map<string, { date: Date; best?: { point: MetTimePoint; distance: number } }>();
  for (const point of usableForecastPoints(forecast)) {
    const time = new Date(point.time);
    const key = time.toLocaleDateString('nb-NO');
    const midnight = new Date(time);
    midnight.setHours(0, 0, 0, 0);
    const entry = byDate.get(key) ?? { date: midnight };
    const distance = Math.abs(time.getHours() - refHour);
    if (!entry.best || distance < entry.best.distance) {
      entry.best = { point, distance };
    }
    byDate.set(key, entry);
  }

  const result: WeatherDayAtHour[] = [];
  for (const [, entry] of byDate) {
    if (result.length >= days) break;
    if (!entry.best) continue;
    const p = entry.best.point;
    const d = p.data.instant.details;
    const period = periodEvidence(p);
    const symbolCode = period.symbolCode;
    const precipMmH = period.precipitationAmountMm / period.durationHours;
    result.push({
      date: entry.date,
      refHour,
      tempC: d.air_temperature,
      feelsLikeC: feelsLikeC(d.air_temperature, d.wind_speed, d.relative_humidity),
      windMs: d.wind_speed,
      precipMmH,
      symbolCode,
    });
  }
  return result;
}

/**
 * Aggregerer timeseries til daglige tall (lokal tid).
 * Returnerer opptil `days` dager fra og med dagens dato.
 */
export function extractDaily(forecast: MetForecast, days = 3): WeatherDaily[] {
  const byDate = new Map<string, {
    points: typeof forecast.properties.timeseries;
    midDay?: { code: string; distance: number };
  }>();

  for (const point of usableForecastPoints(forecast)) {
    const time = new Date(point.time);
    const key = time.toLocaleDateString('nb-NO');
    const existing = byDate.get(key) ?? { points: [] as typeof forecast.properties.timeseries };
    existing.points.push(point);

    // Symbol nærmest kl 12:00 brukes som dagens "dominant"
    const hour = time.getHours();
    const distance = Math.abs(hour - 12);
    const code = periodEvidence(point).symbolCode;
    if (!existing.midDay || distance < existing.midDay.distance) {
      existing.midDay = { code, distance };
    }
    byDate.set(key, existing);
  }

  const result: WeatherDaily[] = [];
  let i = 0;
  for (const [, entry] of byDate) {
    if (i >= days) break;
    if (entry.points.length === 0) continue;
    const feels = entry.points.map((p) =>
      feelsLikeC(
        p.data.instant.details.air_temperature,
        p.data.instant.details.wind_speed,
        p.data.instant.details.relative_humidity,
      ),
    );
    const winds = entry.points.map((p) => p.data.instant.details.wind_speed);
    const precip = entry.points.reduce(
      (sum, p) => sum + periodEvidence(p).precipitationAmountMm,
      0,
    );
    const firstPoint = entry.points[0]!;
    const date = new Date(firstPoint.time);
    date.setHours(0, 0, 0, 0);
    result.push({
      date,
      minFeelsC: Math.min(...feels),
      maxFeelsC: Math.max(...feels),
      avgWindMs: winds.reduce((s, v) => s + v, 0) / winds.length,
      totalPrecipMm: precip,
      symbolCode: entry.midDay?.code ?? periodEvidence(firstPoint).symbolCode,
    });
    i++;
  }
  return result;
}
