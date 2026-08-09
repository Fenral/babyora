import { recommend } from './recommend.js';
import type { LayerOverrides, Recommendation, RecommendInput } from './types.js';

/**
 * Runtime recommendation surfaces must state both personalization inputs.
 * Making them required here prevents a new screen from silently forgetting
 * material preference or stroller mode while the engine keeps permissive
 * optional fields for backwards-compatible tests and review tooling.
 */
export type SurfaceRecommendInput = Omit<RecommendInput, 'materialPreference' | 'vognMode'> & {
  materialPreference: NonNullable<RecommendInput['materialPreference']> | null;
  vognMode: NonNullable<RecommendInput['vognMode']> | null;
};

export function canonicalizeSurfaceRecommendInput(
  input: SurfaceRecommendInput,
): RecommendInput {
  if (input.materialPreference === undefined || input.vognMode === undefined) {
    throw new Error('Produksjonsflater må angi materialpreferanse og vognmodus eksplisitt');
  }
  if (input.vognMode === 'sleeping') {
    throw new Error('Vogn (sover) er ikke aktivert for produksjonsflater');
  }
  if (input.activity === 'vogn' && input.vognMode !== 'awake') {
    throw new Error('Vognflater må angi våken modus eksplisitt');
  }
  if (input.activity !== 'vogn' && input.vognMode !== null) {
    throw new Error('Vognmodus kan bare brukes med vognaktivitet');
  }

  const canonical: RecommendInput = {
    weather: { ...input.weather },
    child: { ...input.child },
    activity: input.activity,
    ...(input.materialPreference !== null
      ? { materialPreference: input.materialPreference }
      : {}),
    ...(input.activity === 'vogn' ? { vognMode: 'awake' as const } : {}),
  };
  if (input.exposureMin !== undefined) canonical.exposureMin = input.exposureMin;
  if (input.innerJakke !== undefined) canonical.innerJakke = input.innerJakke;
  if (input.context !== undefined) canonical.context = { ...input.context };
  if (input.childCalibration !== undefined) {
    canonical.childCalibration = input.childCalibration;
  }
  return canonical;
}

type SurfaceRecommendationOptions = Readonly<{ overrides?: LayerOverrides }>;

/** Private shared runner: named surface exports cannot drift in behavior. */
function recommendForAuthorizedSurface(
  input: SurfaceRecommendInput,
  options?: SurfaceRecommendationOptions,
): Recommendation {
  return recommend(canonicalizeSurfaceRecommendInput(input), options);
}

export function recommendForHomeSurface(
  input: SurfaceRecommendInput,
  options?: SurfaceRecommendationOptions,
): Recommendation {
  return recommendForAuthorizedSurface(input, options);
}

export function recommendForPlanSurface(
  input: SurfaceRecommendInput,
  options?: SurfaceRecommendationOptions,
): Recommendation {
  return recommendForAuthorizedSurface(input, options);
}

export function recommendForFindSurface(
  input: SurfaceRecommendInput,
  options?: SurfaceRecommendationOptions,
): Recommendation {
  return recommendForAuthorizedSurface(input, options);
}

export function recommendForTogSurface(
  input: SurfaceRecommendInput,
  options?: SurfaceRecommendationOptions,
): Recommendation {
  return recommendForAuthorizedSurface(input, options);
}
