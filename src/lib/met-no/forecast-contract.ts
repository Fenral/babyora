import type { MetForecast } from './types.js';
import { parseStrictIsoInstant } from './types.js';

const CONSUMED_UNIT_CONTRACT = {
  air_temperature: 'celsius',
  precipitation_amount: 'mm',
  wind_speed: 'm/s',
  wind_from_direction: 'degrees',
  relative_humidity: '%',
  cloud_area_fraction: '%',
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value >= min
    && value <= max;
}

function hasExactConsumedUnits(value: unknown): boolean {
  if (!isRecord(value)) return false;
  return Object.entries(CONSUMED_UNIT_CONTRACT)
    .every(([field, unit]) => value[field] === unit);
}

function isForecastPeriod(value: unknown): boolean {
  if (!isRecord(value) || !isRecord(value.summary) || !isRecord(value.details)) return false;
  return typeof value.summary.symbol_code === 'string'
    && value.summary.symbol_code.length > 0
    && isInRange(value.details.precipitation_amount, 0, 500);
}

function isTimePoint(value: unknown): boolean {
  if (!isRecord(value) || parseStrictIsoInstant(value.time) === null || !isRecord(value.data)) {
    return false;
  }
  const instant = value.data.instant;
  if (!isRecord(instant) || !isRecord(instant.details)) return false;
  const details = instant.details;
  if (
    !isInRange(details.air_temperature, -80, 60)
    || !isInRange(details.wind_speed, 0, 100)
    || !isInRange(details.wind_from_direction, 0, 360)
    || !isInRange(details.relative_humidity, 0, 100)
    || !isInRange(details.cloud_area_fraction, 0, 100)
  ) return false;

  const next1 = value.data.next_1_hours;
  const next6 = value.data.next_6_hours;
  return (next1 === undefined || isForecastPeriod(next1))
    && (next6 === undefined || isForecastPeriod(next6));
}

/** Server-safe parser boundary. It intentionally has no browser/env imports. */
export function isSafeMetForecastPayload(value: unknown): value is MetForecast {
  if (!isRecord(value) || !isRecord(value.properties)) return false;
  const { meta, timeseries } = value.properties;
  if (!isRecord(meta) || !isRecord(meta.units) || !Array.isArray(timeseries) || timeseries.length === 0) {
    return false;
  }
  if (!hasExactConsumedUnits(meta.units)) return false;

  let previousEpoch = Number.NEGATIVE_INFINITY;
  for (const point of timeseries) {
    if (!isTimePoint(point)) return false;
    const epoch = parseStrictIsoInstant((point as Record<string, unknown>).time);
    if (epoch === null || epoch <= previousEpoch) return false;
    previousEpoch = epoch;
  }
  return true;
}
