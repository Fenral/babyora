/**
 * ui-store — P10/JOB1 tests (docs/design-notes/aapningssekvens-2026-08-01.md).
 * Same style as scan-cache-store.test.ts (hasPlayedFullScanEver) for the
 * persisted flag, plus dedicated coverage for the per-boot claim-once slot.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { __resetOpeningBootSlotForTests, consumeOpeningBootSlot, useUiStore } from '../ui-store';

describe('useUiStore — hasSeenOpeningEver (lifetime flag, mirrors hasPlayedFullScanEver)', () => {
  beforeEach(() => {
    useUiStore.setState({ hasSeenOpeningEver: false });
  });

  it('defaults to false', () => {
    expect(useUiStore.getState().hasSeenOpeningEver).toBe(false);
  });

  it('markOpeningSeenEver flips it to true', () => {
    useUiStore.getState().markOpeningSeenEver();
    expect(useUiStore.getState().hasSeenOpeningEver).toBe(true);
  });

  it('is idempotent — a second call is a true no-op (same store reference, never resets)', () => {
    useUiStore.getState().markOpeningSeenEver();
    const afterFirst = useUiStore.getState();
    useUiStore.getState().markOpeningSeenEver();
    expect(useUiStore.getState()).toBe(afterFirst);
    expect(useUiStore.getState().hasSeenOpeningEver).toBe(true);
  });
});

describe('consumeOpeningBootSlot — per-boot claim-once dedup', () => {
  beforeEach(() => {
    __resetOpeningBootSlotForTests();
  });

  it('returns true for the first caller this boot', () => {
    expect(consumeOpeningBootSlot()).toBe(true);
  });

  it('returns false for every subsequent caller until reset (simulates a later HjemMonter remount within the same boot, e.g. a tab switch)', () => {
    expect(consumeOpeningBootSlot()).toBe(true);
    expect(consumeOpeningBootSlot()).toBe(false);
    expect(consumeOpeningBootSlot()).toBe(false);
  });

  it('the test-only reset genuinely re-opens the slot (module-level mutable state, not a snapshot)', () => {
    expect(consumeOpeningBootSlot()).toBe(true);
    expect(consumeOpeningBootSlot()).toBe(false);
    __resetOpeningBootSlotForTests();
    expect(consumeOpeningBootSlot()).toBe(true);
  });
});
