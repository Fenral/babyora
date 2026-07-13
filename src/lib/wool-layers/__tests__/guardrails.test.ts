/**
 * P3.2 — Sanity-guardrails fra Fable 5 review (2026-06-12).
 *
 * Invariants som SKAL FEILE bygget om brutt. Hvis en invariant faktisk
 * feiler i dag: marker som .todo med referanse til review/ANOMALIES.md
 * (ikke juster terskler selv — det er menneskebeslutning).
 */

import { describe, expect, it } from 'vitest';
import { recommend } from '../recommend.js';
import type { RecommendInput } from '../types.js';

function input(over: Partial<RecommendInput>): RecommendInput {
  return {
    weather: { feelsLikeC: 10, tempC: 10, windMs: 0, precipMmH: 0 },
    child: { ageMonths: 14 },
    activity: 'vogn',
    ...over,
  };
}

function flatItems(rec: ReturnType<typeof recommend>): string[] {
  return rec.layers.flatMap((l) => l.items.map((i) => i.toLowerCase()));
}

const THICK_WINTER_OUTER_RE = /vinterkjøredress|isolert vinterdress|vinterdress$/i;

describe('Guardrails (P3.2) — tøymotor-invariants', () => {
  it('ingen vinter-yttertøy når føles-temp > +4°', () => {
    const rec = recommend(input({ weather: { feelsLikeC: 6, tempC: 8, windMs: 1, precipMmH: 0 } }));
    expect(flatItems(rec).some((i) => THICK_WINTER_OUTER_RE.test(i))).toBe(false);
  });

  // B-17 (A-1 fix 2026-06-12): vinterkjøredress/vinterdress kun ved føles ≤ 0°
  it('ingen vinter-yttertøy ved føles +1° til +4° (kald-bånd)', () => {
    for (const feels of [1, 2, 3, 4]) {
      const rec = recommend(input({ weather: { feelsLikeC: feels, tempC: feels, windMs: 1, precipMmH: 0 } }));
      expect(
        flatItems(rec).some((i) => THICK_WINTER_OUTER_RE.test(i)),
        `vinter-yttertøy funnet ved føles ${feels}°: ${flatItems(rec).join(', ')}`,
      ).toBe(false);
    }
  });

  // B-17 (A-1 exact replikering): 14 mnd, +5° lufttemp, føles +3°, vind 6 m/s, yr 0.5 mm/h
  it('A-1 anomali: vogn-våken +3° føles + frisk vind + yr → ingen vinterkjøredress', () => {
    const rec = recommend(input({
      activity: 'vogn',
      vognMode: 'awake',
      weather: { feelsLikeC: 3, tempC: 5, windMs: 6, precipMmH: 0.5 },
      child: { ageMonths: 14 },
    }));
    expect(
      flatItems(rec).some((i) => /vinterkjøredress/.test(i)),
      `vinterkjøredress funnet i A-1-input: ${flatItems(rec).join(', ')}`,
    ).toBe(false);
  });

  it('ingen lue + votter samtidig når føles-temp > +15°', () => {
    const rec = recommend(input({ weather: { feelsLikeC: 18, tempC: 20, windMs: 0, precipMmH: 0 } }));
    const items = flatItems(rec);
    const hasHat = items.some((i) => /\blue\b|balaclava|beanie|solhatt/.test(i));
    const hasMittens = items.some((i) => /votter|vindvotter/.test(i));
    expect(hasHat && hasMittens).toBe(false);
  });

  it('aldri tom innerst-kategori under +10°', () => {
    const rec = recommend(input({ weather: { feelsLikeC: 5, tempC: 5, windMs: 0, precipMmH: 0 } }));
    const innerst = rec.layers.find((l) => l.category === 'innerst');
    expect(innerst).toBeDefined();
    expect(innerst!.items.length).toBeGreaterThanOrEqual(1);
  });

  it('søvn-anbefalinger inneholder aldri snorer/skjerf-kategori', () => {
    const rec = recommend(input({
      activity: 'soevn',
      weather: { feelsLikeC: 19, tempC: 19, windMs: 0, precipMmH: 0 },
    }));
    const items = flatItems(rec);
    // «skjerf» kategori (snorer/halstørkle/hals) → ikke under søvn
    expect(items.some((i) => /skjerf|snor/.test(i))).toBe(false);
  });

  it('bilstol-anbefalinger inneholder aldri vatterte dresser (HB-9)', () => {
    const rec = recommend(input({
      activity: 'vogn',
      vognMode: 'awake',
      context: { bilstol: true },
      weather: { feelsLikeC: -5, tempC: -3, windMs: 2, precipMmH: 0 },
    }));
    expect(flatItems(rec).some((i) => THICK_WINTER_OUTER_RE.test(i))).toBe(false);
  });

  // B-2 (2026-06-12): utstyrs-kategori (regntrekk på vognen)
  it('B-2: vogn + nedbør → "regntrekk på vognen" i utstyrs-kategori', () => {
    const rec = recommend(input({
      activity: 'vogn',
      weather: { feelsLikeC: 8, tempC: 10, windMs: 2, precipMmH: 1.0 },
    }));
    const utstyr = rec.layers.find((l) => l.category === 'utstyr');
    expect(utstyr, 'utstyrs-kategori mangler ved precip 1.0 mm/h').toBeDefined();
    expect(utstyr!.items, 'forventet regntrekk i utstyr').toContain('regntrekk på vognen');
  });

  it('B-2: tørr vær + mild → ingen utstyrs-kategori', () => {
    const rec = recommend(input({
      activity: 'vogn',
      weather: { feelsLikeC: 8, tempC: 10, windMs: 2, precipMmH: 0 },
    }));
    const utstyr = rec.layers.find((l) => l.category === 'utstyr');
    expect(utstyr?.items.length ?? 0).toBe(0);
  });

  // B-2 utvidet: vognpose ved vogn + kjølig (feels < 5°)
  it('B-2: vogn + kjølig (føles +3°) → "vognpose" i utstyr', () => {
    const rec = recommend(input({
      activity: 'vogn',
      weather: { feelsLikeC: 3, tempC: 5, windMs: 2, precipMmH: 0 },
    }));
    const utstyr = rec.layers.find((l) => l.category === 'utstyr');
    expect(utstyr?.items).toContain('vognpose');
  });

  // B-2 utvidet: kjørepose ved vogn + bilstol-kontekst
  it('B-2: vogn + bilstol → "kjørepose" i utstyr', () => {
    const rec = recommend(input({
      activity: 'vogn',
      context: { bilstol: true },
      weather: { feelsLikeC: -5, tempC: -3, windMs: 2, precipMmH: 0 },
    }));
    const utstyr = rec.layers.find((l) => l.category === 'utstyr');
    expect(utstyr?.items).toContain('kjørepose');
  });

  // B-1 (2026-06-12): motor-overrides for «bytt plagg»
  it('B-1: overrides erstatter items i kategorien', () => {
    const rec = recommend(
      input({ weather: { feelsLikeC: 8, tempC: 10, windMs: 1, precipMmH: 0 } }),
      { overrides: { yttertoy: ['custom yttertøy'] } },
    );
    const ytter = rec.layers.find((l) => l.category === 'yttertoy');
    expect(ytter?.items).toEqual(['custom yttertøy']);
  });

  it('B-1: tom override-array fjerner kategorien', () => {
    const rec = recommend(
      input({ weather: { feelsLikeC: 8, tempC: 10, windMs: 1, precipMmH: 0 } }),
      { overrides: { ekstra: [] } },
    );
    const ekstra = rec.layers.find((l) => l.category === 'ekstra');
    expect(ekstra).toBeUndefined();
  });

  it('B-1: overrides påvirker ikke andre kategorier', () => {
    const noOverride = recommend(input({ weather: { feelsLikeC: 8, tempC: 10, windMs: 1, precipMmH: 0 } }));
    const withOverride = recommend(
      input({ weather: { feelsLikeC: 8, tempC: 10, windMs: 1, precipMmH: 0 } }),
      { overrides: { yttertoy: ['custom'] } },
    );
    expect(withOverride.layers.find((l) => l.category === 'innerst')?.items)
      .toEqual(noOverride.layers.find((l) => l.category === 'innerst')?.items);
  });

  // P9.5 (2026-06-13): childCalibration
  it('P9.5: calibration +1 legger til hals ved kjølig', () => {
    const recCalib = recommend(input({
      weather: { feelsLikeC: 4, tempC: 5, windMs: 1, precipMmH: 0 },
      childCalibration: 1,
    }));
    const ekstra = recCalib.layers.find((l) => l.category === 'ekstra');
    expect(ekstra?.items.some((i) => /hals/i.test(i))).toBe(true);
  });

  it('P9.5: calibration -1 fjerner ett mellomlag-item når mulig', () => {
    const recBase = recommend(input({
      weather: { feelsLikeC: 2, tempC: 4, windMs: 1, precipMmH: 0 },
    }));
    const recCalibrated = recommend(input({
      weather: { feelsLikeC: 2, tempC: 4, windMs: 1, precipMmH: 0 },
      childCalibration: -1,
    }));
    const baseMellom = recBase.layers.find((l) => l.category === 'mellomlag')?.items.length ?? 0;
    const calibMellom = recCalibrated.layers.find((l) => l.category === 'mellomlag')?.items.length ?? 0;
    if (baseMellom > 1) {
      expect(calibMellom).toBe(baseMellom - 1);
    } else {
      expect(calibMellom).toBe(baseMellom);
    }
  });

  it('P9.5: calibration ALDRI fjerner innerst eller yttertoy', () => {
    const rec = recommend(input({
      weather: { feelsLikeC: -5, tempC: -3, windMs: 1, precipMmH: 0 },
      childCalibration: -1,
    }));
    expect(rec.layers.find((l) => l.category === 'innerst')?.items.length).toBeGreaterThanOrEqual(1);
    expect(rec.layers.find((l) => l.category === 'yttertoy')?.items.length).toBeGreaterThanOrEqual(1);
  });

  it('alle anbefalinger har ≥1 plagg i innerst-kategorien', () => {
    // Kjør over flere temp-band for å fange evt. corner-case
    const temps = [-15, -5, 5, 15, 25];
    for (const t of temps) {
      const rec = recommend(input({ weather: { feelsLikeC: t, tempC: t, windMs: 0, precipMmH: 0 } }));
      const innerst = rec.layers.find((l) => l.category === 'innerst');
      expect(innerst, `feilet for ${t}°`).toBeDefined();
      expect(innerst!.items.length, `tom innerst for ${t}°`).toBeGreaterThanOrEqual(1);
    }
  });
});
