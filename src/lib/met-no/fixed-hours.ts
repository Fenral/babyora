/**
 * Plukk faste tider (default 08, 12, 16, 20) fra et hourly-array.
 * Returnerer punkter fra nåtid og fremover, opp til {hours.length} punkter.
 *
 * Brukseksempel:
 *   - Kl 07:30 → 08, 12, 16, 20 (alle i dag)
 *   - Kl 09:30 → 12, 16, 20 (i dag) + 08 (i morgen)
 *   - Kl 21:00 → 08, 12, 16, 20 (alle i morgen)
 */

export const FIXED_HOURS = [8, 12, 16, 20] as const;

export function pickFixedHours<T extends { time: Date }>(
  items: T[],
  hours: readonly number[] = FIXED_HOURS,
  fromTime: Date = new Date(),
): T[] {
  return items
    .filter(
      (item) => hours.includes(item.time.getHours()) && item.time >= fromTime,
    )
    .slice(0, hours.length);
}
