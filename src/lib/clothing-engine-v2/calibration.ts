/**
 * Motor 2.0 — per-barn-kalibrering (design-spec §11, G30/G31).
 *
 * Kalibrering justerer det TERMISKE BEHOVET maks ±1 trinn FØR material- og
 * plaggvalg — i motsetning til legacy, der kalibrering muterte ferdige
 * plagglister etter safety. Sikkerhetsreglene (Task 8) kjører på det ferdige,
 * kalibrerte antrekket og kan alltid overstyre.
 *
 * Værbeskyttelse (skall/sol) og utstyr røres aldri (invariant 4).
 */

import type { ThermalIntent, WarmthLevel } from './types.js';

function clampWarmth(n: number): WarmthLevel {
  return Math.max(0, Math.min(4, n)) as WarmthLevel;
}

export function applyThermalCalibration(
  intent: ThermalIntent,
  bias: -1 | 0 | 1,
): ThermalIntent {
  if (bias === 0) return intent;
  return {
    ...intent,
    equipment: [...intent.equipment],
    insulationWarmth: clampWarmth(intent.insulationWarmth + bias),
    explanationCodes: [
      ...intent.explanationCodes,
      bias === 1 ? 'CALIBRATION_WARMER' : 'CALIBRATION_COOLER',
    ],
  };
}
