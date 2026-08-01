/**
 * OpeningSequence — P10/JOB1 (docs/design-notes/aapningssekvens-2026-08-01.md):
 * the A+B-hybrid app-open reveal. Renders ONLY the two extra mascot layers
 * (body BEHIND the panel, hands IN FRONT of it) + the monter-light edge
 * sweep as siblings of the always-mounted `MascotPeek`/`WeatherScene` —
 * see HjemMonter.tsx's own wiring comment for why this layout (rather than
 * wrapping the panel) is what guarantees the pixel-identical hand-off.
 *
 * `panelRef` points at HjemMonter's own `.hjm-panel-lift-wrap` (a plain,
 * ALWAYS-rendered div around `<WeatherScene/>`, present whether or not the
 * sequence is playing) — this component drives its WAAPI lift animation
 * directly via the ref rather than wrapping/owning it, so `<WeatherScene/>`
 * itself never remounts across the opening→normal hand-off (its DOM
 * identity, and therefore any control the user happens to tap mid-
 * sequence, is completely undisturbed by this component mounting/
 * unmounting).
 *
 * Production path (spec's own "byråvalg"): layered PNG assets (cut from
 * the SAME maskot.png along the alpha-measured fingertip line — see
 * tools/split-mascot-layers.mjs) + CSS/WAAPI. Only transform/opacity are
 * animated (never layout-triggering properties).
 *
 * Prohibitions honoured here: no panel-colouring/checkmark/"calculation"
 * (that belongs to the scan choreography, scan-orchestration.ts/
 * ScanOverlay.tsx — untouched by this file), no haptics on the automatic
 * open (nothing in this file calls lib/haptics.ts).
 *
 * Idle-loop (duel §4) — NOT integrated by this package. TODO hook: once
 * built, it should start `IDLE_LOOP_MIN_DELAY_MS`–`IDLE_LOOP_MAX_DELAY_MS`
 * (opening-sequence.ts) after the LAST user interaction on Hjem, and must
 * itself be suspended for the same reasons MascotPeek/this sequence
 * already respect (reducedMotion, backgrounded tab, Low Power Mode) — see
 * the HjemMonter.tsx call site for exactly where that hook would attach.
 */
import { useCallback, useEffect, useRef, type ReactElement, type RefObject } from 'react';
import './hjem-monter.css';
import {
  COLD_EDGE_LIGHT_END_MS,
  COLD_MASCOT_SETTLE_PX,
  COLD_PANEL_LIFT_END_MS,
  COLD_PANEL_LIFT_PX,
  COLD_TOTAL_MS,
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
  HANDS_LAND_RISE_PX,
  MASCOT_RISE_EASING,
  SETTLE_PX,
  type OpeningVariant,
} from './opening-sequence.js';

const MASCOT_BODY_SRC = `${import.meta.env.BASE_URL}monter/maskot-body.png`;
const MASCOT_HANDS_SRC = `${import.meta.env.BASE_URL}monter/maskot-hands.png`;

export type OpeningSequenceProps = Readonly<{
  variant: Exclude<OpeningVariant, 'none'>;
  reducedMotion: boolean;
  onComplete: () => void;
  panelRef: RefObject<HTMLDivElement | null>;
}>;

/** Fraction offset (0..1) of a duration window — small local helper, keeps the keyframe lists below readable. */
function frac(atMs: number, windowStartMs: number, windowDurationMs: number): number {
  if (windowDurationMs <= 0) return 0;
  return Math.max(0, Math.min(1, (atMs - windowStartMs) / windowDurationMs));
}

export function OpeningSequence({ variant, reducedMotion, onComplete, panelRef }: OpeningSequenceProps): ReactElement | null {
  const bodyRef = useRef<HTMLImageElement | null>(null);
  const handsRef = useRef<HTMLImageElement | null>(null);
  const edgeLightRef = useRef<HTMLSpanElement | null>(null);
  const animationsRef = useRef<Animation[]>([]);
  const completedRef = useRef(false);
  // react-hooks/refs: a ref can never be read/written during render itself
  // — only in effects/handlers (same pattern as HjemMonter.tsx's own
  // currentResultKeyRef). `complete` (below) needs the LATEST onComplete
  // whenever it fires (often long after the render that scheduled it), so
  // it's kept in sync via an effect.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const complete = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    for (const anim of animationsRef.current) {
      try { anim.finish(); } catch { /* already finished/cancelled — harmless */ }
    }
    animationsRef.current = [];
    onCompleteRef.current();
  }, []);

  // Tap anywhere (duel spec): "Berøring når som helst hopper rett til
  // resultat" — here, straight to the finished frame. Document-level
  // pointerdown, CAPTURE phase, so it fires BEFORE the actual target's own
  // handlers — and deliberately never calls preventDefault/stopPropagation,
  // so whatever the user tapped (the "Finn dagens antrekk" CTA, the
  // location pill, …) still receives its normal pointerup/click afterward.
  useEffect(() => {
    if (reducedMotion) {
      complete();
      return;
    }
    const handlePointerDown = () => complete();
    document.addEventListener('pointerdown', handlePointerDown, { capture: true });
    return () => document.removeEventListener('pointerdown', handlePointerDown, { capture: true });
  }, [complete, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return; // already completed synchronously above
    const body = bodyRef.current;
    const hands = handsRef.current;
    const edgeLight = edgeLightRef.current;
    const panel = panelRef.current;
    if (!body || !hands || !edgeLight || !panel) {
      complete();
      return;
    }

    const anims: Animation[] = [];

    if (variant === 'first-ever') {
      const panelWindow = FIRST_EVER_PANEL_LIFT_END_MS - FIRST_EVER_PANEL_LIFT_START_MS;
      anims.push(panel.animate(
        [
          { transform: `translateY(${FIRST_EVER_PANEL_LIFT_PX}px)` },
          { transform: 'translateY(0)' },
        ],
        { duration: panelWindow, delay: FIRST_EVER_PANEL_LIFT_START_MS, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' },
      ));
      anims.push(edgeLight.animate(
        [
          { opacity: 0, transform: 'translateX(-30%)' },
          { opacity: 1, transform: 'translateX(0%)', offset: 0.5 },
          { opacity: 0, transform: 'translateX(30%)' },
        ],
        { duration: panelWindow, delay: FIRST_EVER_PANEL_LIFT_START_MS, easing: 'ease-out', fill: 'both' },
      ));

      // Body: rise (180–720ms) → hold → 2px settle bounce (820–900ms),
      // expressed as ONE animation spanning 180–900ms so the settle
      // composes on top of the same element's own transform (a separate
      // .animate() call on a group wrapper would trap body/hands into a
      // shared stacking context and break the behind/in-front sandwich —
      // see this file's header comment on why body+hands are independent
      // siblings, not a shared group).
      const bodyWindow = FIRST_EVER_SETTLE_END_MS - FIRST_EVER_MASCOT_RISE_START_MS;
      anims.push(body.animate(
        [
          { offset: 0, transform: `translateY(${FIRST_EVER_MASCOT_RISE_PX}px) rotate(${FIRST_EVER_MASCOT_RISE_ROTATION_DEG}deg)`, opacity: 0 },
          { offset: frac(FIRST_EVER_MASCOT_RISE_END_MS, FIRST_EVER_MASCOT_RISE_START_MS, bodyWindow), transform: 'translateY(0) rotate(0deg)', opacity: 1 },
          { offset: frac(FIRST_EVER_SETTLE_START_MS, FIRST_EVER_MASCOT_RISE_START_MS, bodyWindow), transform: 'translateY(0) rotate(0deg)', opacity: 1 },
          { offset: frac((FIRST_EVER_SETTLE_START_MS + FIRST_EVER_SETTLE_END_MS) / 2, FIRST_EVER_MASCOT_RISE_START_MS, bodyWindow), transform: `translateY(${SETTLE_PX}px) rotate(0deg)`, opacity: 1 },
          { offset: 1, transform: 'translateY(0) rotate(0deg)', opacity: 1 },
        ],
        { duration: bodyWindow, delay: FIRST_EVER_MASCOT_RISE_START_MS, easing: MASCOT_RISE_EASING, fill: 'both' },
      ));

      // Hands: land (620–820ms) → 2px settle bounce (820–900ms).
      const handsWindow = FIRST_EVER_SETTLE_END_MS - FIRST_EVER_HANDS_LAND_START_MS;
      anims.push(hands.animate(
        [
          { offset: 0, transform: `translateY(${HANDS_LAND_RISE_PX}px)`, opacity: 0 },
          { offset: frac(FIRST_EVER_HANDS_LAND_END_MS, FIRST_EVER_HANDS_LAND_START_MS, handsWindow), transform: 'translateY(0)', opacity: 1 },
          { offset: frac((FIRST_EVER_SETTLE_START_MS + FIRST_EVER_SETTLE_END_MS) / 2, FIRST_EVER_HANDS_LAND_START_MS, handsWindow), transform: `translateY(${SETTLE_PX}px)`, opacity: 1 },
          { offset: 1, transform: 'translateY(0)', opacity: 1 },
        ],
        { duration: handsWindow, delay: FIRST_EVER_HANDS_LAND_START_MS, easing: MASCOT_RISE_EASING, fill: 'both' },
      ));

      animationsRef.current = anims;
      const timer = window.setTimeout(complete, FIRST_EVER_TOTAL_MS);
      return () => {
        window.clearTimeout(timer);
        for (const anim of anims) anim.cancel();
      };
    }

    // 'cold' — later cold starts: short, no full climb. Body+hands are
    // already in place (opacity 1 throughout, no separate landing beat) —
    // just a small joint settle + a brief panel lift + edge light.
    anims.push(panel.animate(
      [{ transform: `translateY(${COLD_PANEL_LIFT_PX}px)` }, { transform: 'translateY(0)' }],
      { duration: COLD_PANEL_LIFT_END_MS, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'both' },
    ));
    anims.push(edgeLight.animate(
      [{ opacity: 0 }, { opacity: 0.9, offset: 0.5 }, { opacity: 0 }],
      { duration: COLD_EDGE_LIGHT_END_MS, easing: 'ease-out', fill: 'both' },
    ));
    const coldMascotKeyframes = (px: number): Keyframe[] => [
      { transform: `translateY(${px}px)`, opacity: 1 },
      { transform: 'translateY(0)', opacity: 1 },
    ];
    anims.push(body.animate(coldMascotKeyframes(COLD_MASCOT_SETTLE_PX), { duration: COLD_TOTAL_MS, easing: MASCOT_RISE_EASING, fill: 'both' }));
    anims.push(hands.animate(coldMascotKeyframes(COLD_MASCOT_SETTLE_PX), { duration: COLD_TOTAL_MS, easing: MASCOT_RISE_EASING, fill: 'both' }));

    animationsRef.current = anims;
    const timer = window.setTimeout(complete, COLD_TOTAL_MS);
    return () => {
      window.clearTimeout(timer);
      for (const anim of anims) anim.cancel();
    };
  }, [variant, reducedMotion, complete, panelRef]);

  if (reducedMotion) return null;

  return (
    <>
      <img
        ref={bodyRef}
        className="hjm-opening-mascot-body"
        src={MASCOT_BODY_SRC}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <img
        ref={handsRef}
        className="hjm-opening-mascot-hands"
        src={MASCOT_HANDS_SRC}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <span ref={edgeLightRef} className="hjm-opening-edge-light" aria-hidden="true" />
    </>
  );
}
