/**
 * Motor 2.0 — offentlig API.
 * Bygges parallelt med legacy (src/lib/wool-layers) bak feature flags;
 * ingen skjerm konsumerer denne modulen før adapter + shadow-porten (Task 11–12).
 */

export { EngineV2Error, type EngineV2ErrorCode } from './errors.js';
export { validateRecommendInputV2 } from './validation.js';
export type {
  AgeStage,
  ActivityIntensity,
  EquipmentNeed,
  Explanation,
  ExplanationCode,
  GarmentRole,
  GarmentVariant,
  MaterialFamily,
  MaterialPreference,
  RecommendationV2,
  RecommendInputV2,
  ResolvedEquipment,
  ResolvedGarment,
  Situation,
  SituationProfile,
  ThermalIntent,
  ValidatedRecommendInputV2,
  WarmthLevel,
} from './types.js';
