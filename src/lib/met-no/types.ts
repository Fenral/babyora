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
  precipMmH: number;
  symbolCode: string;
};
