import type { Layer, RecommendInput } from './types.js';

const ACTIVITY_LABEL: Record<RecommendInput['activity'], string> = {
  vogn: 'Vogn',
  baeresele: 'Bæresele',
  utelek: 'Utelek',
  soevn: 'Søvn',
};

export function summarizeRecommendationLayers(layers: readonly Layer[]): string {
  return layers
    .filter((layer) => layer.items.length > 0)
    .map((layer) => layer.items.join(', '))
    .join(' • ');
}

/**
 * Builds the legacy human-readable summary from the final, trusted layers.
 * Keeping this formatter in one module prevents post-engine swaps from leaving
 * the text on an older garment decision.
 */
export function buildRecommendationSummary(
  input: RecommendInput,
  layers: readonly Layer[],
): string {
  const strollerSleeping = input.activity === 'vogn' && input.vognMode === 'sleeping';
  const activityLabel = strollerSleeping
    ? 'Vogn (sover)'
    : ACTIVITY_LABEL[input.activity];
  const temperatureKind = input.activity === 'soevn' ? 'romtemp' : 'føles';
  return `${activityLabel} (${input.weather.feelsLikeC.toFixed(0)} °C ${temperatureKind}): ${summarizeRecommendationLayers(layers)}`;
}
