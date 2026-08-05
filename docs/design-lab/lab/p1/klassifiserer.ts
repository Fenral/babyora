/**
 * P1 — modusklassifisereren (spec v2 §4 pkt. 1).
 *
 * Ren tabellkjøring: første regel (etter prioritet) som treffer, vinner.
 * All domenelogikk bor i regeltabell.ts — denne filen bare evaluerer.
 *
 * Fail-safe: kaster en regel (malformet fakta) eller er tabellen tom,
 * er svaret 'avvik' — aldri normal på feil.
 */

import type { NoytraleFakta } from '../felles/fakta';
import { REGELTABELL, type Modus, type Regel } from './regeltabell';

/** Nødregel når evaluering feiler — aldri optimistisk normal. */
export const NODFALLSREGEL: Regel = {
  id: 'nodfall-avvik',
  prioritet: -1,
  modus: 'avvik',
  beskrivelse:
    'Klassifiseringen feilet (kastet regel eller tom tabell) — fall til avvik.',
  treffer: () => true,
};

export type Klassifisering = {
  modus: Modus;
  regel: Regel;
};

/**
 * Full klassifisering: modus + regelen som avgjorde. Testene bruker
 * regel.id til å bevise prioritet ved kombinasjoner (Sols krav:
 * bilstol + kulde + sovende barn → avvik med bilstol-regelen øverst).
 */
export function klassifiserDetaljert(fakta: NoytraleFakta): Klassifisering {
  const sortert = [...REGELTABELL].sort((a, b) => a.prioritet - b.prioritet);
  for (const regel of sortert) {
    let treff: boolean;
    try {
      treff = regel.treffer(fakta);
    } catch {
      return { modus: NODFALLSREGEL.modus, regel: NODFALLSREGEL };
    }
    if (treff) return { modus: regel.modus, regel };
  }
  return { modus: NODFALLSREGEL.modus, regel: NODFALLSREGEL };
}

export function klassifiser(fakta: NoytraleFakta): Modus {
  return klassifiserDetaljert(fakta).modus;
}
