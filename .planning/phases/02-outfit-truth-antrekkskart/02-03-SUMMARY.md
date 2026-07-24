---
phase: 02-outfit-truth-antrekkskart
plan: "03"
plan_id: "02-03"
status: PASS
subsystem: outfit-map-layout
tags: [outfit, antrekkskart, geometry, accessibility, responsive, hostile-inputs]

candidate_sha: be3e82e7e14428b97f1181da578b7f60b89fbd4f
candidate_tree: 4bc91e37a75cf77baa1435c9e91151796cc7a584
dependency_plan: "02-01"
dependency_sha: 5f2217eb46ea64a33bfafe24c588c434cd30a0f3
dependency_tree: 1aa17e4649ab0b4e16deb44487381ed8bc1d5ef9
dependency_ancestry: PASS
documentation_base_sha: 0f8be9fba5ba639266d03b5e3590c96f6e91bbb1
documentation_base_tree: 48b06be52633b0a5c6582503ed866b17b71a8226
initial_red_sha: c8714877e31b4030d0b34b8f24c732ea133fcf54
initial_red_tree: 5728b8bf9174437090b18232d61e636167da3d0c
rejected_candidate_sha: 11efaf9f28a79dd002107c632b2630a9a380d150
rejected_candidate_tree: 6dceb4b483cdb75577af9729f2436959fa8d7d8a
repair_red_sha: 1bc11473fc873c8a22ab6a1f8d71c857815766fa
repair_red_tree: 34014b347d82bc21f75f1ff7a2220f6b17c458c9

inventory:
  script_blob: d4af276900bdfbdde9a27a00f5620e49c294c41a
  test_blob: 5c6a3db2adbbcddcaae956b56d17650e0110cb57
  scenario_count: 2036160
  status: PASS

review:
  reviewer_id: phase2-02-03-independent-review-existing-session
  session: /root/phase3_03_03_contract_review_a_attempt6
  existing_session: true
  fresh_to_candidate: true
  independent_from_implementation: true
  fork_turns_none_claimed: false
  fresh_context_claimed: false
  verdict: PASS
  findings: 0

requires:
  - phase: 02-outfit-truth-antrekkskart
    plan: "01"
    candidate_sha: 5f2217eb46ea64a33bfafe24c588c434cd30a0f3
    provides: immutable ordered garment truth and normalized semantic body anchors
provides:
  - deterministic spacious and compact-rail presentation geometry for 1-10 garments
  - exact semantic body-anchor connector targets with equipment excluded
  - typed map-ineligible fallback for unsupported, malformed, or hostile input
affects: [02-04, 02-06, 02-07, outfit, antrekkskart, phase-3-transition]

tech-stack:
  added: []
  patterns:
    - responsive coordinates remain presentation-only output
    - canonical occurrence order drives complete one-node-per-garment layout
    - public reflection failures are contained as deterministic typed ineligibility

key-files:
  created:
    - src/lib/outfit/outfit-map-layout.ts
    - src/lib/outfit/__tests__/outfit-map-layout.test.ts
  modified: []

key-decisions:
  - "Counts 1-4 use spacious layout; counts 5-10 use exactly two ordered compact rails with at most five nodes per rail."
  - "The locked 11-garment equivalence class remains complete list-only truth and never creates a third density mode."
  - "Selection state is absent from layout input, and semantic truth never receives viewport coordinates."
  - "Snapshot reflection failures return invalid-snapshot; constraint reflection failures return invalid-constraints."

patterns-established:
  - "Every eligible garment occurrence receives exactly one numbered node and one semantic-anchor connector."
  - "All layout validation is bounded and deterministic, with no collision-search loop or partial output."
  - "Throwing and revoked Proxy inputs cannot escape the public layout boundary."

requirements-completed:
  - OUTFIT-01

coverage:
  - id: D1
    description: Counts 1-10 retain exact occurrence order with one bounded, non-overlapping node and connector per garment.
    requirement: OUTFIT-01
    verification:
      - kind: unit
        ref: "60 count/width/text-scale combinations in outfit-map-layout.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: Connector endpoints derive from semantic body anchors and equipment never enters body-connected layout.
    requirement: OUTFIT-01
    verification:
      - kind: integration
        ref: "npx vitest run src/lib/outfit/__tests__/outfit-map-layout.test.ts src/lib/outfit/__tests__/outfit-truth.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: Selection cannot affect geometry and responsive coordinates remain outside canonical truth.
    requirement: OUTFIT-01
    verification:
      - kind: unit
        ref: "selection-independence and snapshot-immutability matrix"
        status: pass
    human_judgment: false
  - id: D4
    description: Unsupported cardinality and hostile snapshot or constraint reflection fail closed without a partial layout.
    requirement: OUTFIT-01
    verification:
      - kind: unit
        ref: "hostile snapshot/options Proxy regression matrix"
        status: pass
      - kind: integration
        ref: "npx tsx scripts/outfit/inventory-v1.ts --assert"
        status: pass
    human_judgment: false

completed: 2026-07-24
external_cost: 0
push_performed: false
deploy_performed: false
---

# Phase 2 Plan 03: Responsive Antrekkskart Geometry Summary

**Canonical ordered garment truth now produces deterministic, bounded
presentation geometry for every supported 1-10-garment outfit, while invalid,
unsupported, or hostile inputs preserve the complete static list through typed
map ineligibility.**

## Plan Status

- **Plan ID:** `02-03`
- **Implementation candidate:**
  `be3e82e7e14428b97f1181da578b7f60b89fbd4f`
- **Implementation tree:** `4bc91e37a75cf77baa1435c9e91151796cc7a584`
- **Required Plan 02-01 candidate:**
  `5f2217eb46ea64a33bfafe24c588c434cd30a0f3`
- **Plan 02-01 ancestry:** PASS
- **Documentation base:**
  `0f8be9fba5ba639266d03b5e3590c96f6e91bbb1`
- **Scope:** Exactly two authorized implementation/test files
- **Independent review:** One PASS receipt, 0 findings
- **Review provenance:** Existing session, fresh to candidate, independent from
  implementation
- **External cost:** 0
- **Status:** **PASS**

The review receipt does not claim `fork_turns: none` or
`fresh_context: true`. Its actual provenance is recorded explicitly in this
summary and the independent-review evidence file.

The documentation-only completion commit containing this summary and its
evidence file changes no implementation, test, inventory, package, dependency,
runtime, network, or storage behavior.

## Accomplishments

- Added a pure `layoutOutfitMap` boundary that accepts canonical supported
  outfit truth and emits deeply immutable presentation geometry.
- Produced `spacious` layouts for 1-4 garments and exactly two deterministic
  `compact-rails` for 5-10 garments, with at most five nodes per rail.
- Preserved canonical inner-first occurrence order and emitted one numbered
  node and one connector for every eligible garment without aggregation,
  truncation, hiding, or partial output.
- Bound connector endpoints to normalized semantic body anchors while keeping
  equipment outside body-connected layout.
- Kept selection and focus state outside the geometry contract, so every
  possible selected occurrence yields deeply equal layout output.
- Preserved the locked 11-garment case as complete ordered list-only truth with
  typed `unsupported-cardinality`.
- Rejected invalid widths, text constraints, snapshots, garment counts, body
  anchors, and geometry through typed map-ineligible results.
- Contained throwing and revoked Proxy reflection at the public boundary:
  hostile snapshot inspection maps to `invalid-snapshot`, while hostile options
  inspection maps to `invalid-constraints`.

## Responsive Geometry Contract

```text
canonical factory-owned outfit snapshot
  -> exact ordered semantic garments
  -> validated normalized body anchors
  -> spacious slots (1-4) or two compact rails (5-10)
  -> one bounded node and one connector per garment
  -> immutable presentation-only layout

invalid / unsupported / hostile input
  -> typed map-ineligible result
  -> complete ordered semantic list remains available
```

- Layout is bounded to finite positive geometry.
- Node boxes stay inside the available width and computed height.
- Node boxes do not overlap.
- Connector routes do not cross node interiors or one another.
- Connector endpoints equal the garment's semantic body anchor within the
  locked tolerance.
- Equipment is never allocated a body-connected node.
- Responsive coordinates never return to outfit truth.
- There is no third density mode and no unbounded collision loop.

## Count, Width, and Text Matrix

| Garment count | Widths | Text scales | Mode | Combinations | Result |
|---:|---|---|---|---:|---|
| 1-4 | 320, 390, 560 CSS px | 1.0, 2.0 | `spacious` | 24 | PASS |
| 5-10 | 320, 390, 560 CSS px | 1.0, 2.0 | `compact-rails` | 36 | PASS |
| **Total supported** | **3 widths** | **2 scales** | **2 approved modes** | **60** | **PASS** |
| 11 | presentation-independent | presentation-independent | none; list-only | locked fixture | PASS |

The 200%-text model enlarges targets without changing mode, occurrence order,
semantic targets, or completeness.

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

The locked age-0, awake-vogn, -30 C, wind 8 m/s case retains all 11 ordered
semantic garments outside map layout. It returns `unsupported-cardinality`
without hiding, merging, aggregating, or reordering any garment.

## Verification

| Gate | Result on reviewed candidate |
|---|---|
| Focused layout + truth suite | 2 files, 131/131 passed |
| Count/width/text-scale matrix | All 60 supported combinations passed |
| Hostile public-boundary matrix | Snapshot and options traps returned deterministic typed ineligibility |
| Inventory assertion | 2,036,160 scenarios and all locked metrics passed |
| Full Vitest suite | 76 passed files, 1 skipped; 1,022 passed tests, 9 todo |
| ESLint | Passed |
| Standalone `tsc -b --pretty false` | Passed |
| Main and bare production builds | Passed |
| Plan 02-01 and documentation-base ancestry | Passed |
| Exact two-file implementation scope | Passed |
| Package/lockfile immutability | Passed |
| Manifest and inventory bindings | Passed |
| `git diff --check` and candidate cleanliness | Passed |

Detailed immutable bindings, review provenance, candidate blobs, commands, and
scope evidence are recorded in
[`evidence/02-03-INDEPENDENT-REVIEW.md`](evidence/02-03-INDEPENDENT-REVIEW.md).

## Independent Review

| Reviewer / session | Provenance | Verdict |
|---|---|---|
| `phase2-02-03-independent-review-existing-session` / `/root/phase3_03_03_contract_review_a_attempt6` | `existing_session: true`; `fresh_to_candidate: true`; `independent_from_implementation: true` | **PASS**, 0 findings |

The receipt is independent from implementation and fresh to candidate
`be3e82e`, but it came from an existing session. No claim is made that the
session used `fork_turns: none` or was a wholly fresh context.

## TDD and Repair Chain

The implementation candidate contains these ordered commits after documentation
base `0f8be9fba5ba639266d03b5e3590c96f6e91bbb1`:

1. `c8714877e31b4030d0b34b8f24c732ea133fcf54` - RED: specify bounded outfit-map geometry
2. `11efaf9f28a79dd002107c632b2630a9a380d150` - GREEN: add deterministic outfit-map layout
3. `1bc11473fc873c8a22ab6a1f8d71c857815766fa` - RED: reproduce hostile reflection escapes
4. `be3e82e7e14428b97f1181da578b7f60b89fbd4f` - GREEN: contain hostile layout reflection

Every behavior change was preceded by a committed failing regression. The final
repair preserved the complete geometry matrix while closing the independent
review finding.

## Review Repair

### Hostile reflection could escape the public layout boundary

- Rejected candidate `11efaf9` accepted `snapshot: unknown` but allowed
  `Array.isArray` and `getOwnPropertyDescriptor` traps to escape before typed
  ineligibility.
- Constraint parsing likewise allowed revoked proxies and
  `getPrototypeOf`, `ownKeys`, or `getOwnPropertyDescriptor` traps to escape.
- Repair RED `1bc1147` added six exact failing cases plus nested
  getter/proxy non-invocation checks.
- Candidate `be3e82e` added minimal phase-specific outer containment:
  snapshot failures return `invalid-snapshot`; constraint failures return
  `invalid-constraints`.
- The repair does not alter canonical layout modes, slots, ordering, body
  anchors, geometry, or truth.

## Exact Two-File Scope

| Path | Candidate blob | Purpose |
|---|---|---|
| `src/lib/outfit/__tests__/outfit-map-layout.test.ts` | `29cb6b185d17ae592f1a1a891530c362d4cde03a` | Locks the complete responsive geometry matrix, list-only fallback, selection independence, and hostile reflection containment |
| `src/lib/outfit/outfit-map-layout.ts` | `0fee52ea5b570defb6179654a4a3b477678523e1` | Produces deterministic spacious/compact geometry or typed map ineligibility |

No truth, engine, package manifest, lockfile, media, Hjem, Uke, Paakledning,
state, or avatar path changed.

## Cost, Dependencies, and Prohibited Actions

- External API/tool spend: **0**
- New or changed dependencies: **none**
- Persistent storage: **none**
- Network/API calls: **none**
- Media generation or capture: **none**
- Push, deployment, or release action: **none**
- Recommendation thresholds, guardrails, Motor V2, pricing, RevenueCat,
  analytics, family infrastructure, notifications, widgets, unrelated screens,
  outfit truth, selection state, and avatar assets: **unchanged**

## Rollback

Treat the two implementation/test files as one Plan 02-03 geometry contract.
Revert commits from `be3e82e` through `c871487` in reverse chronological order
to return to documentation base
`0f8be9fba5ba639266d03b5e3590c96f6e91bbb1`. Then rerun the focused layout and
truth suites, inventory assertion, full suite, lint, TypeScript, builds,
ancestry, scope, package, manifest, and diff-cleanliness gates.

The documentation-only completion commit containing this summary and its
evidence file may be reverted independently.

## User Setup Required

None. No package, credential, environment, external service, persistence, or
data migration is required.

## Next Plan Readiness

- Plan 02-03 is complete with one independent exact-candidate PASS receipt.
- Its responsive geometry and fail-closed fallback contract are ready for
  dependent Plan 02-04 and later Antrekkskart integration.
- No later plan, push, deployment, or release action was started by this
  completion work.

---

*Phase: 02-outfit-truth-antrekkskart*
*Plan: 02-03*
*Completed: 2026-07-24*
