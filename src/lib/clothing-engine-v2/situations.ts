/**
 * Motor 2.0 — situasjonsmodell (design-spec §7).
 * Eksplisitte, frosne profiler: intensitet driver isolasjonsdelta (Task 4),
 * eksponering skiller ute-modifikatorer fra søvn/TOG-verktøyet.
 * UI viser bare gyldige valg; ugyldig kombinasjon avvises i validering.
 */

import type { Activity, AgeStage, Situation, SituationProfile } from './types.js';

const ALL_STAGES: readonly AgeStage[] = ['newborn', 'mobile_baby', 'young_toddler'];

function profile(p: SituationProfile): Readonly<SituationProfile> {
  return Object.freeze({ ...p, validAgeStages: Object.freeze([...p.validAgeStages]) as AgeStage[] });
}

export const SITUATION_PROFILES: Readonly<Record<Situation, Readonly<SituationProfile>>> = Object.freeze({
  stroller_awake: profile({
    id: 'stroller_awake', intensity: 'resting',
    validAgeStages: [...ALL_STAGES], exposureKind: 'outdoor',
  }),
  stroller_sleeping: profile({
    id: 'stroller_sleeping', intensity: 'resting',
    validAgeStages: [...ALL_STAGES], exposureKind: 'outdoor',
  }),
  carrier: profile({
    // 12–24 er «etter eksplisitt valg» (spec §7) — gyldig input, UI-nedprioritert.
    id: 'carrier', intensity: 'resting',
    validAgeStages: [...ALL_STAGES], exposureKind: 'outdoor',
  }),
  awake_low_mobility: profile({
    id: 'awake_low_mobility', intensity: 'resting',
    validAgeStages: ['newborn', 'mobile_baby'], exposureKind: 'outdoor',
  }),
  active_play: profile({
    id: 'active_play', intensity: 'active',
    validAgeStages: ['mobile_baby', 'young_toddler'], exposureKind: 'outdoor',
  }),
  calm_outdoors: profile({
    id: 'calm_outdoors', intensity: 'resting',
    validAgeStages: ['young_toddler'], exposureKind: 'outdoor',
  }),
  mixed_day: profile({
    id: 'mixed_day', intensity: 'mixed',
    validAgeStages: ['young_toddler'], exposureKind: 'outdoor',
  }),
  indoor_sleep: profile({
    id: 'indoor_sleep', intensity: 'resting',
    validAgeStages: [...ALL_STAGES], exposureKind: 'indoor',
  }),
});

const SITUATION_TO_ACTIVITY: Readonly<Record<Situation, Activity>> = Object.freeze({
  stroller_awake: 'vogn',
  stroller_sleeping: 'vogn',
  carrier: 'baeresele',
  awake_low_mobility: 'utelek',
  active_play: 'utelek',
  calm_outdoors: 'utelek',
  mixed_day: 'utelek',
  indoor_sleep: 'soevn',
});

export function activityForSituation(situation: Situation): Activity | null {
  return SITUATION_TO_ACTIVITY[situation] ?? null;
}

export function isSituationValidForStage(situation: Situation, stage: AgeStage): boolean {
  const p = SITUATION_PROFILES[situation] as SituationProfile | undefined;
  return p !== undefined && p.validAgeStages.includes(stage);
}
