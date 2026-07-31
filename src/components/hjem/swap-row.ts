/**
 * swap-row — P6: pure decision for what "Bytt" (MonterGarmentRow) should
 * open for a given ResultRow. No React, no rendering — same "pure function
 * driving a component decision" pattern as adjust-prefill.ts.
 *
 * Reuses the LEGACY result list's data path rather than inventing a new one:
 * the exact `garmentId` → PlaggDetailSheet → `getAlternatives(dbStringFor(id))`
 * pattern that PaakledningScreen's `handleOpenNode` established (F62) and
 * that FinnAntrekkScreen/MinGarderobeScreen/PlaggbibliotekScreen/
 * TogGuideScreen already use today. Deliberately NOT the engine-connected
 * OutfitExperience/OutfitGarmentList "Se alternativer" flow (src/lib/outfit,
 * committed swaps) — PlaggDetailSheet stays informational-only, enforced by
 * warm-cold-recovery.test.ts. This is intentionally the "first version" from
 * the duel notes (docs/design-notes/sol-duel-2026-07-31.md §12) — no
 * consequence labels, no 3–5-alternative sheet spec, just the existing
 * informational PlaggDetailSheet.
 *
 * `garmentId` on a ResultRow is `string | null` (result-rows.ts's
 * `garmentIdFor(label)` can miss an unmapped label). The affordance must
 * never dead-end (P6 task requirement) — so a row with no resolvable
 * garmentId falls back to opening the Plaggbibliotek drill directly instead
 * of trying to open a detail sheet for an id we don't have.
 */
import type { ResultRow } from './result-rows.js';
import type { GarmentId } from '../../data/garment-illustrations.js';

export type SwapRowResolution =
  | { kind: 'detail'; garmentId: GarmentId }
  | { kind: 'library' };

export function resolveSwapTarget(row: ResultRow): SwapRowResolution {
  if (row.garmentId) {
    return { kind: 'detail', garmentId: row.garmentId };
  }
  return { kind: 'library' };
}
