import { useEffect, useRef, useState } from 'react';
import {
  extractDaily,
  extractDailyAtHour,
  extractHourly,
  extractNow,
  fetchForecast,
} from '../lib/met-no/client';
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

type Status = 'idle' | 'loading' | 'ready' | 'offline' | 'error';

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
  /** Rå met.no-respons for avledninger som trenger full timeserie. */
  forecast: MetForecast | null;
  /** Stale data is retained only for explicit offline UI, never legacy recommendation inputs. */
  offlineForecast: MetForecast | null;
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
    offlineForecast: null,
    evidence: null,
    error: null,
    attribution: 'V\u00e6r fra met.no',
  };
}

export function weatherStateFromForecastResult(
  result: ForecastFetchResult,
  refHour: number,
  extractors: WeatherExtractors = DEFAULT_EXTRACTORS,
): WeatherState {
  const { forecast, metadata } = result;
  const evidence = {
    metadata,
    coverage: assessForecastCoverage(
      forecast.properties.timeseries.map((point) => point.time),
      metadata,
    ),
  };
  if (metadata.stale || parseStrictIsoInstant(metadata.sourceUpdatedAt) === null) {
    return {
      ...emptyWeatherState('offline'),
      offlineForecast: forecast,
      evidence,
    };
  }
  return {
    status: 'ready',
    now: extractors.now(forecast),
    hourly: extractors.hourly(forecast, 48),
    daily: extractors.daily(forecast, 10),
    dailyAtHour: extractors.dailyAtHour(forecast, refHour, 10),
    forecast,
    offlineForecast: null,
    evidence,
    error: null,
    attribution: 'V\u00e6r fra met.no',
  };
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
    const requestId = ++requestIdRef.current;
    const lifecycle = startWeatherRequest({
      requestId,
      fetchKey,
      refHour,
      load: () => fetchForecast(lat, lon),
      dispatch: (event) => {
        setRequestState((current) => reduceWeatherRequestState(current, event));
      },
    });
    return lifecycle.cancel;
  }, [fetchKey, lat, lon, refHour]);

  return selectWeatherForFetchKey(requestState, fetchKey);
}
