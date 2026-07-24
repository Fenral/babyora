import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { PaywallDialog } from '../components/PaywallDialog';
import { ForecastDisclosure } from '../components/planning/ForecastDisclosure';
import { PlanChangeRail, type PlanChangeRailRow, type PlanningRailEvent } from '../components/planning/PlanChangeRail';
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
import { buildSnartDateWindow, isAgeEligibleForWholeWindow } from '../lib/planning/snart-date-window';
import { buildSnartPlan } from '../lib/planning/snart';
import { createSnartSessionEvaluator } from '../lib/planning/snart-session';
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

function pickHourly(
  hourly: readonly WeatherHourly[],
  targetHour: number,
  localDate: string,
): WeatherHourly | null {
  const sameDate = hourly.filter((point) => point.time.toLocaleDateString('en-CA', {
    timeZone: PLAN_TIME_ZONE,
  }) === localDate);
  if (sameDate.length === 0) return null;
  return [...sameDate].sort((left, right) => {
    const leftHour = Number(left.time.toLocaleTimeString('en-GB', {
      timeZone: PLAN_TIME_ZONE,
      hour: '2-digit',
      hourCycle: 'h23',
    }));
    const rightHour = Number(right.time.toLocaleTimeString('en-GB', {
      timeZone: PLAN_TIME_ZONE,
      hour: '2-digit',
      hourCycle: 'h23',
    }));
    return Math.abs(leftHour - targetHour) - Math.abs(rightHour - targetHour);
  })[0] ?? null;
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
}: Pick<Props, 'onOpenPlannedOutfit'>) {
  const { active } = useChildren();
  const { fire } = useHapticSystem();
  const swaps = useSwapOverride((state) => state.swaps);
  const { isPremium, loading: accessLoading } = useAccess();
  const locationMode = useLocationPref((state) => state.mode);
  const automaticPlace = useLocationPref((state) => state.automaticPlace);
  const fixedHome = active ? {
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
  const locationAccess = resolveRuntimeCapabilityAccess(
    'automatic_location',
    { isPlus: isPremium, authenticated: false, loading: accessLoading },
    PLUS_FEATURE_AVAILABILITY,
  );
  const effectivePlace = resolveEffectivePlace(
    fixedHome,
    locationMode,
    locationAccess,
    automaticPlace,
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
  const [forecastOpen, setForecastOpen] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallTrigger, setPaywallTrigger] = useState<HTMLElement | null>(null);
  const [paywallAccessGeneration, setPaywallAccessGeneration] = useState(0);
  const paywallActionRef = useRef<HTMLButtonElement | null>(null);
  const weekAccess = useMemo(() => resolvePlanningViewAccess('week', {
    isPlus: isPremium,
    authenticated: false,
    loading: accessLoading,
  }, PLUS_FEATURE_AVAILABILITY), [accessLoading, isPremium]);
  const todayAccess = useMemo(() => resolvePlanningViewAccess('today', {
    isPlus: isPremium,
    authenticated: false,
    loading: false,
  }, PLUS_FEATURE_AVAILABILITY), [isPremium]);
  const soonAccess = useMemo(() => resolvePlanningViewAccess('soon', {
    isPlus: isPremium,
    authenticated: false,
    loading: accessLoading,
  }, PLUS_FEATURE_AVAILABILITY), [accessLoading, isPremium]);
  const viewAccess = tab === 'today' ? todayAccess : tab === 'tenday' ? weekAccess : soonAccess;
  const snartGeneration = useRef(0);
  const lastSnartProfile = useRef<string | null>(null);
  const snartEvaluator = useRef(createSnartSessionEvaluator({
    resolveExactHome: (home) => {
      const key = `no-city:v1:${encodeURIComponent(home.city.trim().toLocaleLowerCase('nb-NO'))}:${Math.round(home.lat * 10_000)}:${Math.round(home.lon * 10_000)}`;
      return { homePlaceKey: key, climateProfileId: `snart-profile:v2:${key}` };
    },
    buildModel: buildSnartPlan,
  }));
  const snartProfileScope = active?.id ?? '__none__';
  if (lastSnartProfile.current !== snartProfileScope) {
    lastSnartProfile.current = snartProfileScope;
    snartGeneration.current += 1;
    snartEvaluator.current.teardown();
  }
  const snartWindow = new Date().toLocaleDateString('en-CA', { timeZone: PLAN_TIME_ZONE });
  const soonWindow = buildSnartDateWindow(snartWindow, PLAN_TIME_ZONE);
  const soonAgeEligible = activeDob !== undefined && soonWindow.status === 'available'
    ? isAgeEligibleForWholeWindow(activeDob, soonWindow.endLocalDate)
    : false;
  // The session evaluator is deliberately evaluated before any model payload is
  // constructed; with the live false implementation flag this returns at once.
  snartEvaluator.current.evaluate({
    allowed: soonAccess.access.allowed,
    generation: String(snartGeneration.current),
    profileVersion: 'snart-home-key@1',
    window: snartWindow,
    home: { city: fixedHome.city, lat: fixedHome.lat, lon: fixedHome.lon },
    ageEligibleForWholeWindow: soonAgeEligible,
  });
  const [weekAccessTransition, setWeekAccessTransition] = useState(() => ({
    state: weekAccess.access.state,
    generation: 0,
    lastResolved: weekAccess.access.state === 'allowed'
      ? 'allowed' as const
      : 'denied' as const,
    paywallFocusPending: false,
  }));
  let currentWeekAccessTransition = weekAccessTransition;
  if (weekAccessTransition.state !== weekAccess.access.state) {
    const nextAccessState = weekAccess.access.state;
    const lostLiveWeekAccess = weekAccessTransition.lastResolved === 'allowed'
      && nextAccessState === 'denied';
    currentWeekAccessTransition = {
      state: nextAccessState,
      generation: nextAccessState === 'neutral'
        ? weekAccessTransition.generation + 1
        : weekAccessTransition.generation,
      lastResolved: nextAccessState === 'neutral'
        ? weekAccessTransition.lastResolved
        : nextAccessState,
      paywallFocusPending: nextAccessState === 'neutral'
        ? paywallOpen
          && paywallAccessGeneration === weekAccessTransition.generation
        : weekAccessTransition.state === 'neutral'
          && weekAccessTransition.paywallFocusPending,
    };
    setWeekAccessTransition(currentWeekAccessTransition);
    if (nextAccessState === 'neutral') setForecastOpen(false);
    if (lostLiveWeekAccess) {
      setForecastOpen(false);
      setTab('today');
    }
  }
  useLayoutEffect(() => {
    if (
      weekAccess.access.state === 'neutral'
      || !currentWeekAccessTransition.paywallFocusPending
    ) {
      return;
    }
    const focusTarget = paywallActionRef.current
      ?? document.getElementById('main');
    if (focusTarget) {
      focusTarget.focus();
    }
  }, [
    currentWeekAccessTransition.generation,
    currentWeekAccessTransition.paywallFocusPending,
    weekAccess.access.state,
  ]);
  const closePaywall = useCallback(() => {
    setPaywallOpen(false);
    window.requestAnimationFrame(() => {
      const focusTarget = paywallActionRef.current
        ?? document.getElementById('main');
      focusTarget?.focus();
    });
  }, []);
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
    if (tab === 'tenday' && viewAccess.presentation !== 'full') {
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
    const localDate = new Date(evaluatedAt).toLocaleDateString('en-CA', {
      timeZone: PLAN_TIME_ZONE,
    });
    return Object.freeze([6, 10, 14, 18].flatMap((hour) => {
      const point = pickHourly(activeHourly, hour, localDate);
      return point ? [phaseFromHourly(point, ageMonths, activity, vognMode)] : [];
    }));
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
      (tab === 'tenday' && viewAccess.presentation !== 'full')
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
        recommendation: {
          id: `planned-recommendation:${fact.fingerprint}`,
          fingerprint: fact.fingerprint,
          orderedGarments: fact.orderedGarments,
          equipment: fact.equipment,
          finalized: true,
        },
        access: {
          capability: planCapability,
          allowed: access.allowed,
          reason: access.reason,
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
  }, []);
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
  }, []);
  const isWeekView = tab === 'tenday';
  const isWeekFull = isWeekView && viewAccess.presentation === 'full';
  const isWeekTeaser = isWeekView && viewAccess.presentation === 'teaser';
  const isWeekNeutral = isWeekView && viewAccess.presentation === 'neutral';
  if (weather.status === 'loading' || weather.status === 'idle') {
    statusState = { status: 'loading' };
  } else if (
    (weather.status === 'error' && !isWeekTeaser && !isWeekNeutral)
    || (
      (weather.status === 'ready' || weather.status === 'offline')
      && !planningEvaluation.hasEvaluatedPlan
      && (!isWeekView || isWeekFull)
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

  const freeWeekComparison = useMemo(() => {
    if (
      viewAccess.presentation !== 'teaser'
      || (weather.status !== 'ready' && weather.status !== 'offline')
      || !weather.evidence
      || weather.evidence.coverage.status === 'unavailable'
    ) {
      return null;
    }
    const localDate = (date: Date) => date.toLocaleDateString('en-CA', {
      timeZone: PLAN_TIME_ZONE,
    });
    const evaluatedDate = localDate(new Date(weather.evidence.metadata.evaluatedAt));
    const [year, month, day] = evaluatedDate.split('-').map(Number);
    if (!year || !month || !day) return null;
    const nextCalendarDate = new Date(Date.UTC(year, month - 1, day + 1))
      .toISOString()
      .slice(0, 10);
    const today = activeDaily.find((day) => localDate(day.date) === evaluatedDate);
    const future = activeDaily.find(
      (day) => localDate(day.date) === nextCalendarDate,
    );
    if (!today || !future) return null;
    return Object.freeze({
      todayC: Math.round(today.tempC),
      futureC: Math.round(future.tempC),
    });
  }, [
    activeDaily,
    viewAccess.presentation,
    weather.evidence,
    weather.status,
  ]);

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
    && (!isWeekView || isWeekFull)
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

  return (
    <>
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
          ]}
          value={tab}
          onChange={onViewChange}
        />
      </div>

      <PlanleggStatusNotice
        state={statusState}
        subject={isWeekView && !isWeekFull ? 'weather' : 'plan'}
      />

      {showAdvice && (
        <>
          <div className="planlegg-screen__answer">
            {planningEvaluation.status === 'empty' ? (
              <>
                <p className="planlegg-screen__verdict">Ingen antrekksendringer</p>
                <p className="planlegg-screen__empty">
                  Babyora fant ingen endringer i perioden som er vurdert.
                </p>
              </>
            ) : (
              <>
                <p className="planlegg-screen__verdict">
                  {planningEvaluation.verdict
                    ? `Planlagt antrekk: ${planningEvaluation.verdict.summary}.`
                    : 'Antrekket holder i de vurderte tidspunktene.'}
                </p>
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
        </>
      )}

      {isWeekNeutral && (
        <p
          className="planlegg-screen__week-weather"
          data-planlegg-access="neutral"
        >
          Sjekker tilgang til ukeplanen.
        </p>
      )}

      {isWeekTeaser
        && statusState.status !== 'loading'
        && (
          <section
            className="planlegg-screen__week-weather"
            aria-labelledby="planlegg-free-week-title"
            data-planlegg-access={freeWeekComparison
              ? 'free-week-comparison'
              : 'free-week-unavailable'}
          >
            <h2 id="planlegg-free-week-title">Ukevær</h2>
            {freeWeekComparison ? (
              <p data-weather-comparison>
                I morgen ved middagstid: {freeWeekComparison.futureC}°.
                {' '}I dag ved middagstid: {freeWeekComparison.todayC}°.
              </p>
            ) : (
              <p>Værsammenligning er ikke tilgjengelig akkurat nå.</p>
            )}
            <button
              ref={paywallActionRef}
              type="button"
              onClick={(event) => {
                setPaywallTrigger(event.currentTarget);
                setPaywallAccessGeneration(currentWeekAccessTransition.generation);
                setPaywallOpen(true);
              }}
            >
              Se uke med Babyora Plus
            </button>
          </section>
        )}

      {(!isWeekView || isWeekFull)
        && statusState.status !== 'loading'
        && statusState.status !== 'error'
        && (
        <ForecastDisclosure
          open={forecastOpen}
          onToggle={() => setForecastOpen((current) => !current)}
          rows={forecastRows}
        />
      )}
    </section>
    {paywallOpen && weekAccess.access.state !== 'neutral'
      && paywallAccessGeneration === currentWeekAccessTransition.generation && (
      <PaywallDialog
        open
        trigger="imorgen"
        onClose={closePaywall}
        returnFocusTo={paywallTrigger}
      />
    )}
    </>
  );
}

export function UkeScreen({
  onOpenPlannedOutfit,
  onNavigate: _onNavigate,
  onOpenSheet: _onOpenSheet,
}: Props) {
  return (
    <PlanleggData
      onOpenPlannedOutfit={onOpenPlannedOutfit}
    />
  );
}

export default UkeScreen;
