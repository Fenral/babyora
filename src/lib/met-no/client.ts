import type { MetForecast, MetTimePoint, WeatherDaily, WeatherDayAtHour, WeatherHourly, WeatherNow } from './types.js';
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

type CachedEntry = {
  fetchedAt: number;
  data: MetForecast;
};

function cacheKey(lat: number, lon: number): string {
  return `${CACHE_KEY_PREFIX}${lat.toFixed(2)},${lon.toFixed(2)}`;
}

function readCache(lat: number, lon: number): CachedEntry | null {
  try {
    const raw = localStorage.getItem(cacheKey(lat, lon));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedEntry;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(lat: number, lon: number, data: MetForecast): void {
  try {
    const entry: CachedEntry = { fetchedAt: Date.now(), data };
    localStorage.setItem(cacheKey(lat, lon), JSON.stringify(entry));
  } catch {
    // localStorage fullt eller blokkert — ignorer
  }
}

export async function fetchForecast(lat: number, lon: number): Promise<MetForecast> {
  const cached = readCache(lat, lon);
  if (cached) return cached.data;

  // Via proxy — den setter User-Agent server-side (met.no-krav).
  const url = `${PROXY}?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    throw new Error(`met.no HTTP ${res.status}`);
  }
  const data = (await res.json()) as MetForecast;
  writeCache(lat, lon, data);
  return data;
}

export function extractNow(forecast: MetForecast): WeatherNow {
  const first = forecast.properties.timeseries[0];
  if (!first) throw new Error('met.no: tom timeseries');
  const d = first.data.instant.details;
  const precipMmH = first.data.next_1_hours?.details.precipitation_amount ?? 0;
  const symbolCode =
    first.data.next_1_hours?.summary.symbol_code ??
    first.data.next_6_hours?.summary.symbol_code ??
    'clearsky_day';
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
  return forecast.properties.timeseries.slice(0, hours).map((point) => {
    const d = point.data.instant.details;
    return {
      time: new Date(point.time),
      tempC: d.air_temperature,
      feelsLikeC: feelsLikeC(d.air_temperature, d.wind_speed, d.relative_humidity),
      windMs: d.wind_speed,
      precipMmH: point.data.next_1_hours?.details.precipitation_amount ?? 0,
      symbolCode:
        point.data.next_1_hours?.summary.symbol_code ?? 'clearsky_day',
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
  for (const point of forecast.properties.timeseries) {
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
    const symbolCode =
      p.data.next_6_hours?.summary.symbol_code ??
      p.data.next_1_hours?.summary.symbol_code ??
      'cloudy';
    const precipMmH =
      p.data.next_1_hours?.details.precipitation_amount ??
      p.data.next_6_hours?.details.precipitation_amount ??
      0;
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

  for (const point of forecast.properties.timeseries) {
    const time = new Date(point.time);
    const key = time.toLocaleDateString('nb-NO');
    const existing = byDate.get(key) ?? { points: [] as typeof forecast.properties.timeseries };
    existing.points.push(point);

    // Symbol nærmest kl 12:00 brukes som dagens "dominant"
    const hour = time.getHours();
    const distance = Math.abs(hour - 12);
    const code = point.data.next_6_hours?.summary.symbol_code ?? point.data.next_1_hours?.summary.symbol_code;
    if (code && (!existing.midDay || distance < existing.midDay.distance)) {
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
      (sum, p) => sum + (p.data.next_1_hours?.details.precipitation_amount ?? 0),
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
      symbolCode: entry.midDay?.code ?? 'cloudy',
    });
    i++;
  }
  return result;
}
