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
 *
 * Persistert format (zustand/persist v4):
 *   { state: { isPremium: boolean, lastSyncedAt: number | null },
 *     version: 0 }
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SubscriptionState = {
  /** Aktiv Premium-entitlement (cachet siste kjente verdi). */
  isPremium: boolean;
  /** Timestamp for siste sync mot RevenueCat (ms epoch). */
  lastSyncedAt: number | null;
  setPremium: (next: boolean) => void;
};

export const useSubscription = create<SubscriptionState>()(
  persist(
    (set) => ({
      isPremium: false,
      lastSyncedAt: null,
      setPremium: (next) => set({ isPremium: next, lastSyncedAt: Date.now() }),
    }),
    { name: 'babyora.subscription' },
  ),
);
