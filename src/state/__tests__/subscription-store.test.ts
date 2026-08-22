import { beforeEach, describe, expect, it } from 'vitest';
import {
  hadFirstRecommendationBeforeBoot,
  readFirstRecommendationBeforeBoot,
  resolveDemoEntitlementOverride,
  selectPersistedSubscriptionState,
  useSubscription,
} from '../subscription-store';

describe('resolveDemoEntitlementOverride (P2 hard paywall demo/e2e-håndtak)', () => {
  it('uten seed-parameter: ingen overstyring (ordinære brukere upåvirket)', () => {
    expect(resolveDemoEntitlementOverride('')).toBeNull();
    expect(resolveDemoEntitlementOverride('?foo=bar')).toBeNull();
    expect(resolveDemoEntitlementOverride('?seed=preview')).toBeNull();
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
      recommendationGraceWindowActive: true,
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

  it('setPremium oppdaterer aktiv og utløpt/refundert status uten å slette lokal først-verdi', () => {
    useSubscription.getState().markFirstRecommendationSeen();
    const seenAt = useSubscription.getState().firstRecommendationSeenAt;
    useSubscription.getState().setPremium(true);
    expect(useSubscription.getState().isPremium).toBe(true);
    expect(useSubscription.getState().lastSyncedAt).not.toBeNull();
    expect(useSubscription.getState().firstRecommendationSeenAt).toBe(seenAt);

    useSubscription.getState().setPremium(false);
    expect(useSubscription.getState().isPremium).toBe(false);
    expect(useSubscription.getState().firstRecommendationSeenAt).toBe(seenAt);
  });
});

describe('hadFirstRecommendationBeforeBoot (P9 duel §8 — paywall-armering)', () => {
  it('null (ingenting persistert ennå) → false', () => {
    expect(hadFirstRecommendationBeforeBoot(null)).toBe(false);
  });

  it('persistert JSON UTEN firstRecommendationSeenAt (aldri sett) → false', () => {
    expect(hadFirstRecommendationBeforeBoot(JSON.stringify({ state: { isPremium: false } }))).toBe(false);
    expect(hadFirstRecommendationBeforeBoot(JSON.stringify({ state: { firstRecommendationSeenAt: null } }))).toBe(false);
  });

  it('persistert JSON MED et gyldig firstRecommendationSeenAt-tidspunkt → true', () => {
    expect(hadFirstRecommendationBeforeBoot(JSON.stringify({ state: { firstRecommendationSeenAt: 1_753_000_000_000 } }))).toBe(true);
  });

  it('korrupt/uparsbar JSON faller trygt tilbake til false (aldri en krasj)', () => {
    expect(hadFirstRecommendationBeforeBoot('{ not json')).toBe(false);
    expect(hadFirstRecommendationBeforeBoot('null')).toBe(false);
    expect(hadFirstRecommendationBeforeBoot('"just a string"')).toBe(false);
    expect(hadFirstRecommendationBeforeBoot(JSON.stringify({ state: { firstRecommendationSeenAt: -1 } }))).toBe(false);
    expect(hadFirstRecommendationBeforeBoot(JSON.stringify({ state: { firstRecommendationSeenAt: 1.5 } }))).toBe(false);
  });

  it('blokkert localStorage faller trygt tilbake uten å krasje app-boot', () => {
    const blockedStorage = {
      getItem: () => {
        throw new DOMException('Storage disabled', 'SecurityError');
      },
    };

    expect(readFirstRecommendationBeforeBoot(blockedStorage)).toBe(false);
  });
});

describe('consumeRecommendationGraceWindow (P9 duel §8)', () => {
  beforeEach(() => {
    useSubscription.setState({ recommendationGraceWindowActive: true });
  });

  it('flipper recommendationGraceWindowActive til false', () => {
    useSubscription.setState({ firstRecommendationSeenAt: Date.now() });
    useSubscription.getState().consumeRecommendationGraceWindow();
    expect(useSubscription.getState().recommendationGraceWindowActive).toBe(false);
  });

  it('kan ikke konsumere gratisvinduet før den første anbefalingen faktisk er vist', () => {
    useSubscription.setState({ firstRecommendationSeenAt: null });

    useSubscription.getState().consumeRecommendationGraceWindow();
    expect(useSubscription.getState().recommendationGraceWindowActive).toBe(true);

    useSubscription.getState().markFirstRecommendationSeen();
    expect(useSubscription.getState().recommendationGraceWindowActive).toBe(true);
  });

  it('er idempotent (no-op, samme store-referanse) når vinduet allerede er lukket', () => {
    useSubscription.setState({ firstRecommendationSeenAt: Date.now() });
    useSubscription.getState().consumeRecommendationGraceWindow();
    const before = useSubscription.getState();
    useSubscription.getState().consumeRecommendationGraceWindow();
    expect(useSubscription.getState()).toBe(before);
  });

  it('persisterer første verdi, men aldri det øktsspesifikke gratisvinduet', () => {
    useSubscription.setState({
      isPremium: false,
      lastSyncedAt: 123,
      firstRecommendationSeenAt: 456,
      recommendationGraceWindowActive: false,
    });

    const persisted = selectPersistedSubscriptionState(useSubscription.getState());

    expect(persisted).toEqual({
      isPremium: false,
      lastSyncedAt: 123,
      firstRecommendationSeenAt: 456,
    });
    expect(persisted).not.toHaveProperty('recommendationGraceWindowActive');
  });
});
