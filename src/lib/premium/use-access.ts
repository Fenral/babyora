/**
 * use-access — F81.5-W1: bro mellom RevenueCat-entitlement og UI.
 *
 * `syncPremiumEntitlement()` slår opp reell entitlement-status via
 * `checkPremium()` (kun native + konfigurert RevenueCat). Mens oppslaget
 * pågår er effektiv tilgang alltid nøytral (`false` + `loading`) — en
 * cachet Plus-verdi kan derfor aldri åpne betalt innhold før en fersk
 * butikkrespons er autoritativ. Parallelle kall deler samme promise.
 *
 * På web/dev (ikke native eller RevenueCat ikke konfigurert) er synken en
 * eksplisitt ready-dev no-op. subscription-store beholder mock-verdien slik
 * at utviklere kan teste Premium-UI uten et ekte RevenueCat-oppsett.
 *
 * Wiring:
 *  - main.tsx kaller `syncPremiumEntitlement()` én gang ved oppstart
 *    etter at `initRevenueCat()` er ferdig.
 *  - Denne modulen registrerer på modulnivå kun én app-resume-lytter som
 *    bruker den samme single-flight-controlleren.
 *
 * `useAccess()` er den eneste kontrakten skjermer/komponenter skal bruke
 * for å lese Premium-status.
 */
import { useSyncExternalStore } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { checkPremium, isRevenueCatConfigured } from '../billing/revenuecat';
import { useSubscription } from '../../state/subscription-store';

type AccessSnapshot = {
  isPremium: boolean;
  loading: boolean;
  source: 'configured-native' | 'ready-dev';
};

type ControllerDependencies = {
  configuredNative: boolean;
  check: () => Promise<boolean>;
  commit: (isPremium: boolean) => void;
  readDevPremium: () => boolean;
  warn?: (message: string, error: unknown) => void;
};

type EntitlementFreshnessController = {
  getSnapshot: () => AccessSnapshot;
  subscribe: (listener: () => void) => () => void;
  refresh: () => Promise<void>;
  supersede: () => void;
};

const READY_DEV_NOOP = Promise.resolve();

/**
 * Injiserbar controller-seam for kontrakttester.
 *
 * `supersede()` finnes for eksplisitt livssyklus-invalidering: en pågående
 * generasjon mister da publiseringsretten, og neste refresh starter et nytt
 * single-flight. Ordinære startup/resume-kall bruker bare `refresh()`.
 */
export function createEntitlementFreshnessController(
  dependencies: ControllerDependencies,
): EntitlementFreshnessController {
  const listeners = new Set<() => void>();
  let generation = 0;
  let inFlight: Promise<void> | null = null;
  let snapshot: AccessSnapshot = dependencies.configuredNative
    ? {
        isPremium: false,
        loading: true,
        source: 'configured-native',
      }
    : {
        isPremium: dependencies.readDevPremium(),
        loading: false,
        source: 'ready-dev',
      };

  const publish = (next: AccessSnapshot): void => {
    snapshot = next;
    for (const listener of listeners) listener();
  };

  const publishRefreshing = (): void => {
    publish({
      isPremium: false,
      loading: true,
      source: 'configured-native',
    });
  };

  const refresh = (): Promise<void> => {
    if (!dependencies.configuredNative) return READY_DEV_NOOP;
    if (inFlight) return inFlight;

    const refreshGeneration = ++generation;
    publishRefreshing();

    let checkResult: Promise<boolean>;
    try {
      checkResult = dependencies.check();
    } catch (error) {
      checkResult = Promise.reject(error);
    }

    const refreshPromise = checkResult
      .then(
        (isPremium) => {
          if (refreshGeneration !== generation) return;
          dependencies.commit(isPremium);
          publish({
            isPremium,
            loading: false,
            source: 'configured-native',
          });
        },
        (error: unknown) => {
          if (refreshGeneration !== generation) return;
          dependencies.commit(false);
          publish({
            isPremium: false,
            loading: false,
            source: 'configured-native',
          });
          dependencies.warn?.(
            '[Babyora] syncPremiumEntitlement feilet',
            error,
          );
        },
      )
      .finally(() => {
        if (inFlight === refreshPromise) inFlight = null;
      });

    inFlight = refreshPromise;
    return refreshPromise;
  };

  return {
    getSnapshot: () => snapshot,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    refresh,
    supersede: () => {
      if (!dependencies.configuredNative) return;
      generation += 1;
      inFlight = null;
      publishRefreshing();
    },
  };
}

const configuredNative =
  Capacitor.isNativePlatform() && isRevenueCatConfigured();

const entitlementFreshness = createEntitlementFreshnessController({
  configuredNative,
  check: checkPremium,
  commit: (isPremium) => useSubscription.getState().setPremium(isPremium),
  readDevPremium: () => useSubscription.getState().isPremium,
  warn: (message, error) => console.warn(message, error),
});

/**
 * Synker subscription-store mot RevenueCat sin faktiske entitlement.
 * Parallelle kall deler nøyaktig samme promise; etter settlement starter
 * neste kall en ny generasjon.
 */
export function syncPremiumEntitlement(): Promise<void> {
  return entitlementFreshness.refresh();
}

let resumeSyncRegistered = false;

/** Registrerer én app-resume-lytter. Kalles kun fra modul-scope. */
function registerResumeSync(): void {
  if (resumeSyncRegistered) return;
  resumeSyncRegistered = true;

  if (Capacitor.isNativePlatform()) {
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) void syncPremiumEntitlement();
    }).catch((error) => {
      console.warn('[Babyora] appStateChange-listener feilet', error);
    });
  } else if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        void syncPremiumEntitlement();
      }
    });
  }
}

// Modulnivå: registreres én gang ved første import, aldri i React-render.
registerResumeSync();

/**
 * React-hook for Premium-tilgang.
 *
 * På konfigurert native er `loading` true og `isPremium` alltid false for
 * hver pågående refresh. På eksplisitt web/dev kommer mock-verdien direkte
 * fra subscription-store uten å bli feilaktig merket som butikkfersk.
 */
export function useAccess(): { isPremium: boolean; loading: boolean } {
  const devPremium = useSubscription((state) => state.isPremium);
  const freshness = useSyncExternalStore(
    entitlementFreshness.subscribe,
    entitlementFreshness.getSnapshot,
    entitlementFreshness.getSnapshot,
  );

  if (freshness.source === 'ready-dev') {
    return { isPremium: devPremium, loading: false };
  }

  return {
    isPremium: freshness.isPremium,
    loading: freshness.loading,
  };
}
