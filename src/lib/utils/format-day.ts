/**
 * Format en dato på nb-NO. "I dag", "I morgen", eller "Mandag 3. juni".
 */

const WEEKDAYS = [
  'Søndag',
  'Mandag',
  'Tirsdag',
  'Onsdag',
  'Torsdag',
  'Fredag',
  'Lørdag',
] as const;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatDay(date: Date): string {
  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const target = startOfDay(date);

  if (target.getTime() === today.getTime()) return 'I dag';
  if (target.getTime() === tomorrow.getTime()) return 'I morgen';

  const weekday = WEEKDAYS[target.getDay()] ?? '';
  const dayMonth = target.toLocaleDateString('nb-NO', {
    day: 'numeric',
    month: 'long',
  });
  return `${weekday} ${dayMonth}`;
}

/** Kort variant — kun ukedag + dato-tall: "Tir 3" (for datepicker-chips). */
export function formatDayShort(date: Date): { weekday: string; day: number } {
  const weekday = ['Søn', 'Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør'][date.getDay()] ?? '';
  return { weekday, day: date.getDate() };
}

/** Antall dager mellom to datoer (inkluderende). */
export function daysBetween(from: Date, to: Date): number {
  const a = startOfDay(from).getTime();
  const b = startOfDay(to).getTime();
  return Math.round((b - a) / (1000 * 60 * 60 * 24)) + 1;
}

/** Sjekk om to datoer er samme kalenderdag. */
export function isSameDay(a: Date, b: Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}
