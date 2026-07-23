/**
 * Location preference and privacy boundary.
 *
 * Only the user's explicit mode is durable. Automatic coordinates are
 * child-scoped session data and must never be reconstructed from storage.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LocationCacheScope } from '../lib/location/cache-scope';
import type { RuntimeCapabilityAccess } from '../lib/premium/gating';

export type LocationMode = 'auto' | 'manual';

export type FixedHomePlace = Readonly<{
  childId: string;
  city: string;
  lat: number;
  lon: number;
}>;

export type AutomaticPlaceInput = FixedHomePlace;

export type AutomaticPlace = Readonly<AutomaticPlaceInput & {
  generation: number;
}>;

export type EffectivePlace = Readonly<FixedHomePlace & {
  source: 'fixed-home' | 'automatic';
  cacheScope: LocationCacheScope;
}>;

export type LocationPrefState = {
  mode: LocationMode;
  automaticPlace: AutomaticPlace | null;
  automaticGeneration: number;
  setMode: (next: LocationMode) => void;
  beginAutomaticPlaceRequest: () => number;
  setAutomaticPlace: (generation: number, place: AutomaticPlaceInput) => void;
  clearAutomaticPlace: () => void;
};

export type PersistedLocationPreference = Readonly<{
  mode: LocationMode;
}>;

function isLocationMode(value: unknown): value is LocationMode {
  return value === 'auto' || value === 'manual';
}

function isValidCoordinate(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max;
}

function isValidPlace(place: FixedHomePlace): boolean {
  return place.childId.trim().length > 0
    && place.city.trim().length > 0
    && isValidCoordinate(place.lat, -90, 90)
    && isValidCoordinate(place.lon, -180, 180);
}

function isValidAutomaticPlace(place: AutomaticPlace): boolean {
  return isValidPlace(place)
    && Number.isSafeInteger(place.generation)
    && place.generation > 0;
}

export function partializeLocationPreference(
  state: LocationPrefState,
): PersistedLocationPreference {
  return { mode: state.mode };
}

export function mergeLocationPreference(
  persisted: unknown,
  current: LocationPrefState,
): LocationPrefState {
  const storedMode = typeof persisted === 'object'
    && persisted !== null
    && 'mode' in persisted
    && isLocationMode(persisted.mode)
    ? persisted.mode
    : current.mode;
  return { ...current, mode: storedMode };
}

/**
 * Resolves the sole place eligible for weather/geocode work.
 * Invalid fixed-home data yields null so callers cannot issue a request.
 */
export function resolveEffectivePlace(
  fixedHome: FixedHomePlace,
  storedMode: LocationMode,
  runtimeDecision: RuntimeCapabilityAccess,
  automaticPlace: AutomaticPlace | null,
): EffectivePlace | null {
  if (!isValidPlace(fixedHome)) return null;
  const automaticAllowed = storedMode === 'auto'
    && runtimeDecision.capability === 'automatic_location'
    && runtimeDecision.state === 'allowed'
    && runtimeDecision.allowed
    && runtimeDecision.implementationAvailable
    && automaticPlace !== null
    && isValidAutomaticPlace(automaticPlace)
    && automaticPlace.childId === fixedHome.childId;
  if (automaticAllowed) {
    return {
      childId: automaticPlace.childId,
      city: automaticPlace.city,
      lat: automaticPlace.lat,
      lon: automaticPlace.lon,
      source: 'automatic',
      cacheScope: 'memory-only',
    };
  }
  return {
    childId: fixedHome.childId,
    city: fixedHome.city,
    lat: fixedHome.lat,
    lon: fixedHome.lon,
    source: 'fixed-home',
    cacheScope: 'persistent',
  };
}

export const useLocationPref = create<LocationPrefState>()(
  persist(
    (set) => ({
      mode: 'manual',
      automaticPlace: null,
      automaticGeneration: 0,
      setMode: (next) => set({ mode: next }),
      beginAutomaticPlaceRequest: () => {
        let generation = 0;
        set((state) => {
          generation = state.automaticGeneration + 1;
          return { automaticGeneration: generation, automaticPlace: null };
        });
        return generation;
      },
      setAutomaticPlace: (generation, place) => {
        set((state) => {
          if (generation !== state.automaticGeneration) return state;
          const candidate: AutomaticPlace = { ...place, generation };
          if (!isValidAutomaticPlace(candidate)) return state;
          return { automaticPlace: candidate };
        });
      },
      clearAutomaticPlace: () => {
        set((state) => ({
          automaticGeneration: state.automaticGeneration + 1,
          automaticPlace: null,
        }));
      },
    }),
    {
      name: 'babyora.location-pref',
      partialize: partializeLocationPreference,
      merge: mergeLocationPreference,
    },
  ),
);
