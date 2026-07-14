/**
 * Motor 2.0 — aldersmodell (design-spec §6).
 * Grensene er produktgrenser, ikke påstander om individuell utvikling.
 * `canRoll` beholdes for spedbarnssikkerhet og påvirker ikke stadiet.
 */

import { EngineV2Error } from './errors.js';
import type { AgeStage } from './types.js';

export function ageStageFor(ageMonths: number): AgeStage {
  if (!Number.isFinite(ageMonths) || ageMonths < 0 || ageMonths >= 25) {
    throw new EngineV2Error('unsupported_age', 'Motor 2.0 v1 støtter alder 0–24 måneder');
  }
  if (ageMonths < 6) return 'newborn';
  if (ageMonths < 12) return 'mobile_baby';
  return 'young_toddler';
}
