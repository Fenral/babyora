/**
 * care-circle-model — ren, React-fri modell for omsorgssirkelen (R7 Task 7).
 *
 * Omsorgssirkelen er en R9-funksjon (familiedeling krever auth/RLS/backend) og
 * vises kun som dev-only forhåndsvisning med statiske data. Denne modulen holder
 * den rene utledningen (synlige tokens + overflow) slik at den kan testes uten
 * jsdom. Den sier ALDRI noe om live tilstedeværelse eller posisjon — kun rolle
 * og invitasjonsstatus.
 */

export type CaregiverStatus = 'active' | 'pending';

export interface Caregiver {
  id: string;
  /** Visningsnavn (fornavn holder). */
  name: string;
  /** Relasjon/rolle, f.eks. «Mor», «Far», «Besteforelder». */
  role: string;
  /** active = har akseptert · pending = invitasjon ikke besvart. Aldri «online». */
  status: CaregiverStatus;
}

export interface CareCircleSummary {
  /** De første `maxTokens` omsorgspersonene som får en synlig token. */
  visible: Caregiver[];
  /** Antall utover `maxTokens` — vises som «+N»-token. */
  overflowCount: number;
  /** Totalt antall omsorgspersoner. */
  total: number;
}

/** Antall tokens som vises rundt barnet før resten samles i «+N». */
export const CARE_CIRCLE_MAX_TOKENS = 4;

/**
 * Utleder de synlige tokenene og overflow-antallet. Ren funksjon — ingen
 * mutasjon, ingen sideeffekter.
 */
export function summarizeCareCircle(
  caregivers: readonly Caregiver[],
  maxTokens: number = CARE_CIRCLE_MAX_TOKENS,
): CareCircleSummary {
  const cap = Math.max(0, maxTokens);
  return {
    visible: caregivers.slice(0, cap),
    overflowCount: Math.max(0, caregivers.length - cap),
    total: caregivers.length,
  };
}

/** Initialer for token-visning (aldri tomt for et ikke-tomt navn). */
export function caregiverInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '·';
  return trimmed.charAt(0).toUpperCase();
}

/** Tilgjengelig statustekst — rolle + invitasjonsstatus, aldri tilstedeværelse. */
export function caregiverStatusLabel(status: CaregiverStatus): string {
  return status === 'active' ? 'Deler' : 'Venter på svar';
}
