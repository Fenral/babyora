import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { recommend } from '../../wool-layers/recommend.js';
import type { RecommendInput } from '../../wool-layers/types.js';
import {
  createOutfitTruthSnapshot,
  type OutfitItemId,
} from '../outfit-truth.js';
import {
  createOutfitRowRegistrationRegistry,
  evaluateOutfitTargetReadiness,
} from '../outfit-transition-contract.js';
import * as transitionContract from '../outfit-transition-contract.js';

function input(
  overrides: Partial<RecommendInput> = {},
): RecommendInput {
  return {
    weather: {
      feelsLikeC: 18,
      tempC: 18,
      windMs: 0,
      precipMmH: 0,
    },
    child: { ageMonths: 14 },
    activity: 'utelek',
    ...overrides,
  };
}

function truth(exactInput: RecommendInput = input()) {
  const finalizedRecommendation = recommend(exactInput);
  return createOutfitTruthSnapshot({
    transitionContextId: 'transition:context',
    input: exactInput,
    finalizedRecommendation,
    pose: exactInput.child.ageMonths < 12 ? 'sitting' : 'standing',
  });
}

class TestElement {
  readonly isConnected: boolean;

  constructor(isConnected = true) {
    this.isConnected = isConnected;
  }
}

const originalElement = globalThis.Element;

beforeAll(() => {
  Object.defineProperty(globalThis, 'Element', {
    configurable: true,
    writable: true,
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
    writable: true,
    value: originalElement,
  });
});

function element(connected = true): HTMLElement {
  return new TestElement(connected) as unknown as HTMLElement;
}

function readinessArgs() {
  const result = truth();
  if (result.kind !== 'supported') {
    throw new Error('expected supported fixture');
  }
  return {
    truth: result,
    expectedIdentity: {
      snapshotId: result.snapshot.snapshotId,
      recommendationFingerprint:
        result.snapshot.recommendationFingerprint,
      transitionContextId: result.snapshot.transitionContextId,
    },
    targetRows: result.snapshot.garments.map((garment) => ({
      itemId: garment.itemId,
      element: element(),
    })),
    reducedMotion: false,
  };
}

function attemptUnknownReadiness(args: unknown): {
  result?: ReturnType<typeof evaluateOutfitTargetReadiness>;
  error?: unknown;
} {
  try {
    return {
      result: evaluateOutfitTargetReadiness(
        args as Parameters<typeof evaluateOutfitTargetReadiness>[0],
      ),
    };
  } catch (error) {
    return { error };
  }
}

function expectUnknownStaticOnly(args: unknown): void {
  const outcome = attemptUnknownReadiness(args);
  expect(outcome.error).toBeUndefined();
  expect(outcome.result).toMatchObject({
    kind: 'static-only',
  });
}

describe('Phase-2 Outfit target registration', () => {
  it('registers only existing occurrence item ids and unregisters with null', () => {
    const result = truth();
    expect(result.kind).toBe('supported');
    if (result.kind !== 'supported') return;

    const registry = createOutfitRowRegistrationRegistry();
    const first = result.snapshot.garments[0]!;
    const target = element();
    registry.registerOutfitRow(first.itemId, target);
    expect(registry.read()).toEqual([
      { itemId: first.itemId, element: target },
    ]);

    registry.registerOutfitRow(first.itemId, null);
    expect(registry.read()).toEqual([]);
    expect(Object.isFrozen(registry.read())).toBe(true);
  });

  it('returns ready only for an exact identity and one connected row per garment', () => {
    const result = truth();
    expect(result.kind).toBe('supported');
    if (result.kind !== 'supported') return;

    const registry = createOutfitRowRegistrationRegistry();
    for (const garment of result.snapshot.garments) {
      registry.registerOutfitRow(garment.itemId, element());
    }
    const readiness = evaluateOutfitTargetReadiness({
      truth: result,
      expectedIdentity: {
        snapshotId: result.snapshot.snapshotId,
        recommendationFingerprint:
          result.snapshot.recommendationFingerprint,
        transitionContextId: result.snapshot.transitionContextId,
      },
      targetRows: registry.read(),
      reducedMotion: false,
    });

    expect(readiness).toMatchObject({
      kind: 'ready',
      snapshotId: result.snapshot.snapshotId,
      recommendationFingerprint:
        result.snapshot.recommendationFingerprint,
      transitionContextId: 'transition:context',
    });
    if (readiness.kind === 'ready') {
      expect(readiness.targetRows.map((row) => row.itemId)).toEqual(
        result.snapshot.garments.map((garment) => garment.itemId),
      );
      expect(
        readiness.targetRows.some(
          (row) =>
            'x' in row ||
            'y' in row ||
            'rect' in row ||
            'coordinates' in row,
        ),
      ).toBe(false);
    }
  });

  it.each([
    ['snapshotId', 'wrong:snapshot'],
    ['recommendationFingerprint', 'wrong:fingerprint'],
    ['transitionContextId', 'wrong:transition'],
  ] as const)('fails closed for a mismatched %s', (key, value) => {
    const result = truth();
    expect(result.kind).toBe('supported');
    if (result.kind !== 'supported') return;
    const registry = createOutfitRowRegistrationRegistry();
    for (const garment of result.snapshot.garments) {
      registry.registerOutfitRow(garment.itemId, element());
    }

    expect(
      evaluateOutfitTargetReadiness({
        truth: result,
        expectedIdentity: {
          snapshotId: result.snapshot.snapshotId,
          recommendationFingerprint:
            result.snapshot.recommendationFingerprint,
          transitionContextId: result.snapshot.transitionContextId,
          [key]: value,
        },
        targetRows: registry.read(),
        reducedMotion: false,
      }),
    ).toEqual({
      kind: 'static-only',
      reason: 'identity-mismatch',
    });
  });

  it('types missing, duplicate and stale target rows separately', () => {
    const result = truth();
    expect(result.kind).toBe('supported');
    if (result.kind !== 'supported') return;
    const expectedIdentity = {
      snapshotId: result.snapshot.snapshotId,
      recommendationFingerprint:
        result.snapshot.recommendationFingerprint,
      transitionContextId: result.snapshot.transitionContextId,
    };
    const rows = result.snapshot.garments.map((garment) => ({
      itemId: garment.itemId,
      element: element(),
    }));

    expect(
      evaluateOutfitTargetReadiness({
        truth: result,
        expectedIdentity,
        targetRows: rows.slice(1),
        reducedMotion: false,
      }),
    ).toEqual({
      kind: 'static-only',
      reason: 'missing-target-row',
      itemId: result.snapshot.garments[0]!.itemId,
    });

    expect(
      evaluateOutfitTargetReadiness({
        truth: result,
        expectedIdentity,
        targetRows: [...rows, rows[0]!],
        reducedMotion: false,
      }),
    ).toEqual({
      kind: 'static-only',
      reason: 'duplicate-target-row',
      itemId: rows[0]!.itemId,
    });

    const staleId = 'outfit-item-v1:stale' as OutfitItemId;
    expect(
      evaluateOutfitTargetReadiness({
        truth: result,
        expectedIdentity,
        targetRows: [
          ...rows,
          { itemId: staleId, element: element() },
        ],
        reducedMotion: false,
      }),
    ).toEqual({
      kind: 'static-only',
      reason: 'stale-target-row',
      itemId: staleId,
    });

    expect(
      evaluateOutfitTargetReadiness({
        truth: result,
        expectedIdentity,
        targetRows: [
          { ...rows[0]!, element: element(false) },
          ...rows.slice(1),
        ],
        reducedMotion: false,
      }),
    ).toEqual({
      kind: 'static-only',
      reason: 'stale-target-row',
      itemId: rows[0]!.itemId,
    });
  });

  it('rejects a connected-looking plain object that is not an Element', () => {
    const result = truth();
    expect(result.kind).toBe('supported');
    if (result.kind !== 'supported') return;
    const rows = result.snapshot.garments.map((garment) => ({
      itemId: garment.itemId,
      element: element(),
    }));
    rows[0] = {
      ...rows[0]!,
      element: { isConnected: true } as HTMLElement,
    };

    expect(
      evaluateOutfitTargetReadiness({
        truth: result,
        expectedIdentity: {
          snapshotId: result.snapshot.snapshotId,
          recommendationFingerprint:
            result.snapshot.recommendationFingerprint,
          transitionContextId: result.snapshot.transitionContextId,
        },
        targetRows: rows,
        reducedMotion: false,
      }),
    ).toEqual({
      kind: 'static-only',
      reason: 'stale-target-row',
      itemId: rows[0]!.itemId,
    });
  });

  it('fails closed without a DOM Element constructor', () => {
    const result = truth();
    expect(result.kind).toBe('supported');
    if (result.kind !== 'supported') return;
    const rows = result.snapshot.garments.map((garment) => ({
      itemId: garment.itemId,
      element: element(),
    }));
    delete (globalThis as { Element?: typeof Element }).Element;
    try {
      expect(
        evaluateOutfitTargetReadiness({
          truth: result,
          expectedIdentity: {
            snapshotId: result.snapshot.snapshotId,
            recommendationFingerprint:
              result.snapshot.recommendationFingerprint,
            transitionContextId: result.snapshot.transitionContextId,
          },
          targetRows: rows,
          reducedMotion: false,
        }),
      ).toEqual({
        kind: 'static-only',
        reason: 'stale-target-row',
        itemId: rows[0]!.itemId,
      });
    } finally {
      Object.defineProperty(globalThis, 'Element', {
        configurable: true,
        writable: true,
        value: TestElement,
      });
    }
  });

  it('makes unsupported cardinality and reduced motion static-only', () => {
    const unsupportedInput = input({
      activity: 'vogn',
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
    expect(
      evaluateOutfitTargetReadiness({
        truth: truth(unsupportedInput),
        expectedIdentity: {
          snapshotId: '',
          recommendationFingerprint: '',
          transitionContextId: '',
        },
        targetRows: [],
        reducedMotion: false,
      }),
    ).toEqual({
      kind: 'static-only',
      reason: 'unsupported-cardinality',
    });

    const supported = truth();
    expect(supported.kind).toBe('supported');
    if (supported.kind !== 'supported') return;
    expect(
      evaluateOutfitTargetReadiness({
        truth: supported,
        expectedIdentity: {
          snapshotId: supported.snapshot.snapshotId,
          recommendationFingerprint:
            supported.snapshot.recommendationFingerprint,
          transitionContextId: supported.snapshot.transitionContextId,
        },
        targetRows: [],
        reducedMotion: true,
      }),
    ).toEqual({
      kind: 'static-only',
      reason: 'reduced-motion',
    });
  });

  it('rejects Object.create and custom-prototype identities', () => {
    const inheritedArgs = readinessArgs();
    inheritedArgs.expectedIdentity = Object.create(
      inheritedArgs.expectedIdentity,
    ) as typeof inheritedArgs.expectedIdentity;
    expectUnknownStaticOnly(inheritedArgs);

    const customArgs = readinessArgs();
    const customIdentity = {
      ...customArgs.expectedIdentity,
    };
    Object.setPrototypeOf(customIdentity, { custom: true });
    customArgs.expectedIdentity = customIdentity;
    expectUnknownStaticOnly(customArgs);
  });

  it('rejects inherited row records and inherited row fields', () => {
    const inheritedRecordArgs = readinessArgs();
    inheritedRecordArgs.targetRows[0] = Object.create(
      inheritedRecordArgs.targetRows[0]!,
    ) as (typeof inheritedRecordArgs.targetRows)[number];
    expectUnknownStaticOnly(inheritedRecordArgs);

    const inheritedFieldArgs = readinessArgs();
    const source = inheritedFieldArgs.targetRows[0]!;
    inheritedFieldArgs.targetRows[0] = Object.assign(
      Object.create({ element: source.element }),
      { itemId: source.itemId },
    ) as (typeof inheritedFieldArgs.targetRows)[number];
    expectUnknownStaticOnly(inheritedFieldArgs);

    const customRecordArgs = readinessArgs();
    Object.setPrototypeOf(customRecordArgs.targetRows[0]!, {
      custom: true,
    });
    expectUnknownStaticOnly(customRecordArgs);
  });

  it('rejects identity supplied by Object.prototype pollution', () => {
    const pollutedKey = 'snapshotId';
    const previous = Object.getOwnPropertyDescriptor(
      Object.prototype,
      pollutedKey,
    );
    const args = readinessArgs();
    const expectedSnapshotId = args.expectedIdentity.snapshotId;
    args.expectedIdentity = {
      recommendationFingerprint:
        args.expectedIdentity.recommendationFingerprint,
      transitionContextId:
        args.expectedIdentity.transitionContextId,
    } as typeof args.expectedIdentity;
    Object.defineProperty(Object.prototype, pollutedKey, {
      configurable: true,
      enumerable: false,
      value: expectedSnapshotId,
      writable: true,
    });

    try {
      expectUnknownStaticOnly(args);
    } finally {
      if (previous === undefined) {
        delete (Object.prototype as Record<string, unknown>)[pollutedKey];
      } else {
        Object.defineProperty(Object.prototype, pollutedKey, previous);
      }
    }
  });

  it('rejects row fields supplied by Object.prototype pollution', () => {
    const pollutedKey = 'element';
    const previous = Object.getOwnPropertyDescriptor(
      Object.prototype,
      pollutedKey,
    );
    const args = readinessArgs();
    const pollutedElement = args.targetRows[0]!.element;
    args.targetRows[0] = {
      itemId: args.targetRows[0]!.itemId,
    } as (typeof args.targetRows)[number];
    Object.defineProperty(Object.prototype, pollutedKey, {
      configurable: true,
      enumerable: false,
      value: pollutedElement,
      writable: true,
    });

    try {
      expectUnknownStaticOnly(args);
    } finally {
      if (previous === undefined) {
        delete (Object.prototype as Record<string, unknown>)[pollutedKey];
      } else {
        Object.defineProperty(Object.prototype, pollutedKey, previous);
      }
    }
  });

  it('does not invoke identity or row accessors', () => {
    const identityArgs = readinessArgs();
    let identityGetterCalls = 0;
    identityArgs.expectedIdentity = {
      get snapshotId(): never {
        identityGetterCalls += 1;
        throw new Error('identity getter must not run');
      },
      recommendationFingerprint:
        identityArgs.expectedIdentity.recommendationFingerprint,
      transitionContextId:
        identityArgs.expectedIdentity.transitionContextId,
    };
    const identityOutcome = attemptUnknownReadiness(identityArgs);
    expect(identityGetterCalls).toBe(0);
    expect(identityOutcome.error).toBeUndefined();
    expect(identityOutcome.result).toMatchObject({
      kind: 'static-only',
    });

    const rowArgs = readinessArgs();
    const source = rowArgs.targetRows[0]!;
    let rowGetterCalls = 0;
    rowArgs.targetRows[0] = {
      get itemId(): never {
        rowGetterCalls += 1;
        throw new Error('row getter must not run');
      },
      element: source.element,
    };
    const rowOutcome = attemptUnknownReadiness(rowArgs);
    expect(rowGetterCalls).toBe(0);
    expect(rowOutcome.error).toBeUndefined();
    expect(rowOutcome.result).toMatchObject({
      kind: 'static-only',
    });
  });

  it('does not invoke readiness-root or truth-wrapper accessors', () => {
    const source = readinessArgs();
    let rootGetterCalls = 0;
    const rootAccessor = {
      get truth() {
        rootGetterCalls += 1;
        throw new Error('readiness root getter must not run');
      },
      expectedIdentity: source.expectedIdentity,
      targetRows: source.targetRows,
      reducedMotion: false,
    };
    const rootOutcome = attemptUnknownReadiness(rootAccessor);
    expect(rootGetterCalls).toBe(0);
    expect(rootOutcome.error).toBeUndefined();
    expect(rootOutcome.result).toMatchObject({
      kind: 'static-only',
    });

    const truthArgs = readinessArgs();
    let truthGetterCalls = 0;
    truthArgs.truth = {
      kind: 'supported',
      get snapshot(): never {
        truthGetterCalls += 1;
        throw new Error('truth wrapper getter must not run');
      },
    } as typeof truthArgs.truth;
    const truthOutcome = attemptUnknownReadiness(truthArgs);
    expect(truthGetterCalls).toBe(0);
    expect(truthOutcome.error).toBeUndefined();
    expect(truthOutcome.result).toMatchObject({
      kind: 'static-only',
    });
  });

  it('rejects symbol, non-enumerable and extra identity properties', () => {
    const symbolArgs = readinessArgs();
    Object.defineProperty(
      symbolArgs.expectedIdentity,
      Symbol('unexpected'),
      {
        enumerable: true,
        value: true,
      },
    );
    expectUnknownStaticOnly(symbolArgs);

    const nonEnumerableArgs = readinessArgs();
    Object.defineProperty(
      nonEnumerableArgs.expectedIdentity,
      'snapshotId',
      {
        configurable: true,
        enumerable: false,
        value: nonEnumerableArgs.expectedIdentity.snapshotId,
        writable: true,
      },
    );
    expectUnknownStaticOnly(nonEnumerableArgs);

    const extraArgs = readinessArgs();
    extraArgs.expectedIdentity = {
      ...extraArgs.expectedIdentity,
      unexpected: true,
    } as typeof extraArgs.expectedIdentity;
    expectUnknownStaticOnly(extraArgs);
  });

  it('rejects symbol, non-enumerable and extra row properties', () => {
    const symbolArgs = readinessArgs();
    Object.defineProperty(
      symbolArgs.targetRows[0]!,
      Symbol('unexpected'),
      {
        enumerable: true,
        value: true,
      },
    );
    expectUnknownStaticOnly(symbolArgs);

    const nonEnumerableArgs = readinessArgs();
    Object.defineProperty(
      nonEnumerableArgs.targetRows[0]!,
      'itemId',
      {
        configurable: true,
        enumerable: false,
        value: nonEnumerableArgs.targetRows[0]!.itemId,
        writable: true,
      },
    );
    expectUnknownStaticOnly(nonEnumerableArgs);

    const extraArgs = readinessArgs();
    extraArgs.targetRows[0] = {
      ...extraArgs.targetRows[0]!,
      unexpected: true,
    } as (typeof extraArgs.targetRows)[number];
    expectUnknownStaticOnly(extraArgs);
  });

  it('rejects sparse and decorated target-row arrays', () => {
    const inheritedArrayArgs = readinessArgs();
    inheritedArrayArgs.targetRows = Object.create(
      inheritedArrayArgs.targetRows,
    ) as typeof inheritedArrayArgs.targetRows;
    expectUnknownStaticOnly(inheritedArrayArgs);

    const customArrayArgs = readinessArgs();
    Object.setPrototypeOf(
      customArrayArgs.targetRows,
      Object.create(Array.prototype) as unknown[],
    );
    expectUnknownStaticOnly(customArrayArgs);

    const sparseArgs = readinessArgs();
    const sparseRows = new Array<
      (typeof sparseArgs.targetRows)[number]
    >(sparseArgs.targetRows.length);
    for (let index = 1; index < sparseArgs.targetRows.length; index += 1) {
      sparseRows[index] = sparseArgs.targetRows[index]!;
    }
    sparseArgs.targetRows = sparseRows;
    expectUnknownStaticOnly(sparseArgs);

    const symbolArgs = readinessArgs();
    Object.defineProperty(symbolArgs.targetRows, Symbol('unexpected'), {
      enumerable: true,
      value: true,
    });
    expectUnknownStaticOnly(symbolArgs);

    const extraArgs = readinessArgs();
    Object.defineProperty(extraArgs.targetRows, 'unexpected', {
      configurable: true,
      enumerable: true,
      value: true,
      writable: true,
    });
    expectUnknownStaticOnly(extraArgs);

    const nonEnumerableArgs = readinessArgs();
    Object.defineProperty(nonEnumerableArgs.targetRows, '0', {
      configurable: true,
      enumerable: false,
      value: nonEnumerableArgs.targetRows[0],
      writable: true,
    });
    expectUnknownStaticOnly(nonEnumerableArgs);
  });

  it('does not invoke target-row array index accessors', () => {
    const args = readinessArgs();
    let indexGetterCalls = 0;
    Object.defineProperty(args.targetRows, '0', {
      configurable: true,
      enumerable: true,
      get() {
        indexGetterCalls += 1;
        throw new Error('array index getter must not run');
      },
    });

    const outcome = attemptUnknownReadiness(args);
    expect(indexGetterCalls).toBe(0);
    expect(outcome.error).toBeUndefined();
    expect(outcome.result).toMatchObject({
      kind: 'static-only',
    });
  });

  it('rejects sparse row records without an uncontrolled exception', () => {
    const args = readinessArgs();
    args.targetRows[0] = {
      itemId: args.targetRows[0]!.itemId,
    } as (typeof args.targetRows)[number];
    expectUnknownStaticOnly(args);
  });

  it('does not export or conflate a Home-source registrar', () => {
    expect('RegisterHomeAnchor' in transitionContract).toBe(false);
    expect('registerHomeAnchor' in transitionContract).toBe(false);
    expect('createHomeAnchorRegistry' in transitionContract).toBe(false);
  });
});
