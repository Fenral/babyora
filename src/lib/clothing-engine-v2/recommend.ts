/**
 * Motor 2.0 — hovedpipeline (design-spec §11).
 *
 *   validate → age/situasjon → ThermalIntent → kalibrering (maks ±1, FØR
 *   plagg) → materialpolicy → plagg/utstyr → SAFETY (siste ord) →
 *   forklaringer → fingerprint → RecommendationV2.
 *
 * Ren og deterministisk: ingen IO, klokke eller tilfeldighet (G36).
 * Ingen skjerm konsumerer denne før adapter + shadow-porten (Task 11–12).
 */

import { validateRecommendInputV2 } from './validation.js';
import { calculateThermalIntent } from './thermal-intent.js';
import { applyThermalCalibration } from './calibration.js';
import { resolveMaterialFamilies } from './material-resolver.js';
import { resolveRecommendationParts } from './garment-resolver.js';
import { applySafetyV2 } from './safety.js';
import { buildExplanations } from './explanations.js';
import { fingerprintV2 } from './fingerprint.js';
import type { ExplanationCode, RecommendationV2, RecommendInputV2 } from './types.js';

export function recommendV2(input: RecommendInputV2): RecommendationV2 {
  const validated = validateRecommendInputV2(input);
  const calibrationOffset = validated.childCalibration ?? 0;

  const rawIntent = calculateThermalIntent(validated);
  const intent = applyThermalCalibration(rawIntent, calibrationOffset);

  const policy = resolveMaterialFamilies(intent, validated.materialPreference);
  const parts = resolveRecommendationParts(intent, policy, validated.ageMonths);
  const safe = applySafetyV2(validated, intent, parts);

  const codes: ExplanationCode[] = [
    ...intent.explanationCodes,
    ...policy.flatMap((p) => p.explanationCodes),
  ];
  const explanations = buildExplanations(codes);

  const fingerprint = fingerprintV2({
    ageStage: intent.ageStage,
    situation: intent.situation,
    tempBand: intent.tempBand,
    insulationWarmth: intent.insulationWarmth,
    needs: {
      wind: intent.needsWindShell,
      waterproof: intent.needsWaterproofShell,
      sun: intent.needsSunProtection,
      head: intent.needsHeadwear,
      hand: intent.needsHandwear,
      foot: intent.needsFootwear,
    },
    garmentVariantIds: safe.garments.map((g) => g.variantId),
    equipmentIds: safe.equipment.map((e) => e.id),
    safetyFlagCodes: safe.flags.map((f) => f.code),
    calibrationOffset,
  });

  return {
    schemaVersion: 2,
    ageStage: intent.ageStage,
    situation: intent.situation,
    tempBand: intent.tempBand,
    intent,
    garments: safe.garments,
    equipment: safe.equipment,
    explanations,
    safetyFlags: safe.flags,
    severity: safe.severity,
    fingerprint,
  };
}
