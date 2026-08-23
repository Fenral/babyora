import { searchAddress } from '../../src/lib/geocode/nominatim';
import { extractDailyAtHour, extractHourly, extractNow, fetchForecast } from '../../src/lib/met-no/client';
import type { WeatherDayAtHour, WeatherHourly, WeatherNow } from '../../src/lib/met-no/types';

export type CityWeather = Readonly<{
  now: WeatherNow;
  hourly: WeatherHourly[];
  daily: WeatherDayAtHour[];
  evaluatedAt: Date;
  stale: boolean;
}>;

const TRONDHEIM = { latitude: 63.4305, longitude: 10.3951 } as const;

async function coordinatesFor(city: string): Promise<{ latitude: number; longitude: number }> {
  if (city.trim().toLocaleLowerCase('nb-NO') === 'trondheim') return TRONDHEIM;
  const [match] = await searchAddress(`${city}, Norge`);
  if (!match || !Number.isFinite(match.lat) || !Number.isFinite(match.lon)) {
    throw new Error('unknown home place');
  }
  return { latitude: match.lat, longitude: match.lon };
}

export async function loadCityWeather(city: string, signal: AbortSignal): Promise<CityWeather> {
  const coordinates = await coordinatesFor(city);
  if (signal.aborted) throw new DOMException('Weather request aborted', 'AbortError');
  const result = await fetchForecast(coordinates.latitude, coordinates.longitude, {
    cacheScope: 'persistent',
  });
  if (signal.aborted) throw new DOMException('Weather request aborted', 'AbortError');
  const evaluatedAt = new Date(result.metadata.evaluatedAt);
  return {
    now: extractNow(result.forecast, evaluatedAt.getTime()),
    hourly: extractHourly(result.forecast, 48),
    daily: extractDailyAtHour(result.forecast, 12, 7),
    evaluatedAt,
    stale: result.metadata.stale,
  };
}
