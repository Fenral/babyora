import { describe, expect, it } from 'vitest';
import { buildSnartPlan } from '../snart';

describe('Snart plan model', () => {
  const input = { asOfLocalDate: '2026-01-01', timezone: 'Europe/Oslo' as const, homePlaceKey: 'no-city:v1:oslo:599139:107522', climateProfileId: 'snart-profile:v2:no-city:v1:oslo:599139:107522', ageEligibleForWholeWindow: true, alreadyHaveConceptIds: new Set<string>() };

  it('returns a traceable deterministic ready result', () => {
    const result = buildSnartPlan(input);
    expect(result.status).toBe('ready');
    expect(JSON.stringify(result)).toBe(JSON.stringify(buildSnartPlan(input)));
  });

  it('fails closed without advice for invalid model input', () => {
    const result = buildSnartPlan({ ...input, ageEligibleForWholeWindow: false });
    expect(result).toMatchObject({ status: 'unavailable' });
    expect(JSON.stringify(result)).not.toContain('snart.');
  });

  it('only filters actionable rows already marked in memory', () => {
    const result = buildSnartPlan({ ...input, alreadyHaveConceptIds: new Set(['snart.base_layer']) });
    expect(result.status).toBe('ready');
    if (result.status === 'ready') expect(result.items.some((item) => item.conceptId === 'snart.base_layer')).toBe(false);
  });
});
