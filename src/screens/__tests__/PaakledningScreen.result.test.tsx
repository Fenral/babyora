/** @vitest-environment jsdom */

import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { displayNameForDbString } from '../../data/garment-display-names.js';
import { produceOutfitBundle } from '../../lib/outfit/outfit-bundle-producer.js';
import {
  createCurrentOutfitContext,
  createPlannedOutfitContext,
  type PlannedOutfitContext,
} from '../../lib/planning/planned-outfit-context.js';
import { recommend } from '../../lib/wool-layers/recommend.js';
import { ITEM_ALTERNATIVES } from '../../lib/wool-layers/alternatives.js';
import type { RecommendInput } from '../../lib/wool-layers/types.js';
import { useOutfitSelectionStore } from '../../state/outfit-selection-store.js';
import { PaakledningScreen } from '../PaakledningScreen.js';

const DEFAULT_INPUT: RecommendInput = {
  weather: {
    tempC: 5,
    feelsLikeC: 4,
    windMs: 1,
    precipMmH: 0,
    symbolCode: 'cloudy',
  },
  child: { ageMonths: 10, canRoll: true },
  activity: 'utelek',
  exposureMin: 45,
};

function resultFixture(
  kind: 'current' | 'planned',
  input: RecommendInput = DEFAULT_INPUT,
  plannedForIso = '2026-02-12T11:00:00.000Z',
) {
  const finalizedRecommendation = recommend(input);
  const garments = finalizedRecommendation.layers
    .filter((layer) => layer.category !== 'utstyr')
    .flatMap((layer) => layer.items);
  const equipment = finalizedRecommendation.layers
    .filter((layer) => layer.category === 'utstyr')
    .flatMap((layer) => layer.items);
  const fingerprint = kind === 'current'
    ? `current-finalized:${JSON.stringify([
        garments,
        equipment,
        input.weather.tempC,
        input.weather.feelsLikeC,
        input.weather.windMs,
        input.weather.precipMmH,
        input.weather.symbolCode ?? 'unknown',
      ])}`
    : `planned-finalized:${JSON.stringify([garments, equipment])}`;
  const contextInput = {
    planningEventId: `task-018-${kind}`,
    transitionContextId: `${kind === 'current' ? 'current' : 'planning'}-transition:${plannedForIso}:${fingerprint}`,
    child: { id: 'task-018-child', name: 'Ada', ageMonths: input.child.ageMonths },
    plannedForIso,
    timeZone: 'Europe/Oslo' as const,
    place: { label: 'Hjemme', lat: 59.9139, lon: 10.7522, source: 'configured-place' as const },
    activity: input.activity,
    vognMode: input.activity === 'vogn' ? input.vognMode ?? 'awake' : null,
    weather: {
      tempC: input.weather.tempC,
      feelsLikeC: input.weather.feelsLikeC,
      windMs: input.weather.windMs,
      precipMmH: input.weather.precipMmH,
      symbolCode: input.weather.symbolCode ?? 'unknown',
    },
    recommendInput: input,
    finalizedRecommendation,
    access: { capability: kind === 'current' ? 'today_home' as const : 'future_plan' as const, allowed: true, reason: kind === 'current' ? 'free' as const : 'plus' as const },
  };
  const context = kind === 'current'
    ? createCurrentOutfitContext(contextInput)
    : createPlannedOutfitContext(contextInput);
  if (context.sourceKind !== 'phase2-outfit-truth') throw new Error('expected canonical context');
  const bundle = produceOutfitBundle({
    seed: context.producerSeed,
    source: kind === 'current'
      ? { kind: 'current', sourceContextId: context.producerSeed.sourceContextId }
      : {
          kind: 'planned',
          sourceContextId: context.producerSeed.sourceContextId,
          planningEventId: context.planningEventId,
          plannedForIso: context.plannedForIso,
        },
  });
  if (bundle.kind !== 'supported') throw new Error('expected supported bundle');
  return { bundle, context };
}

function renderResult(context: PlannedOutfitContext, bundle: ReturnType<typeof resultFixture>['bundle']) {
  return context.access.capability === 'today_home'
    ? render(<PaakledningScreen onBack={() => undefined} currentContext={context} outfitBundle={bundle} />)
    : render(<PaakledningScreen onBack={() => undefined} plannedContext={context} outfitBundle={bundle} />);
}

afterEach(() => {
  cleanup();
  useOutfitSelectionStore.getState().close();
  vi.useRealTimers();
});

describe('PaakledningScreen — complete result states', () => {
  it('renders one complete numbered result with weather time, largest driver, and visible safety notices', () => {
    const coldInput: RecommendInput = {
      weather: { tempC: -12, feelsLikeC: -12, windMs: 0, precipMmH: 0, symbolCode: 'clearsky_day' },
      child: { ageMonths: 10, canRoll: true },
      activity: 'utelek',
      exposureMin: 45,
    };
    const { bundle, context } = resultFixture('planned', coldInput);
    const { container } = renderResult(context, bundle);

    expect(container.querySelectorAll('[data-outfit-row]')).toHaveLength(bundle.base.garments.length);
    bundle.base.garments.forEach((garment, index) => {
      expect(garment.order).toBe(index + 1);
      expect(container.textContent).toContain(displayNameForDbString(garment.label));
    });
    expect(container.textContent).toContain('Værgrunnlag:');
    expect(container.querySelector(`time[datetime="${context.plannedForIso}"]`)).not.toBeNull();
    expect(container.textContent).toContain('Største faktor:');
    expect(container.textContent).toContain('Kort tur — sjekk kinn, nese og ører hvert 20. minutt.');
    expect(container.textContent).not.toContain('To ullsett er forbeholdt ekstrem frost');
  });

  it('labels an hour-old current result as stale instead of presenting it as current', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-12T12:00:00.001Z'));
    const { bundle, context } = resultFixture('current');
    const { container } = renderResult(context, bundle);

    expect(container.querySelector('[role="status"]')?.textContent).toContain('Antrekket er ikke lenger oppdatert');
    expect(container.textContent).toContain('Tidligere beregnet antrekk');
    expect(container.textContent).not.toContain('Dagens antrekk');
  });

  it('keeps every numbered text row when optional garment images fail', () => {
    const { bundle, context } = resultFixture('planned');
    const { container } = renderResult(context, bundle);
    const firstThumbnail = container.querySelector<HTMLImageElement>('.outfit-row__thumbnail');
    expect(firstThumbnail).not.toBeNull();
    fireEvent.error(firstThumbnail!);

    expect(firstThumbnail?.dataset.fallbackStage).toBe('generic');
    expect(container.querySelectorAll('[data-outfit-row]')).toHaveLength(bundle.base.garments.length);
    for (const garment of bundle.base.garments) {
      expect(container.textContent).toContain(displayNameForDbString(garment.label));
    }
  });

  it('renders a bounded engine-error state and no partial list or rationale for an unavailable bundle', () => {
    const { context } = resultFixture('planned');
    if (context.sourceKind !== 'phase2-outfit-truth') throw new Error('expected canonical context');
    const unavailable = produceOutfitBundle({
      seed: context.producerSeed,
      source: {
        kind: 'planned',
        sourceContextId: 'wrong-source',
        planningEventId: context.planningEventId,
        plannedForIso: context.plannedForIso,
      },
    });
    expect(unavailable.kind).toBe('unavailable');
    const { container } = render(
      <PaakledningScreen onBack={() => undefined} plannedContext={context} outfitBundle={unavailable} />,
    );

    expect(container.querySelector('[role="alert"]')?.textContent).toContain('Vi fikk ikke vist et komplett antrekk');
    expect(container.textContent).toContain('Gå tilbake og beregn på nytt');
    expect(container.querySelector('.outfit-list')).toBeNull();
    expect(container.textContent).not.toContain('Hvorfor dette antrekket?');
  });

  it('calmly explains an alternative that final safety removes', () => {
    const entry = ITEM_ALTERNATIVES.find((candidate) => candidate.itemName === 'langermet body');
    if (!entry) throw new Error('missing langermet body alternatives');
    const original = entry.alternatives;
    entry.alternatives = [{ name: 'lue', pros: ['Varm'], cons: [] }];
    try {
      const input: RecommendInput = {
        weather: { tempC: 20, feelsLikeC: 20, windMs: 0, precipMmH: 0 },
        child: { ageMonths: 10, canRoll: true },
        activity: 'soevn',
      };
      const { bundle, context } = resultFixture('planned', input);
      const { container } = renderResult(context, bundle);

      expect(container.textContent).toContain(
        'Lue kan ikke brukes her fordi sikkerhetsreglene fjerner det fra antrekket.',
      );
      expect(container.textContent).not.toContain('Velg lue');
    } finally {
      entry.alternatives = original;
    }
  });
});
