/**
 * AppPaywallGate — P2 hard paywall (PRODUCT.md, 2026-07-31) kontrakttester.
 *
 * `isHardPaywallDue` er en ren funksjon (ingen React/store) og dekker
 * kjernebeslutningen direkte. En liten render-test (renderToStaticMarkup —
 * samme mønster som PaakledningScreen/HjemScreen sine egne tester, ingen
 * @capacitor/core-mocking nødvendig i denne node-testmiljøet) bekrefter at
 * dismissable={false} faktisk er wired gjennom til PaywallDialog (ingen
 * lukk-knapp i markup når gaten er «due»).
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppPaywallGate, HARD_PAYWALL_ENABLED, isHardPaywallDue } from '../AppPaywallGate';
import { useSubscription } from '../../state/subscription-store';

describe('isHardPaywallDue', () => {
  it('onboarding ikke fullført → ingen gate, uansett andre felt', () => {
    expect(isHardPaywallDue({
      enabled: true,
      onboardingDone: false,
      firstRecommendationSeenAt: Date.now(),
      isPremium: false,
      loading: false,
    })).toBe(false);
  });

  it('onboarding fullført, men anbefaling ikke vist ennå → ingen gate', () => {
    expect(isHardPaywallDue({
      enabled: true,
      onboardingDone: true,
      firstRecommendationSeenAt: null,
      isPremium: false,
      loading: false,
    })).toBe(false);
  });

  it('anbefaling vist, ikke Premium → gate DUE', () => {
    expect(isHardPaywallDue({
      enabled: true,
      onboardingDone: true,
      firstRecommendationSeenAt: Date.now(),
      isPremium: false,
      loading: false,
    })).toBe(true);
  });

  it('Premium → ingen gate, selv om anbefaling er vist', () => {
    expect(isHardPaywallDue({
      enabled: true,
      onboardingDone: true,
      firstRecommendationSeenAt: Date.now(),
      isPremium: true,
      loading: false,
    })).toBe(false);
  });

  it('loading → ingen gate (unngår flash mens entitlement-oppslaget pågår)', () => {
    expect(isHardPaywallDue({
      enabled: true,
      onboardingDone: true,
      firstRecommendationSeenAt: Date.now(),
      isPremium: false,
      loading: true,
    })).toBe(false);
  });

  it('enabled=false → ingen gate uansett (bryter for hele funksjonen)', () => {
    expect(isHardPaywallDue({
      enabled: false,
      onboardingDone: true,
      firstRecommendationSeenAt: Date.now(),
      isPremium: false,
      loading: false,
    })).toBe(false);
  });

  it('HARD_PAYWALL_ENABLED er slått på (P2 er levert, ikke bak en dev-only-bryter)', () => {
    expect(HARD_PAYWALL_ENABLED).toBe(true);
  });
});

describe('AppPaywallGate rendering', () => {
  beforeEach(() => {
    useSubscription.setState({
      isPremium: false,
      lastSyncedAt: null,
      firstRecommendationSeenAt: null,
    });
  });

  it('due=true render: PaywallDialog rendres UTEN lukk-knapp (dismissable=false er wired)', () => {
    useSubscription.setState({ firstRecommendationSeenAt: Date.now(), isPremium: false });
    const html = renderToStaticMarkup(<AppPaywallGate onboardingDone />);
    expect(html).toContain('<dialog');
    expect(html).not.toContain('aria-label="Lukk"');
  });

  it('Premium-bruker: fortsatt ingen lukk-knapp-krav, men gaten er strukturelt den samme (ikke en annen komponent)', () => {
    useSubscription.setState({ firstRecommendationSeenAt: Date.now(), isPremium: true });
    const html = renderToStaticMarkup(<AppPaywallGate onboardingDone />);
    expect(html).toContain('<dialog');
    expect(html).not.toContain('aria-label="Lukk"');
  });

  it('inneholder de tre hele-produktet-bulletsene og den plan-agnostiske trial-linjen', () => {
    useSubscription.setState({ firstRecommendationSeenAt: Date.now(), isPremium: false });
    const html = renderToStaticMarkup(<AppPaywallGate onboardingDone />);
    expect(html).toContain('Dagens antrekk, klart hver eneste morgen');
    expect(html).toContain('I morgen og hele neste uke, ferdig planlagt');
    expect(html).toContain('Del med alle som passer barnet');
    expect(html).toContain('Start med 7 gratisdager uansett plan');
  });
});
