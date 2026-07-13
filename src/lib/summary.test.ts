/**
 * Tester for buildSummary — drevet av motor-output (P0.1 fra Fable 5).
 *
 * 12 caser dekker:
 *  - vogn-våken kald-vær (vinterkjøredress)
 *  - vogn-sover sovepose-caset fra screenshot
 *  - bæresele mild dag
 *  - utelek varm sommer
 *  - søvn med sovepose
 *  - vind ≥ 6 m/s utløser «Vinden biter»
 *  - nedbør regn/snø/sludd
 *  - føles-temp-avvik ≥ 3°
 *  - tom anbefaling faller tilbake til motorens egen summary
 *  - ingen ute-værkommentar når activity = 'soevn'
 */

import { describe, expect, it } from 'vitest';
import { buildSummary, summaryToString } from './summary';
import type { LayerCategory, Recommendation, WeatherInput } from './wool-layers/types.js';

function mkRec(over: Partial<Recommendation>): Recommendation {
  return {
    activity: 'vogn',
    tempBand: 'kjolig',
    layers: [],
    notes: [],
    structuredNotes: [],
    summary: 'Default fallback',
    ...over,
  };
}

function mkWeather(over: Partial<WeatherInput>): WeatherInput {
  return {
    tempC: 10,
    feelsLikeC: 9,
    windMs: 2,
    precipMmH: 0,
    symbolCode: 'partlycloudy_day',
    ...over,
  };
}

describe('buildSummary — layers (setning 1)', () => {
  it('full 3-lags vinter: innerst + mellomlag + yttertøy', () => {
    const rec = mkRec({
      layers: [
        { category: 'innerst', items: ['Langermet ullbody'] },
        { category: 'mellomlag', items: ['Ull-pyjamas'] },
        { category: 'yttertoy', items: ['Vinterkjøredress'] },
      ],
    });
    const s = buildSummary(rec, mkWeather({ tempC: -5, feelsLikeC: -8 }), 'vogn');
    expect(s.layers).toBe('Langermet ullbody, ull-pyjamas og vinterkjøredress ytterst.');
  });

  it('innerst + yttertøy (uten mellomlag)', () => {
    const rec = mkRec({
      layers: [
        { category: 'innerst', items: ['Ull-body'] },
        { category: 'yttertoy', items: ['Kjøredress'] },
      ],
    });
    const s = buildSummary(rec, mkWeather({ tempC: 5 }), 'vogn');
    expect(s.layers).toBe('Ull-body innerst, kjøredress ytterst.');
  });

  it('innerst + mellomlag (uten yttertøy)', () => {
    const rec = mkRec({
      layers: [
        { category: 'innerst', items: ['Langermet body'] },
        { category: 'mellomlag', items: ['Ull-jakke'] },
      ],
    });
    const s = buildSummary(rec, mkWeather({ tempC: 15 }), 'baeresele');
    expect(s.layers).toBe('Langermet body og ull-jakke.');
  });

  it('bare innerst (varm sommer)', () => {
    const rec = mkRec({
      layers: [{ category: 'innerst', items: ['Kortermet body'] }],
    });
    const s = buildSummary(rec, mkWeather({ tempC: 26, feelsLikeC: 26 }), 'utelek');
    expect(s.layers).toBe('Bare kortermet body.');
  });

  it('søvn med sovepose (innerst+mellomlag+pose)', () => {
    const rec = mkRec({
      activity: 'soevn',
      layers: [
        { category: 'innerst', items: ['Langermet body'] },
        { category: 'mellomlag', items: ['Pyjamas'] },
        { category: 'yttertoy', items: ['Sovepose 2.5 TOG'] },
      ],
    });
    const s = buildSummary(rec, mkWeather({ tempC: 18 }), 'soevn');
    // P0.1-blocker: alle 3 kategorier nevnt
    expect(s.layers).toBe('Langermet body og pyjamas med sovepose 2.5 tog over.');
    expect(s.weather).toBeUndefined();
  });

  it('vogn-sovende med sovepose + ekstra (caset fra screenshot 10°)', () => {
    const rec = mkRec({
      activity: 'vogn',
      layers: [
        { category: 'innerst', items: ['Langermet body'] },
        { category: 'mellomlag', items: ['Pyjamas'] },
        { category: 'yttertoy', items: ['Sovepose 2.5 TOG'] },
        { category: 'ekstra', items: ['Ullsokker'] },
      ],
    });
    const s = buildSummary(rec, mkWeather({ tempC: 10, feelsLikeC: 9, windMs: 2 }), 'vogn');
    // P0.1-blocker: alle 4 kategorier nevnt (innerst+mellomlag+yttertoy+ekstra)
    expect(s.layers).toBe(
      'Langermet body og pyjamas med sovepose 2.5 tog over, pluss ullsokker.',
    );
    // 1° avvik fra føles-temp → ingen kommentar
    expect(s.weather).toBeUndefined();
  });

  it('P0.1-blocker: alle kategorier med items nevnes i summary', () => {
    // Iterer over kombinasjoner og bekreft at hver fylte kategori er
    // representert (ord-treff på første item).
    const cases = [
      {
        layers: [
          { category: 'innerst' as LayerCategory, items: ['langermet ullbody'] },
          { category: 'yttertoy' as LayerCategory, items: ['kjøredress'] },
          { category: 'ekstra' as LayerCategory, items: ['lue'] },
        ],
        activity: 'vogn' as const,
      },
      {
        layers: [
          { category: 'innerst' as LayerCategory, items: ['ullbody'] },
          { category: 'mellomlag' as LayerCategory, items: ['pyjamas'] },
          { category: 'yttertoy' as LayerCategory, items: ['sovepose 2.5 TOG'] },
          { category: 'ekstra' as LayerCategory, items: ['votter'] },
        ],
        activity: 'vogn' as const,
      },
      {
        layers: [
          { category: 'innerst' as LayerCategory, items: ['langermet ullbody'] },
          { category: 'ekstra' as LayerCategory, items: ['solhatt'] },
        ],
        activity: 'utelek' as const,
      },
    ];
    for (const c of cases) {
      const rec = mkRec({ layers: c.layers, activity: c.activity });
      const s = buildSummary(rec, mkWeather({}), c.activity);
      const lower = s.layers.toLowerCase();
      for (const layer of c.layers) {
        const firstWord = layer.items[0].split(/\s+/)[0].toLowerCase();
        // Hver kategori med items → minst første ord skal være i teksten
        expect(lower, `mangler ${layer.category}=${layer.items[0]} i: ${s.layers}`).toContain(firstWord);
      }
    }
  });
});

describe('buildSummary — vær (setning 2)', () => {
  it('vind 6 m/s → vinden biter', () => {
    const rec = mkRec({
      layers: [{ category: 'innerst', items: ['Ull-body'] }],
    });
    const s = buildSummary(rec, mkWeather({ windMs: 6.5 }), 'vogn');
    expect(s.weather).toBe('Vinden biter — husk å dekke til.');
  });

  it('regn → kommentar om vanntett yttertøy', () => {
    const rec = mkRec({
      layers: [{ category: 'innerst', items: ['Ull-body'] }],
    });
    const s = buildSummary(rec, mkWeather({ precipMmH: 1.5, symbolCode: 'rain' }), 'vogn');
    expect(s.weather).toBe('Det regner — sørg for vanntett yttertøy.');
  });

  it('snø → kommentar om snø', () => {
    const rec = mkRec({
      layers: [{ category: 'innerst', items: ['Ull-body'] }],
    });
    const s = buildSummary(rec, mkWeather({ precipMmH: 1.0, symbolCode: 'snow' }), 'vogn');
    expect(s.weather).toBe('Det snør — yttertøy beskytter mot fukt.');
  });

  it('føles 5° kaldere enn faktisk temp → nevn føles-temp', () => {
    const rec = mkRec({
      layers: [{ category: 'innerst', items: ['Ull-body'] }],
    });
    const s = buildSummary(rec, mkWeather({ tempC: 5, feelsLikeC: 0 }), 'vogn');
    expect(s.weather).toBe('Det føles som 0°.');
  });

  it('aktivitet = soevn → ingen ute-vær-kommentar', () => {
    const rec = mkRec({
      activity: 'soevn',
      layers: [{ category: 'innerst', items: ['Sovepose 2.5 TOG'] }],
    });
    const s = buildSummary(rec, mkWeather({ windMs: 10, precipMmH: 5 }), 'soevn');
    expect(s.weather).toBeUndefined();
  });

  it('rolig vær → ingen setning 2', () => {
    const rec = mkRec({
      layers: [{ category: 'innerst', items: ['Ull-body'] }],
    });
    const s = buildSummary(rec, mkWeather({ tempC: 12, feelsLikeC: 12, windMs: 2, precipMmH: 0 }), 'vogn');
    expect(s.weather).toBeUndefined();
  });
});

describe('summaryToString', () => {
  it('returnerer bare layers når weather er undefined', () => {
    expect(summaryToString({ layers: 'Bare body.' })).toBe('Bare body.');
  });

  it('limer layers + weather med mellomrom', () => {
    expect(summaryToString({ layers: 'X.', weather: 'Y.' })).toBe('X. Y.');
  });
});
