import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { recommend } from '../wool-layers/recommend.js';
import type { RecommendInput } from '../wool-layers/types.js';
import { computeScanResultKey, projectResultKeyGarments } from './result-key.js';

const screenPath = 'src/screens/HjemScreen.tsx';

// Normaliser linjeskift så kilde-asserts med \n også holder på
// CRLF-checkouts (Windows) — samme teknikk som
// PaakledningScreen.outfit-truth.test.tsx.
function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8').replace(/\r\n/g, '\n');
}

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

describe('HjemScreen fingerprint <-> computeScanResultKey equivalence', () => {
  it('HjemScreen still constructs the "current-finalized" fingerprint with the exact same prefix, field set and order this module reuses', () => {
    // This is a guard-rail, not a duplication of the runtime logic: if a
    // future change to HjemScreen ever alters the fingerprint construction
    // (line ~468 as of this package) without updating this scan module in
    // lockstep, this assertion fails loudly instead of the two silently
    // drifting apart.
    const screen = source(screenPath);
    expect(screen).toContain('const fingerprint = `current-finalized:${JSON.stringify([');
    expect(screen).toContain('orderedGarments,');
    expect(screen).toContain('equipment,');
    expect(screen).toContain('now.tempC,');
    expect(screen).toContain('now.feelsLikeC,');
    expect(screen).toContain('now.windMs,');
    expect(screen).toContain('now.precipMmH,');
    expect(screen).toContain('now.symbolCode,');

    // Field order matters for the fingerprint string — assert the exact
    // sequence appears in source order (not just "somewhere in the file").
    const orderedGarmentsIndex = screen.indexOf('orderedGarments,', screen.indexOf('const fingerprint ='));
    const equipmentIndex = screen.indexOf('equipment,', orderedGarmentsIndex);
    const tempCIndex = screen.indexOf('now.tempC,', equipmentIndex);
    const feelsLikeCIndex = screen.indexOf('now.feelsLikeC,', tempCIndex);
    const windMsIndex = screen.indexOf('now.windMs,', feelsLikeCIndex);
    const precipMmHIndex = screen.indexOf('now.precipMmH,', windMsIndex);
    const symbolCodeIndex = screen.indexOf('now.symbolCode,', precipMmHIndex);
    for (const index of [
      orderedGarmentsIndex,
      equipmentIndex,
      tempCIndex,
      feelsLikeCIndex,
      windMsIndex,
      precipMmHIndex,
      symbolCodeIndex,
    ]) {
      expect(index).toBeGreaterThan(-1);
    }

    // And HjemScreen's own garment/equipment projection (the two arrays fed
    // into the fingerprint) matches what projectResultKeyGarments computes.
    expect(screen).toContain(
      "const orderedGarments = resolvedRecommendation.layers\n      .filter((layer) => layer.category !== 'utstyr')\n      .flatMap((layer) => layer.items);",
    );
    expect(screen).toContain(
      "const equipment = resolvedRecommendation.layers\n      .filter((layer) => layer.category === 'utstyr')\n      .flatMap((layer) => layer.items);",
    );
  });

  it('computeScanResultKey produces byte-identical output to a faithful re-derivation of the HjemScreen fingerprint, for the same recommend() output and weather', () => {
    const input = fixedInput();
    const recommendation = recommend(input);

    // Faithful re-derivation of HjemScreen's inline fingerprint construction
    // (lines ~461-476), duplicated here ONLY for the purpose of proving
    // computeScanResultKey computes the identical string — HjemScreen itself
    // is never imported or modified.
    const orderedGarments = recommendation.layers
      .filter((layer) => layer.category !== 'utstyr')
      .flatMap((layer) => layer.items);
    const equipment = recommendation.layers
      .filter((layer) => layer.category === 'utstyr')
      .flatMap((layer) => layer.items);
    const expectedFingerprint = `current-finalized:${JSON.stringify([
      orderedGarments,
      equipment,
      input.weather.tempC,
      input.weather.feelsLikeC,
      input.weather.windMs,
      input.weather.precipMmH,
      input.weather.symbolCode,
    ])}`;

    const actual = computeScanResultKey(recommendation, {
      tempC: input.weather.tempC,
      feelsLikeC: input.weather.feelsLikeC,
      windMs: input.weather.windMs,
      precipMmH: input.weather.precipMmH,
      symbolCode: input.weather.symbolCode ?? 'unknown',
    });

    expect(actual).toBe(expectedFingerprint);
    expect(actual.startsWith('current-finalized:')).toBe(true);
  });

  it('projectResultKeyGarments matches the manual layer-filter projection used above', () => {
    const recommendation = recommend(fixedInput());
    const projected = projectResultKeyGarments(recommendation);
    const orderedGarments = recommendation.layers
      .filter((layer) => layer.category !== 'utstyr')
      .flatMap((layer) => layer.items);
    const equipment = recommendation.layers
      .filter((layer) => layer.category === 'utstyr')
      .flatMap((layer) => layer.items);
    expect([...projected.orderedGarments]).toEqual(orderedGarments);
    expect([...projected.equipment]).toEqual(equipment);
  });

  it('is sensitive to every weather field it is documented to include (changes any one -> different key)', () => {
    const recommendation = recommend(fixedInput());
    const base = {
      tempC: 3,
      feelsLikeC: -1,
      windMs: 4,
      precipMmH: 0.5,
      symbolCode: 'lightsnow',
    };
    const baseline = computeScanResultKey(recommendation, base);
    expect(computeScanResultKey(recommendation, { ...base, tempC: 4 })).not.toBe(baseline);
    expect(computeScanResultKey(recommendation, { ...base, feelsLikeC: 0 })).not.toBe(baseline);
    expect(computeScanResultKey(recommendation, { ...base, windMs: 5 })).not.toBe(baseline);
    expect(computeScanResultKey(recommendation, { ...base, precipMmH: 1 })).not.toBe(baseline);
    expect(computeScanResultKey(recommendation, { ...base, symbolCode: 'clearsky_day' })).not.toBe(baseline);
  });

  it('is deterministic and stable for repeated calls with the same input', () => {
    const recommendation = recommend(fixedInput());
    const weather = {
      tempC: 3,
      feelsLikeC: -1,
      windMs: 4,
      precipMmH: 0.5,
      symbolCode: 'lightsnow',
    };
    expect(computeScanResultKey(recommendation, weather)).toBe(
      computeScanResultKey(recommendation, weather),
    );
  });
});
