/**
 * Single UI-facing recommendation seam.
 *
 * Motor 2.0 is not production-authorized until its safety rules and country
 * status pass the later review gates. The canonical UI engine therefore stays
 * on the contained legacy pipeline, whose final safety boundary is active.
 * Future promotion happens here, never independently in individual screens.
 */
import { recommend } from '../wool-layers/recommend.js';
import type {
  LayerOverrides,
  Recommendation,
  RecommendInput,
} from '../wool-layers/types.js';

export const CANONICAL_ENGINE_VERSION = 'wool-layers-v1-contained' as const;

export function recommendCanonical(
  input: RecommendInput,
  options?: { overrides?: LayerOverrides },
): Recommendation {
  return recommend(input, options);
}
