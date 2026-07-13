import { describe, it, expect } from 'vitest';
import { extractDailyAtHour, extractHourly } from '../client';
import type { MetForecast, MetTimePoint } from '../types';

/** Bygg et timeseries-punkt på LOKAL tid (så getHours() blir deterministisk
 *  uavhengig av test-TZ — new Date(y,m,d,h) tolkes lokalt). */
function point(
  y: number, m: number, d: number, h: number,
  tempC: number, windMs: number, symbol = 'cloudy',
): MetTimePoint {
  return {
    time: new Date(y, m, d, h, 0, 0).toISOString(),
    data: {
      instant: {
        details: {
          air_temperature: tempC,
          wind_speed: windMs,
          wind_from_direction: 0,
          relative_humidity: 70,
          cloud_area_fraction: 50,
        },
      },
      next_1_hours: { summary: { symbol_code: symbol }, details: { precipitation_amount: 0 } },
    },
  };
}

function forecast(points: MetTimePoint[]): MetForecast {
  return { properties: { meta: { updated_at: '', units: {} }, timeseries: points } };
}

describe('extractHourly', () => {
  it('inkluderer windMs fra instant-detaljene', () => {
    const fc = forecast([point(2026, 0, 1, 6, 2, 4.5)]);
    const [first] = extractHourly(fc, 1);
    expect(first?.windMs).toBe(4.5);
    expect(first?.tempC).toBe(2);
  });
});

describe('extractDailyAtHour', () => {
  const fc = forecast([
    // dag 1
    point(2026, 0, 1, 6, 2, 3),
    point(2026, 0, 1, 12, 9, 3),
    point(2026, 0, 1, 18, 5, 3),
    // dag 2
    point(2026, 0, 2, 9, 1, 3),
    point(2026, 0, 2, 12, 8, 3),
    point(2026, 0, 2, 15, 6, 3),
  ]);

  it('velger punktet nærmest referansetimen (12) per dag', () => {
    const days = extractDailyAtHour(fc, 12, 10);
    expect(days).toHaveLength(2);
    expect(days[0]?.tempC).toBe(9); // dag 1 kl 12
    expect(days[1]?.tempC).toBe(8); // dag 2 kl 12
    expect(days[0]?.refHour).toBe(12);
  });

  it('bytter valgt punkt når referansetimen endres', () => {
    const days = extractDailyAtHour(fc, 6, 10);
    expect(days[0]?.tempC).toBe(2); // dag 1 kl 6 (eksakt)
    expect(days[1]?.tempC).toBe(1); // dag 2: 9 er nærmest 6 (av 9/12/15)
  });

  it('begrenser antall dager til `days`', () => {
    expect(extractDailyAtHour(fc, 12, 1)).toHaveLength(1);
  });
});
