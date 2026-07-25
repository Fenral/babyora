---
phase: 01-planlegg-dagslinjen
plan: "03"
subsystem: planning-truth
tags: [planning-events, coverage, rail-rows, view-model, europe-oslo, dst, tdd]

requires:
  - phase: 01-planlegg-dagslinjen
    plan: "02"
    provides: Approved forecast provenance and absolute Europe/Oslo coverage on candidate 7105265
provides:
  - Deterministic canonical planning events with stable absolute-time identity and verb-led action copy
  - Coverage- and recommendation-aware rail rows with canonical action ordering
  - Conservative six-state Planlegg view model that fails malformed or incomplete evidence closed
affects: [01-05-context-resolver, 01-06-uke-migration, 01-07-planlegg-composition, 01-18-zero-import-proof]

tech-stack:
  added: []
  patterns: [canonical-event-comparator, fail-closed-runtime-boundary, evidence-bounded-view-model]

key-files:
  created:
    - src/lib/planning/plan-view-model.ts
    - src/lib/planning/__tests__/plan-view-model.test.ts
  modified:
    - src/lib/planning/change-events.ts
    - src/lib/planning/change-sentence.ts
    - src/lib/planning/rail-rows.ts
    - src/lib/planning/__tests__/change-events.test.ts
    - src/lib/planning/__tests__/change-sentence.test.ts
    - src/lib/planning/__tests__/rail-rows.test.ts

key-decisions:
  - "Canonical PlanningPoint, PlanningChangeEvent and PlanningRailRow remain separate from the deprecated hour-only adapters until Plan 01-06 atomically migrates both runtime consumers."
  - "Advice is publishable only inside structurally truthful weather coverage and recommendation evidence; malformed, conflicting, sparse or out-of-bounds evidence returns the advice-free error model."
  - "Event and rail ordering share one canonical absolute-time, kind-priority and content comparator; stable IDs never substitute for semantic ordering."
  - "Outfit availability is accepted only from an explicitly owned parent-supplied event key; inherited properties and future DTO construction are rejected."

patterns-established:
  - "Canonical planning seams validate runtime evidence without routing through lossy legacy adapters."
  - "Location, prep and rain require explicit action-bearing transitions; passive weather never creates clothing advice."
  - "Coverage status, cadence, ISO/epoch, Europe/Oslo local fields and start/end must agree before strong copy is allowed."

requirements-completed: [TRUTH-01, EVID-02, GOV-04]

coverage:
  - id: D1
    description: "Stable recommendation-change events and exact verb-led action grammar"
    requirement: TRUTH-01
    verification:
      - kind: unit
        ref: "src/lib/planning/__tests__/change-events.test.ts and change-sentence.test.ts"
        status: pass
      - kind: other
        ref: "Fresh exact-archive focused planning run: 50/50 passed"
        status: pass
    human_judgment: false
  - id: D2
    description: "Coverage-aware rail rows preserve canonical event identity, order and evidence-supported copy"
    requirement: EVID-02
    verification:
      - kind: unit
        ref: "src/lib/planning/__tests__/rail-rows.test.ts"
        status: pass
      - kind: other
        ref: "Independent 41-case adversarial matrix on exact SHA a8a6c3f"
        status: pass
    human_judgment: false
  - id: D3
    description: "Loading, error, offline, partial, empty and ready Planlegg states fail incomplete evidence closed"
    requirement: TRUTH-01
    verification:
      - kind: unit
        ref: "src/lib/planning/__tests__/plan-view-model.test.ts"
        status: pass
      - kind: other
        ref: "Full suite 709 passed, 24 inherited TODO; lint, TypeScript, main and bare builds passed"
        status: pass
    human_judgment: false
  - id: D4
    description: "Immutable high-risk event/advice candidate verified independently in two lanes"
    requirement: GOV-04
    verification:
      - kind: other
        ref: "Candidate a8a6c3f1c5f5b553cc56baf98075b9fc4ca8e37b; fresh verifier PASS and external adversarial PASS"
        status: pass
    human_judgment: true
    rationale: "Repository governance requires fresh independent high-risk judgments bound to the exact candidate SHA; both required judgments passed."

duration: 89min
completed: 2026-07-23
status: complete
review_status: passed_two_independent_verdicts
---

# Phase 1 Plan 03: Truthful Planning Transitions Summary

**Absolute-time recommendation events, coverage-aware rails and a fail-closed six-state Planlegg model now preserve one canonical action order without changing the recommendation motor or current UI consumers.**

## Performance

- **Duration:** 89 min
- **Started:** 2026-07-23T12:51:43+02:00
- **Completed:** 2026-07-23T14:20:09+02:00
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Added canonical `PlanningPoint` and `PlanningChangeEvent` derivation with stable absolute-instant IDs, separate additions/removals, true swaps, explicit rain/location/prep actions, DST-safe ordering and exact Norwegian action grammar.
- Added `PlanningRailRow` derivation that uses recommendation points—not weather presence—as outfit evidence, validates canonical coverage, keeps event/row order coherent and accepts only own parent-supplied Outfit availability.
- Added a pure aggregate Planlegg model for loading, no-cache error, cached offline, partial, empty and ready states; invalid, sparse, stale, conflicting or out-of-bounds evidence exposes no verdict or action.
- Preserved the unchanged current UkeScreen and PlanChangeRail on isolated deprecated hour-only adapters pending the atomic Plan 01-06 migration.

## Task Commits

1. **Task 1 RED: Stable event and action contracts** — `8f2af50`
2. **Task 1 GREEN: Truthful planning transitions** — `ee30dee`
3. **Task 2 RED: Coverage-aware rail contracts** — `855e276`
4. **Task 2 GREEN: Coverage-aware rail rows** — `53c0286`
5. **Task 3 RED: Conservative aggregate contracts** — `ea9fdc4`
6. **Task 3 GREEN: Six-state Planlegg model** — `2b7ff46`
7. **Repair RED/GREEN: Incomplete evidence** — `22101c5`, `7875cf0`
8. **Repair RED/GREEN: Malformed, stale and conflicting evidence** — `65282c2`, `98289f2`, `15a59e4`
9. **Repair RED/GREEN: Recommendation cadence and action ties** — `43bb183`, `0e13afe`, `e01fc00`
10. **Repair RED/GREEN: Advice bounds and runtime containers** — `680e4f4`, `f170d46`, `067baf6`
11. **Repair RED/GREEN: Malformed rail containers** — `b8555d4`, `ae082d6`
12. **Repair RED/GREEN: Coverage and explicit transitions** — `b84e3e6`, `549f9f5`
13. **Repair RED/GREEN: Own canonical kinds** — `28a3610`, `417a8f8`
14. **Repair RED/GREEN: Same-instant evaluated actions** — `baf9528`, `e449ede`
15. **Final RED/GREEN: Equal-kind ordering and Outfit own keys** — `f0d1f6d`, `a8a6c3f`

## Files Created/Modified

- `src/lib/planning/change-events.ts` — Canonical points/events, normalization, stable IDs and shared semantic comparator; legacy adapter remains isolated.
- `src/lib/planning/change-sentence.ts` — Total canonical verb grammar plus unchanged legacy copy adapter.
- `src/lib/planning/rail-rows.ts` — Canonical coverage validation, evidence spans, change rows and shared action ordering.
- `src/lib/planning/plan-view-model.ts` — Pure fail-closed aggregate Planlegg state.
- `src/lib/planning/__tests__/change-events.test.ts` — Event identity, tie, DST, malformed and legacy isolation contracts.
- `src/lib/planning/__tests__/change-sentence.test.ts` — Exact canonical and frozen legacy grammar.
- `src/lib/planning/__tests__/rail-rows.test.ts` — Coverage, ordering, availability and runtime-boundary contracts.
- `src/lib/planning/__tests__/plan-view-model.test.ts` — Six-state, evidence-bound and deterministic aggregate contracts.

## Deterministic Evidence

All final executable evidence ran from a fresh `npm ci` archive of exact candidate `a8a6c3f1c5f5b553cc56baf98075b9fc4ca8e37b`.

- Focused planning suites — **PASS**, 4 files and 50 tests.
- Unchanged clothing motor/recommendation suites — **PASS**, 19 files and 294 tests.
- Full suite — **PASS**, 61 files passed, 3 skipped; 709 tests passed and 24 inherited TODO.
- Standalone TypeScript, ESLint, TypeScript project build, main Vite build and bare Vite build — **PASS**.
- Exact archive binding — **PASS**, 1,850/1,850 tracked blobs matched; all eight plan blobs matched directly.
- `git diff --check 25e5c5b..a8a6c3f` — **PASS**.
- Scope manifest — **PASS**, exactly the eight plan-owned paths; no package, API, schema, media, UI consumer, access or recommendation-engine changes.
- Independent adversarial matrix — **PASS**, 41/41 malformed, coverage, bounds, cadence, tie, conflict, DST, copy and availability probes.

## Candidate and Review Authority

| Candidate | Authority | Verdict |
|---|---|---|
| `2b7ff467f2218f9f32b737e9dd31483d6db413b8` | Initial implementation | **BLOCKED** by both independent lanes |
| `7875cf0217aa1fac19a8bb44b8fa45e4fcc95c85` | First repair | **BLOCKED** by both independent lanes |
| `15a59e4d2722bd351456e0d48981db87a3768c60` | Second repair | Withdrawn by executor self-audit; no verdict |
| `e01fc009803943340fe44f4f49267f07720ceda3` through `e449ede9cb70d7faeb08f42e37d463c821321bbf` | Scoped TDD repairs | Superseded whenever either lane or self-audit reproduced a material exact-SHA gap; no PASS carried forward |
| `a8a6c3f1c5f5b553cc56baf98075b9fc4ca8e37b` | Fresh independent `verify_01_03_final`, high-risk read-only lane | **PASS**, P0 0 / P1 0 / P2 0 |
| `a8a6c3f1c5f5b553cc56baf98075b9fc4ca8e37b` | Fresh external adversarial read-only lane | **PASS**, P0 0 / P1 0 / P2 0 |

The strictest-verdict rule rejected every earlier blocked or superseded SHA. Only `a8a6c3f1c5f5b553cc56baf98075b9fc4ca8e37b` has two independent PASS verdicts.

## Decisions Made

- Kept canonical runtime validation at the plan-owned canonical seams. A new adapter/service would expand architecture and routing beyond the locked plan; the deprecated adapters remain behavior-frozen for current UI only.
- Reused one exported canonical event comparator in rail construction so kind and equal-kind ties cannot drift between events, rows and `nextAction`.
- Validated coverage structure and status before copy rather than trusting caller labels; stale status remains explicit and never gains strong full-span copy.
- Allowed duplicate evaluated instants only as a deduplicated time set for legitimate multiple actions; duplicate forecast coverage instants remain invalid.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Closed incomplete recommendation-evidence publication**
- **Found during:** Independent review after Task 3
- **Issue:** One-point, expired, sampled-between, fingerprint-conflicting and weather-only evidence could support rows or advice.
- **Fix:** Added recommendation-bound checks, evaluated-point spans, canonical instant identity and fail-closed conflicts.
- **Files modified:** Event, rail and view-model modules/tests.
- **Verification:** Focused regressions and both final independent matrices pass.
- **Committed in:** `22101c5`, `7875cf0`

**2. [Rule 1 - Bug] Made malformed runtime evidence total and advice-free**
- **Found during:** Independent malformed-input probes
- **Issue:** Invalid transition actions, missing fields, null containers and circular values could throw or fabricate actions.
- **Fix:** Added explicit discriminators, exact transition content and total canonical seam guards.
- **Files modified:** All four canonical planning modules and tests.
- **Verification:** Final malformed/null/circular/prototype probes pass.
- **Committed in:** `65282c2` through `ae082d6`

**3. [Rule 1 - Bug] Unified same-instant semantic ordering**
- **Found during:** Independent tie-order probes
- **Issue:** Same-time actions could be rejected or rows could reorder them by hash ID.
- **Fix:** Separated recommendation conflicts from legitimate action ties, deduplicated evaluated times and shared the canonical event comparator with rail rows.
- **Files modified:** Event, rail and view-model modules/tests.
- **Verification:** Location/prep and prep/prep event-row-nextAction coherence passes in both lanes.
- **Committed in:** `43bb183` through `a8a6c3f`

**4. [Rule 2 - Missing Critical] Validated coverage claims before strong copy**
- **Found during:** Adversarial forged-evidence probes
- **Issue:** Caller-forged cadence, local time, duplicate epochs or incomplete evaluated sets could produce unsupported full-span wording.
- **Fix:** Added one canonical coverage validator for status, cadence, order, ISO/epoch, Europe/Oslo fields and start/end; the view model reuses it.
- **Files modified:** `rail-rows.ts`, `plan-view-model.ts` and tests.
- **Verification:** Coverage matrix and final dual review pass.
- **Committed in:** `b84e3e6`, `549f9f5`

**5. [Rule 3 - Blocking] Preserved TypeScript event typing after runtime array guard**
- **Found during:** Exact-archive full build
- **Issue:** `Array.isArray` widened canonical events and broke project-build indexing.
- **Fix:** Restored the readonly `PlanningChangeEvent` type after the runtime guard.
- **Files modified:** `rail-rows.ts`
- **Verification:** TypeScript, lint and both builds pass.
- **Committed in:** `067baf6`

---

**Total deviations:** 5 auto-fixed (3 Rule 1 bugs, 1 Rule 2 critical truth guard, 1 Rule 3 build blocker).
**Impact on plan:** Every repair enforces the existing truth, evidence and deterministic-order contracts inside the same eight files. No package, engine, DTO, API, schema, UI consumer or media scope was added.

## Issues Encountered

- The primary checkout had an incomplete and locked generated dependency tree. Final evidence therefore ran from fresh exact-SHA archives with `npm ci`; no package files changed.
- `npm ci` reported the pre-existing audit baseline of 14 findings (1 low, 3 moderate, 9 high, 1 critical). Dependency remediation is outside this package-free plan.
- Earlier exact candidates were deliberately rejected or withdrawn whenever the strictest lane reproduced a material issue; no earlier PASS was carried to the final SHA.

## TDD Gate Compliance

- RED commits precede every task GREEN commit.
- Every independent-review repair was reproduced by a committed failing contract before production changes.
- Final history contains the required `test(...)` and later `feat(...)` gates, followed by scoped `fix(...)` repair pairs.

## Known Stubs

No new stubs exist in the eight plan-owned files. The full repository suite still reports 24 inherited future-plan TODO tests outside this plan's completed behavior.

## User Setup Required

None - no packages, services, environment variables or external configuration were added.

## Next Phase Readiness

- Exact candidate `a8a6c3f1c5f5b553cc56baf98075b9fc4ca8e37b` is ready for downstream Planlegg context and consumer work.
- Plan 01-06 alone still owns the atomic UkeScreen/PlanChangeRail migration; Plan 01-18 still owns zero-runtime-import proof before any standalone legacy-source deletion.
- New app media, physical-device evidence, media-based 90+ visual scoring and release approval remain Pending by owner policy and were not exercised.

## Self-Check: PASSED

All eight plan-owned files and this summary exist. Initial RED/GREEN task commits and final candidate `a8a6c3f` are present in history. The plan-owned files contain no TODO, FIXME or placeholder markers.

---
*Phase: 01-planlegg-dagslinjen*
*Completed: 2026-07-23*
