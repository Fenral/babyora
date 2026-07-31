import { describe, expect, it } from 'vitest';
import { buildAdjustPrefill } from '../adjust-prefill.js';
import type { WeatherNow } from '../../../lib/met-no/types.js';

function now(overrides: Partial<WeatherNow> = {}): WeatherNow {
  return {
    tempC: -6,
    feelsLikeC: -11,
    windMs: 7,
    windDir: 220,
    precipMmH: 1.2,
    symbolCode: 'cloudy',
    observedAt: new Date('2026-07-31T08:00:00Z'),
    ...overrides,
  };
}

describe('buildAdjustPrefill', () => {
  it('returns null when there is no weather to seed from (e.g. genuinely offline, no last-known reading either)', () => {
    expect(buildAdjustPrefill(null, 'utelek', 'Trondheim')).toBeNull();
  });

  it('packages tempC/windMs/precipMmH/activity/placeLabel straight from the given weather + activity + cityLabel', () => {
    const prefill = buildAdjustPrefill(now({ tempC: -6, windMs: 7, precipMmH: 1.2 }), 'vogn', 'Trondheim');
    expect(prefill).toEqual({
      tempC: -6,
      windMs: 7,
      precipMmH: 1.2,
      activity: 'vogn',
      placeLabel: 'Trondheim',
    });
  });

  it('carries the activity through unchanged for both Monter activities', () => {
    expect(buildAdjustPrefill(now(), 'utelek', 'Oslo')?.activity).toBe('utelek');
    expect(buildAdjustPrefill(now(), 'vogn', 'Oslo')?.activity).toBe('vogn');
  });
});
