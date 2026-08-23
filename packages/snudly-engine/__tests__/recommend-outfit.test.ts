import { describe, expect, it } from 'vitest';
import { recommendOutfit } from '../index';

describe('Snudly engine seam', () => {
  it('returns a stable UI-safe outfit without leaking legacy layer objects', () => {
    const result = recommendOutfit({
      childAgeMonths: 10,
      situation: 'outdoor-play',
      weather: {
        temperatureC: 7,
        feelsLikeC: 6,
        windMetersPerSecond: 3,
        precipitationMillimetersPerHour: 0.4,
        symbolCode: 'partlycloudy_day',
      },
    });

    expect(result.garments.length).toBeGreaterThan(0);
    expect(result.garments.every((garment) => garment.id && garment.name && garment.role)).toBe(true);
    expect(result).not.toHaveProperty('layers');
    expect(result).not.toHaveProperty('structuredNotes');
    expect(result.engine).toBe('snudly-engine-v1');
  });

  it('is deterministic for the same input', () => {
    const input = {
      childAgeMonths: 10,
      situation: 'stroller' as const,
      weather: {
        temperatureC: -2,
        feelsLikeC: -6,
        windMetersPerSecond: 4,
        precipitationMillimetersPerHour: 0,
        symbolCode: 'cloudy',
      },
    };

    expect(recommendOutfit(input)).toEqual(recommendOutfit(input));
  });
});
