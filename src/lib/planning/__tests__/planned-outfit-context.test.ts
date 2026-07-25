import { describe, expect, it } from 'vitest';
import { createOutfitTruthSnapshot } from '../../outfit/outfit-truth.js';
import { recommend } from '../../wool-layers/recommend.js';
import type { Recommendation } from '../../wool-layers/types.js';
import {
  planningAccessFixture,
  planningChildFixture,
  planningFinalizedRecommendationFixture,
  planningLocationFixture,
} from './planlegg-fixtures.js';
import {
  createCurrentOutfitContext,
  createPlannedOutfitContext,
  isOutfitBundleProducerSeedV1,
  isPlannedOutfitContext,
  matchesOutfitBundleProducerSeedCurrentSourceV1,
  matchesOutfitBundleProducerSeedPlannedSourceV1,
  PLAN_TIME_ZONE,
} from '../planned-outfit-context.js';

type MutablePlannedContextInput = {
  planningEventId: string;
  transitionContextId: string;
  child: {
    id: string;
    name: string;
    ageMonths: number;
  };
  plannedForIso: string;
  timeZone: string;
  place: {
    label: string;
    lat: number;
    lon: number;
    source: string;
  };
  activity: string;
  vognMode: string | null;
  weather: {
    tempC: number;
    feelsLikeC: number;
    windMs: number;
    precipMmH: number;
    symbolCode: string;
  };
  recommendation: {
    id: string;
    fingerprint: string;
    orderedGarments: string[];
    equipment: string[];
    finalized: boolean;
  };
  access: {
    capability: string;
    allowed: boolean;
    reason: string;
  };
};

function completeInput(): MutablePlannedContextInput {
  return {
    planningEventId: 'planning-event-future-11',
    transitionContextId: 'transition-future-11',
    child: {
      id: planningChildFixture.id,
      name: planningChildFixture.name,
      ageMonths: 5,
    },
    plannedForIso: '2026-02-12T11:00:00.000Z',
    timeZone: 'Europe/Oslo',
    place: {
      label: planningLocationFixture.label,
      lat: planningLocationFixture.latitude,
      lon: planningLocationFixture.longitude,
      source: planningLocationFixture.source,
    },
    activity: 'vogn',
    vognMode: 'sleeping',
    weather: {
      tempC: 1,
      feelsLikeC: -2,
      windMs: 3.1,
      precipMmH: 0.4,
      symbolCode: 'lightsnow',
    },
    recommendation: {
      id: planningFinalizedRecommendationFixture.id,
      fingerprint: planningFinalizedRecommendationFixture.fingerprint,
      orderedGarments: [...planningFinalizedRecommendationFixture.orderedGarments],
      equipment: [...planningFinalizedRecommendationFixture.equipment],
      finalized: planningFinalizedRecommendationFixture.finalized,
    },
    access: {
      capability: 'future_plan',
      allowed: true,
      reason: planningAccessFixture.plus.tier,
    },
  };
}

function cloneInput(input: MutablePlannedContextInput = completeInput()): MutablePlannedContextInput {
  return structuredClone(input);
}

function assertRecursivelyFrozen(value: unknown, seen = new Set<object>()): void {
  if (typeof value !== 'object' || value === null || seen.has(value)) return;
  seen.add(value);
  expect(Object.isFrozen(value)).toBe(true);
  for (const nested of Object.values(value)) assertRecursivelyFrozen(nested, seen);
}

function frozenContextWith(
  context: Readonly<Record<string, unknown>>,
  overrides: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  return Object.freeze({ ...context, ...overrides });
}

function canonicalCompleteInput() {
  const recommendInput = {
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
    activity: 'vogn' as const,
    exposureMin: 75,
    innerJakke: false,
    vognMode: 'sleeping' as const,
    context: { bilstol: false },
    childCalibration: 0 as const,
  };
  return {
    planningEventId: 'planning-event-canonical-11',
    transitionContextId: 'transition-canonical-11',
    child: { id: 'barn-01', name: 'Ada', ageMonths: 5 },
    plannedForIso: '2026-02-12T11:00:00.000Z',
    timeZone: PLAN_TIME_ZONE,
    place: {
      label: 'Hjemme', lat: 59.9139, lon: 10.7522, source: 'configured-place' as const,
    },
    activity: 'vogn' as const,
    vognMode: 'sleeping' as const,
    weather: {
      tempC: 1, feelsLikeC: -2, windMs: 3.1, precipMmH: 0.4, symbolCode: 'lightsnow',
    },
    recommendInput,
    finalizedRecommendation: recommend(recommendInput),
    access: { capability: 'future_plan' as const, allowed: true, reason: 'plus' as const },
  };
}

describe('Planned Outfit exact-context contracts', () => {
  it('authenticates only the exact internally registered producer seed', () => {
    const context = createPlannedOutfitContext(canonicalCompleteInput());
    expect(context.sourceKind).toBe('phase2-outfit-truth');
    if (context.sourceKind !== 'phase2-outfit-truth') throw new Error('expected Phase-2 context');

    expect(isOutfitBundleProducerSeedV1(context.producerSeed)).toBe(true);
    expect(isOutfitBundleProducerSeedV1(structuredClone(context.producerSeed))).toBe(false);
    expect(isOutfitBundleProducerSeedV1(Object.freeze({ ...context.producerSeed }))).toBe(false);
    expect(isOutfitBundleProducerSeedV1({ ...context.producerSeed })).toBe(false);
    expect(isOutfitBundleProducerSeedV1(new Proxy(context.producerSeed, {}))).toBe(false);

    const legacy = createPlannedOutfitContext(completeInput());
    expect(legacy.sourceKind).toBe('phase1-legacy');
    expect(isOutfitBundleProducerSeedV1(legacy)).toBe(false);
  });

  it('binds an owned seed to its exact canonical planned event and interval', () => {
    const context = createPlannedOutfitContext(canonicalCompleteInput());
    expect(context.sourceKind).toBe('phase2-outfit-truth');
    if (context.sourceKind !== 'phase2-outfit-truth') throw new Error('expected Phase-2 context');

    const matches = (seed: unknown, planningEventId: unknown, plannedForIso: unknown) =>
      matchesOutfitBundleProducerSeedPlannedSourceV1(
        seed,
        planningEventId,
        plannedForIso,
      );
    expect(matches(
      context.producerSeed,
      context.planningEventId,
      context.plannedForIso,
    )).toBe(true);
    expect(matches(
      context.producerSeed,
      'planning-event-arbitrary',
      context.plannedForIso,
    )).toBe(false);
    expect(matches(
      context.producerSeed,
      context.planningEventId,
      '2026-02-12T12:00:00.000Z',
    )).toBe(false);
    expect(matches(
      context.producerSeed,
      context.planningEventId,
      '2026-02-12T12:00:00.000+01:00',
    )).toBe(false);
    expect(matches(
      structuredClone(context.producerSeed),
      context.planningEventId,
      context.plannedForIso,
    )).toBe(false);
    expect(matches(
      { ...context.producerSeed },
      context.planningEventId,
      context.plannedForIso,
    )).toBe(false);
    expect(matches(
      Object.freeze({ ...context.producerSeed }),
      context.planningEventId,
      context.plannedForIso,
    )).toBe(false);

    const hostile = new Proxy(context.producerSeed, {
      getPrototypeOf() {
        throw new Error('hostile getPrototypeOf');
      },
      ownKeys() {
        throw new Error('hostile ownKeys');
      },
    });
    expect(() => matches(
      hostile,
      context.planningEventId,
      context.plannedForIso,
    )).not.toThrow();
    expect(matches(
      hostile,
      context.planningEventId,
      context.plannedForIso,
    )).toBe(false);

    const legacy = createPlannedOutfitContext(completeInput());
    expect(matches(
      legacy,
      legacy.planningEventId,
      legacy.plannedForIso,
    )).toBe(false);
  });

  it('separates trusted current and planned seed origins without changing public context bytes', () => {
    const input = canonicalCompleteInput();
    const current = createCurrentOutfitContext(structuredClone(input));
    const planned = createPlannedOutfitContext(structuredClone(input));
    expect(current.sourceKind).toBe('phase2-outfit-truth');
    expect(planned.sourceKind).toBe('phase2-outfit-truth');
    if (
      current.sourceKind !== 'phase2-outfit-truth'
      || planned.sourceKind !== 'phase2-outfit-truth'
    ) {
      throw new Error('expected exact outfit-truth contexts');
    }

    expect(JSON.stringify(current)).toBe(JSON.stringify(planned));
    expect(isPlannedOutfitContext(current)).toBe(true);
    expect(isPlannedOutfitContext(planned)).toBe(true);
    expect(Object.keys(current.producerSeed)).toEqual(
      Object.keys(planned.producerSeed),
    );
    expect(matchesOutfitBundleProducerSeedCurrentSourceV1(
      current.producerSeed,
    )).toBe(true);
    expect(matchesOutfitBundleProducerSeedPlannedSourceV1(
      current.producerSeed,
      current.planningEventId,
      current.plannedForIso,
    )).toBe(false);
    expect(matchesOutfitBundleProducerSeedCurrentSourceV1(
      planned.producerSeed,
    )).toBe(false);
    expect(matchesOutfitBundleProducerSeedPlannedSourceV1(
      planned.producerSeed,
      planned.planningEventId,
      planned.plannedForIso,
    )).toBe(true);

    expect(current.planningEventId).toMatch(/^planning-event-/u);
    expect(current.access.capability).toBe('future_plan');
    expect(matchesOutfitBundleProducerSeedCurrentSourceV1(
      current.producerSeed,
    )).toBe(true);

    const misleadingPlannedInput = canonicalCompleteInput();
    misleadingPlannedInput.planningEventId = 'current-event-misleading';
    misleadingPlannedInput.transitionContextId = 'current-transition-misleading';
    const misleadingPlanned = createPlannedOutfitContext(
      misleadingPlannedInput,
    );
    expect(misleadingPlanned.sourceKind).toBe('phase2-outfit-truth');
    if (misleadingPlanned.sourceKind !== 'phase2-outfit-truth') {
      throw new Error('expected exact planned context');
    }
    expect(matchesOutfitBundleProducerSeedPlannedSourceV1(
      misleadingPlanned.producerSeed,
      misleadingPlanned.planningEventId,
      misleadingPlanned.plannedForIso,
    )).toBe(true);
    expect(matchesOutfitBundleProducerSeedCurrentSourceV1(
      misleadingPlanned.producerSeed,
    )).toBe(false);

    for (const injected of [
      { sourceKind: 'current' },
      { producerSeedOrigin: 'planned' },
      { producerSeedSource: 'planned' },
    ]) {
      expect(() => createCurrentOutfitContext({
        ...canonicalCompleteInput(),
        ...injected,
      })).toThrow(/PlannedOutfitContext/u);
      expect(() => createPlannedOutfitContext({
        ...canonicalCompleteInput(),
        ...injected,
      })).toThrow(/PlannedOutfitContext/u);
    }
  });

  it('rejects copies and hostile values through both origin matchers', () => {
    const current = createCurrentOutfitContext(canonicalCompleteInput());
    expect(current.sourceKind).toBe('phase2-outfit-truth');
    if (current.sourceKind !== 'phase2-outfit-truth') {
      throw new Error('expected exact current context');
    }
    const asserted = structuredClone(current.producerSeed);
    const frozen = Object.freeze({ ...current.producerSeed });
    const hostile = new Proxy(current.producerSeed, {
      ownKeys() {
        throw new Error('hostile ownKeys');
      },
      getPrototypeOf() {
        throw new Error('hostile getPrototypeOf');
      },
    });
    for (const value of [asserted, frozen, hostile]) {
      expect(() => matchesOutfitBundleProducerSeedCurrentSourceV1(
        value,
      )).not.toThrow();
      expect(matchesOutfitBundleProducerSeedCurrentSourceV1(value)).toBe(false);
      expect(matchesOutfitBundleProducerSeedPlannedSourceV1(
        value,
        current.planningEventId,
        current.plannedForIso,
      )).toBe(false);
    }
  });

  it('keeps Hjem on the current constructor and Uke on the planned constructor', async () => {
    const [home, week] = await Promise.all([
      import('../../../screens/HjemScreen.tsx?raw') as Promise<{ default: string }>,
      import('../../../screens/UkeScreen.tsx?raw') as Promise<{ default: string }>,
    ]);

    expect(home.default).toMatch(/\bcreateCurrentOutfitContext\s*\(/u);
    expect(home.default).not.toMatch(/\bcreatePlannedOutfitContext\s*\(/u);
    expect(week.default).toMatch(/\bcreatePlannedOutfitContext\s*\(/u);
    expect(week.default).not.toMatch(/\bcreateCurrentOutfitContext\s*\(/u);
    expect(home.default).not.toMatch(
      /(?:sourceKind|producerSeedOrigin|producerSeedSource)\s*:/u,
    );
    expect(week.default).not.toMatch(
      /(?:sourceKind|producerSeedOrigin|producerSeedSource)\s*:/u,
    );
  });

  it('owns one complete immutable Phase-2 producer seed and derives its projection', () => {
    const input = canonicalCompleteInput();
    const original = structuredClone(input);
    const context = createPlannedOutfitContext(input);

    expect(context.sourceKind).toBe('phase2-outfit-truth');
    if (context.sourceKind !== 'phase2-outfit-truth') throw new Error('expected Phase-2 context');
    const { producerSeed } = context;
    expect(producerSeed).toMatchObject({
      seedVersion: 1,
      sourceContextId: context.plannedContextId,
      transitionContextId: context.transitionContextId,
      input: original.recommendInput,
      finalizedRecommendation: original.finalizedRecommendation,
    });
    expect(Object.keys(producerSeed)).toEqual([
      'seedVersion',
      'sourceContextId',
      'transitionContextId',
      'recommendationId',
      'recommendationFingerprint',
      'input',
      'finalizedRecommendation',
    ]);
    expect(producerSeed.recommendationId).toBe(context.recommendation.id);
    expect(producerSeed.recommendationFingerprint).toBe(context.recommendation.fingerprint);
    expect(context.recommendation.orderedGarments).toEqual(
      original.finalizedRecommendation.layers
        .filter((layer) => layer.category !== 'utstyr')
        .flatMap((layer) => layer.items),
    );
    expect(context.recommendation.equipment).toEqual(
      original.finalizedRecommendation.layers
        .filter((layer) => layer.category === 'utstyr')
        .flatMap((layer) => layer.items),
    );
    expect(JSON.parse(JSON.stringify(context))).not.toHaveProperty('layout');
    expect(JSON.stringify(createPlannedOutfitContext(structuredClone(original)))).toBe(
      JSON.stringify(context),
    );
    assertRecursivelyFrozen(context);

    input.recommendInput.weather.humidity = 0;
    input.recommendInput.context.bilstol = true;
    input.finalizedRecommendation.layers[0]!.items[0] = 'Mutert lag';
    input.finalizedRecommendation.notes.push('Mutert note');
    expect(producerSeed.input.weather.humidity).toBe(72);
    expect(producerSeed.input.context?.bilstol).toBe(false);
    expect(producerSeed.finalizedRecommendation.layers[0]!.items[0]).not.toBe('Mutert lag');
    expect(producerSeed.finalizedRecommendation.notes).not.toContain('Mutert note');
  });

  it('matches canonical outfit-truth recommendation provenance exactly', () => {
    const source = canonicalCompleteInput();
    const context = createPlannedOutfitContext(source);
    expect(context.sourceKind).toBe('phase2-outfit-truth');
    if (context.sourceKind !== 'phase2-outfit-truth') throw new Error('expected Phase-2 context');
    const canonical = createOutfitTruthSnapshot({
      transitionContextId: context.producerSeed.transitionContextId,
      input: context.producerSeed.input,
      finalizedRecommendation: context.producerSeed.finalizedRecommendation as Recommendation,
      pose: 'sitting',
    });
    expect(canonical.kind).toBe('supported');
    if (canonical.kind !== 'supported') throw new Error('expected supported canonical truth');
    expect(context.producerSeed.recommendationId).toBe(canonical.snapshot.recommendationId);
    expect(context.producerSeed.recommendationFingerprint).toBe(
      canonical.snapshot.recommendationFingerprint,
    );

    const same = createPlannedOutfitContext(structuredClone(source));
    expect(same.sourceKind).toBe('phase2-outfit-truth');
    if (same.sourceKind !== 'phase2-outfit-truth') throw new Error('expected Phase-2 context');
    expect(same.plannedContextId).toBe(context.plannedContextId);
    expect(same.producerSeed.recommendationId).toBe(context.producerSeed.recommendationId);
    expect(same.producerSeed.recommendationFingerprint).toBe(
      context.producerSeed.recommendationFingerprint,
    );

    const changedTransition = structuredClone(source);
    changedTransition.transitionContextId = 'transition-canonical-12';
    const transitioned = createPlannedOutfitContext(changedTransition);
    expect(transitioned.sourceKind).toBe('phase2-outfit-truth');
    if (transitioned.sourceKind !== 'phase2-outfit-truth') throw new Error('expected Phase-2 context');
    expect(transitioned.plannedContextId).not.toBe(context.plannedContextId);
    expect(transitioned.producerSeed.recommendationId).toBe(context.producerSeed.recommendationId);
    expect(transitioned.producerSeed.recommendationFingerprint).toBe(
      context.producerSeed.recommendationFingerprint,
    );
    const canonicalTransitioned = createOutfitTruthSnapshot({
      transitionContextId: transitioned.producerSeed.transitionContextId,
      input: transitioned.producerSeed.input,
      finalizedRecommendation:
        transitioned.producerSeed.finalizedRecommendation as Recommendation,
      pose: 'sitting',
    });
    expect(canonicalTransitioned.kind).toBe('supported');
    if (canonicalTransitioned.kind !== 'supported') {
      throw new Error('expected supported canonical truth');
    }
    expect(transitioned.producerSeed.recommendationId).toBe(
      canonicalTransitioned.snapshot.recommendationId,
    );
    expect(transitioned.producerSeed.recommendationFingerprint).toBe(
      canonicalTransitioned.snapshot.recommendationFingerprint,
    );
    expect(canonicalTransitioned.snapshot.snapshotId).not.toBe(canonical.snapshot.snapshotId);

    const changedInput = structuredClone(source);
    changedInput.recommendInput.weather.tempC = 2;
    changedInput.weather.tempC = 2;
    changedInput.finalizedRecommendation = recommend(changedInput.recommendInput);
    const changedInputContext = createPlannedOutfitContext(changedInput);
    expect(changedInputContext.sourceKind).toBe('phase2-outfit-truth');
    if (changedInputContext.sourceKind !== 'phase2-outfit-truth') throw new Error('expected Phase-2 context');
    expect(changedInputContext.producerSeed.recommendationId).not.toBe(
      context.producerSeed.recommendationId,
    );
    expect(changedInputContext.producerSeed.recommendationFingerprint).not.toBe(
      context.producerSeed.recommendationFingerprint,
    );
    const canonicalChangedInput = createOutfitTruthSnapshot({
      transitionContextId: changedInputContext.producerSeed.transitionContextId,
      input: changedInputContext.producerSeed.input,
      finalizedRecommendation:
        changedInputContext.producerSeed.finalizedRecommendation as Recommendation,
      pose: 'sitting',
    });
    expect(canonicalChangedInput.kind).toBe('supported');
    if (canonicalChangedInput.kind !== 'supported') {
      throw new Error('expected supported canonical truth');
    }
    expect(changedInputContext.producerSeed.recommendationId).toBe(
      canonicalChangedInput.snapshot.recommendationId,
    );
    expect(changedInputContext.producerSeed.recommendationFingerprint).toBe(
      canonicalChangedInput.snapshot.recommendationFingerprint,
    );

    const changedRecommendation = structuredClone(source);
    changedRecommendation.finalizedRecommendation.layers[0]!.items.push('ekstra testlag');
    const changedRecommendationContext = createPlannedOutfitContext(changedRecommendation);
    expect(changedRecommendationContext.sourceKind).toBe('phase2-outfit-truth');
    if (changedRecommendationContext.sourceKind !== 'phase2-outfit-truth') {
      throw new Error('expected Phase-2 context');
    }
    expect(changedRecommendationContext.producerSeed.recommendationId).not.toBe(
      context.producerSeed.recommendationId,
    );
    expect(changedRecommendationContext.producerSeed.recommendationFingerprint).not.toBe(
      context.producerSeed.recommendationFingerprint,
    );
    const canonicalChangedRecommendation = createOutfitTruthSnapshot({
      transitionContextId: changedRecommendationContext.producerSeed.transitionContextId,
      input: changedRecommendationContext.producerSeed.input,
      finalizedRecommendation:
        changedRecommendationContext.producerSeed.finalizedRecommendation as Recommendation,
      pose: 'sitting',
    });
    expect(canonicalChangedRecommendation.kind).toBe('supported');
    if (canonicalChangedRecommendation.kind !== 'supported') {
      throw new Error('expected supported canonical truth');
    }
    expect(changedRecommendationContext.producerSeed.recommendationId).toBe(
      canonicalChangedRecommendation.snapshot.recommendationId,
    );
    expect(changedRecommendationContext.producerSeed.recommendationFingerprint).toBe(
      canonicalChangedRecommendation.snapshot.recommendationFingerprint,
    );
  });

  it('preserves a complete producer seed for canonical unsupported cardinality', () => {
    const source = canonicalCompleteInput();
    source.recommendInput.weather = {
      feelsLikeC: -30,
      tempC: -30,
      windMs: 8,
      precipMmH: 0,
      humidity: 72,
      symbolCode: 'cloudy',
      uvIndex: 0,
    };
    source.weather = {
      feelsLikeC: -30,
      tempC: -30,
      windMs: 8,
      precipMmH: 0,
      symbolCode: 'cloudy',
    };
    source.recommendInput.child = { ageMonths: 0, canRoll: false };
    source.child.ageMonths = 0;
    (source.recommendInput as { vognMode: 'awake' | 'sleeping' }).vognMode = 'awake';
    (source as { vognMode: 'awake' | 'sleeping' }).vognMode = 'awake';
    source.finalizedRecommendation = recommend(source.recommendInput);
    const canonical = createOutfitTruthSnapshot({
      transitionContextId: source.transitionContextId,
      input: source.recommendInput,
      finalizedRecommendation: source.finalizedRecommendation,
      pose: 'sitting',
    });
    expect(canonical.kind).toBe('unsupported-cardinality');

    const context = createPlannedOutfitContext(source);
    expect(context.sourceKind).toBe('phase2-outfit-truth');
    if (context.sourceKind !== 'phase2-outfit-truth') throw new Error('expected Phase-2 context');
    expect(context.producerSeed.input).toEqual(source.recommendInput);
    expect(context.producerSeed.finalizedRecommendation).toEqual(source.finalizedRecommendation);
    expect(context.producerSeed.recommendationId).toMatch(/^outfit-recommendation-v1:[0-9a-f]{16}$/u);
    expect(context.producerSeed.recommendationFingerprint).toMatch(
      /^outfit-recommendation-fingerprint-v1:[0-9a-f]{16}$/u,
    );
  });

  it('fails closed on flat, injected, mismatched, cyclic, and accessor-backed Phase-2 seeds', () => {
    const valid = canonicalCompleteInput();
    const injected = { ...valid, outfitProducerSeed: { seedVersion: 1 } };
    const flattened = {
      ...valid,
      recommendation: completeInput().recommendation,
    };
    const activityMismatch = structuredClone(valid);
    activityMismatch.finalizedRecommendation.activity = 'utelek';
    const cyclic = canonicalCompleteInput() as ReturnType<typeof canonicalCompleteInput> & {
      recommendInput: Record<string, unknown>;
    };
    cyclic.recommendInput.self = cyclic.recommendInput;
    const accessor = canonicalCompleteInput();
    Object.defineProperty(accessor.finalizedRecommendation, 'summary', {
      enumerable: true,
      get: () => 'getter must not execute',
    });

    for (const invalid of [injected, flattened, activityMismatch, cyclic, accessor]) {
      expect(() => createPlannedOutfitContext(invalid)).toThrow(/PlannedOutfitContext/u);
    }
  });

  it('keeps the Phase-1 string projection explicit and outside the outfit-truth guard', async () => {
    const legacy = createPlannedOutfitContext(completeInput());
    const { isOutfitTruthPlannedOutfitContext } = await import('../planned-outfit-context.js');
    expect(legacy.sourceKind).toBe('phase1-legacy');
    expect(isPlannedOutfitContext(legacy)).toBe(true);
    expect(isOutfitTruthPlannedOutfitContext(legacy)).toBe(false);
  });

  it('preserves existing full source objects at both screen handoffs without a handoff rerun', async () => {
    const [{ default: hjemSource }, { default: ukeSource }] = await Promise.all([
      import(/* @vite-ignore */ '../../../screens/HjemScreen.tsx?raw') as Promise<{ default: string }>,
      import(/* @vite-ignore */ '../../../screens/UkeScreen.tsx?raw') as Promise<{ default: string }>,
    ]);
    const hjemHandoff = hjemSource.slice(
      hjemSource.indexOf('const currentOutfitContext'),
      hjemSource.indexOf('const handleActivityChange'),
    );
    const ukeHandoffStart = ukeSource.indexOf('for (const event of events)');
    const ukeHandoff = ukeSource.slice(ukeHandoffStart, ukeSource.indexOf('contextEntries.push', ukeHandoffStart));

    expect(hjemHandoff).toContain('recommendInput: engineInput');
    expect(hjemHandoff).toContain('finalizedRecommendation: resolvedRecommendation');
    expect(hjemHandoff).not.toMatch(/\brecommend\s*\(/u);
    expect(hjemHandoff).toContain('const orderedGarments = resolvedRecommendation.layers');
    expect(hjemHandoff).toContain('const equipment = resolvedRecommendation.layers');
    expect(hjemHandoff).toContain(".filter((layer) => layer.category !== 'utstyr')");
    expect(hjemHandoff).toContain(".filter((layer) => layer.category === 'utstyr')");
    expect(hjemHandoff).toContain('if (orderedGarments.length === 0) return null;');
    expect(hjemHandoff).toContain('const fingerprint = `current-finalized:${JSON.stringify([');
    for (const fingerprintDimension of [
      'orderedGarments',
      'equipment',
      'now.tempC',
      'now.feelsLikeC',
      'now.windMs',
      'now.precipMmH',
      'now.symbolCode',
    ]) {
      expect(hjemHandoff).toContain(fingerprintDimension);
    }
    expect(hjemHandoff).toContain(
      'planningEventId: `current-event:${evaluatedAtIso}:${fingerprint}`',
    );
    expect(hjemHandoff).toContain(
      'transitionContextId: `current-transition:${evaluatedAtIso}:${fingerprint}`',
    );
    expect(hjemHandoff).not.toMatch(/\brecommendation\s*:\s*\{/u);
    expect(ukeHandoff).toContain('recommendInput: fact.phase.engineInput');
    expect(ukeHandoff).toContain('finalizedRecommendation: fact.phase.recommendation');
    expect(ukeHandoff).not.toMatch(/\brecommend\s*\(/u);
  });

  it('keeps current transition identity distinct for changed finalized outfit or weather basis', () => {
    const evaluatedAtIso = '2026-02-12T11:00:00.000Z';
    const transitionId = (
      orderedGarments: readonly string[],
      equipment: readonly string[],
      weather: Readonly<{
        tempC: number;
        feelsLikeC: number;
        windMs: number;
        precipMmH: number;
        symbolCode: string;
      }>,
    ) => {
      const fingerprint = `current-finalized:${JSON.stringify([
        orderedGarments,
        equipment,
        weather.tempC,
        weather.feelsLikeC,
        weather.windMs,
        weather.precipMmH,
        weather.symbolCode,
      ])}`;
      return `current-transition:${evaluatedAtIso}:${fingerprint}`;
    };
    const weather = {
      tempC: 1,
      feelsLikeC: -2,
      windMs: 3.1,
      precipMmH: 0.4,
      symbolCode: 'lightsnow',
    };
    const base = transitionId(['ullbody', 'vinterdress'], ['vognpose'], weather);

    expect(transitionId(['ullbody', 'balaklava', 'vinterdress'], ['vognpose'], weather))
      .not.toBe(base);
    expect(transitionId(['ullbody', 'vinterdress'], ['regntrekk'], weather)).not.toBe(base);
    expect(transitionId(['ullbody', 'vinterdress'], ['vognpose'], {
      ...weather,
      feelsLikeC: -3,
    })).not.toBe(base);
    expect(transitionId(['ullbody', 'vinterdress'], ['vognpose'], weather)).toBe(base);
  });
  it('exports the fixed timezone, strict constructor, and tolerant guard', () => {
    expect(PLAN_TIME_ZONE).toBe('Europe/Oslo');
    expect(createPlannedOutfitContext).toBeTypeOf('function');
    expect(isPlannedOutfitContext).toBeTypeOf('function');
  });

  it('freezes a complete known-key clone and keeps the three identities distinct', () => {
    const input = completeInput();
    const original = cloneInput(input);
    const context = createPlannedOutfitContext(input);

    expect(context).toMatchObject({
      schemaVersion: 1,
      planningEventId: original.planningEventId,
      transitionContextId: original.transitionContextId,
      child: original.child,
      plannedForIso: original.plannedForIso,
      timeZone: original.timeZone,
      place: original.place,
      activity: original.activity,
      vognMode: original.vognMode,
      weather: original.weather,
      recommendation: original.recommendation,
      access: original.access,
    });
    expect(context.plannedContextId).toMatch(/^planned-context-[0-9a-f]{16}$/u);
    expect(new Set([
      context.plannedContextId,
      context.planningEventId,
      context.transitionContextId,
    ])).toHaveLength(3);
    expect(context).not.toHaveProperty('contextId');
    assertRecursivelyFrozen(context);
    expect(isPlannedOutfitContext(context)).toBe(true);

    input.child.name = 'Mutert barn';
    input.place.label = 'Mutert sted';
    input.weather.tempC = 99;
    input.recommendation.orderedGarments[0] = 'Mutert plagg';
    input.access.allowed = false;
    expect(context).toMatchObject({
      child: original.child,
      place: original.place,
      weather: original.weather,
      recommendation: original.recommendation,
      access: original.access,
    });
  });

  it('is byte-stable for canonical Unicode input and changes identity for every planned dimension', () => {
    const canonical = completeInput();
    const decomposed = cloneInput(canonical);
    decomposed.child.name = 'A\u030Ase';
    decomposed.place.label = 'Pro\u0308vested';
    const precomposed = cloneInput(canonical);
    precomposed.child.name = 'Åse';
    precomposed.place.label = 'Prövested';

    expect(JSON.stringify(createPlannedOutfitContext(decomposed))).toBe(
      JSON.stringify(createPlannedOutfitContext(precomposed)),
    );
    expect(JSON.stringify(createPlannedOutfitContext(canonical))).toBe(
      JSON.stringify(createPlannedOutfitContext(cloneInput(canonical))),
    );

    const baseId = createPlannedOutfitContext(canonical).plannedContextId;
    const mutations: readonly ((draft: MutablePlannedContextInput) => void)[] = [
      (draft) => { draft.planningEventId = 'planning-event-future-12'; },
      (draft) => { draft.transitionContextId = 'transition-future-12'; },
      (draft) => { draft.child.id = 'et-annet-barn'; },
      (draft) => { draft.child.name = 'Et annet navn'; },
      (draft) => { draft.child.ageMonths = 6; },
      (draft) => { draft.plannedForIso = '2026-02-12T12:00:00.000Z'; },
      (draft) => { draft.place.label = 'Et annet sted'; },
      (draft) => { draft.place.lat = 60; },
      (draft) => { draft.place.lon = 10; },
      (draft) => { draft.place.source = 'fixed-home'; },
      (draft) => { draft.activity = 'utelek'; draft.vognMode = null; },
      (draft) => { draft.vognMode = 'awake'; },
      (draft) => { draft.weather.tempC = 2; },
      (draft) => { draft.weather.feelsLikeC = -1; },
      (draft) => { draft.weather.windMs = 4; },
      (draft) => { draft.weather.precipMmH = 0; },
      (draft) => { draft.weather.symbolCode = 'partlycloudy_day'; },
      (draft) => { draft.recommendation.id = 'finalized-recommendation-02'; },
      (draft) => { draft.recommendation.fingerprint = 'synthetic:changed'; },
      (draft) => { draft.recommendation.orderedGarments.push('Balaklava'); },
      (draft) => { draft.recommendation.equipment.push('Regntrekk'); },
      (draft) => { draft.access.capability = 'extra_places'; },
      (draft) => { draft.access.allowed = false; draft.access.reason = 'expired'; },
    ];

    for (const mutate of mutations) {
      const changed = cloneInput(canonical);
      mutate(changed);
      expect(createPlannedOutfitContext(changed).plannedContextId).not.toBe(baseId);
    }
  });

  it.each(['configured-place', 'fixed-home', 'automatic'])(
    'accepts the closed place source %s and exact coordinate boundaries',
    (source) => {
      const northEast = completeInput();
      northEast.place = { ...northEast.place, source, lat: 90, lon: 180 };
      const southWest = completeInput();
      southWest.place = { ...southWest.place, source, lat: -90, lon: -180 };
      expect(createPlannedOutfitContext(northEast)).toMatchObject({ place: northEast.place });
      expect(createPlannedOutfitContext(southWest)).toMatchObject({ place: southWest.place });
    },
  );

  it('rejects missing, partial, defaultable, aliased, and malformed creation input', () => {
    const invalidInputs: unknown[] = [
      undefined,
      null,
      {},
      { ...completeInput(), planningEventId: '' },
      { ...completeInput(), transitionContextId: 'planning-event-future-11' },
      { ...completeInput(), plannedForIso: '2026-02-30T11:00:00.000Z' },
      { ...completeInput(), timeZone: 'UTC' },
      { ...completeInput(), child: { ...completeInput().child, id: '' } },
      { ...completeInput(), child: { ...completeInput().child, name: '   ' } },
      { ...completeInput(), child: { ...completeInput().child, ageMonths: -1 } },
      { ...completeInput(), child: { ...completeInput().child, ageMonths: 5.5 } },
      { ...completeInput(), child: { ...completeInput().child, ageMonths: 25 } },
      { ...completeInput(), place: { ...completeInput().place, label: '' } },
      { ...completeInput(), place: { ...completeInput().place, lat: Number.NaN } },
      { ...completeInput(), place: { ...completeInput().place, lat: 90.0001 } },
      { ...completeInput(), place: { ...completeInput().place, lon: Number.POSITIVE_INFINITY } },
      { ...completeInput(), place: { ...completeInput().place, lon: -180.0001 } },
      { ...completeInput(), place: { ...completeInput().place, source: 'current-device' } },
      { ...completeInput(), activity: 'bil' },
      { ...completeInput(), vognMode: 'unknown' },
      { ...completeInput(), activity: 'utelek', vognMode: 'awake' },
      { ...completeInput(), activity: 'vogn', vognMode: null },
      { ...completeInput(), weather: { ...completeInput().weather, tempC: Number.NaN } },
      { ...completeInput(), weather: { ...completeInput().weather, feelsLikeC: Number.POSITIVE_INFINITY } },
      { ...completeInput(), weather: { ...completeInput().weather, windMs: -0.1 } },
      { ...completeInput(), weather: { ...completeInput().weather, precipMmH: -0.1 } },
      { ...completeInput(), weather: { ...completeInput().weather, symbolCode: '' } },
      { ...completeInput(), recommendation: { ...completeInput().recommendation, finalized: false } },
      { ...completeInput(), recommendation: { ...completeInput().recommendation, id: '' } },
      { ...completeInput(), recommendation: { ...completeInput().recommendation, fingerprint: '' } },
      { ...completeInput(), recommendation: { ...completeInput().recommendation, orderedGarments: [] } },
      {
        ...completeInput(),
        recommendation: { ...completeInput().recommendation, orderedGarments: ['Ullbody', '  '] },
      },
      { ...completeInput(), access: { ...completeInput().access, capability: 'unknown' } },
      { ...completeInput(), access: { ...completeInput().access, allowed: false } },
      { ...completeInput(), access: { ...completeInput().access, reason: 'role_denied' } },
    ];

    for (const invalid of invalidInputs) {
      expect(() => createPlannedOutfitContext(invalid)).toThrow(/PlannedOutfitContext/u);
    }
  });

  it('uses a total tolerant guard that rejects mutable, partial, tampered, circular, and hostile values', () => {
    const valid = createPlannedOutfitContext(completeInput());
    const mutableClone = structuredClone(valid);
    const tampered = structuredClone(valid) as Record<string, unknown>;
    tampered.plannedContextId = 'planned-context-0000000000000000';
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const hostile = new Proxy({}, {
      get() {
        throw new Error('hostile getter');
      },
    });
    const unknownValues: unknown[] = [
      undefined,
      null,
      false,
      0,
      Number.NaN,
      '',
      Symbol('context'),
      1n,
      [],
      {},
      { schemaVersion: 1 },
      mutableClone,
      tampered,
      circular,
      hostile,
    ];

    for (const value of unknownValues) {
      expect(() => isPlannedOutfitContext(value)).not.toThrow();
      expect(isPlannedOutfitContext(value)).toBe(false);
    }
    expect(isPlannedOutfitContext(valid)).toBe(true);
  });

  it('rejects sparse and prototype-backed recommendation arrays', () => {
    const sparseGarments = completeInput();
    sparseGarments.recommendation.orderedGarments = new Array<string>(1);
    const sparseEquipment = completeInput();
    sparseEquipment.recommendation.equipment = new Array<string>(1);

    class GarmentArray extends Array<string> {}
    const subclassGarments = completeInput();
    subclassGarments.recommendation.orderedGarments = new GarmentArray('Ullbody');

    const inheritedGarments = completeInput();
    const prototype = Object.assign(Object.create(Array.prototype) as string[], {
      0: 'Ullbody',
    });
    const prototypeBacked = new Array<string>(1);
    Object.setPrototypeOf(prototypeBacked, prototype);
    inheritedGarments.recommendation.orderedGarments = prototypeBacked;

    for (const invalid of [
      sparseGarments,
      sparseEquipment,
      subclassGarments,
      inheritedGarments,
    ]) {
      expect(() => createPlannedOutfitContext(invalid)).toThrow(/PlannedOutfitContext/u);
    }
  });

  it('rejects root and nested accessors and non-plain creation input', () => {
    const rootAccessor = completeInput();
    Object.defineProperty(rootAccessor, 'plannedForIso', {
      enumerable: true,
      get: () => '2026-02-12T11:00:00.000Z',
    });

    const nestedAccessor = completeInput();
    Object.defineProperty(nestedAccessor.place, 'source', {
      enumerable: true,
      get: () => 'configured-place',
    });

    const nonPlain = completeInput();
    Object.setPrototypeOf(nonPlain, { inheritedSecret: 'must-not-cross-boundary' });

    for (const invalid of [rootAccessor, nestedAccessor, nonPlain]) {
      expect(() => createPlannedOutfitContext(invalid)).toThrow(/PlannedOutfitContext/u);
    }
  });

  it('makes the guard reject accessor, prototype, and array forgeries', () => {
    const valid = createPlannedOutfitContext(completeInput());
    const validRecord = valid as Readonly<Record<string, unknown>>;

    let rootBacking = valid.plannedContextId;
    const accessorRoot = { ...valid };
    Object.defineProperty(accessorRoot, 'plannedContextId', {
      enumerable: true,
      get: () => rootBacking,
    });
    Object.freeze(accessorRoot);

    let temperatureBacking = valid.weather.tempC;
    const accessorWeather = { ...valid.weather };
    Object.defineProperty(accessorWeather, 'tempC', {
      enumerable: true,
      get: () => temperatureBacking,
    });
    Object.freeze(accessorWeather);
    const accessorNested = frozenContextWith(validRecord, { weather: accessorWeather });

    const customPrototype = Object.create({ inheritedSecret: 'crossed-boundary' }) as Record<string, unknown>;
    Object.defineProperties(customPrototype, Object.getOwnPropertyDescriptors(valid));
    Object.freeze(customPrototype);

    class GarmentArray extends Array<string> {}
    const subclassGarments = Object.freeze(new GarmentArray(...valid.recommendation.orderedGarments));
    const subclassRecommendation = Object.freeze({
      ...valid.recommendation,
      orderedGarments: subclassGarments,
    });
    const subclassContext = frozenContextWith(validRecord, {
      recommendation: subclassRecommendation,
    });

    const inheritedPrototype = Object.assign(Object.create(Array.prototype) as string[], Object.fromEntries(
      valid.recommendation.orderedGarments.map((garment, index) => [index, garment]),
    ));
    const inheritedArray = new Array<string>(valid.recommendation.orderedGarments.length);
    Object.setPrototypeOf(inheritedArray, inheritedPrototype);
    Object.freeze(inheritedArray);
    const inheritedRecommendation = Object.freeze({
      ...valid.recommendation,
      orderedGarments: inheritedArray,
    });
    const inheritedContext = frozenContextWith(validRecord, {
      recommendation: inheritedRecommendation,
    });

    for (const forgery of [
      accessorRoot,
      accessorNested,
      customPrototype,
      subclassContext,
      inheritedContext,
    ]) {
      expect(isPlannedOutfitContext(forgery)).toBe(false);
    }
    rootBacking = 'planned-context-0000000000000000';
    temperatureBacking = 99;
    expect(accessorRoot.plannedContextId).toBe(rootBacking);
    expect(accessorWeather.tempC).toBe(temperatureBacking);
  });

  it('requires factory ownership before the guard accepts a planned context', () => {
    const valid = createPlannedOutfitContext(completeInput());
    const rootProxy = new Proxy(valid, {
      get(target, property, receiver) {
        if (property === 'plannedContextId') throw new Error('root proxy changed after validation');
        return Reflect.get(target, property, receiver);
      },
    });
    const nestedProxy = new Proxy(valid.weather, {
      get(target, property, receiver) {
        if (property === 'tempC') throw new Error('nested proxy changed after validation');
        return Reflect.get(target, property, receiver);
      },
    });
    const nestedWrapper = Object.freeze({ ...valid, weather: nestedProxy });

    expect(isPlannedOutfitContext(rootProxy)).toBe(false);
    expect(isPlannedOutfitContext(nestedWrapper)).toBe(false);
    expect(() => rootProxy.plannedContextId).toThrow('root proxy changed after validation');
    expect(() => nestedProxy.tempC).toThrow('nested proxy changed after validation');
    expect(isPlannedOutfitContext(valid)).toBe(true);
  });

  it('canonicalizes negative zero before identity and output', () => {
    const zero = completeInput();
    zero.place.lat = 0;
    zero.weather.windMs = 0;
    const negativeZero = cloneInput(zero);
    negativeZero.place.lat = -0;
    negativeZero.weather.windMs = -0;

    const zeroContext = createPlannedOutfitContext(zero);
    const negativeZeroContext = createPlannedOutfitContext(negativeZero);
    expect(negativeZeroContext.plannedContextId).toBe(zeroContext.plannedContextId);
    expect(Object.is(negativeZeroContext.place.lat, -0)).toBe(false);
    expect(Object.is(negativeZeroContext.weather.windMs, -0)).toBe(false);
  });

  it('rejects access decisions that contradict the capability map', () => {
    const invalidAccess = [
      { capability: 'future_plan', allowed: true, reason: 'free' },
      { capability: 'today_home', allowed: true, reason: 'plus' },
      { capability: 'extra_places', allowed: false, reason: 'signed_out' },
    ];
    for (const access of invalidAccess) {
      expect(() => createPlannedOutfitContext({ ...completeInput(), access })).toThrow(
        /PlannedOutfitContext/u,
      );
    }

    const validAccess = [
      { capability: 'today_home', allowed: true, reason: 'free' },
      { capability: 'today_home', allowed: false, reason: 'loading' },
      { capability: 'future_plan', allowed: true, reason: 'plus' },
      { capability: 'future_plan', allowed: false, reason: 'expired' },
      { capability: 'family_sharing', allowed: false, reason: 'signed_out' },
      { capability: 'family_sharing', allowed: false, reason: 'role_denied' },
    ];
    for (const access of validAccess) {
      expect(createPlannedOutfitContext({ ...completeInput(), access })).toMatchObject({ access });
    }
  });

  it('rejects deceptive Unicode controls and cross-category duplicates', () => {
    for (const deceptive of ['barn\u0085navn', 'barn\u202Enavn', 'barn\u200Bnavn', 'barn\u061Cnavn']) {
      const input = completeInput();
      input.child.name = deceptive;
      expect(() => createPlannedOutfitContext(input)).toThrow(/PlannedOutfitContext/u);
    }

    for (const legitimate of ['نام\u200Cها', 'familie\u200Dnavn']) {
      const input = completeInput();
      input.child.name = legitimate;
      expect(createPlannedOutfitContext(input).child.name).toBe(legitimate);
    }

    const duplicate = completeInput();
    duplicate.recommendation.orderedGarments = ['Vognpose'];
    duplicate.recommendation.equipment = ['Vognpose'];
    expect(() => createPlannedOutfitContext(duplicate)).toThrow(/PlannedOutfitContext/u);
  });

  it('rejects all Unicode format controls except ZWNJ and ZWJ', () => {
    for (const disallowed of ['A\u206AB', 'A\u180EB']) {
      const input = completeInput();
      input.child.name = disallowed;
      expect(() => createPlannedOutfitContext(input)).toThrow(/PlannedOutfitContext/u);
    }

    for (const allowed of ['A\u200CB', 'A\u200DB']) {
      const input = completeInput();
      input.child.name = allowed;
      expect(createPlannedOutfitContext(input).child.name).toBe(allowed);
    }
  });

  it('copies only known keys and has no persistence, URL, logging, tracking, or network capability', async () => {
    const input = completeInput() as MutablePlannedContextInput & {
      extra?: string;
    };
    input.extra = 'must-not-cross-boundary';
    const context = createPlannedOutfitContext(input);
    expect(context).not.toHaveProperty('extra');

    const sourcePath = '../planned-outfit-context.ts?raw';
    const sourceModule = await import(/* @vite-ignore */ sourcePath) as { default: string };
    expect(sourceModule.default).not.toMatch(
      /\b(?:localStorage|sessionStorage|indexedDB|fetch|XMLHttpRequest|WebSocket|sendBeacon|console|posthog|analytics|track|pushState|replaceState|URLSearchParams)\b/u,
    );
    expect(sourceModule.default).not.toMatch(/\bcontextId\b/u);
  });
});
