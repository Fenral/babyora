import type { AccessDecision, Capability } from '../access/capabilities.js';
import { parseStrictIsoInstant } from '../met-no/types.js';
import type { Activity } from '../wool-layers/types.js';

export const PLAN_TIME_ZONE = 'Europe/Oslo' as const;

const PLANNED_CONTEXT_SCHEMA_VERSION = 1 as const;

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
  return value;
}

function requireOwnKeys(
  value: Readonly<Record<string, unknown>>,
  keys: readonly string[],
  path: string,
): void {
  for (const key of keys) {
    if (!Object.hasOwn(value, key)) fail(`${path}.${key}`, 'missing required field');
  }
}

function normalizedText(value: unknown, path: string): string {
  if (typeof value !== 'string') fail(path, 'expected a string');
  const normalized = value.normalize('NFC').trim();
  if (normalized.length === 0) fail(path, 'must not be empty');
  if ([...normalized].some((character) => {
    const codePoint = character.codePointAt(0);
    return codePoint !== undefined && (codePoint <= 31 || codePoint === 127);
  })) {
    fail(path, 'must not contain control characters');
  }
  return normalized;
}

function finiteNumber(value: unknown, path: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) fail(path, 'expected a finite number');
  return value;
}

function normalizedStringList(value: unknown, path: string, allowEmpty: boolean): string[] {
  if (!Array.isArray(value)) fail(path, 'expected an array');
  const normalized = value.map((item, index) => normalizedText(item, `${path}[${index}]`));
  if (!allowEmpty && normalized.length === 0) fail(path, 'must contain at least one item');
  if (new Set(normalized).size !== normalized.length) fail(path, 'must not contain duplicate items');
  return normalized;
}

function normalizedChild(value: unknown): PlannedChild {
  const child = recordAt(value, 'child');
  requireOwnKeys(child, ['id', 'name', 'ageMonths'], 'child');
  const ageMonths = finiteNumber(child.ageMonths, 'child.ageMonths');
  if (!Number.isInteger(ageMonths) || ageMonths < 0 || ageMonths > 24) {
    fail('child.ageMonths', 'expected an integer from 0 through 24');
  }
  return {
    id: normalizedText(child.id, 'child.id'),
    name: normalizedText(child.name, 'child.name'),
    ageMonths,
  };
}

function normalizedPlace(value: unknown): PlannedPlace {
  const place = recordAt(value, 'place');
  requireOwnKeys(place, ['label', 'lat', 'lon', 'source'], 'place');
  const lat = finiteNumber(place.lat, 'place.lat');
  const lon = finiteNumber(place.lon, 'place.lon');
  if (lat < -90 || lat > 90) fail('place.lat', 'expected a value from -90 through 90');
  if (lon < -180 || lon > 180) fail('place.lon', 'expected a value from -180 through 180');
  if (
    typeof place.source !== 'string'
    || !(PLACE_SOURCES as readonly string[]).includes(place.source)
  ) {
    fail('place.source', 'expected configured-place, fixed-home, or automatic');
  }
  return {
    label: normalizedText(place.label, 'place.label'),
    lat,
    lon,
    source: place.source as PlaceSource,
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
  requireOwnKeys(
    weather,
    ['tempC', 'feelsLikeC', 'windMs', 'precipMmH', 'symbolCode'],
    'weather',
  );
  const windMs = finiteNumber(weather.windMs, 'weather.windMs');
  const precipMmH = finiteNumber(weather.precipMmH, 'weather.precipMmH');
  if (windMs < 0) fail('weather.windMs', 'must be at least zero');
  if (precipMmH < 0) fail('weather.precipMmH', 'must be at least zero');
  return {
    tempC: finiteNumber(weather.tempC, 'weather.tempC'),
    feelsLikeC: finiteNumber(weather.feelsLikeC, 'weather.feelsLikeC'),
    windMs,
    precipMmH,
    symbolCode: normalizedText(weather.symbolCode, 'weather.symbolCode'),
  };
}

function normalizedRecommendation(value: unknown): PlannedRecommendation {
  const recommendation = recordAt(value, 'recommendation');
  requireOwnKeys(
    recommendation,
    ['id', 'fingerprint', 'orderedGarments', 'equipment', 'finalized'],
    'recommendation',
  );
  if (recommendation.finalized !== true) fail('recommendation.finalized', 'expected true');
  return {
    id: normalizedText(recommendation.id, 'recommendation.id'),
    fingerprint: normalizedText(recommendation.fingerprint, 'recommendation.fingerprint'),
    orderedGarments: normalizedStringList(
      recommendation.orderedGarments,
      'recommendation.orderedGarments',
      false,
    ),
    equipment: normalizedStringList(recommendation.equipment, 'recommendation.equipment', true),
    finalized: true,
  };
}

function normalizedAccess(value: unknown): PlannedAccess {
  const access = recordAt(value, 'access');
  requireOwnKeys(access, ['capability', 'allowed', 'reason'], 'access');
  if (
    typeof access.capability !== 'string'
    || !(CAPABILITIES as readonly string[]).includes(access.capability)
  ) {
    fail('access.capability', 'expected a known capability');
  }
  if (typeof access.allowed !== 'boolean') fail('access.allowed', 'expected a boolean');
  if (
    typeof access.reason !== 'string'
    || !(ACCESS_REASONS as readonly string[]).includes(access.reason)
  ) {
    fail('access.reason', 'expected a known access reason');
  }
  const reasonAllows = access.reason === 'free' || access.reason === 'plus';
  if (access.allowed !== reasonAllows) fail('access', 'allowed and reason disagree');
  return {
    capability: access.capability as Capability,
    allowed: access.allowed,
    reason: access.reason as AccessDecision['reason'],
  };
}

function normalizedInput(input: unknown): PlannedOutfitContextInput {
  const value = recordAt(input, 'root');
  requireOwnKeys(
    value,
    [
      'planningEventId',
      'transitionContextId',
      'child',
      'plannedForIso',
      'timeZone',
      'place',
      'activity',
      'vognMode',
      'weather',
      'recommendation',
      'access',
    ],
    'root',
  );
  const planningEventId = normalizedText(value.planningEventId, 'planningEventId');
  const transitionContextId = normalizedText(value.transitionContextId, 'transitionContextId');
  if (planningEventId === transitionContextId) {
    fail('transitionContextId', 'must differ from planningEventId');
  }
  if (value.timeZone !== PLAN_TIME_ZONE) fail('timeZone', `expected ${PLAN_TIME_ZONE}`);
  const epochMs = parseStrictIsoInstant(value.plannedForIso);
  if (epochMs === null) fail('plannedForIso', 'expected a valid absolute ISO instant');
  const situation = normalizedSituation(value.activity, value.vognMode);
  return {
    planningEventId,
    transitionContextId,
    child: normalizedChild(value.child),
    plannedForIso: new Date(epochMs).toISOString(),
    timeZone: PLAN_TIME_ZONE,
    place: normalizedPlace(value.place),
    activity: situation.activity,
    vognMode: situation.vognMode,
    weather: normalizedWeather(value.weather),
    recommendation: normalizedRecommendation(value.recommendation),
    access: normalizedAccess(value.access),
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
  if (Array.isArray(expected)) {
    return (
      Array.isArray(actual)
      && actual.length === expected.length
      && expected.every((item, index) => sameFrozenKnownShape(actual[index], item))
    );
  }
  if (Array.isArray(actual)) return false;
  const actualKeys = Reflect.ownKeys(actual);
  const expectedKeys = Reflect.ownKeys(expected);
  if (
    actualKeys.length !== expectedKeys.length
    || expectedKeys.some((key) => !Object.hasOwn(actual, key))
  ) {
    return false;
  }
  return expectedKeys.every((key) => sameFrozenKnownShape(
    (actual as Readonly<Record<PropertyKey, unknown>>)[key],
    (expected as Readonly<Record<PropertyKey, unknown>>)[key],
  ));
}

export function createPlannedOutfitContext(input: unknown): PlannedOutfitContext {
  try {
    const normalized = normalizedInput(input);
    const plannedContextId = `planned-context-${fnv1a64(identityContent(normalized))}`;
    return recursivelyFreeze({
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
    if (!isRecord(value) || value.schemaVersion !== PLANNED_CONTEXT_SCHEMA_VERSION) return false;
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
