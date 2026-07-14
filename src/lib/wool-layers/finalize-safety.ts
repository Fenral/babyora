/**
 * R2 (2026-07-14) — Legacy safety containment: ÉN endelig sikkerhetsgrense.
 *
 * Bakgrunn (P0 fra analyse- og revisjonsplanen 2026-07-13): kategori-overrides
 * (B-1), per-barn-kalibrering (P9.5) og session-swaps i UI kjørte ETTER
 * applySafety. En override/swap kunne dermed gjeninnføre kombinasjoner som
 * conflicts/soft-blocks/hard-safety hadde fjernet (f.eks. vinterkjøredress i
 * bilstol, teppe ved sovepose, lue under søvn).
 *
 * Grensen re-anvender den godkjente kjeden CONFLICTS → SOFT_BLOCKS → SAFETY
 * på det muterte laget, som SISTE steg. Ingen terskler, severity-nivåer eller
 * norsk sikkerhets-copy endres — kun håndhevingspunktet flyttes til etter
 * siste tillatte mutasjon. Skjermer kan be om swap (applySwapsFinalized), men
 * kan aldri konstruere en trusted Recommendation ved lokal array-mapping.
 *
 * Guardrail-matrise: src/lib/wool-layers/__tests__/finalize-safety.test.ts
 * Rubrikk (låst): docs/superpowers/evidence/r2-safety-containment-rubrikk.md
 */

import { applyConflicts } from './conflicts.js';
import { applySoftBlocks } from './softBlocks.js';
import { applySafety } from './safety.js';
import type { SafetyFlag, Severity } from './safety.js';
import type { Layer, Note, Recommendation, RecommendInput } from './types.js';

export type FinalizeResult = {
  layers: Layer[];
  notes: Note[];
  flags: SafetyFlag[];
};

/**
 * Kjør den godkjente sikkerhetskjeden på (potensielt muterte) lag.
 *
 * - `priorNotes` er notatsporet fra pipelinen så langt. Det bæres videre og
 *   fungerer som «allerede anvendt»-bevis for apply-once-regler (SB-5).
 * - `priorFlags` de-dupliseres mot nye flagg på (code, message) slik at en
 *   regel som allerede fyrte i pipelinen ikke dobbeltrapporteres, mens en
 *   regel som fyrer FØRST på det muterte laget får flagget sitt.
 *
 * Idempotens (G11): finalizeSafety(finalizeSafety(x)) == finalizeSafety(x).
 */
export function finalizeSafety(
  input: RecommendInput,
  layers: Layer[],
  priorNotes: Note[],
  priorFlags: SafetyFlag[],
): FinalizeResult {
  const conflicted = applyConflicts(input, layers, priorNotes);
  const softened = applySoftBlocks(input, conflicted.layers, conflicted.notes);
  const safe = applySafety(input, softened.layers, softened.notes);

  const flags = [...priorFlags];
  for (const f of [...conflicted.flags, ...softened.flags, ...safe.flags]) {
    if (!flags.some((e) => e.code === f.code && e.message === f.message)) {
      flags.push(f);
    }
  }
  return { layers: safe.layers, notes: safe.notes, flags };
}

const SEVERITY_RANK: Record<Severity, number> = {
  NONE: 0, LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4,
};

function highestSeverity(flags: SafetyFlag[]): Severity {
  let max: Severity = 'NONE';
  for (const f of flags) {
    if (SEVERITY_RANK[f.severity] > SEVERITY_RANK[max]) max = f.severity;
  }
  return max;
}

/**
 * Eneste lovlige vei for session-swaps (PlaggDetailSheet → swap-store → UI):
 * bytt items via swap-mappen, og kjør resultatet gjennom den endelige
 * sikkerhetsgrensen. Returnerer en ny Recommendation der layers, notes,
 * flags og severity reflekterer det finaliserte antrekket.
 *
 * `summary` beholdes uendret fra motoren — det matcher tidligere UI-adferd
 * (swap-mappingen i skjermene oppdaterte heller aldri summary) og unngår at
 * denne modulen dupliserer summarize()-formatet.
 */
export function applySwapsFinalized(
  input: RecommendInput,
  rec: Recommendation,
  swaps: Record<string, string>,
): Recommendation {
  if (Object.keys(swaps).length === 0) return rec;

  const mapped: Layer[] = rec.layers.map((l) => ({
    category: l.category,
    items: l.items.map((item) => swaps[item] ?? item),
  }));

  const finalized = finalizeSafety(input, mapped, rec.structuredNotes, rec.safetyFlags ?? []);

  return {
    ...rec,
    layers: finalized.layers,
    notes: finalized.notes.map((n) => n.message),
    structuredNotes: finalized.notes,
    safetyFlags: finalized.flags,
    severity: highestSeverity(finalized.flags),
  };
}
