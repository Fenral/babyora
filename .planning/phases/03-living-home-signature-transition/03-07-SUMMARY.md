---
phase: 03-living-home-signature-transition
plan: "07"
subsystem: motion
tags: [react, motion, portal, semantic-first, accessibility, exact-identity]
status: PASS

phase1_candidate_sha: 5cf7df85014fa51096b06a7e381926ebb4601798
phase2_candidate_sha: 7de4bf480c2b203937bb4093001df23a5d85f264
phase3_candidate_sha: 8bf9dfb45ff5234ffa1fc8ffa3f5190f6107474a
code_security_sha: 8bf9dfb45ff5234ffa1fc8ffa3f5190f6107474a
code_security_status: PASS
code_security_verdict: PASS
ui_accessibility_sha: 8bf9dfb45ff5234ffa1fc8ffa3f5190f6107474a
ui_accessibility_status: PASS
ui_accessibility_verdict: PASS
ancestry_status: PASS
clean_status: PASS
cost_nok: 0

requires:
  - phase: 01-planlegg-dagslinjen
    provides: approved navigation and semantic dialog baseline
  - phase: 02-outfit-truth-antrekkskart
    provides: frozen recommendation bundle, visibility truth, and exact row registration
  - phase: 03-living-home-signature-transition
    provides: accepted Home coordinator candidate from Plan 03-06
provides:
  - finite semantic-hidden garment transition overlay
  - exact visible-garment source-to-row explanation
  - immediate semantic Outfit with independent decorative playback
  - deterministic lifecycle, static fallback, and replay behavior
affects: [03-08]

key-files:
  created:
    - src/components/outfit-transition/OutfitTransitionOverlay.tsx
    - src/components/outfit-transition/OutfitTransitionOverlay.css
    - src/components/outfit-transition/OutfitTransitionOverlay.test.tsx
    - .planning/phases/03-living-home-signature-transition/evidence/03-07-INDEPENDENT-REVIEW.md
  modified:
    - src/App.tsx
    - src/styles/motion-grammar.ts
    - e2e/home-outfit-motion.ts
    - e2e/outfit-truth.ts
    - src/screens/__tests__/PaakledningScreen.outfit-truth.test.tsx

requirements-completed:
  - MOTION-01

completed: 2026-07-25
---

# Phase 3 Plan 03-07: Signature Garment Transition Summary

## Candidate and gates

```text
phase1_candidate_sha: 5cf7df85014fa51096b06a7e381926ebb4601798
phase2_candidate_sha: 7de4bf480c2b203937bb4093001df23a5d85f264
phase3_candidate_sha: 8bf9dfb45ff5234ffa1fc8ffa3f5190f6107474a
code_security_sha: 8bf9dfb45ff5234ffa1fc8ffa3f5190f6107474a
code_security_status: PASS
code_security_verdict: PASS
ui_accessibility_sha: 8bf9dfb45ff5234ffa1fc8ffa3f5190f6107474a
ui_accessibility_status: PASS
ui_accessibility_verdict: PASS
ancestry_status: PASS
clean_status: PASS
cost_nok: 0
```

Review evidence:
`.planning/phases/03-living-home-signature-transition/evidence/03-07-INDEPENDENT-REVIEW.md`

## Accomplishments

- Adds one fixed-position decorative portal for the eligible first
  Home-to-Outfit activation.
- Creates exactly one visual clone for every validated visible garment, in the
  exact adapter order, and moves each clone from its immutable Home rectangle
  to its exact immutable Outfit row rectangle.
- Keeps the semantic Outfit heading, rows, controls, and focus available at
  navigation time zero. Animation never gates or replaces navigation.
- Marks the portal `aria-hidden` and pointer-inert and gives its plain visual
  clones no focus, controls, or event authority.
- Uses only transform, scale, and opacity within the canonical 1250 ms
  explanatory duration. Normal interaction feedback remains 220 ms.
- Fails closed for missing, non-positive, stale, duplicate, reordered, or
  mismatched geometry and presentation identity.
- Leaves equipment, obscured garments, hidden garments, and every unlisted
  `base.garments` entry static.
- Settles reduced-motion, unavailable rendering, replay, close, back, resize,
  orientation, scroll, backgrounding, rapid activation, cancellation, and
  unmount paths exactly once.
- Removes no semantic content and introduces no delayed chip reveal, legacy
  takeover, persistent replay flag, new dependency, paid resource, or remote
  media.
- Proves the real compiled production route from pre-activation through
  semantic T0, playback, exact destinations, settlement, close focus return,
  and operable reopen.

## Explicit implementation deviations

Independent review required two cohesive test-contract corrections outside the
original declared list:

1. `src/screens/__tests__/PaakledningScreen.outfit-truth.test.tsx` migrated a
   stale source-string assertion to the real scalar `landing`/`settled`
   contract while preserving the frozen bundle and row registrar.
2. `e2e/outfit-truth.ts` replaced its transient `ready` requirement with a
   pre-CTA lifecycle trace that proves the actual Plan 03-07 compiled route.

These changes test the approved runtime contract directly. They do not alter
Phase-2 production truth or preserve obsolete literals through comments.

## Rejected candidate and correction

Candidate `09c3bdbd185c8e9e920205e7cb8544ef932b748e` was rejected because its
decorative clones used `tabIndex={-1}` and its inherited production proof
required transient coordinator state `ready`.

The final candidate `8bf9dfb45ff5234ffa1fc8ffa3f5190f6107474a`
removes programmatic focusability, adds rendered portal and exactly-once
lifecycle coverage, and observes the real lifecycle before activation through
terminal settlement. Both independent reviewers then passed that same exact
SHA with zero P0/P1 findings.

## Verification

| Check | Result |
|---|---|
| Rendered overlay contract and lifecycle | PASS - 7/7 |
| Expanded implementation regressions | PASS - 173/173 |
| Independent code/security review | PASS - 0 P0/P1, 5/5 threats closed |
| Independent UI/accessibility review | PASS - 0 P0/P1 |
| Real compiled production App lifecycle | PASS |
| Signature and complete browser matrices | PASS |
| Component/accessibility matrix | PASS |
| Repository smoke E2E | PASS - 4/4 |
| TypeScript, lint, main and bare builds | PASS |
| Diff, ancestry, protected paths, dependencies, clean status | PASS |
| Cost | NOK 0 |

The bounded aggregate Vitest run reached 1,757 passes and one todo before two
unrelated five-second evidence-verifier cases timed out under aggregate load.
The exact two files passed 256/256 together in isolation. This load-sensitive
timeout is carried explicitly into Plan 03-08, whose required final collection
must make the plain full-suite gate reliable rather than hiding or retrying it
indefinitely.

## Contract handed to Plan 03-08

Plan 03-08 must preserve candidate
`8bf9dfb45ff5234ffa1fc8ffa3f5190f6107474a` as an exact labeled dependency,
complete the remaining HOME-01/MOTION-01 deterministic matrix, add the
path-safe external evidence runner, collect evidence from one immutable
detached final candidate, obtain two fresh-context external verdicts, and
verify all candidate/review/log hashes and ancestry directly.

## Rollback

Revert the three Plan 03-07 implementation commits from `aaf9fa0` through
`8bf9dfb`, or return to the independently approved Plan 03-06 closeout
`11be55b`. The semantic Home-to-Outfit navigation and complete static Outfit
screen remain fully usable without the decorative overlay.

---

*Phase: 03-living-home-signature-transition*
*Plan: 03-07*
*Completed: 2026-07-25*
