import { describe, expect, it } from 'vitest';
import { resolveHomeAtmosphere } from '../home-atmosphere.js';

describe('resolveHomeAtmosphere', () => {
  it('uses perceived temperature for the palette while actual temperature controls intensity', () => {
    const cold = resolveHomeAtmosphere({
      tempC: 5,
      feelsLikeC: -4,
      symbolCode: 'cloudy_day',
    });
    const warm = resolveHomeAtmosphere({
      tempC: 26,
      feelsLikeC: 22,
      symbolCode: 'clearsky_day',
    });
    const mild = resolveHomeAtmosphere({
      tempC: 12,
      feelsLikeC: 12,
      symbolCode: 'cloudy_day',
    });

    expect(cold.palette).toBe('cold');
    expect(cold.intensity).toBe('present');
    expect(warm.palette).toBe('warm');
    expect(warm.intensity).toBe('deep');
    expect(mild.palette).toBe('mild');
    expect(mild.intensity).toBe('quiet');
  });

  it.each([
    ['clearsky_day', 'day'],
    ['clearsky_night', 'night'],
    ['clearsky_polartwilight', 'polar-twilight'],
    ['clearsky', 'neutral'],
    ['clearsky_dawn', 'neutral'],
  ] as const)('maps the explicit provider suffix in %s to %s', (symbolCode, lighting) => {
    expect(resolveHomeAtmosphere({ tempC: 8, feelsLikeC: 8, symbolCode }).lighting).toBe(lighting);
  });

  it.each([
    ['rain_day', 'rain'],
    ['snow_night', 'snow'],
    ['cloudy_day', 'cloud'],
    ['clearsky_day', 'sun'],
    ['fog_day', 'fog'],
    ['heavyrainandthunder_day', 'storm'],
    ['provider_future_symbol_day', 'unknown'],
  ] as const)('normalizes %s deterministically to %s', (symbolCode, condition) => {
    const first = resolveHomeAtmosphere({ tempC: 8, feelsLikeC: 8, symbolCode });
    const second = resolveHomeAtmosphere({ tempC: 8, feelsLikeC: 8, symbolCode });

    expect(first.condition).toBe(condition);
    expect(second).toEqual(first);
  });

  it('keeps actual temperature separate from a colder perceived-temperature palette', () => {
    const temperateActual = resolveHomeAtmosphere({
      tempC: 8,
      feelsLikeC: -12,
      symbolCode: 'snow_day',
    });
    const extremeActual = resolveHomeAtmosphere({
      tempC: -20,
      feelsLikeC: -12,
      symbolCode: 'snow_day',
    });

    expect(temperateActual.palette).toBe('cold');
    expect(extremeActual.palette).toBe('cold');
    expect(temperateActual.intensity).toBe('quiet');
    expect(extremeActual.intensity).toBe('deep');
  });

  it('emits exactly two or three serializable layer descriptors', () => {
    const neutral = resolveHomeAtmosphere({
      tempC: 10,
      feelsLikeC: 10,
      symbolCode: 'provider_future_symbol',
    });
    const daylight = resolveHomeAtmosphere({
      tempC: 10,
      feelsLikeC: 10,
      symbolCode: 'rain_night',
    });

    expect(neutral.layers).toEqual([
      { kind: 'wash', variant: 'mild' },
      { kind: 'condition', variant: 'unknown' },
    ]);
    expect(daylight.layers).toEqual([
      { kind: 'wash', variant: 'mild' },
      { kind: 'condition', variant: 'rain' },
      { kind: 'lighting', variant: 'night' },
    ]);
    expect(() => JSON.stringify(daylight)).not.toThrow();
  });

  it.each([
    undefined,
    null,
    {},
    { tempC: Number.NaN, feelsLikeC: Number.POSITIVE_INFINITY, symbolCode: 42 },
    { tempC: 'cold', feelsLikeC: [], symbolCode: { code: 'snow_day' } },
  ])('falls back to a neutral readable atmosphere for malformed input %#', (input) => {
    expect(() => resolveHomeAtmosphere(input as never)).not.toThrow();
    expect(resolveHomeAtmosphere(input as never)).toEqual({
      palette: 'mild',
      lighting: 'neutral',
      condition: 'unknown',
      intensity: 'quiet',
      layers: [
        { kind: 'wash', variant: 'mild' },
        { kind: 'condition', variant: 'unknown' },
      ],
    });
  });
});
