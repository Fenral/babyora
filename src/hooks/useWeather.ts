import { useEffect, useRef, useState } from 'react';
import {
  extractDaily,
  extractDailyAtHour,
  extractHourly,
  extractNow,
  fetchForecast,
} from '../lib/met-no/client';
import type {
  ForecastFetchMetadata,
  ForecastFetchResult,
  MetForecast,
  WeatherDaily,
  WeatherDayAtHour,
  WeatherHourly,
  WeatherNow,
} from '../lib/met-no/types';
import {
  assessForecastCoverage,
  type ForecastCoverage,
} from '../lib/planning/coverage';

type Status = 'idle' | 'loading' | 'ready' | 'error';

export type WeatherEvidence = Readonly<{
  metadata: ForecastFetchMetadata;
  coverage: ForecastCoverage;
}>;

export type WeatherState = {
  status: Status;
  now: WeatherNow | null;
  hourly: WeatherHourly[];
  daily: WeatherDaily[];
  dailyAtHour: WeatherDayAtHour[];
  /** RÃ¥ met.no-respons for avledninger som trenger full timeserie. */
  forecast: MetForecast | null;
  evidence: WeatherEvidence | null;
  error: string | null;
  attribution: string;
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
    evidence: null,
    error: null,
    attribution: 'VÃ¦r fra met.no',
  };
}

export function weatherStateFromForecastResult(
  result: ForecastFetchResult,
  refHour: number,
  extractors: WeatherExtractors = DEFAULT_EXTRACTORS,
): WeatherState {
  const { forecast, metadata } = result;
  return {
    status: 'ready',
    now: extractors.now(forecast),
    hourly: extractors.hourly(forecast, 48),
    daily: extractors.daily(forecast, 10),
    dailyAtHour: extractors.dailyAtHour(forecast, refHour, 10),
    forecast,
    evidence: {
      metadata,
      coverage: assessForecastCoverage(
        forecast.properties.timeseries.map((point) => point.time),
        metadata,
      ),
    },
    error: null,
    attribution: 'VÃ¦r fra met.no',
  };
}

export function createInitialWeatherRequestState(fetchKey: string): WeatherRequestState {
  return { activeRequestId: 0, activeFetchKey: fetchKey, weather: emptyWeatherState('loading') };
}

export function reduceWeatherRequestState(
  state: WeatherRequestState,
  event: WeatherRequestEvent,
  extractors: WeatherExtractors = DEFAULT_EXTRACTORS,
): WeatherRequestState {
  if (event.type === 'started') {
    if (event.requestId <= state.activeRequestId) return state;
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
  return {
    ...state,
    weather: {
      ...state.weather,
      status: 'error',
      error: event.error instanceof Error ? event.error.message : 'Ukjent feil',
    },
  };
}

export function useWeather(lat: number, lon: number, refHour: number = 12): WeatherState {
  const fetchKey = `${lat},${lon},${refHour}`;
  const requestIdRef = useRef(0);
  const [requestState, setRequestState] = useState<WeatherRequestState>(
    () => createInitialWeatherRequestState(fetchKey),
  );

  useEffect(() => {
    let cancelled = false;
    const requestId = ++requestIdRef.current;
    setRequestState((current) => reduceWeatherRequestState(current, {
      type: 'started', requestId, fetchKey,
    }));

    fetchForecast(lat, lon)
      .then((result) => {
        if (cancelled) return;
        setRequestState((current) => reduceWeatherRequestState(current, {
          type: 'resolved', requestId, fetchKey, result, refHour,
        }));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setRequestState((current) => reduceWeatherRequestState(current, {
          type: 'rejected', requestId, fetchKey, error,
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [fetchKey, lat, lon, refHour]);

  return requestState.weather;
}
