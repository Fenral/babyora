export type SnartDateWindow = { status: 'available'; dates: readonly string[]; startLocalDate: string; endLocalDate: string } | { status: 'unavailable'; reason: 'invalid_date' | 'invalid_timezone' };

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();
const parse = (value: string): [number, number, number] | null => {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number) as [number, number, number];
  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month) ? [year, month, day] : null;
};
const format = (year: number, month: number, day: number) => `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
const addDays = (date: [number, number, number], count: number) => {
  let [year, month, day] = date;
  for (let remaining = count; remaining > 0; remaining -= 1) {
    day += 1;
    if (day > daysInMonth(year, month)) { day = 1; month += 1; if (month === 13) { month = 1; year += 1; } }
  }
  return [year, month, day] as [number, number, number];
};

export function buildSnartDateWindow(asOfLocalDate: string, timezone: string): SnartDateWindow {
  if (timezone !== 'Europe/Oslo') return { status: 'unavailable', reason: 'invalid_timezone' };
  const date = parse(asOfLocalDate);
  if (!date) return { status: 'unavailable', reason: 'invalid_date' };
  const dates = Array.from({ length: 15 }, (_, index) => format(...addDays(date, index + 28)));
  return { status: 'available', dates, startLocalDate: dates[0], endLocalDate: dates[14] };
}

export function isAgeEligibleForWholeWindow(birthLocalDate: string, targetEndLocalDate: string): boolean {
  const birth = parse(birthLocalDate); const end = parse(targetEndLocalDate);
  if (!birth || !end) return false;
  let [year, month, day] = birth; month += 25;
  year += Math.floor((month - 1) / 12); month = ((month - 1) % 12) + 1; day = Math.min(day, daysInMonth(year, month));
  return targetEndLocalDate < format(year, month, day);
}
