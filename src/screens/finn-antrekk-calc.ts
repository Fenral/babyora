/**
 * finn-antrekk-calc — P10/JOB4: rene beslutningsfunksjoner for
 * FinnAntrekkScreen sin CTA-drevne scan-tilstand.
 *
 * Ingen React/DOM her — testbare i Node, samme konvensjon som
 * src/components/hjem/scan-orchestration.ts sine "rene beslutningsfunksjoner"
 * (FinnAntrekkScreen.tsx selv gjenbruker disse, gjenimplementerer dem ikke).
 *
 * Modellen (owner-redesign 2026-08-01, presisert av eier-override v3 samme
 * dag — erstatter "juster og se svaret endre seg"-live-modellen):
 *   idle → (trykk «Finn antrekk») → scanning → (3,2s full koreografi, ScanOverlay) → fresh
 *   fresh → (én slider/aktivitet endres) → stale → (trykk «Beregn på nytt») → scanning → …
 *
 * 'idle' (ingenting beregnet ennå) og 'scanning' (den fulle koreografien
 * kjører) er UPÅVIRKET av at sliderne endres — kun et allerede FERSKT
 * resultat re-armes til 'stale'. Resultatet forblir alltid synlig (demotert,
 * aldri skjult) fra det øyeblikket noe er committed.
 */

export type CalcPhase = 'idle' | 'scanning' | 'fresh' | 'stale';

export type CommittedParams = Readonly<{
  tempC: number;
  windMs: number;
  precipMmH: number;
  activityUi: 'lek' | 'vogn';
}>;

/** Sann når MINST én sporet parameter avviker fra den committed snapshoten. */
export function paramsChanged(committed: CommittedParams | null, current: CommittedParams): boolean {
  if (committed === null) return false;
  return (
    committed.tempC !== current.tempC
    || committed.windMs !== current.windMs
    || committed.precipMmH !== current.precipMmH
    || committed.activityUi !== current.activityUi
  );
}

/**
 * Re-arm-beslutningen: kun et ALLEREDE FERSKT (landet) resultat demoteres
 * til 'stale' når de underliggende parametrene drifter. 'idle' (ingenting
 * committed ennå) og 'scanning' (mikropasset pågår) er uendret av at
 * sliderne beveger seg.
 */
export function nextPhaseAfterParamChange(
  phase: CalcPhase,
  committed: CommittedParams | null,
  current: CommittedParams,
): CalcPhase {
  if (phase === 'fresh' && paramsChanged(committed, current)) return 'stale';
  return phase;
}

/** Plan-agnostisk … nei — CTA-en ER fasit-agnostisk: samme «Finn antrekk» for idle, «Beregn på nytt» kun for stale. */
export function ctaLabelFor(phase: CalcPhase): string {
  return phase === 'stale' ? 'Beregn på nytt' : 'Finn antrekk';
}

/**
 * CTA vises for 'idle' (aldri scannet ennå) og 'stale' (re-armet av en
 * slider-endring) — skjules mens 'scanning' (mikropasset tar over CTA-
 * området) og når 'fresh' (resultatet stemmer allerede — speiler Hjems
 * egen result-current: ingen CTA når svaret allerede er riktig).
 */
export function showCtaFor(phase: CalcPhase): boolean {
  return phase === 'idle' || phase === 'stale';
}

/** Resultatflaten (garment-rader + forklaringsboks) vises fra FØRSTE fullførte beregning og forblir synlig (aldri skjult igjen). */
export function showResultFor(committed: CommittedParams | null): boolean {
  return committed !== null;
}

/** Visuell demotering (redusert opasitet) — resultatet er synlig men IKKE lenger ferskt. */
export function resultDemotedFor(phase: CalcPhase): boolean {
  return phase === 'stale';
}
