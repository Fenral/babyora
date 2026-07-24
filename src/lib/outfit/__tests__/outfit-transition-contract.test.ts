import { describe, expect, it } from 'vitest';
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
  return createOutfitTruthSnapshot({
    recommendationId: 'recommendation:transition',
    recommendationFingerprint: 'fingerprint:transition',
    transitionContextId: 'transition:context',
    input: exactInput,
    finalizedRecommendation: recommend(exactInput),
    pose: exactInput.child.ageMonths < 12 ? 'sitting' : 'standing',
  });
}

function element(connected = true): HTMLElement {
  return { isConnected: connected } as HTMLElement;
}

function identity() {
  return {
    snapshotId: '',
    recommendationFingerprint: 'fingerprint:transition',
    transitionContextId: 'transition:context',
  };
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
        ...identity(),
        snapshotId: result.snapshot.snapshotId,
      },
      targetRows: registry.read(),
      reducedMotion: false,
    });

    expect(readiness).toMatchObject({
      kind: 'ready',
      snapshotId: result.snapshot.snapshotId,
      recommendationFingerprint: 'fingerprint:transition',
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
          ...identity(),
          snapshotId: result.snapshot.snapshotId,
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
      ...identity(),
      snapshotId: result.snapshot.snapshotId,
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
        expectedIdentity: identity(),
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
          ...identity(),
          snapshotId: supported.snapshot.snapshotId,
        },
        targetRows: [],
        reducedMotion: true,
      }),
    ).toEqual({
      kind: 'static-only',
      reason: 'reduced-motion',
    });
  });

  it('does not export or conflate a Home-source registrar', () => {
    expect('RegisterHomeAnchor' in transitionContract).toBe(false);
    expect('registerHomeAnchor' in transitionContract).toBe(false);
    expect('createHomeAnchorRegistry' in transitionContract).toBe(false);
  });
});
