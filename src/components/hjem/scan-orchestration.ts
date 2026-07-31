/**
 * scan-orchestration — rene beslutningsfunksjoner som kobler lib/scan sin
 * tilstandsmaskin (P3, uendret) til Monter-UI-et (P4).
 *
 * Ingen React, ingen DOM, ingen timere her — alt er rene funksjoner av
 * eksplisitte input, testbare uten jsdom (samme stil som lib/scan/*.test.ts
 * og lib/outfit-transition/*.test.ts allerede bruker i denne kodebasen).
 * HjemMonter.tsx står for selve kablingen (useEffect + setTimeout).
 */
import type { ScanCacheSlot, ScanIdentity, ScanStaleReason } from '../../lib/scan/types.js';
import { shouldPlayFullScan } from '../../state/scan-cache-store.js';

/** Første scan av dagen: full koreografi, 2.1s (docs/mocks/monter/hjem-states.html). */
export const FULL_SCAN_DURATION_MS = 2100;
/** Sjekk-poppene sine forsinkelser, som andel av total varighet (0.55s/1.05s/1.55s av 2.1s i mocken). */
export const FULL_SCAN_CHECK_DELAY_RATIOS = Object.freeze([
  0.55 / 2.1,
  1.05 / 2.1,
  1.55 / 2.1,
] as const);

/**
 * Aktivitets-toggle → auto-rekalkulering: kort, «normal transition»
 * (DESIGN.md: «Normal transitions should complete in 150 to 250 ms»).
 * Ingen egen mock finnes for denne — samme visuelle koreografi som full
 * scan, bare komprimert, så formen (ikke varigheten) er identisk.
 */
export const QUICK_RECALC_DURATION_MS = 220;

export function scanCheckDelaysMs(totalDurationMs: number): readonly [number, number, number] {
  const [a, b, c] = FULL_SCAN_CHECK_DELAY_RATIOS;
  return [
    Math.round(totalDurationMs * a),
    Math.round(totalDurationMs * b),
    Math.round(totalDurationMs * c),
  ];
}

export type HjemMonterScanEntry =
  | Readonly<{ kind: 'show-cached'; resultKey: string }>
  | Readonly<{ kind: 'await-tap'; playFull: boolean }>;

/**
 * Avgjør hva som skal skje idet Hjem monteres (eller identiteten blir kjent
 * for aller første gang i sesjonen):
 *
 *  - `exactSlot` (getSlotForIdentity — FULL identitets-match, inkl.
 *    aktivitet) finnes → vis cachet resultat UMIDDELBART, ingen
 *    scan-koreografi i det hele tatt («later openings use cached result
 *    immediately», DESIGN.md).
 *  - Ellers → vent på trykk på «Finn dagens antrekk». `playFull` avgjør
 *    varigheten NÅR brukeren trykker: full koreografi kun hvis
 *    `shouldPlayFullScan` (dags-grense, uavhengig av resten av identiteten)
 *    sier at barnet ikke har sett den ennå i dag.
 */
export function decideScanEntry(
  exactSlot: ScanCacheSlot | null,
  daySlotForChild: ScanCacheSlot | null,
  identity: ScanIdentity,
): HjemMonterScanEntry {
  if (exactSlot !== null) {
    return { kind: 'show-cached', resultKey: exactSlot.resultKey };
  }
  return { kind: 'await-tap', playFull: shouldPlayFullScan(daySlotForChild, identity) };
}

/** Kort form, brukt i «endret fra X til Y»-chip og stale-CTA-en. */
const LOWERCASE_ACTIVITY_LABEL: Readonly<Record<'utelek' | 'vogn', string>> = {
  utelek: 'utelek',
  vogn: 'vogn',
};

export function staleHeadline(
  reason: ScanStaleReason,
  activity: 'utelek' | 'vogn',
): string {
  if (reason === 'identity-changed') {
    return `Nytt antrekk for ${LOWERCASE_ACTIVITY_LABEL[activity]}?`;
  }
  if (reason === 'weather-basis') return 'Været har endret seg';
  return 'Fikk ikke beregnet antrekket';
}

/** Jf. arkitektur-notatet: recalc-feil skal alltid tilby «Beregn på nytt» — den
 *  kontekstuelle «Se antrekk for vogn»-kopien i mocken gjelder kun når en
 *  identitetsendring IKKE gikk via auto-rekalkulering. */
export function staleCtaLabel(
  reason: ScanStaleReason,
  activity: 'utelek' | 'vogn',
): string {
  if (reason === 'identity-changed') {
    return `Se antrekk for ${LOWERCASE_ACTIVITY_LABEL[activity]}`;
  }
  return 'Beregn på nytt';
}

export function activityChangeChip(
  fromActivity: 'utelek' | 'vogn' | null,
  toActivity: 'utelek' | 'vogn',
): string | null {
  if (fromActivity === null || fromActivity === toActivity) return null;
  return `Du byttet fra ${LOWERCASE_ACTIVITY_LABEL[fromActivity]} til ${LOWERCASE_ACTIVITY_LABEL[toActivity]}`;
}
