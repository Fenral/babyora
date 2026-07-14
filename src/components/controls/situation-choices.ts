/**
 * Motor 2.0 Task 15 — ren valglogikk for situasjonsvelgeren (spec §15.2).
 * Egen fil (react-refresh: komponentfiler eksporterer kun komponenter).
 */

import { ageStageFor } from '../../lib/clothing-engine-v2/age.js';
import { SITUATION_PROFILES } from '../../lib/clothing-engine-v2/situations.js';
import type { AgeStage, Situation } from '../../lib/clothing-engine-v2/types.js';

/** Primærvalg per stadium (spec §15.2) — maks tre, i visningsrekkefølge. */
const PRIMARY: Record<AgeStage, Situation[]> = {
  newborn: ['stroller_awake', 'carrier', 'awake_low_mobility'],
  mobile_baby: ['stroller_awake', 'carrier', 'awake_low_mobility'],
  young_toddler: ['active_play', 'stroller_awake', 'mixed_day'],
};

export type SituationChoices = {
  stage: AgeStage;
  primary: Situation[];
  secondary: Situation[];
};

/** Sekundær = gyldig for stadiet, ikke primær, aldri indoor_sleep (eget verktøy). */
export function situationChoicesFor(ageMonths: number): SituationChoices {
  const stage = ageStageFor(ageMonths);
  const primary = PRIMARY[stage];
  const secondary = (Object.values(SITUATION_PROFILES))
    .filter((p) => p.id !== 'indoor_sleep'
      && p.validAgeStages.includes(stage)
      && !primary.includes(p.id))
    .map((p) => p.id);
  return { stage, primary, secondary };
}
