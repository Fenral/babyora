import { useEffect, useLayoutEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { reverseGeocode } from '../lib/geocode/nominatim';
import type { RuntimeCapabilityAccess } from '../lib/premium/gating';
import {
  useLocationPref,
  type AutomaticPlaceInput,
  type LocationMode,
} from '../state/location-pref-store';
import type { LocationRequestOptions } from '../lib/location/cache-scope';

export type AutoLocationIntent = 'startup' | 'resume' | 'settings-activation';

export type AutoLocationRequest = Readonly<{
  intent: AutoLocationIntent;
  runtimeDecision: RuntimeCapabilityAccess;
  mode: LocationMode;
  childId: string;
  isStillAllowed: () => boolean;
}>;

export type AutoLocationOutcome =
  | Readonly<{ status: 'success'; placeLabel: string }>
  | Readonly<{ status: 'blocked' | 'failed' | 'superseded' }>;

type AutoLocationDependencies = Readonly<{
  locate: () => Promise<Readonly<{ lat: number; lon: number }>>;
  reverse: (
    lat: number,
    lon: number,
    options: LocationRequestOptions,
  ) => Promise<Readonly<{ city: string | null }> | null>;
  clear: () => void;
  begin: () => number;
  commit: (generation: number, place: AutomaticPlaceInput) => void;
}>;

export type AutoLocationController = Readonly<{
  run: (request: AutoLocationRequest) => Promise<AutoLocationOutcome>;
  invalidate: () => void;
}>;

function requestAllowed(request: AutoLocationRequest): boolean {
  return request.childId.trim().length > 0
    && request.runtimeDecision.capability === 'automatic_location'
    && request.runtimeDecision.state === 'allowed'
    && request.runtimeDecision.allowed
    && request.runtimeDecision.implementationAvailable
    && (
      request.mode === 'auto'
      || (request.mode === 'manual' && request.intent === 'settings-activation')
    );
}

function requestKey(request: AutoLocationRequest): string {
  return request.childId;
}

function liveRequestAllowed(request: AutoLocationRequest): boolean {
  try {
    return request.isStillAllowed();
  } catch {
    return false;
  }
}

export function createAutoLocationController(
  dependencies: AutoLocationDependencies,
): AutoLocationController {
  let token = 0;
  let inFlight: Readonly<{
    key: string;
    promise: Promise<AutoLocationOutcome>;
  }> | null = null;

  const invalidate = (): void => {
    token += 1;
    inFlight = null;
    dependencies.clear();
  };

  const run = (request: AutoLocationRequest): Promise<AutoLocationOutcome> => {
    if (!requestAllowed(request) || !liveRequestAllowed(request)) {
      invalidate();
      return Promise.resolve({ status: 'blocked' });
    }
    const key = requestKey(request);
    if (inFlight?.key === key) return inFlight.promise;
    if (inFlight) invalidate();

    const runToken = ++token;
    const generation = dependencies.begin();
    const current = () => runToken === token;
    const promise = Promise.resolve()
      .then(() => dependencies.locate())
      .then(async (position): Promise<AutoLocationOutcome> => {
        if (!current()) return { status: 'superseded' };
        if (!liveRequestAllowed(request)) {
          invalidate();
          return { status: 'superseded' };
        }
        const lat = Number(position.lat.toFixed(4));
        const lon = Number(position.lon.toFixed(4));
        if (
          !Number.isFinite(lat) || lat < -90 || lat > 90
          || !Number.isFinite(lon) || lon < -180 || lon > 180
        ) {
          invalidate();
          return { status: 'failed' };
        }
        if (!liveRequestAllowed(request)) {
          invalidate();
          return { status: 'superseded' };
        }
        const place = await dependencies.reverse(lat, lon, {
          cacheScope: 'memory-only',
        });
        if (!current()) return { status: 'superseded' };
        if (!liveRequestAllowed(request)) {
          invalidate();
          return { status: 'superseded' };
        }
        const city = place?.city?.trim();
        if (!city) {
          invalidate();
          return { status: 'failed' };
        }
        if (!liveRequestAllowed(request)) {
          invalidate();
          return { status: 'superseded' };
        }
        dependencies.commit(generation, {
          childId: request.childId,
          city,
          lat,
          lon,
        });
        return { status: 'success', placeLabel: city };
      })
      .catch((): AutoLocationOutcome => {
        if (!current()) return { status: 'superseded' };
        invalidate();
        return { status: 'failed' };
      })
      .finally(() => {
        if (inFlight?.promise === promise) inFlight = null;
      });
    inFlight = { key, promise };
    return promise;
  };

  return { run, invalidate };
}

function locateOnce(): Promise<Readonly<{ lat: number; lon: number }>> {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return Promise.reject(new Error('location unavailable'));
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      }),
      reject,
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 },
    );
  });
}

export const automaticLocationController = createAutoLocationController({
  locate: locateOnce,
  reverse: reverseGeocode,
  clear: () => useLocationPref.getState().clearAutomaticPlace(),
  begin: () => useLocationPref.getState().beginAutomaticPlaceRequest(),
  commit: (generation, place) => {
    useLocationPref.getState().setAutomaticPlace(generation, place);
  },
});

export function useAutoLocationRefresh(request: Readonly<{
  runtimeDecision: RuntimeCapabilityAccess;
  mode: LocationMode;
  childId: string;
  enabled: boolean;
}>): void {
  const { runtimeDecision, mode, childId, enabled } = request;
  const latestRequest = useRef(request);
  useLayoutEffect(() => {
    latestRequest.current = request;
  }, [request]);

  useEffect(() => {
    if (!enabled) {
      automaticLocationController.invalidate();
      return;
    }
    const startupRequest: AutoLocationRequest = {
      intent: 'startup',
      runtimeDecision,
      mode,
      childId,
      isStillAllowed: () => {
        const latest = latestRequest.current;
        return latest.enabled
          && latest.childId === childId
          && requestAllowed({
            intent: 'resume',
            runtimeDecision: latest.runtimeDecision,
            mode: useLocationPref.getState().mode,
            childId: latest.childId,
            isStillAllowed: () => true,
          });
      },
    };
    const currentPlace = useLocationPref.getState().automaticPlace;
    const activationAlreadyResolved = mode === 'auto'
      && currentPlace?.childId === childId;
    if (!activationAlreadyResolved) {
      void automaticLocationController.run(startupRequest);
    }

    let cleanup: (() => void) | undefined;
    const resume = () => {
      void automaticLocationController.run({
        ...startupRequest,
        intent: 'resume',
      });
    };
    if (Capacitor.isNativePlatform()) {
      const handle = CapacitorApp.addListener('appStateChange', ({ isActive }) => {
        if (isActive) resume();
      });
      cleanup = () => {
        void handle.then((listener) => listener.remove()).catch(() => undefined);
      };
    } else if (typeof document !== 'undefined') {
      const onVisible = () => {
        if (document.visibilityState === 'visible') resume();
      };
      document.addEventListener('visibilitychange', onVisible);
      cleanup = () => document.removeEventListener('visibilitychange', onVisible);
    }
    return () => {
      cleanup?.();
      const current = useLocationPref.getState();
      const completingSettingsActivation = mode === 'manual'
        && current.mode === 'auto'
        && current.automaticPlace?.childId === childId;
      if (!completingSettingsActivation) {
        automaticLocationController.invalidate();
      }
    };
  }, [
    childId,
    enabled,
    mode,
    runtimeDecision.allowed,
    runtimeDecision,
    runtimeDecision.implementationAvailable,
    runtimeDecision.state,
  ]);
}
