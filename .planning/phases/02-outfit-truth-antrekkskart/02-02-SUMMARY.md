---
phase: 02-outfit-truth-antrekkskart
plan: "02"
plan_id: "02-02"
status: PASS
subsystem: outfit-alternatives
tags: [outfit, alternatives, finalizer, selection, identity, hostile-inputs]

candidate_sha: ac20e97e106aa0953d70f38ec5427d5a6af9e3d5
candidate_tree: b2aebb3d60fb7f75729e02beebb7aba800b8f0d3
dependency_plan: "02-01"
dependency_sha: 5f2217eb46ea64a33bfafe24c588c434cd30a0f3
dependency_tree: 1aa17e4649ab0b4e16deb44487381ed8bc1d5ef9
dependency_ancestry: PASS
documentation_base_sha: 0f8be9fba5ba639266d03b5e3590c96f6e91bbb1

inventory:
  script_blob: d4af276900bdfbdde9a27a00f5620e49c294c41a
  test_blob: 5c6a3db2adbbcddcaae956b56d17650e0110cb57
  scenario_count: 2036160
  status: PASS

reviews:
  - lane: A
    reviewer_id: phase2-02-02-review-a-attempt3
    session: /root/phase2_02_02_review_a_attempt3
    capability: high-verification
    focus: occurrence-finalizer-safety
    fork_turns: none
    fresh_context: true
    verdict: PASS
    findings: 0
  - lane: B
    reviewer_id: phase2-02-02-review-b-attempt3
    session: /root/phase2_02_02_review_b_attempt3
    review_label: attempt3-resumed
    capability: high-verification
    focus: identity-state-privacy
    fresh_context: true
    verdict: PASS
    findings: 0

requires:
  - phase: 02-outfit-truth-antrekkskart
    plan: "01"
    candidate_sha: 5f2217eb46ea64a33bfafe24c588c434cd30a0f3
    provides: immutable occurrence-level outfit truth and exact snapshot identity
provides:
  - occurrence-specific alternatives backed by complete finalized outfit outcomes
  - deterministic typed diagnostics for omitted or hostile candidates
  - ephemeral exact-snapshot selection with atomic select, reset, and close
affects: [02-04, 02-06, 02-07, outfit, antrekkskart, alternative-selection]

tech-stack:
  added: []
  patterns:
    - static catalog data nominates candidates but never certifies safety
    - complete outcome snapshots replace label-keyed or partial swap state
    - public and catalog boundaries contain hostile reflection and fail closed

key-files:
  created:
    - src/lib/outfit/finalized-outfit-swap.ts
    - src/lib/outfit/alternative-options.ts
    - src/lib/outfit/__tests__/alternative-options.test.ts
    - src/state/outfit-selection-store.ts
    - src/state/__tests__/outfit-selection-store.test.ts
  modified: []

key-decisions:
  - "A selectable alternative must survive the existing safety finalizer and canonical supported-outfit builder as a complete new snapshot."
  - "Selection state is memory-only and bound to the exact base snapshot, option object, transition context, and outcome identity."
  - "Throwing or revoked Proxies at public, catalog, candidate, and store boundaries are contained and mapped to deterministic typed rejection."

patterns-established:
  - "Candidate catalog arrays and records are validated through own enumerable data descriptors before semantic values are used."
  - "Safety completeness requires both safetyFlags and severity, with severity equal to the highest finalized flag."
  - "Store mutation occurs only after complete base/option ownership validation."

requirements-completed:
  - OUTFIT-02

coverage:
  - id: D1
    description: Occurrence-specific candidates become selectable only as complete finalized supported outfit outcomes.
    requirement: OUTFIT-02
    verification:
      - kind: integration
        ref: "npx vitest run src/lib/outfit/__tests__/alternative-options.test.ts src/state/__tests__/outfit-selection-store.test.ts src/lib/wool-layers/__tests__/finalize-safety.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: Exact snapshot selection, reset, reopen, and close are deterministic and stale-context-safe.
    requirement: OUTFIT-02
    verification:
      - kind: unit
        ref: "src/state/__tests__/outfit-selection-store.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: Equipment and unsupported cardinality remain complete list-only truth with no selectable alternative.
    requirement: OUTFIT-02
    verification:
      - kind: integration
        ref: "npx tsx scripts/outfit/inventory-v1.ts --assert"
        status: pass
    human_judgment: false
  - id: D4
    description: Hostile accessors and Proxies fail closed without escaping or mutating selection state.
    requirement: OUTFIT-02
    verification:
      - kind: unit
        ref: "src/lib/outfit/__tests__/alternative-options.test.ts#hostile boundary matrices"
        status: pass
      - kind: unit
        ref: "src/state/__tests__/outfit-selection-store.test.ts#hostile options Proxy matrix"
        status: pass
    human_judgment: false

duration: 1h 7m
started: 2026-07-24T09:17:42+02:00
implementation_completed: 2026-07-24T10:24:20+02:00
completed: 2026-07-24
external_cost: 0
push_performed: false
deploy_performed: false
---

# Phase 2 Plan 02: Engine-Backed Outfit Alternatives Summary

**Occurrence-specific catalog nominations now become selectable only after the
existing safety finalizer and canonical outfit builder produce a complete,
immutable, exact-context outcome snapshot.**

## Plan Status

- **Plan ID:** `02-02`
- **Implementation candidate:**
  `ac20e97e106aa0953d70f38ec5427d5a6af9e3d5`
- **Implementation tree:** `b2aebb3d60fb7f75729e02beebb7aba800b8f0d3`
- **Required Plan 02-01 candidate:**
  `5f2217eb46ea64a33bfafe24c588c434cd30a0f3`
- **Plan 02-01 ancestry:** PASS
- **Scope:** Exactly five authorized implementation/test files
- **Independent reviews:** 2 distinct fresh-context PASS receipts, 0 findings
- **External cost:** 0
- **Status:** **PASS**

The documentation commit containing this summary and its evidence file changes
no implementation, test, inventory, dependency, storage, or network behavior.

## Accomplishments

- Built an occurrence-aware swap adapter that binds the exact source
  `itemId`/order/category/raw label, deep-clones the full finalized
  recommendation, invokes the existing `finalizeSafety`, verifies target
  survival, and emits a complete immutable outcome.
- Built deterministic alternative options whose catalog comparison text is
  informational only; the option exists only when both base and outcome are
  canonical supported 1-10-garment snapshots.
- Kept semantic equipment and the locked 11-garment case list-only, with no
  selectable option and no hidden or partial garment truth.
- Added an in-memory exact-snapshot selection store with atomic open/select,
  byte-equivalent reset, exact-context reopening, and complete close behavior.
- Rejected stale, forged, partial, mutable, identity-mismatched, ambiguous,
  unfinalizable, and hostile candidate or store inputs with deterministic typed
  diagnostics.
- Hardened public request, catalog entry, candidate record, dense-array, safety
  completeness, and selection-option boundaries against accessors and trapping
  or revoked Proxies.

## Finalization and Selection Contract

```text
static comparison catalog
  -> nominate one target for one exact garment occurrence
  -> validate complete base input + finalized recommendation
  -> clone complete categorized layers, notes, flags, and severity
  -> substitute the exact occurrence
  -> existing finalizeSafety
  -> verify target survival and count deltas
  -> canonical supported outfit outcome
  -> immutable option bound to exact base identity
  -> atomic whole-snapshot selection
```

- Display labels never serve as selection identity.
- Duplicate labels remain distinct occurrences through stable item IDs.
- The base and outcome retain one `transitionContextId` but have distinct
  recommendation fingerprints and snapshot IDs.
- `safetyFlags` and `severity` are both required; severity must equal the
  highest finalized flag.
- Catalog data cannot bypass semantic-equipment, cardinality, identity, safety,
  or target-survival checks.
- Store state is never persisted to browser storage and never falls back to the
  legacy raw-swap store.

## Typed Omission and Rejection

Failed candidate paths remain unavailable and preserve the base outfit.
Diagnostics include:

- `invalid-candidate-data`
- `candidate-source-identity-mismatch`
- `semantic-equipment-ineligible`
- `base-not-finalized`
- `source-identity-mismatch`
- `source-occurrence-ambiguous`
- `unknown-target`
- `target-semantic-equipment`
- `target-removed`
- `target-survival-ambiguous`
- `outcome-unsupported-cardinality`
- `outcome-invalid`
- `outcome-identity-mismatch`
- `target-outcome-mismatch`

Public builder request failures return deterministic `unavailable` /
`invalid-base-input`; public finalizer request failures return typed
`invalid-request`. Hostile selection option arrays return `invalid-options`
before any store mutation.

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

The locked age-0, awake-vogn, -30 C, wind 8 m/s fixture still contains 11
ordered semantic garments and remains `unsupported-cardinality` list-only
truth. No alternative action is exposed.

## Verification

| Gate | Result on reviewed candidate |
|---|---|
| Focused alternative/store/finalizer suite | 76/76 passed |
| Hostile alternative/severity checks, review A | 21/21 passed |
| Hostile selection Proxy checks, review A | 4/4 passed; session unchanged |
| Hostile alternative checks, review B | 23 passed |
| Hostile selection checks, review B | 4 passed |
| Inventory assertion | 2,036,160 scenarios and all locked metrics passed |
| Inventory Vitest | 2/2 passed |
| Full Vitest suite | 985 passed, 1 skipped, 9 todo |
| ESLint | Passed |
| Standalone application TypeScript check | Passed |
| TypeScript project build | Passed |
| Main and bare Vite builds | Passed |
| Plan 02-01 and documentation-base ancestry | Passed |
| Exact five-file scope | Passed |
| Package/lockfile immutability | Passed |
| Browser-storage and network absence | Passed |
| `git diff --check` and candidate cleanliness | Passed |

Detailed immutable bindings, reviewer receipts, commands, and scope evidence are
recorded in
[`evidence/02-02-INDEPENDENT-REVIEW.md`](evidence/02-02-INDEPENDENT-REVIEW.md).

## Independent Reviews

| Lane | Reviewer / session | Capability and focus | Verdict |
|---|---|---|---|
| A | `phase2-02-02-review-a-attempt3` / `/root/phase2_02_02_review_a_attempt3` | `high-verification`, occurrence/finalizer safety, fresh context | **PASS**, 0 findings |
| B | `phase2-02-02-review-b-attempt3` / `/root/phase2_02_02_review_b_attempt3`, label `attempt3-resumed` | `high-verification`, identity/state/privacy, fresh context | **PASS**, 0 findings |

Only these two completed attempt-3 results are receipts. An earlier incomplete
interim review output was not terminal, was not treated as PASS, and is not
counted toward the two-lane requirement.

## TDD and Repair Chain

The implementation candidate contains these ordered commits after documentation
base `0f8be9fba5ba639266d03b5e3590c96f6e91bbb1`:

1. `15cb6fd` - RED: specify finalized occurrence alternatives
2. `53b0e8c` - GREEN: finalize exact alternative outcomes
3. `cb75617` - RED: specify exact snapshot selection state
4. `994645e` - GREEN: bind selection to exact outfit snapshots
5. `5b681fc` - RED: reproduce dense-catalog and safety-completeness review gaps
6. `b5468df` - GREEN: fail closed on unsafe alternative inputs
7. `22be2bb` - RED: reproduce public, catalog, candidate, and store Proxy escapes
8. `ac20e97` - GREEN: contain hostile boundary Proxies

Every behavior change was preceded by a committed failing regression. The final
two repair cycles preserve the original occurrence/snapshot behavior while
closing independent-review findings.

## Review Repairs

### Auto-fixed Issues

**1. Catalog arrays and complete safety state required stricter validation**

- Dense default-prototype arrays are descriptor-snapshotted before values are
  read; sparse, accessor-backed, or custom-prototype arrays fail closed.
- A finalized recommendation must include exact `safetyFlags` and matching
  highest `severity`.
- Reproduced in `5b681fc`; repaired in `b5468df`.

**2. Reflective Proxy traps could escape public, catalog, candidate, or store
boundaries**

- Added outer typed containment for the builder and finalizer.
- Catalog entries and candidates must expose plain own enumerable data; any
  reflection failure maps to `invalid-candidate-data`.
- Store option validation catches revoked and trapping Proxies before `set`.
- Reproduced in `22be2bb`; repaired in `ac20e97`.

Both repairs remained inside the exact five-file Plan 02-02 boundary.

## Exact Five-File Scope

- `src/lib/outfit/finalized-outfit-swap.ts`
- `src/lib/outfit/alternative-options.ts`
- `src/lib/outfit/__tests__/alternative-options.test.ts`
- `src/state/outfit-selection-store.ts`
- `src/state/__tests__/outfit-selection-store.test.ts`

No legacy store, Motor threshold, package manifest, media, Hjem, Uke, or
Paakledning path changed.

## Cost, Dependencies, and Prohibited Actions

- External API/tool spend: **0**
- New or changed dependencies: **none**
- Browser persistence: **none**
- Network/API calls: **none**
- Media generation or capture: **none**
- Push, deployment, or release action: **none**
- Recommendation thresholds, guardrails, Motor V2, pricing, RevenueCat,
  analytics, family infrastructure, notifications, widgets, unrelated screens,
  legacy swap state, and avatar assets: **unchanged**

## Rollback

Treat the five implementation/test files as one Plan 02-02 contract. Revert
implementation commits from `ac20e97` through `15cb6fd` in reverse chronological
order, returning to documentation base
`0f8be9fba5ba639266d03b5e3590c96f6e91bbb1`, then rerun the inventory assertion,
focused suite, full suite, lint, TypeScript, builds, and diff/scope gates. Do not
retain the selection store without its exact option/finalizer boundary, and do
not fall back to the static catalog or legacy raw-swap store.

The documentation-only completion commit containing this summary and its
evidence file may be reverted independently.

## User Setup Required

None. No package, credential, environment, external service, persistence, or
data migration is required.

## Next Plan Readiness

- Plan 02-02 is complete with two independent exact-SHA PASS receipts.
- Its occurrence-safe alternative and ephemeral exact-selection contracts are
  ready for dependent later plans.
- No later plan, including Plan 02-04, was started by this completion work.

---

*Phase: 02-outfit-truth-antrekkskart*
*Plan: 02-02*
*Completed: 2026-07-24*
