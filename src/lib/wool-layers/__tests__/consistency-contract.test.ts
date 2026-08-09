import i18next from 'i18next';
import { afterAll, describe, expect, it } from 'vitest';
import {
  canonicalRecommendationDecision,
  validateRecommendationConsistency,
} from '../consistency-contract.js';
import { buildRecommendationSummary } from '../recommendation-summary.js';
import { recommend } from '../recommend.js';
import { bandForTemp } from '../tables.js';
import type { Recommendation, RecommendInput } from '../types.js';

type InputOverrides = Omit<Partial<RecommendInput>, 'weather' | 'child'> & {
  weather?: Partial<RecommendInput['weather']>;
  child?: Partial<RecommendInput['child']>;
};

function makeInput(overrides: InputOverrides = {}): RecommendInput {
  const { weather, child, ...rest } = overrides;
  return {
    weather: {
      tempC: 4,
      feelsLikeC: 2,
      windMs: 3,
      precipMmH: 0,
      symbolCode: 'cloudy',
      ...weather,
    },
    child: { ageMonths: 8, ...child },
    activity: 'utelek',
    materialPreference: 'best_for_conditions',
    ...rest,
  };
}

function cloneRecommendation(rec: Recommendation): Recommendation {
  return structuredClone(rec);
}

function safetyProvenance(rec: Recommendation) {
  return {
    safetyFlags: structuredClone(rec.safetyFlags ?? []),
    severity: rec.severity ?? 'NONE',
  } as const;
}

const initialLanguage = i18next.resolvedLanguage ?? i18next.language;

afterAll(async () => {
  if (initialLanguage) await i18next.changeLanguage(initialLanguage);
});

describe('engine consistency contract — positive control', () => {
  const matrix: RecommendInput[] = [
    makeInput({
      activity: 'vogn',
      vognMode: 'awake',
      materialPreference: 'prefer_fleece',
      weather: { tempC: 6, feelsLikeC: 4, windMs: 7, precipMmH: 1.4, symbolCode: 'rain' },
    }),
    makeInput({
      activity: 'utelek',
      materialPreference: 'prefer_cotton',
      weather: { tempC: 19, feelsLikeC: 18, windMs: 1, precipMmH: 0, symbolCode: 'clearsky_day' },
    }),
    makeInput({
      activity: 'baeresele',
      innerJakke: true,
      materialPreference: 'avoid_wool',
      weather: { tempC: -2, feelsLikeC: -5, windMs: 4, precipMmH: 0 },
    }),
    makeInput({
      activity: 'soevn',
      materialPreference: 'prefer_wool',
      weather: { tempC: 21, feelsLikeC: 21, windMs: 0, precipMmH: 0 },
    }),
  ];

  it.each(matrix)('repeats one full result 100 times for %#', (input) => {
    const first = recommend(input);
    expect(validateRecommendationConsistency(input, first, safetyProvenance(first))).toEqual([]);
    for (let run = 0; run < 100; run += 1) {
      expect(recommend(input)).toEqual(first);
    }
  });

  it('keeps the canonical decision invariant across supported locales', async () => {
    const input = matrix[0]!;
    const decisions = [];
    for (const locale of ['no', 'en', 'sv', 'da', 'de']) {
      await i18next.changeLanguage(locale);
      decisions.push(canonicalRecommendationDecision(recommend(input)));
    }
    for (const decision of decisions.slice(1)) {
      expect(decision).toEqual(decisions[0]);
    }
  });

  it('is coherent immediately below, at, and above every existing temperature boundary', () => {
    const boundaries = [28, 22, 16, 10, 5, 0, -7, -15];
    for (const boundary of boundaries) {
      for (const feelsLikeC of [boundary - 0.01, boundary, boundary + 0.01]) {
        const input = makeInput({ weather: { tempC: feelsLikeC, feelsLikeC } });
        const rec = recommend(input);
        expect(rec.tempBand).toBe(bandForTemp(feelsLikeC));
        expect(validateRecommendationConsistency(input, rec, safetyProvenance(rec))).toEqual([]);
      }
    }
  });

  it('covers the product age boundary without changing the defensive engine range', () => {
    for (const ageMonths of [0, 2, 3, 4, 6, 7, 9, 12, 16, 24, 25, 60]) {
      const input = makeInput({ child: { ageMonths } });
      const rec = recommend(input);
      expect(validateRecommendationConsistency(input, rec, safetyProvenance(rec))).toEqual([]);
    }
    expect(() => recommend(makeInput({ child: { ageMonths: 61 } }))).toThrow(
      /mellom 0 og 60/u,
    );
  });

  it.each([
    ['non-finite feels-like', makeInput({ weather: { feelsLikeC: Number.NaN } })],
    ['non-finite temperature', makeInput({ weather: { tempC: Number.POSITIVE_INFINITY } })],
    ['negative wind', makeInput({ weather: { windMs: -1 } })],
    ['non-finite wind', makeInput({ weather: { windMs: Number.NaN } })],
    ['negative precipitation', makeInput({ weather: { precipMmH: -0.1 } })],
    ['non-finite precipitation', makeInput({ weather: { precipMmH: Number.NaN } })],
    ['negative age', makeInput({ child: { ageMonths: -1 } })],
    ['fractional age', makeInput({ child: { ageMonths: 2.5 } })],
    ['unknown activity', makeInput({ activity: 'unknown' as RecommendInput['activity'] })],
  ] as const)('fails closed for %s', (_label, input) => {
    expect(() => recommend(input)).toThrow(Error);
  });
});

describe('engine consistency contract — deliberate negative controls', () => {
  const input = makeInput({
    activity: 'soevn',
    weather: { tempC: 18, feelsLikeC: 18, windMs: 0, precipMmH: 0 },
  });

  it('rejects a stale summary', () => {
    const finalized = recommend(input);
    const malformed = { ...cloneRecommendation(finalized), summary: 'stale answer' };
    expect(validateRecommendationConsistency(input, malformed, safetyProvenance(finalized)).map((issue) => issue.code))
      .toContain('summary-mismatch');
  });

  it('rejects duplicate categories and garments', () => {
    const finalized = recommend(input);
    const malformed = cloneRecommendation(finalized);
    const first = malformed.layers[0]!;
    first.items.push(first.items[0]!);
    malformed.layers.push({ category: first.category, items: [...first.items] });
    malformed.summary = buildRecommendationSummary(input, malformed.layers);
    const codes = validateRecommendationConsistency(
      input,
      malformed,
      safetyProvenance(finalized),
    ).map((issue) => issue.code);
    expect(codes).toContain('duplicate-category');
    expect(codes).toContain('duplicate-item');
  });

  it('rejects severity that disagrees with final flags', () => {
    const finalized = recommend(input);
    const malformed = cloneRecommendation(finalized);
    malformed.severity = malformed.severity === 'CRITICAL' ? 'NONE' : 'CRITICAL';
    expect(validateRecommendationConsistency(input, malformed, safetyProvenance(finalized)).map((issue) => issue.code))
      .toContain('severity-mismatch');
  });

  it('rejects removal of every trace of a genuine CRITICAL finalized safety decision', () => {
    const finalized = recommend(input, { overrides: { ekstra: ['lue'] } });
    const expectedSafety = safetyProvenance(finalized);
    const removedFlag = finalized.safetyFlags?.find((flag) => flag.code === 'HB-1');
    expect(removedFlag?.severity).toBe('CRITICAL');
    expect(validateRecommendationConsistency(input, finalized, expectedSafety)).toEqual([]);

    const malformed = cloneRecommendation(finalized);
    malformed.safetyFlags = [];
    malformed.severity = 'NONE';
    malformed.structuredNotes = malformed.structuredNotes.filter(
      (note) => note.message !== removedFlag!.message,
    );
    malformed.notes = malformed.structuredNotes.map((note) => note.message);

    expect(validateRecommendationConsistency(input, malformed, expectedSafety)).toContainEqual({
      code: 'safety-provenance-mismatch',
      detail: 'returned safety flags and severity must match finalized safety provenance',
    });
  });

  it('accepts an ordinary non-safety note without a safety flag', () => {
    const finalized = recommend(input);
    const recommendation = cloneRecommendation(finalized);
    const ordinaryNote = {
      category: 'kulde' as const,
      message: 'Ta en ekstra pause hvis barnet kjennes kaldt.',
    };
    recommendation.structuredNotes.push(ordinaryNote);
    recommendation.notes.push(ordinaryNote.message);

    expect(
      validateRecommendationConsistency(input, recommendation, safetyProvenance(finalized)),
    ).toEqual([]);
  });

  it('rejects an output that has not passed the canonical final safety boundary', () => {
    const finalized = recommend(input);
    const malformed = cloneRecommendation(finalized);
    const extra = malformed.layers.find((layer) => layer.category === 'ekstra');
    expect(extra).toBeDefined();
    extra!.items.push('dunteppe');
    malformed.summary = buildRecommendationSummary(input, malformed.layers);
    expect(validateRecommendationConsistency(input, malformed, safetyProvenance(finalized)).map((issue) => issue.code))
      .toContain('not-finalized');
  });
});
