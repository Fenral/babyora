import { describe, expect, it } from 'vitest';
import { recommend } from '../../wool-layers/recommend.js';
import type {
  RecommendInput,
  Recommendation,
} from '../../wool-layers/types.js';
import {
  createOutfitTruthSnapshot,
  isOutfitTruthSnapshot,
  OutfitTruthInputError,
} from '../outfit-truth.js';

function exactInput(
  overrides: Partial<RecommendInput> = {},
): RecommendInput {
  return {
    weather: {
      feelsLikeC: 4,
      tempC: 5,
      windMs: 1,
      precipMmH: 0,
    },
    child: { ageMonths: 8 },
    activity: 'utelek',
    ...overrides,
  };
}

function build(
  input: RecommendInput,
  finalizedRecommendation: Recommendation = recommend(input),
) {
  return createOutfitTruthSnapshot({
    transitionContextId: 'transition:fixture',
    input,
    finalizedRecommendation,
    pose: input.child.ageMonths < 12 ? 'sitting' : 'standing',
  });
}

describe('canonical outfit truth', () => {
  it('is deterministic for the exact same complete finalized input', () => {
    const input = exactInput();
    const recommendation = recommend(input);

    const first = build(input, recommendation);
    const second = build(structuredClone(input), structuredClone(recommendation));

    expect(first).toEqual(second);
    expect(first.kind).toBe('supported');
    if (first.kind === 'supported' && second.kind === 'supported') {
      expect(first.snapshot.snapshotId).toBe(second.snapshot.snapshotId);
      expect(first.snapshot.recommendationFingerprint).toBe(
        second.snapshot.recommendationFingerprint,
      );
      expect(first.snapshot.transitionContextId).toBe(
        second.snapshot.transitionContextId,
      );
      expect(first.snapshot.garments.map((item) => item.itemId)).toEqual(
        second.snapshot.garments.map((item) => item.itemId),
      );
      expect(isOutfitTruthSnapshot(first.snapshot)).toBe(true);
    }
  });

  it('binds recommendation provenance to the complete input and finalized layers', () => {
    const input = exactInput();
    const recommendation = recommend(input);
    const fabricated: Recommendation = {
      ...recommendation,
      layers: recommendation.layers.map((layer, index) => ({
        ...layer,
        items:
          index === 0
            ? [...layer.items, 'fabricated provenance layer']
            : [...layer.items],
      })),
    };

    const original = build(input, recommendation);
    const altered = build(input, fabricated);
    expect(original.kind).toBe('supported');
    expect(altered.kind).toBe('supported');
    if (original.kind !== 'supported' || altered.kind !== 'supported') return;

    expect(altered.snapshot.recommendationId).not.toBe(
      original.snapshot.recommendationId,
    );
    expect(altered.snapshot.recommendationFingerprint).not.toBe(
      original.snapshot.recommendationFingerprint,
    );
    expect(altered.snapshot.snapshotId).not.toBe(
      original.snapshot.snapshotId,
    );
    expect(
      altered.snapshot.garments.find(
        (garment) =>
          garment.sourceLabel === 'fabricated provenance layer',
      ),
    ).toMatchObject({
      catalogGarmentId: null,
      bodyRegion: 'unknown',
      bodyAnchor: null,
      avatarCoverage: null,
      visibleOnAvatar: false,
    });
    expect(altered.snapshot.avatar.verifiedAssetPath).toBeNull();
    expect(altered.snapshot.avatar.visibleGarmentIds).toEqual([]);
  });

  it.each([
    ['recommendationId', 'outfit-recommendation-v1:fabricated'],
    [
      'recommendationFingerprint',
      'outfit-recommendation-fingerprint-v1:fabricated',
    ],
  ] as const)('rejects a fabricated %s', (key, fabricatedValue) => {
    const input = exactInput();
    const finalizedRecommendation = recommend(input);

    expect(() =>
      createOutfitTruthSnapshot({
        [key]: fabricatedValue,
        transitionContextId: 'transition:fixture',
        input,
        finalizedRecommendation,
        pose: 'sitting',
      } as Parameters<typeof createOutfitTruthSnapshot>[0]),
    ).toThrow(OutfitTruthInputError);
  });

  it('does not trust a structurally identical snapshot created by type assertion', () => {
    const result = build(exactInput());
    expect(result.kind).toBe('supported');
    if (result.kind !== 'supported') return;

    const assertedClone = structuredClone(
      result.snapshot,
    ) as typeof result.snapshot;
    expect(assertedClone).toEqual(result.snapshot);
    expect(isOutfitTruthSnapshot(assertedClone)).toBe(false);
  });

  it('accepts every valid optional RecommendInput field without flattening it', () => {
    const input = exactInput({
      weather: {
        feelsLikeC: 4,
        tempC: 5,
        windMs: 1,
        precipMmH: 0,
        humidity: 72.5,
        symbolCode: 'clearsky_day',
        uvIndex: 3.4,
      },
      child: {
        ageMonths: 8,
        canRoll: false,
      },
      exposureMin: 45.5,
      innerJakke: true,
      vognMode: 'awake',
      context: {
        bilstol: false,
      },
      childCalibration: 1,
    });

    expect(build(input).kind).toBe('supported');
  });

  it.each([
    ['NaN childCalibration', NaN],
    ['positive infinite childCalibration', Number.POSITIVE_INFINITY],
    ['negative infinite childCalibration', Number.NEGATIVE_INFINITY],
  ])('rejects %s before identity derivation', (_name, childCalibration) => {
    const input = exactInput();
    (input as unknown as { childCalibration: number }).childCalibration =
      childCalibration;
    const finalizedRecommendation = recommend(exactInput());

    expect(() =>
      createOutfitTruthSnapshot({
        transitionContextId: 'transition:fixture',
        input,
        finalizedRecommendation,
        pose: 'sitting',
      }),
    ).toThrow(OutfitTruthInputError);
  });

  it.each([
    [
      'non-finite humidity',
      (input: RecommendInput) => {
        input.weather.humidity = Number.POSITIVE_INFINITY;
      },
    ],
    [
      'humidity outside 0-100',
      (input: RecommendInput) => {
        input.weather.humidity = 101;
      },
    ],
    [
      'negative UV index',
      (input: RecommendInput) => {
        input.weather.uvIndex = -1;
      },
    ],
    [
      'non-finite exposure',
      (input: RecommendInput) => {
        input.exposureMin = NaN;
      },
    ],
    [
      'negative exposure',
      (input: RecommendInput) => {
        input.exposureMin = -1;
      },
    ],
    [
      'invalid canRoll',
      (input: RecommendInput) => {
        input.child.canRoll = 'yes' as unknown as boolean;
      },
    ],
    [
      'invalid innerJakke',
      (input: RecommendInput) => {
        input.innerJakke = 1 as unknown as boolean;
      },
    ],
    [
      'invalid vognMode',
      (input: RecommendInput) => {
        input.vognMode = 'resting' as RecommendInput['vognMode'];
      },
    ],
    [
      'invalid bilstol context',
      (input: RecommendInput) => {
        input.context = {
          bilstol: 'yes' as unknown as boolean,
        };
      },
    ],
    [
      'age below engine range',
      (input: RecommendInput) => {
        input.child.ageMonths = -1;
      },
    ],
    [
      'age above engine range',
      (input: RecommendInput) => {
        input.child.ageMonths = 61;
      },
    ],
  ])('rejects optional/input shape: %s', (_name, mutate) => {
    const input = exactInput();
    mutate(input);
    const finalizedRecommendation = recommend(exactInput());

    expect(() =>
      createOutfitTruthSnapshot({
        transitionContextId: 'transition:fixture',
        input,
        finalizedRecommendation,
        pose: 'sitting',
      }),
    ).toThrow(OutfitTruthInputError);
  });

  it('rejects non-enumerable own input fields that serialization would omit', () => {
    const input = exactInput();
    Object.defineProperty(input, 'childCalibration', {
      configurable: true,
      enumerable: false,
      value: 1,
      writable: true,
    });

    expect(() =>
      createOutfitTruthSnapshot({
        transitionContextId: 'transition:fixture',
        input,
        finalizedRecommendation: recommend(exactInput()),
        pose: 'sitting',
      }),
    ).toThrow(OutfitTruthInputError);
  });

  it.each([
    [
      'layers',
      (recommendation: Recommendation) => {
        recommendation.layers =
          new Array<Recommendation['layers'][number]>(1);
      },
    ],
    [
      'layer items',
      (recommendation: Recommendation) => {
        recommendation.layers[0]!.items = new Array<string>(1);
      },
    ],
    [
      'notes',
      (recommendation: Recommendation) => {
        recommendation.notes = new Array<string>(1);
      },
    ],
    [
      'structured notes',
      (recommendation: Recommendation) => {
        recommendation.structuredNotes =
          new Array<Recommendation['structuredNotes'][number]>(1);
      },
    ],
    [
      'safety flags',
      (recommendation: Recommendation) => {
        recommendation.safetyFlags =
          new Array<NonNullable<Recommendation['safetyFlags']>[number]>(1);
      },
    ],
    [
      'safety sources',
      (recommendation: Recommendation) => {
        recommendation.safetyFlags = [
          {
            code: 'TEST',
            message: 'Test',
            sources:
              new Array<
                NonNullable<
                  Recommendation['safetyFlags']
                >[number]['sources'][number]
              >(1),
            severity: 'LOW',
            category: 'sikkerhet',
          },
        ];
      },
    ],
  ])('rejects sparse %s with a controlled input error', (_name, mutate) => {
    const input = exactInput();
    const finalizedRecommendation = structuredClone(recommend(input));
    mutate(finalizedRecommendation);

    expect(() =>
      createOutfitTruthSnapshot({
        transitionContextId: 'transition:fixture',
        input,
        finalizedRecommendation,
        pose: 'sitting',
      }),
    ).toThrow(OutfitTruthInputError);
  });

  it('preserves duplicate source labels as distinct stable occurrences', () => {
    const input = exactInput();
    const recommendation = recommend(input);
    const duplicated: Recommendation = {
      ...recommendation,
      layers: recommendation.layers.map((layer, index) =>
        index === 0
          ? {
              ...layer,
              items: [layer.items[0]!, layer.items[0]!],
            }
          : { ...layer, items: [...layer.items] },
      ),
    };

    const result = build(input, duplicated);
    expect(result.kind).toBe('supported');
    if (result.kind === 'supported') {
      const [first, second] = result.snapshot.garments;
      expect(first?.sourceLabel).toBe(second?.sourceLabel);
      expect(first?.itemId).not.toBe(second?.itemId);
      expect(result.snapshot.garments.map((item) => item.order)).toEqual(
        result.snapshot.garments.map((_, index) => index + 1),
      );
    }
  });

  it('recursively freezes root, arrays, records, avatar and anchors', () => {
    const result = build(exactInput());
    expect(result.kind).toBe('supported');
    if (result.kind !== 'supported') return;

    const snapshot = result.snapshot;
    const first = snapshot.garments[0]!;
    const originalLabel = first.label;
    const originalAnchorX = first.bodyAnchor?.x;

    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.garments)).toBe(true);
    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(first.bodyAnchor)).toBe(true);
    expect(Object.isFrozen(first.avatarCoverage)).toBe(true);
    expect(Object.isFrozen(snapshot.avatar)).toBe(true);
    expect(Object.isFrozen(snapshot.avatar.visibleGarmentIds)).toBe(true);

    expect(() => {
      (first as { label: string }).label = 'mutated';
    }).toThrow(TypeError);
    expect(() => {
      if (first.bodyAnchor !== null) {
        (first.bodyAnchor as { x: number }).x = 0;
      }
    }).toThrow(TypeError);
    expect(first.label).toBe(originalLabel);
    expect(first.bodyAnchor?.x).toBe(originalAnchorX);
  });

  it('retains an unknown label as text truth and disables graphical claims', () => {
    const input = exactInput();
    const recommendation = recommend(input);
    const withUnknown: Recommendation = {
      ...recommendation,
      layers: [
        {
          category: 'innerst',
          items: ['ukjent fremtidig plagg'],
        },
      ],
    };

    const result = build(input, withUnknown);
    expect(result.kind).toBe('supported');
    if (result.kind === 'supported') {
      expect(result.snapshot.garments).toHaveLength(1);
      expect(result.snapshot.garments[0]).toMatchObject({
        sourceLabel: 'ukjent fremtidig plagg',
        catalogGarmentId: null,
        bodyRegion: 'unknown',
        bodyAnchor: null,
        avatarCoverage: null,
        visibleOnAvatar: false,
      });
      expect(result.snapshot.avatar.verifiedAssetPath).toBeNull();
      expect(result.snapshot.avatar.visibleGarmentIds).toEqual([]);
    }
  });

  it('preserves the measured 11-garment output as complete list-only truth', () => {
    const input = exactInput({
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
    const recommendation = recommend(input);

    const result = build(input, recommendation);
    expect(result.kind).toBe('unsupported-cardinality');
    if (result.kind === 'unsupported-cardinality') {
      expect(result.reason).toBe(
        'semantic-garment-count-outside-1-10',
      );
      expect(result.orderedGarments.map((item) => item.sourceLabel)).toEqual([
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
      expect(result.orderedGarments).toHaveLength(11);
      expect(result.equipment.map((item) => item.sourceLabel)).toEqual([
        'varmepose dun',
        'saueskinn i vogn',
        'ansiktskrem',
        'vognpose',
      ]);
      expect('snapshot' in result).toBe(false);
    }
  });

  it('accepts valid presence and absence of optional finalizer fields', () => {
    const input = exactInput();
    const present = build(input, recommend(input));
    const recommendation = recommend(input);
    const absent = build(input, {
      activity: recommendation.activity,
      tempBand: recommendation.tempBand,
      layers: recommendation.layers,
      notes: recommendation.notes,
      structuredNotes: recommendation.structuredNotes,
      summary: recommendation.summary,
    });

    expect(present.kind).toBe('supported');
    expect(absent.kind).toBe('supported');
  });

  it.each([
    {
      name: 'flat string projection',
      value: {
        activity: 'utelek',
        tempBand: 'kald',
        items: ['tykt ullsett'],
      },
    },
    {
      name: 'input/activity mismatch',
      value: {
        ...recommend(exactInput()),
        activity: 'vogn',
      },
    },
    {
      name: 'malformed optional finalizer field',
      value: {
        ...recommend(exactInput()),
        severity: 'ABSOLUTE',
      },
    },
  ])('rejects $name before snapshot construction', ({ value }) => {
    const input = exactInput();
    expect(() =>
      createOutfitTruthSnapshot({
        transitionContextId: 'transition:fixture',
        input,
        finalizedRecommendation: value as Recommendation,
        pose: 'sitting',
      }),
    ).toThrow(OutfitTruthInputError);
  });
});
