import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CANONICAL_ENGINE_VERSION,
  recommendCanonical,
} from './canonical-engine.js';
import type { RecommendInput, TempBand } from '../wool-layers/types.js';

const WEATHER = { tempC: 12, feelsLikeC: 12, windMs: 2, precipMmH: 0 };

function fixture(
  feelsLikeC: number,
  overrides: Partial<RecommendInput> = {},
): RecommendInput {
  return {
    weather: { ...WEATHER, tempC: feelsLikeC, feelsLikeC },
    child: { ageMonths: 10 },
    activity: 'vogn',
    ...overrides,
  };
}

const TEMPERATURE_BOUNDARIES: ReadonlyArray<Readonly<{
  name: string;
  feelsLikeC: number;
  expectedBand: TempBand;
}>> = [
  { name: 'ekstrem varme starter', feelsLikeC: 28, expectedBand: 'ekstrem_varme' },
  { name: 'rett under ekstrem varme', feelsLikeC: 27.999, expectedBand: 'tropisk' },
  { name: 'tropisk starter', feelsLikeC: 22, expectedBand: 'tropisk' },
  { name: 'rett under tropisk', feelsLikeC: 21.999, expectedBand: 'varm' },
  { name: 'varm starter', feelsLikeC: 16, expectedBand: 'varm' },
  { name: 'rett under varm', feelsLikeC: 15.999, expectedBand: 'mild' },
  { name: 'mild starter', feelsLikeC: 10, expectedBand: 'mild' },
  { name: 'rett under mild', feelsLikeC: 9.999, expectedBand: 'kjolig' },
  { name: 'kjølig starter', feelsLikeC: 5, expectedBand: 'kjolig' },
  { name: 'rett under kjølig', feelsLikeC: 4.999, expectedBand: 'kald' },
  { name: 'kald starter', feelsLikeC: 0, expectedBand: 'kald' },
  { name: 'rett under kald', feelsLikeC: -0.001, expectedBand: 'frost' },
  { name: 'frost starter', feelsLikeC: -7, expectedBand: 'frost' },
  { name: 'rett under frost', feelsLikeC: -7.001, expectedBand: 'streng_frost' },
  { name: 'streng frost starter', feelsLikeC: -15, expectedBand: 'streng_frost' },
  { name: 'rett under streng frost', feelsLikeC: -15.001, expectedBand: 'ekstrem' },
];

const ACTIVITY_BOUNDARIES: ReadonlyArray<Readonly<{
  name: string;
  input: RecommendInput;
}>> = [
  { name: 'vogn våken', input: fixture(3, { activity: 'vogn', vognMode: 'awake' }) },
  { name: 'vogn sovende', input: fixture(3, { activity: 'vogn', vognMode: 'sleeping' }) },
  { name: 'bæresele utenpå jakke', input: fixture(3, { activity: 'baeresele', innerJakke: false }) },
  { name: 'bæresele under jakke', input: fixture(3, { activity: 'baeresele', innerJakke: true }) },
  { name: 'utelek', input: fixture(3, { activity: 'utelek' }) },
  { name: 'innesøvn', input: fixture(18, { activity: 'soevn' }) },
  { name: 'vogn med bilstol', input: fixture(-5, { activity: 'vogn', context: { bilstol: true } }) },
];

describe('kanonisk motor — navngitte temperaturgrenser', () => {
  it.each(TEMPERATURE_BOUNDARIES)('$name = $expectedBand', ({ feelsLikeC, expectedBand }) => {
    const input = fixture(feelsLikeC);
    const before = JSON.stringify(input);
    const first = recommendCanonical(input);
    const bytes = JSON.stringify(first);

    expect(CANONICAL_ENGINE_VERSION).toBe('wool-layers-v1-contained');
    expect(first.tempBand).toBe(expectedBand);
    expect(JSON.stringify(input)).toBe(before);
    for (let run = 0; run < 25; run += 1) {
      expect(JSON.stringify(recommendCanonical(input))).toBe(bytes);
    }
  });
});

describe('kanonisk motor — aktivitetsgrenser', () => {
  it.each(ACTIVITY_BOUNDARIES)('$name er byte-identisk over gjentatte kjøringer', ({ input }) => {
    const first = recommendCanonical(input);
    const bytes = JSON.stringify(first);
    expect(first.activity).toBe(input.activity);
    expect(first.layers.length).toBeGreaterThan(0);
    for (let run = 0; run < 25; run += 1) {
      expect(JSON.stringify(recommendCanonical(input))).toBe(bytes);
    }
  });

  it('ulike aktivitetskontekster gir ulike kanoniske bytes', () => {
    const bytes = ACTIVITY_BOUNDARIES.map(({ input }) => JSON.stringify(recommendCanonical(input)));
    expect(new Set(bytes).size).toBe(bytes.length);
  });
});

describe('UI bruker én kanonisk motorinngang', () => {
  it.each(['HjemScreen.tsx', 'FinnAntrekkScreen.tsx', 'UkeScreen.tsx'])(
    '%s importerer fasaden og ikke motorimplementasjonen direkte',
    (filename) => {
      const source = readFileSync(resolve(process.cwd(), 'src/screens', filename), 'utf8');
      expect(source).toContain("../lib/clothing-engine-v2/canonical-engine");
      expect(source).not.toContain("../lib/wool-layers/recommend");
    },
  );
});
