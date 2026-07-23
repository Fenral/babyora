/**
 * use-access — F81.5-W1: bro mellom RevenueCat-entitlement og UI.
 *
 * `syncPremiumEntitlement()` slår opp reell entitlement-status via
 * `checkPremium()` (kun native + konfigurert RevenueCat) og skriver
 * resultatet inn i subscription-store. På web/dev (ikke native eller
 * RevenueCat ikke konfigurert) er dette en no-op — subscription-store
 * beholder sin cachede/mock-verdi slik at utviklere kan teste Premium-UI
 * uten et ekte RevenueCat-oppsett.
 *
 * Wiring:
 *  - main.tsx kaller `syncPremiumEntitlement()` én gang ved oppstart
 *    (etter `initRevenueCat()` er ferdig, suksess eller ikke).
 *  - Denne modulen registrerer i tillegg — på modul-nivå, KUN én gang,
 *    aldri inne i en React-komponent — en app-resume-lytter som re-synker
 *    hver gang appen kommer i forgrunnen igjen:
 *      · native: @capacitor/app sin `appStateChange` (isActive)
 *      · web:    document.visibilitychange
 *    Dette fanger opp kjøp gjort utenfor appen (f.eks. i App Store/Play
 *    "Administrer abonnement") uten at brukeren må starte appen på nytt.
 *
 * `useAccess()` er den eneste kontrakten skjermer/komponenter skal bruke
 * for å lese Premium-status — aldri les subscription-store direkte fra nye
 * kall-steder (eksisterende kall-steder i InnstillingerScreen er unntatt
 * inntil de migreres).
 */
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { checkPremium, isRevenueCatConfigured } from '../billing/revenuecat';
import { useSubscription } from '../../state/subscription-store';

let firstSyncDone = false;
const readyListeners = new Set<() => void>();

function markReady(): void {
  if (firstSyncDone) return;
  firstSyncDone = true;
  for (const cb of readyListeners) cb();
  readyListeners.clear();
}

/**
 * Synker subscription-store mot RevenueCat sin faktiske entitlement.
 * Trygg å kalle ubegrenset antall ganger — feiler aldri hardt (nettverk,
 * manglende nøkkel, native-plugin-feil håndteres alle med silent no-op).
 */
export async function syncPremiumEntitlement(): Promise<void> {
  try {
    if (Capacitor.isNativePlatform() && isRevenueCatConfigured()) {
      const isPremium = await checkPremium();
      useSubscription.getState().setPremium(isPremium);
    }
    // Web/dev uten native+konfigurert RevenueCat: no-op — behold mock-verdi.
  } catch (err) {
    console.warn('[Babyora] syncPremiumEntitlement feilet', err);
  } finally {
    markReady();
  }
}

let resumeSyncRegistered = false;

/** Registrerer ÉN app-resume-lytter. Kalles kun fra modul-scope (se bunn). */
function registerResumeSync(): void {
  if (resumeSyncRegistered) return;
  resumeSyncRegistered = true;

  if (Capacitor.isNativePlatform()) {
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) void syncPremiumEntitlement();
    }).catch((err) => {
      console.warn('[Babyora] appStateChange-listener feilet', err);
    });
  } else if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void syncPremiumEntitlement();
    });
  }
}

// Modul-nivå — registreres én gang ved første import, aldri i React-render.
registerResumeSync();

/**
 * React-hook for Premium-tilgang.
 *
 * `loading` er true helt til FØRSTE synk-forsøk (uansett utfall) er
 * fullført — bruk den til å unngå å vise "Gratis"-UI et kort øyeblikk før
 * en ekte Premium-status har rukket å komme inn fra RevenueCat.
 */
export function useAccess(): { isPremium: boolean; loading: boolean } {
  const isPremium = useSubscription((s) => s.isPremium);
  const [loading, setLoading] = useState(!firstSyncDone);

  useEffect(() => {
    // Allerede reflektert i useState(!firstSyncDone)-initialiseringen over —
    // ingen setState nødvendig her (unngår react-hooks/set-state-in-effect).
    if (firstSyncDone) return;
    const cb = () => setLoading(false);
    readyListeners.add(cb);
    return () => {
      readyListeners.delete(cb);
    };
  }, []);

  return { isPremium, loading };
}

/**
 * Subscribe to entitlement changes without exposing the subscription store.
 *
 * Shell-level safety boundaries use this to revoke already-open premium
 * surfaces from the external-store notification callback.
 */
export function subscribeToAccessEntitlement(
  listener: (isPremium: boolean) => void,
): () => void {
  return useSubscription.subscribe((state, previousState) => {
    if (state.isPremium !== previousState.isPremium) {
      listener(state.isPremium);
    }
  });
}
