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
 * P9 (docs/design-notes/sol-duel-2026-07-31.md §8 — "Paywall-armering"):
 * gaten skal IKKE auto-overlaye idet `firstRecommendationSeenAt` settes —
 * "Brukeren leser ferdig" (den ene anbefalingen, den ene økten). Først NESTE
 * verdihandling (låsemerket CTA) ELLER neste app-ØKT viser veggen direkte.
 * `recommendationGraceWindowActive` bærer dette: sann fra økt-start HVIS
 * `firstRecommendationSeenAt` IKKE allerede var satt fra en TIDLIGERE økt
 * (avledet én gang ved modul-last, se `HAD_FIRST_RECOMMENDATION_BEFORE_THIS_BOOT`
 * under — samme mønster som `DEMO_ENTITLEMENT_OVERRIDE`), og flippes til
 * usann enten av `consumeRecommendationGraceWindow()` (en låst verdihandling
 * ble faktisk forsøkt DENNE økten) eller helt enkelt ved at appen startes på
 * nytt (feltet persisteres BEVISST ALDRI, se `partialize` — det skal alltid
 * regnes ut ferskt per økt, ikke gjenbrukes fra forrige).
 *
 * Persistert format (zustand/persist v4):
 *   { state: { isPremium: boolean, lastSyncedAt: number | null,
 *              firstRecommendationSeenAt: number | null },
 *     version: 0 }
 *   (recommendationGraceWindowActive er BEVISST IKKE med — se over)
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

/**
 * P9 (duel §8) — ren funksjon: fantes det ALLEREDE et
 * `firstRecommendationSeenAt` i det persisterte JSON-et FØR denne økten i
 * det hele tatt startet? Skilt ut fra `HAD_FIRST_RECOMMENDATION_BEFORE_THIS_BOOT`
 * under nettopp for å være testbar uten modul-reset-gymnastikk (samme grunn
 * som `resolveDemoEntitlementOverride` over er en egen eksportert funksjon).
 */
export function hadFirstRecommendationBeforeBoot(persistedRawJson: string | null): boolean {
  if (persistedRawJson === null) return false;
  try {
    const parsed = JSON.parse(persistedRawJson) as { state?: { firstRecommendationSeenAt?: unknown } };
    const value = parsed?.state?.firstRecommendationSeenAt;
    return typeof value === 'number' && Number.isFinite(value);
  } catch {
    return false;
  }
}

const PERSIST_KEY = 'babyora.subscription';

/**
 * Avledet ÉN gang ved modul-last (samme mønster som DEMO_ENTITLEMENT_OVERRIDE
 * over) — IKKE noe zustand/persist selv leverer, siden dets `merge`/
 * `onRehydrateStorage` alltid kjører ETTER default-state allerede er satt,
 * for sent til å skille "var allerede satt FØR denne økten" fra "ble nettopp
 * satt". Et rått, synkront localStorage-lesing FØR storen opprettes er den
 * eneste måten å fange det riktige øyeblikket på.
 */
const HAD_FIRST_RECOMMENDATION_BEFORE_THIS_BOOT = typeof window === 'undefined'
  ? false
  : hadFirstRecommendationBeforeBoot(window.localStorage.getItem(PERSIST_KEY));

export type SubscriptionState = {
  /** Aktiv Premium-entitlement (cachet siste kjente verdi). */
  isPremium: boolean;
  /** Timestamp for siste sync mot RevenueCat (ms epoch). */
  lastSyncedAt: number | null;
  /**
   * P2 hard paywall (PRODUCT.md, 2026-07-31): timestamp for FØRSTE gang en
   * reell anbefaling ble vist på Hjem (satt én gang, aldri tilbakestilt av
   * senere visninger). AppPaywallGate bruker denne — sammen med fullført
   * onboarding, manglende Premium OG `recommendationGraceWindowActive`
   * (P9, under) — til å avgjøre om hele appen skal kreve et aktivt kjøp.
   * `null` inntil HjemScreen har vist første anbefaling.
   */
  firstRecommendationSeenAt: number | null;
  /**
   * P9 (duel §8 — paywall-armering): sann gjennom HELE denne appøkten hvis
   * `firstRecommendationSeenAt` ikke allerede var satt FØR økten startet —
   * brukeren får lese den ene første anbefalingen ferdig uten at gaten
   * auto-overlayer. Flippes usann av `consumeRecommendationGraceWindow()`
   * (en låst verdihandling — «Planlegg»-fanen, aktivitetsendring, Juster —
   * ble tatt DENNE økten) ELLER er allerede usann fra økt-start hvis
   * anbefalingen ble sett en TIDLIGERE økt (neste kalde app-åpning viser
   * veggen direkte, uten noe klikk).
   */
  recommendationGraceWindowActive: boolean;
  setPremium: (next: boolean) => void;
  /** No-op hvis allerede satt — «første gang» skal aldri overskrives. */
  markFirstRecommendationSeen: () => void;
  /** No-op hvis vinduet allerede er lukket. Se recommendationGraceWindowActive. */
  consumeRecommendationGraceWindow: () => void;
};

export const useSubscription = create<SubscriptionState>()(
  persist(
    (set, get) => ({
      isPremium: DEMO_ENTITLEMENT_OVERRIDE ?? false,
      lastSyncedAt: null,
      firstRecommendationSeenAt: null,
      recommendationGraceWindowActive: !HAD_FIRST_RECOMMENDATION_BEFORE_THIS_BOOT,
      setPremium: (next) => set({ isPremium: next, lastSyncedAt: Date.now() }),
      markFirstRecommendationSeen: () => {
        if (get().firstRecommendationSeenAt !== null) return;
        set({ firstRecommendationSeenAt: Date.now() });
      },
      consumeRecommendationGraceWindow: () => {
        if (!get().recommendationGraceWindowActive) return;
        set({ recommendationGraceWindowActive: false });
      },
    }),
    {
      name: PERSIST_KEY,
      // P9: recommendationGraceWindowActive er BEVISST utelatt — den skal
      // regnes ut på nytt hver økt (se HAD_FIRST_RECOMMENDATION_BEFORE_THIS_BOOT),
      // aldri gjenbrukes fra en tidligere persistert verdi.
      partialize: (state) => ({
        isPremium: state.isPremium,
        lastSyncedAt: state.lastSyncedAt,
        firstRecommendationSeenAt: state.firstRecommendationSeenAt,
      }),
    },
  ),
);
