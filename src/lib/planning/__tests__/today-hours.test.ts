import { describe, expect, it } from 'vitest';
import type { WeatherHourly } from '../../met-no/types.js';
import { selectTodayPlanningHours } from '../today-hours.js';

const oslo = 'Europe/Oslo';

function hour(iso: string): WeatherHourly {
  return {
    time: new Date(iso),
    tempC: 10,
    feelsLikeC: 10,
    windMs: 1,
    precipMmH: 0,
    symbolCode: 'cloudy',
  };
}

describe('selectTodayPlanningHours', () => {
  it('keeps the established checkpoints while there is still a normal daytime plan', () => {
    const hourly = [
      hour('2026-07-20T04:00:00Z'),
      hour('2026-07-20T08:00:00Z'),
      hour('2026-07-20T12:00:00Z'),
      hour('2026-07-20T16:00:00Z'),
      hour('2026-07-20T18:00:00Z'),
    ];
    const selected = selectTodayPlanningHours(
      hourly,
      Date.parse('2026-07-20T10:30:00Z'),
      oslo,
    );
    expect(selected.map((point) => point.time.toISOString())).toEqual([
      '2026-07-20T04:00:00.000Z',
      '2026-07-20T08:00:00.000Z',
      '2026-07-20T12:00:00.000Z',
      '2026-07-20T16:00:00.000Z',
    ]);
  });

  it('uses current and upcoming unique points after the final daytime checkpoint', () => {
    const hourly = [
      hour('2026-07-20T19:00:00Z'),
      hour('2026-07-20T20:00:00Z'),
      hour('2026-07-20T21:00:00Z'),
      hour('2026-07-20T22:00:00Z'),
      hour('2026-07-20T23:00:00Z'),
    ];
    const selected = selectTodayPlanningHours(
      hourly,
      Date.parse('2026-07-20T19:42:00Z'),
      oslo,
    );
    expect(selected.map((point) => point.time.toISOString())).toEqual([
      '2026-07-20T19:00:00.000Z',
      '2026-07-20T20:00:00.000Z',
      '2026-07-20T21:00:00.000Z',
      '2026-07-20T22:00:00.000Z',
    ]);
    expect(new Set(selected.map((point) => point.time.getTime())).size).toBe(selected.length);
  });

  it('can carry a late-evening plan over midnight instead of returning an invalid one-point plan', () => {
    const selected = selectTodayPlanningHours([
      hour('2026-07-20T21:00:00Z'),
      hour('2026-07-20T22:00:00Z'),
      hour('2026-07-20T23:00:00Z'),
      hour('2026-07-21T00:00:00Z'),
    ], Date.parse('2026-07-20T21:42:00Z'), oslo);
    expect(selected).toHaveLength(4);
    expect(selected[0]!.time.toISOString()).toBe('2026-07-20T21:00:00.000Z');
    expect(selected.at(-1)!.time.toISOString()).toBe('2026-07-21T00:00:00.000Z');
  });
});
