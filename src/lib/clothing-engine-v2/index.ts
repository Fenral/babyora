/**
 * Motor 2.0 — offentlig API.
 * Bygges parallelt med legacy (src/lib/wool-layers) bak feature flags;
 * ingen skjerm konsumerer denne modulen før adapter + shadow-porten (Task 11–12).
 */

export { EngineV2Error, type EngineV2ErrorCode } from './errors.js';
export { validateRecommendInputV2 } from './validation.js';
export { ageStageFor } from './age.js';
export { SITUATION_PROFILES, isSituationValidForStage } from './situations.js';
export { recommendV2 } from './recommend.js';
export { toLegacyRecommendation } from './legacy-adapter.js';
export { ENGINE_V2_FLAGS, selectEngine, type EngineV2Flags } from './feature-flags.js';
export { compareShadow, selectVisibleResult, type ShadowComparison, type ShadowStatus } from './shadow-compare.js';
export { fingerprintV2, type FingerprintInputV2 } from './fingerprint.js';
export { buildExplanations, explanationI18nKey } from './explanations.js';
export { GARMENT_VARIANTS } from './catalog.js';
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
