import { EngineV2Error } from './errors.js';
import { recommendV2 } from './recommend.js';
import { validateRecommendInputV2 } from './validation.js';
import type {
  ActivityRecommendInputV2,
  RecommendationV2,
  RecommendInputV2,
  ValidatedRecommendInputV2,
} from './types.js';

function invalid(message: string): never {
  throw new EngineV2Error('invalid_activity_context', message);
}

function hasOwn(input: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(input, key);
}

/** Map the four parent-facing activities to the engine's precise situations. */
export function normalizeActivityInputV2(
  input: ActivityRecommendInputV2,
): ValidatedRecommendInputV2 {
  const candidate = input as ActivityRecommendInputV2 & Record<string, unknown>;
  const { activity } = candidate;
  const base: Omit<RecommendInputV2, 'situation'> = {
    weather: input.weather,
    ageMonths: input.ageMonths,
    activity,
    ...(input.materialPreference !== undefined
      ? { materialPreference: input.materialPreference }
      : {}),
    ...(input.childCalibration !== undefined
      ? { childCalibration: input.childCalibration }
      : {}),
    ...(input.canRoll !== undefined ? { canRoll: input.canRoll } : {}),
    ...(input.exposureMin !== undefined ? { exposureMin: input.exposureMin } : {}),
  };

  switch (activity) {
    case 'vogn': {
      if (hasOwn(candidate, 'innerJakke')) invalid('innerJakke kan bare brukes med bæresele');
      const mode = candidate.vognMode ?? 'awake';
      if (mode !== 'awake' && mode !== 'sleeping') invalid('Ugyldig vognMode');
      const context = candidate.context;
      if (context !== undefined && (typeof context !== 'object' || context === null)) {
        invalid('Ugyldig vognkontekst');
      }
      if (context !== undefined && Object.keys(context).some((key) => key !== 'bilstol')) {
        invalid('Vognkontekst inneholder et ukjent felt');
      }
      const carSeat = (context as { bilstol?: unknown } | undefined)?.bilstol;
      if (carSeat !== undefined && typeof carSeat !== 'boolean') invalid('bilstol må være true eller false');
      if (mode === 'sleeping' && carSeat === true) {
        invalid('Sovende vogn og bilstol kan ikke kombineres');
      }
      return validateRecommendInputV2({
        ...base,
        situation: mode === 'sleeping' ? 'stroller_sleeping' : 'stroller_awake',
        ...(carSeat !== undefined ? { carSeat } : {}),
      });
    }
    case 'baeresele':
      if (hasOwn(candidate, 'vognMode')) invalid('vognMode kan bare brukes med vogn');
      if (hasOwn(candidate, 'context')) invalid('bilstol kan ikke kombineres med bæresele');
      if (candidate.innerJakke !== undefined && typeof candidate.innerJakke !== 'boolean') {
        invalid('innerJakke må være true eller false');
      }
      return validateRecommendInputV2({
        ...base,
        situation: 'carrier',
        ...(candidate.innerJakke !== undefined
          ? { carrierUnderParentJacket: candidate.innerJakke }
          : {}),
      });
    case 'utelek':
      if (hasOwn(candidate, 'vognMode') || hasOwn(candidate, 'innerJakke') || hasOwn(candidate, 'context')) {
        invalid('Utelek kan ikke ha vogn-, bæresele- eller bilstolkontekst');
      }
      return validateRecommendInputV2({ ...base, situation: 'active_play' });
    case 'soevn':
      if (hasOwn(candidate, 'vognMode') || hasOwn(candidate, 'innerJakke') || hasOwn(candidate, 'context')) {
        invalid('Innesøvn kan ikke ha utendørs aktivitetskontekst');
      }
      return validateRecommendInputV2({ ...base, situation: 'indoor_sleep' });
    default:
      return invalid(`Ukjent aktivitet: ${String(activity)}`);
  }
}

export function recommendActivityV2(input: ActivityRecommendInputV2): RecommendationV2 {
  return recommendV2(normalizeActivityInputV2(input));
}
