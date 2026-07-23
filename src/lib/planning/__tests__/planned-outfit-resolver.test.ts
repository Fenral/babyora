import { describe, expect, it } from 'vitest';
import type { PlanningChangeEvent } from '../change-events.js';
import { createPlannedOutfitContext } from '../planned-outfit-context.js';
import { resolvePlannedOutfitContext } from '../planned-outfit-resolver.js';

function planningEvent(
  overrides: Partial<PlanningChangeEvent> = {},
): PlanningChangeEvent {
  return {
    id: 'planning-event-future-11',
    atIso: '2026-02-12T11:00:00.000Z',
    kind: 'add',
    addedGarments: ['Balaklava'],
    removedGarments: [],
    cause: 'Kaldere luft',
    transitionContextId: 'transition-future-11',
    ...overrides,
  };
}

function plannedContext(
  event: PlanningChangeEvent = planningEvent(),
  overrides: Readonly<Record<string, unknown>> = {},
) {
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
    recommendation: {
      id: 'finalized-recommendation-01',
      fingerprint: 'synthetic:planned-01',
      orderedGarments: ['Ullbody', 'Ullbukse', 'Balaklava'],
      equipment: ['Vognpose'],
      finalized: true,
    },
    access: {
      capability: 'future_plan',
      allowed: true,
      reason: 'plus',
    },
    ...overrides,
  });
}

describe('Planned Outfit resolver', () => {
  it('resolves only an exact current-event context', () => {
    const event = planningEvent();
    const context = plannedContext(event);

    expect(resolvePlannedOutfitContext(
      event.id,
      [event],
      { [event.id]: context },
    )).toBe(context);
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
      transitionContextId: 'transition-future-12',
    });
    const invalidClone = structuredClone(exact);
    const planningMismatch = plannedContext(event, {
      planningEventId: 'planning-event-unrelated',
    });
    const transitionMismatch = plannedContext(event, {
      transitionContextId: 'transition-unrelated',
    });
    const inheritedContexts = Object.create({
      [event.id]: exact,
    }) as Readonly<Record<string, unknown>>;

    const rejected: ReadonlyArray<readonly [
      string,
      readonly PlanningChangeEvent[],
      Readonly<Record<string, unknown>>,
    ]> = [
      ['planning-event-missing', [event], { [event.id]: exact }],
      [event.id, [], { [event.id]: exact }],
      [event.id, [other], { [event.id]: exact }],
      [event.id, [event], {}],
      [event.id, [event], inheritedContexts],
      [event.id, [event], { [event.id]: invalidClone }],
      [event.id, [event], { [event.id]: planningMismatch }],
      [event.id, [event], { [event.id]: transitionMismatch }],
      [event.id, [event], { [other.id]: plannedContext(other) }],
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
      transitionContextId: 'transition-future-next-day',
    });
    const firstContext = plannedContext(first);
    const secondContext = plannedContext(second);
    const contexts = {
      [first.id]: firstContext,
      [second.id]: secondContext,
    };

    expect(resolvePlannedOutfitContext(second.id, [first, second], contexts)).toBe(
      secondContext,
    );
    expect(resolvePlannedOutfitContext(first.id, [first, second], contexts)).toBe(
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
      [event, conflicting],
      { [event.id]: context },
    )).toBeNull();
  });

  it('has no construction, recommendation, time, weather, storage, navigation, or logging capability', async () => {
    const sourcePath = '../planned-outfit-resolver.ts?raw';
    const sourceModule = await import(/* @vite-ignore */ sourcePath) as { default: string };

    expect(sourceModule.default).not.toMatch(
      /\b(?:createPlannedOutfitContext|Date|recommend|weather|localStorage|sessionStorage|indexedDB|fetch|XMLHttpRequest|WebSocket|sendBeacon|console|posthog|analytics|track|history|pushState|replaceState|URLSearchParams|React)\b/u,
    );
  });
});
