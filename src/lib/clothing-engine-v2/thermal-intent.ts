/**
 * Motor 2.0 — termisk behov FØR plagg (design-spec §9).
 *
 * Output er kun behov + forklaringskoder — aldri plaggtekst eller
 * materialvalg (invariant 8). Material- og plaggresolver kjører etterpå.
 *
 * Terskler gjenbrukes EKSAKT fra legacy for å hindre drift (validerings-
 * spec §6): bandForTemp() uendret; regn ≥ 0,5 mm/t; vindskall ved
 * ≥ 5 m/s + feels < 16 °C; hansker ved feels < 10 °C (legacy kjolig-bånd
 * har tynne votter); vognpose ved feels < 5 °C; sol per exposure.ts.
 */

import { bandForTemp } from '../wool-layers/tables.js';
import { ageStageFor } from './age.js';
import { SITUATION_PROFILES } from './situations.js';
import { deriveExposure } from './exposure.js';
import type {
  ActivityIntensity,
  EquipmentNeed,
  ExplanationCode,
  TempBand,
  ThermalIntent,
  ValidatedRecommendInputV2,
  WarmthLevel,
} from './types.js';

/** Grunnvarme per bånd — kaldere bånd er alltid ≥ varmere bånd (monotoni). */
const BASE_WARMTH: Record<TempBand, WarmthLevel> = {
  ekstrem_varme: 0,
  tropisk: 0,
  varm: 1,
  mild: 1,
  kjolig: 2,
  kald: 2,
  frost: 3,
  streng_frost: 4,
  ekstrem: 4,
};

/** Intensitetsdelta per engine-2-plan Task 4: aktivitet reduserer behovet. */
const INTENSITY_DELTA: Record<ActivityIntensity, -1 | 0 | 1> = {
  active: -1,
  mixed: 0,
  resting: 1,
};

function clampWarmth(n: number): WarmthLevel {
  return Math.max(0, Math.min(4, n)) as WarmthLevel;
}

export function calculateThermalIntent(input: ValidatedRecommendInputV2): ThermalIntent {
  const ageStage = ageStageFor(input.ageMonths);
  const profile = SITUATION_PROFILES[input.situation];
  const exposure = deriveExposure(input);
  const tempBand = bandForTemp(input.weather.feelsLikeC);
  const outdoor = exposure.kind === 'outdoor';
  const codes: ExplanationCode[] = [];

  const baseWarmth = BASE_WARMTH[tempBand];
  const delta = INTENSITY_DELTA[profile.intensity];
  if (outdoor && delta === -1) codes.push('ACTIVE_CHILD_LESS_INSULATION');
  if (outdoor && delta === 1) codes.push('RESTING_CHILD_MORE_INSULATION');

  // Bæresele innenfor jakka (G04): foreldrekroppen varmer, jakka er skallet.
  const underParentJacket =
    input.situation === 'carrier' && input.carrierUnderParentJacket === true;

  let insulationWarmth = outdoor
    ? clampWarmth(baseWarmth + delta)
    : baseWarmth;
  if (underParentJacket) {
    insulationWarmth = clampWarmth(insulationWarmth - 1);
  }

  // Værbeskyttelse — uavhengig av isolasjonsvarme (engine-2-plan Task 4).
  const needsWaterproofShell = outdoor && !underParentJacket && input.weather.precipMmH >= 0.5;
  if (needsWaterproofShell) codes.push('RAIN_REQUIRES_SHELL');

  const needsWindShell =
    outdoor && !underParentJacket
    && input.weather.windMs >= 5
    && input.weather.feelsLikeC < 16;
  if (needsWindShell) codes.push('WIND_REQUIRES_SHELL');

  const needsSunProtection = exposure.needsSunProtection;

  // Kroppsdel-behov — resolveren velger varmenivå og håndhever aldersregler.
  const needsHeadwear = outdoor;
  const needsHandwear = outdoor && input.weather.feelsLikeC < 10;
  const needsFootwear = outdoor;

  // Utstyr (aldri klær på barnet — invariant 5). Legacy-terskler.
  const equipment: EquipmentNeed[] = [];
  if (outdoor && input.situation === 'stroller_awake') {
    if (input.weather.precipMmH >= 0.5) equipment.push('stroller_rain_cover');
    if (input.weather.feelsLikeC < 5) equipment.push('stroller_warm_pouch');
  }
  if (outdoor && input.carSeat === true) equipment.push('car_seat_pouch');

  return {
    ageStage,
    situation: input.situation,
    intensity: profile.intensity,
    tempBand,
    baseWarmth,
    insulationWarmth,
    needsWindShell,
    needsWaterproofShell,
    needsSunProtection,
    needsHeadwear,
    needsHandwear,
    needsFootwear,
    equipment,
    explanationCodes: codes,
  };
}
