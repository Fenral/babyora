/**
 * ui-store — P10/JOB1 (docs/design-notes/aapningssekvens-2026-08-01.md):
 * small persisted store for cross-screen, cross-session UI flags that don't
 * belong in a feature-specific store. Original (and so far only) tenant:
 * `hasSeenOpeningEver` — the opening-sequence's lifetime "have we ever
 * shown the full ~900ms first-ever hybrid" flag.
 *
 * RETIRED, KEPT DEAD (eier-override v3, 2026-08-01): the opening climb
 * (OpeningSequence.tsx/opening-sequence.ts) itself was removed — Hjem is
 * now static until the CTA is pressed, see
 * docs/design-notes/aapningssekvens-2026-08-01.md's eier-override notice.
 * `hasSeenOpeningEver`/`markOpeningSeenEver`/`consumeOpeningBootSlot` below
 * have NO remaining consumer anywhere in the app — left in place rather
 * than removed ("feltet kan ligge dødt i persist for ro", v3 plan): any
 * already-persisted `babyora.ui` JSON on a real device stays exactly as
 * harmless dead data instead of needing a migration/cleanup pass. Do not
 * wire new features into this store without first checking whether the
 * feature actually needs a NEW field — this file is not itself deleted
 * only because a completely empty persisted store is not worth the churn.
 *
 * Mirrors scan-cache-store.ts's `hasPlayedFullScanEver` pattern exactly
 * (P9, docs/design-notes/sol-duel-2026-07-31.md §2): ONE boolean, defaults
 * false, flips true once and never resets, synchronous localStorage
 * persistence (zustand/persist default storage) so it's readable before
 * the first render — safe for native kill/resume, no async race.
 *
 * Per-boot (NOT persisted) opening-sequence dedup lived here too, as a
 * plain module-level mutable slot — same PATTERN as subscription-store.ts's
 * `HAD_FIRST_RECOMMENDATION_BEFORE_THIS_BOOT`/`recommendationGraceWindowActive`
 * (a value computed once per JS boot, distinct from the persisted flag).
 * `consumeOpeningBootSlot()` is likewise unconsumed now — kept for the same
 * "dead, not deleted" reason above.
 *
 * Persistert format (zustand/persist v4):
 *   { state: { hasSeenOpeningEver: boolean }, version: 0 }
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UiState = Readonly<{
  /** Har den fulle ~900ms førstegangs-åpningssekvensen blitt spilt NOENSINNE (ikke per boot/dag) på denne enheten? */
  hasSeenOpeningEver: boolean;
  /** Idempotent — no-op hvis allerede sann (samme mønster som markFullScanPlayedEver). */
  markOpeningSeenEver: () => void;
}>;

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      hasSeenOpeningEver: false,
      markOpeningSeenEver: () => set((current) => (
        current.hasSeenOpeningEver ? current : { hasSeenOpeningEver: true }
      )),
    }),
    {
      name: 'babyora.ui',
      partialize: (state) => ({ hasSeenOpeningEver: state.hasSeenOpeningEver }),
    },
  ),
);

// ── Per-boot opening-sequence slot (NOT persisted, NOT store state) ────────

let openingSlotClaimedThisBoot = false;

/**
 * Claims the "resolve the opening sequence" slot for this JS boot. Returns
 * `true` exactly once per boot (the first caller — HjemMonter's mount
 * effect); every later call (a remount from tab-switching, a second Hjem
 * mount, etc.) returns `false`, telling the caller to render the plain
 * normal tree with no sequence at all, instantly.
 */
export function consumeOpeningBootSlot(): boolean {
  if (openingSlotClaimedThisBoot) return false;
  openingSlotClaimedThisBoot = true;
  return true;
}

/**
 * Test-only reset. A plain module-level `let` (unlike subscription-store's
 * boot constant, which is intentionally a `const` computed once from raw
 * localStorage) — this one is legitimately mutable by design (it's a
 * claim-once slot, not a boot-time snapshot of persisted data), so a reset
 * hook for test isolation is safe and doesn't require module-reset
 * gymnastics.
 */
export function __resetOpeningBootSlotForTests(): void {
  openingSlotClaimedThisBoot = false;
}
