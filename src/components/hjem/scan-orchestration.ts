/**
 * scan-orchestration — rene beslutningsfunksjoner som kobler lib/scan sin
 * tilstandsmaskin (P3, uendret) til Monter-UI-et (P4).
 *
 * Ingen React, ingen DOM, ingen timere her — alt er rene funksjoner av
 * eksplisitte input, testbare uten jsdom (samme stil som lib/scan/*.test.ts
 * og lib/outfit-transition/*.test.ts allerede bruker i denne kodebasen).
 * HjemMonter.tsx står for selve kablingen (useEffect + setTimeout).
 *
 * P9 (docs/design-notes/sol-duel-2026-07-31.md §2 — "Scan-koreografi v2"):
 * erstatter P3s per-dag 2,1s-koreografi med "første gang noensinne" (1,1s,
 * scan-cache-store sin nye `hasPlayedFullScanEver`-flagg) + et 400ms
 * mikropass for alle senere trykk. Haptikk-TIDSPUNKTENE (§3) er ren data
 * her også — selve dispatchen (kall mot lib/haptics.ts) hører hjemme i
 * HjemMonter.tsx, samme arbeidsdeling som timer-varighetene over.
 */
import type { ScanCacheSlot, ScanStaleReason } from '../../lib/scan/types.js';
import { shouldPlayFullScan } from '../../state/scan-cache-store.js';

/**
 * Første scan NOENSINNE (ikke per dag — duel §2 supersederer P3s
 * 2,1s/dag-variant): full koreografi, 1,1s, separate avhukinger.
 */
export const FULL_SCAN_DURATION_MS = 1100;
/**
 * Sjekk-poppene sine forsinkelser, som andel av total varighet. Ingen egen
 * 1,1s-mock finnes (duellen spesifiserer kun totalvarigheten + "separate
 * avhukinger") — de proporsjonale forholdstallene fra P3s 2,1s-mock
 * (0.55s/1.05s/1.55s av 2.1s) beholdes uendret og skaleres ned via
 * `scanCheckDelaysMs`, slik at avhukingene fortsatt er jevnt fordelt
 * gjennom hele sekvensen.
 */
export const FULL_SCAN_CHECK_DELAY_RATIOS = Object.freeze([
  0.55 / 2.1,
  1.05 / 2.1,
  1.55 / 2.1,
] as const);

/**
 * Aktivitets-toggle → auto-rekalkulering: kort, «normal transition»
 * (DESIGN.md: «Normal transitions should complete in 150 to 250 ms»).
 * UBERØRT av duel §2 (som kun gjelder CTA-trykkets scan/mikropass) — ingen
 * egen mock finnes for denne, samme visuelle koreografi som full scan, bare
 * komprimert, så formen (ikke varigheten) er identisk. Ingen haptikk her
 * (§3-tabellen sin "Aktivitet byttes"-rad er allerede dekket separat, ved
 * selve toggle-trykket i HjemScreen.tsx — ikke ved denne rekalkuleringen).
 */
export const QUICK_RECALC_DURATION_MS = 220;

/**
 * P9 duel §2: 400ms mikropass — spilles ved ETHVERT trykk på «Finn dagens
 * antrekk» ETTER at `hasPlayedFullScanEver` er sann. Eksakte millisekund-
 * grenser fra spesifikasjonen (ikke proporsjonale/avledet som full-scan-
 * ratioene over — duellen oppgir disse som faste tall).
 */
export const MICROPASS_DURATION_MS = 400;
/** 0–70ms: CTA presset tilstand (skala 0.985, redusert skygge). Ingen haptikk. */
export const MICROPASS_PRESS_MS = 70;
/** 70–270ms: tillitslinjens tre ledd går sekundær→primær ved disse tidspunktene. */
export const MICROPASS_SEGMENT_DELAYS_MS = Object.freeze([110, 175, 240] as const);
/** 270–400ms: leddene komprimeres til værsammendraget. */
export const MICROPASS_SUMMARY_START_MS = 270;
/** `prepare()` varmer opp haptikk-motoren før landingen. */
export const MICROPASS_PREPARE_MS = 280;
/** ÉN medium resultatlanding. */
export const MICROPASS_LANDING_MS = 390;

export function scanCheckDelaysMs(totalDurationMs: number): readonly [number, number, number] {
  const [a, b, c] = FULL_SCAN_CHECK_DELAY_RATIOS;
  return [
    Math.round(totalDurationMs * a),
    Math.round(totalDurationMs * b),
    Math.round(totalDurationMs * c),
  ];
}

/**
 * P9 duel §3 — haptikk-vokabularet er ren tidsplan-DATA her; selve
 * dispatchen (lib/haptics.ts-kallene) skjer i HjemMonter.tsx sine
 * setTimeout-håndtak, samme arbeidsdeling som timer-varighetene over.
 * `prepare` teller ikke som et "følt" signal (stillegående oppvarming av
 * native-motoren) — kun soft/selection/medium er faktiske haptiske pulser.
 */
export type ScanHapticCue = 'soft' | 'selection' | 'prepare' | 'medium';
export type ScanHapticEvent = Readonly<{ atMs: number; cue: ScanHapticCue }>;

/**
 * Førstegangs-sekvensen (full 1,1s-koreografi): myk puls ved start, ett
 * selection-tick per avhuket delstatus (Vær/Sted/Aktivitet — de tre
 * `rows`-radene i ScanOverlay), `prepare()` ~110ms før landingen, og ÉN
 * medium landing ved slutt. 5 følte signaler totalt (duellens "opptil 5"-tak).
 */
export function fullScanHapticSchedule(totalDurationMs: number): readonly ScanHapticEvent[] {
  const [a, b, c] = scanCheckDelaysMs(totalDurationMs);
  const prepareAtMs = Math.max(0, totalDurationMs - 110);
  return Object.freeze([
    { atMs: 0, cue: 'soft' },
    { atMs: a, cue: 'selection' },
    { atMs: b, cue: 'selection' },
    { atMs: c, cue: 'selection' },
    { atMs: prepareAtMs, cue: 'prepare' },
    { atMs: totalDurationMs, cue: 'medium' },
  ] as const);
}

/**
 * Mikropasset (alle trykk etter det aller første): NULL haptiske ticks
 * underveis — kun ÉN medium landing, `prepare()`d ~110ms i forveien (280ms
 * → 390ms, jf. duellens eksakte tidspunkter).
 */
export function micropassHapticSchedule(): readonly ScanHapticEvent[] {
  return Object.freeze([
    { atMs: MICROPASS_PREPARE_MS, cue: 'prepare' },
    { atMs: MICROPASS_LANDING_MS, cue: 'medium' },
  ] as const);
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
 *    varigheten NÅR brukeren trykker: full koreografi (1,1s) kun hvis
 *    `shouldPlayFullScan` (duel §2: livstids-grense, IKKE lenger en
 *    dags-grense) sier at brukeren aldri har sett den før; ellers 400ms
 *    mikropass.
 */
export function decideScanEntry(
  exactSlot: ScanCacheSlot | null,
  hasPlayedFullScanEver: boolean,
): HjemMonterScanEntry {
  if (exactSlot !== null) {
    return { kind: 'show-cached', resultKey: exactSlot.resultKey };
  }
  return { kind: 'await-tap', playFull: shouldPlayFullScan(hasPlayedFullScanEver) };
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
