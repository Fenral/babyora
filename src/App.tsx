/**
 * App.tsx — F60 routing (Claude Design port).
 *
 * Tab-state + drill-state + sheet-state. Alle hooks før conditional returns.
 *
 * Native-feel #9 (2026-06-26): screens lastes nå via React.lazy + Suspense.
 * Reduserer initial JS-bundle: bare aktiv rute hentes. Fallback er en minimal
 * canvas-skeleton som matcher app-shell (ingen layout-shift). Type-importen
 * `GuideHubTarget` blir værende statisk siden type-imports ikke trekker kode.
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
import type { TabKey } from './types/nav';
import { useChildren } from './state/children-store';
import { useTheme } from './state/theme-store';
import { useAutoLocationRefresh } from './hooks/useAutoLocationRefresh';
import { BottomTabBar } from './components/BottomTabBar';

import type { GuideHubTarget } from './screens/GuideHubScreen';
import {
  isPlannedOutfitContext,
  type PlannedOutfitContext,
} from './lib/planning/planned-outfit-context';
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

const HjemScreen = lazy(() =>
  import('./screens/HjemScreen').then((m) => ({ default: m.HjemScreen })),
);
const PaakledningScreen = lazy(() =>
  import('./screens/PaakledningScreen').then((m) => ({ default: m.PaakledningScreen })),
);
const UkeScreen = lazy(() =>
  import('./screens/UkeScreen').then((m) => ({ default: m.UkeScreen })),
);
const GuideHubScreen = lazy(() =>
  import('./screens/GuideHubScreen').then((m) => ({ default: m.GuideHubScreen })),
);
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
  guide: 'Guide · Babyora',
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
      origin: HTMLElement;
    }
  | {
      kind: 'paakledning';
      source: 'planned';
      plannedContext: PlannedOutfitContext;
      origin: HTMLElement;
    }
  | { kind: 'guide'; target: GuideHubTarget };

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
  const [requestedPlanViewState, setRequestedPlanViewState] = useState<RequestedPlanningViewState>({
    nextToken: 0,
    requestedView: null,
  });
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

  const onNavigate = (next: TabKey) => {
    setDrill(null);
    setTab(next);
  };

  const onOpenGuideTarget = useCallback((target: GuideHubTarget | 'snart') => {
    if (target === 'snart') {
      setDrill(null);
      setTab('plan');
      setRequestedPlanViewState((current) => issueRequestedPlanningView(current, 'snart'));
      return;
    }
    setDrill({ kind: 'guide', target });
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
    setDrill({
      kind: 'paakledning',
      source: 'planned',
      plannedContext,
      origin,
    });
  };

  const reduceMotion = prefersReducedMotion();

  const mainRef = useRef<HTMLElement | null>(null);
  const onBackRef = useRef<(() => void) | null>(null);

  const closePaakledning = useCallback(() => {
    const origin = drill?.kind === 'paakledning' ? drill.origin : null;
    const source = drill?.kind === 'paakledning' ? drill.source : null;
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
  }, [drill]);

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
  //  - drill === null            → use current tab
  //  - drill.kind === 'guide'    → 'guide' (sub-side i guide-flow)
  //  - drill.kind === 'paakledning' → 'hjem' (åpnet via Hjem CTA;
  //    baren skjules uansett siden PaakledningScreen er native dialog modal)
  let activeTabForBar: TabKey;
  if (activeDrill === null) {
    activeTabForBar = tab;
  } else if (activeDrill.kind === 'guide') {
    activeTabForBar = 'guide';
  } else {
    activeTabForBar = 'hjem';
  }

  // PaakledningScreen mounter <dialog>.showModal() — native modal som
  // dekker hele skjermen. BottomTabBar skal IKKE være synlig / klikkbar
  // mens den er åpen. Vi dropper rendring helt for clarity.
  const sheetOpen = activeDrill?.kind === 'paakledning';

  if (activeDrill?.kind === 'guide' && activeDrill.target === 'finn-antrekk') {
    routeKey = 'drill:guide:finn-antrekk';
    routeContent = <FinnAntrekkScreen onBack={() => setDrill(null)} />;
  } else if (activeDrill?.kind === 'guide' && activeDrill.target === 'plaggbib') {
    routeKey = 'drill:guide:plaggbib';
    routeContent = <PlaggbibliotekScreen onBack={() => setDrill(null)} />;
  } else if (activeDrill?.kind === 'guide' && activeDrill.target === 'tog') {
    routeKey = 'drill:guide:tog';
    routeContent = <TogGuideScreen onBack={() => setDrill(null)} />;
  } else if (activeDrill?.kind === 'guide' && activeDrill.target === 'varm-kald') {
    routeKey = 'drill:guide:varm-kald';
    routeContent = <VarmEllerKaldScreen onBack={() => setDrill(null)} />;
  } else if (activeDrill?.kind === 'guide' && activeDrill.target === 'forste-vinter') {
    routeKey = 'drill:guide:forste-vinter';
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
        onOpenSheet={(ctx, origin) =>
          setDrill({
            kind: 'paakledning',
            source: 'current',
            currentContext: ctx,
            origin,
          })
        }
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
  } else if (tab === 'guide') {
    routeKey = 'tab:guide';
    routeContent = (
      <GuideHubScreen
        onNavigate={onNavigate}
        onOpenCard={onOpenGuideTarget}
      />
    );
  } else {
    // R7 Task 3: Familie-roten hoster innstillingsinnholdet til Task 7
    // restrukturerer den (barn/omsorgspersoner/steder/Plus-seksjoner).
    routeKey = 'tab:familie';
    routeContent = <FamilieScreen onNavigate={onNavigate} />;
  }

  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">Hopp til hovedinnhold</a>
      <main id="main" tabIndex={-1} ref={mainRef}>
        <Suspense fallback={<RouteSkeleton />}>
          {reduceMotion ? (
            routeContent
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              {/* F83: native navigasjons-grammatikk — sidestilte TABS crossfader
                  (140ms), hierarkiske DRILLS pusher (x±24 spring). RM-grenen
                  over er uendret (a11y-preclearance vilkår 7). */}
              <motion.div
                key={routeKey}
                initial={routeKey.startsWith('tab:') ? { opacity: 0 } : { opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={
                  routeKey.startsWith('tab:')
                    ? { opacity: 0, transition: { duration: 0.1, ease: 'easeOut' } }
                    : { opacity: 0, x: -24 }
                }
                transition={
                  routeKey.startsWith('tab:')
                    ? { duration: 0.14, ease: 'easeOut' }
                    : { type: 'spring', stiffness: 300, damping: 30 }
                }
              >
                {routeContent}
              </motion.div>
            </AnimatePresence>
          )}
        </Suspense>
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
            />
          ) : (
            <PaakledningScreen
              onBack={closePaakledning}
              currentContext={activeDrill.currentContext}
            />
          )}
        </Suspense>
      )}
    </div>
  );
}
