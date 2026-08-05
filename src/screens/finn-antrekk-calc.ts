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
 * Re-arm-beslutningen — OG angre-beslutningen.
 *
 * Kun et ALLEREDE FERSKT (landet) resultat demoteres til 'stale' når de
 * underliggende parametrene drifter. 'idle' (ingenting committed ennå) og
 * 'scanning' (koreografien pågår) er uendret av at sliderne beveger seg.
 *
 * ═══ STALE-LÅSEN, RETTET 2026-08-05 (DoD fase 5, punkt 3) ═════════════════
 * Overgangen gikk bare ÉN vei: `fresh → stale`. Kom parametrene TILBAKE til
 * nøyaktig de committede verdiene, ble fasen stående på 'stale'.
 *
 * I praksis: dra temperaturen ett hakk og dra den tilbake. Appen har da
 * nøyaktig det svaret liggende — det er det samme snapshotet den allerede
 * har regnet på — men CTA-en sier «Beregn på nytt», og et trykk brenner
 * 3,2 sekunders seremoni på å produsere et resultat som er bit for bit
 * identisk med det som allerede står på skjermen.
 *
 * Det er ikke bare bortkastet tid. Det lærer brukeren at appen ikke vet hva
 * den vet, og en seremoni som kjører uten å endre noe undergraver
 * seremonien de gangene den faktisk betyr noe.
 *
 * Retningen tilbake er derfor symmetrisk med retningen fram: samme
 * `paramsChanged`, samme snapshot, motsatt fortegn. Ingen ny sannhetskilde.
 */
export function nextPhaseAfterParamChange(
  phase: CalcPhase,
  committed: CommittedParams | null,
  current: CommittedParams,
): CalcPhase {
  if (phase === 'fresh' && paramsChanged(committed, current)) return 'stale';
  /* Angret: parametrene står igjen nøyaktig der det committede svaret ble
     regnet. Da ER svaret ferskt, og seremonien har ingenting å gjøre. */
  if (phase === 'stale' && committed !== null && !paramsChanged(committed, current)) return 'fresh';
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
