/**
 * Motor 2.0 Task 13 — barneprofil-typer og lagringsparser (design-spec §14).
 *
 * Flyttet ut av children-store slik at ikke-komponent-logikk bor i egen fil
 * (react-refresh) og slik at parseren kan testes rent. Lagringsnøkkelen
 * (`babyora:children:v2`) BUMPES IKKE og onboarding tvinges aldri:
 * manglende/ukjent materialpreferanse migreres til 'best_for_conditions'
 * uten å forkaste resten av profilen.
 */

import type { MaterialPreference } from '../lib/clothing-engine-v2/types.js';

export type ChildProfile = {
  id: string;
  name: string;
  /** Fødselsdato (ISO YYYY-MM-DD). */
  dob: string;
  city: string;
  lat: number;
  lon: number;
  color: string;
  avatarKey?: string;
  canRoll?: 'yes' | 'no' | 'unknown';
  /** Motor 2.0: gratis per-barn-innstilling. Default best_for_conditions. */
  materialPreference: MaterialPreference;
};

const MATERIAL_PREFERENCES: readonly MaterialPreference[] = [
  'best_for_conditions',
  'prefer_wool',
  'avoid_wool',
];

export const MAX_SUPPORTED_CHILD_AGE_MONTHS = 24;

export type ChildDobValidation =
  | { readonly status: 'supported'; readonly ageMonths: number }
  | { readonly status: 'unsupported-age'; readonly ageMonths: number }
  | { readonly status: 'future' }
  | { readonly status: 'invalid' };

function isBoundedText(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength;
}

function isCoordinate(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function hasValidPersistentFields(obj: Record<string, unknown>): boolean {
  return isBoundedText(obj.id, 200)
    && isBoundedText(obj.name, 80)
    && isBoundedText(obj.city, 120)
    && isCoordinate(obj.lat, -90, 90)
    && isCoordinate(obj.lon, -180, 180)
    && typeof obj.color === 'string'
    && /^#[\da-f]{6}$/iu.test(obj.color);
}

/** Validate an ISO local birth date without Date's rollover or timezone coercion. */
export function validateChildDob(dob: unknown, now = new Date()): ChildDobValidation {
  if (typeof dob !== 'string') return { status: 'invalid' };

  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(dob);
  if (!match) return { status: 'invalid' };

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (
    candidate.getUTCFullYear() !== year
    || candidate.getUTCMonth() !== month - 1
    || candidate.getUTCDate() !== day
  ) {
    return { status: 'invalid' };
  }

  const today = {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    day: now.getDate(),
  };
  const dateKey = year * 10_000 + month * 100 + day;
  const todayKey = today.year * 10_000 + today.month * 100 + today.day;
  if (dateKey > todayKey) return { status: 'future' };

  const ageMonths =
    (today.year - year) * 12
    + (today.month - month)
    - (today.day < day ? 1 : 0);

  return ageMonths <= MAX_SUPPORTED_CHILD_AGE_MONTHS
    ? { status: 'supported', ageMonths }
    : { status: 'unsupported-age', ageMonths };
}

/**
 * Parse én lagret barne-oppføring tolerant. Returnerer null kun når det gamle
 * kjerneskjemaet (id/name/dob) ikke kan leses. Streng validering av nye og
 * endrede profiler skjer separat, slik at en senere kontrakt ikke sletter
 * eksisterende lokaldata ved hydration.
 */
export function parseStoredChild(raw: unknown, _now = new Date()): ChildProfile | null {
  if (raw === null || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.id !== 'string' || obj.id.length === 0) return null;
  if (typeof obj.name !== 'string') return null;

  if (typeof obj.dob !== 'string') return null;

  const stored = obj.materialPreference;
  const materialPreference: MaterialPreference =
    typeof stored === 'string' && (MATERIAL_PREFERENCES as readonly string[]).includes(stored)
      ? (stored as MaterialPreference)
      : 'best_for_conditions';

  const parsed = { ...(obj as object), materialPreference } as ChildProfile;
  if (parsed.avatarKey !== undefined && typeof parsed.avatarKey !== 'string') delete parsed.avatarKey;
  if (parsed.canRoll !== undefined && !['yes', 'no', 'unknown'].includes(parsed.canRoll)) delete parsed.canRoll;
  return parsed;
}

/** Parse hele den lagrede listen; ugyldige oppføringer filtreres stille. */
export function parseStoredChildren(raw: unknown, now = new Date()): ChildProfile[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((child) => parseStoredChild(child, now))
    .filter((c): c is ChildProfile => c !== null);
}

/** Validate a newly created profile before it can enter durable state. */
export function prepareChildForPersistence(raw: unknown, now = new Date()): ChildProfile | null {
  if (raw === null || typeof raw !== 'object') return null;
  if (!hasValidPersistentFields(raw as Record<string, unknown>)) return null;
  const parsed = parseStoredChild(raw, now);
  if (!parsed) return null;
  return validateChildDob(parsed.dob, now).status === 'supported' ? parsed : null;
}

/**
 * Validate an edit without deleting an already stored older profile. Its
 * existing birth date may remain, but a supported profile cannot be changed
 * into an unsupported one.
 */
export function prepareChildUpdate(
  current: unknown,
  patch: object,
  now = new Date(),
): ChildProfile | null {
  const existing = parseStoredChild(current, now);
  if (!existing) return null;

  const candidate = { ...existing, ...patch, id: existing.id };
  if (!hasValidPersistentFields(candidate as Record<string, unknown>)) return null;
  const updated = parseStoredChild(candidate, now);
  if (!updated) return null;

  const updatedDob = validateChildDob(updated.dob, now);
  if (updatedDob.status === 'invalid' || updatedDob.status === 'future') return null;
  if (updatedDob.status === 'unsupported-age' && updated.dob !== existing.dob) return null;
  return updated;
}
