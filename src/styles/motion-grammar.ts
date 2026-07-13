/**
 * Babyora Motion Grammar (F26, 2026-06-18)
 *
 * Felles motion-system for hele appen. Hver UI-state-overgang skal
 * referere til en av disse konstantene — aldri inline cubic-bezier
 * eller hardkodet ms.
 *
 * Per Copilot's feedback: "Motion system må være et produktnivå-system,
 * ikke én kul avatar."
 *
 * Curves er Emil-design-eng's anbefalte instrument-easings.
 */

export const MOTION = {
  /** ─── Easing curves ─── */
  easeOut: 'cubic-bezier(0.22, 1, 0.36, 1)',          // standard UI transitions
  easeOutSoft: 'cubic-bezier(0.16, 1, 0.3, 1)',       // entry stagger
  easeOutExpo: 'cubic-bezier(0.19, 1, 0.22, 1)',      // CTA, sheet exit
  iosDrawer: 'cubic-bezier(0.32, 0.72, 0, 1)',        // segmented slider, sheet enter
  natural: 'cubic-bezier(0.4, 0, 0.2, 1)',            // generic, last-resort

  /** ─── Durations (ms) ─── */
  press: 160,             // CTA + button press scale-feedback
  hover: 200,             // hover state changes
  tabTap: 200,            // tab-switch
  segSlider: 280,         // segmented control slider
  sheetExit: 280,         // sheet close (Emil: faster than enter)
  sheetEnter: 400,        // sheet open
  toastEnter: 350,        // toast fade-in
  toastExit: 250,         // toast fade-out
  staggerStep: 40,        // per-list-item delay
  staggerMax: 480,        // max total stagger duration

  /** ─── Press-feedback scales ─── */
  scaleCta: 0.997,        // CTA pill press
  scalePill: 0.987,       // glass-pille / chip press
  scaleCard: 0.985,       // card / tappable surface press
  scaleAvatar: 0.965,     // avatar scene tap (signals "scene reacts")

  /** ─── F80b Morgennatt: Hjem-scene tokens ───
   * Kilde: docs/F79/morgennatt-cta-analyse.md + public/design-2026/f79-hjem-a/index.html.
   * dressingStep/dressingLeadIn/sunPulse er ports 1:1 fra mocken (STEP_MS=460,
   * lead-in 220ms, sol-puls 4.5s engangs per a11y-preclearance §1). */
  dressingStep: 460,      // ms per stage-crossfade i påklednings-sekvensen
  dressingLeadIn: 220,    // ms før første stage-step starter
  sunPulse: 4500,         // ms — ENGANGS sol-halo-puls (>5s ville kreve pause-knapp, WCAG 2.2.2)
  tempTick: 300,          // ms — temp-tall "ankomst"-animasjon ved band-bytte
  tempBurst: 700,         // ms — temp-bytte radial-glimt / atmos-lag crossfade
  tempTransition: 600,    // ms — bg/glow/accent-temp CSS-transition (se --dur-temp)
  chipPop: 260,           // ms — lag-chip pop-inn i popup (F80.2-arv, gjenbrukbar)
} as const;

export type MotionToken = keyof typeof MOTION;

/** CSS-utility: standard transitions for common interactions. */
export const TRANSITION = {
  press: `transform ${MOTION.press}ms ${MOTION.easeOut}`,
  hover: `background ${MOTION.hover}ms ${MOTION.easeOut}, color ${MOTION.hover}ms ${MOTION.easeOut}, box-shadow ${MOTION.hover}ms ${MOTION.easeOut}`,
  tab: `background ${MOTION.tabTap}ms ${MOTION.easeOut}, color ${MOTION.tabTap}ms ${MOTION.easeOut}, font-weight 0s, box-shadow ${MOTION.tabTap}ms ${MOTION.easeOut}`,
  segSlider: `transform ${MOTION.segSlider}ms ${MOTION.iosDrawer}`,
  sheet: `transform ${MOTION.sheetEnter}ms ${MOTION.iosDrawer}`,
  fadeIn: `opacity ${MOTION.toastEnter}ms ${MOTION.easeOut}`,
} as const;

/** Per-item stagger delay (ms). Caps at MOTION.staggerMax. */
export function staggerDelay(index: number): number {
  return Math.min(index * MOTION.staggerStep, MOTION.staggerMax);
}

/** Inline-style helper for entry-rise animation. */
export const ENTRY_RISE = (delayMs = 0): React.CSSProperties => ({
  animation: `instr-rise ${MOTION.sheetEnter}ms ${MOTION.easeOutSoft} both`,
  animationDelay: `${delayMs}ms`,
});
