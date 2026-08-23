import { describe, expect, it } from 'vitest';
import type { WeatherHourly, WeatherNow } from '../../../src/lib/met-no/types';
import { buildHomeViewModel } from '../home-model';

const now: WeatherNow = {
  tempC: 7,
  feelsLikeC: 6,
  windMs: 3,
  windDir: 220,
  precipMmH: 0.4,
  symbolCode: 'partlycloudy_day',
  observedAt: new Date('2026-08-17T09:00:00.000Z'),
};

const hourly: WeatherHourly[] = [
  {
    time: new Date('2026-08-17T09:00:00.000Z'),
    tempC: 7,
    feelsLikeC: 6,
    windMs: 3,
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
];

describe('Snudly 2 home model', () => {
  it('uses the real engine, profile and MET values instead of a visual fixture', () => {
    const model = buildHomeViewModel({
      profile: { name: 'Lillian', birthDate: '2025-10-17', city: 'Trondheim' },
      situation: 'outdoor-play',
      weatherNow: now,
      hourly,
      evaluatedAt: new Date('2026-08-17T09:00:00.000Z'),
    });

    expect(model.engine).toBe('snudly-engine-v1');
    expect(model.garmentCount).toBe(6);
    expect(model.garments.map((garment) => garment.name)).toEqual([
      'Ullsett, tynt',
      'Ull-jakke',
      'Ull-bukse',
      'Lue',
      'Tøffel-sko',
      'Votter, tynne',
    ]);
    expect(model.summary).toBe('6 plagg for Lillian · Utelek');
    expect(model.weather).toMatchObject({
      temperature: '7°',
      feelsLike: '6°',
      condition: 'Delvis skyet',
      wind: '3 m/s',
      precipitation: '0,4 mm',
    });
  });

  it('finds the first truthful engine change in the hourly forecast', () => {
    const model = buildHomeViewModel({
      profile: { name: '', birthDate: '2025-10-17', city: 'Trondheim' },
      situation: 'outdoor-play',
      weatherNow: now,
      hourly,
      evaluatedAt: new Date('2026-08-17T09:00:00.000Z'),
    });

    expect(model.childName).toBe('barnet');
    expect(model.nextChange).toEqual({ time: '14:00', action: 'Ta av ull-jakke' });
  });

  it('fails closed instead of guessing an age for an invalid stored birthday', () => {
    for (const birthDate of ['not-a-date', '2026-08-22', '2024-07-01']) {
      expect(() => buildHomeViewModel({
        profile: { name: 'Lillian', birthDate, city: 'Trondheim' },
        situation: 'outdoor-play',
        weatherNow: now,
        hourly,
        evaluatedAt: new Date('2026-08-17T09:00:00.000Z'),
      })).toThrow('invalid child birth date');
    }
  });
});
