/**
 * data-temp-aksen for canvas-bakgrunnen (kald/mild/varm).
 *
 * R3 (2026-07-14): flyttet ut av HjemScreen.tsx (react-refresh krever at
 * komponentfiler kun eksporterer komponenter). Delt av HjemScreen og
 * PaakledningScreen (F83 M1: samme akse → sømløs cross-fade).
 *
 * Egne terskler (ikke wool-layers TempBand) — dette er en UI-canvas-akse,
 * separat fra motorens finmaskede tempBand-inndeling.
 */

const TEMP_AXIS_COLD_MAX = 5;
const TEMP_AXIS_WARM_MIN = 18;

export type TempAxis = 'kald' | 'mild' | 'varm';

/** data-temp-verdi fra feels-like (fallback: faktisk temp). Bytte KUN ved
 *  båndgrense. */
export function tempAxisFor(feelsLikeC: number | undefined | null, tempC: number | undefined | null): TempAxis {
  const t = feelsLikeC ?? tempC;
  if (t === undefined || t === null || Number.isNaN(t)) return 'mild';
  if (t < TEMP_AXIS_COLD_MAX) return 'kald';
  if (t > TEMP_AXIS_WARM_MIN) return 'varm';
  return 'mild';
}
