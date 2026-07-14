/**
 * Motor 2.0 — domenekontrakter.
 * Eksakt per docs/superpowers/specs/2026-07-13-babyora-engine-2-design.md
 * (§6 aldersmodell, §7 situasjonsmodell, §8 materialmodell, §9 termisk behov,
 * §10 plaggkatalog, §12 utdata, §16 forklaringskoder).
 *
 * Gjenbruk via type-only imports der semantikken matcher legacy-motoren
 * (WeatherInput, TempBand, SafetyFlag, Severity) — engine-2-plan Task 1.
 */

import type { TempBand, WeatherInput } from '../wool-layers/types.js';
import type { SafetyFlag, Severity } from '../wool-layers/safety.js';

// ─── §6 Aldersmodell ─────────────────────────────────────────────────────────

export type AgeStage =
  | 'newborn'          // 0–5 mnd
  | 'mobile_baby'      // 6–11 mnd
  | 'young_toddler';   // 12–24 mnd

// ─── §7 Situasjonsmodell ─────────────────────────────────────────────────────

export type Situation =
  | 'stroller_awake'
  | 'carrier'
  | 'awake_low_mobility'
  | 'active_play'
  | 'calm_outdoors'
  | 'mixed_day'
  | 'indoor_sleep';

export type ActivityIntensity = 'resting' | 'mixed' | 'active';

export type SituationProfile = {
  id: Situation;
  intensity: ActivityIntensity;
  validAgeStages: AgeStage[];
  exposureKind: 'outdoor' | 'indoor';
};

// ─── §8 Materialmodell ───────────────────────────────────────────────────────

export type MaterialPreference =
  | 'best_for_conditions'
  | 'prefer_wool'
  | 'avoid_wool';

export type MaterialFamily =
  | 'wool'
  | 'synthetic_wicking'
  | 'fleece'
  | 'cotton'
  | 'shell'
  | 'synthetic_insulation'
  | 'down'
  | 'blend';

// ─── §9 Termisk behov før plagg ──────────────────────────────────────────────

export type WarmthLevel = 0 | 1 | 2 | 3 | 4;

/** Utstyrsbehov — eksterne hjelpemidler, aldri klær PÅ barnet (jf. legacy
 *  'utstyr'-kategorien: regntrekk, vognpose, kjørepose). */
export type EquipmentNeed =
  | 'stroller_rain_cover'
  | 'stroller_warm_pouch'
  | 'car_seat_pouch';

export type ThermalIntent = {
  ageStage: AgeStage;
  situation: Situation;
  intensity: ActivityIntensity;
  tempBand: TempBand;
  baseWarmth: WarmthLevel;
  insulationWarmth: WarmthLevel;
  needsWindShell: boolean;
  needsWaterproofShell: boolean;
  needsSunProtection: boolean;
  needsHeadwear: boolean;
  needsHandwear: boolean;
  needsFootwear: boolean;
  equipment: EquipmentNeed[];
  explanationCodes: ExplanationCode[];
};

// ─── §10 Strukturert plaggkatalog ────────────────────────────────────────────

export type GarmentRole =
  | 'base_top'
  | 'base_bottom'
  | 'base_fullbody'
  | 'mid_top'
  | 'mid_bottom'
  | 'mid_fullbody'
  | 'shell_top'
  | 'shell_bottom'
  | 'shell_fullbody'
  | 'insulated_fullbody'
  | 'headwear'
  | 'handwear'
  | 'footwear'
  | 'equipment';

export type GarmentVariant = {
  id: string;
  role: GarmentRole;
  material: MaterialFamily;
  warmth: WarmthLevel;
  windproof: boolean;
  waterproof: boolean;
  moistureManagement: 'low' | 'medium' | 'high';
  validAgeStages: AgeStage[];
  legacyNameNb: string;
  illustrationId: string | null;
};

// ─── §16 Forklaringer ────────────────────────────────────────────────────────

export type ExplanationCode =
  | 'ACTIVE_CHILD_LESS_INSULATION'
  | 'RESTING_CHILD_MORE_INSULATION'
  | 'RAIN_REQUIRES_SHELL'
  | 'WIND_REQUIRES_SHELL'
  | 'WOOL_PREFERENCE_APPLIED'
  | 'WOOL_AVOIDED'
  | 'FLEECE_FAST_DRYING'
  | 'WICKING_SYNTHETIC_FOR_ACTIVITY'
  | 'COTTON_ONLY_WARM_DRY'
  | 'AGE_APPROPRIATE_GARMENT_FORM'
  // Tillegg utover spec §16-listen (dokumentert avvik): engine-2-plan Task 5
  // krever en stabil forklaringskode for anvendt kalibrering.
  | 'CALIBRATION_WARMER'
  | 'CALIBRATION_COOLER';

/** Stabil kode + interpolasjonsverdier; oversettelse skjer i presentasjonslaget
 *  (Task 9). Ingen fritekst i motoren. */
export type Explanation = {
  code: ExplanationCode;
  params?: Record<string, string | number>;
};

// ─── §12 Utdata ──────────────────────────────────────────────────────────────

export type ResolvedGarment = {
  conceptId: string;
  variantId: string;
  role: GarmentRole;
  material: MaterialFamily;
  labelNb: string;
  illustrationId: string | null;
  required: boolean;
};

export type ResolvedEquipment = {
  id: EquipmentNeed;
  labelNb: string;
  illustrationId: string | null;
};

export type RecommendationV2 = {
  schemaVersion: 2;
  ageStage: AgeStage;
  situation: Situation;
  tempBand: TempBand;
  intent: ThermalIntent;
  garments: ResolvedGarment[];
  equipment: ResolvedEquipment[];
  explanations: Explanation[];
  safetyFlags: SafetyFlag[];
  severity: Severity;
  fingerprint: string;
};

// ─── Input ───────────────────────────────────────────────────────────────────

export type RecommendInputV2 = {
  weather: WeatherInput;
  /** Alder i måneder, heltall 0–24. 25+ avvises med unsupported_age (spec §1). */
  ageMonths: number;
  situation: Situation;
  /** Default best_for_conditions når utelatt (normaliseres i validering). */
  materialPreference?: MaterialPreference;
  /** Per-barn-kalibrering, anvendes på ThermalIntent FØR plaggvalg (spec §11). */
  childCalibration?: -1 | 0 | 1;
  /** Spedbarnssikkerhet (svøp/HB-6-ekvivalent); påvirker ikke aldersstadiet. */
  canRoll?: boolean;
  /** Bilstol-kontekst — sikkerhetsregler for isolert yttertøy (HB-9-ekvivalent). */
  carSeat?: boolean;
  /** Kun bæresele: barnet ligger innenfor forelderens jakke (G04/G05) —
   *  foreldrekroppen varmer og jakka er skallet. */
  carrierUnderParentJacket?: boolean;
  /** Planlagt eksponeringstid i minutter. Default 60. */
  exposureMin?: number;
};

/** Validert og normalisert input — materialpreferansen er alltid satt. */
export type ValidatedRecommendInputV2 = RecommendInputV2 & {
  materialPreference: MaterialPreference;
};

// Re-eksport av delte typer så V2-konsumenter slipper å importere fra legacy.
export type { TempBand, WeatherInput, SafetyFlag, Severity };
