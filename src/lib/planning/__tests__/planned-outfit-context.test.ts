import { describe, expect, it } from 'vitest';
import {
  planningAccessFixture,
  planningChildFixture,
  planningFinalizedRecommendationFixture,
  planningLocationFixture,
} from './planlegg-fixtures.js';

type MutablePlannedContextInput = {
  planningEventId: string;
  transitionContextId: string;
  child: {
    id: string;
    name: string;
    ageMonths: number;
  };
  plannedForIso: string;
  timeZone: string;
  place: {
    label: string;
    lat: number;
    lon: number;
    source: string;
  };
  activity: string;
  vognMode: string | null;
  weather: {
    tempC: number;
    feelsLikeC: number;
    windMs: number;
    precipMmH: number;
    symbolCode: string;
  };
  recommendation: {
    id: string;
    fingerprint: string;
    orderedGarments: string[];
    equipment: string[];
    finalized: boolean;
  };
  access: {
    capability: string;
    allowed: boolean;
    reason: string;
  };
};

type PlannedContextContract = {
  PLAN_TIME_ZONE: string;
  createPlannedOutfitContext(input: unknown): Readonly<Record<string, unknown>>;
  isPlannedOutfitContext(value: unknown): boolean;
};

const modulePath = '../planned-outfit-context.js';

async function loadContract(): Promise<PlannedContextContract> {
  return import(/* @vite-ignore */ modulePath) as Promise<PlannedContextContract>;
}

function completeInput(): MutablePlannedContextInput {
  return {
    planningEventId: 'planning-event-future-11',
    transitionContextId: 'transition-future-11',
    child: {
      id: planningChildFixture.id,
      name: planningChildFixture.name,
      ageMonths: 5,
    },
    plannedForIso: '2026-02-12T11:00:00.000Z',
    timeZone: 'Europe/Oslo',
    place: {
      label: planningLocationFixture.label,
      lat: planningLocationFixture.latitude,
      lon: planningLocationFixture.longitude,
      source: planningLocationFixture.source,
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
      id: planningFinalizedRecommendationFixture.id,
      fingerprint: planningFinalizedRecommendationFixture.fingerprint,
      orderedGarments: [...planningFinalizedRecommendationFixture.orderedGarments],
      equipment: [...planningFinalizedRecommendationFixture.equipment],
      finalized: planningFinalizedRecommendationFixture.finalized,
    },
    access: {
      capability: 'future_plan',
      allowed: true,
      reason: planningAccessFixture.plus.tier,
    },
  };
}

function cloneInput(input: MutablePlannedContextInput = completeInput()): MutablePlannedContextInput {
  return structuredClone(input);
}

function assertRecursivelyFrozen(value: unknown, seen = new Set<object>()): void {
  if (typeof value !== 'object' || value === null || seen.has(value)) return;
  seen.add(value);
  expect(Object.isFrozen(value)).toBe(true);
  for (const nested of Object.values(value)) assertRecursivelyFrozen(nested, seen);
}

function isExpectedMissingModule(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message;
  return (
    /planned-outfit-context\.(?:js|ts)/u.test(message)
    && /Failed to load url|Cannot find module|ERR_MODULE_NOT_FOUND|does the file exist/iu.test(message)
  );
}

describe('Planned Outfit exact-context contracts', () => {
  it('RED_PLANNED_CONTEXT_CONTRACT', async () => {
    try {
      const contract = await loadContract();
      expect(contract.PLAN_TIME_ZONE).toBe('Europe/Oslo');
      expect(contract.createPlannedOutfitContext).toBeTypeOf('function');
      expect(contract.isPlannedOutfitContext).toBeTypeOf('function');
    } catch (error) {
      if (isExpectedMissingModule(error)) {
        throw new Error('MISSING_PLANNED_OUTFIT_CONTEXT_CONTRACT');
      }
      throw error;
    }
  });

  it('freezes a complete known-key clone and keeps the three identities distinct', async () => {
    const { createPlannedOutfitContext, isPlannedOutfitContext } = await loadContract();
    const input = completeInput();
    const original = cloneInput(input);
    const context = createPlannedOutfitContext(input);

    expect(context).toMatchObject({
      schemaVersion: 1,
      planningEventId: original.planningEventId,
      transitionContextId: original.transitionContextId,
      child: original.child,
      plannedForIso: original.plannedForIso,
      timeZone: original.timeZone,
      place: original.place,
      activity: original.activity,
      vognMode: original.vognMode,
      weather: original.weather,
      recommendation: original.recommendation,
      access: original.access,
    });
    expect(context.plannedContextId).toMatch(/^planned-context-[0-9a-f]{16}$/u);
    expect(new Set([
      context.plannedContextId,
      context.planningEventId,
      context.transitionContextId,
    ])).toHaveLength(3);
    expect(context).not.toHaveProperty('contextId');
    assertRecursivelyFrozen(context);
    expect(isPlannedOutfitContext(context)).toBe(true);

    input.child.name = 'Mutert barn';
    input.place.label = 'Mutert sted';
    input.weather.tempC = 99;
    input.recommendation.orderedGarments[0] = 'Mutert plagg';
    input.access.allowed = false;
    expect(context).toMatchObject({
      child: original.child,
      place: original.place,
      weather: original.weather,
      recommendation: original.recommendation,
      access: original.access,
    });
  });

  it('is byte-stable for canonical Unicode input and changes identity for every planned dimension', async () => {
    const { createPlannedOutfitContext } = await loadContract();
    const canonical = completeInput();
    const decomposed = cloneInput(canonical);
    decomposed.child.name = 'A\u030Ase';
    decomposed.place.label = 'Pro\u0308vested';
    const precomposed = cloneInput(canonical);
    precomposed.child.name = 'Åse';
    precomposed.place.label = 'Prövested';

    expect(JSON.stringify(createPlannedOutfitContext(decomposed))).toBe(
      JSON.stringify(createPlannedOutfitContext(precomposed)),
    );
    expect(JSON.stringify(createPlannedOutfitContext(canonical))).toBe(
      JSON.stringify(createPlannedOutfitContext(cloneInput(canonical))),
    );

    const baseId = createPlannedOutfitContext(canonical).plannedContextId;
    const mutations: readonly ((draft: MutablePlannedContextInput) => void)[] = [
      (draft) => { draft.planningEventId = 'planning-event-future-12'; },
      (draft) => { draft.transitionContextId = 'transition-future-12'; },
      (draft) => { draft.child.id = 'et-annet-barn'; },
      (draft) => { draft.child.name = 'Et annet navn'; },
      (draft) => { draft.child.ageMonths = 6; },
      (draft) => { draft.plannedForIso = '2026-02-12T12:00:00.000Z'; },
      (draft) => { draft.place.label = 'Et annet sted'; },
      (draft) => { draft.place.lat = 60; },
      (draft) => { draft.place.lon = 10; },
      (draft) => { draft.place.source = 'fixed-home'; },
      (draft) => { draft.activity = 'utelek'; draft.vognMode = null; },
      (draft) => { draft.vognMode = 'awake'; },
      (draft) => { draft.weather.tempC = 2; },
      (draft) => { draft.weather.feelsLikeC = -1; },
      (draft) => { draft.weather.windMs = 4; },
      (draft) => { draft.weather.precipMmH = 0; },
      (draft) => { draft.weather.symbolCode = 'partlycloudy_day'; },
      (draft) => { draft.recommendation.id = 'finalized-recommendation-02'; },
      (draft) => { draft.recommendation.fingerprint = 'synthetic:changed'; },
      (draft) => { draft.recommendation.orderedGarments.push('Balaklava'); },
      (draft) => { draft.recommendation.equipment.push('Regntrekk'); },
      (draft) => { draft.access.capability = 'extra_places'; },
      (draft) => { draft.access.allowed = false; draft.access.reason = 'expired'; },
    ];

    for (const mutate of mutations) {
      const changed = cloneInput(canonical);
      mutate(changed);
      expect(createPlannedOutfitContext(changed).plannedContextId).not.toBe(baseId);
    }
  });

  it.each(['configured-place', 'fixed-home', 'automatic'])(
    'accepts the closed place source %s and exact coordinate boundaries',
    async (source) => {
      const { createPlannedOutfitContext } = await loadContract();
      const northEast = completeInput();
      northEast.place = { ...northEast.place, source, lat: 90, lon: 180 };
      const southWest = completeInput();
      southWest.place = { ...southWest.place, source, lat: -90, lon: -180 };
      expect(createPlannedOutfitContext(northEast)).toMatchObject({ place: northEast.place });
      expect(createPlannedOutfitContext(southWest)).toMatchObject({ place: southWest.place });
    },
  );

  it('rejects missing, partial, defaultable, aliased, and malformed creation input', async () => {
    const { createPlannedOutfitContext } = await loadContract();
    const invalidInputs: unknown[] = [
      undefined,
      null,
      {},
      { ...completeInput(), planningEventId: '' },
      { ...completeInput(), transitionContextId: 'planning-event-future-11' },
      { ...completeInput(), plannedForIso: '2026-02-30T11:00:00.000Z' },
      { ...completeInput(), timeZone: 'UTC' },
      { ...completeInput(), child: { ...completeInput().child, id: '' } },
      { ...completeInput(), child: { ...completeInput().child, name: '   ' } },
      { ...completeInput(), child: { ...completeInput().child, ageMonths: -1 } },
      { ...completeInput(), child: { ...completeInput().child, ageMonths: 5.5 } },
      { ...completeInput(), child: { ...completeInput().child, ageMonths: 25 } },
      { ...completeInput(), place: { ...completeInput().place, label: '' } },
      { ...completeInput(), place: { ...completeInput().place, lat: Number.NaN } },
      { ...completeInput(), place: { ...completeInput().place, lat: 90.0001 } },
      { ...completeInput(), place: { ...completeInput().place, lon: Number.POSITIVE_INFINITY } },
      { ...completeInput(), place: { ...completeInput().place, lon: -180.0001 } },
      { ...completeInput(), place: { ...completeInput().place, source: 'current-device' } },
      { ...completeInput(), activity: 'bil' },
      { ...completeInput(), vognMode: 'unknown' },
      { ...completeInput(), activity: 'utelek', vognMode: 'awake' },
      { ...completeInput(), activity: 'vogn', vognMode: null },
      { ...completeInput(), weather: { ...completeInput().weather, tempC: Number.NaN } },
      { ...completeInput(), weather: { ...completeInput().weather, feelsLikeC: Number.POSITIVE_INFINITY } },
      { ...completeInput(), weather: { ...completeInput().weather, windMs: -0.1 } },
      { ...completeInput(), weather: { ...completeInput().weather, precipMmH: -0.1 } },
      { ...completeInput(), weather: { ...completeInput().weather, symbolCode: '' } },
      { ...completeInput(), recommendation: { ...completeInput().recommendation, finalized: false } },
      { ...completeInput(), recommendation: { ...completeInput().recommendation, id: '' } },
      { ...completeInput(), recommendation: { ...completeInput().recommendation, fingerprint: '' } },
      { ...completeInput(), recommendation: { ...completeInput().recommendation, orderedGarments: [] } },
      {
        ...completeInput(),
        recommendation: { ...completeInput().recommendation, orderedGarments: ['Ullbody', '  '] },
      },
      { ...completeInput(), access: { ...completeInput().access, capability: 'unknown' } },
      { ...completeInput(), access: { ...completeInput().access, allowed: false } },
      { ...completeInput(), access: { ...completeInput().access, reason: 'role_denied' } },
    ];

    for (const invalid of invalidInputs) {
      expect(() => createPlannedOutfitContext(invalid)).toThrow(/PlannedOutfitContext/u);
    }
  });

  it('uses a total tolerant guard that rejects mutable, partial, tampered, circular, and hostile values', async () => {
    const { createPlannedOutfitContext, isPlannedOutfitContext } = await loadContract();
    const valid = createPlannedOutfitContext(completeInput());
    const mutableClone = structuredClone(valid);
    const tampered = structuredClone(valid) as Record<string, unknown>;
    tampered.plannedContextId = 'planned-context-0000000000000000';
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const hostile = new Proxy({}, {
      get() {
        throw new Error('hostile getter');
      },
    });
    const unknownValues: unknown[] = [
      undefined,
      null,
      false,
      0,
      Number.NaN,
      '',
      Symbol('context'),
      1n,
      [],
      {},
      { schemaVersion: 1 },
      mutableClone,
      tampered,
      circular,
      hostile,
    ];

    for (const value of unknownValues) {
      expect(() => isPlannedOutfitContext(value)).not.toThrow();
      expect(isPlannedOutfitContext(value)).toBe(false);
    }
    expect(isPlannedOutfitContext(valid)).toBe(true);
  });

  it('copies only known keys and has no persistence, URL, logging, tracking, or network capability', async () => {
    const { createPlannedOutfitContext } = await loadContract();
    const input = completeInput() as MutablePlannedContextInput & {
      inheritedSecret?: string;
      extra?: string;
    };
    Object.setPrototypeOf(input, { inheritedSecret: 'must-not-cross-boundary' });
    input.extra = 'must-not-cross-boundary';
    const context = createPlannedOutfitContext(input);
    expect(context).not.toHaveProperty('extra');
    expect(context).not.toHaveProperty('inheritedSecret');

    const sourcePath = '../planned-outfit-context.ts?raw';
    const sourceModule = await import(/* @vite-ignore */ sourcePath) as { default: string };
    expect(sourceModule.default).not.toMatch(
      /\b(?:localStorage|sessionStorage|indexedDB|fetch|XMLHttpRequest|WebSocket|sendBeacon|console|posthog|analytics|track|pushState|replaceState|URLSearchParams)\b/u,
    );
    expect(sourceModule.default).not.toMatch(/\bcontextId\b/u);
  });
});
