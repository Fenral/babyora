import { parseStrictIsoInstant } from '../met-no/types.js';
import type {
  ForecastCoverage,
  ForecastCoveragePoint,
  ForecastCoverageStatus,
} from './coverage.js';
import {
  comparePlanningChangeEvents,
  type ChangeEvent,
  type PlanningChangeEvent,
} from './change-events.js';

export type PlanningRailRow =
  | Readonly<{
    id: string;
    type: 'unchanged';
    startIso: string;
    endIso: string;
    evidencePointIsos: readonly string[];
    copy: string;
  }>
  | Readonly<{
    id: string;
    type: 'change';
    eventId: string;
    atIso: string;
    transitionContextId: string;
    hasOutfit: boolean;
  }>;

const HOUR_MS = 60 * 60 * 1000;
const coverageDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Europe/Oslo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const coverageTimeFormatter = new Intl.DateTimeFormat('nb-NO', {
  timeZone: 'Europe/Oslo',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
const PLANNING_KIND_PRIORITY: Readonly<Record<PlanningChangeEvent['kind'], number>> = {
  location: 0,
  prep: 1,
  rain: 2,
  swap: 3,
  remove: 4,
  add: 5,
};

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null;
}

function isStringList(value: unknown): value is readonly string[] {
  return Array.isArray(value)
    && value.every((item) => typeof item === 'string' && item.trim().length > 0);
}

function isCoverageStatus(value: unknown): value is ForecastCoverageStatus {
  return value === 'complete-hourly'
    || value === 'sampled'
    || value === 'gapped'
    || value === 'stale'
    || value === 'unavailable';
}

function osloDate(epochMs: number): string {
  const parts = coverageDateFormatter.formatToParts(epochMs);
  const part = (type: Intl.DateTimeFormatPartTypes): string => (
    parts.find((item) => item.type === type)?.value ?? ''
  );
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function osloTime(epochMs: number): string {
  return coverageTimeFormatter.format(epochMs).replace('.', ':');
}

function freshCoverageStatus(points: readonly ForecastCoveragePoint[]): ForecastCoverageStatus {
  if (points.length < 2) return 'sampled';
  const intervals = points.slice(1).map((point, index) => point.epochMs - points[index]!.epochMs);
  if (intervals.every((interval) => interval === HOUR_MS)) return 'complete-hourly';
  const cadence = intervals[0];
  if (
    cadence !== undefined
    && cadence > HOUR_MS
    && cadence % HOUR_MS === 0
    && intervals.every((interval) => interval === cadence)
  ) {
    return 'sampled';
  }
  return 'gapped';
}

export function isValidPlanningCoverage(value: unknown): value is ForecastCoverage {
  if (
    !isRecord(value)
    || value.timeZone !== 'Europe/Oslo'
    || !isCoverageStatus(value.status)
    || !Array.isArray(value.points)
  ) {
    return false;
  }
  if (value.status === 'unavailable') {
    return value.points.length === 0 && value.startIso === null && value.endIso === null;
  }
  if (value.points.length === 0) return false;

  const points: ForecastCoveragePoint[] = [];
  for (const point of value.points) {
    if (
      !isRecord(point)
      || typeof point.iso !== 'string'
      || typeof point.epochMs !== 'number'
      || !Number.isFinite(point.epochMs)
      || parseStrictIsoInstant(point.iso) !== point.epochMs
      || point.localDate !== osloDate(point.epochMs)
      || point.localTime !== osloTime(point.epochMs)
    ) {
      return false;
    }
    points.push(point as ForecastCoveragePoint);
  }
  if (points.some((point, index) => index > 0 && point.epochMs <= points[index - 1]!.epochMs)) {
    return false;
  }
  if (value.startIso !== points[0]!.iso || value.endIso !== points.at(-1)!.iso) return false;
  return value.status === 'stale' || value.status === freshCoverageStatus(points);
}

function canonicalPoints(coverage: ForecastCoverage): ForecastCoveragePoint[] {
  return [...coverage.points]
    .sort((a, b) => a.epochMs - b.epochMs || a.iso.localeCompare(b.iso))
    .filter((point, index, points) => index === 0 || point.epochMs !== points[index - 1]!.epochMs);
}

function hasExactHourlyAdjacency(points: readonly ForecastCoveragePoint[]): boolean {
  return points.length > 1
    && points.slice(1).every((point, index) => point.epochMs - points[index]!.epochMs === HOUR_MS);
}

function unchangedCopy(
  coverage: ForecastCoverage,
  points: readonly ForecastCoveragePoint[],
): string {
  if (coverage.status !== 'complete-hourly' || !hasExactHourlyAdjacency(points)) {
    return 'Samme antrekk i de vurderte tidspunktene';
  }
  const first = points[0]!;
  const last = points.at(-1)!;
  if (first.localDate === last.localDate && last.localTime === '23:00') {
    return 'Samme antrekk ut dagen';
  }
  return `Samme antrekk til kl. ${last.localTime}`;
}

function unchangedRow(
  coverage: ForecastCoverage,
  points: readonly ForecastCoveragePoint[],
): PlanningRailRow {
  const evidencePointIsos = points.map((point) => point.iso);
  const startIso = evidencePointIsos[0]!;
  const endIso = evidencePointIsos.at(-1)!;
  return {
    id: `planning-row-unchanged-${encodeURIComponent(JSON.stringify(evidencePointIsos))}`,
    type: 'unchanged',
    startIso,
    endIso,
    evidencePointIsos,
    copy: unchangedCopy(coverage, points),
  };
}

function changeRow(
  event: PlanningChangeEvent,
  outfitAvailabilityByEventId: Readonly<Record<string, boolean>>,
): PlanningRailRow {
  return {
    id: `planning-row-change-${event.id}`,
    type: 'change',
    eventId: event.id,
    atIso: event.atIso,
    transitionContextId: event.transitionContextId,
    hasOutfit: Object.prototype.hasOwnProperty.call(outfitAvailabilityByEventId, event.id)
      && outfitAvailabilityByEventId[event.id] === true,
  };
}

function hasExactKeys(value: Readonly<Record<string, unknown>>, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  return actual.length === keys.length
    && actual.every((key, index) => key === [...keys].sort()[index]);
}

function transitionContent(
  kind: PlanningChangeEvent['kind'],
  transition: unknown,
): readonly unknown[] | null {
  if (kind === 'add' || kind === 'remove' || kind === 'swap') {
    return transition === undefined ? [] : null;
  }
  if (!isRecord(transition)) return null;
  if (kind === 'rain') {
    if (
      !hasExactKeys(transition, ['action', 'garments', 'kind'])
      || transition.kind !== 'rain'
      || (transition.action !== 'bring' && transition.action !== 'wear')
      || !isStringList(transition.garments)
      || transition.garments.length === 0
    ) return null;
    return ['rain', transition.action, [...transition.garments]];
  }
  if (kind === 'location') {
    if (
      !hasExactKeys(transition, ['action', 'kind', 'placeLabel'])
      || transition.kind !== 'location'
      || typeof transition.placeLabel !== 'string'
      || transition.placeLabel.trim().length === 0
      || typeof transition.action !== 'string'
      || transition.action.trim().length === 0
    ) return null;
    return ['location', transition.placeLabel, transition.action];
  }
  if (
    !hasExactKeys(transition, ['garments', 'kind'])
    || transition.kind !== 'prep'
    || !isStringList(transition.garments)
    || transition.garments.length === 0
  ) return null;
  return ['prep', [...transition.garments]];
}

function eventContent(event: unknown): string | null {
  if (
    !isRecord(event)
    || typeof event.id !== 'string'
    || event.id.trim().length === 0
    || typeof event.atIso !== 'string'
    || parseStrictIsoInstant(event.atIso) === null
    || typeof event.kind !== 'string'
    || !Object.prototype.hasOwnProperty.call(PLANNING_KIND_PRIORITY, event.kind)
    || !isStringList(event.addedGarments)
    || !isStringList(event.removedGarments)
    || typeof event.cause !== 'string'
    || event.cause.trim().length === 0
    || typeof event.transitionContextId !== 'string'
    || event.transitionContextId.trim().length === 0
  ) {
    return null;
  }
  const kind = event.kind as PlanningChangeEvent['kind'];
  if (
    (kind === 'add' && (event.addedGarments.length === 0 || event.removedGarments.length !== 0))
    || (kind === 'remove' && (event.removedGarments.length === 0 || event.addedGarments.length !== 0))
    || (kind === 'swap' && (event.addedGarments.length === 0 || event.removedGarments.length === 0))
  ) {
    return null;
  }
  const canonicalTransition = transitionContent(kind, event.transition);
  if (canonicalTransition === null) return null;
  return JSON.stringify([
    event.atIso,
    event.kind,
    [...event.addedGarments],
    [...event.removedGarments],
    event.cause,
    event.transitionContextId,
    canonicalTransition,
  ]);
}

export function buildPlanningRailRows(
  coverage: ForecastCoverage,
  events: readonly PlanningChangeEvent[],
  outfitAvailabilityByEventId: Readonly<Record<string, boolean>> = {},
  evaluatedPointIsos: readonly string[] = [],
): PlanningRailRow[] {
  if (
    !isValidPlanningCoverage(coverage)
    || !Array.isArray(events)
    || !isRecord(outfitAvailabilityByEventId)
    || Object.values(outfitAvailabilityByEventId).some((value) => typeof value !== 'boolean')
    || !Array.isArray(evaluatedPointIsos)
    || evaluatedPointIsos.some((iso) => (
      typeof iso !== 'string' || parseStrictIsoInstant(iso) === null
    ))
  ) {
    return [];
  }
  if (coverage.status === 'unavailable') return [];
  const coveredPoints = canonicalPoints(coverage);
  const evaluatedEpochList = evaluatedPointIsos.map((iso) => parseStrictIsoInstant(iso)!);
  const evaluatedEpochs = new Set(evaluatedEpochList);
  const coveredEpochs = new Set(coveredPoints.map((point) => point.epochMs));
  if (
    evaluatedEpochList.some((epochMs) => !coveredEpochs.has(epochMs))
  ) {
    return [];
  }
  const points = coveredPoints.filter((point) => evaluatedEpochs.has(point.epochMs));
  if (points.length < 2) return [];
  const canonicalEvents = events as readonly PlanningChangeEvent[];

  const eventContentById = new Map<string, string>();
  for (const event of canonicalEvents) {
    const content = eventContent(event);
    if (content === null) return [];
    const priorContent = eventContentById.get(event.id);
    if (priorContent !== undefined && priorContent !== content) return [];
    eventContentById.set(event.id, content);
  }

  const pointIndexByEpoch = new Map(points.map((point, index) => [point.epochMs, index]));
  const eventPointIndex = (event: PlanningChangeEvent): number | undefined => {
    const epochMs = parseStrictIsoInstant(event.atIso);
    return epochMs === null ? undefined : pointIndexByEpoch.get(epochMs);
  };
  const sortedEvents = [...canonicalEvents]
    .filter((event) => eventPointIndex(event) !== undefined)
    .sort((a, b) => {
      const indexDelta = eventPointIndex(a)! - eventPointIndex(b)!;
      if (indexDelta !== 0) return indexDelta;
      const kindDelta = PLANNING_KIND_PRIORITY[a.kind] - PLANNING_KIND_PRIORITY[b.kind];
      if (kindDelta !== 0) return kindDelta;
      const contentDelta = comparePlanningChangeEvents(a, b);
      if (contentDelta !== 0) return contentDelta;
      return a.id.localeCompare(b.id);
    })
    .filter((event, index, ordered) => index === 0 || event.id !== ordered[index - 1]!.id);

  if (sortedEvents.length === 0) {
    return [unchangedRow(coverage, points)];
  }

  const rows: PlanningRailRow[] = [];
  let previousEventPointIndex: number | null = null;
  let eventIndex = 0;

  while (eventIndex < sortedEvents.length) {
    const pointIndex = eventPointIndex(sortedEvents[eventIndex]!)!;
    if (
      (previousEventPointIndex === null && pointIndex > 0)
      || (previousEventPointIndex !== null && pointIndex - previousEventPointIndex > 1)
    ) {
      const startIndex = previousEventPointIndex ?? 0;
      rows.push(unchangedRow(coverage, points.slice(startIndex, pointIndex + 1)));
    }

    while (
      eventIndex < sortedEvents.length
      && eventPointIndex(sortedEvents[eventIndex]!) === pointIndex
    ) {
      rows.push(changeRow(sortedEvents[eventIndex]!, outfitAvailabilityByEventId));
      eventIndex += 1;
    }
    previousEventPointIndex = pointIndex;
  }

  if (previousEventPointIndex !== null && previousEventPointIndex < points.length - 1) {
    rows.push(unchangedRow(coverage, points.slice(previousEventPointIndex)));
  }

  return rows;
}

/**
 * @deprecated Hour-only row shape for the current PlanChangeRail. Plan 01-06
 * owns its atomic migration to PlanningRailRow.
 */
export type RailRow =
  | { type: 'collapsed'; untilLabel: string }
  | { type: 'change'; event: ChangeEvent };

function hhmm(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

/**
 * @deprecated Behavior-frozen adapter for the current UkeScreen and
 * PlanChangeRail. New planning code must use buildPlanningRailRows.
 */
export function buildRailRows(
  startHour: number,
  endHour: number,
  events: readonly ChangeEvent[],
): RailRow[] {
  if (events.length === 0) {
    return [{ type: 'collapsed', untilLabel: 'hele dagen' }];
  }
  const rows: RailRow[] = [];
  if (events[0].hour > startHour) {
    rows.push({ type: 'collapsed', untilLabel: hhmm(events[0].hour) });
  }
  events.forEach((event, index) => {
    rows.push({ type: 'change', event });
    const next = events[index + 1];
    if (next) {
      rows.push({ type: 'collapsed', untilLabel: hhmm(next.hour) });
    } else if (event.hour < endHour) {
      rows.push({ type: 'collapsed', untilLabel: 'resten av dagen' });
    }
  });
  return rows;
}
