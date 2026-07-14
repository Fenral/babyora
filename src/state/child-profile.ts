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

/**
 * Parse én lagret barne-oppføring. Returnerer null KUN når kjerneskjemaet
 * (id/name/dob) ikke kan oppfylles — aldri på grunn av ukjente tilleggsfelt
 * eller fremtidige enum-verdier (de faller tilbake til default).
 */
export function parseStoredChild(raw: unknown): ChildProfile | null {
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

  return { ...(obj as object), materialPreference } as ChildProfile;
}

/** Parse hele den lagrede listen; ugyldige oppføringer filtreres stille. */
export function parseStoredChildren(raw: unknown): ChildProfile[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(parseStoredChild)
    .filter((c): c is ChildProfile => c !== null);
}
