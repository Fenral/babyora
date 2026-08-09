import { describe, expect, it } from 'vitest';
import {
  finalizeOutfitOccurrenceSwap,
  type FinalizedOutfitSwapRejectionCode,
} from '../../outfit/finalized-outfit-swap.js';
import {
  createOutfitTruthSnapshot,
  type OutfitGarmentTruth,
} from '../../outfit/outfit-truth.js';
import { applySwapsFinalized } from '../finalize-safety.js';
import { recommend } from '../recommend.js';
import type {
  Layer,
  LayerCategory,
  RecommendInput,
  Recommendation,
} from '../types.js';

type HazardCase = Readonly<{
  name: string;
  expectedFlagCode:
    | 'HB-1'
    | 'CK-1'
    | 'HB-3'
    | 'HB-4'
    | 'HB-5'
    | 'HB-6'
    | 'HB-8'
    | 'HB-9';
  input: () => RecommendInput;
  overrideCategory: LayerCategory;
  overrideItems: readonly string[];
  swapTarget: string;
  swapSource: 'sleeping-bag' | 'first-garment';
  forbiddenPattern: RegExp;
  allowedForbiddenCount?: number;
  requiredPattern?: RegExp;
  occurrenceRejection: FinalizedOutfitSwapRejectionCode;
}>;

const HEAD_COVER_RE = /(^|\s)(lue|balaklava|beanie|caps|hat|solhatt)/i;
const SLEEPING_BAG_RE = /^sovepose/i;
const BLANKET_RE = /(teppe|pledd|dunteppe)/i;
const WEIGHTED_RE = /(weighted|vektet|tyngdeteppe|tyngde)/i;
const SOFT_OBJECT_RE = /(\bpute\b|kosedyr|bumper|\bleke\b|stuffed)/i;
const SWADDLE_RE = /(svøp|swaddle)/i;
const PRAM_COVER_RE = /(dunteppe|tynt teppe|teppe over kalesje|dekke over kalesje|kalesje-dekke)/i;
const THICK_WINTER_OUTER_RE = /(vinterdress|vinterkjøredress|tykk dunjakke)/i;

function sleepInput(): RecommendInput {
  return {
    weather: {
      tempC: 20,
      feelsLikeC: 20,
      windMs: 0,
      precipMmH: 0,
    },
    child: { ageMonths: 10, canRoll: true },
    activity: 'soevn',
  };
}

function hotStrollerInput(): RecommendInput {
  return {
    weather: {
      tempC: 28,
      feelsLikeC: 28,
      windMs: 0,
      precipMmH: 0,
    },
    child: { ageMonths: 10 },
    activity: 'vogn',
  };
}

function carSeatInput(): RecommendInput {
  return {
    weather: {
      tempC: 10,
      feelsLikeC: 10,
      windMs: 0,
      precipMmH: 0,
    },
    child: { ageMonths: 10 },
    activity: 'vogn',
    context: { bilstol: true },
  };
}

const HAZARDS: readonly HazardCase[] = Object.freeze([
  {
    name: 'HB-1 indoor-sleep headwear',
    expectedFlagCode: 'HB-1',
    input: sleepInput,
    overrideCategory: 'ekstra',
    overrideItems: ['lue'],
    swapTarget: 'lue',
    swapSource: 'sleeping-bag',
    forbiddenPattern: HEAD_COVER_RE,
    occurrenceRejection: 'target-removed',
  },
  {
    // The current finalizer runs CK-1 before HB-2. CK-1 removes the blanket,
    // so CK-1 is the observable flag for this existing HB-2 invariant.
    name: 'HB-2 sleeping bag plus blanket (current finalizer flag CK-1)',
    expectedFlagCode: 'CK-1',
    input: sleepInput,
    overrideCategory: 'ekstra',
    overrideItems: ['sovepose 2.5 TOG', 'dunteppe'],
    swapTarget: 'dunteppe',
    swapSource: 'first-garment',
    forbiddenPattern: BLANKET_RE,
    requiredPattern: SLEEPING_BAG_RE,
    occurrenceRejection: 'target-semantic-equipment',
  },
  {
    name: 'HB-3 duplicate sleeping bags',
    expectedFlagCode: 'HB-3',
    input: sleepInput,
    overrideCategory: 'ekstra',
    overrideItems: ['sovepose 2.5 TOG', 'sovepose 2.5 TOG'],
    swapTarget: 'sovepose 2.5 TOG',
    swapSource: 'first-garment',
    forbiddenPattern: SLEEPING_BAG_RE,
    allowedForbiddenCount: 1,
    occurrenceRejection: 'target-semantic-equipment',
  },
  {
    name: 'HB-4 weighted sleep product',
    expectedFlagCode: 'HB-4',
    input: sleepInput,
    overrideCategory: 'ekstra',
    overrideItems: ['tyngdeteppe'],
    swapTarget: 'tyngdeteppe',
    // Replace the sleeping bag itself; otherwise CK-1 correctly removes the
    // blanket-shaped label before HB-4 gets a chance to classify weighting.
    swapSource: 'sleeping-bag',
    forbiddenPattern: WEIGHTED_RE,
    occurrenceRejection: 'unknown-target',
  },
  {
    name: 'HB-5 soft sleep object',
    expectedFlagCode: 'HB-5',
    input: sleepInput,
    overrideCategory: 'ekstra',
    overrideItems: ['kosedyr'],
    swapTarget: 'kosedyr',
    swapSource: 'first-garment',
    forbiddenPattern: SOFT_OBJECT_RE,
    occurrenceRejection: 'unknown-target',
  },
  {
    name: 'HB-6 rolling-child swaddle',
    expectedFlagCode: 'HB-6',
    input: sleepInput,
    overrideCategory: 'ekstra',
    overrideItems: ['svøp'],
    swapTarget: 'svøp',
    swapSource: 'first-garment',
    forbiddenPattern: SWADDLE_RE,
    occurrenceRejection: 'unknown-target',
  },
  {
    name: 'HB-8 recognized pram cover in a hot stroller',
    expectedFlagCode: 'HB-8',
    input: hotStrollerInput,
    overrideCategory: 'utstyr',
    overrideItems: ['tynt teppe'],
    swapTarget: 'tynt teppe',
    swapSource: 'first-garment',
    forbiddenPattern: PRAM_COVER_RE,
    occurrenceRejection: 'target-semantic-equipment',
  },
  {
    name: 'HB-9 thick winter outerwear in a car seat',
    expectedFlagCode: 'HB-9',
    input: carSeatInput,
    overrideCategory: 'yttertoy',
    overrideItems: ['vinterkjøredress'],
    swapTarget: 'vinterkjøredress',
    swapSource: 'first-garment',
    forbiddenPattern: THICK_WINTER_OUTER_RE,
    occurrenceRejection: 'target-removed',
  },
]);

function allItems(recommendation: Recommendation): string[] {
  return recommendation.layers.flatMap((layer) => layer.items);
}

function expectNoEmptyOrDuplicateItems(layers: readonly Layer[]): void {
  expect(layers.length).toBeGreaterThan(0);
  expect(layers.every((layer) => layer.items.length > 0)).toBe(true);
  const items = layers.flatMap((layer) => layer.items);
  expect(new Set(items).size).toBe(items.length);
}

function expectCurrentSafetyPolicy(
  recommendation: Recommendation,
  hazard: HazardCase,
): void {
  const items = allItems(recommendation);
  const matchingItems = items.filter((item) => hazard.forbiddenPattern.test(item));
  expectNoEmptyOrDuplicateItems(recommendation.layers);
  expect(recommendation.safetyFlags).toContainEqual(
    expect.objectContaining({ code: hazard.expectedFlagCode }),
  );
  expect(matchingItems).toHaveLength(hazard.allowedForbiddenCount ?? 0);
  if (hazard.requiredPattern !== undefined) {
    expect(items.some((item) => hazard.requiredPattern!.test(item))).toBe(true);
  }
}

function sessionSwapSource(
  recommendation: Recommendation,
  hazard: HazardCase,
): string {
  const items = allItems(recommendation);
  const source = hazard.swapSource === 'sleeping-bag'
    ? items.find((item) => SLEEPING_BAG_RE.test(item))
    : recommendation.layers
      .find((layer) => layer.category === 'innerst')
      ?.items[0];
  expect(source).toBeDefined();
  return source!;
}

function occurrenceSelector(source: OutfitGarmentTruth) {
  return {
    itemId: source.itemId,
    order: source.order,
    category: source.category,
    sourceLabel: source.sourceLabel,
  } as const;
}

describe('AC-5 safety mutation matrix', () => {
  describe('direct recommendation overrides', () => {
    it.each(HAZARDS)('$name', (hazard) => {
      const recommendation = recommend(hazard.input(), {
        overrides: {
          [hazard.overrideCategory]: [...hazard.overrideItems],
        },
      });

      expectCurrentSafetyPolicy(recommendation, hazard);
    });
  });

  describe('finalized session swaps', () => {
    it.each(HAZARDS)('$name', (hazard) => {
      const input = hazard.input();
      const recommendation = recommend(input);
      const unchanged = structuredClone(recommendation);
      const source = sessionSwapSource(recommendation, hazard);

      const swapped = applySwapsFinalized(input, recommendation, {
        [source]: hazard.swapTarget,
      });

      expectCurrentSafetyPolicy(swapped, hazard);
      expect(recommendation).toEqual(unchanged);
    });
  });

  describe('occurrence swaps', () => {
    it.each(HAZARDS)('$name is rejected without mutating the finalized base', (hazard) => {
      const input = hazard.input();
      const recommendation = recommend(input);
      const unchanged = structuredClone(recommendation);
      const truth = createOutfitTruthSnapshot({
        transitionContextId: `transition:safety-mutation-matrix:${hazard.expectedFlagCode}`,
        input,
        finalizedRecommendation: recommendation,
        pose: 'sitting',
      });
      expect(truth.kind).toBe('supported');
      if (truth.kind !== 'supported') return;
      const source = truth.snapshot.garments[0];
      expect(source).toBeDefined();
      if (source === undefined) return;

      expect(
        finalizeOutfitOccurrenceSwap({
          input,
          finalizedRecommendation: recommendation,
          baseSnapshot: truth.snapshot,
          source: occurrenceSelector(source),
          targetLabel: hazard.swapTarget,
        }),
      ).toMatchObject({
        kind: 'rejected',
        code: hazard.occurrenceRejection,
      });
      expect(recommendation).toEqual(unchanged);
      expectNoEmptyOrDuplicateItems(recommendation.layers);
    });
  });
});
