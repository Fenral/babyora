/**
 * AppPaywallGate — P2 hard paywall (PRODUCT.md, 2026-07-31) kontrakttester,
 * armering presisert i P9 (docs/design-notes/sol-duel-2026-07-31.md §8).
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
      recommendationGraceWindowActive: false,
    })).toBe(false);
  });

  it('onboarding fullført, men anbefaling ikke vist ennå → ingen gate', () => {
    expect(isHardPaywallDue({
      enabled: true,
      onboardingDone: true,
      firstRecommendationSeenAt: null,
      isPremium: false,
      loading: false,
      recommendationGraceWindowActive: false,
    })).toBe(false);
  });

  it('anbefaling vist, ikke Premium, les-ferdig-vinduet STENGT → gate DUE', () => {
    expect(isHardPaywallDue({
      enabled: true,
      onboardingDone: true,
      firstRecommendationSeenAt: Date.now(),
      isPremium: false,
      loading: false,
      recommendationGraceWindowActive: false,
    })).toBe(true);
  });

  it('P9 duel §8: anbefaling NETTOPP vist DENNE økten (les-ferdig-vinduet fortsatt åpent) → ALDRI due, uansett andre felt', () => {
    expect(isHardPaywallDue({
      enabled: true,
      onboardingDone: true,
      firstRecommendationSeenAt: Date.now(),
      isPremium: false,
      loading: false,
      recommendationGraceWindowActive: true,
    })).toBe(false);
  });

  it('Premium → ingen gate, selv om anbefaling er vist og vinduet er stengt', () => {
    expect(isHardPaywallDue({
      enabled: true,
      onboardingDone: true,
      firstRecommendationSeenAt: Date.now(),
      isPremium: true,
      loading: false,
      recommendationGraceWindowActive: false,
    })).toBe(false);
  });

  it('loading → ingen gate (unngår flash mens entitlement-oppslaget pågår)', () => {
    expect(isHardPaywallDue({
      enabled: true,
      onboardingDone: true,
      firstRecommendationSeenAt: Date.now(),
      isPremium: false,
      loading: true,
      recommendationGraceWindowActive: false,
    })).toBe(false);
  });

  it('enabled=false → ingen gate uansett (bryter for hele funksjonen)', () => {
    expect(isHardPaywallDue({
      enabled: false,
      onboardingDone: true,
      firstRecommendationSeenAt: Date.now(),
      isPremium: false,
      loading: false,
      recommendationGraceWindowActive: false,
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
      // P9: testene under simulerer "neste app-økt" (les-ferdig-vinduet
      // allerede stengt) — samme tilstand AppPaywallGate faktisk skal møte
      // for at gaten skal vise seg automatisk.
      recommendationGraceWindowActive: false,
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

  it('inneholder de tre hele-produktet-bulletsene og den plan-agnostiske «7 gratisdager»-meldingen', () => {
    useSubscription.setState({ firstRecommendationSeenAt: Date.now(), isPremium: false });
    const html = renderToStaticMarkup(<AppPaywallGate onboardingDone />);
    // P10.1 (judge finding B3): the leading keyword phrase now renders as
    // its own <b> (two-tone weighting) — the sentence itself is unchanged,
    // just split across a tag boundary, so the full-string containment
    // check is split accordingly too.
    expect(html).toContain('Dagens antrekk');
    expect(html).toContain(', klart hver eneste morgen');
    expect(html).toContain('I morgen og hele neste uke');
    expect(html).toContain(', ferdig planlagt');
    expect(html).toContain('Del med alle');
    expect(html).toContain(' som passer barnet');
    // v2 (P10/JOB2 re-skin, docs/mocks/monter/paywall-v2.html): den gamle
    // PAYWALL_COPY.trialLine-avsnittet under CTA-en er erstattet av
    // choose-hint-linjen mellom planvelgeren og CTA-en — samme plan-
    // agnostiske «7 dager gratis uansett plan»-budskap, ny plassering/ordlyd.
    // PAYWALL_COPY.trialLine-KONSTANTEN selv (uendret verdi) er fortsatt
    // låst i paywall-copy.test.ts — kun DENNE render-testen er oppdatert.
    expect(html).toContain('Alle planer starter med 7 gratisdager');
  });
});

// P9 duel §8 note: AppPaywallGate always mounts ONE <PaywallDialog> and only
// varies its `open` prop, which (like the rest of this native-<dialog>-based
// component — see PaywallDialog.tsx's showModal()/close() effect) is applied
// IMPERATIVELY, not reflected into SSR markup. That makes `due`'s dynamic
// effect on visibility unobservable via renderToStaticMarkup — the same
// constraint the pre-existing render tests above already work within (they
// only assert STRUCTURAL wiring, e.g. dismissable=false's "no close button",
// never `due` itself). The grace-window's actual due/not-due behaviour is
// therefore covered where it's actually observable: the isHardPaywallDue
// pure-function suite above, plus e2e/purchase-flow.ts's real browser
// gate-* scenarios (session 1 free-read vs. session 2 auto-shown gate).
