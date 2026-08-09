import type { MaterialPreference } from '../clothing-engine-v2/types.js';
import { recommendForTogSurface } from './surface-recommendation.js';
import type {
  LayerCategory,
  Recommendation,
} from './types.js';

export type TogGuideLayer = Readonly<{
  dbString: string;
  category: LayerCategory;
  variant: 'inner' | 'mid' | 'outer';
  chip: string;
}>;

export type TogGuideRecommendation = Readonly<{
  tog: string;
  layers: readonly TogGuideLayer[];
  recommendation: Recommendation;
}>;

export type TogGuideInput = Readonly<{
  roomTempC: number;
  ageMonths: number;
  materialPreference?: MaterialPreference;
}>;

function variantFor(category: LayerCategory): TogGuideLayer['variant'] {
  if (category === 'innerst') return 'inner';
  if (category === 'mellomlag') return 'mid';
  return 'outer';
}

function togFromItem(item: string): string | null {
  const match = item.match(/^sovepose\s+(\d+(?:\.\d+)?)\s*TOG$/iu);
  return match?.[1] ?? null;
}

export function buildTogGuideRecommendation(input: TogGuideInput): TogGuideRecommendation {
  const recommendation = recommendForTogSurface({
    weather: {
      tempC: input.roomTempC,
      feelsLikeC: input.roomTempC,
      windMs: 0,
      precipMmH: 0,
    },
    child: { ageMonths: input.ageMonths },
    activity: 'soevn',
    materialPreference: input.materialPreference ?? null,
    vognMode: null,
  });
  const layers = recommendation.layers.flatMap((layer) => layer.items.map((item) => ({
    dbString: item,
    category: layer.category,
    variant: variantFor(layer.category),
    chip: togFromItem(item) === null ? '' : `${togFromItem(item)} TOG`,
  })));
  const tog = layers.map((layer) => togFromItem(layer.dbString)).find(
    (value): value is string => value !== null,
  ) ?? '0';
  return { tog, layers, recommendation };
}
