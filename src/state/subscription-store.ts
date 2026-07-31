/**
 * subscription-store — persistert Premium-status for Babyora.
 *
 * Sannhets-kilden er RevenueCat-entitlement "premium" (sjekkes via
 * `checkPremium()` ved app-start + etter purchase/restore). Denne storen
 * cacher den siste verdien lokalt slik at UI kan rendre status før native
 * StoreKit/Billing har svart, og fungerer som mock-fallback når
 * RevenueCat ikke er konfigurert (web/dev).
 *
 * Brukes av:
 *  - InnstillingerScreen (Premium-CTA / "Administrer abonnement"-row)
 *  - PaywallDialog (oppdaterer status etter vellykket kjøp)
 *  - AppPaywallGate (P2 hard paywall — leser firstRecommendationSeenAt)
 *
 * Persistert format (zustand/persist v4):
 *   { state: { isPremium: boolean, lastSyncedAt: number | null,
 *              firstRecommendationSeenAt: number | null },
 *     version: 0 }
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Demo/e2e-testhåndtak for entitlement (P2 hard paywall).
 *
 * `?seed=demo` (children-store.tsx sin egen demo-flagg) seeder som
 * DEFAULT en mock-abonnent (isPremium=true), slik at smoke.ts/product-audit
 * sine ?seed=demo-flyter fortsatt ser hele appen uten å bli stanset av
 * AppPaywallGate.
 *
 * `?seed=demo&entitlement=none` er et eksplisitt, dokumentert test-hook som
 * i stedet seeder en IKKE-abonnerende demo-bruker — brukt av
 * e2e/purchase-flow.ts for å øve på selve hard-paywall-gaten (den
 * ikke-avviselige paywallen) uten å måtte bygge en helt egen seed-vei.
 *
 * Uten `seed`-parameteren (ordinære brukere) er dette et rent no-op —
 * `isPremium` starter som før på `false` og styres kun av RevenueCat/kjøp.
 *
 * Ren funksjon (tar imot en query-streng, leser aldri `window` selv) — lett
 * å kontrakttest uten å stubbe globaler.
 */
export function resolveDemoEntitlementOverride(search: string): boolean | null {
  const params = new URLSearchParams(search);
  if (!params.has('seed')) return null;
  if (params.get('entitlement') === 'none') return false;
  return true;
}

const DEMO_ENTITLEMENT_OVERRIDE = typeof window === 'undefined'
  ? null
  : resolveDemoEntitlementOverride(window.location.search);

export type SubscriptionState = {
  /** Aktiv Premium-entitlement (cachet siste kjente verdi). */
  isPremium: boolean;
  /** Timestamp for siste sync mot RevenueCat (ms epoch). */
  lastSyncedAt: number | null;
  /**
   * P2 hard paywall (PRODUCT.md, 2026-07-31): timestamp for FØRSTE gang en
   * reell anbefaling ble vist på Hjem (satt én gang, aldri tilbakestilt av
   * senere visninger). AppPaywallGate bruker denne — sammen med fullført
   * onboarding og manglende Premium — til å avgjøre om hele appen skal
   * kreve et aktivt kjøp. `null` inntil HjemScreen har vist første
   * anbefaling.
   */
  firstRecommendationSeenAt: number | null;
  setPremium: (next: boolean) => void;
  /** No-op hvis allerede satt — «første gang» skal aldri overskrives. */
  markFirstRecommendationSeen: () => void;
};

export const useSubscription = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      isPremium: DEMO_ENTITLEMENT_OVERRIDE ?? false,
      lastSyncedAt: null,
      firstRecommendationSeenAt: null,
      setPremium: (next) => set({ isPremium: next, lastSyncedAt: Date.now() }),
      markFirstRecommendationSeen: () => {
        if (get().firstRecommendationSeenAt !== null) return;
        set({ firstRecommendationSeenAt: Date.now() });
      },
    }),
    { name: 'babyora.subscription' },
  ),
);
