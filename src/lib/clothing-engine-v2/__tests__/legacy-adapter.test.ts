/**
 * Motor 2.0 Task 11 — legacy-adapter.
 * Adapteren MAPPER kun (roller → kategorier, legacyNameNb) — den beregner
 * aldri varme, materialer eller undertrykker flagg. Snapshot-tester dekker
 * varm/mild/regn/frost/vogn-utstyr/bilstol/ullfri. FORVENTET RED.
 */
import { describe, expect, it } from 'vitest';
import { toLegacyRecommendation } from '../legacy-adapter.js';
import { recommendV2 } from '../recommend.js';
import type { RecommendInputV2 } from '../types.js';

function input(ageMonths: number, situation: RecommendInputV2['situation'], weather: Partial<RecommendInputV2['weather']>, rest?: Partial<RecommendInputV2>): RecommendInputV2 {
  return {
    weather: { tempC: weather.feelsLikeC ?? 5, feelsLikeC: 5, windMs: 2, precipMmH: 0, ...weather },
    ageMonths, situation, ...rest,
  };
}

const CASES: Array<[string, RecommendInputV2]> = [
  ['varm dag', input(18, 'active_play', { feelsLikeC: 24, symbolCode: 'clearsky_day' })],
  ['mild dag', input(18, 'active_play', { feelsLikeC: 12 })],
  ['regn i vogn', input(10, 'stroller_awake', { feelsLikeC: 8, precipMmH: 1.5 })],
  ['frost i vogn', input(7, 'stroller_awake', { feelsLikeC: -7 })],
  ['bilstol', input(12, 'stroller_awake', { feelsLikeC: 1 }, { carSeat: true })],
  ['ullfritt', input(18, 'stroller_awake', { feelsLikeC: -4 }, { materialPreference: 'avoid_wool' })],
];

describe('Motor 2.0 legacy-adapter', () => {
  for (const [label, inp] of CASES) {
    it(`snapshot: ${label}`, () => {
      const legacy = toLegacyRecommendation(recommendV2(inp), { feelsLikeC: inp.weather.feelsLikeC });
      expect({
        activity: legacy.activity,
        tempBand: legacy.tempBand,
        layers: legacy.layers,
        severity: legacy.severity,
        flagCodes: (legacy.safetyFlags ?? []).map((f) => f.code).sort(),
      }).toMatchSnapshot();
    });
  }

  it('mapper utstyr separat fra plagg', () => {
    const legacy = toLegacyRecommendation(recommendV2(input(10, 'stroller_awake', { feelsLikeC: 8, precipMmH: 1.5 })));
    expect(legacy.layers.find((l) => l.category === 'utstyr')?.items).toContain('regntrekk på vognen');
    // Utstyr finnes ALDRI i kles-kategoriene.
    for (const cat of ['innerst', 'mellomlag', 'yttertoy', 'ekstra'] as const) {
      expect(legacy.layers.find((l) => l.category === cat)?.items ?? []).not.toContain('regntrekk på vognen');
    }
  });

  it('kategori-mapping: base→innerst, mid→mellomlag, skall/isolert→yttertoy, sokker→innerst, hode/hender/ytterfottøy→ekstra', () => {
    const legacy = toLegacyRecommendation(recommendV2(input(16, 'active_play', { feelsLikeC: 0 })));
    const cat = (c: string) => legacy.layers.find((l) => l.category === c)?.items ?? [];
    expect(cat('innerst').some((i) => /ullsett|undertøysett|body/.test(i))).toBe(true);
    expect(cat('innerst').some((i) => /sokker|strømper/.test(i))).toBe(true);
    expect(cat('mellomlag').length).toBeGreaterThan(0);
    expect(cat('ekstra').some((i) => /lue|balaklava/.test(i))).toBe(true);
    expect(cat('ekstra').some((i) => /vintersko/.test(i))).toBe(true);
  });

  it('bevarer alle safety-flagg og severity uendret', () => {
    const v2 = recommendV2(input(12, 'stroller_awake', { feelsLikeC: 1 }, { carSeat: true }));
    const legacy = toLegacyRecommendation(v2);
    expect(legacy.safetyFlags).toEqual(v2.safetyFlags);
    expect(legacy.severity).toBe(v2.severity);
    expect(legacy.notes).toEqual(v2.safetyFlags.map((f) => f.message));
  });

  it('summary inneholder aktivitetslabel og temperatur når gitt', () => {
    const legacy = toLegacyRecommendation(
      recommendV2(input(18, 'stroller_awake', { feelsLikeC: -4 })),
      { feelsLikeC: -4 },
    );
    expect(legacy.summary).toMatch(/^Vogn \(−?-?4 °C føles\): /);
  });

  it('situasjon→aktivitet: alle utendørs-situasjoner mapper til gyldig legacy-aktivitet', () => {
    expect(toLegacyRecommendation(recommendV2(input(18, 'carrier', { feelsLikeC: 5 }))).activity).toBe('baeresele');
    expect(toLegacyRecommendation(recommendV2(input(18, 'mixed_day', { feelsLikeC: 5 }))).activity).toBe('utelek');
    expect(toLegacyRecommendation(recommendV2(input(8, 'awake_low_mobility', { feelsLikeC: 5 }))).activity).toBe('utelek');
  });
});
