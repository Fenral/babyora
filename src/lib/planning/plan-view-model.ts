import { parseStrictIsoInstant } from '../met-no/types.js';
import type { ForecastCoverage } from './coverage.js';
import {
  derivePlanningChangeEvents,
  isValidPlanningPoint,
  type PlanningChangeEvent,
  type PlanningPoint,
} from './change-events.js';
import { planningChangeActionSentence } from './change-sentence.js';
import {
  buildPlanningRailRows,
  type PlanningRailRow,
} from './rail-rows.js';

export type PlanningWeatherRow = Readonly<{
  atIso: string;
  tempC: number;
  feelsLikeC: number;
  symbolCode: string;
}>;

export type PlanningVerdictView = Readonly<{
  finalizedFingerprint: string;
  orderedGarments: readonly string[];
  equipment: readonly string[];
  summary: string;
}>;

export type PlanViewModelInput = Readonly<{
  status: 'loading' | 'error' | 'offline' | 'ready';
  coverage: ForecastCoverage | null;
  points: readonly PlanningPoint[];
  forecast: readonly PlanningWeatherRow[];
  evaluatedAtIso: string;
  cachedAtIso?: string;
  outfitAvailabilityByEventId?: Readonly<Record<string, boolean>>;
}>;

type EmptyAdvice = Readonly<{
  verdict: null;
  nextAction: null;
  events: readonly [];
  rows: readonly [];
  candidateEventIds: readonly [];
  forecast: readonly [];
}>;

type EvaluatedAdvice = Readonly<{
  verdict: PlanningVerdictView;
  nextAction: string | null;
  events: readonly PlanningChangeEvent[];
  rows: readonly PlanningRailRow[];
  candidateEventIds: readonly string[];
  forecast: readonly PlanningWeatherRow[];
}>;

export type PlanViewModel =
  | (Readonly<{
    status: 'loading';
    message: 'Henter dagens plan …';
  }> & EmptyAdvice)
  | (Readonly<{
    status: 'error';
    heading: 'Vi fikk ikke oppdatert planen';
    body: 'Vi har ingen oppdatert plan å vise. Prøv å hente planen på nytt.';
    retryLabel: 'Prøv å hente planen';
  }> & EmptyAdvice)
  | (Readonly<{
    status: 'offline';
    message: string;
  }> & EvaluatedAdvice)
  | (Readonly<{
    status: 'partial';
    message: 'Planen viser bare tidspunktene Babyora har værdata for.';
  }> & EvaluatedAdvice)
  | (Readonly<{
    status: 'empty';
    heading: 'Ingen antrekksendringer';
    body: 'Babyora fant ingen endringer i perioden som er vurdert.';
  }> & EvaluatedAdvice)
  | (Readonly<{
    status: 'ready';
  }> & EvaluatedAdvice);

const osloTimeFormatter = new Intl.DateTimeFormat('nb-NO', {
  timeZone: 'Europe/Oslo',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function loadingModel(): PlanViewModel {
  return {
    status: 'loading',
    message: 'Henter dagens plan …',
    verdict: null,
    nextAction: null,
    events: [],
    rows: [],
    candidateEventIds: [],
    forecast: [],
  };
}

function errorModel(): PlanViewModel {
  return {
    status: 'error',
    heading: 'Vi fikk ikke oppdatert planen',
    body: 'Vi har ingen oppdatert plan å vise. Prøv å hente planen på nytt.',
    retryLabel: 'Prøv å hente planen',
    verdict: null,
    nextAction: null,
    events: [],
    rows: [],
    candidateEventIds: [],
    forecast: [],
  };
}

function normalizeText(value: string): string {
  return value.normalize('NFC').trim();
}

function normalizeList(values: readonly string[]): readonly string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const normalized = normalizeText(value);
    if (normalized.length === 0 || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return Object.freeze(result);
}

function canonicalPlanningPoints(
  points: readonly PlanningPoint[],
  coverage: ForecastCoverage,
): readonly PlanningPoint[] | null {
  if (points.length < 2) return null;
  const coveredEpochs = new Set(coverage.points.map((point) => point.epochMs));
  const contentByFingerprint = new Map<string, string>();
  const normalized: PlanningPoint[] = [];

  for (const point of points) {
    const pointEpoch = parseStrictIsoInstant(point.atIso);
    if (pointEpoch === null || !coveredEpochs.has(pointEpoch) || !isValidPlanningPoint(point)) return null;
    const finalizedFingerprint = normalizeText(point.finalizedFingerprint);
    const cause = normalizeText(point.cause);
    const transitionContextId = normalizeText(point.transitionContextId);
    if (!finalizedFingerprint || !cause || !transitionContextId) return null;
    const orderedGarments = normalizeList(point.orderedGarments);
    const equipment = normalizeList(point.equipment);
    if (orderedGarments.length === 0 && equipment.length === 0) return null;
    const visibleContent = JSON.stringify([orderedGarments, equipment]);
    const priorContent = contentByFingerprint.get(finalizedFingerprint);
    if (priorContent !== undefined && priorContent !== visibleContent) return null;
    contentByFingerprint.set(finalizedFingerprint, visibleContent);
    normalized.push(Object.freeze({
      atIso: point.atIso,
      finalizedFingerprint,
      orderedGarments,
      equipment,
      cause,
      transitionContextId,
      ...(point.transition ? { transition: point.transition } : {}),
    }));
  }

  return Object.freeze(normalized.sort((a, b) => {
    const epochDelta = parseStrictIsoInstant(a.atIso)! - parseStrictIsoInstant(b.atIso)!;
    if (epochDelta !== 0) return epochDelta;
    return JSON.stringify(a).localeCompare(JSON.stringify(b), 'nb-NO');
  }));
}

function canonicalForecast(
  rows: readonly PlanningWeatherRow[],
  coverage: ForecastCoverage,
): readonly PlanningWeatherRow[] {
  const coveredIsos = new Set(coverage.points.map((point) => point.iso));
  const unique = new Map<string, PlanningWeatherRow>();
  for (const row of rows) {
    if (
      !coveredIsos.has(row.atIso)
      || parseStrictIsoInstant(row.atIso) === null
      || !Number.isFinite(row.tempC)
      || !Number.isFinite(row.feelsLikeC)
      || normalizeText(row.symbolCode).length === 0
    ) {
      continue;
    }
    unique.set(row.atIso, Object.freeze({
      atIso: row.atIso,
      tempC: row.tempC,
      feelsLikeC: row.feelsLikeC,
      symbolCode: normalizeText(row.symbolCode),
    }));
  }
  return Object.freeze([...unique.values()].sort(
    (a, b) => parseStrictIsoInstant(a.atIso)! - parseStrictIsoInstant(b.atIso)!,
  ));
}

function buildVerdict(point: PlanningPoint): PlanningVerdictView {
  const orderedGarments = Object.freeze([...point.orderedGarments]);
  const equipment = Object.freeze([...point.equipment]);
  return Object.freeze({
    finalizedFingerprint: point.finalizedFingerprint,
    orderedGarments,
    equipment,
    summary: [...orderedGarments, ...equipment].join(' • '),
  });
}

function evaluatedAdvice(
  input: PlanViewModelInput,
  coverage: ForecastCoverage,
  evaluatedAtEpoch: number,
  points: readonly PlanningPoint[],
): EvaluatedAdvice | null {
  const currentPoint = [...points]
    .filter((point) => parseStrictIsoInstant(point.atIso)! <= evaluatedAtEpoch)
    .at(-1);
  if (!currentPoint) return null;

  const events = Object.freeze(derivePlanningChangeEvents(points));
  const rows = Object.freeze(buildPlanningRailRows(
    coverage,
    events,
    input.outfitAvailabilityByEventId,
    points.map((point) => point.atIso),
  ));
  const candidates = events.filter(
    (event) => parseStrictIsoInstant(event.atIso)! >= evaluatedAtEpoch,
  );
  const candidateEventIds = Object.freeze(candidates.map((event) => event.id));
  const nextAction = candidates[0] ? planningChangeActionSentence(candidates[0]) : null;
  return {
    verdict: buildVerdict(currentPoint),
    nextAction: nextAction || null,
    events,
    rows,
    candidateEventIds,
    forecast: canonicalForecast(input.forecast, coverage),
  };
}

export function buildPlanViewModel(input: PlanViewModelInput): PlanViewModel {
  if (input.status === 'loading') return loadingModel();
  if (input.status === 'error') return errorModel();

  const evaluatedAtEpoch = parseStrictIsoInstant(input.evaluatedAtIso);
  const coverage = input.coverage;
  if (
    evaluatedAtEpoch === null
    || !coverage
    || coverage.status === 'unavailable'
    || coverage.points.length === 0
  ) {
    return errorModel();
  }
  const coverageEpochs = coverage.points.map((point) => point.epochMs).sort((a, b) => a - b);
  const coverageStart = coverageEpochs[0]!;
  const coverageEnd = coverageEpochs.at(-1)!;
  if (
    evaluatedAtEpoch < coverageStart
    || evaluatedAtEpoch > coverageEnd
    || (
      (coverage.status === 'sampled' || coverage.status === 'gapped')
      && !coverageEpochs.includes(evaluatedAtEpoch)
    )
  ) {
    return errorModel();
  }
  if (
    (input.status === 'offline' && coverage.status !== 'stale')
    || (input.status === 'ready' && coverage.status === 'stale')
  ) {
    return errorModel();
  }

  const points = canonicalPlanningPoints(input.points, coverage);
  if (!points) return errorModel();
  const advice = evaluatedAdvice(input, coverage, evaluatedAtEpoch, points);
  if (!advice) return errorModel();

  if (input.status === 'offline') {
    const cachedAtEpoch = input.cachedAtIso ? parseStrictIsoInstant(input.cachedAtIso) : null;
    if (cachedAtEpoch === null) return errorModel();
    const cachedTime = osloTimeFormatter.format(cachedAtEpoch).replace('.', ':');
    return {
      status: 'offline',
      message: `Du er frakoblet · viser planen fra ${cachedTime}`,
      ...advice,
    };
  }

  if (coverage.status === 'sampled' || coverage.status === 'gapped') {
    return {
      status: 'partial',
      message: 'Planen viser bare tidspunktene Babyora har værdata for.',
      ...advice,
    };
  }

  if (advice.events.length === 0) {
    return {
      status: 'empty',
      heading: 'Ingen antrekksendringer',
      body: 'Babyora fant ingen endringer i perioden som er vurdert.',
      ...advice,
    };
  }

  return {
    status: 'ready',
    ...advice,
  };
}
