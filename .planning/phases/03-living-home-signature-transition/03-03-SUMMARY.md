---
phase: 03-living-home-signature-transition
plan: "03"
subsystem: motion
tags: [typescript, immutable-snapshot, fail-closed, geometry, exact-sha]
status: PASS

phase3_candidate_sha: 18441078e1c7cbcd16999862b778a72565171860
candidate_tree_sha: ee9629ae30bd9c68e0109b83d21dbe5e3c0025a1
phase1_candidate_sha: e69e0388eb14da9d00392199473edc120f047f7e
phase3_dependency_sha: bd193ba5706bde75e40a83fed4725e3ec2adc024
validation_evidence_sha256: 7600285673afabc8103a6e87a5b279278b1cafdf5eaf7c4f3c6af5f743ce3d13
code_security_sha: 18441078e1c7cbcd16999862b778a72565171860
code_security_status: PASS
ui_accessibility_sha: 18441078e1c7cbcd16999862b778a72565171860
ui_accessibility_status: PASS
ancestry_status: PASS
clean_status: PASS
cost_nok: 0

requires:
  - phase: 03-living-home-signature-transition
    provides: reviewed timing and replay foundation from 03-02
provides:
  - immutable exact-identity and geometry transition captures
  - pure fail-closed motion eligibility with stable static-settlement reasons
  - tested exact-SHA and external-evidence verifier
  - two distinct fresh-context reviews on one clean detached candidate
affects: [03-05, 03-06, 03-07, 03-08]

tech-stack:
  added: []
  patterns:
    - serializable deeply immutable transition snapshots
    - all-or-nothing identity, item-set, geometry and viewport eligibility
    - external evidence roots resolved outside all candidate checkouts
    - exact frontmatter scalar parsing with alias rejection

key-files:
  created:
    - src/lib/outfit-transition/transition-snapshot.ts
    - src/lib/outfit-transition/transition-snapshot.test.ts
    - src/lib/outfit-transition/eligibility.ts
    - src/lib/outfit-transition/eligibility.test.ts
    - scripts/verify-phase3-exact-sha.mjs
    - scripts/__tests__/verify-phase3-exact-sha.test.ts
    - .planning/phases/03-living-home-signature-transition/evidence/03-03-INDEPENDENT-REVIEW.md
  modified: []

key-decisions:
  - "Motion may start only from a complete exact identity, complete matching item set, finite source and target geometry, stable viewport and allowed lifecycle."
  - "Every malformed, partial, stale, hidden, reduced-motion or aborted state returns a stable static-settlement reason."
  - "The foundation imports no Phase 2 names; Plan 03-05 alone will adapt the reviewed Phase 2 public contract."
  - "Candidate evidence lives outside the Git candidate and is validated by realpath confinement, hash agreement and distinct fresh reviewers."

requirements-completed: [MOTION-01]

coverage:
  - id: D1
    description: "Immutable identity, viewport and one-to-ten item geometry capture rejects malformed and mutable input."
    requirement: MOTION-01
    verification:
      - kind: unit
        ref: "src/lib/outfit-transition/transition-snapshot.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Only a complete exact candidate can animate; every mismatch or lifecycle restriction settles statically."
    requirement: MOTION-01
    verification:
      - kind: unit
        ref: "src/lib/outfit-transition/eligibility.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "The clean detached candidate, dependency ancestry, external bundle and two fresh PASS reviews are verified fail-fast."
    requirement: MOTION-01
    verification:
      - kind: unit
        ref: "scripts/__tests__/verify-phase3-exact-sha.test.ts"
        status: pass
      - kind: other
        ref: ".planning/phases/03-living-home-signature-transition/evidence/03-03-INDEPENDENT-REVIEW.md"
        status: pass
    human_judgment: false

completed: 2026-07-25
---

# Phase 3 Plan 03-03: Immutable capture and fail-closed eligibility

**Babyora now has an unwired, Phase-2-independent motion core that can animate only a complete exact identity and geometry set, plus a tested exact-SHA evidence gate.**

## Candidate and gate

- **Candidate SHA:** `18441078e1c7cbcd16999862b778a72565171860`
- **Tree SHA:** `ee9629ae30bd9c68e0109b83d21dbe5e3c0025a1`
- **Validation SHA-256:** `7600285673afabc8103a6e87a5b279278b1cafdf5eaf7c4f3c6af5f743ce3d13`
- **Code/security review:** PASS
- **UI/accessibility review:** PASS
- **Ancestry and clean status:** PASS
- **Cost:** NOK 0

Review evidence:
`.planning/phases/03-living-home-signature-transition/evidence/03-03-INDEPENDENT-REVIEW.md`

## Accomplishments

- Captures exact three-part identity, viewport facts and ordered normalized rectangles into a deeply immutable serializable snapshot.
- Rejects missing identity, duplicates, empty sets, non-finite values, non-positive geometry and invalid viewport input.
- Requires exact identity, exact item membership, complete source and target anchors, stable viewport, visible document, active lifecycle and allowed motion before animation.
- Converts every unsupported state into a deterministic `settle-static` reason instead of guessing or partially animating.
- Adds a fail-fast CLI that verifies detached exact SHA, empty status, diff hygiene, every declared dependency, external evidence path confinement, bundle hash and two distinct fresh-context PASS records.
- Preserves Phase 2 independence; no UI, App, route, storage, network or runtime wiring was introduced.

## Verification

| Check | Result |
|---|---|
| Snapshot, eligibility and verifier suites | PASS — 3 files, 242 tests |
| TypeScript project build | PASS |
| Dependency manifest and lockfile drift | PASS — none |
| Detached exact candidate and tree | PASS |
| Phase 1 and 03-02 dependency ancestry | PASS |
| External evidence realpath confinement | PASS |
| Candidate, code/security and UI/accessibility SHA agreement | PASS |
| Distinct reviewer and session identities | PASS |
| `fork_turns: none` and fresh-context records | PASS |
| Validation bundle SHA-256 agreement | PASS |
| Candidate clean before and after reviews | PASS |
| Packages, media, network, persistence, push or deployment | None |

## Task commits

- Snapshot RED/GREEN: `4ab2069`, `6954371`
- Eligibility RED/GREEN: `29f4909`, `3296f43`
- Exact-SHA verifier RED/GREEN and fail-closed parser hardening: `e3b6da7` through `1844107`

The documentation closeout commit follows the immutable reviewed candidate and does not alter its source bytes.

## Deviations and issues

- The verifier-only Phase 1 handoff required an explicit `status: PASS` scalar in addition to its exact `candidate_sha`. The external derived handoff was corrected to express the already-reviewed 01-12 status before final verification.
- No implementation deviation was made. The candidate remains unwired and Phase-2-independent as planned.

## User setup required

None.

## Rollback

Do not integrate the candidate, or revert the isolated Plan 03-03 commit range after the Plan 03-02 closeout base. No persistent or external state requires cleanup.

## Next-phase readiness

- Plan 03-05 may consume these public snapshot and eligibility contracts only after Phase 2 reaches its reviewed 02-09 handoff.
- Later integration must include the completed Phase 1 01-18 candidate; this frozen foundation truthfully retains the earlier Phase 1 ancestry on which it was reviewed.
- No TestFlight, production, GitHub push or deployment action was performed.

---
*Phase: 03-living-home-signature-transition*
*Plan: 03-03*
*Completed: 2026-07-25*
