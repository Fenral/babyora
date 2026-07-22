import { parseStrictIsoInstant, type ForecastFetchMetadata } from '../met-no/types.js';

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
  if (!metadata || !Number.isFinite(metadata.fetchedAt) || parseStrictIsoInstant(metadata.sourceUpdatedAt) === null) return false;
  if (metadata.source === 'network') return metadata.cacheStatus === 'miss' && metadata.stale === false;
  if (metadata.source !== 'cache') return false;
  return (metadata.cacheStatus === 'fresh' && metadata.stale === false)
    || (metadata.cacheStatus === 'stale' && metadata.stale === true);
}

export function assessForecastCoverage(
  isoPoints: readonly string[],
  metadata: ForecastFetchMetadata | null | undefined,
): ForecastCoverage {
  if (!hasValidMetadata(metadata) || isoPoints.length === 0) {
    return unavailable();
  }

  const parsed = isoPoints.map((iso) => ({ iso, epochMs: parseStrictIsoInstant(iso) }));
  if (parsed.some((point) => point.epochMs === null)) return unavailable();
  const sorted = (parsed as Array<{ iso: string; epochMs: number }>)
    .sort((a, b) => a.epochMs - b.epochMs);
  if (sorted.some((point, index) => index > 0 && point.epochMs === sorted[index - 1]!.epochMs)) {
    return unavailable();
  }

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
      return 'V\u00e6rdata hver time gjennom hele dagen.';
    }
    if (last) return `V\u00e6rdata hver time til kl. ${last.localTime}.`;
  }
  if (coverage.status === 'sampled') return 'V\u00e6rdata for de vurderte tidspunktene.';
  return 'V\u00e6rdata finnes bare for enkelte tidspunkter.';
}
