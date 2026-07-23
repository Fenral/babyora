import { describe, expect, it } from 'vitest';
import {
  planningAccessFixture,
  planningChildFixture,
  planningFinalizedRecommendationFixture,
  planningLocationFixture,
} from './planlegg-fixtures.js';
import {
  createPlannedOutfitContext,
  isPlannedOutfitContext,
  PLAN_TIME_ZONE,
} from '../planned-outfit-context.js';

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

function frozenContextWith(
  context: Readonly<Record<string, unknown>>,
  overrides: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  return Object.freeze({ ...context, ...overrides });
}

describe('Planned Outfit exact-context contracts', () => {
  it('exports the fixed timezone, strict constructor, and tolerant guard', () => {
    expect(PLAN_TIME_ZONE).toBe('Europe/Oslo');
    expect(createPlannedOutfitContext).toBeTypeOf('function');
    expect(isPlannedOutfitContext).toBeTypeOf('function');
  });

  it('freezes a complete known-key clone and keeps the three identities distinct', () => {
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

  it('is byte-stable for canonical Unicode input and changes identity for every planned dimension', () => {
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
    (source) => {
      const northEast = completeInput();
      northEast.place = { ...northEast.place, source, lat: 90, lon: 180 };
      const southWest = completeInput();
      southWest.place = { ...southWest.place, source, lat: -90, lon: -180 };
      expect(createPlannedOutfitContext(northEast)).toMatchObject({ place: northEast.place });
      expect(createPlannedOutfitContext(southWest)).toMatchObject({ place: southWest.place });
    },
  );

  it('rejects missing, partial, defaultable, aliased, and malformed creation input', () => {
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

  it('uses a total tolerant guard that rejects mutable, partial, tampered, circular, and hostile values', () => {
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

  it('RED_REJECTS_SPARSE_AND_PROTOTYPE_BACKED_RECOMMENDATION_ARRAYS', () => {
    const sparseGarments = completeInput();
    sparseGarments.recommendation.orderedGarments = new Array<string>(1);
    const sparseEquipment = completeInput();
    sparseEquipment.recommendation.equipment = new Array<string>(1);

    class GarmentArray extends Array<string> {}
    const subclassGarments = completeInput();
    subclassGarments.recommendation.orderedGarments = new GarmentArray('Ullbody');

    const inheritedGarments = completeInput();
    const prototype = Object.assign(Object.create(Array.prototype) as string[], {
      0: 'Ullbody',
    });
    const prototypeBacked = new Array<string>(1);
    Object.setPrototypeOf(prototypeBacked, prototype);
    inheritedGarments.recommendation.orderedGarments = prototypeBacked;

    for (const invalid of [
      sparseGarments,
      sparseEquipment,
      subclassGarments,
      inheritedGarments,
    ]) {
      expect(() => createPlannedOutfitContext(invalid)).toThrow(/PlannedOutfitContext/u);
    }
  });

  it('RED_REJECTS_ROOT_AND_NESTED_ACCESSORS_AND_NON_PLAIN_INPUTS', () => {
    const rootAccessor = completeInput();
    Object.defineProperty(rootAccessor, 'plannedForIso', {
      enumerable: true,
      get: () => '2026-02-12T11:00:00.000Z',
    });

    const nestedAccessor = completeInput();
    Object.defineProperty(nestedAccessor.place, 'source', {
      enumerable: true,
      get: () => 'configured-place',
    });

    const nonPlain = completeInput();
    Object.setPrototypeOf(nonPlain, { inheritedSecret: 'must-not-cross-boundary' });

    for (const invalid of [rootAccessor, nestedAccessor, nonPlain]) {
      expect(() => createPlannedOutfitContext(invalid)).toThrow(/PlannedOutfitContext/u);
    }
  });

  it('RED_GUARD_REJECTS_ACCESSOR_PROTOTYPE_AND_ARRAY_FORGERIES', () => {
    const valid = createPlannedOutfitContext(completeInput());
    const validRecord = valid as Readonly<Record<string, unknown>>;

    let rootBacking = valid.plannedContextId;
    const accessorRoot = { ...valid };
    Object.defineProperty(accessorRoot, 'plannedContextId', {
      enumerable: true,
      get: () => rootBacking,
    });
    Object.freeze(accessorRoot);

    let temperatureBacking = valid.weather.tempC;
    const accessorWeather = { ...valid.weather };
    Object.defineProperty(accessorWeather, 'tempC', {
      enumerable: true,
      get: () => temperatureBacking,
    });
    Object.freeze(accessorWeather);
    const accessorNested = frozenContextWith(validRecord, { weather: accessorWeather });

    const customPrototype = Object.create({ inheritedSecret: 'crossed-boundary' }) as Record<string, unknown>;
    Object.defineProperties(customPrototype, Object.getOwnPropertyDescriptors(valid));
    Object.freeze(customPrototype);

    class GarmentArray extends Array<string> {}
    const subclassGarments = Object.freeze(new GarmentArray(...valid.recommendation.orderedGarments));
    const subclassRecommendation = Object.freeze({
      ...valid.recommendation,
      orderedGarments: subclassGarments,
    });
    const subclassContext = frozenContextWith(validRecord, {
      recommendation: subclassRecommendation,
    });

    const inheritedPrototype = Object.assign(Object.create(Array.prototype) as string[], Object.fromEntries(
      valid.recommendation.orderedGarments.map((garment, index) => [index, garment]),
    ));
    const inheritedArray = new Array<string>(valid.recommendation.orderedGarments.length);
    Object.setPrototypeOf(inheritedArray, inheritedPrototype);
    Object.freeze(inheritedArray);
    const inheritedRecommendation = Object.freeze({
      ...valid.recommendation,
      orderedGarments: inheritedArray,
    });
    const inheritedContext = frozenContextWith(validRecord, {
      recommendation: inheritedRecommendation,
    });

    for (const forgery of [
      accessorRoot,
      accessorNested,
      customPrototype,
      subclassContext,
      inheritedContext,
    ]) {
      expect(isPlannedOutfitContext(forgery)).toBe(false);
    }
    rootBacking = 'planned-context-0000000000000000';
    temperatureBacking = 99;
    expect(accessorRoot.plannedContextId).toBe(rootBacking);
    expect(accessorWeather.tempC).toBe(temperatureBacking);
  });

  it('RED_CANONICALIZES_NEGATIVE_ZERO_BEFORE_IDENTITY_AND_OUTPUT', () => {
    const zero = completeInput();
    zero.place.lat = 0;
    zero.weather.windMs = 0;
    const negativeZero = cloneInput(zero);
    negativeZero.place.lat = -0;
    negativeZero.weather.windMs = -0;

    const zeroContext = createPlannedOutfitContext(zero);
    const negativeZeroContext = createPlannedOutfitContext(negativeZero);
    expect(negativeZeroContext.plannedContextId).toBe(zeroContext.plannedContextId);
    expect(Object.is(negativeZeroContext.place.lat, -0)).toBe(false);
    expect(Object.is(negativeZeroContext.weather.windMs, -0)).toBe(false);
  });

  it('RED_REJECTS_CAPABILITY_REASON_FORGERIES', () => {
    const invalidAccess = [
      { capability: 'future_plan', allowed: true, reason: 'free' },
      { capability: 'today_home', allowed: true, reason: 'plus' },
      { capability: 'extra_places', allowed: false, reason: 'signed_out' },
    ];
    for (const access of invalidAccess) {
      expect(() => createPlannedOutfitContext({ ...completeInput(), access })).toThrow(
        /PlannedOutfitContext/u,
      );
    }

    const validAccess = [
      { capability: 'today_home', allowed: true, reason: 'free' },
      { capability: 'today_home', allowed: false, reason: 'loading' },
      { capability: 'future_plan', allowed: true, reason: 'plus' },
      { capability: 'future_plan', allowed: false, reason: 'expired' },
      { capability: 'family_sharing', allowed: false, reason: 'signed_out' },
      { capability: 'family_sharing', allowed: false, reason: 'role_denied' },
    ];
    for (const access of validAccess) {
      expect(createPlannedOutfitContext({ ...completeInput(), access })).toMatchObject({ access });
    }
  });

  it('RED_REJECTS_DECEPTIVE_UNICODE_CONTROLS_AND_CROSS_CATEGORY_DUPLICATES', () => {
    for (const deceptive of ['barn\u0085navn', 'barn\u202Enavn', 'barn\u200Bnavn']) {
      const input = completeInput();
      input.child.name = deceptive;
      expect(() => createPlannedOutfitContext(input)).toThrow(/PlannedOutfitContext/u);
    }

    const duplicate = completeInput();
    duplicate.recommendation.orderedGarments = ['Vognpose'];
    duplicate.recommendation.equipment = ['Vognpose'];
    expect(() => createPlannedOutfitContext(duplicate)).toThrow(/PlannedOutfitContext/u);
  });

  it('copies only known keys and has no persistence, URL, logging, tracking, or network capability', async () => {
    const input = completeInput() as MutablePlannedContextInput & {
      extra?: string;
    };
    input.extra = 'must-not-cross-boundary';
    const context = createPlannedOutfitContext(input);
    expect(context).not.toHaveProperty('extra');

    const sourcePath = '../planned-outfit-context.ts?raw';
    const sourceModule = await import(/* @vite-ignore */ sourcePath) as { default: string };
    expect(sourceModule.default).not.toMatch(
      /\b(?:localStorage|sessionStorage|indexedDB|fetch|XMLHttpRequest|WebSocket|sendBeacon|console|posthog|analytics|track|pushState|replaceState|URLSearchParams)\b/u,
    );
    expect(sourceModule.default).not.toMatch(/\bcontextId\b/u);
  });
});
