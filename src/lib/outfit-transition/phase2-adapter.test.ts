import { readFileSync } from 'node:fs';
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  createCurrentOutfitContext,
} from '../planning/planned-outfit-context.js';
import { recommend } from '../wool-layers/recommend.js';
import type {
  RecommendInput,
  Recommendation,
} from '../wool-layers/types.js';
import {
  isOutfitBundleProducerResult,
  produceOutfitBundle,
  type OutfitBundleProducerResult,
} from '../outfit/outfit-bundle-producer.js';
import type {
  AvatarVisualCoverage,
  OutfitItemId,
} from '../outfit/outfit-truth.js';
import {
  createPhase2TransitionAdapter,
  type Phase2TransitionAdapter,
  type Phase2TransitionAdapterResult,
} from './phase2-adapter.js';

vi.mock('../outfit/outfit-bundle-producer.js', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('../outfit/outfit-bundle-producer.js')
  >();
  return {
    ...actual,
    isOutfitBundleProducerResult: vi.fn(
      actual.isOutfitBundleProducerResult,
    ),
  };
});

type MutableGarment = {
  itemId: string;
  visibleOnAvatar: boolean;
  avatarCoverage: AvatarVisualCoverage | null;
  [key: string]: unknown;
};

type MutableSupportedBundle = {
  kind: string;
  base: {
    snapshotId: string;
    recommendationFingerprint: string;
    transitionContextId: string;
    garments: MutableGarment[];
    equipment: Array<{ itemId: string; [key: string]: unknown }>;
    avatar: {
      visibleGarmentIds: string[];
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

const VALID_RECT = Object.freeze({
  x: 12,
  y: 24,
  width: 96,
  height: 48,
});

class TestElement {
  readonly isConnected: boolean;
  readonly #rect: Readonly<{
    x: number;
    y: number;
    width: number;
    height: number;
  }>;

  constructor(
    rect: Readonly<{
      x: number;
      y: number;
      width: number;
      height: number;
    }> = VALID_RECT,
    isConnected = true,
  ) {
    this.#rect = rect;
    this.isConnected = isConnected;
  }

  getBoundingClientRect(): DOMRect {
    const rect = this.#rect;
    return {
      ...rect,
      top: rect.y,
      right: rect.x + rect.width,
      bottom: rect.y + rect.height,
      left: rect.x,
      toJSON: () => ({ ...rect }),
    } as DOMRect;
  }
}

const originalElement = globalThis.Element;

beforeAll(() => {
  Object.defineProperty(globalThis, 'Element', {
    configurable: true,
    value: TestElement,
  });
});

afterAll(() => {
  if (originalElement === undefined) {
    delete (globalThis as { Element?: typeof Element }).Element;
    return;
  }
  Object.defineProperty(globalThis, 'Element', {
    configurable: true,
    value: originalElement,
  });
});

function completeRecommendInput(): RecommendInput {
  return {
    weather: {
      tempC: 28,
      feelsLikeC: 28,
      windMs: 0,
      precipMmH: 0,
      humidity: 48,
      symbolCode: 'clearsky_day',
      uvIndex: 3,
    },
    child: { ageMonths: 0, canRoll: false },
    activity: 'vogn',
    exposureMin: 30,
    innerJakke: false,
    vognMode: 'awake',
    context: { bilstol: false },
    childCalibration: 0,
  };
}

function recommendationProjection(
  recommendation: Recommendation,
): Readonly<{
  orderedGarments: readonly string[];
  equipment: readonly string[];
}> {
  return {
    orderedGarments: recommendation.layers
      .filter((layer) => layer.category !== 'utstyr')
      .flatMap((layer) => layer.items),
    equipment: recommendation.layers
      .filter((layer) => layer.category === 'utstyr')
      .flatMap((layer) => layer.items),
  };
}

function createSupportedBundle(): Extract<
  OutfitBundleProducerResult,
  { kind: 'supported' }
> {
  const input = completeRecommendInput();
  const finalizedRecommendation = recommend(input);
  const { orderedGarments, equipment } =
    recommendationProjection(finalizedRecommendation);
  const plannedForIso = '2026-07-25T10:00:00.000Z';
  const rawTransitionContextId =
    `current-transition:${plannedForIso}:current-finalized:${
      JSON.stringify([
        orderedGarments,
        equipment,
        input.weather.tempC,
        input.weather.feelsLikeC,
        input.weather.windMs,
        input.weather.precipMmH,
        input.weather.symbolCode ?? 'unknown',
      ])
    }`;
  const context = createCurrentOutfitContext({
    planningEventId: 'phase2-adapter-fixture',
    transitionContextId: rawTransitionContextId,
    child: {
      id: 'barn-01',
      name: 'Ada',
      ageMonths: input.child.ageMonths,
    },
    plannedForIso,
    timeZone: 'Europe/Oslo',
    place: {
      label: 'Hjemme',
      lat: 59.9139,
      lon: 10.7522,
      source: 'configured-place',
    },
    activity: input.activity,
    vognMode: input.vognMode ?? null,
    weather: {
      tempC: input.weather.tempC,
      feelsLikeC: input.weather.feelsLikeC,
      windMs: input.weather.windMs,
      precipMmH: input.weather.precipMmH,
      symbolCode: input.weather.symbolCode ?? 'unknown',
    },
    recommendInput: input,
    finalizedRecommendation,
    access: {
      capability: 'future_plan',
      allowed: true,
      reason: 'plus',
    },
  });
  if (context.sourceKind !== 'phase2-outfit-truth') {
    throw new Error('expected exact Phase 2 context');
  }
  const result = produceOutfitBundle({
    seed: context.producerSeed,
    source: {
      kind: 'current',
      sourceContextId: context.producerSeed.sourceContextId,
    },
  });
  if (result.kind !== 'supported') {
    throw new Error(`expected supported fixture, received ${result.kind}`);
  }
  if (result.base.avatar.visibleGarmentIds.length !== 2) {
    throw new Error('expected the real verified two-garment avatar fixture');
  }
  return result;
}

function element(
  rect: Readonly<{
    x: number;
    y: number;
    width: number;
    height: number;
  }> = VALID_RECT,
  isConnected = true,
): HTMLElement {
  return new TestElement(rect, isConnected) as unknown as HTMLElement;
}

function visibleIds(
  bundle: Extract<OutfitBundleProducerResult, { kind: 'supported' }>,
): readonly OutfitItemId[] {
  return bundle.base.avatar.visibleGarmentIds;
}

function registerComplete(
  adapter: Phase2TransitionAdapter,
  bundle: Extract<OutfitBundleProducerResult, { kind: 'supported' }>,
): void {
  for (const itemId of visibleIds(bundle)) {
    adapter.registerHomeAnchor(itemId, element());
    adapter.registerOutfitRow(itemId, element());
  }
}

function evaluate(
  adapter: Phase2TransitionAdapter,
  outfitBundle: OutfitBundleProducerResult | null | undefined,
  transitionVisualState: 'settled' | 'landing' = 'settled',
): Phase2TransitionAdapterResult {
  return adapter.evaluate({
    outfitBundle,
    transitionVisualState,
  });
}

function evaluateUnknown(
  adapter: Phase2TransitionAdapter,
  input: unknown,
): Phase2TransitionAdapterResult {
  return Reflect.apply(adapter.evaluate, undefined, [input]) as
    Phase2TransitionAdapterResult;
}

function trustedMutation(
  source: Extract<OutfitBundleProducerResult, { kind: 'supported' }>,
  mutate: (bundle: MutableSupportedBundle) => void,
): OutfitBundleProducerResult {
  const clone = structuredClone(source) as unknown as MutableSupportedBundle;
  mutate(clone);
  vi.mocked(isOutfitBundleProducerResult).mockReturnValueOnce(true);
  return clone as unknown as OutfitBundleProducerResult;
}

function coverage(
  bodyCoverage: AvatarVisualCoverage['bodyCoverage'],
  visibleSlots: AvatarVisualCoverage['visibleSlots'],
  visualLayerRank: number,
  occludesSlots: AvatarVisualCoverage['occludesSlots'],
): AvatarVisualCoverage {
  return {
    coverageVersion: 1,
    bodyCoverage,
    visibleSlots,
    visualLayerRank,
    occludesSlots,
  };
}

function expectStatic(
  result: Phase2TransitionAdapterResult,
  reason?: string,
): void {
  expect(result).toMatchObject({
    kind: 'static-only',
    ...(reason === undefined ? {} : { reason }),
  });
}

describe('Phase 2 transition adapter contract', () => {
  it('uses only the accepted Phase 2 type exports and authoritative visibility fields', () => {
    const source = readFileSync(
      new URL('./phase2-adapter.ts', import.meta.url),
      'utf8',
    );

    expect(source).toMatch(
      /import type \{[\s\S]*AvatarVisibleSlot[\s\S]*AvatarVisualCoverage[\s\S]*OutfitItemId[\s\S]*OutfitTruthSnapshotV1[\s\S]*\} from '\.\.\/outfit\/outfit-truth\.js';/,
    );
    expect(source).toMatch(
      /import type \{[\s\S]*OutfitBundleProducerResult[\s\S]*\} from '\.\.\/outfit\/outfit-bundle-producer\.js';/,
    );
    expect(source).toMatch(
      /import type \{[\s\S]*OutfitTransitionVisualState[\s\S]*RegisterOutfitRow[\s\S]*\} from '\.\.\/outfit\/outfit-transition-contract\.js';/,
    );
    expect(source).toContain('base.avatar.visibleGarmentIds');
    expect(source).toContain('visibleOnAvatar');
    expect(source).toContain('avatarCoverage');
    expect(source).not.toMatch(/base\.garments\.(?:map|filter|find|some)/);
    expect(source).not.toMatch(
      /alternative|querySelector|className|verifiedAssetPath|innerHTML/i,
    );
  });

  it('accepts a real factory-owned Phase 2 bundle and preserves avatar-visible order', () => {
    const bundle = createSupportedBundle();
    const adapter = createPhase2TransitionAdapter();
    registerComplete(adapter, bundle);

    const result = evaluate(adapter, bundle);

    expect(result).toMatchObject({
      kind: 'ready',
      transitionVisualState: 'settled',
      identity: {
        snapshotId: bundle.base.snapshotId,
        recommendationFingerprint:
          bundle.base.recommendationFingerprint,
        transitionContextId: bundle.base.transitionContextId,
      },
      itemIds: visibleIds(bundle),
    });
    expect(result.kind).toBe('ready');
    if (result.kind !== 'ready') return;
    expect(result.itemIds).toEqual(visibleIds(bundle));
    expect(result.homeAnchors.map((entry) => entry.itemId)).toEqual(
      visibleIds(bundle),
    );
    expect(result.outfitRows.map((entry) => entry.itemId)).toEqual(
      visibleIds(bundle),
    );
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.itemIds)).toBe(true);
    expect(Object.isFrozen(result.homeAnchors)).toBe(true);
    expect(Object.isFrozen(result.outfitRows)).toBe(true);
  });

  it('keeps scalar visual state unrelated to identity and eligibility', () => {
    const bundle = createSupportedBundle();
    const adapter = createPhase2TransitionAdapter();
    registerComplete(adapter, bundle);

    const settled = evaluate(adapter, bundle, 'settled');
    const landing = evaluate(adapter, bundle, 'landing');

    expect(settled.kind).toBe('ready');
    expect(landing.kind).toBe('ready');
    if (settled.kind !== 'ready' || landing.kind !== 'ready') return;
    expect(landing.itemIds).toEqual(settled.itemIds);
    expect(landing.identity).toEqual(settled.identity);
    expect(landing.transitionVisualState).toBe('landing');
    expect(settled.transitionVisualState).toBe('settled');
  });

  it('accepts one authoritative avatar-visible ID without selecting its unlisted peer', () => {
    const bundle = createSupportedBundle();
    const firstId = visibleIds(bundle)[0]!;
    const single = trustedMutation(bundle, (candidate) => {
      candidate.base.avatar.visibleGarmentIds = [firstId];
    });
    const adapter = createPhase2TransitionAdapter();
    adapter.registerHomeAnchor(firstId, element());
    adapter.registerOutfitRow(firstId, element());

    const result = evaluate(adapter, single);

    expect(result).toMatchObject({
      kind: 'ready',
      itemIds: [firstId],
    });
  });

  it('never promotes unlisted garments and preserves visible-ID order after garment reordering', () => {
    const bundle = createSupportedBundle();
    const reversed = trustedMutation(bundle, (candidate) => {
      candidate.base.garments.reverse();
      candidate.base.garments.push({
        ...candidate.base.garments[0]!,
        itemId: 'unlisted-garment',
      });
    });
    const adapter = createPhase2TransitionAdapter();
    registerComplete(adapter, bundle);

    const result = evaluate(adapter, reversed);

    expect(result.kind).toBe('ready');
    if (result.kind !== 'ready') return;
    expect(result.itemIds).toEqual(visibleIds(bundle));
    expect(result.itemIds).not.toContain('unlisted-garment');
  });

  it('accepts multiple slots, disjoint layers, and explicit resolved partial occlusion', () => {
    const bundle = createSupportedBundle();
    const ids = visibleIds(bundle);
    const explicitOcclusion = trustedMutation(bundle, (candidate) => {
      candidate.base.garments[0]!.avatarCoverage = coverage(
        ['torso', 'arms'],
        ['torso', 'arms'],
        10,
        ['torso', 'arms'],
      );
      candidate.base.garments[1]!.avatarCoverage = coverage(
        ['torso'],
        ['torso'],
        20,
        ['torso'],
      );
      candidate.base.avatar.visibleGarmentIds = [
        ids[1]!,
        ids[0]!,
      ];
    });
    const adapter = createPhase2TransitionAdapter();
    for (const itemId of [ids[1]!, ids[0]!]) {
      adapter.registerHomeAnchor(itemId, element());
      adapter.registerOutfitRow(itemId, element());
    }

    const result = evaluate(adapter, explicitOcclusion);

    expect(result).toMatchObject({
      kind: 'ready',
      itemIds: [ids[1], ids[0]],
    });
  });

  it.each([
    {
      name: 'empty visible ID set',
      mutate: (candidate: MutableSupportedBundle) => {
        candidate.base.avatar.visibleGarmentIds = [];
      },
      reason: 'empty-visible-set',
    },
    {
      name: 'duplicate visible ID',
      mutate: (candidate: MutableSupportedBundle) => {
        const first = candidate.base.avatar.visibleGarmentIds[0]!;
        candidate.base.avatar.visibleGarmentIds = [first, first];
      },
      reason: 'duplicate-visible-id',
    },
    {
      name: 'empty visible ID',
      mutate: (candidate: MutableSupportedBundle) => {
        candidate.base.avatar.visibleGarmentIds[0] = '';
      },
      reason: 'invalid-visible-id',
    },
    {
      name: 'unknown visible ID',
      mutate: (candidate: MutableSupportedBundle) => {
        candidate.base.avatar.visibleGarmentIds[0] = 'unknown-id';
      },
      reason: 'missing-garment',
    },
    {
      name: 'missing garment match',
      mutate: (candidate: MutableSupportedBundle) => {
        const selected = candidate.base.avatar.visibleGarmentIds[0]!;
        candidate.base.garments = candidate.base.garments.filter(
          (garment) => garment.itemId !== selected,
        );
      },
      reason: 'missing-garment',
    },
    {
      name: 'duplicate garment match',
      mutate: (candidate: MutableSupportedBundle) => {
        candidate.base.garments.push({
          ...candidate.base.garments[0]!,
        });
      },
      reason: 'duplicate-garment-id',
    },
    {
      name: 'false visibleOnAvatar',
      mutate: (candidate: MutableSupportedBundle) => {
        candidate.base.garments[0]!.visibleOnAvatar = false;
      },
      reason: 'garment-not-visible',
    },
    {
      name: 'unknown body region with null anchor',
      mutate: (candidate: MutableSupportedBundle) => {
        candidate.base.garments[0]!.bodyRegion = 'unknown';
        candidate.base.garments[0]!.bodyAnchor = null;
      },
      reason: 'invalid-body-anchor',
    },
    {
      name: 'non-finite semantic body anchor',
      mutate: (candidate: MutableSupportedBundle) => {
        const anchor = candidate.base.garments[0]!.bodyAnchor;
        candidate.base.garments[0]!.bodyAnchor = {
          ...(anchor as object),
          x: Number.NaN,
        };
      },
      reason: 'invalid-body-anchor',
    },
    {
      name: 'body anchor pose mismatches the authoritative avatar pose',
      mutate: (candidate: MutableSupportedBundle) => {
        const anchor = candidate.base.garments[0]!.bodyAnchor;
        candidate.base.garments[0]!.bodyAnchor = {
          ...(anchor as object),
          pose: candidate.base.avatar.pose === 'sitting'
            ? 'standing'
            : 'sitting',
        };
      },
      reason: 'invalid-body-anchor',
    },
    {
      name: 'body region is outside the runtime BodyRegion domain',
      mutate: (candidate: MutableSupportedBundle) => {
        candidate.base.garments[0]!.bodyRegion = 'shoulders';
      },
      reason: 'invalid-body-anchor',
    },
    {
      name: 'body region is semantically inconsistent with the catalog garment',
      mutate: (candidate: MutableSupportedBundle) => {
        candidate.base.garments[0]!.bodyRegion = 'feet';
      },
      reason: 'invalid-body-anchor',
    },
    {
      name: 'body anchor coordinates are semantically inconsistent with the catalog garment',
      mutate: (candidate: MutableSupportedBundle) => {
        const anchor = candidate.base.garments[0]!.bodyAnchor;
        candidate.base.garments[0]!.bodyAnchor = {
          ...(anchor as object),
          y: 0.01,
        };
      },
      reason: 'invalid-body-anchor',
    },
    {
      name: 'equipment collision',
      mutate: (candidate: MutableSupportedBundle) => {
        candidate.base.equipment.push({
          itemId: candidate.base.avatar.visibleGarmentIds[0]!,
        });
      },
      reason: 'equipment-collision',
    },
  ])('settles statically for $name', ({ mutate, reason }) => {
    const bundle = createSupportedBundle();
    const candidate = trustedMutation(bundle, mutate);
    const adapter = createPhase2TransitionAdapter();
    registerComplete(adapter, bundle);

    expectStatic(evaluate(adapter, candidate), reason);
  });

  it.each([
    {
      name: 'null coverage',
      coverage: null,
      reason: 'invalid-avatar-coverage',
    },
    {
      name: 'empty body coverage',
      coverage: coverage([], ['torso'], 10, ['torso']),
      reason: 'invalid-avatar-coverage',
    },
    {
      name: 'empty visible slots',
      coverage: coverage(['torso'], [], 10, ['torso']),
      reason: 'invalid-avatar-coverage',
    },
    {
      name: 'duplicate body slot',
      coverage: coverage(
        ['torso', 'torso'],
        ['torso'],
        10,
        ['torso'],
      ),
      reason: 'invalid-avatar-coverage',
    },
    {
      name: 'duplicate visible slot',
      coverage: coverage(
        ['torso'],
        ['torso', 'torso'],
        10,
        ['torso'],
      ),
      reason: 'invalid-avatar-coverage',
    },
    {
      name: 'unknown slot',
      coverage: coverage(
        ['torso'],
        ['unknown' as never],
        10,
        ['torso'],
      ),
      reason: 'invalid-avatar-coverage',
    },
    {
      name: 'visible slot outside body coverage',
      coverage: coverage(
        ['torso'],
        ['arms'],
        10,
        ['torso'],
      ),
      reason: 'invalid-avatar-coverage',
    },
    {
      name: 'duplicate occlusion slot',
      coverage: coverage(
        ['torso'],
        ['torso'],
        10,
        ['torso', 'torso'],
      ),
      reason: 'invalid-avatar-coverage',
    },
    {
      name: 'occlusion slot outside body coverage',
      coverage: coverage(
        ['torso'],
        ['torso'],
        10,
        ['arms'],
      ),
      reason: 'invalid-avatar-coverage',
    },
    {
      name: 'non-finite rank',
      coverage: coverage(
        ['torso'],
        ['torso'],
        Number.NaN,
        ['torso'],
      ),
      reason: 'invalid-avatar-coverage',
    },
  ])('rejects $name', ({ coverage: invalidCoverage, reason }) => {
    const bundle = createSupportedBundle();
    const candidate = trustedMutation(bundle, (mutable) => {
      mutable.base.garments[0]!.avatarCoverage = invalidCoverage;
    });
    const adapter = createPhase2TransitionAdapter();
    registerComplete(adapter, bundle);

    expectStatic(evaluate(adapter, candidate), reason);
  });

  it.each([
    {
      name: 'equal-rank overlap',
      first: coverage(['torso'], ['torso'], 10, ['torso']),
      second: coverage(['torso'], ['torso'], 10, ['torso']),
      reason: 'ambiguous-avatar-coverage',
    },
    {
      name: 'contradictory missing explicit occlusion',
      first: coverage(['torso'], ['torso'], 10, ['torso']),
      second: coverage(['torso'], ['torso'], 20, []),
      reason: 'ambiguous-avatar-coverage',
    },
    {
      name: 'completely hidden listed garment',
      first: coverage(['torso'], ['torso'], 10, ['torso']),
      second: coverage(['torso'], ['torso'], 20, ['torso']),
      reason: 'hidden-visible-garment',
    },
  ])('rejects $name', ({ first, second, reason }) => {
    const bundle = createSupportedBundle();
    const candidate = trustedMutation(bundle, (mutable) => {
      mutable.base.garments[0]!.avatarCoverage = first;
      mutable.base.garments[1]!.avatarCoverage = second;
    });
    const adapter = createPhase2TransitionAdapter();
    registerComplete(adapter, bundle);

    expectStatic(evaluate(adapter, candidate), reason);
  });

  it.each([
    ['absent bundle', undefined, 'absent-bundle'],
    ['null bundle', null, 'absent-bundle'],
    [
      'untrusted structural clone',
      structuredClone(createSupportedBundle()),
      'invalid-bundle-provenance',
    ],
  ] as const)('settles for %s', (_name, candidate, reason) => {
    const adapter = createPhase2TransitionAdapter();
    expectStatic(evaluate(adapter, candidate), reason);
  });

  it('settles for an invalid visual state without changing public scalar-state typing', () => {
    const bundle = createSupportedBundle();
    const adapter = createPhase2TransitionAdapter();
    registerComplete(adapter, bundle);

    expectStatic(
      evaluateUnknown(adapter, {
        outfitBundle: bundle,
        transitionVisualState: 'animating',
      }),
      'invalid-visual-state',
    );
  });

  it('settles for invalid identity and malformed supported bundle content', () => {
    const bundle = createSupportedBundle();
    const invalidIdentity = trustedMutation(bundle, (candidate) => {
      candidate.base.snapshotId = '';
    });
    const malformedContent = trustedMutation(bundle, (candidate) => {
      candidate.base.garments = null as unknown as MutableGarment[];
    });
    const adapter = createPhase2TransitionAdapter();
    registerComplete(adapter, bundle);

    expectStatic(evaluate(adapter, invalidIdentity), 'invalid-identity');
    expectStatic(
      evaluate(adapter, malformedContent),
      'invalid-bundle-content',
    );
  });

  it.each([
    ['undefined envelope', undefined],
    ['null envelope', null],
    ['empty envelope', {}],
    [
      'throwing bundle getter',
      Object.defineProperty({}, 'outfitBundle', {
        enumerable: true,
        get: () => {
          throw new Error('forged bundle getter');
        },
      }),
    ],
    [
      'throwing visual-state getter',
      Object.defineProperties({}, {
        outfitBundle: {
          enumerable: true,
          value: createSupportedBundle(),
        },
        transitionVisualState: {
          enumerable: true,
          get: () => {
            throw new Error('forged visual-state getter');
          },
        },
      }),
    ],
  ] as const)('fails closed for %s', (_name, envelope) => {
    const adapter = createPhase2TransitionAdapter();

    expect(() => evaluateUnknown(adapter, envelope)).not.toThrow();
    expectStatic(
      evaluateUnknown(adapter, envelope),
      'invalid-bundle-content',
    );
  });

  it.each([
    ['unsupported-cardinality', 'unsupported-cardinality'],
    ['unavailable', 'unavailable'],
  ] as const)('settles for a trusted %s outcome', (kind, reason) => {
    const bundle = createSupportedBundle();
    const candidate = trustedMutation(bundle, (mutable) => {
      mutable.kind = kind;
    });
    const adapter = createPhase2TransitionAdapter();

    expectStatic(evaluate(adapter, candidate), reason);
  });

  it.each([
    {
      name: 'missing Home source',
      setup: (
        adapter: Phase2TransitionAdapter,
        ids: readonly OutfitItemId[],
      ) => {
        for (const itemId of ids) {
          adapter.registerOutfitRow(itemId, element());
        }
      },
      reason: 'missing-home-anchor',
    },
    {
      name: 'duplicate Home source',
      setup: (
        adapter: Phase2TransitionAdapter,
        ids: readonly OutfitItemId[],
      ) => {
        for (const itemId of ids) {
          adapter.registerHomeAnchor(itemId, element());
          adapter.registerOutfitRow(itemId, element());
        }
        adapter.registerHomeAnchor(ids[0]!, element());
      },
      reason: 'duplicate-home-anchor',
    },
    {
      name: 'zero Home geometry',
      setup: (
        adapter: Phase2TransitionAdapter,
        ids: readonly OutfitItemId[],
      ) => {
        for (const itemId of ids) {
          adapter.registerHomeAnchor(
            itemId,
            element({ ...VALID_RECT, width: 0 }),
          );
          adapter.registerOutfitRow(itemId, element());
        }
      },
      reason: 'invalid-home-anchor',
    },
    {
      name: 'stale Home source',
      setup: (
        adapter: Phase2TransitionAdapter,
        ids: readonly OutfitItemId[],
      ) => {
        for (const itemId of ids) {
          adapter.registerHomeAnchor(itemId, element(VALID_RECT, false));
          adapter.registerOutfitRow(itemId, element());
        }
      },
      reason: 'invalid-home-anchor',
    },
    {
      name: 'missing Outfit row',
      setup: (
        adapter: Phase2TransitionAdapter,
        ids: readonly OutfitItemId[],
      ) => {
        for (const itemId of ids) {
          adapter.registerHomeAnchor(itemId, element());
        }
      },
      reason: 'missing-outfit-row',
    },
    {
      name: 'duplicate Outfit row',
      setup: (
        adapter: Phase2TransitionAdapter,
        ids: readonly OutfitItemId[],
      ) => {
        for (const itemId of ids) {
          adapter.registerHomeAnchor(itemId, element());
          adapter.registerOutfitRow(itemId, element());
        }
        adapter.registerOutfitRow(ids[0]!, element());
      },
      reason: 'duplicate-outfit-row',
    },
    {
      name: 'non-finite Outfit geometry',
      setup: (
        adapter: Phase2TransitionAdapter,
        ids: readonly OutfitItemId[],
      ) => {
        for (const itemId of ids) {
          adapter.registerHomeAnchor(itemId, element());
          adapter.registerOutfitRow(
            itemId,
            element({ ...VALID_RECT, x: Number.POSITIVE_INFINITY }),
          );
        }
      },
      reason: 'invalid-outfit-row',
    },
    {
      name: 'stale Outfit row',
      setup: (
        adapter: Phase2TransitionAdapter,
        ids: readonly OutfitItemId[],
      ) => {
        for (const itemId of ids) {
          adapter.registerHomeAnchor(itemId, element());
          adapter.registerOutfitRow(itemId, element(VALID_RECT, false));
        }
      },
      reason: 'invalid-outfit-row',
    },
  ])('settles for $name', ({ setup, reason }) => {
    const bundle = createSupportedBundle();
    const adapter = createPhase2TransitionAdapter();
    setup(adapter, visibleIds(bundle));

    expectStatic(evaluate(adapter, bundle), reason);
  });

  it.each([
    ['Home source', 'home', 'invalid-home-anchor'],
    ['Outfit row', 'outfit', 'invalid-outfit-row'],
  ] as const)(
    'rejects connected-looking plain-object forgery for %s',
    (_name, side, reason) => {
      const bundle = createSupportedBundle();
      const ids = visibleIds(bundle);
      const adapter = createPhase2TransitionAdapter();
      const forgery = {
        isConnected: true,
        getBoundingClientRect: () => ({
          ...VALID_RECT,
          top: VALID_RECT.y,
          right: VALID_RECT.x + VALID_RECT.width,
          bottom: VALID_RECT.y + VALID_RECT.height,
          left: VALID_RECT.x,
        }),
      } as unknown as HTMLElement;

      for (const itemId of ids) {
        adapter.registerHomeAnchor(
          itemId,
          side === 'home' && itemId === ids[0] ? forgery : element(),
        );
        adapter.registerOutfitRow(
          itemId,
          side === 'outfit' && itemId === ids[0] ? forgery : element(),
        );
      }

      expectStatic(evaluate(adapter, bundle), reason);
    },
  );

  it.each([
    ['Home namespace', 'home', 'duplicate-home-anchor'],
    ['Outfit namespace', 'outfit', 'duplicate-outfit-row'],
  ] as const)(
    'rejects one Element registered under multiple IDs in the %s',
    (_name, side, reason) => {
      const bundle = createSupportedBundle();
      const ids = visibleIds(bundle);
      const adapter = createPhase2TransitionAdapter();
      const shared = element();

      for (const itemId of ids) {
        adapter.registerHomeAnchor(
          itemId,
          side === 'home' ? shared : element(),
        );
        adapter.registerOutfitRow(
          itemId,
          side === 'outfit' ? shared : element(),
        );
      }

      expectStatic(evaluate(adapter, bundle), reason);
    },
  );

  it.each([
    ['unexpected Home registration', 'home'],
    ['unexpected Outfit registration', 'outfit'],
  ] as const)('rejects %s rather than matching by DOM order', (_name, side) => {
    const bundle = createSupportedBundle();
    const adapter = createPhase2TransitionAdapter();
    registerComplete(adapter, bundle);
    const extraId = 'stale-registration' as OutfitItemId;
    if (side === 'home') {
      adapter.registerHomeAnchor(extraId, element());
    } else {
      adapter.registerOutfitRow(extraId, element());
    }

    expectStatic(
      evaluate(adapter, bundle),
      side === 'home'
        ? 'unexpected-home-anchor'
        : 'unexpected-outfit-row',
    );
  });

  it('unregisters each namespace independently and clears all transient DOM references', () => {
    const bundle = createSupportedBundle();
    const ids = visibleIds(bundle);
    const adapter = createPhase2TransitionAdapter();
    registerComplete(adapter, bundle);

    adapter.registerHomeAnchor(ids[0]!, null);
    expectStatic(evaluate(adapter, bundle), 'missing-home-anchor');

    adapter.registerHomeAnchor(ids[0]!, element());
    adapter.registerOutfitRow(ids[0]!, null);
    expectStatic(evaluate(adapter, bundle), 'missing-outfit-row');

    adapter.clear();
    expectStatic(evaluate(adapter, bundle), 'missing-home-anchor');
  });
});
