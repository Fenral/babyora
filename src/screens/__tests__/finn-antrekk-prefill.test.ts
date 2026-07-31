import { describe, expect, it } from 'vitest';
import {
  activityUiFromEngine,
  seedFromPrefill,
  type FinnAntrekkPrefill,
} from '../finn-antrekk-prefill';

function prefill(overrides: Partial<FinnAntrekkPrefill> = {}): FinnAntrekkPrefill {
  return {
    tempC: -12,
    windMs: 9,
    precipMmH: 2.3,
    activity: 'vogn',
    ...overrides,
  };
}

describe('activityUiFromEngine', () => {
  it('maps the engine "vogn" activity straight through', () => {
    expect(activityUiFromEngine('vogn')).toBe('vogn');
  });

  it('maps every other engine activity ("utelek", "baeresele", "soevn") to "lek"', () => {
    expect(activityUiFromEngine('utelek')).toBe('lek');
    expect(activityUiFromEngine('baeresele')).toBe('lek');
    expect(activityUiFromEngine('soevn')).toBe('lek');
  });
});

describe('seedFromPrefill — SEED WINS over internal defaults', () => {
  it('returns the screen\'s internal defaults + initedFromWeather=false when no prefill is given', () => {
    expect(seedFromPrefill(undefined)).toEqual({
      tempC: -4,
      windMs: 3,
      precipMmH: 0,
      activityUi: 'lek',
      initedFromWeather: false,
    });
  });

  it('seeds every field from the prefill, deliberately different from every internal default', () => {
    const seed = seedFromPrefill(prefill());
    // Every value below differs from DEFAULT_SEED — proves the prefill, not
    // the default, produced them.
    expect(seed.tempC).toBe(-12);
    expect(seed.windMs).toBe(9);
    expect(seed.precipMmH).toBe(2.5); // rounded to the nearest 0.5 slider step
    expect(seed.activityUi).toBe('vogn');
    // initedFromWeather starts true: the screen's OWN useWeather() call must
    // never be allowed to overwrite a seed that already came from Hjem's
    // live weather, even if it later resolves with different numbers.
    expect(seed.initedFromWeather).toBe(true);
  });

  it('rounds tempC/windMs to whole units and precipMmH to the nearest 0.5, matching the slider steps', () => {
    const seed = seedFromPrefill(prefill({ tempC: -11.6, windMs: 4.4, precipMmH: 0.24 }));
    expect(seed.tempC).toBe(-12);
    expect(seed.windMs).toBe(4);
    expect(seed.precipMmH).toBe(0);
  });

  it('maps a non-vogn prefill activity ("utelek") to the "lek" activity radio', () => {
    const seed = seedFromPrefill(prefill({ activity: 'utelek' }));
    expect(seed.activityUi).toBe('lek');
  });
});
