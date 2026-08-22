/**
 * Motor 2.0 — legacy-adapter (design-spec §13, engine-2-plan Task 11).
 *
 * REN MAPPING: roller → legacy-kategorier via katalogens legacyNameNb.
 * Adapteren beregner aldri varme, velger aldri materialer og undertrykker
 * aldri flagg. Den fjernes når alle forbrukere bruker RecommendationV2.
 *
 * Kategorisemantikk (matcher legacy-motorens plassering):
 *   base_*                     → innerst
 *   footwear (sokke-konsept)   → innerst   (legacy: ullsokker i innerst)
 *   mid_*                      → mellomlag
 *   shell_* / insulated_*      → yttertoy
 *   headwear/handwear + ytterfottøy → ekstra (legacy: lue/votter/sko i ekstra)
 *   equipment                  → utstyr
 */

import type { Layer, LayerCategory, Recommendation } from '../wool-layers/types.js';
import type { RecommendationV2, ResolvedGarment } from './types.js';

const ACTIVITY_LABEL: Record<Recommendation['activity'], string> = {
  vogn: 'Vogn', baeresele: 'Bæresele', utelek: 'Utelek', soevn: 'Søvn',
};

const CATEGORY_ORDER: LayerCategory[] = ['innerst', 'mellomlag', 'yttertoy', 'ekstra', 'utstyr'];

function categoryFor(garment: ResolvedGarment): LayerCategory {
  if (garment.role.startsWith('base_')) return 'innerst';
  if (garment.role === 'footwear') {
    return garment.conceptId === 'footwear-socks' ? 'innerst' : 'ekstra';
  }
  if (garment.role.startsWith('mid_')) return 'mellomlag';
  if (garment.role.startsWith('shell_') || garment.role === 'insulated_fullbody') return 'yttertoy';
  return 'ekstra'; // headwear, handwear
}

export function toLegacyRecommendation(
  v2: RecommendationV2,
  opts?: { feelsLikeC?: number },
): Recommendation {
  const byCategory = new Map<LayerCategory, string[]>();
  for (const cat of CATEGORY_ORDER) byCategory.set(cat, []);

  for (const garment of v2.garments) {
    byCategory.get(categoryFor(garment))!.push(garment.labelNb);
  }
  for (const eq of v2.equipment) {
    byCategory.get('utstyr')!.push(eq.labelNb);
  }

  const layers: Layer[] = CATEGORY_ORDER
    .map((category) => ({ category, items: byCategory.get(category)! }))
    .filter((l) => l.items.length > 0);

  const activity = v2.activity;
  const itemSummary = layers.map((l) => l.items.join(', ')).join(' • ');
  const tempPart = opts?.feelsLikeC !== undefined
    ? ` (${opts.feelsLikeC.toFixed(0)} °C føles)`
    : '';
  const summary = `${ACTIVITY_LABEL[activity]}${tempPart}: ${itemSummary}`;

  const structuredNotes = v2.safetyFlags.map((f) => ({ category: f.category, message: f.message }));

  return {
    activity,
    tempBand: v2.tempBand,
    layers,
    notes: structuredNotes.map((n) => n.message),
    structuredNotes,
    summary,
    safetyFlags: v2.safetyFlags,
    severity: v2.severity,
  };
}
