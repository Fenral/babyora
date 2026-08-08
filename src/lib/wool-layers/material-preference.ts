import type { MaterialPreference } from '../clothing-engine-v2/types.js';
import type { RecommendInput, Recommendation } from './types.js';

/**
 * Kjente ull/fleece-par med samme rolle og omtrent samme varmebidrag.
 *
 * Listen er bevisst smal. Baseplagg mot huden og tilfeldig ull-tilbehør
 * byttes ikke til fleece bare fordi et navn inneholder «ull».
 */
export const WOOL_FLEECE_EQUIVALENTS = Object.freeze([
  Object.freeze({ wool: 'tynt ull-mellomlag', fleece: 'tynn fleece' }),
  Object.freeze({ wool: 'ull-mellomlag', fleece: 'fleecedress' }),
  Object.freeze({ wool: 'tykt ull-mellomlag', fleece: 'tykk fleece' }),
  Object.freeze({ wool: 'ull-jakke', fleece: 'fleecejakke' }),
  Object.freeze({ wool: 'ull-bukse', fleece: 'fleecebukse' }),
] as const);

/** Bomull kan erstatte disse ullplaggene innerst, aldri mellomlaget. */
export const WOOL_COTTON_EQUIVALENTS = Object.freeze([
  Object.freeze({ wool: 'kortermet ullbody', cotton: 'kortermet body' }),
  Object.freeze({ wool: 'langermet ullbody', cotton: 'langermet body' }),
  Object.freeze({ wool: 'langermet ullbody tynn', cotton: 'langermet body' }),
  Object.freeze({ wool: 'tynt ullsett', cotton: 'bomullssett' }),
  Object.freeze({ wool: 'ullsokker', cotton: 'bomullssokker' }),
] as const);

const WOOL_TO_FLEECE = new Map<string, string>(
  WOOL_FLEECE_EQUIVALENTS.map(({ wool, fleece }) => [wool, fleece]),
);
const FLEECE_TO_WOOL = new Map<string, string>(
  WOOL_FLEECE_EQUIVALENTS.map(({ wool, fleece }) => [fleece, wool]),
);
const WOOL_TO_COTTON = new Map<string, string>(
  WOOL_COTTON_EQUIVALENTS.map(({ wool, cotton }) => [wool, cotton]),
);

/**
 * Forsiktig bomullsvindu: mildt, tørt og rolig. Dette speiler Motor 2.0 sin
 * warmDryCalm-policy. Aktiv lek holdes utenfor fordi bomull binder fukt.
 */
function cottonPreferenceIsEligible(input: RecommendInput | undefined): boolean {
  if (input === undefined) return false;
  if (input.activity === 'soevn') return input.weather.feelsLikeC >= 18;
  return input.activity !== 'utelek'
    && input.weather.feelsLikeC >= 12
    && input.weather.precipMmH < 0.1
    && input.weather.windMs <= 6;
}

/**
 * Anvend en myk materialrangering før konflikter og sikkerhetsregler.
 * `avoid_wool` beholdes som bakoverkompatibel fleece-først-semantikk i legacy-
 * motoren, men bytter aldri plagg utenfor den eksplisitte ekvivalenslisten.
 */
export function applyMaterialPreference(
  layers: Recommendation['layers'],
  preference: MaterialPreference | undefined,
  input?: RecommendInput,
): Recommendation['layers'] {
  const replacements =
    preference === 'prefer_fleece' || preference === 'avoid_wool'
      ? WOOL_TO_FLEECE
      : preference === 'prefer_wool'
        ? FLEECE_TO_WOOL
        : preference === 'prefer_cotton' && cottonPreferenceIsEligible(input)
          ? WOOL_TO_COTTON
          : null;

  if (replacements === null) return layers;

  let changed = false;
  const preferred = layers.map((layer) => ({
    category: layer.category,
    items: layer.items.map((item) => {
      const replacement = replacements.get(item);
      if (replacement === undefined) return item;
      changed = true;
      return replacement;
    }),
  }));

  return changed ? preferred : layers;
}
