/**
 * scan-orchestration — rene beslutningsfunksjoner som kobler lib/scan sin
 * tilstandsmaskin (P3, uendret) til Monter-UI-et (P4).
 *
 * Ingen React, ingen DOM, ingen timere her — alt er rene funksjoner av
 * eksplisitte input, testbare uten jsdom (samme stil som lib/scan/*.test.ts
 * og lib/outfit-transition/*.test.ts allerede bruker i denne kodebasen).
 * HjemMonter.tsx (og FinnAntrekkScreen.tsx sin egen Juster-kopi) står for
 * selve kablingen (useEffect + setTimeout).
 *
 * Eier-override v3 (2026-08-01, «slik den er nå er det ingen som ser det —
 * minimum tre sekunder»): erstatter P9s «første gang noensinne 1,1s, deretter
 * 400ms mikropass»-modell (docs/design-notes/sol-duel-2026-07-31.md §2) med
 * ÉN regel — HVERT trykk på «Finn dagens antrekk» (Hjem) / «Finn antrekk»
 * («Beregn på nytt», Juster) spiller den FULLE 3,2s-koreografien, alltid.
 * Mikropasset (ScanMicropass.tsx, CalcMicropass i FinnAntrekkScreen.tsx) er
 * pensjonert og slettet. `hasPlayedFullScanEver` (scan-cache-store.ts)
 * leses ikke lenger noe sted — feltet blir stående ulest i storen med
 * vilje (ingen migrasjonsstøy), se HjemMonter.tsx sin egen kommentar.
 * Haptikk-TIDSPUNKTENE (§3) er ren data her også — selve dispatchen (kall
 * mot lib/haptics.ts) hører hjemme i kallerne, samme arbeidsdeling som
 * timer-varighetene over.
 */
import type { ScanCacheSlot, ScanStaleReason } from '../../lib/scan/types.js';

/**
 * Eier-override v3: HVERT trykk (ikke bare «første gang noensinne»)
 * spiller den fulle koreografien, nå 3,2s (opp fra P9s 1,1s) — «ingen som
 * ser det» ved kortere varigheter var eierens begrunnelse.
 */
export const FULL_SCAN_DURATION_MS = 3200;

/**
 * SCANLINJENS EGEN LENGDE — kortere enn seremonien, med vilje.
 *
 * Eierkrav: «det mangler fortsatt en liten stopp etter at analysen er ferdig.
 * La den stå i 0,5 sekund og deretter scroll.» Pausen fantes på papiret, men
 * ikke i appen: streken sveipet helt til 3200, så MÅLT var siste bevegelse
 * 3216 ms og stillstanden −16 ms. Et hold der noe fortsatt beveger seg, er
 * ikke et hold.
 *
 * Streken stopper nå på fullføringsmarkøren, og de resterende 700 ms er ekte
 * stillstand før resultatet skyves inn. Verifisert av port 6 i
 * tools/verify-hjem.mjs, som måler siste bevegelse i ETHVERT element.
 */
export const SCANLINE_DURATION_MS = 2500;

/**
 * FULLFORINGSMARKOREN. Art bible foreskriver den ved 2500 ms: siste rad far
 * hake og verdi, overskriften bytter, og maskoten retter seg opp.
 *
 * Den var aldri bygget, og det er rotarsaken bak eierens gjentatte funn
 * «det mangler fortsatt en liten stopp etter at analysen er ferdig».
 * Uten punktum er de siste 700 ms ikke et hold, men en stall: spinneren
 * roterte `hjm-spin 1s linear infinite` helt fram til resultatet.
 *
 * Samme tall som scanlinjen med vilje: streken forlater boksen NOYAKTIG
 * naar markoren lander, saa holdet etterpa er helt uten bevegelse.
 */
export const MARKER_AT_MS = SCANLINE_DURATION_MS;
/**
 * Sjekk-poppene sine forsinkelser, som andel av total varighet. Ingen egen
 * 3,2s-mock finnes — de proporsjonale forholdstallene fra P3s 2,1s-mock
 * (0.55s/1.05s/1.55s av 2.1s) beholdes uendret og skaleres opp via
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
 * UBERØRT av eier-override v3 (som kun gjelder CTA-trykkets scan) — ingen
 * egen mock finnes for denne, samme visuelle koreografi som full scan, bare
 * komprimert, så formen (ikke varigheten) er identisk. Ingen haptikk her
 * (§3-tabellen sin "Aktivitet byttes"-rad er allerede dekket separat, ved
 * selve toggle-trykket i HjemScreen.tsx — ikke ved denne rekalkuleringen).
 * Inline omberegning (aktivitets-toggle) er IKKE et CTA-trykk — eieren ba
 * spesifikt om full scan-koreografi «på hvert CTA-trykk», ikke her.
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
 * Full 3,2s-koreografi (eier-override v3 — spilles nå på HVERT trykk, ikke
 * bare «første gang noensinne»): myk puls ved start, ett selection-tick per
 * avhuket delstatus (Vær/Sted/Aktivitet — de tre `rows`-radene i
 * ScanOverlay), `prepare()` ~110ms før landingen, og ÉN medium landing ved
 * slutt. 5 følte signaler totalt (duellens "opptil 5"-tak, uendret av
 * varighets-økningen).
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
 *  - Ellers → vent på trykk på «Finn dagens antrekk». Eier-override v3:
 *    `playFull` er alltid `true` nå — livstidsgaten (P9s
 *    `shouldPlayFullScan`/`hasPlayedFullScanEver`) er fjernet, mikropasset
 *    er pensjonert. Feltet beholdes i returtypen (i stedet for å fjernes)
 *    for å holde kallerne (HjemMonter.tsx) sitt grensesnitt stabilt.
 */
export function decideScanEntry(exactSlot: ScanCacheSlot | null): HjemMonterScanEntry {
  if (exactSlot !== null) {
    return { kind: 'show-cached', resultKey: exactSlot.resultKey };
  }
  return { kind: 'await-tap', playFull: true };
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
