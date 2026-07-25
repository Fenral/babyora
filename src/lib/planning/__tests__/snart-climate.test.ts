import { describe, expect, it } from 'vitest';
import pack from '../../../data/snart/climate-1991-2020-v1.json';
import manifest from '../../../data/snart/climate-1991-2020-v1.manifest.json';
import { decodeSnartClimatePack, deriveSnartTargetWindowSignals, resolveSnartClimateProfile } from '../snart-climate';

describe('Snart climate runtime', () => {
  const decode = (candidatePack: unknown = pack, candidateManifest: unknown = manifest) =>
    decodeSnartClimatePack(candidatePack, candidateManifest);

  const osloProfile = () =>
    resolveSnartClimateProfile({
      homePlaceKey: 'no-city:v1:oslo:599139:107522',
      climateProfileId: 'snart-profile:v2:no-city:v1:oslo:599139:107522',
    });

  it('accepts only the committed exact pack and exact profile tuple', () => {
    const decoded = decode();
    expect(decoded.status).toBe('available');
    const profile = osloProfile();
    expect(profile.status).toBe('available');
    expect(resolveSnartClimateProfile({ homePlaceKey: 'no-city:v1:oslo:599139:107523', climateProfileId: 'snart-profile:v2:no-city:v1:oslo:599139:107522' }).status).toBe('unavailable');
  });

  it('rejects schema drift and derives monthly-weighted target signals', () => {
    expect(decode({ ...pack, schemaVersion: 'wrong' }).status).toBe('unavailable');
    const profile = osloProfile();
    if (profile.status === 'available') {
      const signals = deriveSnartTargetWindowSignals(profile.profile, Array.from({ length: 15 }, (_, index) => `2024-02-${String(index + 1).padStart(2, '0')}`));
      expect(signals.status).toBe('available');
    }
  });

  it('rejects every missing or extra top-level pack field', () => {
    for (const key of Object.keys(pack)) {
      const candidate = structuredClone(pack) as Record<string, unknown>;
      delete candidate[key];
      expect(decode(candidate).status, `missing pack.${key}`).toBe('unavailable');
    }

    expect(decode({ ...pack, unexpectedDailyValue: true }).status).toBe('unavailable');
  });

  it('rejects every missing or extra top-level manifest field and a bad manifest schema', () => {
    for (const key of Object.keys(manifest)) {
      const candidate = structuredClone(manifest) as Record<string, unknown>;
      delete candidate[key];
      expect(decode(pack, candidate).status, `missing manifest.${key}`).toBe('unavailable');
    }

    expect(decode(pack, { ...manifest, unexpectedWetDays: [] }).status).toBe('unavailable');
    expect(decode(pack, { ...manifest, schemaVersion: 'wrong' }).status).toBe('unavailable');
  });

  it('requires exactly fifteen unique valid ISO calendar dates', () => {
    const profile = osloProfile();
    expect(profile.status).toBe('available');
    if (profile.status !== 'available') return;

    const validDates = Array.from(
      { length: 15 },
      (_, index) => `2024-02-${String(index + 1).padStart(2, '0')}`,
    );
    const duplicateDates = [...validDates.slice(0, 14), validDates[0]];
    const invalidCalendarDates = [...validDates.slice(0, 14), '2024-02-30'];

    expect(deriveSnartTargetWindowSignals(profile.profile, validDates.slice(0, 14)).status).toBe('unavailable');
    expect(deriveSnartTargetWindowSignals(profile.profile, [...validDates, '2024-02-16']).status).toBe('unavailable');
    expect(deriveSnartTargetWindowSignals(profile.profile, duplicateDates).status).toBe('unavailable');
    expect(deriveSnartTargetWindowSignals(profile.profile, invalidCalendarDates).status).toBe('unavailable');
    expect(deriveSnartTargetWindowSignals(profile.profile, [...validDates.slice(0, 14), '2024-2-15']).status).toBe('unavailable');
  });

  it('binds exact committed monthly values rather than trusting declared hashes', () => {
    const temperatureMutation = structuredClone(pack);
    const temperatureProfile = Object.values(temperatureMutation.profiles)[0];
    temperatureProfile.months[0].meanTemperatureC += 0.001;

    const precipitationMutation = structuredClone(pack);
    const precipitationProfile = Object.values(precipitationMutation.profiles)[0];
    precipitationProfile.months[0].monthlyPrecipitationMm += 0.001;

    expect(decode(temperatureMutation).status).toBe('unavailable');
    expect(decode(precipitationMutation).status).toBe('unavailable');
  });

  it('binds exact committed manifest values including attribution and builder identity', () => {
    expect(decode(pack, { ...manifest, sourceAttribution: `${manifest.sourceAttribution} changed` }).status).toBe('unavailable');
    expect(decode(pack, { ...manifest, builderSha256: '0'.repeat(64) }).status).toBe('unavailable');
  });

  it('rejects generalized nested scalar and non-JSON property mutations', () => {
    const nestedMutations: Array<[string, () => unknown, () => unknown]> = [
      [
        'pack grid latitude',
        () => {
          const candidate = structuredClone(pack);
          Object.values(candidate.profiles)[0].grid.lat += 0.001;
          return candidate;
        },
        () => manifest,
      ],
      [
        'manifest catalog URL',
        () => pack,
        () => {
          const candidate = structuredClone(manifest);
          candidate.sourceCatalogUrls.tg = `${candidate.sourceCatalogUrls.tg}?changed`;
          return candidate;
        },
      ],
      [
        'manifest response digest',
        () => pack,
        () => {
          const candidate = structuredClone(manifest);
          candidate.sourceDatasets[0].responseSha256[0].sha256 = '0'.repeat(64);
          return candidate;
        },
      ],
      [
        'manifest binding name',
        () => pack,
        () => {
          const candidate = structuredClone(manifest);
          candidate.placeGridBindings[0].nameNfc = `${candidate.placeGridBindings[0].nameNfc} changed`;
          return candidate;
        },
      ],
    ];

    for (const [label, candidatePack, candidateManifest] of nestedMutations) {
      expect(decode(candidatePack(), candidateManifest()).status, label).toBe('unavailable');
    }

    const symbolExtra = structuredClone(pack) as typeof pack & { [key: symbol]: boolean };
    symbolExtra[Symbol('unexpected')] = true;
    expect(decode(symbolExtra).status).toBe('unavailable');

    const hiddenExtra = structuredClone(manifest);
    Object.defineProperty(hiddenExtra, 'unexpectedHiddenValue', { value: true });
    expect(decode(pack, hiddenExtra).status).toBe('unavailable');
  });

  it('compares object fields structurally without depending on property insertion order', () => {
    const reverseObjectKeys = (value: unknown): unknown => {
      if (Array.isArray(value)) return value.map(reverseObjectKeys);
      if (value && typeof value === 'object') {
        return Object.fromEntries(
          Object.entries(value)
            .reverse()
            .map(([key, child]) => [key, reverseObjectKeys(child)]),
        );
      }
      return value;
    };

    expect(decode(reverseObjectKeys(pack), reverseObjectKeys(manifest)).status).toBe('available');
  });
});
