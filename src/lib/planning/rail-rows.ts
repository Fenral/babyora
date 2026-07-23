import { parseStrictIsoInstant } from '../met-no/types.js';
import type { ForecastCoverage, ForecastCoveragePoint } from './coverage.js';
import type { ChangeEvent, PlanningChangeEvent } from './change-events.js';

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
    hasOutfit: outfitAvailabilityByEventId[event.id] === true,
  };
}

function eventContent(event: PlanningChangeEvent): string {
  return JSON.stringify([
    event.atIso,
    event.kind,
    [...event.addedGarments],
    [...event.removedGarments],
    event.cause,
    event.transitionContextId,
    event.transition ?? null,
  ]);
}

export function buildPlanningRailRows(
  coverage: ForecastCoverage,
  events: readonly PlanningChangeEvent[],
  outfitAvailabilityByEventId: Readonly<Record<string, boolean>> = {},
  evaluatedPointIsos: readonly string[] = [],
): PlanningRailRow[] {
  if (coverage.status === 'unavailable') return [];
  const coveredPoints = canonicalPoints(coverage);
  const evaluatedEpochs = new Set(
    evaluatedPointIsos
      .map(parseStrictIsoInstant)
      .filter((epochMs): epochMs is number => epochMs !== null),
  );
  const points = coveredPoints.filter((point) => evaluatedEpochs.has(point.epochMs));
  if (points.length < 2) return [];

  const eventContentById = new Map<string, string>();
  for (const event of events) {
    const content = eventContent(event);
    const priorContent = eventContentById.get(event.id);
    if (priorContent !== undefined && priorContent !== content) return [];
    eventContentById.set(event.id, content);
  }

  const pointIndexByEpoch = new Map(points.map((point, index) => [point.epochMs, index]));
  const eventPointIndex = (event: PlanningChangeEvent): number | undefined => {
    const epochMs = parseStrictIsoInstant(event.atIso);
    return epochMs === null ? undefined : pointIndexByEpoch.get(epochMs);
  };
  const sortedEvents = [...events]
    .filter((event) => eventPointIndex(event) !== undefined)
    .sort((a, b) => {
      const indexDelta = eventPointIndex(a)! - eventPointIndex(b)!;
      if (indexDelta !== 0) return indexDelta;
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
