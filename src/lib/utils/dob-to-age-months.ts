/**
 * Konverterer fødselsdato (ISO YYYY-MM-DD eller Date) til alder i hele måneder.
 *
 * Iter 24 Steg 2: Child-type bytter fra ageMonths (manuell vedlikehold) til
 * dob (selv-oppdaterende). Alle konsumenter av ageMonths bruker denne utility.
 *
 * Max-clip ved 36 mnd (wool-layers engine støtter ikke barn over 3 år).
 * Min-clip ved 0 (nyfødt). Datoer i fremtiden gir 0.
 *
 * Returner 0 dersom dob er ugyldig (defensive).
 */
export function dobToAgeMonths(dob: string | Date | null | undefined): number {
  if (!dob) return 0;
  const birth = typeof dob === 'string' ? new Date(dob) : dob;
  if (Number.isNaN(birth.getTime())) return 0;

  const now = new Date();
  const monthsRaw =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth()) -
    (now.getDate() < birth.getDate() ? 1 : 0);

  return Math.max(0, Math.min(36, monthsRaw));
}

/**
 * Formaterer en alder i måneder til en kort lesbar streng:
 *   0 → "Under 1 måned"
 *   1 → "1 mnd"
 *   12 → "1 år"
 *   13 → "1 år 1 mnd"
 *   24+ → "X år" (måneder skjult etter 2 år for kortere lesning)
 *
 * Brukt i SettingsScreen-liste, sheet-info, ChildSwitcher.
 */
export function formatAgeMonths(months: number): string {
  if (months === 0) return 'Under 1 måned';
  if (months < 12) return `${months} mnd`;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (months >= 24 || remMonths === 0) return `${years} år`;
  return `${years} år ${remMonths} mnd`;
}

/**
 * ISO-format dato (YYYY-MM-DD) i lokal tidssone. Brukt på date-input min/max.
 */
export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
