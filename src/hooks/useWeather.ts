import { useEffect, useState } from 'react';
import {
  extractDaily,
  extractDailyAtHour,
  extractHourly,
  extractNow,
  fetchForecast,
} from '../lib/met-no/client';
import type {
  MetForecast,
  WeatherDaily,
  WeatherDayAtHour,
  WeatherHourly,
  WeatherNow,
} from '../lib/met-no/types';

type Status = 'idle' | 'loading' | 'ready' | 'error';

export type WeatherState = {
  status: Status;
  now: WeatherNow | null;
  hourly: WeatherHourly[];
  daily: WeatherDaily[];
  dailyAtHour: WeatherDayAtHour[];
  /** Rå met.no-respons — for avledninger som trenger full timeserie
   *  (f.eks. "10 dager" ved valgt referansetime). */
  forecast: MetForecast | null;
  error: string | null;
  attribution: string;
};

export function useWeather(lat: number, lon: number, refHour: number = 12): WeatherState {
  const [state, setState] = useState<WeatherState>({
    status: 'loading',
    now: null,
    hourly: [],
    daily: [],
    dailyAtHour: [],
    forecast: null,
    error: null,
    attribution: 'Vær fra met.no',
  });

  // R3 (2026-07-14): «tilbake til loading når params endres» via render-
  // justering i stedet for sync setState i effect. Ved mount er initial-
  // status allerede 'loading', så effect-settet var kun nødvendig ved
  // param-endring — som nå håndteres her, én render tidligere.
  const fetchKey = `${lat},${lon},${refHour}`;
  const [lastFetchKey, setLastFetchKey] = useState(fetchKey);
  if (lastFetchKey !== fetchKey) {
    setLastFetchKey(fetchKey);
    setState((s) => ({ ...s, status: 'loading', error: null }));
  }

  useEffect(() => {
    let cancelled = false;

    fetchForecast(lat, lon)
      .then((forecast) => {
        if (cancelled) return;
        setState({
          status: 'ready',
          now: extractNow(forecast),
          hourly: extractHourly(forecast, 48),
          daily: extractDaily(forecast, 10),
          dailyAtHour: extractDailyAtHour(forecast, refHour, 10),
          forecast,
          error: null,
          attribution: 'Vær fra met.no',
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState((s) => ({
          ...s,
          status: 'error',
          error: err instanceof Error ? err.message : 'Ukjent feil',
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lon, refHour]);

  return state;
}
