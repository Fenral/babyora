import { useEffect } from 'react';
import { symbolToTheme } from '../lib/weather-theme/symbolToTheme';
import type { WeatherTheme } from '../lib/weather-theme/types';

/**
 * Setter document.documentElement.dataset.weather basert på symbolCode.
 * CSS-overrides i index.css plukker det opp og bytter farge-tokens.
 *
 * Rydder ved unmount (setter til 'default') så vi ikke etterlater stale state
 * om bruker navigerer bort fra HomeScreen.
 */
export function useWeatherTheme(symbolCode: string | null | undefined): WeatherTheme {
  const theme = symbolToTheme(symbolCode);

  useEffect(() => {
    document.documentElement.dataset.weather = theme;
    return () => {
      document.documentElement.dataset.weather = 'default';
    };
  }, [theme]);

  return theme;
}
