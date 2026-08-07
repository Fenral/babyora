/**
 * R7 Task 3A — ren instrumentlogikk (testes uten DOM).
 * Terskler = bandForTemp-grensene (aldri egne kopier — importert sannhet).
 */

import { bandForTemp } from '../../lib/wool-layers/tables.js';
import type { TempBand } from '../../lib/wool-layers/types.js';

export const INSTRUMENT_MIN_C = -20;
export const INSTRUMENT_MAX_C = 30;

/** Klem og snap til hel grad innenfor instrumentets område. */
export function snapDegree(value: number): number {
  const rounded = Math.round(value);
  return Math.max(INSTRUMENT_MIN_C, Math.min(INSTRUMENT_MAX_C, rounded));
}

/** 0..1-posisjon i kolonnen (0 = kaldest/bunn, 1 = varmest/topp). */
export function columnFraction(valueC: number): number {
  const clamped = snapDegree(valueC);
  return (clamped - INSTRUMENT_MIN_C) / (INSTRUMENT_MAX_C - INSTRUMENT_MIN_C);
}

/** aria-valuetext med utstavet fortegn (a11y-lead-krav 2). */
export function instrumentValueText(valueC: number, bandText: string): string {
  const v = snapDegree(valueC);
  return `${v < 0 ? 'minus ' : ''}${Math.abs(v)} grader, ${bandText}`;
}

/** Har verdiendringen krysset en temperaturbånd-grense? (haptikk-gate) */
export function crossedBand(prevC: number, nextC: number): boolean {
  return bandForTemp(snapDegree(prevC)) !== bandForTemp(snapDegree(nextC));
}

export function bandAt(valueC: number): TempBand {
  return bandForTemp(snapDegree(valueC));
}

/* ═══ DESIMALSKILLET ER NORSK ══════════════════════════════════════════════
   MÅLT 2026-08-06 på Juster: nedbørverdien sto «0.0 mm/t». Punktumet kom
   fra `Number.toFixed(1)`, som ALLTID skriver engelsk desimalskille uansett
   hvilket språk resten av flaten er på — den tar ingen lokalitet.

   Intl.NumberFormat gjør det motsatte: skilletegnet KOMMER fra lokaliteten,
   så det kan ikke drifte fra resten av appen (som allerede formaterer dato
   og klokke med 'nb-NO', se f.eks. src/lib/planning/plan-view-model.ts).

   Luften rundt tegnet er en ANNEN mekanisme og bor i vertical-gauge.css —
   se `.fa-gauge-desimal` der. Å bytte punktum mot komma alene fjerner den
   ikke: begge tegn får samme tabulære bredde av `tabular-nums`.
   ═════════════════════════════════════════════════════════════════════════ */
const EN_DESIMAL = new Intl.NumberFormat('nb-NO', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Ett desimaltall skrevet norsk: 0 → «0,0», 2.5 → «2,5». */
export function formatEnDesimal(value: number): string {
  return EN_DESIMAL.format(value);
}

/** Tegnet norsk bruker mellom hel og desimal. Én kilde, så CSS-en under
 *  `.fa-gauge-desimal` og teksten aldri kan mene hvert sitt tegn. */
export const DESIMALSKILLE = ',';

/** Bånd-grensene som markørposisjoner (whole degrees der bandForTemp skifter). */
export function bandBoundaries(): number[] {
  const out: number[] = [];
  for (let t = INSTRUMENT_MIN_C + 1; t <= INSTRUMENT_MAX_C; t++) {
    if (bandForTemp(t) !== bandForTemp(t - 1)) out.push(t);
  }
  return out;
}
