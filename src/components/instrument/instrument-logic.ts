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

/** Bånd-grensene som markørposisjoner (whole degrees der bandForTemp skifter). */
export function bandBoundaries(): number[] {
  const out: number[] = [];
  for (let t = INSTRUMENT_MIN_C + 1; t <= INSTRUMENT_MAX_C; t++) {
    if (bandForTemp(t) !== bandForTemp(t - 1)) out.push(t);
  }
  return out;
}
