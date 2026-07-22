import type { ForecastFetchMetadata } from '../met-no/types.js';

export const FORECAST_TIME_ZONE = 'Europe/Oslo' as const;

export type ForecastCoverageStatus =
  | 'complete-hourly'
  | 'sampled'
  | 'gapped'
  | 'stale'
  | 'unavailable';

export type ForecastCoveragePoint = Readonly<{
  iso: string;
  epochMs: number;
  localDate: string;
  localTime: string;
}>;

export type ForecastCoverage = Readonly<{
  status: ForecastCoverageStatus;
  timeZone: typeof FORECAST_TIME_ZONE;
  points: readonly ForecastCoveragePoint[];
  startIso: string | null;
  endIso: string | null;
}>;

const HOUR_MS = 60 * 60 * 1000;
const ABSOLUTE_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: FORECAST_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const timeFormatter = new Intl.DateTimeFormat('nb-NO', {
  timeZone: FORECAST_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function isAbsoluteIso(value: unknown): value is string {
  return typeof value === 'string' && ABSOLUTE_ISO.test(value) && Number.isFinite(Date.parse(value));
}

function localDate(epochMs: number): string {
  const parts = dateFormatter.formatToParts(epochMs);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function localTime(epochMs: number): string {
  return timeFormatter.format(epochMs).replace('.', ':');
}

function unavailable(points: readonly ForecastCoveragePoint[] = []): ForecastCoverage {
  return {
    status: 'unavailable',
    timeZone: FORECAST_TIME_ZONE,
    points,
    startIso: points[0]?.iso ?? null,
    endIso: points.at(-1)?.iso ?? null,
  };
}

function hasValidMetadata(metadata: ForecastFetchMetadata | null | undefined): metadata is ForecastFetchMetadata {
  if (!metadata || !Number.isFinite(metadata.fetchedAt) || !isAbsoluteIso(metadata.sourceUpdatedAt)) return false;
  if (metadata.source === 'network') return metadata.cacheStatus === 'miss' && metadata.stale === false;
  if (metadata.source !== 'cache') return false;
  return (metadata.cacheStatus === 'fresh' && metadata.stale === false)
    || (metadata.cacheStatus === 'stale' && metadata.stale === true);
}

export function assessForecastCoverage(
  isoPoints: readonly string[],
  metadata: ForecastFetchMetadata | null | undefined,
): ForecastCoverage {
  if (!hasValidMetadata(metadata) || isoPoints.length === 0 || !isoPoints.every(isAbsoluteIso)) {
    return unavailable();
  }

  const sorted = isoPoints
    .map((iso) => ({ iso, epochMs: Date.parse(iso) }))
    .sort((a, b) => a.epochMs - b.epochMs);
  if (new Set(sorted.map((point) => point.epochMs)).size !== sorted.length) return unavailable();

  const points = sorted.map((point): ForecastCoveragePoint => ({
    ...point,
    localDate: localDate(point.epochMs),
    localTime: localTime(point.epochMs),
  }));
  const base = {
    timeZone: FORECAST_TIME_ZONE,
    points,
    startIso: points[0]?.iso ?? null,
    endIso: points.at(-1)?.iso ?? null,
  };

  if (metadata.stale) return { ...base, status: 'stale' };
  if (points.length < 2) return { ...base, status: 'sampled' };

  const intervals = points.slice(1).map((point, index) => point.epochMs - points[index]!.epochMs);
  if (intervals.every((interval) => interval === HOUR_MS)) {
    return { ...base, status: 'complete-hourly' };
  }
  const cadence = intervals[0];
  if (
    cadence !== undefined
    && cadence > HOUR_MS
    && cadence % HOUR_MS === 0
    && intervals.every((interval) => interval === cadence)
  ) {
    return { ...base, status: 'sampled' };
  }
  return { ...base, status: 'gapped' };
}

export function formatCoverageCopy(coverage: ForecastCoverage): string {
  if (coverage.status === 'complete-hourly') {
    const first = coverage.points[0];
    const last = coverage.points.at(-1);
    if (first?.localTime === '00:00' && last?.localTime === '23:00' && first.localDate === last.localDate) {
      return 'Samme antrekk ut dagen';
    }
    if (last) return `Samme antrekk til kl. ${last.localTime}`;
  }
  if (coverage.status === 'sampled') return 'Samme antrekk i de vurderte tidspunktene';
  return 'Planen viser bare tidspunktene Babyora har vÃ¦rdata for.';
}
