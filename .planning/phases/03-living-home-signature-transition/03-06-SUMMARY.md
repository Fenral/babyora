---
phase: 03-living-home-signature-transition
plan: "06"
subsystem: motion
tags: [react, coordinator, lifecycle, exact-identity, accessibility, e2e]
status: PASS

phase1_candidate_sha: 5cf7df85014fa51096b06a7e381926ebb4601798
phase2_candidate_sha: 7de4bf480c2b203937bb4093001df23a5d85f264
phase3_candidate_sha: 8c9a97f290ab4cf72764e97973691129df886e7f
code_security_sha: 8c9a97f290ab4cf72764e97973691129df886e7f
code_security_status: PASS
ui_accessibility_sha: 8c9a97f290ab4cf72764e97973691129df886e7f
ui_accessibility_status: PASS
ancestry_status: PASS
clean_status: PASS
cost_nok: 0

requires:
  - phase: 01-planlegg-dagslinjen
    provides: approved navigation and semantic dialog baseline
  - phase: 02-outfit-truth-antrekkskart
    provides: frozen recommendation bundle and row-registration truth
  - phase: 03-living-home-signature-transition
    provides: timeline, atmosphere, snapshot, eligibility, and Phase-2 adapter foundations
provides:
  - App-lifetime transition coordinator and replay ledger
  - exact visible Home source registration and Phase-2 target readiness
  - deterministic lifecycle, rapid activation, and cleanup behavior
  - compiled real-App production readiness proof
affects: [03-07, 03-08]

key-files:
  created:
    - src/lib/outfit-transition/coordinator.ts
    - src/lib/outfit-transition/coordinator.test.ts
    - src/hooks/useOutfitTransitionCoordinator.ts
    - src/hooks/__tests__/useOutfitTransitionCoordinator.test.tsx
    - e2e/fixtures/home-outfit-motion.ts
    - e2e/home-outfit-motion.ts
    - src/screens/__tests__/HjemScreen.outfit-transition.test.tsx
    - .planning/phases/03-living-home-signature-transition/evidence/03-06-INDEPENDENT-REVIEW.md
  modified:
    - src/App.tsx
    - src/screens/HjemScreen.tsx
    - src/lib/outfit-transition/phase2-adapter.ts
    - src/lib/outfit-transition/phase2-adapter.test.ts
    - src/screens/__tests__/PaakledningScreen.outfit-truth.test.tsx
    - e2e/outfit-truth.ts

requirements-completed:
  - MOTION-01

completed: 2026-07-25
---

# Phase 3 Plan 03-06: Home and Outfit Coordinator Summary

## Candidate and gates

```text
phase1_candidate_sha: 5cf7df85014fa51096b06a7e381926ebb4601798
phase2_candidate_sha: 7de4bf480c2b203937bb4093001df23a5d85f264
phase3_candidate_sha: 8c9a97f290ab4cf72764e97973691129df886e7f
code_security_sha: 8c9a97f290ab4cf72764e97973691129df886e7f
code_security_status: PASS
ui_accessibility_sha: 8c9a97f290ab4cf72764e97973691129df886e7f
ui_accessibility_status: PASS
ancestry_status: PASS
clean_status: PASS
cost_nok: 0
```

Review evidence:
`.planning/phases/03-living-home-signature-transition/evidence/03-06-INDEPENDENT-REVIEW.md`

## Accomplishments

- Adds a deterministic coordinator state machine for capture, readiness,
  playback eligibility, abort, and settlement.
- Adds one App-lifetime hook that owns replay, Home/Outfit registries,
  lifecycle listeners, transient geometry, and cleanup.
- Captures exact source geometry synchronously before opening the existing
  native dialog; coordinator state never delays navigation, semantics, focus,
  haptics, close, or back behavior.
- Uses only the reviewed Phase-2 adapter to expose Home source descriptors.
  Exact branded IDs attach directly to existing visible garment pills; label
  and layout position never establish identity.
- Registers no source when truth is invalid, ambiguous, hidden, occluded,
  equipment, unsupported, or otherwise static.
- Preserves the frozen Phase-2 bundle, row registrar, and scalar settled visual
  state.
- Handles rapid double activation, replay, reduced motion, missing geometry,
  backgrounding, resize, orientation, scroll, close, element replacement, and
  unmount without trapping input or retaining transient target references.
- Proves one real production success path in the compiled App: 28 degrees,
  actual `I vogn`, visible exact-ID Home pills, actual CTA, actual ordered
  Phase-2 rows, coordinator ready, semantic focus, close focus return, and
  operable reopen.
- Adds no transition overlay; overlay rendering remains owned by Plan 03-07.

## Explicit implementation deviations

The original plan listed eight implementation/test paths. Independent review
required five cohesive additions:

1. `phase2-adapter.ts` and its test gained a read-only `selectHomeSources`
   surface that reuses the existing fail-closed validator.
2. `HjemScreen.outfit-transition.test.tsx` proves visible exact-ID pill sources
   and zero registration for static fallback.
3. `PaakledningScreen.outfit-truth.test.tsx` migrates a stale source-string
   assertion from a separate App registry to the required single
   coordinator-owned registry and explicitly rejects split ownership.
4. `e2e/outfit-truth.ts` proves readiness through the compiled real App rather
   than through fixture-only or source-string evidence.

These additions do not alter Phase-2 production truth, package manifests,
lockfiles, external state, or visible design content.

## Verification

| Check | Result |
|---|---|
| Exact 03-06 focused gate | PASS - 50/50 plus browser, smoke, and typecheck |
| Expanded regression set | PASS - 222/222 |
| Independent code/security review | PASS - 0 P0/P1, 5/5 threats closed |
| Independent UI/accessibility review | PASS - 0 P0/P1 |
| Serial full Vitest | PASS - 109 files, 1752 passed, 1 todo |
| Real production build/preview readiness proof | PASS |
| Coordinator browser matrix | PASS |
| Outfit component browser matrix | PASS |
| Production current/planned routes | PASS |
| Planlegg exact-context | PASS |
| Smoke E2E | PASS - 4/4 |
| TypeScript, lint, main and bare builds | PASS |
| Diff, ancestry, protected paths, dependencies, clean status | PASS |
| Cost | NOK 0 |

An initial full run under concurrent smoke load hit one existing five-second
exact-SHA verifier timeout. That file passed 192/192 in isolation, and a serial
full suite then passed without retrying further.

## Contract handed to Plan 03-07

Plan 03-07 may render only a semantic-hidden, pointer-transparent overlay from
the coordinator's exact ready candidate. It must not replace dialog semantics,
source or target registrations, identity, focus, haptics, navigation, or
fallback behavior. Any incomplete, replayed, reduced-motion, interrupted, or
static state remains overlay-free.

## Rollback

Revert the four 03-06 commits from `bc60285` through `8c9a97f`, or return to
integration base `fb668a6`. Home, Outfit, and all recommendation semantics
remain fully usable without the coordinator because the overlay is not yet
mounted.

---

*Phase: 03-living-home-signature-transition*
*Plan: 03-06*
*Completed: 2026-07-25*
