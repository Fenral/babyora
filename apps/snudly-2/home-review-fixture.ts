import type { HomeWeatherLoader } from './HomeScreen';

export const homeReviewWeatherLoader: HomeWeatherLoader = async (_city, signal) => {
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  return {
    status: 'ready',
    stale: false,
    evaluatedAt: new Date('2026-08-17T09:00:00.000Z'),
    now: {
      tempC: 7,
      feelsLikeC: 6,
      windMs: 2,
      windDir: 220,
      precipMmH: 0.4,
      symbolCode: 'partlycloudy_day',
      observedAt: new Date('2026-08-17T09:00:00.000Z'),
    },
    hourly: [
      {
        time: new Date('2026-08-17T09:00:00.000Z'),
        tempC: 7,
        feelsLikeC: 6,
        windMs: 2,
        precipMmH: 0.4,
        symbolCode: 'partlycloudy_day',
      },
      {
        time: new Date('2026-08-17T12:00:00.000Z'),
        tempC: 11,
        feelsLikeC: 10,
        windMs: 2,
        precipMmH: 0,
        symbolCode: 'fair_day',
      },
    ],
  };
};
