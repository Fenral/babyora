import { describe, expect, it } from 'vitest';
import type { ScanCacheSlot, ScanIdentity } from '../../../lib/scan/types.js';
import {
  activityChangeChip,
  decideScanEntry,
  FULL_SCAN_DURATION_MS,
  fullScanHapticSchedule,
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

describe('decideScanEntry (eier-override v3 — always full, mikropass pensjonert)', () => {
  it('shows the cached result instantly when an exact identity match exists (no overlay at all)', () => {
    const exact = slot({ resultKey: 'cached-result' });
    const decision = decideScanEntry(exact);
    expect(decision).toEqual({ kind: 'show-cached', resultKey: 'cached-result' });
  });

  it('always waits for a tap and plays the FULL choreography — every trigger, no lifetime gate left', () => {
    expect(decideScanEntry(null)).toEqual({ kind: 'await-tap', playFull: true });
  });
});

describe('scanCheckDelaysMs', () => {
  it('reproduces the mock choreography delays scaled to the eier-override v3 3.2s full-scan duration', () => {
    expect(scanCheckDelaysMs(FULL_SCAN_DURATION_MS)).toEqual([838, 1600, 2362]);
  });

  it('scales proportionally for a shorter (quick recalc) duration', () => {
    const [a, b, c] = scanCheckDelaysMs(220);
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
    expect(c).toBeLessThanOrEqual(220);
  });
});

describe('fullScanHapticSchedule (P9 duel §3 — up to 5 felt signals, unchanged by the v3 duration bump)', () => {
  it('schedules soft(start) + selection x3 (one per checkmark) + prepare + medium(landing), in order', () => {
    const schedule = fullScanHapticSchedule(FULL_SCAN_DURATION_MS);
    expect(schedule.map((e) => e.cue)).toEqual(['soft', 'selection', 'selection', 'selection', 'prepare', 'medium']);
    expect(schedule.map((e) => e.atMs)).toEqual([0, 838, 1600, 2362, 3090, 3200]);
    // Strictly increasing — never re-orders relative to the visual checkmarks.
    for (let i = 1; i < schedule.length; i += 1) {
      expect(schedule[i]!.atMs).toBeGreaterThanOrEqual(schedule[i - 1]!.atMs);
    }
  });

  it('never schedules prepare() before t=0, even for a very short duration', () => {
    const schedule = fullScanHapticSchedule(50);
    const prepare = schedule.find((e) => e.cue === 'prepare');
    expect(prepare?.atMs).toBeGreaterThanOrEqual(0);
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
