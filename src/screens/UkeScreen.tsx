import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from 'react';
import { ForecastDisclosure } from '../components/planning/ForecastDisclosure';
import { PlanChangeRail, type PlanChangeRailRow, type PlanningRailEvent } from '../components/planning/PlanChangeRail';
import { SnartPlan } from '../components/planning/SnartPlan';
import {
  PlanleggStatusNotice,
  type PlanleggStatusState,
} from '../components/planning/PlanleggStatusNotice';
import { SegmentedControl } from '../components/controls/SegmentedControl';
import { useWeather } from '../hooks/useWeather';
import { useHapticSystem } from '../lib/haptics/system';
import { extractDailyAtHour, extractHourly } from '../lib/met-no/client';
import type { WeatherDayAtHour, WeatherHourly } from '../lib/met-no/types';
import {
  type PlanningChangeEvent,
  type PlanningPoint,
} from '../lib/planning/change-events';
import {
  type RequestedPlanningView,
  decidePlanningInteraction,
  dispatchPlanningInteraction,
  repairPlanningSelection,
} from '../lib/planning/planning-interaction';
import {
  createPlannedOutfitContext,
  PLAN_TIME_ZONE,
  type PlannedOutfitContext,
} from '../lib/planning/planned-outfit-context';
import { resolvePlannedOutfitContext } from '../lib/planning/planned-outfit-resolver';
import {
  buildPlanViewModel,
  type PlanningVerdictView,
  type PlanningWeatherRow,
} from '../lib/planning/plan-view-model';
import { selectTodayPlanningHours } from '../lib/planning/today-hours';
import { resolveSnartClimateProfile } from '../lib/planning/snart-climate';
import { buildSnartDateWindow, isAgeEligibleForWholeWindow } from '../lib/planning/snart-date-window';
import { buildSnartPlan, buildSnartUnavailable, type SnartPlan as SnartPlanResult } from '../lib/planning/snart';
import {
  createSnartSessionEvaluator,
  resolveCommittedSnartHome,
} from '../lib/planning/snart-session';
import {
  resolvePlanningViewAccess,
  resolveRuntimeCapabilityAccess,
} from '../lib/premium/gating';
import { PLUS_FEATURE_AVAILABILITY } from '../lib/premium/plus-features';
import { useAccess } from '../lib/premium/use-access';
import { dobToAgeMonths } from '../lib/utils/dob-to-age-months';
import { applySwapsFinalized } from '../lib/wool-layers/finalize-safety';
import { recommend } from '../lib/wool-layers/recommend';
import type { Recommendation, RecommendInput } from '../lib/wool-layers/types';
import {
  getConditionLabel,
  getGarmentImage,
  getWeatherIcon,
  getWeatherNuance,
} from '../lib/monter-assets';
import { garmentIdFor } from '../data/garment-illustrations.js';
import { useChildren } from '../state/children-store';
import { useSwapOverride } from '../state/swap-override-store';
import { resolveEffectivePlace, useLocationPref } from '../state/location-pref-store';
import type { TabKey } from '../types/nav';
import './UkeScreen.css';

const DEFAULT_LAT = 60.8867;
const DEFAULT_LON = 11.5614;
const FALLBACK_REF_HOUR = 12;

type ViewTab = 'today' | 'tenday' | 'soon';
type Activity = 'utelek' | 'vogn';
type VognMode = 'awake' | 'sleeping';
type TempAxis = 'kald' | 'mild' | 'varm';

type PlanleggE2EWindow = Window & {
  __BABYORA_PLANLEGG_E2E__?: Readonly<{
    testOnlySoonAvailability?: boolean;
    entitlement?: 'loading' | 'free' | 'plus';
    fixedHome?: Readonly<{ city: string; lat: number; lon: number }>;
    automatic?: Readonly<{ mode: 'auto'; place: Readonly<{ city: string; lat: number; lon: number }> }>;
    climateProfile?: 'invalid-hash';
    profileScope?: string;
    windowLocalDate?: string;
  }>;
};

const PLANLEGG_E2E_SOON_AVAILABILITY = Object.freeze({
  ...PLUS_FEATURE_AVAILABILITY,
  soon_preparation: true,
});

function planningAvailability() {
  if (
    import.meta.env.VITE_PLANLEGG_E2E === 'true'
    && (window as PlanleggE2EWindow).__BABYORA_PLANLEGG_E2E__?.testOnlySoonAvailability === true
  ) {
    return PLANLEGG_E2E_SOON_AVAILABILITY;
  }
  return PLUS_FEATURE_AVAILABILITY;
}

function planningE2EFixture(): PlanleggE2EWindow['__BABYORA_PLANLEGG_E2E__'] {
  return import.meta.env.VITE_PLANLEGG_E2E === 'true'
    ? (window as PlanleggE2EWindow).__BABYORA_PLANLEGG_E2E__
    : undefined;
}

type Phase = Readonly<{
  recommendation: Recommendation;
  engineInput: RecommendInput;
  weather: Readonly<{
    atIso: string;
    tempC: number;
    feelsLikeC: number;
    windMs: number;
    precipMmH: number;
    symbolCode: string;
  }>;
}>;

type Props = Readonly<{
  onNavigate: (tab: TabKey) => void;
  onOpenSheet: () => void;
  onOpenPlannedOutfit: (
    context: PlannedOutfitContext,
    trigger: HTMLElement,
  ) => void;
  requestedPlanView: RequestedPlanningView | null;
  requestedPlanViewToken: number | null;
  onConsumeRequestedPlanView: (token: number) => void;
}>;

type PlanningEvaluation = Readonly<{
  status: 'offline' | 'partial' | 'empty' | 'ready' | null;
  verdict: PlanningVerdictView | null;
  nextAction: string | null;
  events: readonly PlanningChangeEvent[];
  rows: readonly PlanChangeRailRow[];
  candidateEventIds: readonly string[];
  forecast: readonly PlanningWeatherRow[];
  contextsByEventId: ReadonlyMap<string, PlannedOutfitContext>;
  preferredEventId: string | null;
  hasEvaluatedPlan: boolean;
}>;

const EMPTY_PLANNING_EVALUATION: PlanningEvaluation = Object.freeze({
  status: null,
  verdict: null,
  nextAction: null,
  events: Object.freeze([]),
  rows: Object.freeze([]),
  candidateEventIds: Object.freeze([]),
  forecast: Object.freeze([]),
  contextsByEventId: Object.freeze(new Map<string, PlannedOutfitContext>()),
  preferredEventId: null,
  hasEvaluatedPlan: false,
});

function tempAxisFor(
  feelsLikeC: number | undefined | null,
  tempC: number | undefined | null,
): TempAxis {
  const temperature = feelsLikeC ?? tempC;
  if (temperature === undefined || temperature === null || Number.isNaN(temperature)) {
    return 'mild';
  }
  if (temperature < 5) return 'kald';
  if (temperature > 18) return 'varm';
  return 'mild';
}

function conditionLabel(symbolCode: string): string {
  const normalized = symbolCode.toLocaleLowerCase('nb-NO');
  if (normalized.includes('thunder')) return 'Torden';
  if (normalized.includes('snow')) return 'Snø';
  if (normalized.includes('sleet')) return 'Sludd';
  if (normalized.includes('rain')) return 'Regn';
  if (normalized.includes('fog')) return 'Tåke';
  if (normalized.includes('cloud')) return 'Skyet';
  if (normalized.includes('partly')) return 'Delvis skyet';
  if (normalized.includes('fair')) return 'Lettskyet';
  if (normalized.includes('clear')) return 'Klarvær';
  return 'Vær';
}

// P8 (Monter re-skin): presentation-only date/time formatters for the day-
// hero petrol panel and the improved empty-state line. Pure functions, no
// planning-domain logic — same nb-NO/Europe/Oslo pattern already used by
// PlanChangeRail's timeLabel() and ForecastDisclosure's timeLabel().
const heroDayFormatter = new Intl.DateTimeFormat('nb-NO', {
  timeZone: PLAN_TIME_ZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

const heroShortTimeFormatter = new Intl.DateTimeFormat('nb-NO', {
  timeZone: PLAN_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function capitalize(value: string): string {
  return value.length > 0 ? value.charAt(0).toLocaleUpperCase('nb-NO') + value.slice(1) : value;
}

function heroDayLabel(atIso: string | null, isToday: boolean): string {
  if (isToday) return 'I dag';
  if (!atIso) return '';
  const instant = new Date(atIso);
  if (Number.isNaN(instant.getTime())) return '';
  return capitalize(heroDayFormatter.format(instant));
}

function shortTimeLabel(atIso: string | undefined): string | null {
  if (!atIso) return null;
  const instant = new Date(atIso);
  if (Number.isNaN(instant.getTime())) return null;
  return heroShortTimeFormatter.format(instant).replace('.', ':');
}

function formatHeroTemp(tempC: number | null | undefined): string {
  if (tempC === null || tempC === undefined || Number.isNaN(tempC)) return '–';
  const rounded = Math.round(tempC);
  return rounded < 0 ? `−${Math.abs(rounded)}` : `${rounded}`;
}

function finalizedFingerprint(
  orderedGarments: readonly string[],
  equipment: readonly string[],
): string {
  return `planned-finalized:${JSON.stringify([orderedGarments, equipment])}`;
}

function phaseFromHourly(
  point: WeatherHourly,
  ageMonths: number,
  activity: Activity,
  vognMode: VognMode,
): Phase {
  const engineInput: RecommendInput = {
    weather: {
      tempC: point.tempC,
      feelsLikeC: point.feelsLikeC,
      windMs: point.windMs,
      precipMmH: point.precipMmH,
      symbolCode: point.symbolCode,
    },
    child: { ageMonths },
    activity,
    ...(activity === 'vogn' ? { vognMode } : {}),
  };
  return Object.freeze({
    recommendation: recommend(engineInput),
    engineInput,
    weather: Object.freeze({
      atIso: point.time.toISOString(),
      tempC: point.tempC,
      feelsLikeC: point.feelsLikeC,
      windMs: point.windMs,
      precipMmH: point.precipMmH,
      symbolCode: point.symbolCode,
    }),
  });
}

function phaseFromDay(
  day: WeatherDayAtHour,
  ageMonths: number,
  activity: Activity,
  vognMode: VognMode,
): Phase {
  const engineInput: RecommendInput = {
    weather: {
      tempC: day.tempC,
      feelsLikeC: day.feelsLikeC,
      windMs: day.windMs,
      precipMmH: day.precipMmH,
      symbolCode: day.symbolCode,
    },
    child: { ageMonths },
    activity,
    ...(activity === 'vogn' ? { vognMode } : {}),
  };
  return Object.freeze({
    recommendation: recommend(engineInput),
    engineInput,
    weather: Object.freeze({
      atIso: new Date(
        day.date.getFullYear(),
        day.date.getMonth(),
        day.date.getDate(),
        day.refHour,
      ).toISOString(),
      tempC: day.tempC,
      feelsLikeC: day.feelsLikeC,
      windMs: day.windMs,
      precipMmH: day.precipMmH,
      symbolCode: day.symbolCode,
    }),
  });
}

function currentPhase(
  phases: readonly Phase[],
  evaluatedAt: number,
): Phase | null {
  return [...phases]
    .filter((phase) => Date.parse(phase.weather.atIso) <= evaluatedAt)
    .at(-1) ?? phases[0] ?? null;
}

function PlanleggData({
  onOpenPlannedOutfit,
  requestedPlanView,
  requestedPlanViewToken,
  onConsumeRequestedPlanView,
}: Pick<
  Props,
  | 'onOpenPlannedOutfit'
  | 'requestedPlanView'
  | 'requestedPlanViewToken'
  | 'onConsumeRequestedPlanView'
>) {
  const { active } = useChildren();
  const e2eFixture = planningE2EFixture();
  const { fire } = useHapticSystem();
  const swaps = useSwapOverride((state) => state.swaps);
  const { isPremium, loading: accessLoading } = useAccess();
  const locationMode = useLocationPref((state) => state.mode);
  const automaticPlace = useLocationPref((state) => state.automaticPlace);
  const storedFixedHome = active ? {
    childId: active.id,
    city: active.city,
    lat: active.lat,
    lon: active.lon,
  } : {
    childId: '__fallback__',
    city: 'Elverum',
    lat: DEFAULT_LAT,
    lon: DEFAULT_LON,
  };
  const fixedHome = e2eFixture?.fixedHome
    ? { childId: '__e2e__', ...e2eFixture.fixedHome }
    : storedFixedHome;
  const effectiveLocationMode = e2eFixture?.automatic?.mode ?? locationMode;
  const effectiveAutomaticPlace = e2eFixture?.automatic
    ? {
        childId: fixedHome.childId,
        generation: 1,
        ...e2eFixture.automatic.place,
      }
    : automaticPlace;
  const locationAccess = resolveRuntimeCapabilityAccess(
    'automatic_location',
    { isPlus: isPremium, authenticated: false, loading: accessLoading },
    PLUS_FEATURE_AVAILABILITY,
  );
  const effectivePlace = resolveEffectivePlace(
    fixedHome,
    effectiveLocationMode,
    locationAccess,
    effectiveAutomaticPlace,
  );
  const lat = effectivePlace?.lat ?? 0;
  const lon = effectivePlace?.lon ?? 0;
  const city = effectivePlace === null
    ? 'Sted mangler'
    : effectivePlace.source === 'automatic'
      ? `Nåværende sted · ${effectivePlace.city}`
      : `Fast sted · ${effectivePlace.city}`;
  const childName = active?.name || 'barnet';
  const activeDob = active?.dob;
  const ageMonths = useMemo(
    () => (activeDob ? dobToAgeMonths(activeDob) : 12),
    [activeDob],
  );
  const [activity] = useState<Activity>('utelek');
  const vognMode: VognMode = 'awake';
  const [refreshKey, setRefreshKey] = useState(0);
  const weather = useWeather(lat, lon, FALLBACK_REF_HOUR, refreshKey, {
    cacheScope: effectivePlace?.cacheScope ?? 'persistent',
    source: effectivePlace?.source ?? 'fixed-home',
  }, effectivePlace !== null);
  const [tab, setTab] = useState<ViewTab>('today');
  const consumedRequestedPlanViewToken = useRef<number | null>(null);

  useEffect(() => {
    if (
      requestedPlanView !== 'snart'
      || requestedPlanViewToken === null
      || consumedRequestedPlanViewToken.current === requestedPlanViewToken
    ) {
      return;
    }
    consumedRequestedPlanViewToken.current = requestedPlanViewToken;
    setTab('soon');
    onConsumeRequestedPlanView(requestedPlanViewToken);
  }, [onConsumeRequestedPlanView, requestedPlanView, requestedPlanViewToken]);
  const [forecastOpen, setForecastOpen] = useState(false);
  const availability = planningAvailability();
  const weekAccess = useMemo(() => resolvePlanningViewAccess('week', {
    isPlus: isPremium,
    authenticated: false,
    loading: accessLoading,
  }, availability), [accessLoading, availability, isPremium]);
  const todayAccess = useMemo(() => resolvePlanningViewAccess('today', {
    isPlus: isPremium,
    authenticated: false,
    loading: false,
  }, availability), [availability, isPremium]);
  const soonAccess = useMemo(() => resolvePlanningViewAccess('soon', {
    isPlus: e2eFixture?.entitlement === 'plus' ? true : e2eFixture?.entitlement === 'free' ? false : isPremium,
    authenticated: false,
    loading: e2eFixture?.entitlement === 'loading' ? true : accessLoading,
  }, availability), [accessLoading, availability, e2eFixture?.entitlement, isPremium]);
  const viewAccess = tab === 'today' ? todayAccess : tab === 'tenday' ? weekAccess : soonAccess;
  const [snartEvaluator] = useState(() => createSnartSessionEvaluator({
    resolveExactHome: resolveCommittedSnartHome,
    lookupClimateProfile: (homePlaceKey) => {
      if (e2eFixture?.climateProfile === 'invalid-hash') return null;
      const climateProfileId = `snart-profile:v2:${homePlaceKey}`;
      const climate = resolveSnartClimateProfile({
        homePlaceKey,
        climateProfileId,
      });
      return climate.status === 'available'
        ? {
            climateProfileId: climate.profile.profileId,
            profileVersion: climate.packSha256,
          }
        : null;
    },
    buildModel: buildSnartPlan,
    buildUnavailable: buildSnartUnavailable,
  }));
  const snartResult = useSyncExternalStore<SnartPlanResult | null>(
    snartEvaluator.subscribe,
    snartEvaluator.current,
    () => null,
  );
  const snartProfileScope = active?.id ?? '__none__';
  const effectiveSnartProfileScope = e2eFixture?.profileScope ?? snartProfileScope;
  const snartWindow = e2eFixture?.windowLocalDate
    ?? new Date().toLocaleDateString('en-CA', { timeZone: PLAN_TIME_ZONE });
  useEffect(() => {
    const generation = crypto.randomUUID();
    if (!soonAccess.access.allowed) {
      snartEvaluator.evaluate({
        access: soonAccess.access,
        generation,
        window: snartWindow,
        fixedHome: { city: '', lat: 0, lon: 0 },
        ageEligibleForWholeWindow: false,
      });
      return () => snartEvaluator.teardown();
    }
    const targetWindow = buildSnartDateWindow(snartWindow, PLAN_TIME_ZONE);
    const ageEligibleForWholeWindow = activeDob !== undefined
      && targetWindow.status === 'available'
      && isAgeEligibleForWholeWindow(activeDob, targetWindow.endLocalDate);
    snartEvaluator.evaluate({
      access: soonAccess.access,
      generation,
      window: snartWindow,
      fixedHome: {
        city: fixedHome.city,
        lat: fixedHome.lat,
        lon: fixedHome.lon,
      },
      ageEligibleForWholeWindow,
    });
    return () => snartEvaluator.teardown();
  }, [
    activeDob,
    fixedHome.city,
    fixedHome.lat,
    fixedHome.lon,
    snartEvaluator,
    effectiveSnartProfileScope,
    snartWindow,
    soonAccess.access,
  ]);
  const markSnartAlreadyHave = useCallback((conceptId: string) => {
    snartEvaluator.markAlreadyHave(conceptId);
  }, [snartEvaluator]);
  // P2 hard paywall (PRODUCT.md, 2026-07-31): det finnes ikke lenger noen
  // kontekstuell paywall å åpne herfra — AppPaywallGate (App.tsx) er den
  // ENESTE håndhevingen av entitlement på appnivå. Denne skjermen bounser
  // bare vekk fra en Uke-visning som akkurat mistet levende tilgang (f.eks.
  // et entitlement som utløper mens brukeren står på fanen), slik at hun
  // ikke blir stående på en tom fane.
  const lastResolvedWeekAccessRef = useRef<'allowed' | 'denied'>(
    weekAccess.access.state === 'allowed' ? 'allowed' : 'denied',
  );
  useEffect(() => {
    if (weekAccess.access.state === 'neutral') return;
    const previous = lastResolvedWeekAccessRef.current;
    lastResolvedWeekAccessRef.current = weekAccess.access.state;
    if (previous === 'allowed' && weekAccess.access.state === 'denied') {
      setForecastOpen(false);
      setTab('today');
    }
  }, [weekAccess.access.state]);
  const changeRailHeadStyle: CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: 640,
    lineHeight: 1.25,
  };

  const activeForecast = weather.status === 'offline'
    ? weather.offlineForecast
    : weather.forecast;
  const activeHourly = useMemo(
    () => activeForecast ? extractHourly(activeForecast, 48) : weather.hourly,
    [activeForecast, weather.hourly],
  );
  const activeDaily = useMemo(
    () => activeForecast
      ? extractDailyAtHour(activeForecast, FALLBACK_REF_HOUR, 10)
      : weather.dailyAtHour,
    [activeForecast, weather.dailyAtHour],
  );

  const phases = useMemo<readonly Phase[]>(() => {
    if (weather.status !== 'ready' && weather.status !== 'offline') return Object.freeze([]);
    // P2 hard paywall: I dag og Uke gates likt nå (ingen gratis baseline) —
    // begge trenger presentation === 'full' før vi beregner faser. Snart
    // håndteres separat lenger ned (egen tab, aldri via phases).
    if (tab !== 'soon' && viewAccess.presentation !== 'full') {
      return Object.freeze([]);
    }
    if (!Number.isInteger(ageMonths) || ageMonths < 0 || ageMonths > 24) {
      return Object.freeze([]);
    }
    if (tab === 'tenday') {
      return Object.freeze(activeDaily.map(
        (day) => phaseFromDay(day, ageMonths, activity, vognMode),
      ));
    }
    const evaluatedAt = weather.evidence?.metadata.evaluatedAt ?? 0;
    return Object.freeze(
      selectTodayPlanningHours(activeHourly, evaluatedAt, PLAN_TIME_ZONE)
        .map((point) => phaseFromHourly(point, ageMonths, activity, vognMode)),
    );
  }, [
    activeDaily,
    activeHourly,
    activity,
    ageMonths,
    tab,
    viewAccess.presentation,
    vognMode,
    weather.evidence?.metadata.evaluatedAt,
    weather.status,
  ]);

  const resolvedPhases = useMemo<readonly Phase[]>(() => {
    if (Object.keys(swaps).length === 0) return phases;
    return Object.freeze(phases.map((phase) => Object.freeze({
      ...phase,
      recommendation: applySwapsFinalized(
        phase.engineInput,
        phase.recommendation,
        swaps,
      ),
    })));
  }, [phases, swaps]);

  const planningEvaluation = useMemo<PlanningEvaluation>(() => {
    if (
      tab === 'soon'
      || viewAccess.presentation !== 'full'
      || !weather.evidence
      || effectivePlace === null
      || weather.evidence.coverage.status === 'unavailable'
      || !Number.isInteger(ageMonths)
      || ageMonths < 0 || ageMonths > 24
    ) {
      return EMPTY_PLANNING_EVALUATION;
    }

    const facts = resolvedPhases.flatMap((phase) => {
      const orderedGarments = phase.recommendation.layers
        .filter((layer) => layer.category !== 'utstyr')
        .flatMap((layer) => layer.items);
      const equipment = phase.recommendation.layers
        .filter((layer) => layer.category === 'utstyr')
        .flatMap((layer) => layer.items);
      if (orderedGarments.length === 0) return [];
      const fingerprint = finalizedFingerprint(orderedGarments, equipment);
      const point: PlanningPoint = Object.freeze({
        atIso: phase.weather.atIso,
        finalizedFingerprint: fingerprint,
        orderedGarments: Object.freeze([...orderedGarments]),
        equipment: Object.freeze([...equipment]),
        cause: `${conditionLabel(phase.weather.symbolCode)} · føles som ${Math.round(phase.weather.feelsLikeC)}°`,
        transitionContextId: `planning-transition:${phase.weather.atIso}:${fingerprint}`,
      });
      return [{ phase, point, fingerprint, orderedGarments, equipment }];
    });
    if (facts.length < 2) return EMPTY_PLANNING_EVALUATION;

    const points = Object.freeze(facts.map((fact) => fact.point));
    const evaluatedAtEpoch = weather.evidence.metadata.evaluatedAt;
    const evaluatedFact = [...facts]
      .filter((fact) => Date.parse(fact.point.atIso) <= evaluatedAtEpoch)
      .at(-1) ?? facts[0]!;
    const viewModel = buildPlanViewModel({
      status: weather.status === 'offline' ? 'offline' : 'ready',
      coverage: weather.evidence.coverage,
      points,
      forecast: facts.map((fact) => ({
        atIso: fact.phase.weather.atIso,
        tempC: fact.phase.weather.tempC,
        feelsLikeC: fact.phase.weather.feelsLikeC,
        symbolCode: fact.phase.weather.symbolCode,
      })),
      evaluatedAtIso: evaluatedFact.point.atIso,
      ...(weather.status === 'offline'
        ? { cachedAtIso: new Date(weather.evidence.metadata.fetchedAt).toISOString() }
        : {}),
    });
    if (viewModel.status === 'loading' || viewModel.status === 'error') {
      return EMPTY_PLANNING_EVALUATION;
    }
    const events = viewModel.events;
    const planCapability = viewAccess.capability;
    const access = viewAccess.access.decision;
    const factByIso = new Map(facts.map((fact) => [fact.point.atIso, fact]));
    const contextEntries: Array<readonly [string, PlannedOutfitContext]> = [];
    const outfitAvailabilityByEventId: Record<string, boolean> = {};

    for (const event of events) {
      const fact = factByIso.get(event.atIso);
      if (!fact) continue;
      const context = createPlannedOutfitContext({
        planningEventId: event.id,
        transitionContextId: event.transitionContextId,
        child: {
          id: active?.id ?? 'default-child',
          name: childName,
          ageMonths,
        },
        plannedForIso: event.atIso,
        timeZone: PLAN_TIME_ZONE,
        place: {
          label: city,
          lat,
          lon,
          source: effectivePlace.source,
        },
        activity,
        vognMode: activity === 'vogn' ? vognMode : null,
        weather: {
          tempC: fact.phase.weather.tempC,
          feelsLikeC: fact.phase.weather.feelsLikeC,
          windMs: fact.phase.weather.windMs,
          precipMmH: fact.phase.weather.precipMmH,
          symbolCode: fact.phase.weather.symbolCode,
        },
        recommendInput: fact.phase.engineInput,
        finalizedRecommendation: fact.phase.recommendation,
        // planned-outfit-context.ts (planning/ — ikke rørt av P2) holder sin
        // EGEN lokale FREE_CAPABILITIES-liste og krever strengt reason:'free'
        // for 'today_home' når allowed er true; alle andre kapabiliteter
        // (her: 'future_plan') krever reason:'plus'. Denne grenen kjøres kun
        // når viewAccess.presentation === 'full' (early-return over), så
        // access.allowed er alltid true her — kun reason-strengen må matche
        // kapabiliteten today_home fortsatt uttrykker som gratis i den
        // uendrede kontekst-fabrikken.
        access: {
          capability: planCapability,
          allowed: access.allowed,
          reason: planCapability === 'today_home' ? 'free' : access.reason,
        },
      });
      contextEntries.push([event.id, context]);
      outfitAvailabilityByEventId[event.id] = access.allowed;
    }

    const eventById = new Map(events.map((event) => [event.id, event]));
    const rows = Object.freeze(viewModel.rows.flatMap((row): PlanChangeRailRow[] => {
      if (row.type === 'unchanged') {
        return [{ id: row.id, type: 'unchanged', copy: row.copy }];
      }
      const event = eventById.get(row.eventId);
      if (!event) return [];
      const presentationEvent: PlanningRailEvent = {
        id: event.id,
        atIso: event.atIso,
        kind: event.kind,
        addedGarments: event.addedGarments,
        removedGarments: event.removedGarments,
        cause: event.cause,
        ...(event.transition ? { transition: event.transition } : {}),
      };
      return [{
        id: row.id,
        type: 'change',
        eventId: row.eventId,
        atIso: row.atIso,
        hasOutfit: outfitAvailabilityByEventId[row.eventId] === true,
        event: presentationEvent,
      }];
    }));

    return Object.freeze({
      status: viewModel.status,
      verdict: viewModel.verdict,
      nextAction: viewModel.nextAction,
      events,
      rows,
      candidateEventIds: viewModel.candidateEventIds,
      forecast: viewModel.forecast,
      contextsByEventId: Object.freeze(new Map(contextEntries)),
      preferredEventId: viewModel.candidateEventIds[0] ?? null,
      hasEvaluatedPlan: true,
    });
  }, [
    active?.id,
    activity,
    ageMonths,
    childName,
    city,
    effectivePlace,
    lat,
    lon,
    resolvedPhases,
    tab,
    viewAccess.access.decision,
    viewAccess.capability,
    viewAccess.presentation,
    vognMode,
    weather.evidence,
    weather.status,
  ]);

  const planningEventIds = useMemo(
    () => planningEvaluation.events.map((event) => event.id),
    [planningEvaluation.events],
  );
  const planningSelectionScope = JSON.stringify(planningEventIds);
  const [planningSelection, setPlanningSelection] = useState(() => ({
    scope: planningSelectionScope,
    selectedEventId: repairPlanningSelection(
      null,
      planningEventIds,
      planningEvaluation.preferredEventId,
    ),
  }));
  let selectedEventId = planningSelection.selectedEventId;
  if (planningSelection.scope !== planningSelectionScope) {
    selectedEventId = repairPlanningSelection(
      planningSelection.selectedEventId,
      planningEventIds,
      planningEvaluation.preferredEventId,
    );
    setPlanningSelection({
      scope: planningSelectionScope,
      selectedEventId,
    });
  }
  const setSelectedEventId = useCallback((eventId: string | null) => {
    setPlanningSelection((current) => ({
      ...current,
      selectedEventId: eventId,
    }));
  }, [setPlanningSelection]);
  const latestPlanningEvaluationRef = useRef(planningEvaluation);
  useLayoutEffect(() => {
    latestPlanningEvaluationRef.current = planningEvaluation;
  }, [planningEvaluation]);
  const openPlannedOutfit = useCallback((
    eventId: string,
    trigger: HTMLElement,
  ) => {
    const latestPlanningEvaluation = latestPlanningEvaluationRef.current;
    const context = resolvePlannedOutfitContext(
      eventId,
      latestPlanningEvaluation.events,
      latestPlanningEvaluation.contextsByEventId,
    );
    if (!context || !context.access.allowed) return;
    onOpenPlannedOutfit(context, trigger);
  }, [onOpenPlannedOutfit]);

  const evaluatedAt = weather.evidence?.metadata.evaluatedAt ?? 0;
  const selectedContext = selectedEventId
    ? planningEvaluation.contextsByEventId.get(selectedEventId) ?? null
    : null;
  const fallbackPhase = currentPhase(resolvedPhases, evaluatedAt);
  const temperatureContext = selectedContext?.weather ?? fallbackPhase?.weather ?? weather.now;
  const tempAxis = tempAxisFor(
    temperatureContext?.feelsLikeC,
    temperatureContext?.tempC,
  );
  let statusState: PlanleggStatusState = { status: 'ready' };
  const onRetry = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, [setRefreshKey]);
  const isWeekView = tab === 'tenday';
  const isTodayView = tab === 'today';
  const isWeekFull = isWeekView && viewAccess.presentation === 'full';
  const isWeekNeutral = isWeekView && viewAccess.presentation === 'neutral';
  const isTodayNeutral = isTodayView && viewAccess.presentation === 'neutral';
  const isSoonView = tab === 'soon';
  // P2 hard paywall: I dag og Uke gates likt nå — «access-gated» betyr her
  // «denne planvisningen er ikke presentation:'full' akkurat nå» (enten
  // fordi entitlement-oppslaget fortsatt laster, eller fordi den er
  // avslått). Ingen egen teaser-tilstand lenger; en gated visning viser
  // ingenting ekstra her — AppPaywallGate (App.tsx) er den faktiske
  // håndhevingen på appnivå.
  const isAccessGatedView = (isWeekView || isTodayView) && viewAccess.presentation !== 'full';
  if (weather.status === 'loading' || weather.status === 'idle') {
    statusState = { status: 'loading' };
  } else if (
    (weather.status === 'error' && !isAccessGatedView)
    || (
      (weather.status === 'ready' || weather.status === 'offline')
      && !planningEvaluation.hasEvaluatedPlan
      && !isAccessGatedView
    )
  ) {
    statusState = { status: 'error', onRetry };
  } else if (weather.status === 'offline') {
    statusState = {
      status: 'offline',
      cachedAtIso: new Date(weather.evidence?.metadata.fetchedAt ?? evaluatedAt).toISOString(),
      onRetry,
    };
  } else if (
    weather.evidence?.coverage.status === 'sampled'
    || weather.evidence?.coverage.status === 'gapped'
  ) {
    statusState = { status: 'partial' };
  }

  const onViewChange = (nextTab: ViewTab) => {
    dispatchPlanningInteraction(
      decidePlanningInteraction({
        type: 'view-date',
        currentKey: tab,
        nextKey: nextTab,
      }),
      {
        onCue: (cue) => {
          void fire(cue);
        },
      },
    );
    setTab(nextTab);
  };

  const showAdvice = statusState.status !== 'loading'
    && statusState.status !== 'error'
    && !isSoonView
    && !isAccessGatedView
    && planningEvaluation.hasEvaluatedPlan;
  const forecastRows = planningEvaluation.hasEvaluatedPlan
    ? planningEvaluation.forecast
    : tab === 'tenday'
      ? activeDaily.map((row) => ({
        atIso: new Date(
          row.date.getFullYear(),
          row.date.getMonth(),
          row.date.getDate(),
          row.refHour,
        ).toISOString(),
        tempC: row.tempC,
        feelsLikeC: row.feelsLikeC,
        symbolCode: row.symbolCode,
      }))
      : activeHourly.map((row) => ({
        atIso: row.time.toISOString(),
        tempC: row.tempC,
        feelsLikeC: row.feelsLikeC,
        symbolCode: row.symbolCode,
      }));

  // P8 (Monter re-skin, review items 7-9): ÉN petrol værmodul (dagens/valgt
  // dags hero + værprognosen nested inni, i stedet for at "Vis full
  // værprognose" fløt fritt nederst på skjermen). Gatingen er IDENTISK med
  // den gamle frittstående ForecastDisclosure-visningen (samme fire vilkår)
  // — kun plasseringen og en valgfri hero-visning oppå den er nytt. Alle
  // verdiene under leser KUN presentation-laget sine allerede eksponerte
  // felter (temperatureContext/selectedContext/fallbackPhase/forecastRows) —
  // ingen nye selectors i src/lib/planning.
  const showWeatherHero = !isSoonView
    && !isAccessGatedView
    && statusState.status !== 'loading'
    && statusState.status !== 'error';
  const heroWeather = temperatureContext ?? null;
  const heroNuance = getWeatherNuance(heroWeather?.symbolCode);
  const heroCondition = getConditionLabel(heroWeather?.symbolCode);
  const heroIcon = getWeatherIcon(heroWeather?.symbolCode);
  const heroAtIso = selectedContext?.plannedForIso
    ?? fallbackPhase?.weather.atIso
    ?? (weather.now ? weather.now.observedAt.toISOString() : null);
  const heroDay = heroDayLabel(heroAtIso, isTodayView);
  // Review item 7 (nyttig tomtilstand): "empty" har likevel et ekte
  // verdict.summary (plan-view-model.ts sin EvaluatedAdvice-gren dekker
  // 'empty' også) — det ble bare aldri lest ut i visningen. Bruker samme
  // allerede-eksponerte forecastRows til en "stabilt til HH:MM"-linje i
  // stedet for en generisk "ingen endringer"-tekst. Ingen ny selector.
  const emptyStableUntil = shortTimeLabel(forecastRows.at(-1)?.atIso);

  return (
    <section
      className="planlegg-screen ba-temp-root"
      aria-labelledby="planlegg-title"
      data-temp={tempAxis}
      data-planlegg-access={isWeekFull ? 'plus-week' : undefined}
    >
      <header className="planlegg-screen__header">
        <h1 id="planlegg-title">Planlegg</h1>
        <p className="planlegg-screen__context">{childName} · {city}</p>
      </header>

      <div
        className="planlegg-screen__views"
        aria-disabled={statusState.status === 'error' ? 'true' : undefined}
        inert={statusState.status === 'error' ? true : undefined}
      >
        <SegmentedControl
          legend="Velg planvisning"
          options={[
            { value: 'today', label: 'I dag' },
            { value: 'tenday', label: 'Uke' },
            ...(soonAccess.presentation === 'hidden'
              ? []
              : [{ value: 'soon' as const, label: 'Snart' }]),
          ]}
          value={tab}
          onChange={onViewChange}
        />
      </div>

      {!isSoonView && (
        <PlanleggStatusNotice
          state={statusState}
          subject={isAccessGatedView ? 'weather' : 'plan'}
        />
      )}

      {/* Petrol værmodul — dagens/valgt dags hero (kun når vi faktisk har et
          vurdert værpunkt) + værprognosen alltid nested inni, aldri fritt-
          flytende (review-item 8). Fargen kommer KUN fra vær-nyansen — én
          instrument-flate, samme regel som Hjem sitt panel. */}
      {showWeatherHero && (
        <section
          className="planlegg-weather"
          data-nuance={heroNuance}
          aria-label={heroWeather ? `Været ${heroDay || 'valgt dag'}`.trim() : 'Værprognose'}
        >
          {heroWeather && (
            <>
              <p className="planlegg-weather__day">{heroDay}</p>
              <div className="planlegg-weather__hero-row">
                <span className="planlegg-weather__temp">
                  {formatHeroTemp(heroWeather.tempC)}
                  <sup>°</sup>
                </span>
                {heroIcon && (
                  <img className="planlegg-weather__icon" src={heroIcon} alt="" draggable={false} />
                )}
              </div>
              <p className="planlegg-weather__condition">{heroCondition}</p>
              <p className="planlegg-weather__meta">
                Føles som {formatHeroTemp(heroWeather.feelsLikeC)}° · Vind {Math.round(heroWeather.windMs)} m/s
              </p>
            </>
          )}
          <ForecastDisclosure
            open={forecastOpen}
            onToggle={() => setForecastOpen((current) => !current)}
            rows={forecastRows}
          />
        </section>
      )}

      {isSoonView
        && soonAccess.presentation === 'full'
        && snartResult && (
          <SnartPlan
            result={snartResult}
            onMarkAlreadyHave={markSnartAlreadyHave}
          />
      )}

      {isSoonView && soonAccess.presentation === 'neutral' && (
        <p className="planlegg-screen__week-weather" data-planlegg-access="neutral">
          Sjekker tilgang til Snart.
        </p>
      )}

      {/* Dybdedoktrinen D1: verdikt + neste handling + tidslinjen deler NÅ
          ÉN hevet espresso-flate (rådgivnings-modulen) i stedet for å stå
          direkte på canvas — det var nettopp "naked hairline rows on
          canvas"-funnet doktrinen forbyr. Review-item 7: tomtilstanden viser
          nå det faktiske verdict.summary (alltid tilgjengelig for 'empty'
          også, se plan-view-model.ts sin EvaluatedAdvice) i stedet for en
          generisk "ingen endringer"-setning, pluss en "stabilt til HH:MM"-
          linje utledet av den allerede eksponerte forecast-listen. */}
      {showAdvice && (
        <section className="planlegg-advice">
          <div className="planlegg-screen__answer">
            {/* Eierfunn (IMG_9105): plagglisten som løpende prosa i verdikt-
                setningen ble «masse tekst uten å skjønne hva det er». Plagg
                presenteres som plagg: kort dom + vitrine-thumbs (samme
                bildesti som Hjem: garmentIdFor → getGarmentImage, bokstav-
                fallback uten bilde). Full liste ligger for skjermlesere. */}
            {planningEvaluation.status === 'empty' ? (
              <>
                <p className="planlegg-screen__verdict">Antrekket holder</p>
                {planningEvaluation.verdict && (
                  <ul
                    className="planlegg-garments"
                    aria-label={`Dagens antrekk: ${planningEvaluation.verdict.summary}`}
                  >
                    {planningEvaluation.verdict.orderedGarments.map((label) => {
                      const image = getGarmentImage(garmentIdFor(label));
                      return (
                        <li key={label} className="planlegg-garments__item" title={label}>
                          {image ? (
                            <img className="planlegg-garments__thumb" src={image} alt="" draggable={false} />
                          ) : (
                            <span className="planlegg-garments__thumb planlegg-garments__thumb--letter" aria-hidden="true">
                              {label.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span className="hjm-sr-only">{label}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <p className="planlegg-screen__empty">
                  {emptyStableUntil
                    ? `Ingen endringer frem til kl. ${emptyStableUntil}.`
                    : 'Babyora fant ingen endringer i perioden som er vurdert.'}
                </p>
              </>
            ) : (
              <>
                <p className="planlegg-screen__verdict">Planlagt antrekk</p>
                {planningEvaluation.verdict && (
                  <ul
                    className="planlegg-garments"
                    aria-label={`Planlagt antrekk: ${planningEvaluation.verdict.summary}`}
                  >
                    {planningEvaluation.verdict.orderedGarments.map((label) => {
                      const image = getGarmentImage(garmentIdFor(label));
                      return (
                        <li key={label} className="planlegg-garments__item" title={label}>
                          {image ? (
                            <img className="planlegg-garments__thumb" src={image} alt="" draggable={false} />
                          ) : (
                            <span className="planlegg-garments__thumb planlegg-garments__thumb--letter" aria-hidden="true">
                              {label.charAt(0).toUpperCase()}
                            </span>
                          )}
                          <span className="hjm-sr-only">{label}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {planningEvaluation.nextAction && (
                  <p className="planlegg-screen__action">
                    {planningEvaluation.nextAction}
                  </p>
                )}
              </>
            )}
          </div>

          <section className="planlegg-screen__rail" aria-labelledby="planlegg-rail-title">
            <h2 id="planlegg-rail-title" style={changeRailHeadStyle}>Dagslinjen</h2>
            <PlanChangeRail
              rows={planningEvaluation.rows}
              selectedEventId={selectedEventId}
              onSelect={setSelectedEventId}
              onOpenOutfit={openPlannedOutfit}
            />
          </section>
        </section>
      )}

      {isWeekNeutral && (
        <p
          className="planlegg-screen__week-weather"
          data-planlegg-access="neutral"
        >
          Sjekker tilgang til ukeplanen.
        </p>
      )}

      {isTodayNeutral && (
        <p
          className="planlegg-screen__week-weather"
          data-planlegg-access="neutral"
        >
          Sjekker tilgang til dagens plan.
        </p>
      )}
    </section>
  );
}

export function UkeScreen({
  onOpenPlannedOutfit,
  onNavigate: _onNavigate,
  onOpenSheet: _onOpenSheet,
  requestedPlanView,
  requestedPlanViewToken,
  onConsumeRequestedPlanView,
}: Props) {
  return (
    <PlanleggData
      onOpenPlannedOutfit={onOpenPlannedOutfit}
      requestedPlanView={requestedPlanView}
      requestedPlanViewToken={requestedPlanViewToken}
      onConsumeRequestedPlanView={onConsumeRequestedPlanView}
    />
  );
}

export default UkeScreen;
