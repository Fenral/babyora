/**
 * Phase 4 — comfort-feedback.
 *
 * Mapper Recommendation + layerScore → en av tre states:
 *  - 'comfortable' (default): passe kledd
 *  - 'cold': risikerer å være kald (severity HIGH/CRITICAL i kald retning)
 *  - 'warm': risikerer overheating (severity HIGH/CRITICAL i varm retning)
 *
 * Brukes til å vise ComfortBadge over avatar.
 */

import type { Recommendation } from './wool-layers/types.js';

export type ComfortState = 'comfortable' | 'cold' | 'warm';

const COLD_BANDS = new Set(['kald', 'frost', 'streng_frost', 'ekstrem']);
const WARM_BANDS = new Set(['tropisk', 'varmt']);

export function comfortFromRecommendation(
  rec: Recommendation,
  layerScore: 1 | 2 | 3 | 4,
): ComfortState {
  const sev = rec.severity ?? 'INFO';
  if (sev !== 'HIGH' && sev !== 'CRITICAL') return 'comfortable';

  // Severity er trigget — sjekk om det er warm- eller cold-side
  // Ved overoppheting (varme bånd + høy layerScore) → warm
  // Ved kulde (kalde bånd + lav layerScore) → cold
  const band = rec.tempBand;
  if (WARM_BANDS.has(band)) return 'warm';
  if (COLD_BANDS.has(band) && layerScore <= 2) return 'cold';

  // Sikkerhets-flags kan trigge HIGH selv uten temp-issue (f.eks. HB-snorbruk).
  // Da regnes det ikke som comfort-issue.
  return 'comfortable';
}

export const COMFORT_TEXT: Record<ComfortState, { short: string; long: string; icon: 'smile' | 'thermo-down' | 'thermo-up' }> = {
  comfortable: {
    short: 'Passe kledd',
    long: 'Komfortabelt kledd for værforholdene.',
    icon: 'smile',
  },
  cold: {
    short: 'Kan bli kald',
    long: 'Litt for kaldt — vurder ekstra lag.',
    icon: 'thermo-down',
  },
  warm: {
    short: 'Kan bli for varm',
    long: 'Litt for varmt — vurder å fjerne lag.',
    icon: 'thermo-up',
  },
};
