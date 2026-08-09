import { describe, expect, it } from 'vitest';
import { buildTogGuideRecommendation } from '../tog-recommendation.js';
import { recommend } from '../recommend.js';

describe('TOG guide uses the active engine as its only decision table', () => {
  it.each([16, 17, 18, 19, 20, 21, 22, 23, 24])(
    '%i °C mirrors the canonical sleep recommendation exactly',
    (roomTempC) => {
      const guide = buildTogGuideRecommendation({
        roomTempC,
        ageMonths: 8,
        materialPreference: 'best_for_conditions',
      });
      const direct = recommend({
        weather: {
          tempC: roomTempC,
          feelsLikeC: roomTempC,
          windMs: 0,
          precipMmH: 0,
        },
        child: { ageMonths: 8 },
        activity: 'soevn',
        materialPreference: 'best_for_conditions',
      });

      expect(guide.recommendation).toEqual(direct);
      expect(guide.layers.map((layer) => layer.dbString)).toEqual(
        direct.layers.flatMap((layer) => layer.items),
      );
    },
  );

  it('locks the two temperatures where the retired screen-local table contradicted the engine', () => {
    expect(buildTogGuideRecommendation({ roomTempC: 16, ageMonths: 8 }).tog).toBe('2.5');
    expect(buildTogGuideRecommendation({ roomTempC: 21, ageMonths: 8 }).tog).toBe('1.0');
  });

  it('passes the child material preference into the canonical engine', () => {
    const guide = buildTogGuideRecommendation({
      roomTempC: 20,
      ageMonths: 10,
      materialPreference: 'prefer_cotton',
    });
    expect(guide.recommendation).toEqual(recommend({
      weather: { tempC: 20, feelsLikeC: 20, windMs: 0, precipMmH: 0 },
      child: { ageMonths: 10 },
      activity: 'soevn',
      materialPreference: 'prefer_cotton',
    }));
  });
});
