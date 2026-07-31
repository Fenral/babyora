import { beforeEach, describe, expect, it } from 'vitest';
import { resolveDemoEntitlementOverride, useSubscription } from '../subscription-store';

describe('resolveDemoEntitlementOverride (P2 hard paywall demo/e2e-håndtak)', () => {
  it('uten seed-parameter: ingen overstyring (ordinære brukere upåvirket)', () => {
    expect(resolveDemoEntitlementOverride('')).toBeNull();
    expect(resolveDemoEntitlementOverride('?foo=bar')).toBeNull();
  });

  it('?seed=demo alene: mock-abonnent (smoke/audit-kompatibel default)', () => {
    expect(resolveDemoEntitlementOverride('?seed=demo')).toBe(true);
  });

  it('?seed=demo&entitlement=none: eksplisitt ikke-abonnerende demo-bruker (e2e-hook)', () => {
    expect(resolveDemoEntitlementOverride('?seed=demo&entitlement=none')).toBe(false);
  });

  it('en ukjent entitlement-verdi faller tilbake til mock-abonnent (demo skal aldri gate seg selv ved uhell)', () => {
    expect(resolveDemoEntitlementOverride('?seed=demo&entitlement=whatever')).toBe(true);
  });
});

describe('useSubscription (P2 hard paywall)', () => {
  beforeEach(() => {
    useSubscription.setState({
      isPremium: false,
      lastSyncedAt: null,
      firstRecommendationSeenAt: null,
    });
  });

  it('markFirstRecommendationSeen setter et tidspunkt første gang', () => {
    expect(useSubscription.getState().firstRecommendationSeenAt).toBeNull();
    useSubscription.getState().markFirstRecommendationSeen();
    const first = useSubscription.getState().firstRecommendationSeenAt;
    expect(first).not.toBeNull();
  });

  it('markFirstRecommendationSeen er idempotent — overskriver ALDRI et allerede satt tidspunkt', () => {
    useSubscription.getState().markFirstRecommendationSeen();
    const first = useSubscription.getState().firstRecommendationSeenAt;
    useSubscription.getState().markFirstRecommendationSeen();
    useSubscription.getState().markFirstRecommendationSeen();
    expect(useSubscription.getState().firstRecommendationSeenAt).toBe(first);
  });

  it('setPremium oppdaterer isPremium og lastSyncedAt uavhengig av firstRecommendationSeenAt', () => {
    useSubscription.getState().markFirstRecommendationSeen();
    const seenAt = useSubscription.getState().firstRecommendationSeenAt;
    useSubscription.getState().setPremium(true);
    expect(useSubscription.getState().isPremium).toBe(true);
    expect(useSubscription.getState().lastSyncedAt).not.toBeNull();
    expect(useSubscription.getState().firstRecommendationSeenAt).toBe(seenAt);
  });
});
