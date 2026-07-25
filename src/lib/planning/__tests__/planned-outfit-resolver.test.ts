import { describe, expect, it } from 'vitest';
import type { PlanningChangeEvent } from '../change-events.js';
import { recommend } from '../../wool-layers/recommend.js';
import {
  createCurrentOutfitContext,
  createPlannedOutfitContext,
} from '../planned-outfit-context.js';
import { resolvePlannedOutfitContext } from '../planned-outfit-resolver.js';

function resolverRecommendInput() {
  return {
    weather: {
      tempC: 1,
      feelsLikeC: -2,
      windMs: 3.1,
      precipMmH: 0.4,
      humidity: 72,
      symbolCode: 'lightsnow',
      uvIndex: 0,
    },
    child: { ageMonths: 5, canRoll: false },
    activity: 'vogn' as const,
    exposureMin: 75,
    innerJakke: false,
    vognMode: 'sleeping' as const,
    context: { bilstol: false },
    childCalibration: 0 as const,
  };
}

function recommendationProjection(recommendation: ReturnType<typeof recommend>) {
  return {
    orderedGarments: recommendation.layers
      .filter((layer) => layer.category !== 'utstyr')
      .flatMap((layer) => layer.items),
    equipment: recommendation.layers
      .filter((layer) => layer.category === 'utstyr')
      .flatMap((layer) => layer.items),
  };
}

function plannedRawTransition(
  atIso: string,
  recommendation = recommend(resolverRecommendInput()),
): string {
  const { orderedGarments, equipment } =
    recommendationProjection(recommendation);
  const fingerprint =
    `planned-finalized:${JSON.stringify([orderedGarments, equipment])}`;
  return `planning-transition:${atIso}:${fingerprint}`;
}

function currentRawTransition(
  atIso: string,
  recommendation: ReturnType<typeof recommend>,
): string {
  const { orderedGarments, equipment } =
    recommendationProjection(recommendation);
  const fingerprint = `current-finalized:${JSON.stringify([
    orderedGarments,
    equipment,
    1,
    -2,
    3.1,
    0.4,
    'lightsnow',
  ])}`;
  return `current-transition:${atIso}:${fingerprint}`;
}

function planningEvent(
  overrides: Partial<PlanningChangeEvent> = {},
): PlanningChangeEvent {
  const atIso = overrides.atIso ?? '2026-02-12T11:00:00.000Z';
  return {
    id: 'planning-event-future-11',
    atIso,
    kind: 'add',
    addedGarments: ['Balaklava'],
    removedGarments: [],
    cause: 'Kaldere luft',
    transitionContextId: plannedRawTransition(atIso),
    ...overrides,
  };
}

function plannedContext(
  event: PlanningChangeEvent = planningEvent(),
  overrides: Readonly<Record<string, unknown>> = {},
) {
  const recommendInput = resolverRecommendInput();
  return createPlannedOutfitContext({
    planningEventId: event.id,
    transitionContextId: event.transitionContextId,
    child: {
      id: 'barn-01',
      name: 'Ada',
      ageMonths: 5,
    },
    plannedForIso: event.atIso,
    timeZone: 'Europe/Oslo',
    place: {
      label: 'Hjemme',
      lat: 59.9139,
      lon: 10.7522,
      source: 'configured-place',
    },
    activity: 'vogn',
    vognMode: 'sleeping',
    weather: {
      tempC: 1,
      feelsLikeC: -2,
      windMs: 3.1,
      precipMmH: 0.4,
      symbolCode: 'lightsnow',
    },
    recommendInput,
    finalizedRecommendation: recommend(recommendInput),
    access: {
      capability: 'future_plan',
      allowed: true,
      reason: 'plus',
    },
    ...overrides,
  });
}

function currentContext(event: PlanningChangeEvent = planningEvent()) {
  const recommendInput = resolverRecommendInput();
  const finalizedRecommendation = recommend(recommendInput);
  return createCurrentOutfitContext({
    planningEventId: event.id,
    transitionContextId: currentRawTransition(
      event.atIso,
      finalizedRecommendation,
    ),
    child: { id: 'barn-01', name: 'Ada', ageMonths: 5 },
    plannedForIso: event.atIso,
    timeZone: 'Europe/Oslo',
    place: {
      label: 'Hjemme',
      lat: 59.9139,
      lon: 10.7522,
      source: 'configured-place',
    },
    activity: 'vogn',
    vognMode: 'sleeping',
    weather: {
      tempC: 1,
      feelsLikeC: -2,
      windMs: 3.1,
      precipMmH: 0.4,
      symbolCode: 'lightsnow',
    },
    recommendInput,
    finalizedRecommendation,
    access: { capability: 'future_plan', allowed: true, reason: 'plus' },
  });
}

function currentEvents(
  ...events: readonly PlanningChangeEvent[]
): readonly PlanningChangeEvent[] {
  return Object.freeze([...events]);
}

function contextMap(
  entries: readonly (readonly [string, unknown])[],
): ReadonlyMap<string, unknown> {
  return new Map(entries);
}

describe('Planned Outfit resolver', () => {
  it('resolves only an exact current-event ReadonlyMap context', () => {
    const event = planningEvent();
    const context = plannedContext(event);

    expect(resolvePlannedOutfitContext(
      event.id,
      currentEvents(event),
      contextMap([[event.id, context]]),
    )).toBe(context);
    expect(context.transitionContextId).not.toBe(event.transitionContextId);
    expect(context.sourceKind).toBe('phase2-outfit-truth');
    if (context.sourceKind !== 'phase2-outfit-truth') {
      throw new Error('expected exact outfit-truth context');
    }
    expect(context.producerSeed.transitionContextId).toBe(
      context.transitionContextId,
    );
    expect(new Set([
      context.plannedContextId,
      context.planningEventId,
      context.transitionContextId,
    ])).toHaveLength(3);
  });

  it('fails closed for every missing, stale, invalid, or mismatched boundary', () => {
    const event = planningEvent();
    const exact = plannedContext(event);
    const other = planningEvent({
      id: 'planning-event-future-12',
      atIso: '2026-02-12T12:00:00.000Z',
    });
    const invalidClone = structuredClone(exact);
    const planningMismatch = plannedContext(event, {
      planningEventId: 'planning-event-unrelated',
    });
    const transitionMismatchInput = resolverRecommendInput();
    const transitionMismatchRecommendation = recommend(transitionMismatchInput);
    transitionMismatchRecommendation.layers[0]!.items.push('annet ullag');
    const transitionMismatchEvent = planningEvent({
      transitionContextId: plannedRawTransition(
        event.atIso,
        transitionMismatchRecommendation,
      ),
    });
    const transitionMismatch = plannedContext(transitionMismatchEvent, {
      recommendInput: transitionMismatchInput,
      finalizedRecommendation: transitionMismatchRecommendation,
    });
    const intervalMismatchEvent = planningEvent({
      atIso: '2026-02-12T12:00:00.000Z',
    });
    const intervalMismatch = plannedContext(intervalMismatchEvent);
    const staleIntervalEvent = planningEvent({
      atIso: '2026-02-12T12:00:00.000Z',
    });
    const effectiveTransitionEvent = planningEvent({
      transitionContextId: exact.transitionContextId,
    });
    const wrongKind = currentContext(event);
    const contextProxy = new Proxy(exact, {});

    const rejected: ReadonlyArray<readonly [
      string,
      readonly PlanningChangeEvent[],
      ReadonlyMap<string, unknown>,
    ]> = [
      ['planning-event-missing', currentEvents(event), contextMap([[event.id, exact]])],
      [event.id, currentEvents(), contextMap([[event.id, exact]])],
      [event.id, currentEvents(other), contextMap([[event.id, exact]])],
      [event.id, currentEvents(event), contextMap([])],
      [event.id, currentEvents(event), contextMap([[event.id, invalidClone]])],
      [event.id, currentEvents(event), contextMap([[event.id, contextProxy]])],
      [event.id, currentEvents(event), contextMap([[event.id, wrongKind]])],
      [event.id, currentEvents(event), contextMap([[event.id, planningMismatch]])],
      [event.id, currentEvents(event), contextMap([[event.id, transitionMismatch]])],
      [event.id, currentEvents(event), contextMap([[event.id, intervalMismatch]])],
      [event.id, currentEvents(staleIntervalEvent), contextMap([[event.id, exact]])],
      [event.id, currentEvents(effectiveTransitionEvent), contextMap([[event.id, exact]])],
      [event.id, currentEvents(event), contextMap([[other.id, plannedContext(other)]])],
    ];

    for (const [eventId, events, contexts] of rejected) {
      expect(resolvePlannedOutfitContext(eventId, events, contexts)).toBeNull();
    }
  });

  it('uses full event identity for same-hour events on different dates', () => {
    const first = planningEvent();
    const second = planningEvent({
      id: 'planning-event-future-next-day',
      atIso: '2026-02-13T11:00:00.000Z',
    });
    const firstContext = plannedContext(first);
    const secondContext = plannedContext(second);
    const contexts = contextMap([
      [first.id, firstContext],
      [second.id, secondContext],
    ]);

    expect(resolvePlannedOutfitContext(second.id, currentEvents(first, second), contexts)).toBe(
      secondContext,
    );
    expect(resolvePlannedOutfitContext(first.id, currentEvents(first, second), contexts)).toBe(
      firstContext,
    );
  });

  it('does not guess when current membership is ambiguous', () => {
    const event = planningEvent();
    const conflicting = planningEvent({
      transitionContextId: 'transition-conflicting',
    });
    const context = plannedContext(event);

    expect(resolvePlannedOutfitContext(
      event.id,
      currentEvents(event, conflicting),
      contextMap([[event.id, context]]),
    )).toBeNull();
  });

  it('fails closed for proxy containers that fabricate membership or map hits', () => {
    const event = planningEvent();
    const context = plannedContext(event);
    const fabricatedEvents = new Proxy([] as PlanningChangeEvent[], {
      get(target, property, receiver) {
        if (property === 'length') return 1;
        return Reflect.get(target, property, receiver);
      },
      getOwnPropertyDescriptor(target, property) {
        if (property === '0') {
          return {
            configurable: true,
            enumerable: true,
            writable: true,
            value: event,
          };
        }
        return Reflect.getOwnPropertyDescriptor(target, property);
      },
    });
    const fabricatedMap = new Proxy(new Map<string, unknown>(), {
      getOwnPropertyDescriptor(target, property) {
        if (property === event.id) {
          return {
            configurable: true,
            enumerable: true,
            writable: true,
            value: context,
          };
        }
        return Reflect.getOwnPropertyDescriptor(target, property);
      },
    });
    const fabricatedEvent = new Proxy({} as PlanningChangeEvent, {
      getOwnPropertyDescriptor(target, property) {
        if (property === 'id' || property === 'transitionContextId') {
          return {
            configurable: true,
            enumerable: true,
            writable: true,
            value: property === 'id' ? event.id : event.transitionContextId,
          };
        }
        return Reflect.getOwnPropertyDescriptor(target, property);
      },
    });

    expect(resolvePlannedOutfitContext(
      event.id,
      fabricatedEvents,
      contextMap([[event.id, context]]),
    )).toBeNull();
    expect(resolvePlannedOutfitContext(
      event.id,
      currentEvents(event),
      fabricatedMap,
    )).toBeNull();
    expect(resolvePlannedOutfitContext(
      event.id,
      currentEvents(fabricatedEvent),
      contextMap([[event.id, context]]),
    )).toBeNull();
  });

  it('has no construction, recommendation, time, weather, storage, navigation, or logging capability', async () => {
    const sourcePath = '../planned-outfit-resolver.ts?raw';
    const sourceModule = await import(/* @vite-ignore */ sourcePath) as { default: string };

    expect(sourceModule.default).not.toMatch(
      /\b(?:createPlannedOutfitContext|Date|recommend|weather|localStorage|sessionStorage|indexedDB|fetch|XMLHttpRequest|WebSocket|sendBeacon|console|posthog|analytics|track|history|pushState|replaceState|URLSearchParams|React)\b/u,
    );
    expect(sourceModule.default).toContain('Object.isFrozen(currentEvents)');
    expect(sourceModule.default).toContain('structuredClone(eventValue)');
    expect(sourceModule.default).toContain('Map.prototype.has.call');
    expect(sourceModule.default).toContain('Map.prototype.get.call');
  });

  it('MIGRATES_THE_TRANSIENT_PLANNED_DRILL_TO_THE_TRUSTED_LIVE_CALLBACK', async () => {
    const appPath = '../../../App.tsx?raw';
    const outfitPath = '../../../screens/PaakledningScreen.tsx?raw';
    const [{ default: appSource }, { default: outfitSource }] = await Promise.all([
      import(/* @vite-ignore */ appPath) as Promise<{ default: string }>,
      import(/* @vite-ignore */ outfitPath) as Promise<{ default: string }>,
    ]);

    expect(appSource).toMatch(
      /source:\s*'planned';\s*plannedContext:\s*PlannedOutfitContext;\s*outfitBundle\?:\s*OutfitBundleProducerResult;\s*origin:\s*HTMLElement/u,
    );
    expect(appSource).toMatch(
      /source:\s*'current';\s*currentContext:\s*PlannedOutfitContext/u,
    );
    expect(appSource).toContain('plannedContext={activeDrill.plannedContext}');
    expect(appSource).toContain('currentContext={activeDrill.currentContext}');
    expect(appSource).toContain('origin.isConnected');
    expect(appSource).toContain('mainRef.current?.focus()');

    const ukeMount = appSource.match(/<UkeScreen[\s\S]*?\/>/u)?.[0] ?? '';
    expect(ukeMount).toContain('onOpenPlannedOutfit={onOpenPlannedOutfit}');
    expect(ukeMount).not.toMatch(/plannedContext|contextId/u);
    expect(appSource).not.toMatch(
      /(?:localStorage|sessionStorage|indexedDB|JSON\.stringify|URLSearchParams|pushState|replaceState|console|posthog|analytics|track)\s*\([^)]*plannedContext/u,
    );

    const plannedStart = outfitSource.indexOf('function PlannedPaakledningScreen');
    const currentStart = outfitSource.indexOf('function CurrentPaakledningScreen');
    expect(plannedStart).toBeGreaterThan(-1);
    expect(currentStart).toBeGreaterThan(plannedStart);
    const plannedBranch = outfitSource.slice(plannedStart, currentStart);
    for (const exactField of [
      'plannedContext.child',
      'plannedContext.plannedForIso',
      'plannedContext.timeZone',
      'plannedContext.place',
      'plannedContext.activity',
      'plannedContext.vognMode',
      'plannedContext.weather',
      'plannedContext.recommendation',
      'plannedContext.access',
    ]) {
      expect(plannedBranch).toContain(exactField);
    }
    expect(plannedBranch).not.toMatch(
      /\b(?:useWeather|useChildren|recommend|Date\.now|sessionStorage|localStorage|fetch)\b/u,
    );
    expect(plannedBranch).toContain('tabIndex={-1}');
    expect(plannedBranch).toContain('ref={titleRef}');
    expect(plannedBranch).toContain('titleRef.current?.focus()');
  });

  it('RED_REVIEW_RESTART_ACCESS_AND_AGE_CONTRACTS', async () => {
    const [{ default: appSource }, { default: ukeSource }] = await Promise.all([
      import(/* @vite-ignore */ '../../../App.tsx?raw') as Promise<{ default: string }>,
      import(/* @vite-ignore */ '../../../screens/UkeScreen.tsx?raw') as Promise<{ default: string }>,
    ]);

    expect(appSource).toContain('shouldClosePlannedDrillOnAccess');
    expect(appSource).toContain('loading: accessLoading');
    expect(ukeSource, 'OUT_OF_RANGE_AGE_MUST_FAIL_CLOSED').toMatch(
      /ageMonths\s*<\s*0\s*\|\|\s*ageMonths\s*>\s*24/u,
    );
    expect(ukeSource).not.toMatch(/Math\.(?:min|max)\(24/u);
  });

  it('RED_SUPPLIED_ACCESS_STATE_IRREVERSIBLY_CLOSES_PLANNED_DRILL', async () => {
    const { default: appSource } = await import(
      /* @vite-ignore */ '../../../App.tsx?raw'
    ) as { default: string };

    expect(appSource).not.toContain('subscribeToAccessEntitlement');
    expect(appSource).toContain('function useClosePlannedDrillOnAccess');
    expect(appSource).toMatch(
      /useClosePlannedDrillOnAccess\(\{[\s\S]*?loading:\s*accessLoading[\s\S]*?isPremium[\s\S]*?onClose:\s*closePaakledning/u,
    );
    expect(appSource).toMatch(
      /const activeDrill = shouldClosePlannedDrillOnAccess\([\s\S]*?\?\s*null\s*:\s*drill/u,
    );
  });

  it('RED_EXACT_CONTEXT_ASSERTS_EVERY_VISIBLE_DIMENSION', async () => {
    const { default: e2eSource } = await import(
      /* @vite-ignore */ '../../../../e2e/planlegg.ts?raw'
    ) as { default: string };

    for (const exactAssertion of [
      'EXACT_CONTEXT_EXPECTED_GARMENTS',
      'EXACT_CONTEXT_EXPECTED_EQUIPMENT',
      'expectedAgeMonths',
      'expectedWeatherLabel',
      'expectedFeelsLike',
    ]) {
      expect(e2eSource, `MISSING_EXACT_CONTEXT_DIMENSION:${exactAssertion}`).toContain(
        exactAssertion,
      );
    }
  });

  it('does not materialize planned advice when exact access is denied', async () => {
    const deniedRecommendInput = {
      weather: {
        tempC: 1,
        feelsLikeC: -2,
        windMs: 3.1,
        precipMmH: 0.4,
        humidity: 72,
        symbolCode: 'lightsnow',
        uvIndex: 0,
      },
      child: { ageMonths: 5, canRoll: false },
      activity: 'vogn' as const,
      exposureMin: 75,
      innerJakke: false,
      vognMode: 'sleeping' as const,
      context: { bilstol: false },
      childCalibration: 0 as const,
    };
    const deniedRecommendation = recommend(deniedRecommendInput);
    deniedRecommendation.layers = [
      {
        category: 'innerst',
        items: ['BETALT-PLAGG-SKAL-IKKE-VISES'],
      },
      {
        category: 'utstyr',
        items: ['BETALT-UTSTYR-SKAL-IKKE-VISES'],
      },
    ];
    const deniedEvent = planningEvent({
      transitionContextId: plannedRawTransition(
        '2026-02-12T11:00:00.000Z',
        deniedRecommendation,
      ),
    });
    const denied = plannedContext(deniedEvent, {
      recommendInput: deniedRecommendInput,
      finalizedRecommendation: deniedRecommendation,
      access: {
        capability: 'future_plan',
        allowed: false,
        reason: 'expired',
      },
    });
    const [{ createElement }, { renderToStaticMarkup }, { PaakledningScreen }] =
      await Promise.all([
        import('react'),
        import('react-dom/server'),
        import('../../../screens/PaakledningScreen.js'),
      ]);
    const markup = renderToStaticMarkup(createElement(PaakledningScreen, {
      onBack: () => undefined,
      plannedContext: denied,
    }));

    expect(markup).toContain('Planlagt antrekk er ikke tilgjengelig');
    expect(markup).not.toContain('BETALT-PLAGG-SKAL-IKKE-VISES');
    expect(markup).not.toContain('BETALT-UTSTYR-SKAL-IKKE-VISES');
  }, 15_000);
});
