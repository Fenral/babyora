/**
 * Type-skisse for met.no LocationForecast v2.0 compact-response.
 * Bare feltene vi faktisk bruker.
 * Full spec: https://api.met.no/weatherapi/locationforecast/2.0/documentation
 */
export type MetForecast = {
  properties: {
    meta: {
      updated_at: string;
      units: Record<string, string>;
    };
    timeseries: MetTimePoint[];
  };
};

export type MetTimePoint = {
  time: string; // ISO 8601 UTC
  data: {
    instant: {
      details: {
        air_temperature: number; // °C
        wind_speed: number; // m/s
        wind_from_direction: number; // grader
        relative_humidity: number; // %
        cloud_area_fraction: number; // %
      };
    };
    next_1_hours?: {
      summary: { symbol_code: string };
      details: { precipitation_amount: number }; // mm
    };
    next_6_hours?: {
      summary: { symbol_code: string };
      details: { precipitation_amount: number };
    };
  };
};

export type ForecastFetchMetadata = {
  source: 'network' | 'cache';
  sourceUpdatedAt: string | null;
  fetchedAt: number;
  cacheStatus: 'miss' | 'fresh' | 'stale';
  stale: boolean;
};

export type ForecastFetchResult = {
  forecast: MetForecast;
  metadata: ForecastFetchMetadata;
};

const ISO_INSTANT = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|([+-])(\d{2}):(\d{2}))$/;

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return leap ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

/** Parse an absolute ISO instant without accepting Date.parse calendar rollover. */
export function parseStrictIsoInstant(value: unknown): number | null {
  if (typeof value !== 'string') return null;
  const match = ISO_INSTANT.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const offsetHour = match[7] === 'Z' ? 0 : Number(match[9]);
  const offsetMinute = match[7] === 'Z' ? 0 : Number(match[10]);

  if (
    year < 1
    || month < 1 || month > 12
    || day < 1 || day > daysInMonth(year, month)
    || hour > 23 || minute > 59 || second > 59
    || offsetHour > 14 || offsetMinute > 59
    || (offsetHour === 14 && offsetMinute !== 0)
  ) return null;

  const epochMs = Date.parse(value);
  return Number.isFinite(epochMs) ? epochMs : null;
}

export type WeatherNow = {
  tempC: number;
  feelsLikeC: number;
  windMs: number;
  windDir: number;
  precipMmH: number; // neste 1 time
  symbolCode: string;
  observedAt: Date;
};

export type WeatherHourly = {
  time: Date;
  tempC: number;
  feelsLikeC: number;
  windMs: number;
  precipMmH: number;
  symbolCode: string;
};

export type WeatherDaily = {
  date: Date; // midnatt lokal tid for dagen
  minFeelsC: number;
  maxFeelsC: number;
  avgWindMs: number;
  totalPrecipMm: number;
  symbolCode: string; // dominant kode rundt midten av dagen
};

/** Én dag representert ved været på en valgt time (referansetid, standard 12). */
export type WeatherDayAtHour = {
  date: Date; // midnatt lokal tid for dagen
  refHour: number; // timen været er hentet fra
  tempC: number;
  feelsLikeC: number;
  windMs: number;
  precipMmH: number; // one-hour amount, or normalized hourly average for a six-hour period
  symbolCode: string;
};
