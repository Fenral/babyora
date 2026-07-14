/**
 * R7/UI-plan Task 1 — sentralisert capability-kontrakt (masterplanens delte
 * interface). ALL gating-semantikk for produktmodellen bor her — skjermer
 * skal aldri strø egne isPremium-sjekker for produktnivå-beslutninger.
 *
 * Produktmodell (låst): Gratis = i dag hjemme (+ sikkerhet + morgen-
 * påminnelse). Plus = fremover, overalt og sammen. Kapabiliteter som deler
 * data på tvers av enheter/personer krever i tillegg autentisering.
 */

export type Capability =
  | 'today_home'
  | 'morning_reminder'
  | 'safety_guides'
  | 'future_plan'
  | 'automatic_location'
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

const FREE_CAPABILITIES: readonly Capability[] = ['today_home', 'morning_reminder', 'safety_guides'];
const REQUIRES_AUTH: readonly Capability[] = ['family_sharing', 'personal_calibration', 'smart_notifications'];

export function decideAccess(capability: Capability, c: AccessContext): AccessDecision {
  if (c.loading) return { allowed: false, reason: 'loading' };
  if (FREE_CAPABILITIES.includes(capability)) return { allowed: true, reason: 'free' };
  if (!c.isPlus) return { allowed: false, reason: 'expired', paywallTrigger: capability };
  if (REQUIRES_AUTH.includes(capability) && !c.authenticated) {
    return { allowed: false, reason: 'signed_out' };
  }
  return { allowed: true, reason: 'plus' };
}
