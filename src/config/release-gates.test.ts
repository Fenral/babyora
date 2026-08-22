import { describe, expect, it } from 'vitest';
import {
  RELEASE_COUNTRIES,
  RELEASE_GATES,
  isReleaseCountry,
  resolveReleaseGate,
} from './release-gates';

describe('country release gates', () => {
  it('keeps Norway independently production-approved', () => {
    expect(resolveReleaseGate({ country: 'NO', selectedLocale: 'no' })).toEqual({
      country: 'NO',
      availability: 'production',
      translation: 'release-ready',
      safetyReview: 'approved',
      publicRelease: true,
      controlledPilot: false,
    });
  });

  it.each(['SE', 'DK'] as const)('keeps %s pilot-only pending country review', (country) => {
    expect(resolveReleaseGate({ country, selectedLocale: country === 'SE' ? 'sv' : 'da' })).toEqual({
      country,
      availability: 'pilot',
      translation: 'pilot',
      safetyReview: 'pending',
      publicRelease: false,
      controlledPilot: true,
    });
  });

  it.each(['no', 'sv', 'da', 'en', 'de'])('does not let locale %s change Norway release status', (selectedLocale) => {
    expect(resolveReleaseGate({ country: 'NO', selectedLocale })).toEqual(RELEASE_GATES.NO);
  });

  it.each(['no', 'sv', 'da'])('does not mistake locale-looking country %s for a release country', (country) => {
    expect(resolveReleaseGate({ country, selectedLocale: country })).toEqual({
      country: null,
      availability: 'unavailable',
      translation: 'unavailable',
      safetyReview: 'unreviewed',
      publicRelease: false,
      controlledPilot: false,
    });
  });

  it.each(['US', 'FI', '', null, undefined, 0, {}, []])('defaults unknown country input %j to unavailable', (country) => {
    const decision = resolveReleaseGate({ country, selectedLocale: 'no' });

    expect(decision.availability).toBe('unavailable');
    expect(decision.publicRelease).toBe(false);
    expect(decision.controlledPilot).toBe(false);
    expect(decision.country).toBeNull();
  });

  it('has an exhaustive, duplicate-free gate for every supported release country', () => {
    expect(RELEASE_COUNTRIES).toEqual(['NO', 'SE', 'DK']);
    expect(new Set(RELEASE_COUNTRIES).size).toBe(RELEASE_COUNTRIES.length);
    expect(Object.keys(RELEASE_GATES)).toEqual(RELEASE_COUNTRIES);
  });

  it('recognizes only canonical uppercase country codes', () => {
    expect(isReleaseCountry('NO')).toBe(true);
    expect(isReleaseCountry('SE')).toBe(true);
    expect(isReleaseCountry('DK')).toBe(true);
    expect(isReleaseCountry('no')).toBe(false);
    expect(isReleaseCountry('No')).toBe(false);
    expect(isReleaseCountry('Se')).toBe(false);
    expect(isReleaseCountry('Dk')).toBe(false);
    expect(isReleaseCountry('US')).toBe(false);
    expect(isReleaseCountry(null)).toBe(false);
  });
});
