import { describe, expect, it } from 'vitest';
import {
  createPlannedOutfitContext,
  type OutfitTruthPlannedOutfitContext,
} from '../../planning/planned-outfit-context.js';
import { recommend } from '../../wool-layers/recommend.js';
import type {
  RecommendInput,
  Recommendation,
} from '../../wool-layers/types.js';
import { isOutfitAlternativeOption } from '../alternative-options.js';
import {
  produceOutfitBundle,
  type OutfitBundleSourceV1,
  type OutfitBundleUnavailableReason,
  type ProduceOutfitBundleArgsV1,
} from '../outfit-bundle-producer.js';
import { isOutfitTruthSnapshot } from '../outfit-truth.js';

type ContextOptions = Readonly<{
  identity?: string;
  plannedForIso?: string;
  recommendInput?: RecommendInput;
  finalizedRecommendation?: Recommendation;
}>;

function completeRecommendInput(
  overrides: Partial<RecommendInput> = {},
): RecommendInput {
  return {
    weather: {
      tempC: 1,
      feelsLikeC: -2,
      windMs: 3.1,
      precipMmH: 0.4,
      humidity: 72,
      symbolCode: 'lightsnow',
      uvIndex: 0,
    },
    child: { ageMonths: 5, canRoll: false },
    activity: 'vogn',
    exposureMin: 75,
    innerJakke: false,
    vognMode: 'sleeping',
    context: { bilstol: false },
    childCalibration: 0,
    ...overrides,
  };
}

function exactContext(
  options: ContextOptions = {},
): OutfitTruthPlannedOutfitContext {
  const identity = options.identity ?? 'current';
  const recommendInput = options.recommendInput ?? completeRecommendInput();
  const finalizedRecommendation =
    options.finalizedRecommendation ?? recommend(recommendInput);
  const context = createPlannedOutfitContext({
    planningEventId: `planning-event-${identity}`,
    transitionContextId: `transition-${identity}`,
    child: {
      id: 'barn-01',
      name: 'Ada',
      ageMonths: recommendInput.child.ageMonths,
    },
    plannedForIso:
      options.plannedForIso ?? '2026-02-12T11:00:00.000Z',
    timeZone: 'Europe/Oslo',
    place: {
      label: 'Hjemme',
      lat: 59.9139,
      lon: 10.7522,
      source: 'configured-place',
    },
    activity: recommendInput.activity,
    vognMode:
      recommendInput.activity === 'vogn'
        ? recommendInput.vognMode ?? 'awake'
        : null,
    weather: {
      tempC: recommendInput.weather.tempC,
      feelsLikeC: recommendInput.weather.feelsLikeC,
      windMs: recommendInput.weather.windMs,
      precipMmH: recommendInput.weather.precipMmH,
      symbolCode: recommendInput.weather.symbolCode ?? 'clearsky_day',
    },
    recommendInput,
    finalizedRecommendation,
    access: {
      capability: 'future_plan',
      allowed: true,
      reason: 'plus',
    },
  });
  if (context.sourceKind !== 'phase2-outfit-truth') {
    throw new Error('expected exact outfit-truth context');
  }
  return context;
}

function currentSource(
  context: OutfitTruthPlannedOutfitContext,
): OutfitBundleSourceV1 {
  return {
    kind: 'current',
    sourceContextId: context.producerSeed.sourceContextId,
  };
}

function plannedSource(
  context: OutfitTruthPlannedOutfitContext,
): OutfitBundleSourceV1 {
  return {
    kind: 'planned',
    sourceContextId: context.producerSeed.sourceContextId,
    planningEventId: context.planningEventId,
    plannedForIso: context.plannedForIso,
  };
}

function assertRecursivelyFrozen(
  value: unknown,
  seen = new Set<object>(),
): void {
  if (
    value === null
    || typeof value !== 'object'
    || seen.has(value)
  ) {
    return;
  }
  seen.add(value);
  expect(Object.isFrozen(value)).toBe(true);
  for (const nested of Object.values(value)) {
    assertRecursivelyFrozen(nested, seen);
  }
}

describe('produceOutfitBundle', () => {
  it('emits deterministic supported current truth with exact weather and options', () => {
    const context = exactContext();
    const mutableSource = {
      kind: 'current' as const,
      sourceContextId: context.producerSeed.sourceContextId,
    };
    const args = {
      seed: context.producerSeed,
      source: mutableSource,
    } as const;

    const first = produceOutfitBundle(args);
    const second = produceOutfitBundle(args);

    expect(first).toEqual(second);
    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
    expect(first).toMatchObject({
      kind: 'supported',
      bundleVersion: 1,
      source: mutableSource,
      weather: { tempC: 1, feelsLikeC: -2 },
    });
    expect(Object.keys(first)).toEqual([
      'kind',
      'bundleVersion',
      'source',
      'weather',
      'base',
      'options',
    ]);
    if (first.kind !== 'supported') return;
    expect(isOutfitTruthSnapshot(first.base)).toBe(true);
    expect(first.base.transitionContextId).toBe(
      context.producerSeed.transitionContextId,
    );
    expect(first.base.recommendationId).toBe(
      context.producerSeed.recommendationId,
    );
    expect(first.base.recommendationFingerprint).toBe(
      context.producerSeed.recommendationFingerprint,
    );
    expect(context.access.capability).toBe('future_plan');
    expect(first.source.kind).toBe('current');
    expect(context.producerSeed.finalizedRecommendation).toMatchObject({
      layers: expect.any(Array),
      notes: expect.any(Array),
      structuredNotes: expect.any(Array),
      safetyFlags: expect.any(Array),
      severity: expect.any(String),
    });
    const garmentIds = new Set(
      first.base.garments.map((garment) => garment.itemId),
    );
    expect(first.options.every(isOutfitAlternativeOption)).toBe(true);
    expect(
      first.options.every((option) => garmentIds.has(option.sourceItemId)),
    ).toBe(true);
    expect(
      first.options.every(
        (option) =>
          option.outcome.transitionContextId
          === first.base.transitionContextId,
      ),
    ).toBe(true);
    mutableSource.sourceContextId = 'caller-mutated-after-production';
    expect(first.source.sourceContextId).toBe(
      context.producerSeed.sourceContextId,
    );
    assertRecursivelyFrozen(first);
  });

  it('keeps current, planned, and changed-interval identities isolated', () => {
    const currentContext = exactContext({ identity: 'current-isolated' });
    const plannedContext = exactContext({ identity: 'planned-isolated' });
    const intervalContext = exactContext({
      identity: 'planned-next-interval',
      plannedForIso: '2026-02-12T12:00:00.000Z',
    });

    const current = produceOutfitBundle({
      seed: currentContext.producerSeed,
      source: currentSource(currentContext),
    });
    const planned = produceOutfitBundle({
      seed: plannedContext.producerSeed,
      source: plannedSource(plannedContext),
    });
    const changedInterval = produceOutfitBundle({
      seed: intervalContext.producerSeed,
      source: plannedSource(intervalContext),
    });

    expect(current.kind).toBe('supported');
    expect(planned.kind).toBe('supported');
    expect(changedInterval.kind).toBe('supported');
    if (
      current.kind !== 'supported'
      || planned.kind !== 'supported'
      || changedInterval.kind !== 'supported'
    ) {
      return;
    }
    expect(current.source.kind).toBe('current');
    expect(planned.source).toEqual(plannedSource(plannedContext));
    expect(changedInterval.source).toEqual(plannedSource(intervalContext));
    expect(current.options.length).toBeGreaterThan(0);
    expect(planned.options.length).toBeGreaterThan(0);
    expect(changedInterval.options.length).toBeGreaterThan(0);
    expect(new Set([
      current.base.snapshotId,
      planned.base.snapshotId,
      changedInterval.base.snapshotId,
    ])).toHaveLength(3);
    expect(new Set([
      current.base.transitionContextId,
      planned.base.transitionContextId,
      changedInterval.base.transitionContextId,
    ])).toHaveLength(3);
    expect(
      new Set([
        ...current.options.map((option) => option.optionId),
        ...planned.options.map((option) => option.optionId),
        ...changedInterval.options.map((option) => option.optionId),
      ]).size,
    ).toBe(
      current.options.length
      + planned.options.length
      + changedInterval.options.length,
    );
    expect(new Set([
      ...current.base.garments.map((garment) => garment.itemId),
      ...planned.base.garments.map((garment) => garment.itemId),
      ...changedInterval.base.garments.map((garment) => garment.itemId),
    ]).size).toBe(
      current.base.garments.length
      + planned.base.garments.length
      + changedInterval.base.garments.length,
    );
  });

  it('preserves duplicate occurrences and semantic equipment without flattening', () => {
    const input = completeRecommendInput({
      weather: {
        tempC: 5,
        feelsLikeC: 4,
        windMs: 1,
        precipMmH: 2,
        humidity: 67,
        symbolCode: 'rain',
        uvIndex: 0,
      },
      child: { ageMonths: 8, canRoll: true },
      activity: 'vogn',
      vognMode: 'awake',
      exposureMin: 45,
      context: { bilstol: true },
      childCalibration: 1,
    });
    const recommendation = structuredClone(recommend(input));
    const garmentLayer = recommendation.layers.find(
      (layer) => layer.category !== 'utstyr' && layer.items.length > 0,
    );
    if (garmentLayer === undefined) throw new Error('expected garment layer');
    garmentLayer.items.splice(1, 0, garmentLayer.items[0]!);
    const context = exactContext({
      identity: 'duplicate-equipment',
      recommendInput: input,
      finalizedRecommendation: recommendation,
    });

    const result = produceOutfitBundle({
      seed: context.producerSeed,
      source: plannedSource(context),
    });

    expect(result.kind).toBe('supported');
    if (result.kind !== 'supported') return;
    const duplicates = result.base.garments.filter(
      (garment) => garment.sourceLabel === garmentLayer.items[0],
    );
    expect(duplicates).toHaveLength(2);
    expect(new Set(duplicates.map((garment) => garment.itemId))).toHaveLength(2);
    expect(result.base.equipment.length).toBeGreaterThan(0);
    expect(
      result.base.equipment.some(
        (equipment) =>
          result.base.garments.some(
            (garment) => garment.itemId === equipment.itemId,
          ),
      ),
    ).toBe(false);
    expect(context.producerSeed.input).toEqual(input);
    expect(context.producerSeed.finalizedRecommendation).toEqual(
      recommendation,
    );
  });

  it('preserves the tracked eleven-garment result as complete list-only truth', () => {
    const recommendInput = completeRecommendInput({
      activity: 'vogn',
      weather: {
        feelsLikeC: -30,
        tempC: -30,
        windMs: 8,
        precipMmH: 0,
        symbolCode: 'cloudy',
      },
      child: { ageMonths: 0 },
      childCalibration: 0,
      vognMode: 'awake',
    });
    const context = exactContext({
      identity: 'tracked-eleven',
      recommendInput,
    });

    const result = produceOutfitBundle({
      seed: context.producerSeed,
      source: plannedSource(context),
    });

    expect(result.kind).toBe('unsupported-cardinality');
    expect(Object.keys(result)).toEqual([
      'kind',
      'bundleVersion',
      'source',
      'weather',
      'truth',
    ]);
    if (result.kind !== 'unsupported-cardinality') return;
    expect(result.truth.reason).toBe(
      'semantic-garment-count-outside-1-10',
    );
    expect(result.truth.orderedGarments.map(
      (garment) => garment.sourceLabel,
    )).toEqual([
      'to ullsett oppå hverandre',
      'tykke ullstrømper',
      'ullsokker',
      'ull-jakke',
      'ull-bukse',
      'ekstra ull-lag',
      'isolert vinterkjøredress',
      'balaklava',
      'votter dun',
      'halsedisse',
      'vindvotter (skall)',
    ]);
    expect(result.truth.equipment.map(
      (equipment) => equipment.sourceLabel,
    )).toEqual([
      'varmepose dun',
      'saueskinn i vogn',
      'ansiktskrem',
      'vognpose',
    ]);
    expect('base' in result).toBe(false);
    expect('options' in result).toBe(false);
    expect('snapshot' in result.truth).toBe(false);
    expect('avatar' in result.truth).toBe(false);
    assertRecursivelyFrozen(result);
  });

  it('fails closed when an owned seed lacks complete finalizer ownership data', () => {
    const recommendInput = completeRecommendInput();
    const finalizedRecommendation = recommend(recommendInput);
    delete finalizedRecommendation.safetyFlags;
    delete finalizedRecommendation.severity;
    const context = exactContext({
      identity: 'incomplete-finalizer',
      recommendInput,
      finalizedRecommendation,
    });

    expect(produceOutfitBundle({
      seed: context.producerSeed,
      source: currentSource(context),
    })).toEqual({
      kind: 'unavailable',
      bundleVersion: 1,
      reason: 'truth-build-failed',
    });
  });

  it.each([
    [
      'a frozen structural seed clone',
      (context: OutfitTruthPlannedOutfitContext) => ({
        seed: structuredClone(context.producerSeed),
        source: currentSource(context),
      }),
      'invalid-provenance',
    ],
    [
      'a mutable seed lookalike',
      (context: OutfitTruthPlannedOutfitContext) => ({
        seed: { ...context.producerSeed },
        source: currentSource(context),
      }),
      'invalid-provenance',
    ],
    [
      'a flattened recommendation projection',
      (context: OutfitTruthPlannedOutfitContext) => ({
        seed: {
          ...context.producerSeed,
          finalizedRecommendation: {
            activity: 'vogn',
            tempBand: 'kald',
            orderedGarments: ['ullsett'],
            equipment: [],
          },
        },
        source: currentSource(context),
      }),
      'invalid-provenance',
    ],
    [
      'a missing required Recommendation field',
      (context: OutfitTruthPlannedOutfitContext) => {
        const recommendation = structuredClone(
          context.producerSeed.finalizedRecommendation,
        );
        delete (
          recommendation as unknown as { notes?: string[] }
        ).notes;
        return {
          seed: {
            ...context.producerSeed,
            finalizedRecommendation: recommendation,
          },
          source: currentSource(context),
        };
      },
      'invalid-provenance',
    ],
    [
      'malformed optional finalizer data',
      (context: OutfitTruthPlannedOutfitContext) => ({
        seed: {
          ...context.producerSeed,
          finalizedRecommendation: {
            ...context.producerSeed.finalizedRecommendation,
            safetyFlags: 'forged',
          },
        },
        source: currentSource(context),
      }),
      'invalid-provenance',
    ],
    [
      'input and Recommendation activity mismatch',
      (context: OutfitTruthPlannedOutfitContext) => ({
        seed: {
          ...context.producerSeed,
          finalizedRecommendation: {
            ...context.producerSeed.finalizedRecommendation,
            activity: 'utelek',
          },
        },
        source: currentSource(context),
      }),
      'invalid-provenance',
    ],
    [
      'forged category provenance',
      (context: OutfitTruthPlannedOutfitContext) => ({
        seed: {
          ...context.producerSeed,
          finalizedRecommendation: {
            ...context.producerSeed.finalizedRecommendation,
            layers: context.producerSeed.finalizedRecommendation.layers.map(
              (layer, index) => index === 0
                ? { ...layer, category: 'utstyr' }
                : layer,
            ),
          },
        },
        source: currentSource(context),
      }),
      'invalid-provenance',
    ],
    [
      'a mismatched source context',
      (context: OutfitTruthPlannedOutfitContext) => ({
        seed: context.producerSeed,
        source: { kind: 'current', sourceContextId: 'wrong-context' },
      }),
      'invalid-provenance',
    ],
    [
      'planned metadata on current source',
      (context: OutfitTruthPlannedOutfitContext) => ({
        seed: context.producerSeed,
        source: {
          kind: 'current',
          sourceContextId: context.producerSeed.sourceContextId,
          planningEventId: context.planningEventId,
          plannedForIso: context.plannedForIso,
        },
      }),
      'invalid-input',
    ],
    [
      'missing planned metadata',
      (context: OutfitTruthPlannedOutfitContext) => ({
        seed: context.producerSeed,
        source: {
          kind: 'planned',
          sourceContextId: context.producerSeed.sourceContextId,
        },
      }),
      'invalid-input',
    ],
    [
      'a non-ISO planned interval',
      (context: OutfitTruthPlannedOutfitContext) => ({
        seed: context.producerSeed,
        source: {
          ...plannedSource(context),
          plannedForIso: 'next Tuesday',
        },
      }),
      'invalid-input',
    ],
  ] as const)(
    'fails closed for %s',
    (_name, makeArgs, reason) => {
      const context = exactContext();
      const result = produceOutfitBundle(
        makeArgs(context) as unknown as ProduceOutfitBundleArgsV1,
      );

      expect(result).toEqual({
        kind: 'unavailable',
        bundleVersion: 1,
        reason,
      });
      expect(Object.keys(result)).toEqual([
        'kind',
        'bundleVersion',
        'reason',
      ]);
      assertRecursivelyFrozen(result);
    },
  );

  it('turns unreadable args, source, and seed proxies into typed unavailable', () => {
    const context = exactContext();
    const hostile = new Proxy(
      {
        seed: context.producerSeed,
        source: currentSource(context),
      },
      {
        ownKeys() {
          throw new Error('hostile ownKeys');
        },
      },
    );

    expect(() => produceOutfitBundle(
      hostile as ProduceOutfitBundleArgsV1,
    )).not.toThrow();
    expect(produceOutfitBundle(
      hostile as ProduceOutfitBundleArgsV1,
    )).toEqual({
      kind: 'unavailable',
      bundleVersion: 1,
      reason: 'invalid-input',
    });
  });

  it('keeps the producer import boundary pure and library-only', async () => {
    const source = (
      await import('../outfit-bundle-producer.ts?raw') as { default: string }
    ).default;
    const imports = [...source.matchAll(
      /from\s+['"]([^'"]+)['"]/gu,
    )].map((match) => match[1]);

    expect(imports).toEqual([
      '../met-no/types.js',
      '../planning/planned-outfit-context.js',
      './alternative-options.js',
      './outfit-truth.js',
    ]);
    expect(source).not.toMatch(/\brecommend\s*\(/u);
    expect(source).not.toMatch(
      /(?:screens|App\.|routes?|hooks?|stores?|localStorage|sessionStorage|document\.|window\.|Date\.now|02-INVENTORY)/u,
    );

    const allReasons = {
      'invalid-input': true,
      'input-result-mismatch': true,
      'invalid-provenance': true,
      'truth-build-failed': true,
    } satisfies Record<OutfitBundleUnavailableReason, true>;
    expect(Object.keys(allReasons)).toEqual([
      'invalid-input',
      'input-result-mismatch',
      'invalid-provenance',
      'truth-build-failed',
    ]);
  });
});
