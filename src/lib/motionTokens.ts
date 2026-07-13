/**
 * Motion tokens — ett sted å justere alle animasjons-verdier.
 * Per Sivert-spec: «All animation values (durations, stiffness, stagger)
 * go in a single motionTokens.ts so they can be tuned in one place.»
 */

export const motion = {
  // Pin entrance — Phase 1
  pinEnter: {
    stiffness: 300,
    damping: 22,
    staggerMs: 120,  // hver pin starter 120ms etter forrige
  },

  // Pin breathing pulse (idle) — Phase 1.5
  // staggerMs økt fra 300 → 550 for å desynkronisere pust per pin (Fable 5-funn K11):
  // synkron pust ble visuelt masete. 550ms gjør at hver pin er på ulik fase
  // til enhver tid uten å bli pulserende støy.
  pinPulse: {
    durationMs: 2400,
    scaleFrom: 1.0,
    scaleTo: 1.06,
    staggerMs: 550,
  },

  // Bottom sheet slide-up — Phase 1
  sheetSlide: {
    stiffness: 320,
    damping: 30,
    dragDismissThreshold: 80,  // px drag før vi lukker
  },

  // Layer glow når sheet er åpen — Phase 1
  layerGlow: {
    fadeInMs: 300,
    width: 2,
  },

  // Layer peel — Phase 2
  // A11y-lead-spec: fadedOpacity hevet fra 0.12 til 0.65 så pin/chip
  // forblir over WCAG 1.4.11 non-text contrast-grensen (3:1) på
  // paper-bakgrunn. 0.12 ville klippe terra-pin under 1.5:1.
  layerPeel: {
    durationMs: 350,
    fadedOpacity: 0.65,
    shiftPx: 6,
  },

  // Dress-up entrance — Phase 3
  dressUp: {
    stiffness: 260,
    damping: 20,
    perLayerMs: 450,
    settleY: 4,
    totalMaxMs: 2200,
  },

  // Reduced-motion fallback — alle animasjoner blir simpel opacity-fade
  reduced: {
    fadeMs: 150,
  },

  // Easing-kurver
  ease: {
    standard: [0.22, 1, 0.36, 1] as [number, number, number, number],
    easeOut: [0.16, 1, 0.3, 1] as [number, number, number, number],
  },
} as const;

export function isReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
