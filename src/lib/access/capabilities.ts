/**
 * R7/UI-plan Task 1 — sentralisert capability-kontrakt (masterplanens delte
 * interface). ALL gating-semantikk for produktmodellen bor her — skjermer
 * skal aldri strø egne isPremium-sjekker for produktnivå-beslutninger.
 *
 * Produktmodell (låst 2026-07-31, PRODUCT.md §Owner decisions): hard
 * paywall. Etter fullført onboarding OG at den første reelle anbefalingen
 * er vist én gang, krever HELE appen et aktivt premium-entitlement — det
 * finnes ikke lenger et gratis-nivå. decideAccess er derfor en ren
 * entitlement-sjekk: loading vinner alltid over alt annet, ellers avgjør
 * kun isPlus. REQUIRES_AUTH er fortsatt et ortogonalt lag OVENPÅ en aktiv
 * Plus-entitlement, for kapabiliteter som deler data på tvers av
 * enheter/personer.
 *
 * Capability-unionen beholdes uendret (today_home/morning_reminder/
 * safety_guides inkludert) slik at eksisterende kall-steder ikke må endre
 * hvilken streng de sender inn — de gater nå bare alle likt på isPlus.
 *
 * 'free' beholdes i AccessDecision['reason']-unionen selv om decideAccess()
 * ALDRI returnerer den lenger: src/lib/planning/planned-outfit-context.ts
 * (engine-katalog, IKKE rørt av P2) holder sin egen, fastlåste
 * FREE_CAPABILITIES-liste og krever strengt reason:'free' for
 * today_home/morning_reminder/safety_guides sine PlannedOutfitContext.access
 * -felt uansett produktmodell — se HjemScreen.tsx/UkeScreen.tsx sine bevisst
 * hardkodede `reason: 'free'`-literaler for today_home. Å fjerne 'free' fra
 * typen ville brutt den kontrakten uten å røre selve planning-filen.
 */

export type Capability =
  | 'today_home'
  | 'morning_reminder'
  | 'safety_guides'
  | 'future_plan'
  | 'automatic_location'
  | 'soon_preparation'
  | 'extra_places'
  | 'extra_children'
  | 'family_sharing'
  | 'personal_calibration'
  | 'smart_notifications'
  | 'widget';

export type AccessContext = {
  isPlus: boolean;
  authenticated: boolean;
  loading: boolean;
};

export type AccessDecision = {
  allowed: boolean;
  reason: 'free' | 'plus' | 'loading' | 'signed_out' | 'expired' | 'role_denied';
  paywallTrigger?: string;
};

const REQUIRES_AUTH: readonly Capability[] = ['family_sharing', 'personal_calibration', 'smart_notifications'];

export function decideAccess(capability: Capability, c: AccessContext): AccessDecision {
  if (c.loading) return { allowed: false, reason: 'loading' };
  if (!c.isPlus) return { allowed: false, reason: 'expired', paywallTrigger: capability };
  if (REQUIRES_AUTH.includes(capability) && !c.authenticated) {
    return { allowed: false, reason: 'signed_out' };
  }
  return { allowed: true, reason: 'plus' };
}
