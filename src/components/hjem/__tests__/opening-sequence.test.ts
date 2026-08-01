/**
 * opening-sequence.ts — P10/JOB1 pure decision-function + timing-constant
 * tests (docs/design-notes/aapningssekvens-2026-08-01.md). No DOM/React —
 * same convention as scan-orchestration.test.ts.
 */
import { describe, expect, it } from 'vitest';
import {
  COLD_TOTAL_MS,
  decideOpeningVariant,
  FIRST_EVER_HANDS_LAND_END_MS,
  FIRST_EVER_HANDS_LAND_START_MS,
  FIRST_EVER_MASCOT_RISE_END_MS,
  FIRST_EVER_MASCOT_RISE_PX,
  FIRST_EVER_MASCOT_RISE_ROTATION_DEG,
  FIRST_EVER_MASCOT_RISE_START_MS,
  FIRST_EVER_PANEL_LIFT_END_MS,
  FIRST_EVER_PANEL_LIFT_PX,
  FIRST_EVER_PANEL_LIFT_START_MS,
  FIRST_EVER_SETTLE_END_MS,
  FIRST_EVER_SETTLE_START_MS,
  FIRST_EVER_TOTAL_MS,
  HANDS_TOP_OFFSET_FRACTION_OF_WIDTH,
} from '../opening-sequence';

const BASE = {
  bootSlotClaimed: true,
  reducedMotion: false,
  isWarmCacheHit: false,
  hasSeenOpeningEver: false,
};

describe('decideOpeningVariant — graded usage (spec §"Gradert bruk")', () => {
  it('første gang noensinne (fresh boot slot, no cache, motion allowed, never seen before): full hybrid', () => {
    expect(decideOpeningVariant(BASE)).toBe('first-ever');
  });

  it('senere kaldstart (already seen once): micro "cold" variant', () => {
    expect(decideOpeningVariant({ ...BASE, hasSeenOpeningEver: true })).toBe('cold');
  });

  it('varmstart (exact cache hit — "direkte til cachet Hjem"): none, EVEN on the very first-ever boot', () => {
    expect(decideOpeningVariant({ ...BASE, isWarmCacheHit: true })).toBe('none');
    expect(decideOpeningVariant({ ...BASE, isWarmCacheHit: true, hasSeenOpeningEver: true })).toBe('none');
  });

  it('reduce motion: none, regardless of every other input', () => {
    expect(decideOpeningVariant({ ...BASE, reducedMotion: true })).toBe('none');
    expect(decideOpeningVariant({ ...BASE, reducedMotion: true, hasSeenOpeningEver: true, isWarmCacheHit: false })).toBe('none');
  });

  it('boot slot already claimed (a later HjemMonter mount within the same boot — e.g. a tab switch): none, never replays', () => {
    expect(decideOpeningVariant({ ...BASE, bootSlotClaimed: false })).toBe('none');
    // Even a "should be first-ever" combination stays 'none' once the boot slot is gone.
    expect(decideOpeningVariant({ ...BASE, bootSlotClaimed: false, hasSeenOpeningEver: false, isWarmCacheHit: false, reducedMotion: false })).toBe('none');
  });

  it('boot-slot guard wins over everything, including reducedMotion=false + first-ever-eligible', () => {
    expect(decideOpeningVariant({
      bootSlotClaimed: false,
      reducedMotion: false,
      isWarmCacheHit: false,
      hasSeenOpeningEver: false,
    })).toBe('none');
  });
});

describe('Timeline constants — første gang noensinne (~900ms)', () => {
  it('total duration is ~900ms', () => {
    expect(FIRST_EVER_TOTAL_MS).toBe(900);
  });

  it('panel lift: 100–280ms, 8px', () => {
    expect(FIRST_EVER_PANEL_LIFT_START_MS).toBe(100);
    expect(FIRST_EVER_PANEL_LIFT_END_MS).toBe(280);
    expect(FIRST_EVER_PANEL_LIFT_PX).toBe(8);
  });

  it('mascot rise: 180–720ms, within the 60-80px range, max 1° rotation', () => {
    expect(FIRST_EVER_MASCOT_RISE_START_MS).toBe(180);
    expect(FIRST_EVER_MASCOT_RISE_END_MS).toBe(720);
    expect(FIRST_EVER_MASCOT_RISE_PX).toBeGreaterThanOrEqual(60);
    expect(FIRST_EVER_MASCOT_RISE_PX).toBeLessThanOrEqual(80);
    expect(FIRST_EVER_MASCOT_RISE_ROTATION_DEG).toBeLessThanOrEqual(1);
  });

  it('hands land: 620–820ms', () => {
    expect(FIRST_EVER_HANDS_LAND_START_MS).toBe(620);
    expect(FIRST_EVER_HANDS_LAND_END_MS).toBe(820);
  });

  it('settle: 820–900ms', () => {
    expect(FIRST_EVER_SETTLE_START_MS).toBe(820);
    expect(FIRST_EVER_SETTLE_END_MS).toBe(900);
  });

  it('phases are chronologically ordered and fit within the total duration', () => {
    expect(FIRST_EVER_PANEL_LIFT_START_MS).toBeLessThan(FIRST_EVER_PANEL_LIFT_END_MS);
    expect(FIRST_EVER_MASCOT_RISE_START_MS).toBeLessThan(FIRST_EVER_MASCOT_RISE_END_MS);
    expect(FIRST_EVER_HANDS_LAND_START_MS).toBeLessThan(FIRST_EVER_HANDS_LAND_END_MS);
    expect(FIRST_EVER_SETTLE_START_MS).toBeLessThanOrEqual(FIRST_EVER_SETTLE_END_MS);
    expect(FIRST_EVER_SETTLE_END_MS).toBeLessThanOrEqual(FIRST_EVER_TOTAL_MS);
  });
});

describe('Timeline constants — senere kaldstarter (280–350ms mikro)', () => {
  it('total duration falls within the 280–350ms window', () => {
    expect(COLD_TOTAL_MS).toBeGreaterThanOrEqual(280);
    expect(COLD_TOTAL_MS).toBeLessThanOrEqual(350);
  });
});

describe('Fingertip-line geometry (shared with the alpha-measured split)', () => {
  it('matches the actual tools/split-mascot-layers.mjs output (hands layer started at source row 329 of a 512px-wide canvas)', () => {
    expect(HANDS_TOP_OFFSET_FRACTION_OF_WIDTH).toBeCloseTo(329 / 512, 10);
  });
});
