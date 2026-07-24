import { describe, expect, it, vi } from 'vitest';
import { createSnartSessionEvaluator, projectSnartSession } from '../snart-session';

const dependencies = () => ({
  resolveExactHome: vi.fn(() => ({ homePlaceKey: 'home', climateProfileId: 'profile' })),
  buildModel: vi.fn((input) => ({ status: 'ready' as const, input })),
});
const request = (overrides = {}) => ({
  allowed: true, generation: 'session-a', profileVersion: 'v1', window: '2026-01-01',
  home: { city: 'Oslo', lat: 59.9, lon: 10.7 }, ageEligibleForWholeWindow: true,
  ...overrides,
});

describe('Snart session boundary', () => {
  it('returns before home resolution and model building unless access is allowed', () => {
    const deps = dependencies();
    expect(projectSnartSession(request({ allowed: false }), deps)).toBeNull();
    expect(deps.resolveExactHome).not.toHaveBeenCalled();
    expect(deps.buildModel).not.toHaveBeenCalled();
  });

  it('memoizes only minimal immutable boundary inputs and resets marks on generation changes', () => {
    const deps = dependencies(); const evaluator = createSnartSessionEvaluator(deps);
    evaluator.evaluate(request()); evaluator.evaluate(request());
    expect(deps.buildModel).toHaveBeenCalledTimes(1);
    evaluator.markAlreadyHave('snart.base_layer');
    expect(deps.buildModel).toHaveBeenCalledTimes(2);
    evaluator.evaluate(request({ generation: 'session-b' }));
    expect(deps.buildModel).toHaveBeenCalledTimes(3);
    expect([...evaluator.alreadyHaveConceptIds()]).toEqual([]);
    evaluator.teardown();
    expect([...evaluator.alreadyHaveConceptIds()]).toEqual([]);
  });
});
