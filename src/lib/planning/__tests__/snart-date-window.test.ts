import { describe, expect, it } from 'vitest';
import { buildSnartDateWindow, isAgeEligibleForWholeWindow } from '../snart-date-window';

describe('Snart date window', () => {
  it('uses fifteen inclusive ISO calendar dates across DST', () => {
    const window = buildSnartDateWindow('2026-03-01', 'Europe/Oslo');
    expect(window.status).toBe('available');
    if (window.status === 'available') {
      expect(window.dates).toHaveLength(15);
      expect(window.dates[0]).toBe('2026-03-29');
      expect(window.dates[14]).toBe('2026-04-12');
      expect(new Set(window.dates).size).toBe(15);
    }
  });

  it('fails closed for malformed dates or a non-Oslo timezone', () => {
    expect(buildSnartDateWindow('2026-02-30', 'Europe/Oslo').status).toBe('unavailable');
    expect(buildSnartDateWindow('2026-03-01', 'UTC').status).toBe('unavailable');
  });

  it('requires the target end to precede the clamped 25-month birthday', () => {
    expect(isAgeEligibleForWholeWindow('2024-01-31', '2026-02-27')).toBe(true);
    expect(isAgeEligibleForWholeWindow('2024-01-31', '2026-02-28')).toBe(false);
    expect(isAgeEligibleForWholeWindow('2024-02-29', '2026-03-28')).toBe(true);
  });
});
