/**
 * R2 — Legacy safety containment: guardrail-matrise (G1–G11).
 *
 * Rubrikk: docs/superpowers/evidence/r2-safety-containment-rubrikk.md (LÅST 2026-07-14).
 *
 * FORVENTET RED FØR IMPLEMENTERING (fanget som evidens i r2-red.txt):
 *  - G1–G7: FEILER mot dagens pipeline — beviser at kategori-overrides kan
 *    gjeninnføre kombinasjoner som conflicts/soft-blocks/hard-safety fjernet
 *    (overrides + kalibrering kjører ETTER applySafety i recommend()).
 *  - G8c, G9a, G11: FEILER med module-not-found — finalize-safety.ts finnes ikke.
 *  - G8a/G8b/G8d (kalibreringsgrenser) og G10 (snapshot): GRØNNE i RED-fasen.
 *    De er regresjonsvern + før-bilde, ikke gap-bevis. G10-snapshot tas mot
 *    dagens motor og skal være uendret etter containment.
 *
 * Ingen terskler, severity eller norsk sikkerhets-copy endres av denne pakken.
 */

import { describe, expect, it } from 'vitest';
import { recommend } from '../recommend.js';
import type { Layer, Recommendation, RecommendInput } from '../types.js';

// ─── Fixture-byggere ─────────────────────────────────────────────────────────

type FixtureOverrides = Omit<Partial<RecommendInput>, 'weather'> & {
  weather?: Partial<RecommendInput['weather']>;
};

function makeInput(partial?: FixtureOverrides): RecommendInput {
  const { weather, ...rest } = partial ?? {};
  return {
    weather: {
      tempC: -5,
      feelsLikeC: -8,
      windMs: 2,
      precipMmH: 0,
      ...weather,
    },
    child: { ageMonths: 10 },
    activity: 'vogn',
    ...rest,
  };
}

function allItems(rec: Recommendation): string[] {
  return rec.layers.flatMap((l: Layer) => l.items);
}

function itemsIn(rec: Recommendation, category: Layer['category']): string[] {
  return rec.layers.find((l) => l.category === category)?.items ?? [];
}

function hasFlag(rec: Recommendation, code: string): boolean {
  return (rec.safetyFlags ?? []).some((f) => f.code === code);
}

// Samme regexer som safety.ts/conflicts.ts håndhever (kun til assertions).
const THICK_WINTER_OUTER_RE = /(vinterdress|vinterkjøredress|tykk dunjakke)/i;
const HEAD_COVER_RE = /(^|\s)(lue|balaklava|beanie|caps|hat|solhatt)/i;
const BLANKET_RE = /(teppe|pledd|dunteppe)/i;
const WEIGHTED_RE = /(weighted|vektet|tyngdeteppe|tyngde)/i;

// ─── G1–G7: kategori-overrides kan ikke omgå endelig sikkerhetsgrense ───────

describe('R2 guardrail-matrise — overrides mot endelig sikkerhetsgrense', () => {
  it('G1: override gjeninnfører ikke vinterkjøredress ved bilstol (HB-9)', () => {
    const rec = recommend(
      makeInput({ context: { bilstol: true } }),
      { overrides: { yttertoy: ['vinterkjøredress'] } },
    );
    expect(allItems(rec).some((i) => THICK_WINTER_OUTER_RE.test(i))).toBe(false);
    expect(hasFlag(rec, 'HB-9')).toBe(true);
  });

  it('G2: override gjeninnfører ikke hodeplagg under søvn (HB-1)', () => {
    const rec = recommend(
      makeInput({ activity: 'soevn', weather: { tempC: 19, feelsLikeC: 19 } }),
      { overrides: { ekstra: ['lue'] } },
    );
    expect(allItems(rec).some((i) => HEAD_COVER_RE.test(i))).toBe(false);
    expect(hasFlag(rec, 'HB-1')).toBe(true);
  });

  it('G3: override legger ikke teppe ved sovepose under søvn (HB-2/CK-1)', () => {
    const rec = recommend(
      makeInput({ activity: 'soevn', weather: { tempC: 18, feelsLikeC: 18 } }),
      { overrides: { ekstra: ['sovepose 2.5 TOG', 'dunteppe'] } },
    );
    const items = allItems(rec);
    expect(items.some((i) => /^sovepose/i.test(i))).toBe(true);
    expect(items.some((i) => BLANKET_RE.test(i))).toBe(false);
  });

  it('G4: override gjeninnfører ikke vektede produkter (HB-4)', () => {
    const rec = recommend(
      makeInput({ activity: 'utelek', weather: { tempC: 5, feelsLikeC: 3 } }),
      { overrides: { ekstra: ['tyngdeteppe'] } },
    );
    expect(allItems(rec).some((i) => WEIGHTED_RE.test(i))).toBe(false);
    expect(hasFlag(rec, 'HB-4')).toBe(true);
  });

  it('G5: override stabler ikke dunteppe over varmepose i vogn (CK-5)', () => {
    const rec = recommend(
      makeInput({ activity: 'vogn', weather: { tempC: -3, feelsLikeC: -6 } }),
      { overrides: { ekstra: ['varmepose', 'dunteppe'] } },
    );
    const items = allItems(rec);
    expect(items.some((i) => /varmepose/i.test(i))).toBe(true);
    expect(items.some((i) => /^dunteppe/i.test(i))).toBe(false);
  });

  it('G6: override legger ikke teppe over kalesjen ved varm vogn (HB-8)', () => {
    const rec = recommend(
      makeInput({ activity: 'vogn', weather: { tempC: 24, feelsLikeC: 24 } }),
      { overrides: { utstyr: ['tynt teppe over kalesjen'] } },
    );
    expect(allItems(rec).some((i) => /teppe/i.test(i))).toBe(false);
    expect(hasFlag(rec, 'HB-8')).toBe(true);
  });

  it('G7: override reintroduserer ikke lag ved romtemp ≥ 26 °C søvn (SB-3)', () => {
    const rec = recommend(
      makeInput({ activity: 'soevn', weather: { tempC: 27, feelsLikeC: 27 } }),
      { overrides: { mellomlag: ['tynn ullbody', 'ullongs'] } },
    );
    expect(itemsIn(rec, 'mellomlag')).toEqual([]);
    expect(itemsIn(rec, 'innerst')).toContain('kortermet body');
  });
});

// ─── G8: kalibreringsgrenser (regresjonsvern — grønne også før containment) ─

describe('R2 guardrail-matrise — kalibreringsgrenser', () => {
  const coldPlay = makeInput({ activity: 'utelek', weather: { tempC: -4, feelsLikeC: -7 } });

  it('G8a: kalibrering +1 fjerner aldri plagg, legger maks ett hals-item', () => {
    const base = recommend(coldPlay);
    const warm = recommend({ ...coldPlay, childCalibration: 1 });
    const baseItems = allItems(base);
    const warmItems = allItems(warm);
    for (const item of baseItems) {
      expect(warmItems).toContain(item);
    }
    expect(warmItems.length - baseItems.length).toBeLessThanOrEqual(1);
  });

  it('G8a: kalibrering +1 legger ikke hals-item ved feels ≥ 8 °C', () => {
    const mild = makeInput({ activity: 'utelek', weather: { tempC: 12, feelsLikeC: 12 } });
    const base = recommend(mild);
    const warm = recommend({ ...mild, childCalibration: 1 });
    expect(allItems(warm)).toEqual(allItems(base));
  });

  it('G8b: kalibrering −1 rører aldri innerst eller yttertøy', () => {
    const base = recommend(coldPlay);
    const cool = recommend({ ...coldPlay, childCalibration: -1 });
    expect(itemsIn(cool, 'innerst')).toEqual(itemsIn(base, 'innerst'));
    expect(itemsIn(cool, 'yttertoy')).toEqual(itemsIn(base, 'yttertoy'));
  });

  it('G8d: kalibrering ±1 i regnvær bevarer regnbeskyttelse', () => {
    const rainy = makeInput({
      activity: 'vogn',
      weather: { tempC: 8, feelsLikeC: 6, precipMmH: 2.5, symbolCode: 'rain' },
    });
    const base = recommend(rainy);
    const rainItems = allItems(base).filter((i) => /regn/i.test(i));
    expect(rainItems.length).toBeGreaterThan(0);
    for (const bias of [-1, 1] as const) {
      const calibrated = recommend({ ...rainy, childCalibration: bias });
      for (const item of rainItems) {
        expect(allItems(calibrated)).toContain(item);
      }
    }
  });
});

// ─── G8c/G9a/G11: grensemodulen (module-not-found = forventet RED) ──────────

const FINALIZE_MODULE = '../finalize-safety.js';

describe('R2 guardrail-matrise — endelig grense (finalize-safety)', () => {
  it('G8c: kalibrert output passerer grensen uendret (finalize er no-op)', async () => {
    const { finalizeSafety } = await import(FINALIZE_MODULE);
    const inputs: RecommendInput[] = [
      makeInput({ activity: 'utelek', weather: { tempC: -4, feelsLikeC: -7 }, childCalibration: 1 }),
      makeInput({ activity: 'utelek', weather: { tempC: -4, feelsLikeC: -7 }, childCalibration: -1 }),
      makeInput({ activity: 'vogn', weather: { tempC: 2, feelsLikeC: -1 }, childCalibration: 1 }),
    ];
    for (const input of inputs) {
      const rec = recommend(input);
      const finalized = finalizeSafety(input, rec.layers, rec.structuredNotes, rec.safetyFlags ?? []);
      expect(finalized.layers).toEqual(rec.layers);
    }
  });

  it('G9a: session-swap som introduserer HB/CK-brudd fjernes i finalisert output', async () => {
    const { applySwapsFinalized } = await import(FINALIZE_MODULE);
    const input = makeInput({ activity: 'soevn', weather: { tempC: 18, feelsLikeC: 18 } });
    const rec = recommend(input);
    // Fiendtlig swap: et IKKE-sovepose-item → dunteppe, mens soveposen består.
    // Da oppstår kombinasjonen sovepose + teppe som CK-1/HB-2 fjerner.
    // (Fixture korrigert i RED-fasen: et ensomt teppe under søvn rammes ikke
    // av noen eksisterende regel, og grensen innfører ikke nye regler.)
    const sovepose = allItems(rec).find((i) => /^sovepose/i.test(i));
    const target = allItems(rec).find((i) => !/^sovepose/i.test(i));
    expect(sovepose).toBeDefined();
    expect(target).toBeDefined();
    const swapped = applySwapsFinalized(input, rec, { [target as string]: 'dunteppe' });
    expect(allItems(swapped).some((i) => /^sovepose/i.test(i))).toBe(true);
    expect(allItems(swapped).some((i) => BLANKET_RE.test(i))).toBe(false);
  });

  it('G9a: ufarlig swap bevares i finalisert output', async () => {
    const { applySwapsFinalized } = await import(FINALIZE_MODULE);
    const input = makeInput({ activity: 'utelek', weather: { tempC: 4, feelsLikeC: 2 } });
    const rec = recommend(input);
    const wool = allItems(rec).find((i) => /ull/i.test(i));
    expect(wool).toBeDefined();
    const swapped = applySwapsFinalized(input, rec, { [wool as string]: 'fleecesett' });
    expect(allItems(swapped)).toContain('fleecesett');
  });

  it('G11: grensen er idempotent på mutert output (finalize ∘ finalize = finalize)', async () => {
    const { finalizeSafety } = await import(FINALIZE_MODULE);
    const cases: Array<{ input: RecommendInput; overrides: Record<string, string[]> }> = [
      { input: makeInput({ context: { bilstol: true } }), overrides: { yttertoy: ['vinterkjøredress'] } },
      { input: makeInput({ activity: 'soevn', weather: { tempC: 18, feelsLikeC: 18 } }), overrides: { ekstra: ['sovepose 2.5 TOG', 'dunteppe'] } },
      // SB-5-vinduet: 8 mnd + 23 °C — vakten skal hindre at re-kjøring
      // fjerner ETT mellomlag-item til per finalize-pass.
      { input: { ...makeInput({ activity: 'utelek', weather: { tempC: 23, feelsLikeC: 23 } }), child: { ageMonths: 8 } }, overrides: { mellomlag: ['tynn ullbody', 'bomullsbody'] } },
    ];
    for (const { input, overrides } of cases) {
      const rec = recommend(input, { overrides });
      const once = finalizeSafety(input, rec.layers, rec.structuredNotes, rec.safetyFlags ?? []);
      const twice = finalizeSafety(input, once.layers, once.notes, once.flags);
      expect(twice.layers).toEqual(once.layers);
    }
  });
});

// ─── G10: semantisk ekvivalens uten mutasjoner (før-bilde tatt i RED-fasen) ─

describe('R2 guardrail-matrise — G10 uendret adferd uten mutasjoner', () => {
  const fixtures: Array<[string, RecommendInput]> = [
    ['vogn frost', makeInput({ weather: { tempC: -12, feelsLikeC: -16 } })],
    ['vogn kald', makeInput({ weather: { tempC: -3, feelsLikeC: -6 } })],
    ['vogn mild regn', makeInput({ weather: { tempC: 10, feelsLikeC: 8, precipMmH: 1.8, symbolCode: 'rain' } })],
    ['vogn varm', makeInput({ weather: { tempC: 23, feelsLikeC: 24 } })],
    ['vogn sover kjølig', makeInput({ vognMode: 'sleeping', weather: { tempC: 6, feelsLikeC: 4 } })],
    ['utelek streng frost', makeInput({ activity: 'utelek', weather: { tempC: -17, feelsLikeC: -21 } })],
    ['utelek mild', makeInput({ activity: 'utelek', weather: { tempC: 14, feelsLikeC: 13 } })],
    ['utelek peak-overheating 8mnd varm', { ...makeInput({ activity: 'utelek', weather: { tempC: 23, feelsLikeC: 23 } }), child: { ageMonths: 8 } }],
    ['baeresele kald innerJakke', makeInput({ activity: 'baeresele', innerJakke: true, weather: { tempC: -2, feelsLikeC: -5 } })],
    ['soevn kjølig rom', makeInput({ activity: 'soevn', weather: { tempC: 17, feelsLikeC: 17 } })],
    ['soevn normalt rom', makeInput({ activity: 'soevn', weather: { tempC: 20, feelsLikeC: 20 } })],
    ['soevn varmt rom', makeInput({ activity: 'soevn', weather: { tempC: 25, feelsLikeC: 25 } })],
  ];

  it.each(fixtures)('G10: %s — uendret uten overrides/kalibrering/swaps', (_label, input) => {
    const rec = recommend(input);
    expect({
      layers: rec.layers,
      summary: rec.summary,
      severity: rec.severity,
      flagCodes: (rec.safetyFlags ?? []).map((f) => f.code).sort(),
    }).toMatchSnapshot();
  });
});
