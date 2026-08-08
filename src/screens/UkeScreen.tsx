import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react';
import { useTranslation } from 'react-i18next';
import { ForecastDisclosure } from '../components/planning/ForecastDisclosure';
import { PlanChangeRail, type PlanChangeRailRow, type PlanningRailEvent } from '../components/planning/PlanChangeRail';
import {
  PlanleggStatusNotice,
  type PlanleggStatusState,
} from '../components/planning/PlanleggStatusNotice';
import { SegmentedControl } from '../components/controls/SegmentedControl';
import { useWeather } from '../hooks/useWeather';
import { useHapticSystem } from '../lib/haptics/system';
import { extractHourly } from '../lib/met-no/client';
import type { WeatherHourly } from '../lib/met-no/types';
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
import {
  selectTodayPlanningHours,
  selectTomorrowPlanningHours,
} from '../lib/planning/today-hours';
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
  getGarmentImage,
  getWeatherIcon,
  getWeatherNuance,
} from '../lib/monter-assets';
import { garmentIdFor } from '../data/garment-illustrations.js';
import { displayNameForDbString } from '../data/garment-display-names.js';
import { useChildren } from '../state/children-store';
import { useSwapOverride } from '../state/swap-override-store';
import { resolveEffectivePlace, useLocationPref } from '../state/location-pref-store';
import type { TabKey } from '../types/nav';
import { htmlLanguageFor } from '../i18n/language-policy';
import './UkeScreen.css';

const DEFAULT_LAT = 60.8867;
const DEFAULT_LON = 11.5614;
const FALLBACK_REF_HOUR = 12;

type ViewTab = 'today' | 'tomorrow';
type Activity = 'utelek' | 'vogn';
type VognMode = 'awake' | 'sleeping';
type TempAxis = 'kald' | 'mild' | 'varm';

type PlanleggE2EWindow = Window & {
  __BABYORA_PLANLEGG_E2E__?: Readonly<{
    fixedHome?: Readonly<{ city: string; lat: number; lon: number }>;
    automatic?: Readonly<{ mode: 'auto'; place: Readonly<{ city: string; lat: number; lon: number }> }>;
  }>;
};

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
}>;

/**
 * Ett punkt i Dagslinjen — ett faktisk vurdert tidspunkt.
 *
 * FUNN (ekstern kritikk 2026-08-06): overskriften «Dagslinjen» sto over
 * nøyaktig ÉN tekstrad uten et eneste klokkeslett. Mekanismen: når det ikke
 * finnes endringsevents returnerer buildPlanningRailRows() én eneste
 * 'unchanged'-rad (rail-rows.ts:335), og unchangedCopy() (rail-rows.ts:145-158)
 * faller til «Samme antrekk i de vurderte tidspunktene» fordi rasteret vårt
 * IKKE er time-for-time — selectTodayPlanningHours() velger kl. 06/10/14/18
 * (today-hours.ts:3), så hasExactHourlyAdjacency() er usann.
 *
 * Rasteret finnes altså i data hele veien; det ble bare aldri vist. Hvert
 * punkt her er ett element i viseModellens allerede kanoniserte forecast
 * (plan-view-model.ts canonicalForecast → ett punkt per vurdert tidspunkt),
 * koblet på fasen sitt ferdigstilte antrekk for det samme tidspunktet.
 */
type PlanningTimelinePoint = Readonly<{
  atIso: string;
  tempC: number;
  symbolCode: string;
  /** Ytterste plagg på tidspunktet — antrekksmerket i linjen. */
  outerGarment: string | null;
  /** Antall plagg (uten utstyr) på tidspunktet. */
  garmentCount: number;
  /** Er dette punktet et faktisk endringspunkt (har en PlanningChangeEvent)? */
  changed: boolean;
}>;

type PlanningEvaluation = Readonly<{
  status: 'offline' | 'partial' | 'empty' | 'ready' | null;
  verdict: PlanningVerdictView | null;
  nextAction: string | null;
  events: readonly PlanningChangeEvent[];
  rows: readonly PlanChangeRailRow[];
  timeline: readonly PlanningTimelinePoint[];
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
  timeline: Object.freeze([]),
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

function conditionTranslationKey(symbolCode: string | undefined): string {
  const normalized = symbolCode?.toLocaleLowerCase('en') ?? '';
  if (normalized.includes('thunder')) return 'plan.weather.thunder';
  if (normalized.includes('snow')) return 'plan.weather.snow';
  if (normalized.includes('sleet')) return 'plan.weather.sleet';
  if (normalized.includes('rain')) return 'plan.weather.rain';
  if (normalized.includes('fog')) return 'plan.weather.fog';
  if (normalized.includes('partly')) return 'plan.weather.partlyCloudy';
  if (normalized.includes('cloud')) return 'plan.weather.cloudy';
  if (normalized.includes('fair')) return 'plan.weather.fair';
  if (normalized.includes('clear')) return 'plan.weather.clear';
  return 'plan.weather.unknown';
}

// P8 (Monter re-skin): presentation-only date/time formatters for the day-
// hero petrol panel and the improved empty-state line. Pure functions, no
// planning-domain logic — same nb-NO/Europe/Oslo pattern already used by
// PlanChangeRail's timeLabel() and ForecastDisclosure's timeLabel().
function capitalize(value: string, locale: string): string {
  return value.length > 0 ? value.charAt(0).toLocaleUpperCase(locale) + value.slice(1) : value;
}

function heroDayLabel(
  atIso: string | null,
  isToday: boolean,
  locale: string,
  todayLabel: string,
): string {
  if (isToday) return todayLabel;
  if (!atIso) return '';
  const instant = new Date(atIso);
  if (Number.isNaN(instant.getTime())) return '';
  const formatter = new Intl.DateTimeFormat(locale, {
    timeZone: PLAN_TIME_ZONE,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return capitalize(formatter.format(instant), locale);
}

function shortTimeLabel(atIso: string | undefined, locale: string): string | null {
  if (!atIso) return null;
  const instant = new Date(atIso);
  if (Number.isNaN(instant.getTime())) return null;
  return new Intl.DateTimeFormat(locale, {
    timeZone: PLAN_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(instant).replace('.', ':');
}

// Begge visningene bruker det samme ærlige dagsrasteret kl. 06/10/14/18.
function timelinePointLabel(atIso: string, locale: string): string {
  return shortTimeLabel(atIso, locale) ?? '';
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
  const { t, i18n } = useTranslation();
  const activeLanguage = i18n.resolvedLanguage ?? i18n.language;
  const locale = htmlLanguageFor(activeLanguage);
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
    ? t('plan.locationMissing')
    : effectivePlace.source === 'automatic'
      ? t('plan.currentLocation', { city: effectivePlace.city })
      : t('plan.fixedLocation', { city: effectivePlace.city });
  const childName = active?.name || t('plan.childFallback');
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
  const tomorrowAccess = useMemo(() => resolvePlanningViewAccess('week', {
    isPlus: isPremium,
    authenticated: false,
    loading: accessLoading,
  }, PLUS_FEATURE_AVAILABILITY), [accessLoading, isPremium]);
  const todayAccess = useMemo(() => resolvePlanningViewAccess('today', {
    isPlus: isPremium,
    authenticated: false,
    loading: false,
  }, PLUS_FEATURE_AVAILABILITY), [isPremium]);
  const viewAccess = tab === 'today' ? todayAccess : tomorrowAccess;
  // P2 hard paywall (PRODUCT.md, 2026-07-31): det finnes ikke lenger noen
  // kontekstuell paywall å åpne herfra — AppPaywallGate (App.tsx) er den
  // ENESTE håndhevingen av entitlement på appnivå. Denne skjermen bounser
  // bare vekk fra en Uke-visning som akkurat mistet levende tilgang (f.eks.
  // et entitlement som utløper mens brukeren står på fanen), slik at hun
  // ikke blir stående på en tom fane.
  const lastResolvedTomorrowAccessRef = useRef<'allowed' | 'denied'>(
    tomorrowAccess.access.state === 'allowed' ? 'allowed' : 'denied',
  );
  useEffect(() => {
    if (tomorrowAccess.access.state === 'neutral') return;
    const previous = lastResolvedTomorrowAccessRef.current;
    lastResolvedTomorrowAccessRef.current = tomorrowAccess.access.state;
    if (previous === 'allowed' && tomorrowAccess.access.state === 'denied') {
      setForecastOpen(false);
      setTab('today');
    }
  }, [tomorrowAccess.access.state]);
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
  const evaluatedAt = weather.evidence?.metadata.evaluatedAt ?? 0;
  const selectedPlanningHours = useMemo(
    () => (tab === 'today'
      ? selectTodayPlanningHours(activeHourly, evaluatedAt, PLAN_TIME_ZONE)
      : selectTomorrowPlanningHours(activeHourly, evaluatedAt, PLAN_TIME_ZONE)),
    [activeHourly, evaluatedAt, tab],
  );

  const phases = useMemo<readonly Phase[]>(() => {
    if (weather.status !== 'ready' && weather.status !== 'offline') return Object.freeze([]);
    if (viewAccess.presentation !== 'full') {
      return Object.freeze([]);
    }
    if (!Number.isInteger(ageMonths) || ageMonths < 0 || ageMonths > 24) {
      return Object.freeze([]);
    }
    return Object.freeze(
      selectedPlanningHours.map((point) => phaseFromHourly(point, ageMonths, activity, vognMode)),
    );
  }, [
    activity,
    ageMonths,
    selectedPlanningHours,
    viewAccess.presentation,
    vognMode,
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
      viewAccess.presentation !== 'full'
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
        cause: t('plan.weather.cause', {
          condition: t(conditionTranslationKey(phase.weather.symbolCode)),
          temp: Math.round(phase.weather.feelsLikeC),
        }),
        transitionContextId: `planning-transition:${phase.weather.atIso}:${fingerprint}`,
      });
      // Antrekksmerket i Dagslinjen skal vise plagget forelderen ser UTENPÅ
      // barnet. orderedGarments er lagvis, men tilbehøret ('ekstra': lue,
      // votter, hals, sokker) ligger ETTER yttertøyet i lista — .at(-1) hadde
      // gitt et par sokker som «ytterste plagg». Vi går derfor på kategori,
      // yttertøy først, med lagene innover som fallback.
      const outerGarment = (['yttertoy', 'mellomlag', 'innerst'] as const)
        .flatMap((category) => phase.recommendation.layers
          .filter((layer) => layer.category === category)
          .flatMap((layer) => layer.items))[0]
        ?? orderedGarments[0]
        ?? null;
      return [{ phase, point, fingerprint, orderedGarments, equipment, outerGarment }];
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

    // Dagslinjens raster. viewModel.forecast ER de vurderte tidspunktene
    // (plan-view-model.ts canonicalForecast beholder kun punkter som ligger i
    // dekningen, sortert og deduplisert på epoch). Koblingen mot fasen gjøres
    // på EPOCH, ikke på ISO-strengen: dekningen bærer MET sin egen iso-form
    // mens fasene bærer toISOString(), og de to strengene kan skrives ulikt
    // for samme øyeblikk. En strengnøkkel her ville tømt hele linjen stille.
    const factByEpoch = new Map(facts.map((fact) => [Date.parse(fact.point.atIso), fact]));
    const changedEpochs = new Set(events.map((event) => Date.parse(event.atIso)));
    const timeline = Object.freeze(
      viewModel.forecast.flatMap((row): PlanningTimelinePoint[] => {
        const epoch = Date.parse(row.atIso);
        const fact = factByEpoch.get(epoch);
        if (!fact) return [];
        return [Object.freeze({
          atIso: row.atIso,
          tempC: row.tempC,
          symbolCode: row.symbolCode,
          outerGarment: fact.outerGarment,
          garmentCount: fact.orderedGarments.length,
          changed: changedEpochs.has(epoch),
        })];
      }),
    );

    return Object.freeze({
      status: viewModel.status,
      verdict: viewModel.verdict,
      nextAction: viewModel.nextAction,
      events,
      rows,
      timeline,
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
    t,
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
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const visibleExpandedEventId = expandedEventId !== null
    && planningEventIds.includes(expandedEventId)
    ? expandedEventId
    : null;
  const setRailExpandedEventId = useCallback((eventId: string | null) => {
    setExpandedEventId(eventId);
    if (eventId !== null) setSelectedEventId(eventId);
  }, [setSelectedEventId]);
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

  const isTodayView = tab === 'today';
  const isTomorrowView = tab === 'tomorrow';
  const selectedContext = selectedEventId
    ? planningEvaluation.contextsByEventId.get(selectedEventId) ?? null
    : null;
  const fallbackPhase = currentPhase(resolvedPhases, evaluatedAt);
  const temperatureContext = selectedContext?.weather
    ?? fallbackPhase?.weather
    ?? (isTodayView ? weather.now : null);
  const tempAxis = tempAxisFor(
    temperatureContext?.feelsLikeC,
    temperatureContext?.tempC,
  );
  let statusState: PlanleggStatusState = { status: 'ready' };
  const onRetry = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, [setRefreshKey]);
  const isTomorrowFull = isTomorrowView && viewAccess.presentation === 'full';
  const isTomorrowNeutral = isTomorrowView && viewAccess.presentation === 'neutral';
  const isTodayNeutral = isTodayView && viewAccess.presentation === 'neutral';
  // I dag og I morgen følger samme tilgangsmodell. «access-gated» betyr her
  // «denne planvisningen er ikke presentation:'full' akkurat nå» (enten
  // fordi entitlement-oppslaget fortsatt laster, eller fordi den er
  // avslått). Ingen egen teaser-tilstand lenger; en gated visning viser
  // ingenting ekstra her — AppPaywallGate (App.tsx) er den faktiske
  // håndhevingen på appnivå.
  const isAccessGatedView = viewAccess.presentation !== 'full';
  const isTomorrowPreparing = isTomorrowFull
    && (weather.status === 'ready' || weather.status === 'offline')
    && weather.evidence?.coverage.status !== 'unavailable'
    && selectedPlanningHours.length < 2;
  if (weather.status === 'loading' || weather.status === 'idle') {
    statusState = { status: 'loading' };
  } else if (
    (weather.status === 'error' && !isAccessGatedView)
    || (
      (weather.status === 'ready' || weather.status === 'offline')
      && !planningEvaluation.hasEvaluatedPlan
      && !isAccessGatedView
      && !isTomorrowPreparing
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
    && !isAccessGatedView
    && planningEvaluation.hasEvaluatedPlan;
  // Skinnen viser fra nå KUN de faktiske endringene. 'unchanged'-radene sa
  // det samme som setningen rett over dem, i systemspråk («Samme antrekk i de
  // vurderte tidspunktene», rail-rows.ts:150) — og de tidspunktene er nå
  // synlige, navngitte punkter i linjen under overskriften. Radene ville altså
  // vært tredje gangs gjentakelse av samme faktum. Filtreringen ligger her og
  // ikke i planleggingslaget: modellen skal fortsatt bære hele radlisten.
  const railChangeRows = useMemo(
    () => planningEvaluation.rows.filter((row) => row.type === 'change'),
    [planningEvaluation.rows],
  );
  const timelinePoints = planningEvaluation.timeline;
  const forecastRows = planningEvaluation.hasEvaluatedPlan
    ? planningEvaluation.forecast
    : selectedPlanningHours.map((row) => ({
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
  const showWeatherHero = !isAccessGatedView
    && !isTomorrowPreparing
    && statusState.status !== 'loading'
    && statusState.status !== 'error';
  const heroWeather = temperatureContext ?? null;
  const heroNuance = getWeatherNuance(heroWeather?.symbolCode);
  const heroCondition = t(conditionTranslationKey(heroWeather?.symbolCode));
  const heroIcon = getWeatherIcon(heroWeather?.symbolCode);
  const heroAtIso = selectedContext?.plannedForIso
    ?? fallbackPhase?.weather.atIso
    ?? (weather.now ? weather.now.observedAt.toISOString() : null);
  const heroDay = heroDayLabel(heroAtIso, isTodayView, locale, t('plan.today'));
  // FUNN (revisjon 2026-08-06, [MINDRE] Plan): «I dag» sto to ganger med ca.
  // 40 px mellomrom — først som aktiv pille i visningsvelgeren (l. 1029, den
  // hvite pillen y 193–285), så igjen som etikett øverst inne i værkortet
  // (y 365–383). Andre forekomst kostet den øverste linjen på skjermens
  // viktigste flate uten å svare på noe.
  //
  // MEKANISMEN: heroDayLabel() returnerer den faste strengen 'I dag' så snart
  // isTodayView er sann (l. 249) — altså nøyaktig samme ord som segmentet som
  // gjorde visningen aktiv. Segmentet «I dag» er låst i DESIGN.md («Locked
  // structures» → Planlegg 1) og blir stående; det er etiketten som gjentar
  // segmentet, ikke omvendt. Kortet skriver derfor datoen KUN når den sier noe
  // velgeren ikke sier: den valgte dagen i Uke-visningen («Tirsdag 12. august»).
  // Skjermleseren mister ingenting — seksjonens aria-label under sier fortsatt
  // «Været I dag», og der finnes ingen fanepille å gjenta.
  const showHeroDayLabel = !isTodayView && heroDay !== '';
  // Review item 7 (nyttig tomtilstand): "empty" har likevel et ekte
  // verdict.summary (plan-view-model.ts sin EvaluatedAdvice-gren dekker
  // 'empty' også) — det ble bare aldri lest ut i visningen. Bruker samme
  // allerede-eksponerte forecastRows til en "stabilt til HH:MM"-linje i
  // stedet for en generisk "ingen endringer"-tekst. Ingen ny selector.
  const emptyStableUntil = shortTimeLabel(forecastRows.at(-1)?.atIso, locale);
  const verdictGarmentSummary = planningEvaluation.verdict
    ? new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(
      planningEvaluation.verdict.orderedGarments.map((garment) => (
        displayNameForDbString(garment, activeLanguage)
      )),
    )
    : '';

  return (
    <section
      className="planlegg-screen ba-temp-root"
      aria-labelledby="planlegg-title"
      data-temp={tempAxis}
      data-planlegg-access={isTomorrowFull ? 'plus-tomorrow' : undefined}
    >
      <header className="planlegg-screen__header">
        <h1 id="planlegg-title">{t('plan.title')}</h1>
        <p className="planlegg-screen__context">{childName} · {city}</p>
      </header>

      <div
        className="planlegg-screen__views"
        aria-disabled={statusState.status === 'error' ? 'true' : undefined}
        inert={statusState.status === 'error' ? true : undefined}
      >
        <SegmentedControl
          legend={t('plan.viewLegend')}
          options={[
            { value: 'today', label: t('plan.today') },
            { value: 'tomorrow', label: t('plan.tomorrow') },
          ]}
          value={tab}
          onChange={onViewChange}
        />
      </div>

      <PlanleggStatusNotice
        state={statusState}
        subject={isAccessGatedView ? 'weather' : 'plan'}
      />

      {/* Petrol værmodul — dagens/valgt dags hero (kun når vi faktisk har et
          vurdert værpunkt) + værprognosen alltid nested inni, aldri fritt-
          flytende (review-item 8). Fargen kommer KUN fra vær-nyansen — én
          instrument-flate, samme regel som Hjem sitt panel. */}
      {showWeatherHero && (
        <section
          className="planlegg-weather"
          data-nuance={heroNuance}
          aria-label={heroWeather
            ? t('plan.weather.sectionToday', {
              day: heroDay || t('plan.weather.selectedDay'),
            })
            : t('plan.weather.forecast')}
        >
          {heroWeather && (
            <>
              {showHeroDayLabel && (
                <p className="planlegg-weather__day">{heroDay}</p>
              )}
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
                {t('plan.weather.feelsLike', { temp: formatHeroTemp(heroWeather.feelsLikeC) })}
                {' · '}
                {t('plan.weather.wind', { wind: Math.round(heroWeather.windMs) })}
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

      {isTomorrowPreparing && (
        <section className="planlegg-advice planlegg-advice--preparing" aria-live="polite">
          <h2>{t('plan.preparingTitle')}</h2>
          <p>{t('plan.preparingBody')}</p>
        </section>
      )}

      {/* Dybdedoktrinen D1: verdikt + tidslinjen deler NÅ
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
                komplette, flate WebP-oppslag som Hjem). Full liste ligger
                for skjermlesere. */}
            {planningEvaluation.status === 'empty' ? (
              <>
                <p className="planlegg-screen__verdict">
                  {isTodayView ? t('plan.outfitHolds') : t('plan.prepareNightBefore')}
                </p>
                {planningEvaluation.verdict && (
                  <ul
                    className="planlegg-garments"
                    aria-label={t(
                      isTodayView ? 'plan.todayOutfitAria' : 'plan.tomorrowOutfitAria',
                      { summary: verdictGarmentSummary },
                    )}
                  >
                    {/* T1A: rå label beholdes som bilde-oppslagsnøkkel;
                        title/sr-tekst bruker visningsnavnet. */}
                    {planningEvaluation.verdict.orderedGarments.map((label) => {
                      const image = getGarmentImage(garmentIdFor(label));
                      const displayName = displayNameForDbString(label, activeLanguage);
                      return (
                        <li key={label} className="planlegg-garments__item" title={displayName}>
                          <img className="planlegg-garments__thumb" src={image} alt="" draggable={false} />
                          <span className="hjm-sr-only">{displayName}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <p className="planlegg-screen__empty">
                  {emptyStableUntil
                    ? isTodayView
                      ? t('plan.noChangesUntil', { time: emptyStableUntil })
                      : t('plan.tomorrowHoldsUntil', { time: emptyStableUntil })
                    : t('plan.noChanges')}
                </p>
              </>
            ) : (
              <>
                <p className="planlegg-screen__verdict">
                  {isTodayView ? t('plan.plannedOutfit') : t('plan.prepareNightBefore')}
                </p>
                {planningEvaluation.verdict && (
                  <ul
                    className="planlegg-garments"
                    aria-label={t('plan.plannedOutfitAria', { summary: verdictGarmentSummary })}
                  >
                    {/* T1A: rå label beholdes som bilde-oppslagsnøkkel;
                        title/sr-tekst bruker visningsnavnet. */}
                    {planningEvaluation.verdict.orderedGarments.map((label) => {
                      const image = getGarmentImage(garmentIdFor(label));
                      const displayName = displayNameForDbString(label, activeLanguage);
                      return (
                        <li key={label} className="planlegg-garments__item" title={displayName}>
                          <img className="planlegg-garments__thumb" src={image} alt="" draggable={false} />
                          <span className="hjm-sr-only">{displayName}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}
          </div>

          {/* En overskrift som lover en linje MÅ vise en linje. Derfor er
              hele seksjonen betinget av at rasteret faktisk finnes: uten
              punkter står den presise setningen over («Ingen endringer frem
              til kl. 18:00») alene, uten en overskrift som lover mer. */}
          {(timelinePoints.length > 0 || railChangeRows.length > 0) && (
            <section className="planlegg-screen__rail" aria-labelledby="planlegg-rail-title">
              <h2 id="planlegg-rail-title" style={changeRailHeadStyle}>
                {t(isTodayView ? 'plan.timelineToday' : 'plan.timelineTomorrow')}
              </h2>
              {timelinePoints.length > 0 && (
                <ol
                  className="planlegg-dagslinje"
                  aria-label={isTodayView
                    ? t('plan.timelineAriaToday')
                    : t('plan.timelineAriaTomorrow')}
                >
                  {timelinePoints.map((point) => {
                    const label = timelinePointLabel(point.atIso, locale);
                    const weatherIcon = getWeatherIcon(point.symbolCode);
                    const garmentName = point.outerGarment
                      ? displayNameForDbString(point.outerGarment, activeLanguage)
                      : null;
                    const garmentImage = point.outerGarment
                      ? getGarmentImage(garmentIdFor(point.outerGarment))
                      : null;
                    return (
                      <li
                        key={point.atIso}
                        className="planlegg-dagslinje__punkt"
                        data-endring={point.changed ? 'ja' : undefined}
                      >
                        <time className="planlegg-dagslinje__tid" dateTime={point.atIso}>
                          {label}
                        </time>
                        {weatherIcon && (
                          <img
                            className="planlegg-dagslinje__vaer"
                            src={weatherIcon}
                            alt=""
                            draggable={false}
                          />
                        )}
                        <span className="planlegg-dagslinje__temp">
                          {`${formatHeroTemp(point.tempC)}°`}
                        </span>
                        <span className="planlegg-dagslinje__merke" title={garmentName ?? undefined}>
                          {garmentImage && <img src={garmentImage} alt="" draggable={false} />}
                        </span>
                        {point.changed && (
                          <span className="planlegg-dagslinje__endring">{t('plan.change')}</span>
                        )}
                        <span className="hjm-sr-only">
                          {t('plan.timelinePoint', {
                            time: label,
                            temp: formatHeroTemp(point.tempC),
                            count: point.garmentCount,
                            outer: garmentName ? t('plan.outermost', { garment: garmentName }) : '',
                            change: point.changed ? t('plan.changesHere') : '',
                          })}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              )}
              {railChangeRows.length > 0 && (
                <PlanChangeRail
                  rows={railChangeRows}
                  selectedEventId={visibleExpandedEventId}
                  onSelect={setRailExpandedEventId}
                  onOpenOutfit={openPlannedOutfit}
                />
              )}
            </section>
          )}
        </section>
      )}

      {isTomorrowNeutral && (
        <p
          className="planlegg-screen__week-weather"
          data-planlegg-access="neutral"
        >
          {t('plan.checkingTomorrow')}
        </p>
      )}

      {isTodayNeutral && (
        <p
          className="planlegg-screen__week-weather"
          data-planlegg-access="neutral"
        >
          {t('plan.checkingToday')}
        </p>
      )}
    </section>
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
