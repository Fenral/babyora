import { displayNameForDbString } from '../../src/data/garment-display-names';
import { garmentIdFor } from '../../src/data/garment-illustrations';
import { recommend } from '../../src/lib/wool-layers/recommend';
import type { LayerCategory } from '../../src/lib/wool-layers/types';
import type {
  OutfitGarment,
  OutfitRecommendation,
  RecommendOutfitInput,
} from './types';

export type {
  OutfitGarment,
  OutfitRecommendation,
  RecommendOutfitInput,
  SnudlySituation,
  SnudlyWeather,
} from './types';

const ROLE_BY_CATEGORY: Record<LayerCategory, OutfitGarment['role']> = {
  innerst: 'Innerst',
  mellomlag: 'Mellomlag',
  yttertoy: 'Ytterst',
  ekstra: 'Tilbehør',
  utstyr: 'Utstyr',
};

function stableFallbackId(raw: string): string {
  return raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-|-$/gu, '');
}

/**
 * The only recommendation interface the restarted app may consume.
 *
 * It hides the legacy layer model, safety pipeline and display-name mapping.
 * The existing, heavily tested engine remains the implementation until a
 * separately verified engine migration replaces it behind this seam.
 */
export function recommendOutfit(input: RecommendOutfitInput): OutfitRecommendation {
  const recommendation = recommend({
    weather: {
      tempC: input.weather.temperatureC,
      feelsLikeC: input.weather.feelsLikeC,
      windMs: input.weather.windMetersPerSecond,
      precipMmH: input.weather.precipitationMillimetersPerHour,
      symbolCode: input.weather.symbolCode,
    },
    child: { ageMonths: input.childAgeMonths },
    activity: input.situation === 'stroller' ? 'vogn' : 'utelek',
  });

  return {
    engine: 'snudly-engine-v1',
    garments: recommendation.layers.flatMap((layer) =>
      layer.items.map((raw) => ({
        id: garmentIdFor(raw) ?? stableFallbackId(raw),
        name: displayNameForDbString(raw),
        role: ROLE_BY_CATEGORY[layer.category],
      })),
    ),
    notes: [...recommendation.notes],
    severity: recommendation.severity ?? 'NONE',
  };
}
