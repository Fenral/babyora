import { describe, expect, it } from 'vitest';
import type { ScanCacheSlot, ScanIdentity } from '../../../lib/scan/types.js';
import {
  activityChangeChip,
  decideScanEntry,
  FULL_SCAN_DURATION_MS,
  fullScanHapticSchedule,
  micropassHapticSchedule,
  MICROPASS_DURATION_MS,
  MICROPASS_LANDING_MS,
  MICROPASS_PREPARE_MS,
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

describe('decideScanEntry (P9 duel §2 — lifetime, not per-day)', () => {
  it('shows the cached result instantly when an exact identity match exists (no overlay at all)', () => {
    const exact = slot({ resultKey: 'cached-result' });
    const decision = decideScanEntry(exact, true);
    expect(decision).toEqual({ kind: 'show-cached', resultKey: 'cached-result' });
  });

  it('waits for a tap and plays the FULL choreography the very first time ever', () => {
    const decision = decideScanEntry(null, false);
    expect(decision).toEqual({ kind: 'await-tap', playFull: true });
  });

  it('waits for a tap but plays the MICROPASS once the full choreography has already played before, EVEN on a fresh identity (e.g. activity drifted, or a day rollover)', () => {
    const decision = decideScanEntry(null, true);
    expect(decision).toEqual({ kind: 'await-tap', playFull: false });
  });
});

describe('scanCheckDelaysMs', () => {
  it('reproduces the mock choreography delays scaled to the new 1.1s full-scan duration', () => {
    expect(scanCheckDelaysMs(FULL_SCAN_DURATION_MS)).toEqual([288, 550, 812]);
  });

  it('scales proportionally for a shorter (quick recalc) duration', () => {
    const [a, b, c] = scanCheckDelaysMs(220);
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
    expect(c).toBeLessThanOrEqual(220);
  });
});

describe('fullScanHapticSchedule (P9 duel §3 — up to 5 felt signals)', () => {
  it('schedules soft(start) + selection x3 (one per checkmark) + prepare + medium(landing), in order', () => {
    const schedule = fullScanHapticSchedule(FULL_SCAN_DURATION_MS);
    expect(schedule.map((e) => e.cue)).toEqual(['soft', 'selection', 'selection', 'selection', 'prepare', 'medium']);
    expect(schedule.map((e) => e.atMs)).toEqual([0, 288, 550, 812, 990, 1100]);
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

describe('micropassHapticSchedule (P9 duel §3 — exactly ONE felt signal)', () => {
  it('schedules prepare then medium, ~110ms apart, matching the duel\'s exact timestamps', () => {
    const schedule = micropassHapticSchedule();
    expect(schedule).toEqual([
      { atMs: MICROPASS_PREPARE_MS, cue: 'prepare' },
      { atMs: MICROPASS_LANDING_MS, cue: 'medium' },
    ]);
    expect(MICROPASS_LANDING_MS - MICROPASS_PREPARE_MS).toBe(110);
    expect(MICROPASS_LANDING_MS).toBeLessThan(MICROPASS_DURATION_MS);
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
