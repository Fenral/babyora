import { beforeEach, describe, expect, it } from 'vitest';
import type { ScanCacheSlot, ScanIdentity } from '../../lib/scan/types.js';
import {
  deriveHasPlayedFullScanEver,
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
    useScanCache.setState({ slots: {}, hasPlayedFullScanEver: false });
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

  it('markFullScanPlayedEver flips hasPlayedFullScanEver to true', () => {
    expect(useScanCache.getState().hasPlayedFullScanEver).toBe(false);
    useScanCache.getState().markFullScanPlayedEver();
    expect(useScanCache.getState().hasPlayedFullScanEver).toBe(true);
  });

  it('markFullScanPlayedEver is idempotent (no-op once already true)', () => {
    useScanCache.getState().markFullScanPlayedEver();
    const before = useScanCache.getState();
    useScanCache.getState().markFullScanPlayedEver();
    expect(useScanCache.getState()).toBe(before);
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

describe('shouldPlayFullScan (P9 duel §2 — lifetime, not per-day)', () => {
  it('is true when the full choreography has never played on this device', () => {
    expect(shouldPlayFullScan(false)).toBe(true);
  });

  it('is false once the full choreography has played, regardless of anything else (e.g. date rollover)', () => {
    expect(shouldPlayFullScan(true)).toBe(false);
  });
});

describe('deriveHasPlayedFullScanEver (pre-P9 → P9 migration)', () => {
  it('trusts an explicit persisted hasPlayedFullScanEver boolean over any slot inference', () => {
    expect(deriveHasPlayedFullScanEver({ hasPlayedFullScanEver: true }, {})).toBe(true);
    expect(deriveHasPlayedFullScanEver(
      { hasPlayedFullScanEver: false },
      { 'barn-01': slot({ scanPlayedInFullToday: true }) },
    )).toBe(false);
  });

  it('legacy data (no explicit field): derives true when ANY slot already completed a full daily choreography', () => {
    expect(deriveHasPlayedFullScanEver(null, { 'barn-01': slot({ scanPlayedInFullToday: true }) })).toBe(true);
    expect(deriveHasPlayedFullScanEver({}, { 'barn-01': slot({ scanPlayedInFullToday: true }) })).toBe(true);
  });

  it('legacy data: derives false when no slot ever completed a full daily choreography (or there are no slots)', () => {
    expect(deriveHasPlayedFullScanEver(null, {})).toBe(false);
    expect(deriveHasPlayedFullScanEver({}, { 'barn-01': slot({ scanPlayedInFullToday: false }) })).toBe(false);
  });
});

describe('partializeScanCache / mergeScanCache — persistence roundtrip', () => {
  beforeEach(() => {
    useScanCache.setState({ slots: {}, hasPlayedFullScanEver: false });
  });

  it('partializeScanCache exposes exactly {slots, hasPlayedFullScanEver}', () => {
    useScanCache.getState().commitSlot(slot());
    useScanCache.getState().markFullScanPlayedEver();
    expect(partializeScanCache(useScanCache.getState())).toEqual({
      slots: { 'barn-01': slot() },
      hasPlayedFullScanEver: true,
    });
  });

  it('round-trips through JSON.stringify/JSON.parse and mergeScanCache with the slot AND the lifetime flag intact', () => {
    useScanCache.getState().commitSlot(slot());
    useScanCache.getState().markFullScanPlayedEver();
    const otherIdentity: ScanIdentity = { ...IDENTITY, childId: 'barn-02' };
    useScanCache.getState().commitSlot(slot({
      identity: otherIdentity,
      resultKey: 'current-finalized:["b"]',
      scanPlayedInFullToday: true,
    }));

    const persisted = partializeScanCache(useScanCache.getState());
    const serialized = JSON.stringify(persisted);
    const rehydratedJson: unknown = JSON.parse(serialized);

    const freshState = { ...useScanCache.getState(), slots: {}, hasPlayedFullScanEver: false };
    const merged = mergeScanCache(rehydratedJson, freshState);

    expect(merged.slots).toEqual(persisted.slots);
    expect(merged.hasPlayedFullScanEver).toBe(true);
    expect(merged.slots['barn-01']).toEqual(slot());
    expect(merged.slots['barn-02']).toEqual(slot({
      identity: otherIdentity,
      resultKey: 'current-finalized:["b"]',
      scanPlayedInFullToday: true,
    }));
  });

  it('legacy persisted JSON (no hasPlayedFullScanEver key) migrates the flag from existing slot data', () => {
    const legacyRaw = JSON.stringify({
      slots: { 'barn-01': slot({ scanPlayedInFullToday: true }) },
    });
    const freshState = { ...useScanCache.getState(), slots: {}, hasPlayedFullScanEver: false };
    const merged = mergeScanCache(JSON.parse(legacyRaw), freshState);
    expect(merged.hasPlayedFullScanEver).toBe(true);
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
