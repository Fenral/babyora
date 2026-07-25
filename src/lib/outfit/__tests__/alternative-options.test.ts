import { describe, expect, it } from 'vitest';
import {
  ITEM_ALTERNATIVES,
  type Alternative,
} from '../../wool-layers/alternatives.js';
import { recommend } from '../../wool-layers/recommend.js';
import type {
  RecommendInput,
  Recommendation,
} from '../../wool-layers/types.js';
import {
  buildOutfitAlternativeOptions,
} from '../alternative-options.js';
import {
  finalizeOutfitOccurrenceSwap,
} from '../finalized-outfit-swap.js';
import {
  createOutfitTruthSnapshot,
  isOutfitTruthSnapshot,
  type OutfitGarmentTruth,
  type OutfitTruthSnapshotV1,
} from '../outfit-truth.js';

function makeInput(
  overrides: Partial<RecommendInput> = {},
): RecommendInput {
  return {
    weather: {
      feelsLikeC: -8,
      tempC: -5,
      windMs: 2,
      precipMmH: 0,
    },
    child: { ageMonths: 10 },
    activity: 'vogn',
    ...overrides,
  };
}

function poseFor(input: RecommendInput): 'sitting' | 'standing' {
  return input.child.ageMonths < 12 ? 'sitting' : 'standing';
}

function buildArgs(
  input: RecommendInput,
  finalizedRecommendation: Recommendation = recommend(input),
) {
  return {
    transitionContextId: 'transition:alternative-fixture',
    input,
    finalizedRecommendation,
    pose: poseFor(input),
  } as const;
}

function buildBase(
  input: RecommendInput,
  finalizedRecommendation: Recommendation = recommend(input),
): OutfitTruthSnapshotV1 {
  const result = createOutfitTruthSnapshot(
    buildArgs(input, finalizedRecommendation),
  );
  expect(result.kind).toBe('supported');
  if (result.kind !== 'supported') {
    throw new Error('fixture must be supported');
  }
  return result.snapshot;
}

function selectorFor(source: OutfitGarmentTruth) {
  return {
    itemId: source.itemId,
    order: source.order,
    category: source.category,
    sourceLabel: source.sourceLabel,
  } as const;
}

function labels(snapshot: OutfitTruthSnapshotV1): string[] {
  return snapshot.garments.map((garment) => garment.sourceLabel);
}

function withCatalogAlternatives<T>(
  sourceLabel: string,
  alternatives: Alternative[],
  run: () => T,
): T {
  const entry = ITEM_ALTERNATIVES.find(
    (candidate) => candidate.itemName === sourceLabel,
  );
  if (entry === undefined) {
    throw new Error(`missing fixture catalog entry: ${sourceLabel}`);
  }
  const original = entry.alternatives;
  entry.alternatives = alternatives;
  try {
    return run();
  } finally {
    entry.alternatives = original;
  }
}

type HostileProxyOperation =
  | 'getPrototypeOf'
  | 'ownKeys'
  | 'getOwnPropertyDescriptor'
  | 'revoked';

function makeHostileProxy<T extends object>(
  target: T,
  operation: HostileProxyOperation,
): T {
  const fail = (): never => {
    throw new Error(`HOSTILE_PROXY_${operation}`);
  };
  if (operation === 'revoked') {
    const revocable = Proxy.revocable(target, {});
    revocable.revoke();
    return revocable.proxy;
  }
  if (operation === 'getPrototypeOf') {
    return new Proxy(target, { getPrototypeOf: fail });
  }
  if (operation === 'ownKeys') {
    return new Proxy(target, { ownKeys: fail });
  }
  return new Proxy(target, {
    getOwnPropertyDescriptor: fail,
  });
}

function withCatalogEntryProxy<T>(
  sourceLabel: string,
  operation: HostileProxyOperation,
  run: () => T,
): T {
  const index = ITEM_ALTERNATIVES.findIndex(
    (candidate) => candidate.itemName === sourceLabel,
  );
  if (index < 0) {
    throw new Error(`missing fixture catalog entry: ${sourceLabel}`);
  }
  const original = ITEM_ALTERNATIVES[index]!;
  ITEM_ALTERNATIVES[index] = makeHostileProxy(
    original,
    operation,
  );
  try {
    return run();
  } finally {
    ITEM_ALTERNATIVES[index] = original;
  }
}

function captureNoThrow<T>(run: () => T): T {
  let result: T | undefined;
  expect(() => {
    result = run();
  }).not.toThrow();
  if (result === undefined) {
    throw new Error('expected a synchronous result');
  }
  return result;
}

function expectInvalidCandidateData(
  result: ReturnType<typeof buildOutfitAlternativeOptions>,
  sourceLabel: string,
): void {
  expect(result.kind).toBe('supported');
  if (result.kind !== 'supported') return;
  const source = result.base.garments.find(
    (garment) => garment.sourceLabel === sourceLabel,
  )!;
  expect(
    result.options.some(
      (option) => option.sourceItemId === source.itemId,
    ),
  ).toBe(false);
  expect(result.diagnostics).toContainEqual(
    expect.objectContaining({
      code: 'invalid-candidate-data',
      sourceItemId: source.itemId,
      targetLabel: null,
    }),
  );
}

describe('finalized occurrence swap adapter', () => {
  it.each([
    'getPrototypeOf',
    'ownKeys',
    'getOwnPropertyDescriptor',
    'revoked',
  ] as const)(
    'rejects a public request Proxy with a hostile %s operation',
    (operation) => {
      const input = makeInput();
      const finalizedRecommendation = recommend(input);
      const baseSnapshot = buildBase(input, finalizedRecommendation);
      const source = baseSnapshot.garments.find(
        (garment) =>
          garment.sourceLabel === 'isolert vinterkjøredress',
      )!;
      const request = {
        input,
        finalizedRecommendation,
        baseSnapshot,
        source: selectorFor(source),
        targetLabel: 'vinterkjøredress',
      };

      const result = captureNoThrow(() =>
        finalizeOutfitOccurrenceSwap(
          makeHostileProxy(request, operation),
        ),
      );

      expect(result).toEqual({
        kind: 'rejected',
        code: 'invalid-request',
      });
    },
  );

  it('uses the exact raw source occurrence, not its kebab catalog id', () => {
    const input = makeInput();
    const finalizedRecommendation = recommend(input);
    const baseSnapshot = buildBase(input, finalizedRecommendation);
    const source = baseSnapshot.garments.find(
      (garment) =>
        garment.sourceLabel === 'isolert vinterkjøredress',
    )!;

    const mismatched = finalizeOutfitOccurrenceSwap({
      input,
      finalizedRecommendation,
      baseSnapshot,
      source: {
        ...selectorFor(source),
        sourceLabel: source.catalogGarmentId!,
      },
      targetLabel: 'vinterkjøredress',
    });
    expect(mismatched).toMatchObject({
      kind: 'rejected',
      code: 'source-identity-mismatch',
    });

    const exact = finalizeOutfitOccurrenceSwap({
      input,
      finalizedRecommendation,
      baseSnapshot,
      source: selectorFor(source),
      targetLabel: 'vinterkjøredress',
    });
    expect(exact.kind).toBe('finalized');
    if (exact.kind === 'finalized') {
      expect(
        exact.recommendation.layers.flatMap((layer) => layer.items),
      ).toContain('vinterkjøredress');
      expect(
        exact.recommendation.layers.flatMap((layer) => layer.items),
      ).not.toContain('isolert vinterkjøredress');
    }
  });

  it('fails closed for an unknown target and a target removed by safety', () => {
    const input = makeInput({
      activity: 'soevn',
      weather: {
        feelsLikeC: 20,
        tempC: 20,
        windMs: 0,
        precipMmH: 0,
      },
    });
    const finalizedRecommendation = recommend(input);
    const baseSnapshot = buildBase(input, finalizedRecommendation);
    const source = baseSnapshot.garments.find(
      (garment) => garment.sourceLabel === 'langermet body',
    )!;
    const args = {
      input,
      finalizedRecommendation,
      baseSnapshot,
      source: selectorFor(source),
    };

    expect(
      finalizeOutfitOccurrenceSwap({
        ...args,
        targetLabel: 'ukjent statisk kandidat',
      }),
    ).toMatchObject({
      kind: 'rejected',
      code: 'unknown-target',
    });
    expect(
      finalizeOutfitOccurrenceSwap({
        ...args,
        targetLabel: 'lue',
      }),
    ).toMatchObject({
      kind: 'rejected',
      code: 'target-removed',
    });
  });

  it('deep-clones categorized layers and complete finalizer data', () => {
    const input = makeInput();
    const engineRecommendation = recommend(input);
    const finalizedRecommendation: Recommendation = {
      ...engineRecommendation,
      layers: engineRecommendation.layers.map((layer) => ({
        category: layer.category,
        items: [...layer.items],
      })),
      notes: [...engineRecommendation.notes, 'Bevart testnotat'],
      structuredNotes: [
        ...engineRecommendation.structuredNotes.map((note) => ({ ...note })),
        { category: 'sikkerhet', message: 'Bevart testnotat' },
      ],
      safetyFlags: [
        ...(engineRecommendation.safetyFlags ?? []).map((flag) => ({
          ...flag,
          sources: [...flag.sources],
        })),
        {
          code: 'TEST-PRIOR',
          message: 'Bevart testflagg',
          sources: ['POLICY'],
          severity: 'LOW',
          category: 'sikkerhet',
        },
      ],
      severity: engineRecommendation.severity,
    };
    const baseSnapshot = buildBase(input, finalizedRecommendation);
    const source = baseSnapshot.garments.find(
      (garment) =>
        garment.sourceLabel === 'isolert vinterkjøredress',
    )!;

    const result = finalizeOutfitOccurrenceSwap({
      input,
      finalizedRecommendation,
      baseSnapshot,
      source: selectorFor(source),
      targetLabel: 'vinterkjøredress',
    });
    expect(result.kind).toBe('finalized');
    if (result.kind !== 'finalized') return;

    expect(result.recommendation).not.toBe(finalizedRecommendation);
    expect(result.recommendation.layers).not.toBe(
      finalizedRecommendation.layers,
    );
    expect(result.recommendation.structuredNotes).not.toBe(
      finalizedRecommendation.structuredNotes,
    );
    expect(result.recommendation.safetyFlags).not.toBe(
      finalizedRecommendation.safetyFlags,
    );
    expect(result.recommendation.summary).toBe(
      finalizedRecommendation.summary,
    );
    expect(result.recommendation.structuredNotes).toContainEqual({
      category: 'sikkerhet',
      message: 'Bevart testnotat',
    });
    expect(result.recommendation.safetyFlags).toContainEqual(
      expect.objectContaining({ code: 'TEST-PRIOR' }),
    );
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.recommendation.layers)).toBe(true);
    expect(Object.isFrozen(result.recommendation.safetyFlags)).toBe(true);
    expect(finalizedRecommendation.layers.flatMap((layer) => layer.items))
      .not.toContain('vinterkjøredress');
  });

  it.each([
    [
      'missing severity',
      (recommendation: Recommendation) => {
        delete recommendation.severity;
      },
    ],
    [
      'severity above the highest finalized flag',
      (recommendation: Recommendation) => {
        expect(recommendation.severity).toBe('HIGH');
        recommendation.severity = 'CRITICAL';
      },
    ],
  ])(
    'rejects complete-outcome finalizer data with %s',
    (_name, mutate) => {
      const input = makeInput();
      const finalizedRecommendation = structuredClone(
        recommend(input),
      );
      mutate(finalizedRecommendation);
      const baseSnapshot = buildBase(
        input,
        finalizedRecommendation,
      );
      const source = baseSnapshot.garments.find(
        (garment) =>
          garment.sourceLabel === 'isolert vinterkjøredress',
      )!;

      expect(
        finalizeOutfitOccurrenceSwap({
          input,
          finalizedRecommendation,
          baseSnapshot,
          source: selectorFor(source),
          targetLabel: 'vinterkjøredress',
        }),
      ).toMatchObject({
        kind: 'rejected',
        code: 'base-not-finalized',
      });
    },
  );
});

describe('engine-backed alternative options', () => {
  it.each([
    'getPrototypeOf',
    'ownKeys',
    'getOwnPropertyDescriptor',
    'revoked',
  ] as const)(
    'fails closed for a public builder request Proxy with %s',
    (operation) => {
      const input = makeInput();
      const request = buildArgs(input, recommend(input));

      const result = captureNoThrow(() =>
        buildOutfitAlternativeOptions(
          makeHostileProxy(request, operation),
        ),
      );

      expect(result).toMatchObject({
        kind: 'unavailable',
        reason: 'invalid-input',
        options: [],
        diagnostics: [
          {
            code: 'invalid-base-input',
            sourceItemId: null,
            targetLabel: null,
          },
        ],
      });
    },
  );

  it('builds deterministic immutable full outcomes for supported garments', () => {
    const input = makeInput();
    const finalizedRecommendation = recommend(input);
    const args = buildArgs(input, finalizedRecommendation);

    const first = buildOutfitAlternativeOptions(args);
    const second = buildOutfitAlternativeOptions(
      structuredClone(args),
    );

    expect(first).toEqual(second);
    expect(first.kind).toBe('supported');
    if (first.kind !== 'supported' || second.kind !== 'supported') return;

    expect(first.options.length).toBeGreaterThan(0);
    expect(first.options.map((option) => option.optionId)).toEqual(
      second.options.map((option) => option.optionId),
    );
    for (const option of first.options) {
      expect(
        first.base.garments.some(
          (garment) => garment.itemId === option.sourceItemId,
        ),
      ).toBe(true);
      expect(option.outcome.transitionContextId).toBe(
        first.base.transitionContextId,
      );
      expect(option.outcome.snapshotId).not.toBe(first.base.snapshotId);
      expect(option.outcome.recommendationFingerprint).not.toBe(
        first.base.recommendationFingerprint,
      );
      expect(isOutfitTruthSnapshot(option.outcome)).toBe(true);
      expect(labels(option.outcome)).toContain(option.targetLabel);
      expect(Object.isFrozen(option)).toBe(true);
      expect(Object.isFrozen(option.comparison)).toBe(true);
      expect(Object.isFrozen(option.comparison.advantages)).toBe(true);
      expect(Object.isFrozen(option.comparison.tradeoffs)).toBe(true);
    }
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.options)).toBe(true);
    expect(Object.isFrozen(first.diagnostics)).toBe(true);
  });

  it('keeps duplicate labels occurrence-specific and rejects ambiguous identity', () => {
    const input = makeInput({
      activity: 'soevn',
      weather: {
        feelsLikeC: 20,
        tempC: 20,
        windMs: 0,
        precipMmH: 0,
      },
    });
    const recommendation = recommend(input);
    const duplicated: Recommendation = {
      ...recommendation,
      layers: recommendation.layers.map((layer) => ({
        category: layer.category,
        items:
          layer.category === 'innerst'
            ? [
                'langermet body',
                'langermet body',
                ...layer.items.slice(1),
              ]
            : [...layer.items],
      })),
      notes: [...recommendation.notes],
      structuredNotes: recommendation.structuredNotes.map((note) => ({
        ...note,
      })),
      safetyFlags: (recommendation.safetyFlags ?? []).map((flag) => ({
        ...flag,
        sources: [...flag.sources],
      })),
    };

    const result = buildOutfitAlternativeOptions(
      buildArgs(input, duplicated),
    );
    expect(result.kind).toBe('supported');
    if (result.kind !== 'supported') return;

    const duplicateSources = result.base.garments.filter(
      (garment) => garment.sourceLabel === 'langermet body',
    );
    const duplicateOptions = result.options.filter(
      (option) =>
        duplicateSources.some(
          (source) => source.itemId === option.sourceItemId,
        ) && option.targetLabel === 'langermet ullbody',
    );
    expect(duplicateSources).toHaveLength(2);
    expect(duplicateOptions).toHaveLength(2);
    expect(duplicateOptions[0]!.sourceItemId).not.toBe(
      duplicateOptions[1]!.sourceItemId,
    );
    expect(duplicateOptions[0]!.optionId).not.toBe(
      duplicateOptions[1]!.optionId,
    );
    expect(labels(duplicateOptions[0]!.outcome).slice(0, 2)).toEqual([
      'langermet ullbody',
      'langermet body',
    ]);
    expect(labels(duplicateOptions[1]!.outcome).slice(0, 2)).toEqual([
      'langermet body',
      'langermet ullbody',
    ]);

    const firstSource = duplicateSources[0]!;
    expect(
      finalizeOutfitOccurrenceSwap({
        input,
        finalizedRecommendation: duplicated,
        baseSnapshot: result.base,
        source: {
          ...selectorFor(firstSource),
          order: duplicateSources[1]!.order,
        },
        targetLabel: 'langermet ullbody',
      }),
    ).toMatchObject({
      kind: 'rejected',
      code: 'source-identity-mismatch',
    });
  });

  it('never nominates semantic equipment as a garment option', () => {
    const input = makeInput();
    const recommendation = recommend(input);
    const withEquipment: Recommendation = {
      ...recommendation,
      layers: [
        { category: 'innerst', items: ['tykt ullsett'] },
        { category: 'ekstra', items: ['varmepose'] },
      ],
      notes: [...recommendation.notes],
      structuredNotes: recommendation.structuredNotes.map((note) => ({
        ...note,
      })),
      safetyFlags: (recommendation.safetyFlags ?? []).map((flag) => ({
        ...flag,
        sources: [...flag.sources],
      })),
    };

    const result = buildOutfitAlternativeOptions(
      buildArgs(input, withEquipment),
    );
    expect(result.kind).toBe('supported');
    if (result.kind !== 'supported') return;

    const equipment = result.base.equipment.find(
      (item) => item.sourceLabel === 'varmepose',
    )!;
    expect(result.options.some(
      (option) => option.sourceItemId === equipment.itemId,
    )).toBe(false);
    expect(result.diagnostics).toContainEqual(
      expect.objectContaining({
        code: 'semantic-equipment-ineligible',
        sourceItemId: equipment.itemId,
        targetLabel: 'varmepose lett',
      }),
    );
  });

  it.each([
    [
      'throwing indexed accessor',
      (markExecuted: () => void) => {
        const alternatives = new Array<Alternative>(1);
        Object.defineProperty(alternatives, '0', {
          configurable: true,
          enumerable: true,
          get() {
            markExecuted();
            throw new Error('HOSTILE_GETTER_EXECUTED');
          },
        });
        return alternatives;
      },
    ],
    [
      'custom array prototype with a throwing iterator accessor',
      (markExecuted: () => void) => {
        const alternatives: Alternative[] = [
          {
            name: 'vinterkjøredress',
            pros: ['valid-looking candidate'],
          },
        ];
        const hostilePrototype = Object.create(
          Array.prototype,
        ) as object;
        Object.defineProperty(
          hostilePrototype,
          Symbol.iterator,
          {
            configurable: true,
            get() {
              markExecuted();
              throw new Error('HOSTILE_GETTER_EXECUTED');
            },
          },
        );
        Object.setPrototypeOf(alternatives, hostilePrototype);
        return alternatives;
      },
    ],
    [
      'sparse candidate array',
      (_markExecuted: () => void) =>
        new Array<Alternative>(1),
    ],
  ])(
    'validates %s before reading candidate values',
    (_name, makeHostileAlternatives) => {
      const input = makeInput();
      let hostileGetterExecuted = false;
      const hostileAlternatives = makeHostileAlternatives(() => {
        hostileGetterExecuted = true;
      });

      const result = withCatalogAlternatives(
        'isolert vinterkjøredress',
        hostileAlternatives,
        () =>
          buildOutfitAlternativeOptions(
            buildArgs(input, recommend(input)),
          ),
      );

      expect(hostileGetterExecuted).toBe(false);
      expect(result.kind).toBe('supported');
      if (result.kind !== 'supported') return;
      const source = result.base.garments.find(
        (garment) =>
          garment.sourceLabel === 'isolert vinterkjøredress',
      )!;
      expect(
        result.options.some(
          (option) => option.sourceItemId === source.itemId,
        ),
      ).toBe(false);
      expect(result.diagnostics).toContainEqual(
        expect.objectContaining({
          code: 'invalid-candidate-data',
          sourceItemId: source.itemId,
          targetLabel: null,
        }),
      );
    },
  );

  it.each([
    'getPrototypeOf',
    'ownKeys',
    'getOwnPropertyDescriptor',
    'revoked',
  ] as const)(
    'omits a catalog entry Proxy with hostile %s reflection',
    (operation) => {
      const input = makeInput();
      const result = withCatalogEntryProxy(
        'isolert vinterkjøredress',
        operation,
        () =>
          captureNoThrow(() =>
            buildOutfitAlternativeOptions(
              buildArgs(input, recommend(input)),
            ),
          ),
      );

      expectInvalidCandidateData(
        result,
        'isolert vinterkjøredress',
      );
    },
  );

  it.each([
    'getPrototypeOf',
    'ownKeys',
    'getOwnPropertyDescriptor',
    'revoked',
  ] as const)(
    'omits a raw candidate Proxy with hostile %s reflection',
    (operation) => {
      const input = makeInput();
      const candidate = makeHostileProxy<Alternative>(
        {
          name: 'vinterkjøredress',
          pros: ['valid-looking candidate'],
        },
        operation,
      );
      const result = withCatalogAlternatives(
        'isolert vinterkjøredress',
        [candidate],
        () =>
          captureNoThrow(() =>
            buildOutfitAlternativeOptions(
              buildArgs(input, recommend(input)),
            ),
          ),
      );

      expectInvalidCandidateData(
        result,
        'isolert vinterkjøredress',
      );
    },
  );

  it('preserves the tracked 11-garment result as list-only with no option', () => {
    const input = makeInput({
      weather: {
        feelsLikeC: -30,
        tempC: -30,
        windMs: 8,
        precipMmH: 0,
      },
      child: { ageMonths: 0 },
      childCalibration: 0,
      vognMode: 'awake',
    });
    const result = buildOutfitAlternativeOptions(
      buildArgs(input, recommend(input)),
    );

    expect(result.kind).toBe('unsupported-cardinality');
    if (result.kind !== 'unsupported-cardinality') return;
    expect(result.options).toEqual([]);
    expect(result.truth.orderedGarments).toHaveLength(11);
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
      (item) => item.sourceLabel,
    )).toEqual([
      'varmepose dun',
      'saueskinn i vogn',
      'ansiktskrem',
      'vognpose',
    ]);
  });

  it.each([
    'layers',
    'notes',
    'structuredNotes',
    'summary',
    'safetyFlags',
    'severity',
  ] as const)(
    'rejects a Recommendation missing the complete %s field',
    (missingField) => {
      const input = makeInput();
      const incomplete = structuredClone(recommend(input)) as
        & Recommendation
        & Record<string, unknown>;
      delete incomplete[missingField];

      const result = buildOutfitAlternativeOptions({
        ...buildArgs(input),
        finalizedRecommendation: incomplete,
      });
      expect(result).toMatchObject({
        kind: 'unavailable',
        reason: 'invalid-input',
        options: [],
        diagnostics: [
          {
            code: 'invalid-base-input',
          },
        ],
      });
    },
  );

  it('rejects severity that does not equal the highest safety flag', () => {
    const input = makeInput();
    const inconsistent = structuredClone(recommend(input));
    expect(inconsistent.severity).toBe('HIGH');
    inconsistent.severity = 'CRITICAL';

    expect(
      buildOutfitAlternativeOptions({
        ...buildArgs(input),
        finalizedRecommendation: inconsistent,
      }),
    ).toMatchObject({
      kind: 'unavailable',
      reason: 'invalid-input',
      options: [],
      diagnostics: [
        {
          code: 'invalid-base-input',
        },
      ],
    });
  });

  it('rejects a flattened projection and returns deterministic diagnostics', () => {
    const input = makeInput();
    const flattened = {
      activity: input.activity,
      tempBand: 'kald',
      orderedGarments: ['tykt ullsett'],
      equipment: [],
    } as unknown as Recommendation;
    const args = {
      ...buildArgs(input),
      finalizedRecommendation: flattened,
    };

    const first = buildOutfitAlternativeOptions(args);
    const second = buildOutfitAlternativeOptions(
      structuredClone(args),
    );
    expect(first).toEqual(second);
    expect(first).toMatchObject({
      kind: 'unavailable',
      reason: 'invalid-input',
      options: [],
      diagnostics: [
        {
          code: 'invalid-base-input',
        },
      ],
    });
    if (first.kind === 'unavailable') {
      expect(first.diagnostics[0]!.diagnosticId).toMatch(
        /^outfit-alternative-diagnostic-v1:/,
      );
      expect(Object.isFrozen(first.diagnostics[0])).toBe(true);
    }
  });
});
