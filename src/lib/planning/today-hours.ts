import type { WeatherHourly } from '../met-no/types.js';

const DAYTIME_CHECKPOINTS = Object.freeze([6, 10, 14, 18]);
const EVENING_START_HOUR = 18;
const EVENING_WINDOW_POINTS = 4;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function localDate(time: Date, timeZone: string): string | null {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(time);
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;
    return year && month && day ? `${year}-${month}-${day}` : null;
  } catch {
    return null;
  }
}

function localHour(time: Date, timeZone: string): number | null {
  try {
    const rendered = time.toLocaleTimeString('en-GB', {
      timeZone,
      hour: '2-digit',
      hourCycle: 'h23',
    });
    const hour = Number(rendered);
    return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : null;
  } catch {
    return null;
  }
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

function sortedUniquePoints(hourly: readonly WeatherHourly[]): readonly WeatherHourly[] {
  return uniquePoints(hourly)
    .filter((point) => !Number.isNaN(point.time.getTime()))
    .slice()
    .sort((left, right) => left.time.getTime() - right.time.getTime());
}

function selectDailyCheckpoints(
  hourly: readonly WeatherHourly[],
  targetLocalDate: string,
  timeZone: string,
): readonly WeatherHourly[] {
  const targetDay = hourly.filter((point) => localDate(point.time, timeZone) === targetLocalDate);
  const selected = DAYTIME_CHECKPOINTS.flatMap((checkpoint) => {
    const closest = targetDay
      .slice()
      .sort((left, right) => {
        const hourDelta = Math.abs((localHour(left.time, timeZone) ?? 99) - checkpoint)
          - Math.abs((localHour(right.time, timeZone) ?? 99) - checkpoint);
        return hourDelta || left.time.getTime() - right.time.getTime();
      })[0];
    return closest ? [closest] : [];
  });
  return Object.freeze(uniquePoints(selected));
}

function nextCalendarDate(localIsoDate: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(localIsoDate);
  if (!match) return null;
  const epoch = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])) + DAY_MS;
  return Number.isFinite(epoch) ? new Date(epoch).toISOString().slice(0, 10) : null;
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

  const sorted = sortedUniquePoints(hourly);
  const hour = localHour(evaluatedAt, timeZone);
  if (hour === null) return Object.freeze([]);

  if (hour < EVENING_START_HOUR) {
    const date = localDate(evaluatedAt, timeZone);
    return date ? selectDailyCheckpoints(sorted, date, timeZone) : Object.freeze([]);
  }

  const hourStart = Math.floor(evaluatedAtEpoch / HOUR_MS) * HOUR_MS;
  return Object.freeze(
    sorted
      .filter((point) => point.time.getTime() >= hourStart)
      .slice(0, EVENING_WINDOW_POINTS),
  );
}

/**
 * Morgendagen er neste lokale kalenderdato, ikke «nå + 24 timer». Det gjør
 * utvalget stabilt gjennom begge DST-skiftene og hindrer at et hull i
 * værdataene feilaktig hopper videre til dagen etter i morgen.
 */
export function selectTomorrowPlanningHours(
  hourly: readonly WeatherHourly[],
  evaluatedAtEpoch: number,
  timeZone: string,
): readonly WeatherHourly[] {
  if (!Number.isFinite(evaluatedAtEpoch)) return Object.freeze([]);
  const evaluatedAt = new Date(evaluatedAtEpoch);
  if (Number.isNaN(evaluatedAt.getTime())) return Object.freeze([]);
  const today = localDate(evaluatedAt, timeZone);
  const tomorrow = today ? nextCalendarDate(today) : null;
  return tomorrow
    ? selectDailyCheckpoints(sortedUniquePoints(hourly), tomorrow, timeZone)
    : Object.freeze([]);
}
