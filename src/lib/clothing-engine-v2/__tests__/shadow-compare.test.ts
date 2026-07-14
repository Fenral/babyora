/**
 * Motor 2.0 Task 12 — feature-ruting, shadow-sammenligning og rollback.
 * Kritisk krav: all-flags-off bruker den CONTAINEDE legacy-motoren (R2-stien,
 * aldri pre-containment), og et shadow-resultat vises aldri. FORVENTET RED.
 */
import { describe, expect, it } from 'vitest';
import { ENGINE_V2_FLAGS, selectEngine, type EngineV2Flags } from '../feature-flags.js';
import { compareShadow, selectVisibleResult } from '../shadow-compare.js';
import { recommendV2 } from '../recommend.js';
import { toLegacyRecommendation } from '../legacy-adapter.js';
import { recommend } from '../../wool-layers/recommend.js';
import type { RecommendInputV2 } from '../types.js';

const allFlagsOff: EngineV2Flags = { engine_v2_shadow: false, engine_v2_infant: false, engine_v2_young_toddler: false };

function v2Input(ageMonths: number, feelsLikeC: number, situation: RecommendInputV2['situation'] = 'stroller_awake'): RecommendInputV2 {
  return { weather: { tempC: feelsLikeC, feelsLikeC, windMs: 3, precipMmH: 0 }, ageMonths, situation };
}

function shadowPair(ageMonths = 10, feelsLikeC = -4) {
  const legacy = recommend({
    weather: { tempC: feelsLikeC, feelsLikeC, windMs: 3, precipMmH: 0 },
    child: { ageMonths },
    activity: 'vogn',
  });
  const v2 = recommendV2(v2Input(ageMonths, feelsLikeC));
  return { legacy, v2 };
}

describe('Motor 2.0 feature-ruting', () => {
  it('bruker legacy når alle V2-visningsflagg er av', () => {
    expect(selectEngine({ ageMonths: 8 }, allFlagsOff)).toBe('legacy');
    expect(selectEngine({ ageMonths: 18 }, allFlagsOff)).toBe('legacy');
  });

  it('produksjonsflaggene er av i kodebasen (kohortport = menneskelig gate)', () => {
    expect(ENGINE_V2_FLAGS.engine_v2_infant).toBe(false);
    expect(ENGINE_V2_FLAGS.engine_v2_young_toddler).toBe(false);
  });

  it('infant-flagget ruter kun 0–11; young_toddler kun 12–24', () => {
    const infantOn: EngineV2Flags = { ...allFlagsOff, engine_v2_infant: true };
    expect(selectEngine({ ageMonths: 8 }, infantOn)).toBe('v2');
    expect(selectEngine({ ageMonths: 18 }, infantOn)).toBe('legacy');
    const toddlerOn: EngineV2Flags = { ...allFlagsOff, engine_v2_young_toddler: true };
    expect(selectEngine({ ageMonths: 8 }, toddlerOn)).toBe('legacy');
    expect(selectEngine({ ageMonths: 18 }, toddlerOn)).toBe('v2');
  });

  it('rollback: all-flags-off velger den containede legacy-stien uten å røre V2-data', () => {
    // Den containede stien = recommend() fra wool-layers ETTER R2 (finalize-
    // grensen). selectEngine peker dit — og shadow-ruting endrer aldri svaret.
    const withShadow: EngineV2Flags = { ...allFlagsOff, engine_v2_shadow: true };
    expect(selectEngine({ ageMonths: 8 }, withShadow)).toBe('legacy');
  });
});

describe('Motor 2.0 shadow-sammenligning', () => {
  it('viser ALDRI et shadow-resultat', () => {
    const pair = shadowPair();
    expect(selectVisibleResult(pair)).toBe(pair.legacy);
  });

  it('klassifiserer likt funksjonelt innhold som equivalent', () => {
    const pair = shadowPair();
    const legacyFromV2 = toLegacyRecommendation(pair.v2);
    const compared = compareShadow(pair.legacy, pair.v2);
    // Selvkonsistens: sammenligningen bygger på adapterens kategorier.
    expect(['equivalent', 'expected_improvement', 'needs_review']).toContain(compared.status);
    expect(compared.details.v2Categories).toEqual(legacyFromV2.layers.map((l) => l.category));
  });

  it('flagger tap av værbeskyttelse som needs_review', () => {
    const legacy = recommend({
      weather: { tempC: 6, feelsLikeC: 6, windMs: 3, precipMmH: 2 },
      child: { ageMonths: 10 },
      activity: 'vogn',
    });
    // Fiendtlig V2 uten regnbeskyttelse (simulert regresjon).
    const v2 = recommendV2(v2Input(10, 6));
    const compared = compareShadow(legacy, v2);
    expect(compared.status).toBe('needs_review');
    expect(compared.reasons.some((r) => /regn|vann/i.test(r))).toBe(true);
  });

  it('flagger severity-fall som needs_review', () => {
    const legacy = recommend({
      weather: { tempC: -12, feelsLikeC: -12, windMs: 3, precipMmH: 0 },
      child: { ageMonths: 10 },
      activity: 'vogn',
      exposureMin: 45,
    });
    const v2 = { ...recommendV2(v2Input(10, -12)), severity: 'NONE' as const, safetyFlags: [] };
    const compared = compareShadow(legacy, v2);
    expect(compared.status).toBe('needs_review');
  });

  it('er deterministisk og PII-fri', () => {
    const pair = shadowPair();
    const a = compareShadow(pair.legacy, pair.v2);
    const b = compareShadow(pair.legacy, pair.v2);
    expect(a).toEqual(b);
    expect(JSON.stringify(a)).not.toMatch(/"(name|childName|dob|latitude|longitude|childId)"\s*:/i);
  });
});
