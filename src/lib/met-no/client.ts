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
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 time per met.no-anbefaling
const MAX_STALE_AGE_MS = 6 * 60 * 60 * 1000;
const MAX_SOURCE_AGE_MS = 6 * 60 * 60 * 1000;
const MAX_SOURCE_FUTURE_SKEW_MS = 5 * 60 * 1000;

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

const latestStartedVersionByKey = new Map<string, number>();
const latestCommittedByKey = new Map<string, Readonly<{
  version: number;
  result: ForecastFetchResult;
}>>();
let coordinatorStorage: Storage | null | undefined;

type CachedEntry = {
  version?: 1;
  fetchedAt: number;
  data: MetForecast;
};

type CacheCandidates = {
  fresh: CachedEntry | null;
  stale: CachedEntry | null;
};

function cacheKey(lat: number, lon: number): string {
  return `${CACHE_KEY_PREFIX}${lat.toFixed(2)},${lon.toFixed(2)}`;
}

function alignCoordinatorWithStorage(): void {
  let currentStorage: Storage | null = null;
  try {
    currentStorage = localStorage;
  } catch {
    // Memory coordination still works when persistent storage is unavailable.
  }
  if (currentStorage === coordinatorStorage) return;
  latestStartedVersionByKey.clear();
  latestCommittedByKey.clear();
  coordinatorStorage = currentStorage;
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

function isCachedEntry(value: unknown, now: number): value is CachedEntry {
  if (!isRecord(value)) return false;
  if (value.version !== undefined && value.version !== 1) return false;
  return isFiniteNumber(value.fetchedAt)
    && value.fetchedAt <= now
    && isMetForecast(value.data);
}

function readCache(lat: number, lon: number, now: number): CacheCandidates {
  const key = cacheKey(lat, lon);
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return { fresh: null, stale: null };
    const parsed: unknown = JSON.parse(raw);
    if (!isCachedEntry(parsed, now) || now - parsed.fetchedAt > MAX_STALE_AGE_MS) {
      localStorage.removeItem(key);
      return { fresh: null, stale: null };
    }
    if (now - parsed.fetchedAt <= CACHE_TTL_MS) return { fresh: parsed, stale: null };
    return { fresh: null, stale: parsed };
  } catch {
    try {
      localStorage.removeItem(key);
    } catch {
      // Storage is unavailable; there is nothing else to recover here.
    }
    return { fresh: null, stale: null };
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

function cacheResult(entry: CachedEntry, stale: boolean): ForecastFetchResult {
  const metadata: ForecastFetchMetadata = {
    source: 'cache',
    sourceUpdatedAt: sourceUpdatedAt(entry.data, Date.now()),
    fetchedAt: entry.fetchedAt,
    cacheStatus: stale ? 'stale' : 'fresh',
    stale,
  };
  return { forecast: entry.data, metadata };
}

function readMemoryCommit(key: string, now: number): Readonly<{
  version: number;
  result: ForecastFetchResult;
}> | null {
  const committed = latestCommittedByKey.get(key);
  if (!committed) return null;
  const age = now - committed.result.metadata.fetchedAt;
  if (
    age < 0
    || age > CACHE_TTL_MS
    || !isMetForecast(committed.result.forecast)
  ) {
    latestCommittedByKey.delete(key);
    return null;
  }
  return {
    ...committed,
    result: {
      ...committed.result,
      metadata: {
        ...committed.result.metadata,
        sourceUpdatedAt: sourceUpdatedAt(committed.result.forecast, now),
      },
    },
  };
}

export async function fetchForecast(lat: number, lon: number): Promise<ForecastFetchResult> {
  alignCoordinatorWithStorage();
  const fetchedAt = Date.now();
  const cached = readCache(lat, lon, fetchedAt);
  if (cached.fresh) return cacheResult(cached.fresh, false);

  const key = cacheKey(lat, lon);
  const requestVersion = (latestStartedVersionByKey.get(key) ?? 0) + 1;
  latestStartedVersionByKey.set(key, requestVersion);

  // Via proxy — den setter User-Agent server-side (met.no-krav).
  const url = `${PROXY}?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      throw new Error(`met.no HTTP ${res.status}`);
    }
    const data: unknown = await res.json();
    if (!isMetForecast(data)) throw new Error('met.no: ugyldig prognose');

    const committed = readMemoryCommit(key, Date.now());
    if (committed && committed.version > requestVersion) {
      return committed.result;
    }

    const result: ForecastFetchResult = {
      forecast: data,
      metadata: {
        source: 'network',
        sourceUpdatedAt: sourceUpdatedAt(data, fetchedAt),
        fetchedAt,
        cacheStatus: 'miss',
        stale: false,
      },
    };
    latestCommittedByKey.set(key, { version: requestVersion, result });
    writeCache(lat, lon, fetchedAt, data);
    return result;
  } catch (error) {
    const committed = readMemoryCommit(key, Date.now());
    if (committed) return committed.result;
    const current = readCache(lat, lon, Date.now());
    if (current.fresh) return cacheResult(current.fresh, false);
    if (current.stale) return cacheResult(current.stale, true);
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
  if (!period) throw new Error('met.no: mangler en-timesbevis');
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

export function extractNow(forecast: MetForecast): WeatherNow {
  const first = forecast.properties.timeseries[0];
  if (!first) throw new Error('met.no: mangler en-timesbevis');
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
