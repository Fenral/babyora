/**
 * mascot-idle.ts — pure timing/decision-function tests (Del 4, sol-duel v3-
 * pakken 2026-08-01, ekstern review-revidert samme dag). No DOM/React —
 * same convention as scan-orchestration.test.ts. See mascot-idle.ts's own
 * header for why the original looping-video plan was replaced by this
 * glance system, and why it later gained its own reserved pose-asset +
 * extra cancellation guards.
 */
import { describe, expect, it } from 'vitest';
import {
  idleGlanceDelayMs,
  idleGlanceEligible,
  IDLE_GLANCE_FADE_MS,
  IDLE_GLANCE_HOLD_MS,
  IDLE_GLANCE_REST_MAX_MS,
  IDLE_GLANCE_REST_MIN_MS,
  IDLE_GLANCE_TOTAL_MS,
  IDLE_LOOP_MAX_DELAY_MS,
  IDLE_LOOP_MIN_DELAY_MS,
  RESUME_COOLDOWN_MS,
} from '../mascot-idle.js';

const ELIGIBLE = Object.freeze({
  reducedMotion: false,
  documentHidden: false,
  dialogOpen: false,
  keyboardOpen: false,
  withinResumeCooldown: false,
  assetReady: true,
});

describe('timing constants', () => {
  it('first-glance window matches the original idle-loop spec (4-5s)', () => {
    expect(IDLE_LOOP_MIN_DELAY_MS).toBe(4000);
    expect(IDLE_LOOP_MAX_DELAY_MS).toBe(5000);
  });

  it('rest window (subsequent glances) is 20-30s — sparser than the first', () => {
    expect(IDLE_GLANCE_REST_MIN_MS).toBe(20000);
    expect(IDLE_GLANCE_REST_MAX_MS).toBe(30000);
    expect(IDLE_GLANCE_REST_MIN_MS).toBeGreaterThan(IDLE_LOOP_MAX_DELAY_MS);
  });

  it('a single glance totals fade-in + hold + fade-out', () => {
    expect(IDLE_GLANCE_TOTAL_MS).toBe(IDLE_GLANCE_FADE_MS * 2 + IDLE_GLANCE_HOLD_MS);
    expect(IDLE_GLANCE_TOTAL_MS).toBe(1800);
  });

  it('a glance is well under 5s — momentary, non-repeating motion (no separate WCAG 2.2.2 pause control needed)', () => {
    expect(IDLE_GLANCE_TOTAL_MS).toBeLessThan(5000);
  });

  it('the post-resume cancellation cooldown is 30s', () => {
    expect(RESUME_COOLDOWN_MS).toBe(30000);
  });
});

describe('idleGlanceDelayMs', () => {
  it('"first" window: random()=0 returns the minimum, random() near 1 approaches the maximum', () => {
    expect(idleGlanceDelayMs('first', () => 0)).toBe(IDLE_LOOP_MIN_DELAY_MS);
    expect(idleGlanceDelayMs('first', () => 0.5)).toBe(4500);
    expect(idleGlanceDelayMs('first', () => 1)).toBe(IDLE_LOOP_MAX_DELAY_MS);
  });

  it('"rest" window: random()=0 returns the minimum, random()=1 the maximum', () => {
    expect(idleGlanceDelayMs('rest', () => 0)).toBe(IDLE_GLANCE_REST_MIN_MS);
    expect(idleGlanceDelayMs('rest', () => 0.5)).toBe(25000);
    expect(idleGlanceDelayMs('rest', () => 1)).toBe(IDLE_GLANCE_REST_MAX_MS);
  });

  it('never calls Date.now()/Math.random() itself — purely a function of the injected random()', () => {
    const calls: number[] = [];
    const stub = () => { calls.push(1); return 0.25; };
    idleGlanceDelayMs('first', stub);
    expect(calls.length).toBe(1);
  });
});

describe('idleGlanceEligible — full guard matrix (ekstern review 2026-08-01)', () => {
  it('eligible when every guard is clean', () => {
    expect(idleGlanceEligible(ELIGIBLE)).toBe(true);
  });

  it('never eligible when the dedicated glance asset is not ready — NEVER falls back to some other pose, just goes inert', () => {
    expect(idleGlanceEligible({ ...ELIGIBLE, assetReady: false })).toBe(false);
  });

  it('never eligible under reduced motion, regardless of anything else', () => {
    expect(idleGlanceEligible({ ...ELIGIBLE, reducedMotion: true })).toBe(false);
  });

  it('never eligible while the tab is backgrounded', () => {
    expect(idleGlanceEligible({ ...ELIGIBLE, documentHidden: true })).toBe(false);
  });

  it('never eligible while a native <dialog open> (sheet/paywall/detail-sheet) is present', () => {
    expect(idleGlanceEligible({ ...ELIGIBLE, dialogOpen: true })).toBe(false);
  });

  it('never eligible while the software keyboard is likely open', () => {
    expect(idleGlanceEligible({ ...ELIGIBLE, keyboardOpen: true })).toBe(false);
  });

  it('never eligible within the 30s post-resume cooldown', () => {
    expect(idleGlanceEligible({ ...ELIGIBLE, withinResumeCooldown: true })).toBe(false);
  });

  it('every single guard is independently sufficient to block eligibility (no OR-bypass)', () => {
    const keys: Array<keyof typeof ELIGIBLE> = [
      'documentHidden', 'dialogOpen', 'keyboardOpen', 'withinResumeCooldown',
    ];
    for (const key of keys) {
      expect(idleGlanceEligible({ ...ELIGIBLE, [key]: true })).toBe(false);
    }
    expect(idleGlanceEligible({ ...ELIGIBLE, reducedMotion: true })).toBe(false);
    expect(idleGlanceEligible({ ...ELIGIBLE, assetReady: false })).toBe(false);
  });
});
