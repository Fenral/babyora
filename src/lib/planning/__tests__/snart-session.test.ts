import { describe, expect, it, vi } from 'vitest';
import {
  createSnartSessionEvaluator,
  projectSnartSession,
  resolveCommittedSnartHome,
} from '../snart-session';

const allowedAccess = Object.freeze({
  state: 'allowed' as const,
  allowed: true,
  implementationAvailable: true,
});

const dependencies = () => ({
  resolveExactHome: vi.fn(() => ({ homePlaceKey: 'home-key' })),
  lookupClimateProfile: vi.fn(() => ({
    climateProfileId: 'profile-a',
    profileVersion: 'pack-a',
  })),
  buildModel: vi.fn((input) => Object.freeze({ status: 'ready' as const, input })),
});

const request = (overrides = {}) => ({
  access: allowedAccess,
  generation: 'opaque-a',
  window: '2026-01-01',
  fixedHome: { city: 'Oslo', lat: 59.9139, lon: 10.7522 },
  ageEligibleForWholeWindow: true,
  ...overrides,
});

describe('Snart access-first session boundary', () => {
  it.each([
    { state: 'neutral' as const, allowed: false, implementationAvailable: true },
    { state: 'denied' as const, allowed: false, implementationAvailable: true },
    { state: 'denied' as const, allowed: false, implementationAvailable: false },
    { state: 'allowed' as const, allowed: true, implementationAvailable: false },
  ])('returns before every paid dependency for access %j', (access) => {
    const deps = dependencies();
    expect(projectSnartSession(request({ access }), deps)).toBeNull();
    expect(deps.resolveExactHome).not.toHaveBeenCalled();
    expect(deps.lookupClimateProfile).not.toHaveBeenCalled();
    expect(deps.buildModel).not.toHaveBeenCalled();
  });

  it('resolves exact home before climate and projects only immutable model scalars', () => {
    const deps = dependencies();
    const projection = projectSnartSession(request(), deps);

    expect(deps.resolveExactHome).toHaveBeenCalledTimes(1);
    expect(deps.lookupClimateProfile).toHaveBeenCalledWith('home-key');
    expect(deps.buildModel).not.toHaveBeenCalled();
    expect(projection).toEqual({
      key: 'opaque-a|home-key|profile-a|pack-a|2026-01-01',
      input: {
        asOfLocalDate: '2026-01-01',
        timezone: 'Europe/Oslo',
        homePlaceKey: 'home-key',
        climateProfileId: 'profile-a',
        ageEligibleForWholeWindow: true,
      },
    });
    expect(Object.isFrozen(projection)).toBe(true);
    expect(Object.isFrozen(projection?.input)).toBe(true);
  });

  it('canonicalizes exact committed homes and rejects rounding, invalid or unknown homes', () => {
    expect(resolveCommittedSnartHome({
      city: '  OSLO  ',
      lat: 59.9139,
      lon: 10.7522,
    })).toEqual({
      homePlaceKey: 'no-city:v1:oslo:599139:107522',
    });
    expect(resolveCommittedSnartHome({
      city: 'Oslo',
      lat: 59.91391,
      lon: 10.7522,
    })).toBeNull();
    expect(resolveCommittedSnartHome({
      city: 'Ukjent',
      lat: 59.9139,
      lon: 10.7522,
    })).toBeNull();
    expect(resolveCommittedSnartHome({
      city: 'Oslo',
      lat: Number.NaN,
      lon: 10.7522,
    })).toBeNull();
  });

  it('memoizes once per immutable boundary and resets on generation, profile and window', () => {
    const deps = dependencies();
    const evaluator = createSnartSessionEvaluator(deps);
    evaluator.evaluate(request());
    evaluator.evaluate(request());
    expect(deps.buildModel).toHaveBeenCalledTimes(1);

    evaluator.markAlreadyHave('snart.base_layer');
    expect(deps.buildModel).toHaveBeenCalledTimes(2);
    expect([
      ...(deps.buildModel.mock.calls.at(-1)?.[0].alreadyHaveConceptIds ?? []),
    ]).toEqual(['snart.base_layer']);

    evaluator.evaluate(request({ generation: 'opaque-b' }));
    expect(deps.buildModel).toHaveBeenCalledTimes(3);
    expect([...evaluator.alreadyHaveConceptIds()]).toEqual([]);

    deps.lookupClimateProfile.mockReturnValue({
      climateProfileId: 'profile-b',
      profileVersion: 'pack-b',
    });
    evaluator.evaluate(request({ generation: 'opaque-b' }));
    expect(deps.buildModel).toHaveBeenCalledTimes(4);
    evaluator.evaluate(request({ generation: 'opaque-b', window: '2026-01-02' }));
    expect(deps.buildModel).toHaveBeenCalledTimes(5);
  });

  it('clears cached paid data on denied evaluation and teardown', () => {
    const deps = dependencies();
    const evaluator = createSnartSessionEvaluator(deps);
    evaluator.evaluate(request());
    evaluator.markAlreadyHave('snart.base_layer');

    expect(evaluator.evaluate(request({
      access: { state: 'denied', allowed: false, implementationAvailable: true },
    }))).toBeNull();
    expect([...evaluator.alreadyHaveConceptIds()]).toEqual([]);
    expect(evaluator.current()).toBeNull();

    evaluator.evaluate(request({ generation: 'opaque-b' }));
    evaluator.teardown();
    expect([...evaluator.alreadyHaveConceptIds()]).toEqual([]);
    expect(evaluator.current()).toBeNull();
  });
});
