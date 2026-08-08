/**
 * Motor 2.0 — inputvalidering.
 * Adferd per design-spec §1 (0–24, avvis 25+), §7 (situasjonsmatrise — UI
 * viser bare gyldige valg; motoren gjetter aldri), §17 (feiltabell).
 */

import { EngineV2Error } from './errors.js';
import { ageStageFor } from './age.js';
import { isSituationValidForStage } from './situations.js';
import type {
  MaterialPreference,
  RecommendInputV2,
  ValidatedRecommendInputV2,
} from './types.js';

const MATERIAL_PREFERENCES: readonly MaterialPreference[] = [
  'best_for_conditions',
  'prefer_wool',
  'prefer_fleece',
  'prefer_cotton',
  'avoid_wool',
];

export function validateRecommendInputV2(input: RecommendInputV2): ValidatedRecommendInputV2 {
  const { weather, ageMonths, situation, materialPreference, childCalibration } = input;

  // Vær — samme krav som legacy-motoren (invalid_number).
  if (!Number.isFinite(weather.feelsLikeC)) {
    throw new EngineV2Error('invalid_number', 'weather.feelsLikeC må være et tall');
  }
  if (!Number.isFinite(weather.tempC)) {
    throw new EngineV2Error('invalid_number', 'weather.tempC må være et tall');
  }
  if (!Number.isFinite(weather.windMs) || weather.windMs < 0) {
    throw new EngineV2Error('invalid_number', 'weather.windMs må være et tall ≥ 0');
  }
  if (!Number.isFinite(weather.precipMmH) || weather.precipMmH < 0) {
    throw new EngineV2Error('invalid_number', 'weather.precipMmH må være et tall ≥ 0');
  }

  // Alder — heltall (invalid_number), deretter produktgrensen 0–24 (unsupported_age).
  if (!Number.isFinite(ageMonths) || !Number.isInteger(ageMonths)) {
    throw new EngineV2Error('invalid_number', 'ageMonths må være et heltall');
  }
  if (ageMonths < 0 || ageMonths >= 25) {
    throw new EngineV2Error('unsupported_age', 'Motor 2.0 v1 støtter alder 0–24 måneder');
  }

  // Situasjon-for-alder — spec §7; ukjent situasjon behandles som ugyldig valg.
  const stage = ageStageFor(ageMonths);
  if (!isSituationValidForStage(situation, stage)) {
    throw new EngineV2Error(
      'invalid_situation_for_age',
      `Situasjonen «${situation}» er ikke gyldig for aldersstadiet ${stage}`,
    );
  }

  // Materialpreferanse — eksplisitt ugyldig verdi er en utviklingsfeil (spec §17).
  if (materialPreference !== undefined && !MATERIAL_PREFERENCES.includes(materialPreference)) {
    throw new EngineV2Error(
      'invalid_material_preference',
      `Ugyldig materialpreferanse: ${String(materialPreference)}`,
    );
  }

  // Kalibrering — motoren applicerer bare; grensene er -1|0|1.
  if (childCalibration !== undefined && ![-1, 0, 1].includes(childCalibration)) {
    throw new EngineV2Error('invalid_number', 'childCalibration må være -1, 0 eller 1');
  }

  return {
    ...input,
    materialPreference: materialPreference ?? 'best_for_conditions',
  };
}
