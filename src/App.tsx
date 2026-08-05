/**
 * App.tsx — F60 routing (Claude Design port).
 *
 * Tab-state + drill-state + sheet-state. Alle hooks før conditional returns.
 *
 * Native-feel #9 (2026-06-26): screens lastes nå via React.lazy + Suspense.
 * Reduserer initial JS-bundle: bare aktiv rute hentes. Fallback er en minimal
 * canvas-skeleton som matcher app-shell (ingen layout-shift).
 *
 * P6: GuideHubScreen.tsx er slettet (avmontert siden P1). `GuideTarget`
 * (tidligere `GuideHubTarget`, eksportert derfra) bor nå i types/nav.ts.
 */
import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Capacitor } from '@capacitor/core';
import { AnimatePresence, motion } from 'motion/react';
import type { FamilieToolTarget, GuideTarget, TabKey } from './types/nav';
import { useChildren } from './state/children-store';
import { useTheme } from './state/theme-store';
import { useAutoLocationRefresh } from './hooks/useAutoLocationRefresh';
import { useOutfitTransitionCoordinator } from './hooks/useOutfitTransitionCoordinator';
import { BottomTabBar } from './components/BottomTabBar';
import { OutfitTransitionOverlay } from './components/outfit-transition/OutfitTransitionOverlay';
import { AppPaywallGate } from './components/AppPaywallGate';

import type { FinnAntrekkPrefill } from './screens/finn-antrekk-prefill';
import {
  isPlannedOutfitContext,
  type PlannedOutfitContext,
} from './lib/planning/planned-outfit-context';
import {
  produceOutfitBundle,
  type OutfitBundleProducerResult,
} from './lib/outfit/outfit-bundle-producer';
import {
  consumeRequestedPlanningView,
  issueRequestedPlanningView,
  shouldClosePlannedDrillOnAccess,
  type RequestedPlanningViewState,
} from './lib/planning/planning-interaction';
import { decideAccess } from './lib/access/capabilities';
import { useAccess } from './lib/premium/use-access';
import { resolveRuntimeCapabilityAccess } from './lib/premium/gating';
import { PLUS_FEATURE_AVAILABILITY } from './lib/premium/plus-features';
import { useSubscription } from './state/subscription-store';
import { useLocationPref } from './state/location-pref-store';
import { useSceneHeight } from './hooks/useSceneHeight';
import { klePaaKildeFor } from './components/klepaa/kle-paa-rute';

/**
 * SIDESKIFTETS VARIGHETER — LEST FRA KONTRAKTEN, IKKE SKREVET PAA NYTT.
 *
 * motion/react vil ha sekunder som tall, ikke en CSS-variabel. Skriver man
 * tallene her, har man laget en andre sannhet ved siden av --dw-m-push /
 * --dw-m-push-back. Verdiene leses derfor ut av de faktiske tokenene.
 */
function lesMs(navn: string, fallback: number): number {
  if (typeof document === 'undefined') return fallback;
  const raa = getComputedStyle(document.documentElement).getPropertyValue(navn).trim();
  const m = /^([d.]+)(ms|s)$/u.exec(raa);
  if (!m) return fallback;
  return m[2] === 's' ? Number(m[1]) * 1000 : Number(m[1]);
}

const BEVEGELSE = {
  /** Drill inn: ett nivaa NED i hierarkiet, altsaa opp paa skjermen. */
  push: lesMs('--dw-m-push', 340) / 1000,
  /** Tilbake: raskere ut enn inn — bevegelseskontraktens egen regel. */
  pushTilbake: lesMs('--dw-m-push-back', 280) / 1000,
  /** Hovedfaner er SIDESTILTE: crossfade, aldri push. */
  faneInn: 0.14,
  faneUt: 0.1,
  /** En kurve for hele appen (--dw-ease). */
  kurve: [0.2, 0.7, 0.2, 1] as [number, number, number, number],
};

/** Hovedfane eller drill? Grammatikken er ulik, og det er hele poenget. */
const erFane = (routeKey: string): boolean => routeKey.startsWith('tab:');

const HjemScreen = lazy(() =>
  import('./screens/HjemScreen').then((m) => ({ default: m.HjemScreen })),
);
const PaakledningScreen = lazy(() =>
  import('./screens/PaakledningScreen').then((m) => ({ default: m.PaakledningScreen })),
);
const KlePaaOverlay = lazy(() =>
  import('./components/klepaa/KlePaaOverlay').then((m) => ({ default: m.KlePaaOverlay })),
);
const UkeScreen = lazy(() =>
  import('./screens/UkeScreen').then((m) => ({ default: m.UkeScreen })),
);
// P1 (nav 4→3 skeleton): Guide-roten er fjernet (se types/nav.ts) — de gamle
// Guide-sub-sidene rutes direkte som drills under i stedet. GuideHubScreen.tsx
// selv var avmontert siden P1 og er slettet i P6 (`GuideTarget`, tidligere
// `GuideHubTarget` eksportert derfra, bor nå i types/nav.ts).
const FinnAntrekkScreen = lazy(() =>
  import('./screens/FinnAntrekkScreen').then((m) => ({ default: m.FinnAntrekkScreen })),
);
const PlaggbibliotekScreen = lazy(() =>
  import('./screens/PlaggbibliotekScreen').then((m) => ({ default: m.PlaggbibliotekScreen })),
);
const TogGuideScreen = lazy(() =>
  import('./screens/TogGuideScreen').then((m) => ({ default: m.TogGuideScreen })),
);
const VarmEllerKaldScreen = lazy(() =>
  import('./screens/VarmEllerKaldScreen').then((m) => ({ default: m.VarmEllerKaldScreen })),
);
const VinterprogramScreen = lazy(() =>
  import('./screens/VinterprogramScreen').then((m) => ({ default: m.VinterprogramScreen })),
);
const FamilieScreen = lazy(() =>
  import('./screens/FamilieScreen').then((m) => ({ default: m.FamilieScreen })),
);
const OnboardingScreen = lazy(() =>
  import('./screens/OnboardingScreen').then((m) => ({ default: m.OnboardingScreen })),
);

/**
 * RouteSkeleton — minimal canvas-fallback mens en lazy-route hentes.
 * Bruker bg-canvas-token + tar full høyde slik at app-shell ikke kollapser.
 * `role="status"` + sr-only-tekst gjør at skjermlesere annonserer lasting,
 * uten å bryte prefers-reduced-motion (ingen animasjon).
 */
function RouteSkeleton(): ReactElement {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{
        minHeight: '100vh',
        background: 'var(--bg-canvas)',
      }}
    >
      <span className="sr-only">Laster skjerm …</span>
    </div>
  );
}

const TAB_TITLES: Record<TabKey, string> = {
  hjem: 'Hjem · Babyora',
  plan: 'Planlegg · Babyora',
  familie: 'Familie · Babyora',
};

/**
 * Drill-state bærer påkledning-context fra opener-skjermen (Hjem / Uke) inn i
 * popupen. Slik unngår vi at PaakledningScreen recomputer recommendation fra
 * sin EGEN local activity/vognMode (default 'utelek') og dermed ignorerer
 * Sivert sine toggle-valg på Hjem. context kan være undefined for bakover-
 * kompatibilitet (test/preview-mounts uten payload).
 */
type Drill =
  | null
  | {
      kind: 'paakledning';
      source: 'current';
      currentContext: PlannedOutfitContext;
      outfitBundle?: OutfitBundleProducerResult;
      origin: HTMLElement;
    }
  | {
      kind: 'paakledning';
      source: 'planned';
      plannedContext: PlannedOutfitContext;
      outfitBundle?: OutfitBundleProducerResult;
      origin: HTMLElement;
    }
  // P1: tidligere ETT samlet guide-drill-kind med et GuideTarget (den gang
  // eksportert som GuideHubTarget fra GuideHubScreen.tsx, siden slettet i P6)
  // — splittet i tre etter Guide-tab-fjerningen. tog/varm-kald/forste-vinter
  // (FamilieToolTarget) åpnes nå fra Familie sin "Verktøy"-seksjon → mappes
  // til 'familie' i activeTabForBar. finn-antrekk har en synlig opener (P5:
  // onOpenAdjust, wired fra Hjems resultat via HjemMonter/HjemScreen) —
  // plaggbib fikk sin (P6: onOpenPlaggbib, wired fra PlaggDetailSheet sin
  // "Se alternativer i biblioteket", åpnet via Hjems Bytt-rad). Begge mappes
  // til 'hjem' i activeTabForBar siden det er deres opener-kontekst.
  | { kind: 'familie-tool'; target: FamilieToolTarget }
  // P5: prefill er valgfri — satt når drillen åpnes SOM "Juster" fra Hjems
  // cachede resultat (WeatherStrip/vær-panelet, via HjemMonter → HjemScreen
  // → onOpenAdjust under). Fraværende ved den generiske GuideTarget-åpneren
  // (onOpenGuideTarget) — samme skjerm, bare uten live-værkontekst å seede fra.
  | { kind: 'finn-antrekk'; prefill?: FinnAntrekkPrefill }
  // P6: fikk sin opener — onOpenPlaggbib, wired fra PlaggDetailSheet sin
  // "Se alternativer i biblioteket" (åpnet via Hjems Bytt-rad, HjemMonter) —
  // i tillegg til den allerede eksisterende onOpenGuideTarget('plaggbib')-
  // veien fra Første vinter sine leksjoner.
  | { kind: 'plaggbib' };

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function useClosePlannedDrillOnAccess({
  isPlannedDrill,
  loading,
  isPremium,
  onClose,
}: {
  isPlannedDrill: boolean;
  loading: boolean;
  isPremium: boolean;
  onClose: () => void;
}): void {
  useEffect(() => {
    if (shouldClosePlannedDrillOnAccess(
      isPlannedDrill,
      { loading, isPremium },
    )) {
      onClose();
    }
  }, [isPlannedDrill, isPremium, loading, onClose]);
}

export default function App(): ReactElement {
  // Førstegangs-flyt: har familien ingen barn ennå, vises OnboardingScreen
  // i stedet for app-shellet. Vi styrer på egen `onboardingDone`-state (ikke
  // rått `needsOnboarding`), fordi OnboardingScreen kaller completeOnboarding()
  // ALLEREDE på steg 4 (som flipper needsOnboarding→false) men skal fortsatt
  // vise velkomst-steget før den melder ferdig via onComplete.
  const { needsOnboarding, active } = useChildren();
  const [onboardingDone, setOnboardingDone] = useState(!needsOnboarding);
  const locationMode = useLocationPref((state) => state.mode);
  const [tab, setTab] = useState<TabKey>('hjem');
  const [drill, setDrill] = useState<Drill>(null);
  const outfitTransition = useOutfitTransitionCoordinator();
  const [requestedPlanViewState, setRequestedPlanViewState] = useState<RequestedPlanningViewState>({
    nextToken: 0,
    requestedView: null,
  });
  const mainRef = useRef<HTMLElement | null>(null);
  const themeMode = useTheme((s) => s.mode);
  const { isPremium, loading: accessLoading } = useAccess();
  const automaticLocationAccess = useMemo(
    () => resolveRuntimeCapabilityAccess(
      'automatic_location',
      { isPlus: isPremium, authenticated: false, loading: accessLoading },
      PLUS_FEATURE_AVAILABILITY,
    ),
    [accessLoading, isPremium],
  );
  useAutoLocationRefresh({
    runtimeDecision: automaticLocationAccess,
    mode: locationMode,
    childId: active.id,
    enabled: onboardingDone && !needsOnboarding,
  });
  const liveFutureAccess = decideAccess('future_plan', {
    isPlus: isPremium,
    authenticated: false,
    loading: accessLoading,
  });

  useEffect(() => {
    document.documentElement.lang = 'nb';
  }, []);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    const syncPersistedEntitlement = (event: StorageEvent) => {
      if (event.key !== 'babyora.subscription') return;
      void useSubscription.persist.rehydrate();
    };
    window.addEventListener('storage', syncPersistedEntitlement);
    return () => window.removeEventListener('storage', syncPersistedEntitlement);
  }, []);

  // Theme-mode → data-theme på <html>. 'auto' fjerner attributtet slik at
  // prefers-color-scheme styrer. Boot-scriptet i index.html setter samme
  // attributt FØR React mounter for å unngå FOUC; denne useEffect-en
  // synker bare etterfølgende endringer fra theme-toggle.
  useEffect(() => {
    if (themeMode === 'auto') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', themeMode);
    }
  }, [themeMode]);

  useEffect(() => {
    document.title = TAB_TITLES[tab];
  }, [tab]);

  // P9 (duel §8 — paywall-armering): "Planlegg" (i morgen og resten av uken)
  // er den fremste låsemerkede verdihandlingen etter at gratis-vinduet er
  // brukt opp — et trykk hit stenger denne øktens "les ferdig"-vindu, som
  // umiddelbart gjør AppPaywallGate due (samme ENESTE mount, ingen ny
  // paywall-instans — se subscription-store.ts sin egen kommentar). No-op
  // hvis vinduet allerede var stengt (Premium/ingen anbefaling ennå/tidligere
  // konsumert), se consumeRecommendationGraceWindow.
  const onNavigate = (next: TabKey) => {
    outfitTransition.abort('closed');
    setDrill(null);
    setTab(next);
    if (next === 'plan') useSubscription.getState().consumeRecommendationGraceWindow();
  };

  // P1: navnet `onOpenGuideTarget` beholdes (fortsatt sendt til VinterprogramScreen
  // som onOpenTarget) — targets ruter nå til tre ulike drill-kinder i stedet for
  // ett samlet `guide`-kind, se Drill-unionen over.
  const onOpenGuideTarget = useCallback((target: GuideTarget) => {
    if (target === 'snart') {
      setDrill(null);
      setTab('plan');
      setRequestedPlanViewState((current) => issueRequestedPlanningView(current, 'snart'));
      window.requestAnimationFrame(() => mainRef.current?.focus());
      return;
    }
    if (target === 'finn-antrekk') {
      setDrill({ kind: 'finn-antrekk' });
      return;
    }
    if (target === 'plaggbib') {
      setDrill({ kind: 'plaggbib' });
      return;
    }
    setDrill({ kind: 'familie-tool', target });
  }, []);

  const onOpenWarmColdGuide = useCallback(() => {
    setDrill({ kind: 'familie-tool', target: 'varm-kald' });
  }, []);

  // P6: contextual opener for the Plaggbibliotek drill — same replace-in-
  // place pattern as onOpenWarmColdGuide above ('plaggbib' was already a
  // drill kind since P1, it just had no opener). Wired to PlaggDetailSheet's
  // "Se alternativer i biblioteket" affordance from Hjem's Monter-result
  // "Bytt" row (HjemMonter → HjemScreen). NOT threaded into PaakledningScreen:
  // its live branch (PlannedPaakledningScreen) renders no PlaggDetailSheet at
  // all — planned/current outfits' own alternative-picking UI is
  // OutfitExperience/OutfitGarmentList's "Se alternativer" (via
  // OutfitTruthPanel), which is engine-connected (src/lib/outfit) and
  // deliberately a separate, committed-swap flow from PlaggDetailSheet's
  // informational-only pattern (see warm-cold-recovery.test.ts).
  // PaakledningScreen's OWN PlaggDetailSheet instance lives only in
  // CurrentPaakledningScreen, which is unreachable dead code (every caller
  // supplies currentContext/plannedContext).
  const onOpenPlaggbib = useCallback(() => {
    setDrill({ kind: 'plaggbib' });
  }, []);

  // P5: Hjem's opener for the "Juster" drill (WeatherStrip's Juster button +
  // the weather-ready panel's place pill, threaded HjemMonter → HjemScreen →
  // here) — same drill-kind as onOpenGuideTarget's 'finn-antrekk' branch
  // above, but carries a live-weather prefill so FinnAntrekkScreen's sliders
  // open already matching what Hjem just showed (PRODUCT.md, locked).
  const onOpenAdjust = useCallback((prefill: FinnAntrekkPrefill) => {
    setDrill({ kind: 'finn-antrekk', prefill });
  }, []);

  // P1: opener for Familie sin nye "Verktøy"-seksjon (ToolsSection) — samme
  // drill-kind som onOpenWarmColdGuide/onOpenGuideTarget bruker for
  // tog/varm-kald/forste-vinter.
  const onOpenTool = useCallback((target: FamilieToolTarget) => {
    setDrill({ kind: 'familie-tool', target });
  }, []);

  const onConsumeRequestedPlanView = useCallback((token: number) => {
    setRequestedPlanViewState((current) => {
      const { consumedView: _consumedView, ...next } = consumeRequestedPlanningView(
        current,
        token,
      );
      return next;
    });
  }, []);

  const onOpenPlannedOutfit = (
    plannedContext: PlannedOutfitContext,
    origin: HTMLElement,
  ) => {
    if (!isPlannedOutfitContext(plannedContext) || !origin.isConnected) return;
    if (
      plannedContext.access.capability === 'future_plan'
      && !liveFutureAccess.allowed
    ) {
      return;
    }
    const outfitBundle = plannedContext.sourceKind === 'phase2-outfit-truth'
      ? produceOutfitBundle({
          seed: plannedContext.producerSeed,
          source: {
            kind: 'planned',
            sourceContextId: plannedContext.producerSeed.sourceContextId,
            planningEventId: plannedContext.planningEventId,
            plannedForIso: plannedContext.plannedForIso,
          },
        })
      : undefined;
    setDrill({
      kind: 'paakledning',
      source: 'planned',
      plannedContext,
      outfitBundle,
      origin,
    });
  };

  const createCurrentOutfitBundle = useCallback((
    currentContext: PlannedOutfitContext,
  ): OutfitBundleProducerResult | undefined => (
    currentContext.sourceKind === 'phase2-outfit-truth'
      ? produceOutfitBundle({
          seed: currentContext.producerSeed,
          source: {
            kind: 'current',
            sourceContextId: currentContext.producerSeed.sourceContextId,
          },
        })
      : undefined
  ), []);

  const onOpenCurrentOutfit = (
    currentContext: PlannedOutfitContext,
    origin: HTMLElement,
    outfitBundle: OutfitBundleProducerResult | undefined,
  ) => {
    if (!isPlannedOutfitContext(currentContext) || !origin.isConnected) return;
    outfitTransition.captureBeforeNavigation(outfitBundle);
    setDrill({
      kind: 'paakledning',
      source: 'current',
      currentContext,
      outfitBundle,
      origin,
    });
  };

  const reduceMotion = prefersReducedMotion();
  /* Hvor langt en side skal skyves: SCENEN, ikke siden. Se
     hooks/useSceneHeight.ts — 'y: 100%' ga 2348 px paa Soveguiden. */
  const sceneHeight = useSceneHeight(mainRef);

  const onBackRef = useRef<(() => void) | null>(null);

  const closePaakledning = useCallback(() => {
    const origin = drill?.kind === 'paakledning' ? drill.origin : null;
    const source = drill?.kind === 'paakledning' ? drill.source : null;
    outfitTransition.abort('closed');
    setDrill(null);
    if (!origin) return;
    window.requestAnimationFrame(() => {
      if (origin.isConnected) {
        origin.focus();
      } else if (source === 'current') {
        document.getElementById('hjem-current-outfit-trigger')?.focus();
      } else {
        mainRef.current?.focus();
      }
    });
  }, [drill, outfitTransition]);

  const isAccessGatedPlannedDrill = drill?.kind === 'paakledning'
    && drill.source === 'planned'
    && drill.plannedContext.access.capability === 'future_plan';
  useClosePlannedDrillOnAccess({
    isPlannedDrill: isAccessGatedPlannedDrill,
    loading: accessLoading,
    isPremium: liveFutureAccess.allowed,
    onClose: closePaakledning,
  });

  const activeDrill = shouldClosePlannedDrillOnAccess(
    isAccessGatedPlannedDrill,
    { loading: accessLoading, isPremium: liveFutureAccess.allowed },
  )
    ? null
    : drill;
  const canGoBack = activeDrill !== null || tab !== 'hjem';

  // A11y (2026-07-11): når onboarding fullføres og app-shellet tar over, flytt
  // fokus til <main> så skjermlesere annonserer Hjem og tab-fokus ikke faller
  // til <body>. Fyres KUN på selve overgangen — ikke ved vanlig app-start for
  // en returnerende bruker (da starter onboardingDone allerede true).
  const cameFromOnboarding = useRef(!onboardingDone);
  useEffect(() => {
    if (onboardingDone && cameFromOnboarding.current) {
      cameFromOnboarding.current = false;
      mainRef.current?.focus();
    }
  }, [onboardingDone]);

  useEffect(() => {
    if (!canGoBack) {
      onBackRef.current = null;
      return;
    }
    onBackRef.current = () => {
      if (activeDrill !== null) {
        if (activeDrill.kind === 'paakledning') {
          closePaakledning();
        } else {
          setDrill(null);
        }
      } else {
        setTab('hjem');
      }
    };
  }, [activeDrill, tab, canGoBack, closePaakledning]);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    const EDGE_TRIGGER_PX = 24;
    const COMMIT_THRESHOLD_PX = 60;
    const reduce = prefersReducedMotion();

    let tracking = false;
    let startX = 0;
    let startY = 0;
    let currentDx = 0;
    let committed = false;

    const resetTransform = () => {
      if (reduce) return;
      el.style.transform = '';
      el.style.transition = 'transform 200ms ease-out';
      window.setTimeout(() => {
        if (el) el.style.transition = '';
      }, 220);
    };

    const onTouchStart = (ev: TouchEvent) => {
      if (ev.touches.length !== 1) return;
      const t = ev.touches[0];
      if (t.clientX > EDGE_TRIGGER_PX) return;
      if (!onBackRef.current) return;
      tracking = true;
      committed = false;
      startX = t.clientX;
      startY = t.clientY;
      currentDx = 0;
      if (!reduce) {
        el.style.transition = '';
      }
    };

    const onTouchMove = (ev: TouchEvent) => {
      if (!tracking) return;
      const t = ev.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 12) {
        tracking = false;
        resetTransform();
        return;
      }
      if (dx < 0) {
        currentDx = 0;
        if (!reduce) el.style.transform = '';
        return;
      }
      currentDx = dx;
      if (!reduce) {
        el.style.transform = `translate3d(${dx}px, 0, 0)`;
      }
      if (dx >= COMMIT_THRESHOLD_PX) {
        committed = true;
      }
    };

    const onTouchEnd = () => {
      if (!tracking) return;
      tracking = false;
      const shouldCommit = committed && currentDx >= COMMIT_THRESHOLD_PX;
      resetTransform();
      committed = false;
      currentDx = 0;
      if (shouldCommit && onBackRef.current) {
        onBackRef.current();
      }
    };

    const onTouchCancel = () => {
      if (!tracking) return;
      tracking = false;
      committed = false;
      currentDx = 0;
      resetTransform();
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchCancel);

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchCancel);
      if (!reduce) {
        el.style.transform = '';
        el.style.transition = '';
      }
    };
  }, []);

  // Førstegangs-onboarding tar over hele skjermen (egen <main> + <h1>,
  // ingen BottomTabBar). onComplete melder ferdig etter velkomst-stegene.
  const currentTransitionBundle = (
    activeDrill?.kind === 'paakledning'
    && activeDrill.source === 'current'
  ) ? activeDrill.outfitBundle : undefined;
  const selectTransitionHomeSources = outfitTransition.selectHomeSources;
  const transitionPresentation = useMemo(() => {
    if (currentTransitionBundle === undefined) return null;
    const selection = selectTransitionHomeSources(
      currentTransitionBundle,
    );
    return selection.kind === 'ready' ? selection.sources : null;
  }, [currentTransitionBundle, selectTransitionHomeSources]);
  const transitionSnapshot = (
    outfitTransition.state.status === 'ready'
    || outfitTransition.state.status === 'playing'
  ) ? outfitTransition.state.snapshot : null;
  const transitionIsLanding = (
    transitionSnapshot !== null
    && transitionPresentation !== null
  );

  useEffect(() => {
    if (
      outfitTransition.state.status === 'ready'
      && transitionPresentation !== null
    ) {
      outfitTransition.beginPlayback();
    }
  }, [outfitTransition, transitionPresentation]);

  const finishOutfitTransition = useCallback(() => {
    outfitTransition.settle('completed');
  }, [outfitTransition]);
  const abortOutfitTransitionOverlay = useCallback(() => {
    outfitTransition.abort('motion-ineligible');
  }, [outfitTransition]);

  if (!onboardingDone) {
    return (
      <div className="app-shell">
        <Suspense fallback={<RouteSkeleton />}>
          <OnboardingScreen onComplete={() => setOnboardingDone(true)} />
        </Suspense>
      </div>
    );
  }

  let routeKey: string;
  let routeContent: ReactNode;

  // Active tab for global BottomTabBar:
  //  - drill === null                 → use current tab
  //  - drill.kind === 'familie-tool'  → 'familie' (åpnet via Familie sin
  //    Verktøy-seksjon — tog/varm-kald/forste-vinter)
  //  - drill.kind === 'finn-antrekk' / 'plaggbib' → 'hjem' (åpnet via Hjems
  //    resultat — finn-antrekk siden P5; plaggbib venter fortsatt på en
  //    synlig opener, se Drill-union-kommentaren)
  //  - drill.kind === 'paakledning'   → 'hjem' (åpnet via Hjem CTA;
  //    baren skjules uansett siden PaakledningScreen er native dialog modal)
  let activeTabForBar: TabKey;
  if (activeDrill === null) {
    activeTabForBar = tab;
  } else if (activeDrill.kind === 'familie-tool') {
    activeTabForBar = 'familie';
  } else {
    activeTabForBar = 'hjem';
  }

  // PaakledningScreen mounter <dialog>.showModal() — native modal som
  // dekker hele skjermen. BottomTabBar skal IKKE være synlig / klikkbar
  // mens den er åpen. Vi dropper rendring helt for clarity.
  const sheetOpen = activeDrill?.kind === 'paakledning';

  /* Rutevalget bor i `kle-paa-rute.ts`, ikke her: en betingelse skrevet inn i
     JSX kan ikke måles uten å rendre hele denne filen — og det var nettopp en
     umålt vei som gjorde at stepperen sto ferdig og unådd. */
  const klePaaSteg = klePaaKildeFor(activeDrill);

  if (activeDrill?.kind === 'finn-antrekk') {
    routeKey = 'drill:finn-antrekk';
    routeContent = (
      <FinnAntrekkScreen onBack={() => setDrill(null)} prefill={activeDrill.prefill} />
    );
  } else if (activeDrill?.kind === 'plaggbib') {
    routeKey = 'drill:plaggbib';
    routeContent = <PlaggbibliotekScreen onBack={() => setDrill(null)} />;
  } else if (activeDrill?.kind === 'familie-tool' && activeDrill.target === 'tog') {
    routeKey = 'drill:familie-tool:tog';
    routeContent = <TogGuideScreen onBack={() => setDrill(null)} />;
  } else if (activeDrill?.kind === 'familie-tool' && activeDrill.target === 'varm-kald') {
    routeKey = 'drill:familie-tool:varm-kald';
    routeContent = <VarmEllerKaldScreen onBack={() => setDrill(null)} />;
  } else if (activeDrill?.kind === 'familie-tool' && activeDrill.target === 'forste-vinter') {
    routeKey = 'drill:familie-tool:forste-vinter';
    routeContent = (
      <VinterprogramScreen
        onBack={() => setDrill(null)}
        onOpenTarget={onOpenGuideTarget}
      />
    );
  } else if (tab === 'hjem') {
    routeKey = 'tab:hjem';
    routeContent = (
      <HjemScreen
        onNavigate={onNavigate}
        onOpenSheet={onOpenCurrentOutfit}
        createCurrentOutfitBundle={createCurrentOutfitBundle}
        selectHomeSources={outfitTransition.selectHomeSources}
        registerHomeAnchor={outfitTransition.registerHomeAnchor}
        observeTransitionBundle={outfitTransition.observeBundle}
        outfitTransitionStatus={outfitTransition.state.status}
        onOpenAdjust={onOpenAdjust}
        onOpenWarmColdGuide={onOpenWarmColdGuide}
        onOpenPlaggbib={onOpenPlaggbib}
      />
    );
  } else if (tab === 'plan') {
    routeKey = 'tab:plan';
    routeContent = (
      <UkeScreen
        onNavigate={onNavigate}
        onOpenSheet={() => undefined}
        onOpenPlannedOutfit={onOpenPlannedOutfit}
        requestedPlanView={requestedPlanViewState.requestedView?.view ?? null}
        requestedPlanViewToken={requestedPlanViewState.requestedView?.token ?? null}
        onConsumeRequestedPlanView={onConsumeRequestedPlanView}
      />
    );
  } else {
    // R7 Task 3: Familie-roten hoster innstillingsinnholdet til Task 7
    // restrukturerer den (barn/omsorgspersoner/steder/Plus-seksjoner).
    // P1: FamilieScreen får nå onOpenTool for sin "Verktøy"-seksjon (de
    // tidligere Guide-"kunnskap"-kortene tog/varm-kald/forste-vinter).
    routeKey = 'tab:familie';
    routeContent = <FamilieScreen onNavigate={onNavigate} onOpenTool={onOpenTool} />;
  }

  return (
    <div
      className="app-shell"
      data-outfit-transition-state={outfitTransition.state.status}
    >
      {/* P2 hard paywall (PRODUCT.md, 2026-07-31): mountes over hele
          tab-routingen. Rendrer sin egen (ikke-avviselig, native <dialog>)
          overlay kun når onboarding er fullført + første anbefaling er vist
          + brukeren ikke er Premium — se AppPaywallGate.tsx. */}
      <AppPaywallGate onboardingDone={onboardingDone} />
      <a href="#main" className="skip-link">Hopp til hovedinnhold</a>
      <main id="main" tabIndex={-1} ref={mainRef}>
        {reduceMotion ? (
          <Suspense fallback={<RouteSkeleton />}>{routeContent}</Suspense>
        ) : (
          /* Rutenettcellen begge sidene deler, så de kan ligge oppå
             hverandre og bevege seg samtidig. Se .ba-sideskift i
             design-tokens.css. */
          <div className="ba-sideskift">
            <AnimatePresence initial={false}>
              {/* mode="wait" er BORTE, og det var kjernen i eierfunnet: den
                  lot den gamle siden bli FERDIG før den nye begynte. To
                  bevegelser etter hverandre leses som et bytte, ikke som at
                  noe flytter seg. Uten mode ligger begge i DOM-en samtidig,
                  stablet i .ba-sideskift, og beveger seg i takt.

                  DRILLS pusher VERTIKALT en SKJERMHØYDE. Ikke `y: '100%'` —
                  prosenter regnes av sidens EGEN høyde, og Soveguiden er
                  2348 px. Da fikk hver skjerm sin egen fart, styrt av hvor
                  mye tekst den tilfeldigvis har.

                  HOVEDFANER crossfader, aldri push: de er sidestilte, ikke
                  over/under hverandre. */}
              <motion.div
                key={routeKey}
                initial={erFane(routeKey) ? { opacity: 0 } : { opacity: 0, y: sceneHeight }}
                animate={{ opacity: 1, y: 0 }}
                exit={
                  erFane(routeKey)
                    ? { opacity: 0, transition: { duration: BEVEGELSE.faneUt } }
                    : {
                      opacity: 0,
                      y: -Math.round(sceneHeight * 0.3),
                      transition: { duration: BEVEGELSE.pushTilbake },
                    }
                }
                transition={
                  erFane(routeKey)
                    ? { duration: BEVEGELSE.faneInn, ease: 'easeOut' }
                    : { duration: BEVEGELSE.push, ease: BEVEGELSE.kurve }
                }
              >
                {/* Lastegrensen bor HER, inne i siden. Lå den RUNDT
                    overgangen, ble hele laget byttet mot fallbacken når en
                    lazy drill suspenderte — og animasjonen rakk aldri å
                    tegne. Målt 2026-08-05. */}
                <Suspense fallback={<RouteSkeleton />}>{routeContent}</Suspense>
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </main>
      {/* Global BottomTabBar — alltid synlig unntatt når native dialog-modal
          (PaakledningScreen) er åpen. Skjermer mounter den ikke selv. */}
      {!sheetOpen && (
        <BottomTabBar active={activeTabForBar} onNavigate={onNavigate} />
      )}
      {/* PaakledningScreen mountes som søsken-overlay OPPÅ aktiv route
          (typisk HjemScreen). Native <dialog>.showModal() håndterer
          focus-trap + ESC + aria-modal. Hjem forblir mounted bak så
          state/scroll-posisjon bevares og fokus returneres til CTA
          ved lukk. F72 fix 2026-06-29. */}
      {sheetOpen && activeDrill?.kind === 'paakledning' && (
        <Suspense fallback={null}>
          {activeDrill.source === 'planned' ? (
            <PaakledningScreen
              onBack={closePaakledning}
              plannedContext={activeDrill.plannedContext}
              outfitBundle={activeDrill.outfitBundle}
              registerOutfitRow={outfitTransition.registerOutfitRow}
              transitionVisualState={transitionIsLanding ? 'landing' : 'settled'}
              onOpenWarmColdGuide={onOpenWarmColdGuide}
            />
          ) : klePaaSteg !== null ? (
            /* CTA-en heter «Kle på, steg for steg». Fra 2026-08-05 fører den
               dit navnet sier: ETT plagg per steg. Før dette landet den på
               Påkledning, som viser hele antrekket som en liste — knappen
               lovet en sekvens og flaten ga et oppslagsverk (eierfunn).
               Den PLANLAGTE veien over er urørt: der er listen riktig, for
               der leser man et antrekk man ikke skal på med akkurat nå. */
            <KlePaaOverlay bundle={klePaaSteg} onClose={closePaakledning} />
          ) : (
            /* Uten en støttet bundel finnes det ingen sekvens å vise — da er
               den gamle flaten fortsatt det ærligste svaret, ikke en tom
               stepper. */
            <PaakledningScreen
              onBack={closePaakledning}
              currentContext={activeDrill.currentContext}
              outfitBundle={activeDrill.outfitBundle}
              registerOutfitRow={outfitTransition.registerOutfitRow}
              transitionVisualState={transitionIsLanding ? 'landing' : 'settled'}
              onOpenWarmColdGuide={onOpenWarmColdGuide}
            />
          )}
        </Suspense>
      )}
      {transitionIsLanding && transitionSnapshot !== null && (
        <OutfitTransitionOverlay
          snapshot={transitionSnapshot}
          presentations={transitionPresentation}
          reducedMotion={reduceMotion}
          onFinish={finishOutfitTransition}
          onAbort={abortOutfitTransitionOverlay}
        />
      )}
    </div>
  );
}
