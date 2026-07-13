/**
 * Filtrer time-arrays til barnets våkne periode (default 06:00-20:00 lokaltid).
 * Slutten kl 20 dekker bedtime-sjekk; tips og chips bruker samme vindu.
 * Trip-modus (lange dagsturer, hytte, ski) bør sende ufiltrerte data —
 * filteret er kun for dagligbruk hvor natt-data er irrelevant.
 */

export const WAKING_HOURS = { start: 6, end: 20 } as const;

export type WakingWindow = { start: number; end: number };

export function filterWakingHours<T extends { time: Date }>(
  items: T[],
  window: WakingWindow = WAKING_HOURS,
): T[] {
  return items.filter((item) => {
    const h = item.time.getHours();
    return h >= window.start && h <= window.end;
  });
}
