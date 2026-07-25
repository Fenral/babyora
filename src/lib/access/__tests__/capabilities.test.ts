/**
 * R7/UI-plan Task 1 — sentralisert capability-kontrakt.
 * Gratis = i dag hjemme + sikkerhet + morgenpåminnelse; Plus = fremover,
 * overalt og sammen; familiedeling krever i tillegg autentisering.
 * FORVENTET RED: modulen finnes ikke.
 */
import { describe, expect, it } from 'vitest';
import { decideAccess, type AccessContext, type Capability } from '../capabilities.js';

const ctx = (partial?: Partial<AccessContext>): AccessContext => ({
  isPlus: false, authenticated: false, loading: false, ...partial,
});

const FREE: Capability[] = ['today_home', 'morning_reminder', 'safety_guides'];
const PLUS_ONLY: Capability[] = [
  'future_plan',
  'automatic_location',
  'soon_preparation',
  'extra_places',
  'extra_children',
  'widget',
];
const PLUS_AND_AUTH: Capability[] = ['family_sharing', 'personal_calibration', 'smart_notifications'];

describe('decideAccess', () => {
  it.each(FREE)('%s er alltid gratis — også utlogget', (cap) => {
    expect(decideAccess(cap, ctx())).toEqual({ allowed: true, reason: 'free' });
    expect(decideAccess(cap, ctx({ isPlus: true, authenticated: true })).allowed).toBe(true);
  });

  it.each([...PLUS_ONLY, ...PLUS_AND_AUTH])('%s krever aktivt Plus-entitlement', (cap) => {
    const denied = decideAccess(cap, ctx());
    expect(denied.allowed).toBe(false);
    expect(denied.reason).toBe('expired');
    expect(denied.paywallTrigger).toBe(cap);
  });

  it.each(PLUS_ONLY)('%s er tilgjengelig med Plus uten innlogging', (cap) => {
    expect(decideAccess(cap, ctx({ isPlus: true }))).toEqual({ allowed: true, reason: 'plus' });
  });

  it.each(PLUS_AND_AUTH)('%s krever OGSÅ autentisering (delt/servertilstand)', (cap) => {
    expect(decideAccess(cap, ctx({ isPlus: true }))).toEqual({ allowed: false, reason: 'signed_out' });
    expect(decideAccess(cap, ctx({ isPlus: true, authenticated: true }))).toEqual({ allowed: true, reason: 'plus' });
  });

  it('loading blokkerer alt uten paywall-trigger (aldri flash av feil tilstand)', () => {
    for (const cap of [...FREE, ...PLUS_ONLY, ...PLUS_AND_AUTH] as Capability[]) {
      const d = decideAccess(cap, ctx({ loading: true }));
      expect(d).toEqual({ allowed: false, reason: 'loading' });
    }
  });

  it.each(['future_plan', 'automatic_location', 'soon_preparation'] as const)(
    '%s har deterministiske Free, Plus, loading og utløpt-overganger',
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
