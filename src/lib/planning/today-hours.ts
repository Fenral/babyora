import type { WeatherHourly } from '../met-no/types.js';

const DAYTIME_CHECKPOINTS = Object.freeze([6, 10, 14, 18]);
const EVENING_START_HOUR = 18;
const EVENING_WINDOW_POINTS = 4;
const HOUR_MS = 60 * 60 * 1000;

function localDate(time: Date, timeZone: string): string {
  return time.toLocaleDateString('en-CA', { timeZone });
}

function localHour(time: Date, timeZone: string): number | null {
  const rendered = time.toLocaleTimeString('en-GB', {
    timeZone,
    hour: '2-digit',
    hourCycle: 'h23',
  });
  const hour = Number(rendered);
  return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : null;
}

function uniquePoints(points: readonly WeatherHourly[]): readonly WeatherHourly[] {
  const seen = new Set<number>();
  return points.filter((point) => {
    const epoch = point.time.getTime();
    if (!Number.isFinite(epoch) || seen.has(epoch)) return false;
    seen.add(epoch);
    return true;
  });
}

/**
 * Time-for-time should describe the part of the day that is still actionable.
 * Before the evening it preserves the familiar four daily checkpoints. From
 * 18:00 it switches to the current and upcoming hourly forecast points,
 * crossing midnight if needed so the planner never manufactures duplicates.
 */
export function selectTodayPlanningHours(
  hourly: readonly WeatherHourly[],
  evaluatedAtEpoch: number,
  timeZone: string,
): readonly WeatherHourly[] {
  if (!Number.isFinite(evaluatedAtEpoch)) return Object.freeze([]);
  const evaluatedAt = new Date(evaluatedAtEpoch);
  if (Number.isNaN(evaluatedAt.getTime())) return Object.freeze([]);

  const sorted = uniquePoints(hourly)
    .filter((point) => !Number.isNaN(point.time.getTime()))
    .slice()
    .sort((left, right) => left.time.getTime() - right.time.getTime());
  const hour = localHour(evaluatedAt, timeZone);
  if (hour === null) return Object.freeze([]);

  if (hour < EVENING_START_HOUR) {
    const date = localDate(evaluatedAt, timeZone);
    const today = sorted.filter((point) => localDate(point.time, timeZone) === date);
    const selected = DAYTIME_CHECKPOINTS.flatMap((checkpoint) => {
      const closest = today
        .slice()
        .sort((left, right) => (
          Math.abs((localHour(left.time, timeZone) ?? 99) - checkpoint)
          - Math.abs((localHour(right.time, timeZone) ?? 99) - checkpoint)
        ))[0];
      return closest ? [closest] : [];
    });
    return Object.freeze(uniquePoints(selected));
  }

  const hourStart = Math.floor(evaluatedAtEpoch / HOUR_MS) * HOUR_MS;
  return Object.freeze(
    sorted
      .filter((point) => point.time.getTime() >= hourStart)
      .slice(0, EVENING_WINDOW_POINTS),
  );
}
