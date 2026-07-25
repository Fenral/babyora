---
phase: 03-living-home-signature-transition
plan: "02"
subsystem: motion
tags: [typescript, motion, replay, privacy, reduced-motion]

requires:
  - phase: 03-living-home-signature-transition
    provides: frozen Phase 3 motion and replay contracts
provides:
  - deterministic bounded one-to-ten-garment transition timeline
  - terminal settlement for completion, cancellation, backgrounding and reduced motion
  - App-lifetime exact-triple replay ledger
  - exact-SHA independent code/security and lifecycle/motion approval
affects:
  - 03-03-transition-snapshot-and-eligibility
  - 03-06-transition-coordinator
  - 03-07-outfit-transition-overlay
  - 03-08-phase-verification

tech-stack:
  added: []
  patterns:
    - one pure overlapping timeline with caller-supplied bounded timing
    - consume-before-selection App-lifetime replay eligibility
    - length-safe exact-triple canonical identity

key-files:
  created:
    - src/lib/outfit-transition/timeline.ts
    - src/lib/outfit-transition/timeline.test.ts
    - src/lib/outfit-transition/replay-policy.ts
    - src/lib/outfit-transition/replay-policy.test.ts
    - .planning/phases/03-living-home-signature-transition/evidence/03-02-INDEPENDENT-REVIEW.md
  modified: []

key-decisions:
  - "Ordinary UI timing is restricted to 180-250 ms, while the explanatory sequence is one independent 900-1400 ms clock."
  - "One through ten garment offsets overlap and converge at the caller-supplied total rather than extending the sequence."
  - "Completion, cancellation, backgrounding and reduced motion share one settled semantic terminal state."
  - "The first valid deliberate activation consumes its exact identity before animated or static settlement is selected."
  - "Replay state belongs to one caller-owned in-memory ledger and never persists or uses a module-global singleton."

patterns-established:
  - "Pure timeline primitives: callers own clocks and side effects; the module computes only bounded progress and settlement."
  - "Conservative replay: malformed identities reject without consumption, while every valid first attempt consumes atomically."
  - "Exact identity: length-safe serialization preserves all three ordered identity components without delimiter collisions."

requirements-completed:
  - MOTION-01

coverage:
  - id: D1
    description: Bounded overlapping timeline for one through ten garments with deterministic interruption settlement
    requirement: MOTION-01
    verification:
      - kind: unit
        ref: "src/lib/outfit-transition/timeline.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: App-lifetime exact-triple replay exhaustion with collision-safe malformed-input handling
    requirement: MOTION-01
    verification:
      - kind: unit
        ref: "src/lib/outfit-transition/replay-policy.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: Independent code/security and fresh lifecycle/motion reviews on one exact clean candidate SHA
    requirement: MOTION-01
    verification:
      - kind: other
        ref: ".planning/phases/03-living-home-signature-transition/evidence/03-02-INDEPENDENT-REVIEW.md"
        status: pass
    human_judgment: false

duration: "TDD implementation plus two independent exact-SHA reviews"
completed: 2026-07-24
status: complete
phase3_candidate_sha: bd193ba5706bde75e40a83fed4725e3ec2adc024
code_security_sha: bd193ba5706bde75e40a83fed4725e3ec2adc024
code_security_status: PASS
ui_accessibility_sha: bd193ba5706bde75e40a83fed4725e3ec2adc024
ui_accessibility_status: PASS
ancestry_status: PASS
clean_status: PASS
cost_nok: 0
---

# Phase 3 Plan 03-02: Timing and Replay Foundations Summary

**A pure bounded Home-to-Outfit timeline and an App-lifetime exact-triple
attempt ledger, independently approved on one immutable candidate**

## Candidate and gate

```text
phase3_candidate_sha: bd193ba5706bde75e40a83fed4725e3ec2adc024
code_security_sha: bd193ba5706bde75e40a83fed4725e3ec2adc024
code_security_status: PASS
ui_accessibility_sha: bd193ba5706bde75e40a83fed4725e3ec2adc024
ui_accessibility_status: PASS
ancestry_status: PASS
clean_status: PASS
cost_nok: 0
```

Review evidence:
`.planning/phases/03-living-home-signature-transition/evidence/03-02-INDEPENDENT-REVIEW.md`

## Accomplishments

- Defines a 220 ms ordinary-interaction default inside the locked 180-250 ms
  band and a separate 1250 ms explanatory default inside 900-1400 ms.
- Fits one through ten garment movements inside one overlapping total clock;
  every item converges at the caller-supplied total duration.
- Converts completion, cancellation, browser backgrounding and reduced motion
  into one deterministic settled terminal state.
- Enforces at most one attempt per exact ordered recommendation identity
  triple for one caller-owned App lifetime.
- Consumes the first valid identity before choosing animation or static
  fallback, so interrupted and motion-ineligible attempts cannot replay.
- Rejects malformed identity data without consuming or colliding with a valid
  identity and uses length-safe canonical serialization.
- Introduces no timers, persistence, network, media, dependency, push or
  deployment behavior.
- Passed two independent exact-SHA reviews with zero blockers and zero
  warnings at NOK 0.

## Task commits

1. **Bounded timeline contract - RED**
   - `9df51bf`
2. **Bounded timeline implementation - GREEN**
   - `74aa533`
3. **App-lifetime replay contract - RED**
   - `03f80a9`
4. **App-lifetime replay implementation - GREEN**
   - `bd193ba`

The documentation commit is the atomic follow-up commit that contains this
summary and its independent-review evidence.

## Verification

| Check | Result |
|---|---|
| Focused timeline and replay tests | PASS - 39/39 |
| Full repository test suite at candidate verification | PASS - 903/903 |
| TypeScript project validation | PASS |
| Scoped implementation/test lint | PASS |
| Exact four-file implementation/test scope | PASS |
| Foundation ancestry | PASS |
| Dependency manifest/lockfile drift | PASS - none |
| Timeline generated by Review A | PASS - 894,155 assertions across 5,729 timelines |
| Replay generated by Review A | PASS - 9,261 identity/replay assertions |
| Fresh timing combinations from Review B | PASS - 5,010 plus identity/replay probes |
| One-to-ten item range and 1400 ms ceiling | PASS |
| Cancel/background/reduced-motion terminal settlement | PASS |
| Exact-triple replay and delimiter collision handling | PASS |
| Persistence/network/media/timers/animation loops | PASS - none |
| Independent code/security review | PASS - 0 findings |
| Independent fresh lifecycle/motion review | PASS - 0 findings |
| Push, deployment or external-service mutation | None |
| Cost | NOK 0 |

## Deviations from plan

None. The four implementation/test files match the declared scope, no
dependency or shared motion-grammar file changed, and no implementation edits
were made after the two exact-SHA approvals.

## User setup required

None.

## Rollback

Do not integrate the candidate, or revert the isolated Plan 03-02 commit range
after foundation `de2cbd9a600423e19e204f3929e8eb78053ce46d` through candidate
`bd193ba5706bde75e40a83fed4725e3ec2adc024`. These primitives are not yet
wired into runtime UI and own no external or persistent state.

## Next phase readiness

Plan 03-02 is complete. Its pure timeline and replay primitives are ready for
the later transition snapshot/eligibility, coordinator and overlay plans.
Plan 03-03 was not started as part of this completion step.

---

*Phase: 03-living-home-signature-transition*
*Plan: 03-02*
*Completed: 2026-07-24*
