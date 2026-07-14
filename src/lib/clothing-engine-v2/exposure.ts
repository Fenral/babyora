/**
 * Motor 2.0 — eksponeringskontekst.
 * Avleder ute/inne, soltrykk og eksponeringstid fra validert input.
 * Terskler gjenbrukes eksakt fra legacy modifiers.ts (solsymbol-regex,
 * sol ved feels ≥ 10, UV ≥ 6) — ingen drift uten faglig beslutning.
 */

import { SITUATION_PROFILES } from './situations.js';
import type { ValidatedRecommendInputV2 } from './types.js';

export type ExposureContext = {
  kind: 'outdoor' | 'indoor';
  /** Planlagt eksponering i minutter (default 60, som legacy). */
  exposureMin: number;
  /** Klarvær/lettskyet symbol — samme regex som legacy. */
  isSunSymbol: boolean;
  /** Solbeskyttelse kreves: sol + feels ≥ 10 °C, eller UV-indeks ≥ 6. */
  needsSunProtection: boolean;
};

const SUN_SYMBOL_RE = /^(clearsky|fair|partlycloudy)/;

export function deriveExposure(input: ValidatedRecommendInputV2): ExposureContext {
  const kind = SITUATION_PROFILES[input.situation].exposureKind;
  const isSunSymbol = input.weather.symbolCode
    ? SUN_SYMBOL_RE.test(input.weather.symbolCode)
    : false;
  const needsSunProtection =
    kind === 'outdoor'
    && ((isSunSymbol && input.weather.feelsLikeC >= 10)
      || (input.weather.uvIndex !== undefined && input.weather.uvIndex >= 6));
  return {
    kind,
    exposureMin: input.exposureMin ?? 60,
    isSunSymbol,
    needsSunProtection,
  };
}
