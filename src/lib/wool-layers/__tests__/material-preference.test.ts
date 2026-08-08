import { describe, expect, it } from 'vitest';
import { getAlternatives } from '../alternatives.js';
import {
  applyMaterialPreference,
  WOOL_COTTON_EQUIVALENTS,
  WOOL_FLEECE_EQUIVALENTS,
} from '../material-preference.js';
import { recommend } from '../recommend.js';
import type { RecommendInput } from '../types.js';

const coldStroller: RecommendInput = {
  weather: {
    feelsLikeC: -6,
    tempC: -4,
    windMs: 3,
    precipMmH: 0,
  },
  child: { ageMonths: 14 },
  activity: 'vogn',
  vognMode: 'awake',
};

function itemsOf(input: RecommendInput): string[] {
  return recommend(input).layers.flatMap((layer) => layer.items);
}

describe('legacy material preference', () => {
  it('keeps neutral output byte-for-byte compatible with the existing order', () => {
    expect(
      recommend({
        ...coldStroller,
        materialPreference: 'best_for_conditions',
      }),
    ).toEqual(recommend(coldStroller));
  });

  it('ranks equivalent fleece middle layers first without replacing wool base layers', () => {
    const fleece = recommend({
      ...coldStroller,
      materialPreference: 'prefer_fleece',
    });
    const items = fleece.layers.flatMap((layer) => layer.items);

    expect(items).toEqual(expect.arrayContaining(['fleecedress', 'fleecejakke']));
    expect(items).not.toContain('ull-mellomlag');
    expect(items).not.toContain('ull-jakke');
    expect(items.some((item) => /ullsett/u.test(item))).toBe(true);

    const neutral = recommend(coldStroller);
    expect(fleece.severity).toBe(neutral.severity);
    expect((fleece.safetyFlags ?? []).map((flag) => flag.code)).toEqual(
      (neutral.safetyFlags ?? []).map((flag) => flag.code),
    );
  });

  it('treats legacy avoid_wool as the same narrow fleece-first ranking', () => {
    expect(
      itemsOf({ ...coldStroller, materialPreference: 'avoid_wool' }),
    ).toEqual(
      itemsOf({ ...coldStroller, materialPreference: 'prefer_fleece' }),
    );
  });

  it('applies prefer_wool in the inverse direction for equivalent fleece items', () => {
    expect(
      applyMaterialPreference(
        [{
          category: 'mellomlag',
          items: ['tynn fleece', 'fleecejakke', 'fleecebukse'],
        }],
        'prefer_wool',
      ),
    ).toEqual([{
      category: 'mellomlag',
      items: ['tynt ull-mellomlag', 'ull-jakke', 'ull-bukse'],
    }]);
  });

  it('never performs a broad name-based wool replacement', () => {
    const layers = [{
      category: 'innerst' as const,
      items: ['langermet ullbody', 'tykt ullsett', 'lue m/ ull'],
    }];

    expect(applyMaterialPreference(layers, 'prefer_fleece', coldStroller)).toBe(layers);
    expect(applyMaterialPreference(layers, 'avoid_wool', coldStroller)).toBe(layers);
  });

  it('uses cotton only for equivalent base garments in mild, dry and calm conditions', () => {
    const layers = [
      { category: 'innerst' as const, items: ['langermet ullbody', 'tynt ullsett', 'ullsokker'] },
      { category: 'mellomlag' as const, items: ['ull-mellomlag'] },
    ];
    const mildDry: RecommendInput = {
      ...coldStroller,
      weather: { feelsLikeC: 16, tempC: 17, windMs: 2, precipMmH: 0 },
    };

    expect(applyMaterialPreference(layers, 'prefer_cotton', mildDry)).toEqual([
      { category: 'innerst', items: ['langermet body', 'bomullssett', 'bomullssokker'] },
      { category: 'mellomlag', items: ['ull-mellomlag'] },
    ]);
  });

  it('does not let a cotton preference override cold, wet or active conditions', () => {
    const layers = [{
      category: 'innerst' as const,
      items: ['langermet ullbody', 'tynt ullsett', 'ullsokker'],
    }];

    expect(applyMaterialPreference(layers, 'prefer_cotton', coldStroller)).toBe(layers);
    expect(applyMaterialPreference(layers, 'prefer_cotton', {
      ...coldStroller,
      activity: 'utelek',
      weather: { feelsLikeC: 16, tempC: 17, windMs: 2, precipMmH: 0 },
    })).toBe(layers);
  });
});

describe('wool/fleece alternative contract', () => {
  it.each(WOOL_FLEECE_EQUIVALENTS)(
    '$wool and $fleece nominate each other explicitly',
    ({ wool, fleece }) => {
      expect(getAlternatives(wool)?.alternatives.map((item) => item.name))
        .toContain(fleece);
      expect(getAlternatives(fleece)?.alternatives.map((item) => item.name))
        .toContain(wool);
    },
  );
});

describe('wool/cotton alternative contract', () => {
  it.each(WOOL_COTTON_EQUIVALENTS)(
    '$wool and $cotton nominate each other explicitly',
    ({ wool, cotton }) => {
      expect(getAlternatives(wool)?.alternatives.map((item) => item.name))
        .toContain(cotton);
      expect(getAlternatives(cotton)?.alternatives.map((item) => item.name))
        .toContain(wool);
    },
  );
});
