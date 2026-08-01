/**
 * gauge-material.ts — P10.2 (owner redesign, 2026-08-01): pure helpers
 * behind VerticalGauge's "material fills" (each of the three Juster gauges
 * fills with something that reads as its own substance — heat, air, water
 * — rather than an identical flat petrol swatch). Kept dependency-free and
 * DOM-free so it's unit-testable without jsdom (this repo has none — see
 * FinnAntrekkScreen.instrument-panel.test.tsx's own header) and reusable
 * if a future gauge needs the same interpolation.
 *
 * SEMANTIC COLOUR EXCEPTION — documents the deliberate deviation from
 * design-tokens-v2.css's own rule ("Nye komponenter bruker KUN
 * --dw-*-navn, aldri legacy-tokens"): the three hex stops below are DATA
 * colour, not UI colour — they encode "how cold/warm the CHOSEN
 * temperature reads", the same kind of readout design-tokens-v2.css's own
 * colour-ownership table already carves exceptions for ("Plaggfarger =
 * faktisk innhold", "Semantikk = ... alltid med ikon+tekst"). Two of the
 * three stops mirror EXISTING --dw-w-* weather-family tokens (see the
 * per-stop comments below, both theme-constant like the rest of that
 * family); only the warm stop is a genuinely new, non-token hex — see its
 * own comment for why, and for the explicit distance kept from
 * --dw-accent (#D98E5A, CTA amber) so a hot reading can never blur into an
 * interactive/action affordance.
 */

export type GaugeMaterial = 'thermal' | 'air' | 'water';

// Matches instrument-logic.ts's INSTRUMENT_MIN_C/INSTRUMENT_MAX_C exactly
// (not re-imported — this module stays framework/domain-free on purpose;
// gauge-material.test.ts asserts the two files agree).
export const TEMP_COLD_STOP_C = -20;
export const TEMP_MID_STOP_C = 0;
export const TEMP_WARM_STOP_C = 30;

/** -20°C stop — mirrors --dw-w-night ("natt · dypest og roligst", design-
 *  tokens-v2.css), the deepest/coldest member of the weather-family ramp.
 *  Ice-cold end of the instrument, reusing the night/rain family look. */
const TEMP_COLD_HEX = '#0C272D';

/** 0°C stop — mirrors --dw-w-clear ("klart · litt lysere og renere",
 *  design-tokens-v2.css), the family's own "neutral" member. Sits at the
 *  midpoint so the gauge reads as genuinely neutral petrol at 0°C, not
 *  already leaning warm or cold. */
const TEMP_MID_HEX = '#114143';

/**
 * +30°C stop — the ONE non-token hex in this file (see file header).
 * Hue is kept close to --dw-accent's own amber hue (~25°) so the gauge
 * still reads as "warm" rather than jumping to an unrelated colour
 * family, but Lightness/Saturation are pulled well down from it:
 *   --dw-accent (dark mode CTA, #D98E5A) ≈ H25° L60% S63%
 *   this stop                  (#B4713F) ≈ H26° L48% S48%
 * i.e. ~12 L-points darker and ~14 S-points less saturated — a
 * side-by-side comparison never reads as "the same colour", so a hot
 * temperature reading can't be mistaken for the CTA's action colour.
 * Theme-constant (no light-mode override) — same reasoning as the rest of
 * the weather-family ramp: it's a WEATHER reading, not a themed surface.
 */
const TEMP_WARM_HEX = '#B4713F';

function hexToRgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clampByte = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[r, g, b].map((v) => clampByte(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

/** Linear per-channel RGB lerp between two "#RRGGBB" strings. `t` is
 *  clamped to [0,1] so an out-of-range caller still lands on an endpoint. */
export function mixHexColors(fromHex: string, toHex: string, t: number): string {
  const clampedT = Math.max(0, Math.min(1, t));
  const [r1, g1, b1] = hexToRgb(fromHex);
  const [r2, g2, b2] = hexToRgb(toHex);
  return rgbToHex(
    r1 + (r2 - r1) * clampedT,
    g1 + (g2 - g1) * clampedT,
    b1 + (b2 - b1) * clampedT,
  );
}

/**
 * Temperature (°C) → fill colour. Piecewise RGB lerp across the three
 * stops above — cold→mid over [-20,0], mid→warm over [0,30] — a simple
 * RGB lerp per the owner spec ("OKLCH or simple RGB lerp between 3
 * stops"). Clamped to the instrument's own domain so an out-of-range
 * caller still lands on a sane endpoint colour instead of extrapolating.
 */
export function temperatureFillColor(tempC: number): string {
  const clamped = Math.max(TEMP_COLD_STOP_C, Math.min(TEMP_WARM_STOP_C, tempC));
  if (clamped <= TEMP_MID_STOP_C) {
    const t = (clamped - TEMP_COLD_STOP_C) / (TEMP_MID_STOP_C - TEMP_COLD_STOP_C);
    return mixHexColors(TEMP_COLD_HEX, TEMP_MID_HEX, t);
  }
  const t = (clamped - TEMP_MID_STOP_C) / (TEMP_WARM_STOP_C - TEMP_MID_STOP_C);
  return mixHexColors(TEMP_MID_HEX, TEMP_WARM_HEX, t);
}

/** Depth shade for the BOTTOM of a thermal fill (mixed toward black) so
 *  the gradient reads as a material with volume, not a flat swatch — the
 *  TOP of the fill is `temperatureFillColor(tempC)` itself. */
export function temperatureFillDeepColor(tempC: number): string {
  return mixHexColors(temperatureFillColor(tempC), '#000000', 0.24);
}
