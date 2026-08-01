/**
 * ui-store — P10/JOB1 (docs/design-notes/aapningssekvens-2026-08-01.md):
 * small persisted store for cross-screen, cross-session UI flags that don't
 * belong in a feature-specific store. First (and so far only) tenant:
 * `hasSeenOpeningEver` — the opening-sequence's lifetime "have we ever
 * shown the full ~900ms first-ever hybrid" flag.
 *
 * Mirrors scan-cache-store.ts's `hasPlayedFullScanEver` pattern exactly
 * (P9, docs/design-notes/sol-duel-2026-07-31.md §2): ONE boolean, defaults
 * false, flips true once and never resets, synchronous localStorage
 * persistence (zustand/persist default storage) so it's readable before
 * the first render — safe for native kill/resume, no async race.
 *
 * Per-boot (NOT persisted) opening-sequence dedup lives here too, as a
 * plain module-level mutable slot — same PATTERN as subscription-store.ts's
 * `HAD_FIRST_RECOMMENDATION_BEFORE_THIS_BOOT`/`recommendationGraceWindowActive`
 * (a value computed once per JS boot, distinct from the persisted flag):
 * the opening sequence must resolve (play-or-skip) EXACTLY ONCE per app
 * boot — a user tabbing away from and back to Hjem within the same session
 * must never replay it, even the short "later cold start" micro variant.
 * `consumeOpeningBootSlot()` returns `true` for the first caller each boot,
 * `false` for every subsequent call — HjemMonter/OpeningSequence's mount
 * logic uses this (not React state) so it survives HjemMonter remounting
 * (tab switches) without needing to live in a persisted store or in a
 * parent component that never unmounts.
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
