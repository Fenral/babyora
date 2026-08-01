/**
 * MascotIdle.tsx — structural + source-text contract tests. No jsdom in
 * this repo (see FinnAntrekkScreen.prefill.test.tsx's own header doc) —
 * renderToStaticMarkup never runs effects, so the actual TIMED glance
 * choreography (timers, pointerdown/scroll/visibilitychange listeners,
 * dialog/keyboard/resume-cooldown re-checks) isn't reachable here; that
 * logic is instead covered directly, without any rendering, by
 * mascot-idle.test.ts's pure-function tests. What IS reachable and tested
 * here: the initial SSR render (always the normal pose — no timer has ever
 * fired) and the WIRING contract (source-text), same convention
 * OpeningSequence.test.tsx / HjemMonter.p5-wiring.test.ts already use in
 * this repo.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MascotIdle } from '../MascotIdle.js';

function source(): string {
  return readFileSync(resolve(process.cwd(), 'src/components/hjem/MascotIdle.tsx'), 'utf8');
}

describe('MascotIdle — initial render (SSR-observable: no timer has fired yet)', () => {
  it('renders MascotPeek pinned to pose="normal" regardless of reducedMotion (a glance never starts synchronously at mount) — the scan-reserved curious pose is never touched here', () => {
    const withMotion = renderToStaticMarkup(<MascotIdle reducedMotion={false} />);
    const noMotion = renderToStaticMarkup(<MascotIdle reducedMotion={true} />);
    expect(withMotion).toContain('data-pose="normal"');
    expect(noMotion).toContain('data-pose="normal"');
    expect(withMotion).not.toContain('data-pose="curious"');
  });

  it('renders its own dedicated glance overlay (maskot-glimt.png), initially invisible (data-glancing="false")', () => {
    const html = renderToStaticMarkup(<MascotIdle reducedMotion={false} />);
    expect(html).toContain('/monter/maskot-glimt.png');
    expect(html).toContain('data-glancing="false"');
    expect(html).toContain('class="hjm-mascot hjm-mascot-glance"');
  });

  it('MascotPeek\'s curious-pose image (maskot-nysgjerrig.png) is present in the DOM (Del 3\'s two-always-mounted-images design) but pinned inactive (pose="normal"), never confused with the glance overlay above', () => {
    const html = renderToStaticMarkup(<MascotIdle reducedMotion={false} />);
    expect(html).toContain('/monter/maskot-nysgjerrig.png');
    expect(html).toContain('class="hjm-mascot hjm-mascot-curious"');
  });

  it('is otherwise structurally identical to a bare <MascotPeek/> (non-compact, both MascotPeek poses stamped in the DOM)', () => {
    const idle = renderToStaticMarkup(<MascotIdle reducedMotion={false} />);
    expect(idle).toContain('/monter/maskot.png');
    expect(idle).toContain('data-compact="false"');
  });

  it('never renders a <video> or references the retired idle-loop mp4', () => {
    const idle = renderToStaticMarkup(<MascotIdle reducedMotion={false} />);
    expect(idle).not.toContain('<video');
    expect(idle).not.toContain('.mp4');
  });
});

describe('MascotIdle — asset-readiness build-time gate (ekstern review 2026-08-01)', () => {
  it('declares a GLANCE_ASSET_READY gate that NEVER falls back to the scan-reserved curious pose if the dedicated asset is unavailable', () => {
    const contents = source();
    expect(contents).toContain('const GLANCE_ASSET_READY = true;');
    expect(contents).toContain('GLANCE_ASSET_READY &&');
  });
});

describe('MascotIdle — timing/eligibility wiring (source-text contract)', () => {
  it('imports its glance timing/eligibility from the pure mascot-idle.ts module, never inlining Math.random()/Date.now() bounds itself', () => {
    const contents = source();
    expect(contents).toContain("from './mascot-idle.js'");
    expect(contents).toContain('idleGlanceDelayMs(');
    expect(contents).toContain('idleGlanceEligible(');
  });

  it('re-checks eligibility at the moment a scheduled attempt actually fires, and reschedules (never silently gives up) when a guard fails', () => {
    const contents = source();
    expect(contents).toContain('if (!currentlyEligible()) {');
    expect(contents).toContain("scheduleGlanceRef.current('rest');");
  });

  it('enforces the max-two-glances-per-foreground-session budget (runde 8): counted at fire, quiet when spent, reset only on tab-return', () => {
    const contents = source();
    expect(contents).toContain('glanceCountRef.current >= MAX_GLANCES_PER_SESSION');
    expect(contents).toContain('glanceCountRef.current += 1;');
    expect(contents).toContain('glanceCountRef.current = 0;');
  });

  it('schedules the very first glance attempt with the "first" window, and re-arms with "first" after any interaction or tab-return', () => {
    const contents = source();
    expect(contents).toContain("scheduleGlance('first')");
  });

  it('avoids a self-recursive callback reference (react-hooks/immutability) via a ref-mirrored indirection, synced from an effect', () => {
    const contents = source();
    expect(contents).toContain('const scheduleGlanceRef = useRef<(window_: IdleGlanceWindow) => void>(() => {});');
    expect(contents).toContain('scheduleGlanceRef.current = scheduleGlance;');
  });

  it('listens for pointerdown/scroll (interaction reset) and visibilitychange (backgrounded tab pause), passive listeners', () => {
    const contents = source();
    expect(contents).toContain("addEventListener('pointerdown', handleInteraction, { passive: true })");
    expect(contents).toContain("addEventListener('scroll', handleInteraction, { passive: true })");
    expect(contents).toContain("addEventListener('visibilitychange', handleVisibility)");
  });

  it('arms a 30s post-resume cooldown when the tab becomes visible again', () => {
    const contents = source();
    expect(contents).toContain('resumeCooldownUntilRef.current = Date.now() + RESUME_COOLDOWN_MS;');
  });

  it('detects an open native <dialog> (the same pattern every sheet/paywall in this codebase uses) as a cancellation guard', () => {
    const contents = source();
    expect(contents).toContain("document.querySelector('dialog[open]')");
  });

  it('detects a likely-open software keyboard via visualViewport as a cancellation guard', () => {
    const contents = source();
    expect(contents).toContain('window.visualViewport');
  });

  it('reduced motion strictly gates every timer — never armed, pose forced back to normal', () => {
    const contents = source();
    expect(contents).toContain('if (reducedMotion || !GLANCE_ASSET_READY) {');
    expect(contents).toContain('setGlancing(false)');
  });

  it('never imports lib/haptics — a resting glance is silent, no haptic feedback', () => {
    const contents = source();
    expect(contents).not.toMatch(/from ['"].*lib\/haptics/);
  });
});
