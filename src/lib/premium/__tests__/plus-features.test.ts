import { describe, it, expect } from 'vitest';
import {
  availablePlusExpansions,
  PLUS_FEATURE_AVAILABILITY,
  type PlusFeatureAvailability,
} from '../plus-features';

const flags = (partial?: Partial<PlusFeatureAvailability>): PlusFeatureAvailability => ({
  today_home: true,
  future_plan: false,
  automatic_location: false,
  extra_children: false,
  family_sharing: false,
  personal_calibration: false,
  soon_preparation: false,
  ...partial,
});

describe('availablePlusExpansions', () => {
  it('default: viser kun de leverbare (aldri familie/kalibrering)', () => {
    const keys = availablePlusExpansions().map((e) => e.key);
    expect(keys).toEqual(['future_plan', 'automatic_location', 'extra_children']);
    expect(keys).not.toContain('family_sharing');
    expect(keys).not.toContain('personal_calibration');
  });

  it('familie/kalibrering vises ALDRI så lenge flagget er false', () => {
    // Selv med alt annet på skal de to ubygde forbli skjult.
    const keys = availablePlusExpansions(
      flags({ future_plan: true, automatic_location: true, extra_children: true }),
    ).map((e) => e.key);
    expect(keys).not.toContain('family_sharing');
    expect(keys).not.toContain('personal_calibration');
  });

  it('flagg av → familie/kalibrering dukker opp først når de flippes på', () => {
    const on = availablePlusExpansions(
      flags({ family_sharing: true, personal_calibration: true }),
    ).map((e) => e.key);
    expect(on).toEqual(['family_sharing', 'personal_calibration']);
  });

  it('alt av → ingen ekspansjoner', () => {
    expect(availablePlusExpansions(flags())).toEqual([]);
  });

  it('default-konstanten holder familie/kalibrering av (ikke bygget ennå)', () => {
    expect(PLUS_FEATURE_AVAILABILITY.today_home).toBe(true);
    expect(PLUS_FEATURE_AVAILABILITY.future_plan).toBe(true);
    expect(PLUS_FEATURE_AVAILABILITY.automatic_location).toBe(true);
    expect(PLUS_FEATURE_AVAILABILITY.soon_preparation).toBe(true);
    expect(PLUS_FEATURE_AVAILABILITY.family_sharing).toBe(false);
    expect(PLUS_FEATURE_AVAILABILITY.personal_calibration).toBe(false);
  });

  it('hver ekspansjon har en fra- og til-tekst', () => {
    for (const e of availablePlusExpansions()) {
      expect(e.from.length).toBeGreaterThan(0);
      expect(e.to.length).toBeGreaterThan(0);
    }
  });
});
