import { describe, expect, it } from 'vitest';
import { createScanCoordinator, type ScanCoordinator } from './coordinator.js';
import type { ScanIdentity } from './types.js';

const IDENTITY_A: ScanIdentity = Object.freeze({
  childId: 'barn-01',
  dateKey: '2026-07-30',
  placeKey: 'place:59.91,10.75',
  activity: 'utelek',
  engineVersion: '2026-07',
});

const IDENTITY_B: ScanIdentity = Object.freeze({
  ...IDENTITY_A,
  activity: 'vogn',
});

const IDENTITY_NEXT_DAY: ScanIdentity = Object.freeze({
  ...IDENTITY_A,
  dateKey: '2026-07-31',
});

const IDENTITY_NEW_ENGINE: ScanIdentity = Object.freeze({
  ...IDENTITY_A,
  engineVersion: '2099-01',
});

function toResultCurrent(
  coordinator: ScanCoordinator,
  identity: ScanIdentity = IDENTITY_A,
  resultKey = 'current-finalized:["a"]',
) {
  coordinator.scanStarted(identity);
  coordinator.scanCompleted(resultKey);
  return coordinator.getState();
}

function toResultStale(
  coordinator: ScanCoordinator,
  identity: ScanIdentity = IDENTITY_A,
  resultKey = 'current-finalized:["a"]',
) {
  toResultCurrent(coordinator, identity, resultKey);
  coordinator.weatherBasisChanged();
  return coordinator.getState();
}

function toRecalculating(
  coordinator: ScanCoordinator,
  identity: ScanIdentity = IDENTITY_A,
  resultKey = 'current-finalized:["a"]',
) {
  toResultCurrent(coordinator, identity, resultKey);
  coordinator.recalcStarted();
  return coordinator.getState();
}

describe('createScanCoordinator — initial state', () => {
  it('starts at weather-ready, frozen and JSON-serializable', () => {
    const coordinator = createScanCoordinator();
    const state = coordinator.getState();
    expect(state).toEqual({ phase: 'weather-ready' });
    expect(Object.isFrozen(state)).toBe(true);
    expect(JSON.parse(JSON.stringify(state))).toEqual({ phase: 'weather-ready' });
  });
});

describe('weatherReady', () => {
  it('is a no-op (same reference, no notification) when already weather-ready', () => {
    const coordinator = createScanCoordinator();
    const before = coordinator.getState();
    let notified = false;
    coordinator.subscribe(() => { notified = true; });
    const after = coordinator.weatherReady();
    expect(after).toBe(before);
    expect(notified).toBe(false);
  });

  it('never regresses an active scanning/result phase', () => {
    for (const setup of [
      (c: ScanCoordinator) => c.scanStarted(IDENTITY_A),
      (c: ScanCoordinator) => toResultCurrent(c),
      (c: ScanCoordinator) => toResultStale(c),
      (c: ScanCoordinator) => toRecalculating(c),
    ]) {
      const coordinator = createScanCoordinator();
      setup(coordinator);
      const before = coordinator.getState();
      let notified = false;
      coordinator.subscribe(() => { notified = true; });
      const after = coordinator.weatherReady();
      expect(after).toBe(before);
      expect(notified).toBe(false);
    }
  });
});

describe('scanStarted', () => {
  it('weather-ready -> scanning, carrying the identity', () => {
    const coordinator = createScanCoordinator();
    const state = coordinator.scanStarted(IDENTITY_A);
    expect(state).toEqual({ phase: 'scanning', identity: IDENTITY_A });
    expect(Object.isFrozen(state)).toBe(true);
  });

  it('is a no-op from every other phase', () => {
    for (const setup of [
      (c: ScanCoordinator) => c.scanStarted(IDENTITY_A),
      (c: ScanCoordinator) => toResultCurrent(c),
      (c: ScanCoordinator) => toResultStale(c),
      (c: ScanCoordinator) => toRecalculating(c),
    ]) {
      const coordinator = createScanCoordinator();
      setup(coordinator);
      const before = coordinator.getState();
      const after = coordinator.scanStarted(IDENTITY_B);
      expect(after).toBe(before);
    }
  });
});

describe('scanCompleted', () => {
  it('scanning -> result-current, carrying the scanning identity + resultKey', () => {
    const coordinator = createScanCoordinator();
    coordinator.scanStarted(IDENTITY_A);
    const state = coordinator.scanCompleted('current-finalized:["x"]');
    expect(state).toEqual({
      phase: 'result-current',
      identity: IDENTITY_A,
      resultKey: 'current-finalized:["x"]',
    });
  });

  it('is a no-op from every other phase (including weather-ready)', () => {
    for (const setup of [
      (_c: ScanCoordinator) => undefined,
      (c: ScanCoordinator) => toResultCurrent(c),
      (c: ScanCoordinator) => toResultStale(c),
      (c: ScanCoordinator) => toRecalculating(c),
    ]) {
      const coordinator = createScanCoordinator();
      setup(coordinator);
      const before = coordinator.getState();
      const after = coordinator.scanCompleted('current-finalized:["ignored"]');
      expect(after).toBe(before);
    }
  });
});

describe('identityChanged', () => {
  it('is a no-op from weather-ready (no established identity to compare against)', () => {
    const coordinator = createScanCoordinator();
    const before = coordinator.getState();
    const after = coordinator.identityChanged(IDENTITY_B, { autoRecalculate: true });
    expect(after).toBe(before);
  });

  it('is a no-op when the new identity is structurally identical to the current one', () => {
    for (const setup of [
      (c: ScanCoordinator) => c.scanStarted(IDENTITY_A),
      (c: ScanCoordinator) => toResultCurrent(c),
      (c: ScanCoordinator) => toResultStale(c),
      (c: ScanCoordinator) => toRecalculating(c),
    ]) {
      const coordinator = createScanCoordinator();
      setup(coordinator);
      const before = coordinator.getState();
      // A *different object instance* with identical field values.
      const after = coordinator.identityChanged({ ...IDENTITY_A });
      expect(after).toBe(before);
    }
  });

  describe('policy: autoRecalculate falsy -> result-stale, reason identity-changed', () => {
    it('from scanning (no prior result -> lastResultKey null)', () => {
      const coordinator = createScanCoordinator();
      coordinator.scanStarted(IDENTITY_A);
      const state = coordinator.identityChanged(IDENTITY_B);
      expect(state).toEqual({
        phase: 'result-stale',
        identity: IDENTITY_B,
        lastResultKey: null,
        reason: 'identity-changed',
      });
    });

    it('from result-current (keeps the prior resultKey as lastResultKey)', () => {
      const coordinator = createScanCoordinator();
      toResultCurrent(coordinator, IDENTITY_A, 'current-finalized:["a"]');
      const state = coordinator.identityChanged(IDENTITY_B, { autoRecalculate: false });
      expect(state).toEqual({
        phase: 'result-stale',
        identity: IDENTITY_B,
        lastResultKey: 'current-finalized:["a"]',
        reason: 'identity-changed',
      });
    });

    it('from result-stale (carries lastResultKey through, overwrites the reason)', () => {
      const coordinator = createScanCoordinator();
      toResultStale(coordinator, IDENTITY_A, 'current-finalized:["a"]');
      expect(coordinator.getState()).toMatchObject({ reason: 'weather-basis' });
      const state = coordinator.identityChanged(IDENTITY_B);
      expect(state).toEqual({
        phase: 'result-stale',
        identity: IDENTITY_B,
        lastResultKey: 'current-finalized:["a"]',
        reason: 'identity-changed',
      });
    });

    it('from recalculating (abandons the in-flight recalculation)', () => {
      const coordinator = createScanCoordinator();
      toRecalculating(coordinator, IDENTITY_A, 'current-finalized:["a"]');
      const state = coordinator.identityChanged(IDENTITY_B);
      expect(state).toEqual({
        phase: 'result-stale',
        identity: IDENTITY_B,
        lastResultKey: 'current-finalized:["a"]',
        reason: 'identity-changed',
      });
    });
  });

  describe('policy: autoRecalculate true -> recalculating', () => {
    it('from scanning (no prior result -> lastResultKey null)', () => {
      const coordinator = createScanCoordinator();
      coordinator.scanStarted(IDENTITY_A);
      const state = coordinator.identityChanged(IDENTITY_B, { autoRecalculate: true });
      expect(state).toEqual({
        phase: 'recalculating',
        identity: IDENTITY_B,
        lastResultKey: null,
      });
    });

    it('from result-current (activity-toggle style automatic inline recalculation)', () => {
      const coordinator = createScanCoordinator();
      toResultCurrent(coordinator, IDENTITY_A, 'current-finalized:["a"]');
      const state = coordinator.identityChanged(IDENTITY_B, { autoRecalculate: true });
      expect(state).toEqual({
        phase: 'recalculating',
        identity: IDENTITY_B,
        lastResultKey: 'current-finalized:["a"]',
      });
    });

    it('from result-stale', () => {
      const coordinator = createScanCoordinator();
      toResultStale(coordinator, IDENTITY_A, 'current-finalized:["a"]');
      const state = coordinator.identityChanged(IDENTITY_B, { autoRecalculate: true });
      expect(state).toEqual({
        phase: 'recalculating',
        identity: IDENTITY_B,
        lastResultKey: 'current-finalized:["a"]',
      });
    });

    it('from recalculating (supersedes the in-flight target identity, keeps lastResultKey)', () => {
      const coordinator = createScanCoordinator();
      toRecalculating(coordinator, IDENTITY_A, 'current-finalized:["a"]');
      const state = coordinator.identityChanged(IDENTITY_B, { autoRecalculate: true });
      expect(state).toEqual({
        phase: 'recalculating',
        identity: IDENTITY_B,
        lastResultKey: 'current-finalized:["a"]',
      });
    });
  });

  it('date rollover is a genuine identity change (dateKey differs)', () => {
    const coordinator = createScanCoordinator();
    toResultCurrent(coordinator, IDENTITY_A, 'current-finalized:["a"]');
    const state = coordinator.identityChanged(IDENTITY_NEXT_DAY);
    expect(state).toEqual({
      phase: 'result-stale',
      identity: IDENTITY_NEXT_DAY,
      lastResultKey: 'current-finalized:["a"]',
      reason: 'identity-changed',
    });
  });

  it('an engine-version bump is a genuine identity change (engineVersion differs)', () => {
    const coordinator = createScanCoordinator();
    toResultCurrent(coordinator, IDENTITY_A, 'current-finalized:["a"]');
    const state = coordinator.identityChanged(IDENTITY_NEW_ENGINE, { autoRecalculate: true });
    expect(state).toEqual({
      phase: 'recalculating',
      identity: IDENTITY_NEW_ENGINE,
      lastResultKey: 'current-finalized:["a"]',
    });
  });
});

describe('weatherBasisChanged', () => {
  it('result-current -> result-stale, reason weather-basis, keeps the resultKey as lastResultKey', () => {
    const coordinator = createScanCoordinator();
    toResultCurrent(coordinator, IDENTITY_A, 'current-finalized:["a"]');
    const state = coordinator.weatherBasisChanged();
    expect(state).toEqual({
      phase: 'result-stale',
      identity: IDENTITY_A,
      lastResultKey: 'current-finalized:["a"]',
      reason: 'weather-basis',
    });
  });

  it('is a no-op from every other phase', () => {
    for (const setup of [
      (_c: ScanCoordinator) => undefined,
      (c: ScanCoordinator) => c.scanStarted(IDENTITY_A),
      (c: ScanCoordinator) => toResultStale(c),
      (c: ScanCoordinator) => toRecalculating(c),
    ]) {
      const coordinator = createScanCoordinator();
      setup(coordinator);
      const before = coordinator.getState();
      const after = coordinator.weatherBasisChanged();
      expect(after).toBe(before);
    }
  });

  it('never changes the identity — weather basis is not part of ScanIdentity', () => {
    const coordinator = createScanCoordinator();
    toResultCurrent(coordinator, IDENTITY_A, 'current-finalized:["a"]');
    const state = coordinator.weatherBasisChanged();
    expect(state.phase === 'result-stale' && state.identity).toEqual(IDENTITY_A);
  });
});

describe('recalcStarted', () => {
  it('result-current -> recalculating, seeding lastResultKey from resultKey', () => {
    const coordinator = createScanCoordinator();
    toResultCurrent(coordinator, IDENTITY_A, 'current-finalized:["a"]');
    const state = coordinator.recalcStarted();
    expect(state).toEqual({
      phase: 'recalculating',
      identity: IDENTITY_A,
      lastResultKey: 'current-finalized:["a"]',
    });
  });

  it('result-stale -> recalculating, carrying lastResultKey through', () => {
    const coordinator = createScanCoordinator();
    toResultStale(coordinator, IDENTITY_A, 'current-finalized:["a"]');
    const state = coordinator.recalcStarted();
    expect(state).toEqual({
      phase: 'recalculating',
      identity: IDENTITY_A,
      lastResultKey: 'current-finalized:["a"]',
    });
  });

  it('is a no-op from weather-ready, scanning, and recalculating', () => {
    for (const setup of [
      (_c: ScanCoordinator) => undefined,
      (c: ScanCoordinator) => c.scanStarted(IDENTITY_A),
      (c: ScanCoordinator) => toRecalculating(c),
    ]) {
      const coordinator = createScanCoordinator();
      setup(coordinator);
      const before = coordinator.getState();
      const after = coordinator.recalcStarted();
      expect(after).toBe(before);
    }
  });
});

describe('recalcCompleted', () => {
  it('recalculating -> result-current with the fresh resultKey', () => {
    const coordinator = createScanCoordinator();
    toRecalculating(coordinator, IDENTITY_A, 'current-finalized:["a"]');
    const state = coordinator.recalcCompleted('current-finalized:["b"]');
    expect(state).toEqual({
      phase: 'result-current',
      identity: IDENTITY_A,
      resultKey: 'current-finalized:["b"]',
    });
  });

  it('is a no-op from every other phase', () => {
    for (const setup of [
      (_c: ScanCoordinator) => undefined,
      (c: ScanCoordinator) => c.scanStarted(IDENTITY_A),
      (c: ScanCoordinator) => toResultCurrent(c),
      (c: ScanCoordinator) => toResultStale(c),
    ]) {
      const coordinator = createScanCoordinator();
      setup(coordinator);
      const before = coordinator.getState();
      const after = coordinator.recalcCompleted('current-finalized:["ignored"]');
      expect(after).toBe(before);
    }
  });
});

describe('recalcFailed', () => {
  it('recalculating -> result-stale, reason recalc-failed, preserves lastResultKey', () => {
    const coordinator = createScanCoordinator();
    toRecalculating(coordinator, IDENTITY_A, 'current-finalized:["a"]');
    const state = coordinator.recalcFailed();
    expect(state).toEqual({
      phase: 'result-stale',
      identity: IDENTITY_A,
      lastResultKey: 'current-finalized:["a"]',
      reason: 'recalc-failed',
    });
  });

  it('recalculating with no prior result (post-scanning recalc) fails to result-stale with a null lastResultKey', () => {
    const coordinator = createScanCoordinator();
    coordinator.scanStarted(IDENTITY_A);
    coordinator.identityChanged(IDENTITY_B, { autoRecalculate: true });
    const state = coordinator.recalcFailed();
    expect(state).toEqual({
      phase: 'result-stale',
      identity: IDENTITY_B,
      lastResultKey: null,
      reason: 'recalc-failed',
    });
  });

  it('is a no-op from every other phase', () => {
    for (const setup of [
      (_c: ScanCoordinator) => undefined,
      (c: ScanCoordinator) => c.scanStarted(IDENTITY_A),
      (c: ScanCoordinator) => toResultCurrent(c),
      (c: ScanCoordinator) => toResultStale(c),
    ]) {
      const coordinator = createScanCoordinator();
      setup(coordinator);
      const before = coordinator.getState();
      const after = coordinator.recalcFailed();
      expect(after).toBe(before);
    }
  });
});

describe('reset', () => {
  it('returns to weather-ready from every phase', () => {
    for (const setup of [
      (c: ScanCoordinator) => c.scanStarted(IDENTITY_A),
      (c: ScanCoordinator) => toResultCurrent(c),
      (c: ScanCoordinator) => toResultStale(c),
      (c: ScanCoordinator) => toRecalculating(c),
    ]) {
      const coordinator = createScanCoordinator();
      setup(coordinator);
      const state = coordinator.reset();
      expect(state).toEqual({ phase: 'weather-ready' });
    }
  });

  it('is idempotent (same reference, no notification) when already weather-ready', () => {
    const coordinator = createScanCoordinator();
    const before = coordinator.getState();
    let notified = false;
    coordinator.subscribe(() => { notified = true; });
    const after = coordinator.reset();
    expect(after).toBe(before);
    expect(notified).toBe(false);
  });

  it('allows a fresh scanStarted after reset', () => {
    const coordinator = createScanCoordinator();
    toResultCurrent(coordinator, IDENTITY_A, 'current-finalized:["a"]');
    coordinator.reset();
    const state = coordinator.scanStarted(IDENTITY_B);
    expect(state).toEqual({ phase: 'scanning', identity: IDENTITY_B });
  });
});

describe('subscribe/unsubscribe', () => {
  it('notifies listeners once per state-changing call, in order', () => {
    const coordinator = createScanCoordinator();
    const observed: string[] = [];
    const unsubscribe = coordinator.subscribe(() => {
      observed.push(coordinator.getState().phase);
    });

    coordinator.scanStarted(IDENTITY_A);
    coordinator.scanCompleted('current-finalized:["a"]');
    coordinator.weatherBasisChanged();
    coordinator.recalcStarted();
    coordinator.recalcCompleted('current-finalized:["b"]');
    coordinator.reset();

    expect(observed).toEqual([
      'scanning',
      'result-current',
      'result-stale',
      'recalculating',
      'result-current',
      'weather-ready',
    ]);
    unsubscribe();
  });

  it('does not notify a no-op call, and stops notifying after unsubscribe', () => {
    const coordinator = createScanCoordinator();
    let count = 0;
    const unsubscribe = coordinator.subscribe(() => { count += 1; });

    coordinator.reset(); // already weather-ready -> no-op
    expect(count).toBe(0);

    coordinator.scanStarted(IDENTITY_A);
    expect(count).toBe(1);

    unsubscribe();
    coordinator.scanCompleted('current-finalized:["a"]');
    expect(count).toBe(1);
  });
});

describe('end-to-end happy paths', () => {
  it('first scan of the day plays in full, then a manual recalculate cycle succeeds', () => {
    const coordinator = createScanCoordinator();
    const observed: string[] = [];
    coordinator.subscribe(() => observed.push(coordinator.getState().phase));

    expect(coordinator.scanStarted(IDENTITY_A).phase).toBe('scanning');
    expect(coordinator.scanCompleted('current-finalized:["a"]').phase).toBe('result-current');
    expect(coordinator.recalcStarted().phase).toBe('recalculating');
    expect(coordinator.recalcCompleted('current-finalized:["a2"]').phase).toBe('result-current');

    expect(observed).toEqual([
      'scanning',
      'result-current',
      'recalculating',
      'result-current',
    ]);
    expect(coordinator.getState()).toEqual({
      phase: 'result-current',
      identity: IDENTITY_A,
      resultKey: 'current-finalized:["a2"]',
    });
  });

  it('activity toggle auto-recalculates, and a failed recalc falls back to stale with a retry that succeeds', () => {
    const coordinator = createScanCoordinator();
    toResultCurrent(coordinator, IDENTITY_A, 'current-finalized:["a"]');

    // Activity toggle: identity changes, policy says auto-recalculate.
    expect(
      coordinator.identityChanged(IDENTITY_B, { autoRecalculate: true }).phase,
    ).toBe('recalculating');

    // The inline recalculation is slow/fails -> stale fallback (still shows
    // the OLD identity's cached result as lastResultKey, per product model).
    expect(coordinator.recalcFailed()).toEqual({
      phase: 'result-stale',
      identity: IDENTITY_B,
      lastResultKey: 'current-finalized:["a"]',
      reason: 'recalc-failed',
    });

    // User (or an automatic retry) tries again and it succeeds this time.
    expect(coordinator.recalcStarted().phase).toBe('recalculating');
    expect(coordinator.recalcCompleted('current-finalized:["b"]')).toEqual({
      phase: 'result-current',
      identity: IDENTITY_B,
      resultKey: 'current-finalized:["b"]',
    });
  });

  it('each coordinator instance is independent state', () => {
    const first = createScanCoordinator();
    const second = createScanCoordinator();
    toResultCurrent(first, IDENTITY_A, 'current-finalized:["a"]');
    expect(first.getState().phase).toBe('result-current');
    expect(second.getState()).toEqual({ phase: 'weather-ready' });
  });
});
