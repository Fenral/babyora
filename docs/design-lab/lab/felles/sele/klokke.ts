/**
 * Virtuell klokke for testselen (spec v2 §1 pkt. 4).
 *
 * All tid i laben er deterministisk: klokka starter på scenariets fikserte
 * «nå» (labISO) og beveger seg KUN via spol(min). Ingen Date.now(), ingen
 * timere — degradert tilstand oppstår som OVERGANG når selen spoler klokka
 * forbi rådets gyldighet midt i en oppgave.
 *
 * ISO-formatet er identisk med felles/fakta.ts (labISO): fast +01:00-offset
 * på labdatoen, slik at streng-sammenligning mot gjelderTilISO er trygg.
 */

import type { Scenario } from '../scenarier';
import { labISO } from '../fakta';

export type LabKlokke = {
  naaISO(): string;
  spol(min: number): void;
  onTick(cb: () => void): () => void;
};

const MS_PER_MIN = 60_000;
/** Laben ligger fast på +01:00 (norsk normaltid, januar). */
const OFFSET_MS = 3_600_000;

function tilISO(ms: number): string {
  return new Date(ms + OFFSET_MS).toISOString().replace(/\.\d{3}Z$/, '+01:00');
}

export function lagKlokke(startISO: string): LabKlokke {
  let naaMs = Date.parse(startISO);
  if (Number.isNaN(naaMs)) {
    throw new Error(`lagKlokke: ugyldig start-ISO: ${startISO}`);
  }
  const lyttere = new Set<() => void>();

  return {
    naaISO() {
      return tilISO(naaMs);
    },
    spol(min: number) {
      if (!Number.isFinite(min)) return;
      naaMs += min * MS_PER_MIN;
      // Kopi: en lytter kan melde seg av under varsling.
      for (const cb of [...lyttere]) cb();
    },
    onTick(cb: () => void) {
      lyttere.add(cb);
      return () => {
        lyttere.delete(cb);
      };
    },
  };
}

/** Klokke fiksert til scenariets «nå» — selens standardinngang. */
export function klokkeForScenario(scenario: Scenario): LabKlokke {
  return lagKlokke(labISO(scenario.naa));
}
