import { describe, expect, it } from 'vitest';
import type { OutfitTruthSnapshotV1 } from '../../../lib/outfit/outfit-truth.js';
import { recommend } from '../../../lib/wool-layers/recommend.js';
import type { RecommendInput, Recommendation } from '../../../lib/wool-layers/types.js';
import {
  deriveResultRows,
  deriveResultRowsFromTruth,
  ROLE_LABEL_BY_CATEGORY,
} from '../result-rows.js';

function fixedInput(): RecommendInput {
  return {
    weather: {
      tempC: 3,
      feelsLikeC: -1,
      windMs: 4,
      precipMmH: 0.5,
      humidity: 80,
      symbolCode: 'lightsnow',
      uvIndex: 0,
    },
    child: { ageMonths: 8, canRoll: true },
    activity: 'utelek',
    exposureMin: 45,
    context: { bilstol: false },
    childCalibration: 0,
  };
}

describe('deriveResultRows', () => {
  it('returns an empty list for null/undefined recommendation', () => {
    expect(deriveResultRows(null)).toEqual([]);
    expect(deriveResultRows(undefined)).toEqual([]);
  });

  it('orders rows innerst -> mellomlag -> yttertoy -> ekstra -> utstyr, numbered from 1', () => {
    const recommendation = recommend(fixedInput());
    const rows = deriveResultRows(recommendation);

    expect(rows.length).toBeGreaterThan(0);
    // Positions are contiguous starting at 1.
    expect(rows.map((row) => row.position)).toEqual(rows.map((_, index) => index + 1));

    const categoryRank: Record<string, number> = {
      Innerst: 0, Mellomlag: 1, Ytterst: 2, Tilbehør: 3,
    };
    const ranks = rows.map((row) => categoryRank[row.roleLabel]);
    const sorted = [...ranks].sort((a, b) => a - b);
    expect(ranks).toEqual(sorted);
  });

  it('every row label is drawn verbatim from the recommendation (never paraphrased)', () => {
    const recommendation = recommend(fixedInput());
    const rows = deriveResultRows(recommendation);
    const allLabels = recommendation.layers.flatMap((layer) => layer.items);
    for (const row of rows) {
      expect(allLabels).toContain(row.label);
    }
    expect(rows.length).toBe(allLabels.length);
    expect(rows.every((row) => row.outfitItemId === null)).toBe(true);
  });

  it('maps every LayerCategory to the exact mock copy (Innerst/Mellomlag/Ytterst/Tilbehør)', () => {
    expect(ROLE_LABEL_BY_CATEGORY.innerst).toBe('Innerst');
    expect(ROLE_LABEL_BY_CATEGORY.mellomlag).toBe('Mellomlag');
    expect(ROLE_LABEL_BY_CATEGORY.yttertoy).toBe('Ytterst');
    expect(ROLE_LABEL_BY_CATEGORY.ekstra).toBe('Tilbehør');
    expect(ROLE_LABEL_BY_CATEGORY.utstyr).toBe('Tilbehør');
  });

  it('resolves a garmentId for every row that garment-illustrations.ts recognises, and gives no garmentId a mangled value', () => {
    const recommendation = recommend(fixedInput());
    const rows = deriveResultRows(recommendation);
    for (const row of rows) {
      if (row.garmentId !== null) {
        expect(typeof row.garmentId).toBe('string');
        expect(row.garmentId.length).toBeGreaterThan(0);
      }
    }
  });

  it('handles a recommendation with an empty layers array without throwing', () => {
    const empty: Recommendation = {
      activity: 'utelek',
      tempBand: recommend(fixedInput()).tempBand,
      layers: [],
      notes: [],
      structuredNotes: [],
      summary: '',
    };
    expect(deriveResultRows(empty)).toEqual([]);
  });
});

describe('deriveResultRowsFromTruth', () => {
  it('preserves authorized item identity while ordering garments and equipment by truth order', () => {
    const itemId = (value: string) => value as OutfitTruthSnapshotV1['garments'][number]['itemId'];
    const snapshot: OutfitTruthSnapshotV1 = {
      contractVersion: 1,
      snapshotId: 'snapshot:test' as OutfitTruthSnapshotV1['snapshotId'],
      recommendationId: 'recommendation:test',
      recommendationFingerprint: 'fingerprint:test',
      transitionContextId: 'transition:test',
      garments: [
        {
          itemId: itemId('item:mid'),
          sourceLabel: 'ull-jakke',
          label: 'ull-jakke',
          catalogGarmentId: 'ull-jakke',
          category: 'mellomlag',
          order: 20,
          bodyRegion: 'torso',
          bodyAnchor: null,
          avatarCoverage: null,
          visibleOnAvatar: true,
        },
        {
          itemId: itemId('item:base'),
          sourceLabel: 'langermet ullbody',
          label: 'langermet ullbody',
          catalogGarmentId: 'langermet-ullbody',
          category: 'innerst',
          order: 10,
          bodyRegion: 'torso',
          bodyAnchor: null,
          avatarCoverage: null,
          visibleOnAvatar: true,
        },
      ],
      equipment: [{
        itemId: itemId('item:equipment'),
        sourceLabel: 'regntrekk',
        label: 'regntrekk',
        catalogGarmentId: 'regntrekk',
        order: 30,
      }],
      avatar: {
        pose: 'standing',
        stateKey: 'avatar:test',
        verifiedAssetPath: null,
        visibleGarmentIds: [itemId('item:base'), itemId('item:mid')],
      },
    };

    const rows = deriveResultRowsFromTruth(snapshot);

    expect(rows.map((row) => row.key)).toEqual([
      'item:base',
      'item:mid',
      'item:equipment',
    ]);
    expect(rows.map((row) => row.outfitItemId)).toEqual([
      'item:base',
      'item:mid',
      'item:equipment',
    ]);
    expect(rows.map((row) => row.position)).toEqual([1, 2, 3]);
    expect(rows.map((row) => row.roleLabel)).toEqual(['Innerst', 'Mellomlag', 'Tilbehør']);
  });
});
