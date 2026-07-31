import { beforeEach, describe, expect, it } from 'vitest';
import type { ScanCacheSlot, ScanIdentity } from '../../lib/scan/types.js';
import {
  getSlotForIdentity,
  markScanPlayed,
  mergeScanCache,
  partializeScanCache,
  shouldPlayFullScan,
  useScanCache,
} from '../scan-cache-store.js';

const IDENTITY: ScanIdentity = Object.freeze({
  childId: 'barn-01',
  dateKey: '2026-07-30',
  placeKey: 'place:59.91,10.75',
  activity: 'utelek',
  engineVersion: '2026-07',
});

function slot(overrides: Partial<ScanCacheSlot> = {}): ScanCacheSlot {
  return Object.freeze({
    identity: IDENTITY,
    resultKey: 'current-finalized:["a"]',
    completedAt: 1_753_000_000_000,
    scanPlayedInFullToday: false,
    ...overrides,
  });
}

describe('useScanCache store actions', () => {
  beforeEach(() => {
    useScanCache.setState({ slots: {} });
  });

  it('commitSlot stores the slot keyed by identity.childId', () => {
    useScanCache.getState().commitSlot(slot());
    expect(useScanCache.getState().slots).toEqual({ 'barn-01': slot() });
  });

  it('commitSlot overwrites any existing slot for the same child', () => {
    useScanCache.getState().commitSlot(slot({ resultKey: 'current-finalized:["a"]' }));
    useScanCache.getState().commitSlot(slot({ resultKey: 'current-finalized:["b"]' }));
    expect(useScanCache.getState().slots['barn-01']?.resultKey).toBe(
      'current-finalized:["b"]',
    );
    expect(Object.keys(useScanCache.getState().slots)).toEqual(['barn-01']);
  });

  it('commitSlot keeps other children’s slots untouched', () => {
    const otherIdentity: ScanIdentity = { ...IDENTITY, childId: 'barn-02' };
    useScanCache.getState().commitSlot(slot());
    useScanCache.getState().commitSlot(slot({ identity: otherIdentity }));
    expect(Object.keys(useScanCache.getState().slots).sort()).toEqual([
      'barn-01',
      'barn-02',
    ]);
  });

  it('markScanPlayed flips scanPlayedInFullToday for an existing slot', () => {
    useScanCache.getState().commitSlot(slot({ scanPlayedInFullToday: false }));
    useScanCache.getState().markScanPlayed('barn-01');
    expect(useScanCache.getState().slots['barn-01']?.scanPlayedInFullToday).toBe(true);
  });

  it('markScanPlayed is a no-op when there is no slot for the child', () => {
    useScanCache.getState().markScanPlayed('unknown-child');
    expect(useScanCache.getState().slots).toEqual({});
  });

  it('markScanPlayed is a no-op (same store reference) when already true', () => {
    useScanCache.getState().commitSlot(slot({ scanPlayedInFullToday: true }));
    const before = useScanCache.getState().slots;
    useScanCache.getState().markScanPlayed('barn-01');
    expect(useScanCache.getState().slots).toBe(before);
  });

  it('clearSlotForChild removes only the targeted child', () => {
    const otherIdentity: ScanIdentity = { ...IDENTITY, childId: 'barn-02' };
    useScanCache.getState().commitSlot(slot());
    useScanCache.getState().commitSlot(slot({ identity: otherIdentity }));
    useScanCache.getState().clearSlotForChild('barn-01');
    expect(Object.keys(useScanCache.getState().slots)).toEqual(['barn-02']);
  });

  it('clearSlotForChild is a no-op when the child has no slot', () => {
    useScanCache.getState().commitSlot(slot());
    const before = useScanCache.getState().slots;
    useScanCache.getState().clearSlotForChild('unknown-child');
    expect(useScanCache.getState().slots).toBe(before);
  });

  it('clearAll empties every slot', () => {
    const otherIdentity: ScanIdentity = { ...IDENTITY, childId: 'barn-02' };
    useScanCache.getState().commitSlot(slot());
    useScanCache.getState().commitSlot(slot({ identity: otherIdentity }));
    useScanCache.getState().clearAll();
    expect(useScanCache.getState().slots).toEqual({});
  });
});

describe('markScanPlayed (pure helper)', () => {
  it('returns a new slot with scanPlayedInFullToday flipped to true', () => {
    const original = slot({ scanPlayedInFullToday: false });
    const next = markScanPlayed(original);
    expect(next).not.toBe(original);
    expect(next).toEqual({ ...original, scanPlayedInFullToday: true });
  });

  it('is idempotent — returns the SAME reference when already true', () => {
    const original = slot({ scanPlayedInFullToday: true });
    expect(markScanPlayed(original)).toBe(original);
  });
});

describe('getSlotForIdentity', () => {
  it('returns the slot on an exact identity match', () => {
    const slots = { 'barn-01': slot() };
    expect(getSlotForIdentity(slots, IDENTITY)).toEqual(slot());
  });

  it('returns null when there is no slot at all for the child', () => {
    expect(getSlotForIdentity({}, IDENTITY)).toBeNull();
  });

  it.each([
    ['childId', { childId: 'barn-99' }],
    ['dateKey (date rollover)', { dateKey: '2026-07-31' }],
    ['placeKey', { placeKey: 'place:60.0,11.0' }],
    ['activity', { activity: 'vogn' as const }],
    ['engineVersion (engine bump)', { engineVersion: '2099-01' }],
  ])('returns null when %s differs from the cached slot’s identity', (_label, patch) => {
    const cachedSlot = slot();
    const slots = { 'barn-01': cachedSlot };
    const queryIdentity: ScanIdentity = { ...IDENTITY, ...patch };
    // childId is the lookup key itself — when it differs, the store simply
    // has nothing filed under that key, which is the same "no match" outcome.
    expect(getSlotForIdentity(slots, queryIdentity)).toBeNull();
  });
});

describe('shouldPlayFullScan', () => {
  it('is true when there is no cached slot', () => {
    expect(shouldPlayFullScan(null, IDENTITY)).toBe(true);
  });

  it('is true when the cached slot is from a previous date (rollover)', () => {
    const yesterday = slot({ identity: { ...IDENTITY, dateKey: '2026-07-29' } });
    expect(shouldPlayFullScan(yesterday, IDENTITY)).toBe(true);
  });

  it('is false when the cached slot is from the same date, even if other identity fields differ', () => {
    const sameDayDifferentActivity = slot({
      identity: { ...IDENTITY, activity: 'vogn' },
    });
    expect(shouldPlayFullScan(sameDayDifferentActivity, IDENTITY)).toBe(false);
  });

  it('is false when the cached slot exactly matches today', () => {
    expect(shouldPlayFullScan(slot(), IDENTITY)).toBe(false);
  });
});

describe('partializeScanCache / mergeScanCache — persistence roundtrip', () => {
  beforeEach(() => {
    useScanCache.setState({ slots: {} });
  });

  it('partializeScanCache exposes exactly {slots}', () => {
    useScanCache.getState().commitSlot(slot());
    expect(partializeScanCache(useScanCache.getState())).toEqual({
      slots: { 'barn-01': slot() },
    });
  });

  it('round-trips through JSON.stringify/JSON.parse and mergeScanCache with the slot intact', () => {
    useScanCache.getState().commitSlot(slot());
    const otherIdentity: ScanIdentity = { ...IDENTITY, childId: 'barn-02' };
    useScanCache.getState().commitSlot(slot({
      identity: otherIdentity,
      resultKey: 'current-finalized:["b"]',
      scanPlayedInFullToday: true,
    }));

    const persisted = partializeScanCache(useScanCache.getState());
    const serialized = JSON.stringify(persisted);
    const rehydratedJson: unknown = JSON.parse(serialized);

    const freshState = { ...useScanCache.getState(), slots: {} };
    const merged = mergeScanCache(rehydratedJson, freshState);

    expect(merged.slots).toEqual(persisted.slots);
    expect(merged.slots['barn-01']).toEqual(slot());
    expect(merged.slots['barn-02']).toEqual(slot({
      identity: otherIdentity,
      resultKey: 'current-finalized:["b"]',
      scanPlayedInFullToday: true,
    }));
  });

  it('falls back to the current slots when persisted data is not an object', () => {
    const current = { ...useScanCache.getState(), slots: { 'barn-01': slot() } };
    expect(mergeScanCache(null, current).slots).toBe(current.slots);
    expect(mergeScanCache('garbage', current).slots).toBe(current.slots);
    expect(mergeScanCache(undefined, current).slots).toBe(current.slots);
  });

  it('falls back to the current slots when the persisted "slots" field is missing or malformed', () => {
    const current = { ...useScanCache.getState(), slots: { 'barn-01': slot() } };
    expect(mergeScanCache({}, current).slots).toBe(current.slots);
    expect(mergeScanCache({ slots: null }, current).slots).toBe(current.slots);
    expect(mergeScanCache({ slots: 'nope' }, current).slots).toBe(current.slots);
  });

  it('rejects the WHOLE persisted slots record if even one entry is corrupt (fails closed)', () => {
    const current = { ...useScanCache.getState(), slots: { 'barn-01': slot() } };
    const corrupted = {
      slots: {
        'barn-01': slot(),
        'barn-02': { identity: IDENTITY }, // missing resultKey/completedAt/scanPlayedInFullToday
      },
    };
    expect(mergeScanCache(corrupted, current).slots).toBe(current.slots);
  });

  it('rejects an entry whose key does not match its own identity.childId (anti-tamper)', () => {
    const current = { ...useScanCache.getState(), slots: {} };
    const mismatched = {
      slots: {
        'barn-99': slot(), // slot().identity.childId === 'barn-01', key says barn-99
      },
    };
    expect(mergeScanCache(mismatched, current).slots).toBe(current.slots);
  });
});
