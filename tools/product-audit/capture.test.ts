import { describe, expect, it } from 'vitest';
import { assertReadOnlyAction, buildCapturePlan, buildForecastFixture } from './capture';

describe('capture plan', () => {
  it('covers all page families', () => {
    expect(new Set(buildCapturePlan().map((item) => item.pageId)).size).toBe(13);
  });

  it('blocks dangerous actions', () => {
    expect(() => assertReadOnlyAction('confirm-purchase')).toThrow(/read-only/i);
    expect(() => assertReadOnlyAction('delete-child')).toThrow(/read-only/i);
  });

  it('allows capture navigation', () => {
    expect(() => assertReadOnlyAction('tab')).not.toThrow();
    expect(() => assertReadOnlyAction('text')).not.toThrow();
  });

  it('builds deterministic local weather instead of loading the Vercel function through Vite', () => {
    const fixture = buildForecastFixture(new Date('2026-01-15T06:00:00.000Z'));
    expect(fixture.properties.timeseries).toHaveLength(72);
    expect(fixture.properties.timeseries[0]?.data.instant.details.air_temperature).toBe(-4);
  });
});
