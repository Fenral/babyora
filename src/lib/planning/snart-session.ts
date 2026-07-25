import rawManifest from '../../data/snart/climate-1991-2020-v1.manifest.json';
import type { SnartPlan, SnartPlanInput } from './snart';

export type SnartFixedHome = Readonly<{
  city: string;
  lat: number;
  lon: number;
}>;

export type SnartExactHome = Readonly<{
  homePlaceKey: string;
}>;

export type SnartClimateLookup = Readonly<{
  climateProfileId: string;
  profileVersion: string;
}>;

export type SnartSessionAccess = Readonly<{
  state: 'allowed' | 'denied' | 'neutral';
  allowed: boolean;
  implementationAvailable: boolean;
}>;

export type SnartSessionRequest = Readonly<{
  access: SnartSessionAccess;
  generation: string;
  window: string;
  fixedHome: SnartFixedHome;
  ageEligibleForWholeWindow: boolean;
}>;

export type SnartSessionDependencies<T = SnartPlan> = Readonly<{
  resolveExactHome: (home: SnartFixedHome) => SnartExactHome | null;
  lookupClimateProfile: (homePlaceKey: string) => SnartClimateLookup | null;
  buildModel: (input: SnartPlanInput) => T;
  buildUnavailable?: (reason: string) => T;
}>;

type SnartProjectionInput = Readonly<
  Omit<SnartPlanInput, 'alreadyHaveConceptIds'>
>;

type SnartSessionProjection = Readonly<{
  key: string;
  input: SnartProjectionInput;
}>;

const COORDINATE_SCALE = 10_000;
const COORDINATE_TOLERANCE = 1e-8;

function coordinateE4(
  value: number,
  min: number,
  max: number,
): number | null {
  if (!Number.isFinite(value) || value < min || value > max) return null;
  const scaled = value * COORDINATE_SCALE;
  const integer = Math.round(scaled);
  if (Math.abs(scaled - integer) > COORDINATE_TOLERANCE) return null;
  return Object.is(integer, -0) ? 0 : integer;
}

function normalizeHomeName(value: string): string {
  return value
    .normalize('NFC')
    .trim()
    .replace(/\p{White_Space}+/gu, ' ');
}

/**
 * Exact runtime implementation of home-place-key@1. The derived key must also
 * match one supported binding in the committed manifest; there is no nearest,
 * rounded, automatic-place or effective-place fallback.
 */
export function resolveCommittedSnartHome(
  home: SnartFixedHome,
): SnartExactHome | null {
  try {
    if (
      !home
      || typeof home !== 'object'
      || typeof home.city !== 'string'
      || typeof home.lat !== 'number'
      || typeof home.lon !== 'number'
    ) return null;
    const nameNfc = normalizeHomeName(home.city);
    const latE4 = coordinateE4(home.lat, -90, 90);
    const lonE4 = coordinateE4(home.lon, -180, 180);
    if (!nameNfc || latE4 === null || lonE4 === null) return null;
    const homePlaceKey = `no-city:v1:${encodeURIComponent(
      nameNfc.toLowerCase(),
    )}:${latE4}:${lonE4}`;
    const binding = rawManifest.placeGridBindings.find((candidate) => (
      candidate.status === 'supported'
      && candidate.homePlaceKey === homePlaceKey
      && candidate.nameNfc.toLowerCase() === nameNfc.toLowerCase()
      && candidate.latE4 === latE4
      && candidate.lonE4 === lonE4
      && candidate.profileId === `snart-profile:v2:${homePlaceKey}`
    ));
    return binding ? Object.freeze({ homePlaceKey }) : null;
  } catch {
    return null;
  }
}

function isAllowed(access: SnartSessionAccess): boolean {
  return access.state === 'allowed'
    && access.allowed
    && access.implementationAvailable;
}

function safeToken(value: unknown): value is string {
  return typeof value === 'string'
    && value.length > 0
    && !value.includes('|');
}

export function projectSnartSession<T>(
  request: SnartSessionRequest,
  dependencies: SnartSessionDependencies<T>,
): SnartSessionProjection | null {
  if (!isAllowed(request.access)) return null;
  const exactHome = dependencies.resolveExactHome(request.fixedHome);
  if (!exactHome || !safeToken(exactHome.homePlaceKey)) return null;
  const climate = dependencies.lookupClimateProfile(exactHome.homePlaceKey);
  if (
    !climate
    || !safeToken(climate.climateProfileId)
    || !safeToken(climate.profileVersion)
    || !safeToken(request.generation)
    || !safeToken(request.window)
  ) return null;

  const input: SnartProjectionInput = Object.freeze({
    asOfLocalDate: request.window,
    timezone: 'Europe/Oslo',
    homePlaceKey: exactHome.homePlaceKey,
    climateProfileId: climate.climateProfileId,
    ageEligibleForWholeWindow: request.ageEligibleForWholeWindow,
  });
  return Object.freeze({
    key: [
      request.generation,
      exactHome.homePlaceKey,
      climate.climateProfileId,
      climate.profileVersion,
      request.window,
    ].join('|'),
    input,
  });
}

export function createSnartSessionEvaluator<T = SnartPlan>(
  dependencies: SnartSessionDependencies<T>,
) {
  let boundaryKey: string | null = null;
  let marked = new Set<string>();
  let cached: T | null = null;
  let hasCached = false;
  let lastInput: SnartProjectionInput | null = null;
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of listeners) listener();
  };

  const clear = () => {
    const hadSessionData = boundaryKey !== null
      || marked.size > 0
      || hasCached
      || lastInput !== null;
    boundaryKey = null;
    marked = new Set();
    cached = null;
    hasCached = false;
    lastInput = null;
    if (hadSessionData) notify();
  };

  const evaluate = (request: SnartSessionRequest): T | null => {
    const projection = projectSnartSession(request, dependencies);
    if (!projection) {
      if (isAllowed(request.access) && dependencies.buildUnavailable) {
        clear();
        cached = dependencies.buildUnavailable('unsupported_home');
        hasCached = true;
        notify();
        return cached;
      }
      clear();
      return null;
    }
    if (projection.key !== boundaryKey) {
      boundaryKey = projection.key;
      marked = new Set();
      cached = null;
      hasCached = false;
    }
    lastInput = projection.input;
    if (hasCached) return cached;
    cached = dependencies.buildModel({
      ...projection.input,
      alreadyHaveConceptIds: new Set(marked),
    });
    hasCached = true;
    notify();
    return cached;
  };

  const markAlreadyHave = (conceptId: string): T | null => {
    if (!lastInput || !safeToken(conceptId)) return cached;
    marked = new Set([...marked, conceptId]);
    cached = dependencies.buildModel({
      ...lastInput,
      alreadyHaveConceptIds: new Set(marked),
    });
    hasCached = true;
    notify();
    return cached;
  };

  return Object.freeze({
    evaluate,
    markAlreadyHave,
    alreadyHaveConceptIds: () => new Set(marked),
    current: () => hasCached ? cached : null,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    teardown: clear,
  });
}
