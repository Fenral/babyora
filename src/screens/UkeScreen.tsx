import {
  useCallback,
  useMemo,
  useState,
  type CSSProperties,
} from 'react';
import { ForecastDisclosure } from '../components/planning/ForecastDisclosure';
import { PlanChangeRail, type PlanChangeRailRow, type PlanningRailEvent } from '../components/planning/PlanChangeRail';
import {
  PlanleggStatusNotice,
  type PlanleggStatusState,
} from '../components/planning/PlanleggStatusNotice';
import { SegmentedControl } from '../components/controls/SegmentedControl';
import { useWeather } from '../hooks/useWeather';
import { decideAccess } from '../lib/access/capabilities';
import { useHapticSystem } from '../lib/haptics/system';
import { extractDailyAtHour, extractHourly } from '../lib/met-no/client';
import type { WeatherDayAtHour, WeatherHourly } from '../lib/met-no/types';
import {
  type PlanningChangeEvent,
  type PlanningPoint,
} from '../lib/planning/change-events';
import { planningChangeActionSentence } from '../lib/planning/change-sentence';
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
import { buildPlanViewModel } from '../lib/planning/plan-view-model';
import { buildPlanningRailRows } from '../lib/planning/rail-rows';
import { useAccess } from '../lib/premium/use-access';
import { dobToAgeMonths } from '../lib/utils/dob-to-age-months';
import { applySwapsFinalized } from '../lib/wool-layers/finalize-safety';
import { recommend } from '../lib/wool-layers/recommend';
import type { Recommendation, RecommendInput } from '../lib/wool-layers/types';
import { useChildren } from '../state/children-store';
import { useSwapOverride } from '../state/swap-override-store';
import type { TabKey } from '../types/nav';
import './UkeScreen.css';

const DEFAULT_LAT = 60.8867;
const DEFAULT_LON = 11.5614;
const FALLBACK_REF_HOUR = 12;

type ViewTab = 'today' | 'tenday';
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
  events: readonly PlanningChangeEvent[];
  rows: readonly PlanChangeRailRow[];
  contextsByEventId: ReadonlyMap<string, PlannedOutfitContext>;
  preferredEventId: string | null;
  hasEvaluatedPlan: boolean;
}>;

const EMPTY_PLANNING_EVALUATION: PlanningEvaluation = Object.freeze({
  events: Object.freeze([]),
  rows: Object.freeze([]),
  contextsByEventId: Object.freeze(new Map<string, PlannedOutfitContext>()),
  preferredEventId: null,
  hasEvaluatedPlan: false,
});

const timeFormatter = new Intl.DateTimeFormat('nb-NO', {
  timeZone: PLAN_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
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
  onRetry,
}: Pick<Props, 'onOpenPlannedOutfit'> & Readonly<{ onRetry: () => void }>) {
  const { active } = useChildren();
  const { fire } = useHapticSystem();
  const swaps = useSwapOverride((state) => state.swaps);
  const { isPremium, loading: accessLoading } = useAccess();
  const lat = active?.lat || DEFAULT_LAT;
  const lon = active?.lon || DEFAULT_LON;
  const city = active?.city || 'Elverum';
  const childName = active?.name || 'barnet';
  const activeDob = active?.dob;
  const ageMonths = useMemo(
    () => (activeDob ? dobToAgeMonths(activeDob) : 12),
    [activeDob],
  );
  const [activity] = useState<Activity>('utelek');
  const vognMode: VognMode = 'awake';
  const weather = useWeather(lat, lon, FALLBACK_REF_HOUR);
  const [tab, setTab] = useState<ViewTab>('today');
  const [forecastOpen, setForecastOpen] = useState(false);
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
      tab !== 'today'
      || !weather.evidence
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
    const access = decideAccess('future_plan', {
      isPlus: isPremium,
      authenticated: false,
      loading: accessLoading,
    });
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
          source: 'configured-place',
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
          capability: 'future_plan',
          allowed: access.allowed,
          reason: access.reason,
        },
      });
      contextEntries.push([event.id, context]);
      outfitAvailabilityByEventId[event.id] = access.allowed;
    }

    const canonicalRows = buildPlanningRailRows(
      weather.evidence.coverage,
      events,
      outfitAvailabilityByEventId,
      points.map((point) => point.atIso),
    );
    const eventById = new Map(events.map((event) => [event.id, event]));
    const rows = Object.freeze(canonicalRows.flatMap((row): PlanChangeRailRow[] => {
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
        hasOutfit: row.hasOutfit,
        event: presentationEvent,
      }];
    }));

    return Object.freeze({
      events,
      rows,
      contextsByEventId: Object.freeze(new Map(contextEntries)),
      preferredEventId: events[0]?.id ?? null,
      hasEvaluatedPlan: true,
    });
  }, [
    accessLoading,
    active?.id,
    activity,
    ageMonths,
    childName,
    city,
    isPremium,
    lat,
    lon,
    resolvedPhases,
    tab,
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
  const openPlannedOutfit = useCallback((
    eventId: string,
    trigger: HTMLElement,
  ) => {
    const context = resolvePlannedOutfitContext(
      eventId,
      planningEvaluation.events,
      planningEvaluation.contextsByEventId,
    );
    if (!context || !context.access.allowed) return;
    onOpenPlannedOutfit(context, trigger);
  }, [onOpenPlannedOutfit, planningEvaluation]);

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
  const selectedEvent = selectedEventId
    ? planningEvaluation.events.find((event) => event.id === selectedEventId) ?? null
    : null;
  const nextEvent = planningEvaluation.events.find(
    (event) => Date.parse(event.atIso) >= evaluatedAt,
  ) ?? planningEvaluation.events[0] ?? null;
  const answerEvent = selectedEvent ?? nextEvent;

  let statusState: PlanleggStatusState = { status: 'ready' };
  if (weather.status === 'loading' || weather.status === 'idle') {
    statusState = { status: 'loading' };
  } else if (
    weather.status === 'error'
    || (
      (weather.status === 'ready' || weather.status === 'offline')
      && !planningEvaluation.hasEvaluatedPlan
      && tab === 'today'
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
    && planningEvaluation.hasEvaluatedPlan
    && tab === 'today';
  const forecastRows = activeHourly.map((row) => ({
    atIso: row.time.toISOString(),
    tempC: row.tempC,
    feelsLikeC: row.feelsLikeC,
    symbolCode: row.symbolCode,
  }));

  return (
    <section
      className="planlegg-screen ba-temp-root-transition"
      aria-labelledby="planlegg-title"
      data-temp={tempAxis}
    >
      <header className="planlegg-screen__header">
        <h1 id="planlegg-title">Planlegg</h1>
        <p className="planlegg-screen__context">{childName} · {city}</p>
      </header>

      <div className="planlegg-screen__views">
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

      <PlanleggStatusNotice state={statusState} />

      {showAdvice && (
        <>
          <div className="planlegg-screen__answer">
            {planningEvaluation.events.length === 0 ? (
              <>
                <p className="planlegg-screen__verdict">Ingen antrekksendringer</p>
                <p className="planlegg-screen__empty">
                  Babyora fant ingen endringer i perioden som er vurdert.
                </p>
              </>
            ) : (
              <>
                <p className="planlegg-screen__verdict">
                  {nextEvent
                    ? `Antrekket holder til ${timeFormatter.format(new Date(nextEvent.atIso)).replace('.', ':')}.`
                    : 'Antrekket holder i de vurderte tidspunktene.'}
                </p>
                {answerEvent && (
                  <p className="planlegg-screen__action">
                    {planningChangeActionSentence(answerEvent)}
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

      {tab === 'tenday' && !isPremium && statusState.status !== 'loading' && (
        <p className="planlegg-screen__empty">
          Antrekk videre i uka er tilgjengelig med Babyora Pluss.
        </p>
      )}

      {statusState.status !== 'loading' && statusState.status !== 'error' && (
        <ForecastDisclosure
          open={forecastOpen}
          onToggle={() => setForecastOpen((current) => !current)}
          rows={forecastRows}
        />
      )}
    </section>
  );
}

export function UkeScreen({
  onOpenPlannedOutfit,
  onNavigate: _onNavigate,
  onOpenSheet: _onOpenSheet,
}: Props) {
  const [requestKey, setRequestKey] = useState(0);
  return (
    <PlanleggData
      key={requestKey}
      onOpenPlannedOutfit={onOpenPlannedOutfit}
      onRetry={() => setRequestKey((current) => current + 1)}
    />
  );
}

export default UkeScreen;
