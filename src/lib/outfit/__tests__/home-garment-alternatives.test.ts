import { describe, expect, it } from 'vitest';

import { garmentFactFor } from '../../../data/garment-facts.js';
import { createCurrentOutfitContext } from '../../planning/planned-outfit-context.js';
import { recommend } from '../../wool-layers/recommend.js';
import { getAlternatives } from '../../wool-layers/alternatives.js';
import type { RecommendInput, Recommendation } from '../../wool-layers/types.js';
import {
  produceOutfitBundle,
  type OutfitBundleProducerResult,
} from '../outfit-bundle-producer.js';
import { deriveHomeGarmentAlternativeGroups } from '../home-garment-alternatives.js';

const INPUT: RecommendInput = {
  weather: {
    tempC: -5,
    feelsLikeC: -8,
    windMs: 2,
    precipMmH: 0,
    humidity: 72,
    symbolCode: 'snow',
    uvIndex: 0,
  },
  child: { ageMonths: 10, canRoll: true },
  activity: 'vogn',
  vognMode: 'sleeping',
  exposureMin: 60,
  innerJakke: false,
  context: { bilstol: false },
  childCalibration: 0,
};

function transitionContextId(
  plannedForIso: string,
  input: RecommendInput,
  recommendation: Recommendation,
): string {
  const garments = recommendation.layers
    .filter((layer) => layer.category !== 'utstyr')
    .flatMap((layer) => layer.items);
  const equipment = recommendation.layers
    .filter((layer) => layer.category === 'utstyr')
    .flatMap((layer) => layer.items);
  const fingerprint = `current-finalized:${JSON.stringify([
    garments,
    equipment,
    input.weather.tempC,
    input.weather.feelsLikeC,
    input.weather.windMs,
    input.weather.precipMmH,
    input.weather.symbolCode ?? 'unknown',
  ])}`;
  return `current-transition:${plannedForIso}:${fingerprint}`;
}

function supportedBundle(): Extract<
  OutfitBundleProducerResult,
  { kind: 'supported' }
> {
  const recommendation = recommend(INPUT);
  const plannedForIso = '2026-02-12T11:00:00.000Z';
  const context = createCurrentOutfitContext({
    planningEventId: 'home-alternatives-test-event',
    transitionContextId: transitionContextId(
      plannedForIso,
      INPUT,
      recommendation,
    ),
    child: { id: 'child-01', name: 'Ada', ageMonths: INPUT.child.ageMonths },
    plannedForIso,
    timeZone: 'Europe/Oslo',
    place: {
      label: 'Hjemme',
      lat: 59.9139,
      lon: 10.7522,
      source: 'configured-place',
    },
    activity: INPUT.activity,
    vognMode: INPUT.vognMode ?? 'awake',
    weather: {
      tempC: INPUT.weather.tempC,
      feelsLikeC: INPUT.weather.feelsLikeC,
      windMs: INPUT.weather.windMs,
      precipMmH: INPUT.weather.precipMmH,
      symbolCode: INPUT.weather.symbolCode ?? 'unknown',
    },
    recommendInput: INPUT,
    finalizedRecommendation: recommendation,
    access: { capability: 'future_plan', allowed: true, reason: 'plus' },
  });
  if (context.sourceKind !== 'phase2-outfit-truth') {
    throw new Error('fixture requires producer context');
  }
  const result = produceOutfitBundle({
    seed: context.producerSeed,
    source: {
      kind: 'current',
      sourceContextId: context.producerSeed.sourceContextId,
    },
  });
  if (result.kind !== 'supported' || result.options.length === 0) {
    throw new Error('fixture requires authorized garment alternatives');
  }
  return result;
}

describe('deriveHomeGarmentAlternativeGroups', () => {
  it('fails closed for anything except an authenticated supported producer result', () => {
    const unavailable = produceOutfitBundle({} as never);
    const fake = Object.freeze({
      kind: 'supported',
      bundleVersion: 1,
      base: Object.freeze({ garments: Object.freeze([]) }),
      options: Object.freeze([]),
    });
    let trapCalls = 0;
    const hostile = new Proxy(Object.freeze({}), {
      get() {
        trapCalls += 1;
        throw new Error('must not inspect hostile input');
      },
    });

    expect(deriveHomeGarmentAlternativeGroups(null)).toEqual([]);
    expect(deriveHomeGarmentAlternativeGroups(unavailable)).toEqual([]);
    expect(deriveHomeGarmentAlternativeGroups(fake as never)).toEqual([]);
    expect(deriveHomeGarmentAlternativeGroups(hostile as never)).toEqual([]);
    expect(trapCalls).toBe(0);
  });

  it('groups every authorized option by a source from base.garments only', () => {
    const bundle = supportedBundle();
    const groups = deriveHomeGarmentAlternativeGroups(bundle, 'no');
    const garmentIds = new Set(bundle.base.garments.map((item) => item.itemId));
    const equipmentIds = new Set(bundle.base.equipment.map((item) => item.itemId));

    expect(groups.length).toBeGreaterThan(0);
    for (const group of groups) {
      expect(garmentIds.has(group.source.itemId)).toBe(true);
      expect(equipmentIds.has(group.source.itemId)).toBe(false);
      const expected = bundle.options.filter(
        (option) => option.sourceItemId === group.source.itemId,
      );
      expect(group.alternatives).toHaveLength(expected.length);
      expect(group.alternatives.map((item) => item.optionId)).toEqual(
        expected.map((item) => item.optionId),
      );
      expect(group.source.imageSrc).toBeTruthy();
      expect(group.source.fact.text).toBeTruthy();
    }
    expect(Object.isFrozen(groups)).toBe(true);
  });

  it('keeps exact Norwegian comparison copy but never leaks it to other languages', () => {
    const bundle = supportedBundle();
    const norwegian = deriveHomeGarmentAlternativeGroups(bundle, 'no');
    const english = deriveHomeGarmentAlternativeGroups(bundle, 'en-GB');
    const option = bundle.options[0]!;
    const noAlternative = norwegian
      .flatMap((group) => group.alternatives)
      .find((item) => item.optionId === option.optionId)!;
    const enAlternative = english
      .flatMap((group) => group.alternatives)
      .find((item) => item.optionId === option.optionId)!;

    expect(noAlternative.advantages).toEqual(option.comparison.advantages);
    expect(noAlternative.tradeoffs).toEqual(option.comparison.tradeoffs);
    const sourceGarment = bundle.base.garments.find(
      (garment) => garment.itemId === option.sourceItemId,
    )!;
    const sourceData = getAlternatives(sourceGarment.sourceLabel);
    const noGroup = norwegian.find(
      (group) => group.source.itemId === option.sourceItemId,
    )!;
    const enGroup = english.find(
      (group) => group.source.itemId === option.sourceItemId,
    )!;
    expect(noGroup.source.advantages).toEqual(sourceData?.pros ?? []);
    expect(noGroup.source.tradeoffs).toEqual(sourceData?.cons ?? []);
    expect(enGroup.source.advantages).toEqual([
      'Matched to today\'s weather and the complete outfit.',
    ]);
    expect(enAlternative.advantages).toEqual([
      'A safe alternative for this place in today\'s outfit.',
    ]);
    expect(enAlternative.tradeoffs).toEqual([
      'The material, warmth and feel may differ from the recommendation.',
    ]);
    for (const norwegianText of [
      ...option.comparison.advantages,
      ...option.comparison.tradeoffs,
    ]) {
      expect(enAlternative.advantages).not.toContain(norwegianText);
      expect(enAlternative.tradeoffs).not.toContain(norwegianText);
    }
    expect(enAlternative.fact).toEqual(garmentFactFor(
      enAlternative.targetCatalogGarmentId ?? option.targetLabel,
      'en',
    ));
  });

  it.each([
    ['sv', 'Ett säkert alternativ för denna plats i dagens klädsel.'],
    ['da', 'Et sikkert alternativ til denne plads i dagens påklædning.'],
  ] as const)('uses localized generic comparison copy and facts in %s', (
    language,
    expectedAdvantage,
  ) => {
    const bundle = supportedBundle();
    const option = bundle.options[0]!;
    const localized = deriveHomeGarmentAlternativeGroups(bundle, language)
      .flatMap((group) => group.alternatives)
      .find((item) => item.optionId === option.optionId)!;

    expect(localized.advantages).toEqual([expectedAdvantage]);
    expect(localized.fact).toEqual(garmentFactFor(
      localized.targetCatalogGarmentId ?? option.targetLabel,
      language,
    ));
    expect(localized.advantages).not.toEqual(option.comparison.advantages);
    expect(localized.tradeoffs).not.toEqual(option.comparison.tradeoffs);
  });
});
