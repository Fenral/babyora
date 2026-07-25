---
phase: 02-outfit-truth-antrekkskart
plan: "01"
subsystem: outfit-truth
tags: [outfit, inventory, body-anchors, avatar, transition, hostile-inputs]

requires:
  - phase: 01-planlegg-dagslinjen
    provides: finalized recommendation and immutable drill context
provides:
  - exhaustive semantic outfit inventory with locked cardinality and coverage metrics
  - immutable occurrence-level outfit truth and normalized body anchors
  - exact verified avatar resolution with neutral fallback
  - exact Outfit target-row readiness for later visual transfer work
affects: [02-02, 02-03, outfit, antrekkskart, avatar, phase-3-transition]

tech-stack:
  added: []
  patterns:
    - exact own/plain descriptor-snapshotted runtime data graphs
    - stable occurrence IDs instead of label identity
    - one finalized recommendation projected into list, anchor, avatar, and transition truth

key-files:
  created:
    - scripts/outfit/inventory-v1.ts
    - scripts/outfit/__tests__/inventory-v1.test.ts
    - src/lib/outfit/avatar-visibility-catalog.ts
    - src/lib/outfit/body-anchor-catalog.ts
    - src/lib/outfit/outfit-avatar-truth.ts
    - src/lib/outfit/outfit-transition-contract.ts
    - src/lib/outfit/outfit-truth.ts
    - src/lib/outfit/__tests__/body-anchor-coverage.test.ts
    - src/lib/outfit/__tests__/outfit-avatar-truth.test.ts
    - src/lib/outfit/__tests__/outfit-transition-contract.test.ts
    - src/lib/outfit/__tests__/outfit-truth.test.ts
  modified: []

key-decisions:
  - "Garment truth is occurrence-based: duplicate source labels remain distinct ordered item IDs."
  - "The avatar is verified only for an exact pose and visible catalog set; every uncertain or malformed case is neutral."
  - "The truth factory consumes one supplied finalized recommendation and projects exact three-field records into the strict avatar resolver."
  - "Transition readiness requires the canonical factory snapshot, exact identity, and one connected real Element per garment."

patterns-established:
  - "Runtime truth boundaries snapshot exact own enumerable data descriptors before semantic access."
  - "Equipment is classified separately and never inflates garment cardinality, body nodes, or avatar visibility."
  - "One-to-ten garments are supported; an eleven-garment recommendation is represented explicitly as unsupported cardinality."

requirements-completed: []
completed: 2026-07-24
status: complete
---

# Phase 2 Plan 01: Outfit Truth Foundation Summary

**Exhaustive inventory, immutable occurrence truth, truthful verified-avatar
resolution, and exact target-row readiness bound to independently reviewed
candidate `5f2217e`.**

## Plan Status

- **Implementation candidate:** `5f2217eb46ea64a33bfafe24c588c434cd30a0f3`
- **Implementation tree:** `1aa17e4649ab0b4e16deb44487381ed8bc1d5ef9`
- **Foundation:** `807bf66e11cdf255db99e1f19269545bedd6209c`
- **Scope:** Exactly 11 implementation/test files
- **Independent reviews:** 2 PASS, 0 blockers, 0 warnings, 0 findings
- **External cost:** 0
- **Status:** Complete

This plan establishes the truth substrate for `OUTFIT-01` and `OUTFIT-02`; it
does not claim that the later Antrekkskart UI and interactions are complete.

## Accomplishments

- Exhaustively enumerated 2,036,160 branch-representative recommendation
  scenarios and locked catalog, body, equipment, and cardinality metrics.
- Classified every observed output as semantic garment or equipment, with
  70/70 catalog coverage and 57/57 garment body-anchor coverage.
- Built immutable occurrence-level truth with stable item IDs, deterministic
  order, exact provenance, separate equipment, body anchors, avatar truth, and
  supported/unsupported cardinality results.
- Bound all 24 checked-in sitting/standing avatar composites to exact visible
  catalog sets and explicit layer occlusion; uncertain states remain neutral.
- Defined target-row readiness for exact snapshot identity and one connected
  real DOM `Element` per garment without introducing Home geometry ownership.
- Hardened truth, coverage, resolver, identity, row, and array boundaries against
  inherited values, custom prototypes, accessors, symbols, non-enumerable and
  extra properties, sparse arrays, and prototype pollution.
- Closed the final factory integration gap by projecting rich garment drafts to
  fresh exact `{itemId, catalogGarmentId, avatarCoverage}` records before avatar
  resolution.

## Locked Inventory

| Metric | Result |
|---|---:|
| Scenarios | 2,036,160 |
| Unique outputs | 70 |
| Catalog coverage | 70/70 |
| Semantic garments | 57 |
| Garment body coverage | 57/57 |
| Semantic equipment | 13 |
| Maximum equipment items | 6 |
| Maximum garment items | 11 |
| Scenarios above supported 10-garment limit | 12,960 |
| Scenarios below one garment | 0 |
| Unmapped catalog/body outputs | 0/0 |

Inventory bindings:

- `scripts/outfit/inventory-v1.ts`:
  `d4af276900bdfbdde9a27a00f5620e49c294c41a`
- `scripts/outfit/__tests__/inventory-v1.test.ts`:
  `5c6a3db2adbbcddcaae956b56d17650e0110cb57`

The maximum garment case is the locked age-0, awake-vogn, -30 C, wind 8 m/s
fixture with 11 ordered semantic garments. It returns
`unsupported-cardinality` instead of hiding an item or emitting a partial truth.

## Canonical Truth and Integration

```text
supplied finalized recommendation
  -> semantic garment/equipment occurrences
  -> stable ordered item IDs and normalized body anchors
  -> exact three-field avatar projection
  -> verified composite or neutral avatar
  -> recursively frozen canonical snapshot
  -> exact identity + connected target-row readiness
```

- The factory does not rerun the recommendation engine.
- Duplicate labels remain distinct occurrences.
- Garments, equipment, anchors, avatar visibility, and target rows share the
  same stable occurrence IDs.
- The canonical age-0, awake-vogn, 28 C fixture resolves to
  `/avatars/verified/sit-1-sommer.png` with both ordered visible occurrence IDs.
- Direct resolver tests cover all 24 manifest rows; independent review also
  reproduced representative sitting and standing positives and `std-6`
  occlusion.
- Invalid or unverifiable avatar data exposes no verified asset.
- Invalid transition data is static-only and never becomes animation-ready.
- Real connected Elements remain supported; SSR without `Element` fails closed.

## Verification

| Gate | Result |
|---|---|
| Canonical outfit truth | 45/45 passed |
| Five-file Plan 02-01 suite | 108/108 passed |
| Inventory assertion | 2,036,160 scenarios and all locked metrics passed |
| Full Vitest suite | 936 passed, 1 skipped, 9 todo |
| ESLint | Passed |
| TypeScript project build | Passed |
| Main and bare Vite builds | Passed |
| Standalone `tsc -b` | Passed |
| 24-row avatar manifest | Passed |
| Hostile own/plain data-graph matrix | Passed |
| Exact foundation ancestry and 11-file scope | Passed |
| Candidate diff check and worktree cleanliness | Passed |

Detailed immutable bindings and both review lanes are recorded in
[`evidence/02-01-INDEPENDENT-REVIEW.md`](evidence/02-01-INDEPENDENT-REVIEW.md).

## Independent Reviews

| Reviewer | Candidate | Verdict |
|---|---|---|
| `/root/run_phase3_plan01`, identity `Phase2-02-01-Review-A-remediated` | `5f2217e` | **PASS**, 0 findings, cost 0 |
| `/root/snart_01_13_review_a_attempt_2` | `5f2217e` / tree `1aa17e4` | **PASS**, 0 findings, cost 0 |

Both lanes independently bound their result to the exact implementation
candidate, foundation, authorized scope, and clean tree. No executor self-PASS
is used as a substitute for those verdicts.

## TDD and Fix Commits

1. `64242bf` - define inventory and anchor contracts
2. `39c3c95` - freeze semantic outfit inventory
3. `ae82248` - preserve typed anchor invariants
4. `559867b` - define immutable outfit and avatar truth
5. `1271d52` - build immutable occurrence truth
6. `767695a` - define Outfit row readiness contract
7. `5c3045b` - freeze target readiness semantics
8. `7da2719` - expose provenance and DOM readiness gaps
9. `4671d3c` - derive provenance and require live Elements
10. `8219d3f` - clarify canonical content provenance
11. `8e66408` - expose input graph and sparse-array gaps
12. `1bae9e4` - validate canonical input graphs fail closed
13. `cbe1b63` - expose blank garment-label acceptance
14. `9ea77d5` - reject blank garment labels
15. `c68293d` - reject inherited catalog lookups
16. `d31c50f` - expose avatar/transition data-graph bypasses
17. `20a54bb` - validate avatar/transition data graphs
18. `4118252` - type hostile accessor fixtures
19. `f09c962` - expose factory/avatar projection gap
20. `5f2217e` - project exact avatar resolver records

## Deviations and Review Repairs

### Auto-fixed Issues

**1. Provenance and DOM readiness were initially structural rather than
factory/live-bound**

- Added factory snapshot provenance and required connected real Elements.
- Reproduced and repaired through `7da2719` / `4671d3c`.

**2. Canonical input boundaries accepted malformed own-data graphs**

- Added dense-array, exact-record, blank-label, and inherited catalog guards.
- Reproduced and repaired through `8e66408`-`c68293d`.

**3. Avatar and transition boundaries accepted inherited or decorated data**

- Added descriptor-only exact own/plain snapshots and fail-closed behavior
  without invoking throwing getters.
- Reproduced and repaired through `d31c50f` / `20a54bb`.

**4. The strict resolver exposed a factory integration mismatch**

- Candidate `4118252` was rejected because the factory passed rich garment
  drafts into the exact three-field resolver contract.
- Added a positive real-recommendation integration regression in `f09c962`.
- Projected fresh exact records at the factory call site in `5f2217e` without
  weakening the resolver or rerunning recommendation.
- Both final independent lanes passed candidate `5f2217e` with zero findings.

All deviations remained within the exact 11-file Plan 02-01 boundary.

## Files Created

- `scripts/outfit/inventory-v1.ts`
- `scripts/outfit/__tests__/inventory-v1.test.ts`
- `src/lib/outfit/avatar-visibility-catalog.ts`
- `src/lib/outfit/body-anchor-catalog.ts`
- `src/lib/outfit/outfit-avatar-truth.ts`
- `src/lib/outfit/outfit-transition-contract.ts`
- `src/lib/outfit/outfit-truth.ts`
- `src/lib/outfit/__tests__/body-anchor-coverage.test.ts`
- `src/lib/outfit/__tests__/outfit-avatar-truth.test.ts`
- `src/lib/outfit/__tests__/outfit-transition-contract.test.ts`
- `src/lib/outfit/__tests__/outfit-truth.test.ts`

## Cost, Dependencies, and Prohibited Actions

- Cost: **0**
- Dependencies added or changed: **none**
- Network/API calls: **none**
- Media generation/capture: **none**
- Push/deployment/release actions: **none**
- Recommendation thresholds, guardrails, Motor V2, pricing, RevenueCat,
  analytics, family backend, notifications, widgets, unrelated screens, and
  avatar assets: **unchanged**

## Rollback

Treat the 11 implementation/test files as one truth-contract unit. Revert the
Plan 02-01 implementation commits from `5f2217e` through `64242bf` in reverse
order to foundation `807bf66`, then rerun inventory, focused, full, lint, build,
and TypeScript gates. Do not revert only the factory projection while retaining
the strict resolver, and do not separate catalogs from their coverage and truth
tests.

The docs-only completion commit containing this summary and its evidence file
may be reverted independently.

## User Setup Required

None. No package, credential, environment, service, or data migration is
required.

## Next Plan Readiness

- Plan 02-01 is complete with two independent exact-SHA PASS verdicts.
- The canonical truth substrate is ready for Plan 02-02.
- Plan 02-02 was not started as part of this completion work.
- Later Antrekkskart UI, alternatives, recovery copy, accessibility/device
  evidence, media audit, and release approval remain owned by later plans.

---

*Phase: 02-outfit-truth-antrekkskart*
*Plan: 02-01*
*Completed: 2026-07-24*
