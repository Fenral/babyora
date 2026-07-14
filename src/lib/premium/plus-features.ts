/**
 * plus-features — hvilke Plus-kapabiliteter som faktisk er LEVERBARE nå (R7 Task 7).
 *
 * Paywallen skal aldri love en funksjon som ikke finnes. Familiedeling krever
 * auth/RLS/backend (R9) og personlig kalibrering er en senere fase — begge er
 * IKKE bygget, så deres flagg er false og verdi-seksjonen viser dem ikke.
 * Når funksjonene lander flippes flagget til true (og en test fanger regresjon).
 *
 * Rammen speiler engine-v2 feature-flags.ts: frosne lokale konstanter, ingen
 * skjuling av manglende funksjonalitet bak markedsføring.
 */

export interface PlusFeatureAvailability {
  /** 10-dagers plan / «i morgen» — bygget (UkeScreen ten-day). */
  future_plan: boolean;
  /** Automatisk/valgt sted — bygget (auto-posisjon i Innstillinger). */
  automatic_location: boolean;
  /** Flere barn — bygget (barn 2+-gating). */
  extra_children: boolean;
  /** Familiedeling / omsorgssirkel — R9 (auth/RLS/backend), IKKE bygget. */
  family_sharing: boolean;
  /** Personlig kalibrering — senere fase, IKKE bygget. */
  personal_calibration: boolean;
}

export const PLUS_FEATURE_AVAILABILITY: Readonly<PlusFeatureAvailability> = Object.freeze({
  future_plan: true,
  automatic_location: true,
  extra_children: true,
  family_sharing: false,
  personal_calibration: false,
});

export interface PlusExpansion {
  key: keyof PlusFeatureAvailability;
  /** Gratis-tilstand (venstre side av ekspansjonen). */
  from: string;
  /** Plus-tilstand (høyre side). */
  to: string;
}

// Fast rekkefølge = «Fremover, overalt og sammen» + kalibrering til slutt.
const ALL_EXPANSIONS: readonly PlusExpansion[] = [
  { key: 'future_plan', from: 'I dag', to: '10 dager fremover' },
  { key: 'automatic_location', from: 'Ett fast sted', to: 'Der dere er' },
  { key: 'extra_children', from: 'Ett barn', to: 'Alle barna' },
  { key: 'family_sharing', from: 'Deg alene', to: 'Alle som passer' },
  { key: 'personal_calibration', from: 'Standardråd', to: 'Kalibrert til barnet' },
];

/**
 * Ekspansjonene som faktisk kan vises — kun de hvis tilgjengelighetsflagg er
 * på. Ren funksjon; familie/kalibrering utelates så lenge flagget er false.
 */
export function availablePlusExpansions(
  flags: PlusFeatureAvailability = PLUS_FEATURE_AVAILABILITY,
): PlusExpansion[] {
  return ALL_EXPANSIONS.filter((e) => flags[e.key]);
}
