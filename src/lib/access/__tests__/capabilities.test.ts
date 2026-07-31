/**
 * P2 hard paywall (PRODUCT.md, 2026-07-31) — decideAccess er nå en ren
 * entitlement-sjekk: loading vinner alltid, ellers avgjør kun isPlus.
 * REQUIRES_AUTH er fortsatt et ortogonalt lag OVENPÅ en aktiv Plus-
 * entitlement. Det finnes ikke lenger noen FREE_CAPABILITIES-liste — ALLE
 * kapabiliteter (inkl. today_home/morning_reminder/safety_guides) gater nå
 * likt på isPlus.
 */
import { describe, expect, it } from 'vitest';
import { decideAccess, type AccessContext, type Capability } from '../capabilities.js';

const ctx = (partial?: Partial<AccessContext>): AccessContext => ({
  isPlus: false, authenticated: false, loading: false, ...partial,
});

const ALL_CAPABILITIES: Capability[] = [
  'today_home',
  'morning_reminder',
  'safety_guides',
  'future_plan',
  'automatic_location',
  'soon_preparation',
  'extra_places',
  'extra_children',
  'widget',
];
const PLUS_AND_AUTH: Capability[] = ['family_sharing', 'personal_calibration', 'smart_notifications'];

describe('decideAccess', () => {
  it.each(ALL_CAPABILITIES)('%s krever aktivt Plus-entitlement — ingen gratis-nivå lenger', (cap) => {
    const denied = decideAccess(cap, ctx());
    expect(denied.allowed).toBe(false);
    expect(denied.reason).toBe('expired');
    expect(denied.paywallTrigger).toBe(cap);
  });

  it.each(ALL_CAPABILITIES)('%s er tilgjengelig med Plus uten innlogging', (cap) => {
    expect(decideAccess(cap, ctx({ isPlus: true }))).toEqual({ allowed: true, reason: 'plus' });
  });

  it.each([...ALL_CAPABILITIES, ...PLUS_AND_AUTH])(
    '%s: loading blokkerer alt uten paywall-trigger (aldri flash av feil tilstand)',
    (cap) => {
      const d = decideAccess(cap, ctx({ loading: true }));
      expect(d).toEqual({ allowed: false, reason: 'loading' });
      const dPlus = decideAccess(cap, ctx({ isPlus: true, loading: true }));
      expect(dPlus).toEqual({ allowed: false, reason: 'loading' });
    },
  );

  it.each(PLUS_AND_AUTH)('%s krever Plus OG autentisering (delt/servertilstand)', (cap) => {
    expect(decideAccess(cap, ctx())).toEqual({ allowed: false, reason: 'expired', paywallTrigger: cap });
    expect(decideAccess(cap, ctx({ isPlus: true }))).toEqual({ allowed: false, reason: 'signed_out' });
    expect(decideAccess(cap, ctx({ isPlus: true, authenticated: true }))).toEqual({ allowed: true, reason: 'plus' });
  });

  it.each(['today_home', 'future_plan', 'automatic_location', 'soon_preparation'] as const)(
    '%s har deterministiske Plus- og loading-overganger',
    (capability) => {
      expect(decideAccess(capability, ctx())).toEqual({
        allowed: false,
        reason: 'expired',
        paywallTrigger: capability,
      });
      expect(decideAccess(capability, ctx({ isPlus: true }))).toEqual({
        allowed: true,
        reason: 'plus',
      });
      expect(decideAccess(capability, ctx({ isPlus: true, loading: true }))).toEqual({
        allowed: false,
        reason: 'loading',
      });
      expect(decideAccess(capability, ctx({ isPlus: false, authenticated: true }))).toEqual({
        allowed: false,
        reason: 'expired',
        paywallTrigger: capability,
      });
    },
  );
});
