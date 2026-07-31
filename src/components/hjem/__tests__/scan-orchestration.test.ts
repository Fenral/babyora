import { describe, expect, it } from 'vitest';
import type { ScanCacheSlot, ScanIdentity } from '../../../lib/scan/types.js';
import {
  activityChangeChip,
  decideScanEntry,
  FULL_SCAN_DURATION_MS,
  scanCheckDelaysMs,
  staleCtaLabel,
  staleHeadline,
} from '../scan-orchestration.js';

function identity(overrides: Partial<ScanIdentity> = {}): ScanIdentity {
  return {
    childId: 'child-1',
    dateKey: '2026-07-31',
    placeKey: 'place:59.91,10.75',
    activity: 'utelek',
    engineVersion: 'v1',
    ...overrides,
  };
}

function slot(overrides: Partial<ScanCacheSlot> = {}): ScanCacheSlot {
  return {
    identity: identity(),
    resultKey: 'result-key-1',
    completedAt: Date.now(),
    scanPlayedInFullToday: true,
    ...overrides,
  };
}

describe('decideScanEntry', () => {
  it('shows the cached result instantly when an exact identity match exists (no overlay at all)', () => {
    const exact = slot({ resultKey: 'cached-result' });
    const decision = decideScanEntry(exact, exact, identity());
    expect(decision).toEqual({ kind: 'show-cached', resultKey: 'cached-result' });
  });

  it('waits for a tap and plays the FULL choreography on the very first scan of the day', () => {
    const decision = decideScanEntry(null, null, identity());
    expect(decision).toEqual({ kind: 'await-tap', playFull: true });
  });

  it('waits for a tap but plays the QUICK choreography when the day-slot exists but identity differs (e.g. activity drifted)', () => {
    const todaySlotForOtherActivity = slot({ identity: identity({ activity: 'vogn' }) });
    const decision = decideScanEntry(null, todaySlotForOtherActivity, identity({ activity: 'utelek' }));
    expect(decision).toEqual({ kind: 'await-tap', playFull: false });
  });

  it('plays the full choreography again after a day rollover even if a stale day-slot exists', () => {
    const yesterday = slot({ identity: identity({ dateKey: '2026-07-30' }) });
    const decision = decideScanEntry(null, yesterday, identity({ dateKey: '2026-07-31' }));
    expect(decision).toEqual({ kind: 'await-tap', playFull: true });
  });
});

describe('scanCheckDelaysMs', () => {
  it('reproduces the mock choreography delays (0.55s/1.05s/1.55s of a 2.1s pass)', () => {
    expect(scanCheckDelaysMs(FULL_SCAN_DURATION_MS)).toEqual([550, 1050, 1550]);
  });

  it('scales proportionally for a shorter (quick recalc) duration', () => {
    const [a, b, c] = scanCheckDelaysMs(220);
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
    expect(c).toBeLessThanOrEqual(220);
  });
});

describe('stale copy', () => {
  it('uses the exact mock contextual copy for an identity change', () => {
    expect(staleHeadline('identity-changed', 'vogn')).toBe('Nytt antrekk for vogn?');
    expect(staleCtaLabel('identity-changed', 'vogn')).toBe('Se antrekk for vogn');
  });

  it('always offers "Beregn på nytt" for recalc failure, per the architecture note (not the contextual copy)', () => {
    expect(staleCtaLabel('recalc-failed', 'vogn')).toBe('Beregn på nytt');
    expect(staleCtaLabel('weather-basis', 'utelek')).toBe('Beregn på nytt');
  });
});

describe('activityChangeChip', () => {
  it('renders the exact mock chip copy when activity changed', () => {
    expect(activityChangeChip('utelek', 'vogn')).toBe('Du byttet fra utelek til vogn');
  });

  it('returns null when there is no previous activity to compare, or nothing changed', () => {
    expect(activityChangeChip(null, 'vogn')).toBeNull();
    expect(activityChangeChip('vogn', 'vogn')).toBeNull();
  });
});
