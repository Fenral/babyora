import type { AccessDecision, Capability } from '../access/capabilities.js';
import { parseStrictIsoInstant } from '../met-no/types.js';
import type { Activity } from '../wool-layers/types.js';

export const PLAN_TIME_ZONE = 'Europe/Oslo' as const;

const PLANNED_CONTEXT_SCHEMA_VERSION = 1 as const;
const ownedPlannedContexts = new WeakSet<object>();

const ACTIVITIES: readonly Activity[] = ['vogn', 'baeresele', 'utelek', 'soevn'];
const PLACE_SOURCES = ['configured-place', 'fixed-home', 'automatic'] as const;
const VOGN_MODES = ['awake', 'sleeping'] as const;
const CAPABILITIES: readonly Capability[] = [
  'today_home',
  'morning_reminder',
  'safety_guides',
  'future_plan',
  'automatic_location',
  'extra_places',
  'extra_children',
  'family_sharing',
  'personal_calibration',
  'smart_notifications',
  'widget',
];
const FREE_CAPABILITIES: readonly Capability[] = [
  'today_home',
  'morning_reminder',
  'safety_guides',
];
const AUTH_CAPABILITIES: readonly Capability[] = [
  'family_sharing',
  'personal_calibration',
  'smart_notifications',
];
const ACCESS_REASONS: readonly AccessDecision['reason'][] = [
  'free',
  'plus',
  'loading',
  'signed_out',
  'expired',
  'role_denied',
];

type PlaceSource = typeof PLACE_SOURCES[number];
type VognMode = typeof VOGN_MODES[number] | null;

type PlannedChild = Readonly<{
  id: string;
  name: string;
  ageMonths: number;
}>;

type PlannedPlace = Readonly<{
  label: string;
  lat: number;
  lon: number;
  source: PlaceSource;
}>;

type PlannedWeather = Readonly<{
  tempC: number;
  feelsLikeC: number;
  windMs: number;
  precipMmH: number;
  symbolCode: string;
}>;

type PlannedRecommendation = Readonly<{
  id: string;
  fingerprint: string;
  orderedGarments: readonly string[];
  equipment: readonly string[];
  finalized: true;
}>;

type PlannedAccess = Readonly<{
  capability: Capability;
  allowed: boolean;
  reason: AccessDecision['reason'];
}>;

type PlannedOutfitContextInput = Readonly<{
  planningEventId: string;
  transitionContextId: string;
  child: PlannedChild;
  plannedForIso: string;
  timeZone: typeof PLAN_TIME_ZONE;
  place: PlannedPlace;
  activity: Activity;
  vognMode: VognMode;
  weather: PlannedWeather;
  recommendation: PlannedRecommendation;
  access: PlannedAccess;
}>;

export type PlannedOutfitContext = Readonly<{
  schemaVersion: typeof PLANNED_CONTEXT_SCHEMA_VERSION;
  plannedContextId: string;
  planningEventId: string;
  transitionContextId: string;
  child: PlannedChild;
  plannedForIso: string;
  timeZone: typeof PLAN_TIME_ZONE;
  place: PlannedPlace;
  activity: Activity;
  vognMode: VognMode;
  weather: PlannedWeather;
  recommendation: PlannedRecommendation;
  access: PlannedAccess;
}>;

function fail(path: string, reason: string): never {
  throw new Error(`Invalid PlannedOutfitContext input at ${path}: ${reason}`);
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function recordAt(value: unknown, path: string): Readonly<Record<string, unknown>> {
  if (!isRecord(value)) fail(path, 'expected an object');
  if (Object.getPrototypeOf(value) !== Object.prototype) fail(path, 'expected a plain object');
  return value;
}

function ownDataValue(
  value: Readonly<Record<string, unknown>>,
  key: string,
  path: string,
): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  if (!descriptor) fail(path, 'missing required field');
  if (!Object.hasOwn(descriptor, 'value')) fail(path, 'expected a data property');
  return descriptor.value;
}

function normalizedText(value: unknown, path: string): string {
  if (typeof value !== 'string') fail(path, 'expected a string');
  const normalized = value.normalize('NFC').trim();
  if (normalized.length === 0) fail(path, 'must not be empty');
  if (
    /\p{Cc}/u.test(normalized)
    || /[\u061c\u200b\u200e\u200f\u202a-\u202e\u2060\u2066-\u2069\ufeff]/u.test(normalized)
  ) {
    fail(path, 'must not contain control characters');
  }
  return normalized;
}

function finiteNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail(path, 'expected a finite number');
  return Object.is(value, -0) ? 0 : value;
}

function normalizedStringList(value: unknown, path: string, allowEmpty: boolean): string[] {
  if (!Array.isArray(value)) fail(path, 'expected an array');
  if (Object.getPrototypeOf(value) !== Array.prototype) fail(path, 'expected a plain array');
  const normalized: string[] = [];
  for (let index = 0; index < value.length; index++) {
    const descriptor = Object.getOwnPropertyDescriptor(value, String(index));
    if (!descriptor) fail(`${path}[${index}]`, 'missing array item');
    if (!Object.hasOwn(descriptor, 'value')) fail(`${path}[${index}]`, 'expected a data property');
    normalized.push(normalizedText(descriptor.value, `${path}[${index}]`));
  }
  if (!allowEmpty && normalized.length === 0) fail(path, 'must contain at least one item');
  if (new Set(normalized).size !== normalized.length) fail(path, 'must not contain duplicate items');
  return normalized;
}

function normalizedChild(value: unknown): PlannedChild {
  const child = recordAt(value, 'child');
  const ageMonths = finiteNumber(ownDataValue(child, 'ageMonths', 'child.ageMonths'), 'child.ageMonths');
  if (!Number.isInteger(ageMonths) || ageMonths < 0 || ageMonths > 24) {
    fail('child.ageMonths', 'expected an integer from 0 through 24');
  }
  return {
    id: normalizedText(ownDataValue(child, 'id', 'child.id'), 'child.id'),
    name: normalizedText(ownDataValue(child, 'name', 'child.name'), 'child.name'),
    ageMonths,
  };
}

function normalizedPlace(value: unknown): PlannedPlace {
  const place = recordAt(value, 'place');
  const lat = finiteNumber(ownDataValue(place, 'lat', 'place.lat'), 'place.lat');
  const lon = finiteNumber(ownDataValue(place, 'lon', 'place.lon'), 'place.lon');
  const source = ownDataValue(place, 'source', 'place.source');
  if (lat < -90 || lat > 90) fail('place.lat', 'expected a value from -90 through 90');
  if (lon < -180 || lon > 180) fail('place.lon', 'expected a value from -180 through 180');
  if (
    typeof source !== 'string'
    || !(PLACE_SOURCES as readonly string[]).includes(source)
  ) {
    fail('place.source', 'expected configured-place, fixed-home, or automatic');
  }
  return {
    label: normalizedText(ownDataValue(place, 'label', 'place.label'), 'place.label'),
    lat,
    lon,
    source: source as PlaceSource,
  };
}

function normalizedSituation(
  activityValue: unknown,
  vognModeValue: unknown,
): Readonly<{ activity: Activity; vognMode: VognMode }> {
  if (
    typeof activityValue !== 'string'
    || !(ACTIVITIES as readonly string[]).includes(activityValue)
  ) {
    fail('activity', 'expected vogn, baeresele, utelek, or soevn');
  }
  const activity = activityValue as Activity;
  if (activity === 'vogn') {
    if (
      typeof vognModeValue !== 'string'
      || !(VOGN_MODES as readonly string[]).includes(vognModeValue)
    ) {
      fail('vognMode', 'vogn requires awake or sleeping');
    }
    return { activity, vognMode: vognModeValue as Exclude<VognMode, null> };
  }
  if (vognModeValue !== null) fail('vognMode', 'non-vogn activity requires null');
  return { activity, vognMode: null };
}

function normalizedWeather(value: unknown): PlannedWeather {
  const weather = recordAt(value, 'weather');
  const windMs = finiteNumber(ownDataValue(weather, 'windMs', 'weather.windMs'), 'weather.windMs');
  const precipMmH = finiteNumber(
    ownDataValue(weather, 'precipMmH', 'weather.precipMmH'),
    'weather.precipMmH',
  );
  if (windMs < 0) fail('weather.windMs', 'must be at least zero');
  if (precipMmH < 0) fail('weather.precipMmH', 'must be at least zero');
  return {
    tempC: finiteNumber(ownDataValue(weather, 'tempC', 'weather.tempC'), 'weather.tempC'),
    feelsLikeC: finiteNumber(
      ownDataValue(weather, 'feelsLikeC', 'weather.feelsLikeC'),
      'weather.feelsLikeC',
    ),
    windMs,
    precipMmH,
    symbolCode: normalizedText(
      ownDataValue(weather, 'symbolCode', 'weather.symbolCode'),
      'weather.symbolCode',
    ),
  };
}

function normalizedRecommendation(value: unknown): PlannedRecommendation {
  const recommendation = recordAt(value, 'recommendation');
  if (ownDataValue(recommendation, 'finalized', 'recommendation.finalized') !== true) {
    fail('recommendation.finalized', 'expected true');
  }
  const orderedGarments = normalizedStringList(
    ownDataValue(recommendation, 'orderedGarments', 'recommendation.orderedGarments'),
    'recommendation.orderedGarments',
    false,
  );
  const equipment = normalizedStringList(
    ownDataValue(recommendation, 'equipment', 'recommendation.equipment'),
    'recommendation.equipment',
    true,
  );
  const equipmentSet = new Set(equipment);
  if (orderedGarments.some((garment) => equipmentSet.has(garment))) {
    fail('recommendation', 'garments and equipment must not overlap');
  }
  return {
    id: normalizedText(ownDataValue(recommendation, 'id', 'recommendation.id'), 'recommendation.id'),
    fingerprint: normalizedText(
      ownDataValue(recommendation, 'fingerprint', 'recommendation.fingerprint'),
      'recommendation.fingerprint',
    ),
    orderedGarments,
    equipment,
    finalized: true,
  };
}

function normalizedAccess(value: unknown): PlannedAccess {
  const access = recordAt(value, 'access');
  const capability = ownDataValue(access, 'capability', 'access.capability');
  const allowed = ownDataValue(access, 'allowed', 'access.allowed');
  const reason = ownDataValue(access, 'reason', 'access.reason');
  if (
    typeof capability !== 'string'
    || !(CAPABILITIES as readonly string[]).includes(capability)
  ) {
    fail('access.capability', 'expected a known capability');
  }
  if (typeof allowed !== 'boolean') fail('access.allowed', 'expected a boolean');
  if (
    typeof reason !== 'string'
    || !(ACCESS_REASONS as readonly string[]).includes(reason)
  ) {
    fail('access.reason', 'expected a known access reason');
  }
  const typedCapability = capability as Capability;
  const typedReason = reason as AccessDecision['reason'];
  const isFreeCapability = FREE_CAPABILITIES.includes(typedCapability);
  const needsAuthentication = AUTH_CAPABILITIES.includes(typedCapability);
  const isConsistent = typedReason === 'loading'
    ? !allowed
    : isFreeCapability
      ? allowed && typedReason === 'free'
      : typedReason === 'plus'
        ? allowed
        : !allowed && (
          typedReason === 'expired'
          || (needsAuthentication && (typedReason === 'signed_out' || typedReason === 'role_denied'))
        );
  if (!isConsistent) fail('access', 'capability, allowed, and reason disagree');
  return {
    capability: typedCapability,
    allowed,
    reason: typedReason,
  };
}

function normalizedInput(input: unknown): PlannedOutfitContextInput {
  const value = recordAt(input, 'root');
  const planningEventId = normalizedText(
    ownDataValue(value, 'planningEventId', 'planningEventId'),
    'planningEventId',
  );
  const transitionContextId = normalizedText(
    ownDataValue(value, 'transitionContextId', 'transitionContextId'),
    'transitionContextId',
  );
  if (planningEventId === transitionContextId) {
    fail('transitionContextId', 'must differ from planningEventId');
  }
  const timeZone = ownDataValue(value, 'timeZone', 'timeZone');
  if (timeZone !== PLAN_TIME_ZONE) fail('timeZone', `expected ${PLAN_TIME_ZONE}`);
  const plannedForIso = ownDataValue(value, 'plannedForIso', 'plannedForIso');
  const epochMs = parseStrictIsoInstant(plannedForIso);
  if (epochMs === null) fail('plannedForIso', 'expected a valid absolute ISO instant');
  const situation = normalizedSituation(
    ownDataValue(value, 'activity', 'activity'),
    ownDataValue(value, 'vognMode', 'vognMode'),
  );
  return {
    planningEventId,
    transitionContextId,
    child: normalizedChild(ownDataValue(value, 'child', 'child')),
    plannedForIso: new Date(epochMs).toISOString(),
    timeZone: PLAN_TIME_ZONE,
    place: normalizedPlace(ownDataValue(value, 'place', 'place')),
    activity: situation.activity,
    vognMode: situation.vognMode,
    weather: normalizedWeather(ownDataValue(value, 'weather', 'weather')),
    recommendation: normalizedRecommendation(
      ownDataValue(value, 'recommendation', 'recommendation'),
    ),
    access: normalizedAccess(ownDataValue(value, 'access', 'access')),
  };
}

function identityContent(input: PlannedOutfitContextInput): string {
  return JSON.stringify([
    PLANNED_CONTEXT_SCHEMA_VERSION,
    input.planningEventId,
    input.transitionContextId,
    [input.child.id, input.child.name, input.child.ageMonths],
    input.plannedForIso,
    input.timeZone,
    [input.place.label, input.place.lat, input.place.lon, input.place.source],
    input.activity,
    input.vognMode,
    [
      input.weather.tempC,
      input.weather.feelsLikeC,
      input.weather.windMs,
      input.weather.precipMmH,
      input.weather.symbolCode,
    ],
    [
      input.recommendation.id,
      input.recommendation.fingerprint,
      [...input.recommendation.orderedGarments],
      [...input.recommendation.equipment],
      input.recommendation.finalized,
    ],
    [input.access.capability, input.access.allowed, input.access.reason],
  ]);
}

function fnv1a64(value: string): string {
  let hash = 0xcbf29ce484222325n;
  for (const byte of new TextEncoder().encode(value)) {
    hash ^= BigInt(byte);
    hash = BigInt.asUintN(64, hash * 0x100000001b3n);
  }
  return hash.toString(16).padStart(16, '0');
}

function recursivelyFreeze<T>(value: T): T {
  if (typeof value !== 'object' || value === null || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) recursivelyFreeze(nested);
  return Object.freeze(value);
}

function sameFrozenKnownShape(actual: unknown, expected: unknown): boolean {
  if (typeof expected !== 'object' || expected === null) return Object.is(actual, expected);
  if (typeof actual !== 'object' || actual === null || !Object.isFrozen(actual)) return false;
  if (Object.getPrototypeOf(actual) !== Object.getPrototypeOf(expected)) return false;
  const actualKeys = Reflect.ownKeys(actual);
  const expectedKeys = Reflect.ownKeys(expected);
  if (
    actualKeys.length !== expectedKeys.length
    || expectedKeys.some((key) => !Object.hasOwn(actual, key))
  ) {
    return false;
  }
  return expectedKeys.every((key) => {
    const actualDescriptor = Object.getOwnPropertyDescriptor(actual, key);
    const expectedDescriptor = Object.getOwnPropertyDescriptor(expected, key);
    if (
      !actualDescriptor
      || !expectedDescriptor
      || !Object.hasOwn(actualDescriptor, 'value')
      || !Object.hasOwn(expectedDescriptor, 'value')
      || actualDescriptor.enumerable !== expectedDescriptor.enumerable
      || actualDescriptor.configurable !== expectedDescriptor.configurable
      || actualDescriptor.writable !== expectedDescriptor.writable
    ) {
      return false;
    }
    return sameFrozenKnownShape(actualDescriptor.value, expectedDescriptor.value);
  });
}

export function createPlannedOutfitContext(input: unknown): PlannedOutfitContext {
  try {
    const normalized = normalizedInput(input);
    const plannedContextId = `planned-context-${fnv1a64(identityContent(normalized))}`;
    if (
      plannedContextId === normalized.planningEventId
      || plannedContextId === normalized.transitionContextId
    ) {
      fail('plannedContextId', 'must differ from caller-supplied identifiers');
    }
    const context = recursivelyFreeze({
      schemaVersion: PLANNED_CONTEXT_SCHEMA_VERSION,
      plannedContextId,
      planningEventId: normalized.planningEventId,
      transitionContextId: normalized.transitionContextId,
      child: { ...normalized.child },
      plannedForIso: normalized.plannedForIso,
      timeZone: normalized.timeZone,
      place: { ...normalized.place },
      activity: normalized.activity,
      vognMode: normalized.vognMode,
      weather: { ...normalized.weather },
      recommendation: {
        ...normalized.recommendation,
        orderedGarments: [...normalized.recommendation.orderedGarments],
        equipment: [...normalized.recommendation.equipment],
      },
      access: { ...normalized.access },
    });
    ownedPlannedContexts.add(context);
    return context;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid PlannedOutfitContext input')) {
      throw error;
    }
    throw new Error('Invalid PlannedOutfitContext input: unreadable or malformed value', {
      cause: error,
    });
  }
}

export function isPlannedOutfitContext(value: unknown): value is PlannedOutfitContext {
  try {
    if (
      !isRecord(value)
      || !ownedPlannedContexts.has(value)
      || value.schemaVersion !== PLANNED_CONTEXT_SCHEMA_VERSION
    ) {
      return false;
    }
    const expected = createPlannedOutfitContext({
      planningEventId: value.planningEventId,
      transitionContextId: value.transitionContextId,
      child: value.child,
      plannedForIso: value.plannedForIso,
      timeZone: value.timeZone,
      place: value.place,
      activity: value.activity,
      vognMode: value.vognMode,
      weather: value.weather,
      recommendation: value.recommendation,
      access: value.access,
    });
    return sameFrozenKnownShape(value, expected);
  } catch {
    return false;
  }
}
