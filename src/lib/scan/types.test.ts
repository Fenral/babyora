import { describe, expect, it } from 'vitest';
import {
  isScanCacheSlot,
  isScanIdentity,
  localDateKey,
  sameScanIdentity,
  WOOL_LAYERS_ENGINE_VERSION,
} from './types.js';

function identity(overrides: Partial<{
  childId: string;
  dateKey: string;
  placeKey: string;
  activity: 'vogn' | 'baeresele' | 'utelek' | 'soevn';
  engineVersion: string;
}> = {}) {
  return {
    childId: 'barn-01',
    dateKey: '2026-07-30',
    placeKey: 'place:59.91,10.75',
    activity: 'utelek' as const,
    engineVersion: WOOL_LAYERS_ENGINE_VERSION,
    ...overrides,
  };
}

function slot(overrides: Partial<{ scanPlayedInFullToday: boolean }> = {}) {
  return {
    identity: identity(),
    resultKey: 'current-finalized:[]',
    completedAt: 1_753_000_000_000,
    scanPlayedInFullToday: false,
    ...overrides,
  };
}

describe('WOOL_LAYERS_ENGINE_VERSION', () => {
  it('is a non-empty string constant', () => {
    expect(typeof WOOL_LAYERS_ENGINE_VERSION).toBe('string');
    expect(WOOL_LAYERS_ENGINE_VERSION.length).toBeGreaterThan(0);
  });
});

describe('localDateKey', () => {
  it('formats local year-month-day, zero-padded', () => {
    expect(localDateKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(localDateKey(new Date(2026, 11, 31, 0, 0))).toBe('2026-12-31');
  });

  it('uses LOCAL date components, not UTC (guards against a UTC regression)', () => {
    // 2026-01-01T00:30 local time in a UTC-negative-offset-free harness is
    // still 2026-01-01 locally even though the same instant may already be
    // a different UTC date depending on the runner's timezone. Constructing
    // via local Date(...) components (not an ISO string) is what makes this
    // assertion meaningful regardless of the CI timezone.
    const localMidnightish = new Date(2026, 0, 1, 0, 30);
    expect(localDateKey(localMidnightish)).toBe('2026-01-01');
  });

  it('defaults to "now" when called with no argument', () => {
    const before = localDateKey();
    expect(before).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('sameScanIdentity', () => {
  it('is true for structurally identical identities (different object instances)', () => {
    expect(sameScanIdentity(identity(), identity())).toBe(true);
  });

  it('is false when any single field differs', () => {
    expect(sameScanIdentity(identity(), identity({ childId: 'barn-02' }))).toBe(false);
    expect(sameScanIdentity(identity(), identity({ dateKey: '2026-07-31' }))).toBe(false);
    expect(sameScanIdentity(identity(), identity({ placeKey: 'place:60,11' }))).toBe(false);
    expect(sameScanIdentity(identity(), identity({ activity: 'vogn' }))).toBe(false);
    expect(sameScanIdentity(identity(), identity({ engineVersion: '2099-01' }))).toBe(false);
  });
});

describe('isScanIdentity', () => {
  it('accepts a well-formed identity', () => {
    expect(isScanIdentity(identity())).toBe(true);
  });

  it('rejects non-objects', () => {
    expect(isScanIdentity(null)).toBe(false);
    expect(isScanIdentity(undefined)).toBe(false);
    expect(isScanIdentity('barn-01')).toBe(false);
    expect(isScanIdentity(42)).toBe(false);
  });

  it('rejects a malformed dateKey (must be YYYY-MM-DD)', () => {
    expect(isScanIdentity(identity({ dateKey: '2026/07/30' }))).toBe(false);
    expect(isScanIdentity(identity({ dateKey: '30-07-2026' }))).toBe(false);
    expect(isScanIdentity(identity({ dateKey: '' }))).toBe(false);
  });

  it('rejects an unknown activity literal', () => {
    expect(isScanIdentity({ ...identity(), activity: 'sover' })).toBe(false);
  });

  it('rejects empty childId, placeKey or engineVersion', () => {
    expect(isScanIdentity(identity({ childId: '' }))).toBe(false);
    expect(isScanIdentity(identity({ placeKey: '' }))).toBe(false);
    expect(isScanIdentity(identity({ engineVersion: '' }))).toBe(false);
  });

  it('rejects a value missing required fields', () => {
    const { activity: _activity, ...withoutActivity } = identity();
    expect(isScanIdentity(withoutActivity)).toBe(false);
  });
});

describe('isScanCacheSlot', () => {
  it('accepts a well-formed slot', () => {
    expect(isScanCacheSlot(slot())).toBe(true);
  });

  it('rejects non-objects', () => {
    expect(isScanCacheSlot(null)).toBe(false);
    expect(isScanCacheSlot('slot')).toBe(false);
  });

  it('rejects a slot with an invalid identity', () => {
    expect(isScanCacheSlot({ ...slot(), identity: { childId: 'barn-01' } })).toBe(false);
  });

  it('rejects a non-string/empty resultKey', () => {
    expect(isScanCacheSlot({ ...slot(), resultKey: '' })).toBe(false);
    expect(isScanCacheSlot({ ...slot(), resultKey: 123 })).toBe(false);
  });

  it('rejects a non-finite completedAt', () => {
    expect(isScanCacheSlot({ ...slot(), completedAt: Number.NaN })).toBe(false);
    expect(isScanCacheSlot({ ...slot(), completedAt: '1753000000000' })).toBe(false);
  });

  it('rejects a non-boolean scanPlayedInFullToday', () => {
    expect(isScanCacheSlot({ ...slot(), scanPlayedInFullToday: 'yes' })).toBe(false);
  });
});
